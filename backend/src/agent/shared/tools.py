import os
from langchain.tools import tool
from typing import Optional
from ...db.neo4j_client import Neo4jClient
from langchain_community.vectorstores.neo4j_vector import Neo4jVector
from langchain_community.embeddings import OllamaEmbeddings

# We will initialize this globally or dynamically per repo.
db_client = None

def get_db():
    global db_client
    if not db_client:
        db_client = Neo4jClient()
    return db_client

@tool
def query_graph(cypher_query: str, project_id: str = None) -> str:
    """
    Executes a Cypher query against the Neo4j semantic graph to find hard dependencies.
    You are in a Multi-Repo environment! You can trace blast radius across different microservices by traversing [:CROSS_REPO_LINK] edges between Files.
    To filter by the current project, use: MATCH (p:Project {id: $project_id})-[:HAS_REPO]->(r:Repository)-[:HAS_ROOT|CONTAINS*]->(f:File)
    """
    db = get_db()
    try:
        with db.driver.session() as session:
            result = session.run(cypher_query, project_id=project_id)
            records = [record.data() for record in result]
            if not records:
                return "No results found."
            
            records = records[:100]
            output = str(records)
            output = output.replace(f"/tmp/repos/", "")
            
            if len(output) > 8000:
                output = output[:8000] + "... [TRUNCATED DUE TO LENGTH. REFINE YOUR CYPHER QUERY IF YOU NEED MORE]"
                
            return output
    except Exception as e:
        return f"Error executing Cypher query: {e}"

@tool
def read_source_file(file_path: str, repo_id: str, start_line: Optional[int] = None, end_line: Optional[int] = None) -> str:
    """
    Reads the content of a specific source code file from the filesystem.
    You MUST provide both 'file_path' (the relative path, e.g. 'frontend/src/app.js') and the 'repo_id'.
    For enterprise repos, ALWAYS use 'start_line' and 'end_line' if you know where the function is located to avoid blowing up your context window.
    """
    # Clean leading slashes and any absolute prefix so os.path.join reliably anchors to repo dir
    clean_path = file_path.replace(f"/tmp/repos/{repo_id}/", "").replace(f"/tmp/repos/{repo_id}", "").lstrip("/")
    abs_path = os.path.join(f"/tmp/repos/{repo_id}", clean_path)
    
    if not os.path.exists(abs_path):
        return f"Error: File not found at {file_path}"
    
    try:
        with open(abs_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
            if start_line is not None and end_line is not None:
                start_idx = max(0, start_line - 1)
                end_idx = min(len(lines), end_line)
                lines = lines[start_idx:end_idx]
            elif start_line is not None:
                start_idx = max(0, start_line - 1)
                lines = lines[start_idx:start_idx+100]
                
            content = "".join(lines)
            if len(content) > 6000:
                return content[:6000] + "\n\n... [FILE CHUNK TRUNCATED. USE START/END LINES TO SLICE TIGHTER]"
            return content
    except Exception as e:
        return f"Error reading file: {e}"

@tool
def get_repo_schema() -> str:
    """
    Returns the schema of the Neo4j semantic graph.
    Use this to understand what nodes and edges are available for your cypher_query.
    """
    return """
    Nodes:
    - Directory {path: str, name: str, repo_id: str}
    - File {path: str, name: str, repo_id: str, content: str}
    - Function {name: str, id: str, full_moniker: str, repo_id: str}
    - Class {name: str, id: str, repo_id: str}
    - Variable {name: str, id: str, repo_id: str}

    Edges:
    - (Directory)-[:CONTAINS]->(File)
    - (Directory)-[:CONTAINS]->(Directory)
    - (File)-[:REFERENCES]->(Function|Class|Variable)   <-- Use this to find Blast Radius!
    - (File)-[:CROSS_REPO_LINK {method: str, confidence: float}]-(File) <-- Cross-Repo Architecture Map!
    """

@tool
def semantic_search(query_string: str, project_id: str = None) -> str:
    """
    Searches the Semantic Vector Index for raw text strings, configuration properties, or framework definitions that the explicit AST graph might have missed.
    You MUST use this tool to catch dynamic framework magic and string references.
    Results are deduplicated by file — each file appears ONCE with its most relevant content chunk.
    """
    try:
        embeddings = OllamaEmbeddings(
            model="nomic-embed-text", 
            base_url=os.environ.get("OLLAMA_URL", "http://localhost:11434")
        )
        
        vector_store = Neo4jVector.from_existing_index(
            embedding=embeddings,
            url=os.environ.get("NEO4J_URI", "bolt://localhost:7687"),
            username=os.environ.get("NEO4J_USER", "neo4j"),
            password=os.environ.get("NEO4J_PASSWORD", "production_password"),
            index_name="chunk_vector",
            node_label="Chunk",
            text_node_property="text",
            embedding_node_property="embedding",
        )
        
        # Fetch large candidate pool then deduplicate — each file appears exactly once
        raw_results = vector_store.max_marginal_relevance_search(query_string, k=10, fetch_k=20)
        
        seen_files = {}
        for doc in raw_results:
            fp = doc.metadata.get("filepath", "")
            if fp and fp not in seen_files:
                seen_files[fp] = doc
        results = list(seen_files.values())
        
        if not results:
            return "No semantic matches found."
            
        output = ""
        for i, doc in enumerate(results):
            filepath = doc.metadata.get("filepath", "Unknown")
            repo = doc.metadata.get("repo_id", "Unknown")
            output += f"\n--- Result {i+1} (Repo: {repo}, File: {filepath}) ---\n{doc.page_content}\n"
            
        if len(output) > 3000:
            output = output[:3000] + "\n... [TRUNCATED]"
            
        return output
    except Exception as e:
        return f"Semantic search error: {e}. The index might be building."

@tool
def search_by_strings(search_terms: list[str], project_id: str = None) -> str:
    """
    Searches ALL ingested code chunks for a list of LITERAL string terms using a full-text index.
    Use this to find files containing specific env variable names, API paths, config keys,
    service names, or any hardcoded string reference in ONE call.
    Results are returned if a file matches ANY of the terms.
    Language-agnostic: works across Python, JS, Go, YAML, Dockerfiles, .env, proto files.
    Examples: search_by_strings(["SSO_CLIENT_ID", "okta_url", "/auth/callback"])
    """
    db = get_db()
    try:
        with db.driver.session() as session:
            session.run("""
                CREATE FULLTEXT INDEX chunk_text IF NOT EXISTS
                FOR (c:Chunk) ON EACH [c.text]
            """)

            query_parts = []
            for term in search_terms:
                if ' ' in term or '/' in term or '_' in term:
                    query_parts.append('"' + term.replace('"', '').replace('/', ' ').replace('_', ' ') + '"')
                else:
                    query_parts.append(term.replace('"', '\\"'))
            escaped = " OR ".join(query_parts)

            result = session.run("""
                CALL db.index.fulltext.queryNodes('chunk_text', $term)
                YIELD node, score
                WHERE score > 1.5
                RETURN node.filepath AS filepath, node.repo_id AS repo_id, node.text AS text, score
                ORDER BY score DESC
                LIMIT 100
            """, term=escaped)
            records = [r.data() for r in result]

            if not records:
                return f"No files found containing any of {search_terms}."

            seen = {}
            for r in records:
                fp = r.get("filepath", "")
                if fp and fp not in seen:
                    seen[fp] = r

            output = f"Files containing terms {search_terms}:\n"
            for i, r in enumerate(seen.values()):
                output += "  - [" + r["repo_id"] + "] " + r["filepath"] + f" (relevance: {round(r['score'], 3)})\n"
                
                # Only include heavy snippets for the top 15 results to save tokens
                if i < 15:
                    text = str(r.get("text", "")).replace("\n", " ")
                    idx = -1
                    matched_term = search_terms[0]
                    for term in search_terms:
                        idx = text.lower().find(term.lower())
                        if idx != -1:
                            matched_term = term
                            break
                            
                    if idx == -1:
                        snippet = text[:100] + "..."
                    else:
                        start = max(0, idx - 50)
                        end = min(len(text), idx + len(matched_term) + 50)
                        snippet = ("..." if start > 0 else "") + text[start:end] + ("..." if end < len(text) else "")
                    output += f"    Snippet: {snippet}\n"
            return output
    except Exception as e:
        return "String search error: " + str(e)

import json

@tool
def analyze_infrastructure_impact(file_paths: list[str]) -> str:
    """
    Queries Neo4j to find the full infrastructure impact of the modified files across ALL repos.
    Checks for: Database Models, Environment Variables, Docker/Port bindings.
    """
    db = get_db()
    results = {"database_models": [], "env_vars": [], "docker_impact": []}
    
    with db.driver.session() as session:
        for path in file_paths:
            clean_p = path.lstrip("/")
            # 1. Database models & entities
            db_query = """
            MATCH (f:File)-[:DEFINES]->(c:Class)
            WHERE (f.relative_path = $path OR f.path = $path OR f.path ENDS WITH $path)
              AND (c.name CONTAINS 'Model' OR c.name CONTAINS 'Table' OR c.name CONTAINS 'Base' OR c.name CONTAINS 'Schema')
            RETURN c.name AS model_name, f.repo_id AS repo, f.name AS file
            """
            results["database_models"].extend(session.run(db_query, path=clean_p).data())
            
            # 2. Environment variable references
            env_query = """
            MATCH (f:File)-[:CALLS|DEFINES]->(s:Symbol)
            WHERE (f.relative_path = $path OR f.path = $path OR f.path ENDS WITH $path)
              AND (s.name CONTAINS 'getenv' OR s.name CONTAINS 'environ' OR s.name CONTAINS 'env' OR s.name CONTAINS 'Settings')
            RETURN s.name AS env_reference, f.repo_id AS repo, f.name AS file
            """
            results["env_vars"].extend(session.run(env_query, path=clean_p).data())
            
            # 3. Docker, Compose, or deployment config impact
            docker_query = """
            MATCH (f:File)
            WHERE (f.relative_path = $path OR f.path = $path OR f.path ENDS WITH $path)
              AND (f.name CONTAINS 'Dockerfile' OR f.name CONTAINS 'docker-compose' OR f.name CONTAINS 'nginx')
            RETURN f.name AS config_file, f.repo_id AS repo
            """
            results["docker_impact"].extend(session.run(docker_query, path=clean_p).data())
                
    if not any(results.values()):
        return "No infrastructure impact detected."
    return json.dumps(results, indent=2)

@tool
def get_upstream_callers(function_names: list[str]) -> str:
    """
    Queries Neo4j graph for cross-repo upstream callers.
    """
    db = get_db()
    results = []
    with db.driver.session() as session:
        for func in function_names:
            query = """
            MATCH (caller)-[:CALLS|CROSS_REPO_LINK]->(f)
            WHERE (f:Function OR f:Class OR f:Symbol) AND f.name = $func
            RETURN caller.name AS caller_name, caller.repo_id AS repo
            """
            callers = session.run(query, func=func).data()
            if callers:
                results.append({"function": func, "called_by": callers})
    if not results:
        return "No upstream callers found."
    return json.dumps(results, indent=2)

@tool
def check_contract_breach(function_names: list[str]) -> str:
    """
    Checks Neo4j for cross-repo downstream dependents to ensure API contracts aren't broken.
    """
    db = get_db()
    results = []
    with db.driver.session() as session:
        for func in function_names:
            query = """
            MATCH (dependent)-[:CALLS|CROSS_REPO_LINK]->(f)
            WHERE (f:Function OR f:Class OR f:Symbol) AND f.name = $func
            RETURN dependent.name AS dependent_name, dependent.path AS path, dependent.repo_id AS repo
            """
            dependents = session.run(query, func=func).data()
            if dependents:
                results.append({"modified_function": func, "breakage_risk_dependents": dependents})
    if not results:
        return "No downstream dependencies found. Safe to modify signatures."
    return json.dumps(results, indent=2)
