import os
from langchain.tools import tool
from pydantic import BaseModel, Field
from typing import List

class SDLCPhase(BaseModel):
    phase: str = Field(description="SDLC Phase (e.g., 'Planning', 'Implementation', 'Testing', 'Deployment')")
    days: float = Field(description="Estimated days of effort")
    complexity: str = Field(description="'Low', 'Medium', 'High', or 'Critical'")

class RadarMetric(BaseModel):
    category: str = Field(description="e.g., 'Security Risk', 'Performance Impact', 'Data Migration', 'Tech Debt', 'Operational Risk'")
    score: int = Field(description="1-100 score where higher means more dangerous/complex")

class ImpactedFile(BaseModel):
    filepath: str = Field(description="The path to the impacted file")
    reason: str = Field(description="A 1-2 sentence explanation of exactly why this file needs to change and what must be modified")

class DashboardUpdateInput(BaseModel):
    executive_summary: str = Field(description="A high-level executive summary of the architectural impact")
    overall_risk_score: int = Field(description="Overall aggregate danger score 1-100")
    files_impacted_by_repo: dict[str, List[ImpactedFile]] = Field(description="A dictionary mapping repository names/IDs to a list of strictly verified impacted files and the reason for the change.")
    sdlc_phases: List[SDLCPhase] = Field(description="Breakdown of effort and complexity across the SDLC")
    risk_radar: List[RadarMetric] = Field(description="Exactly 5 dimensions of risk scored 1-100 for a radar chart (e.g., Security, Performance, Database, UI/UX, Maintenance)")
    database_migrations: bool = Field(description="True if database schema changes are required")
    downtime_risk: str = Field(description="Level of downtime risk during deployment")
    action_items: List[str] = Field(description="Concrete engineering next steps")

@tool("update_impact_dashboard", args_schema=DashboardUpdateInput)
def update_impact_dashboard(**kwargs) -> str:
    """
    Updates the Manager Dashboard with structured metadata about the architectural blast radius.
    ALWAYS call this tool if you are discussing the implications of a change so the visual UI is updated.
    
    Args:
        executive_summary: A 1-2 sentence executive summary of the impact.
        overall_risk_score: Integer from 1 to 100 representing the danger of the change.
        files_impacted_by_repo: Dictionary mapping repo names/IDs to a list of dicts. Format: {"cr-backend": [{"filepath": "/backend/main.py", "reason": "Requires new routes for SSO"}]}. Only include explicitly confirmed files.
        sdlc_phases: A list of dicts. Format: [{"phase": "Planning", "days": 2.5, "complexity": "Low"}]
        risk_radar: Exactly 5 metrics scored 1-100. Format: [{"category": "Security", "score": 85}]
        database_migrations: True if DB schema changes are required, False otherwise.
        downtime_risk: 'None', 'Low', 'Moderate', or 'High'
        action_items: A list of 3-5 concrete steps the engineering team must take next.
    """
    return "Dashboard updated successfully. You have finished your research. Now generate a final conversational text response to the user explaining the blast radius."

@tool
def analyze_full_blast_radius(filepaths: list[str], project_id: str, symbol_name: str = None) -> str:
    """
    The Omni-Query Tool. Analyzes the full architectural blast radius in a single shot.
    It combines Downstream Dependents, Upstream Dependencies, DB Schema Implications, Cross-Repo API Contracts, 
    Pipeline Impact, and Test Suite Implications.
    
    Args:
        filepaths: A list of core file paths that are changing (e.g., ['auth.py', 'dependencies.py']).
        project_id: The ID of the multi-repo project context.
        symbol_name: Optional. If you know the exact function/class changing (e.g. 'verify_token'), provide it.
    """
    import concurrent.futures
    from ..shared.tools import get_db
    db = get_db()
    
    def run_query(query: str, params: dict):
        with db.driver.session() as session:
            result = session.run(query, **params)
            return [record.data() for record in result]
            
    output = "====== OMNI-QUERY ARCHITECTURAL BLAST RADIUS ======\n\n"
    
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=7) as executor:
            futures = {}
            
            if symbol_name:
                q = """
                MATCH (r:Repository)-[:HAS_ROOT|CONTAINS*]->(f:File)-[rel]->(s)
                WHERE (s.name CONTAINS $symbol_name OR s.full_moniker CONTAINS $symbol_name)
                  AND type(rel) IN ['IMPORTS', 'EXTENDS', 'CALLS', 'REFERENCES']
                RETURN DISTINCT r.name AS repo, f.path AS path, type(rel) AS edge_type
                LIMIT 100
                """
                futures['downstream_symbol'] = executor.submit(run_query, q, {"symbol_name": symbol_name})
                
            if filepaths:
                q_down = """
                MATCH (target:File)
                WHERE any(path IN $filepaths WHERE target.path ENDS WITH path)
                MATCH (target)-[:DEFINES]->(s)<-[rel]-(f:File)<-[:HAS_ROOT|CONTAINS*]-(r:Repository)
                WHERE type(rel) IN ['IMPORTS', 'EXTENDS', 'CALLS', 'REFERENCES']
                RETURN DISTINCT r.name AS repo, f.path AS path, type(rel) AS edge_type, s.name AS symbol, target.path as source
                LIMIT 100
                """
                futures['downstream_file'] = executor.submit(run_query, q_down, {"filepaths": filepaths})
                
                q_up = """
                MATCH (target:File)
                WHERE any(path IN $filepaths WHERE target.path ENDS WITH path)
                MATCH (target)-[rel]->(s)<-[:DEFINES]-(upstream:File)
                WHERE type(rel) IN ['IMPORTS', 'EXTENDS', 'CALLS', 'REFERENCES']
                RETURN DISTINCT target.path AS source, type(rel) AS edge_type, s.name AS symbol, upstream.path AS up
                LIMIT 100
                """
                futures['upstream'] = executor.submit(run_query, q_up, {"filepaths": filepaths})
                
                q_db = """
                MATCH (target:File)
                WHERE any(path IN $filepaths WHERE target.path ENDS WITH path)
                MATCH (target)-[:DEFINES]->(s)-[rel]->(base)
                WHERE type(rel) IN ['INHERITS', 'EXTENDS', 'REFERENCES']
                  AND (base.name IN ['Model', 'BaseModel', 'Table', 'Entity'] OR s.name CONTAINS 'Model')
                RETURN DISTINCT target.path AS path, s.name AS model
                LIMIT 100
                """
                futures['db'] = executor.submit(run_query, q_db, {"filepaths": filepaths})
                
                q_test = """
                MATCH (target:File)
                WHERE any(path IN $filepaths WHERE target.path ENDS WITH path)
                MATCH (test:File)-[rel]->(s)<-[:DEFINES]-(target)
                WHERE type(rel) IN ['IMPORTS', 'CALLS', 'EXTENDS', 'REFERENCES']
                  AND (test.path CONTAINS 'test' OR test.path CONTAINS 'spec' OR test.name CONTAINS 'test')
                RETURN DISTINCT target.path AS target, test.path AS test
                LIMIT 100
                """
                futures['test'] = executor.submit(run_query, q_test, {"filepaths": filepaths})
                
            q_cross = """
            MATCH (p:Project {id: $project_id})-[:HAS_REPO]->(r1:Repository)-[:HAS_ROOT|CONTAINS*]->(f1:File)-[link:CROSS_REPO_LINK]-(f2:File)<-[:HAS_ROOT|CONTAINS*]-(r2:Repository)<-[:HAS_REPO]-(p)
            WHERE r1.id <> r2.id
            RETURN DISTINCT r1.name AS r1, f1.path AS f1, link.method AS method, r2.name AS r2, f2.path AS f2
            LIMIT 100
            """
            futures['cross_repo'] = executor.submit(run_query, q_cross, {"project_id": project_id})
            
            q_pipe = """
            MATCH (p:Project {id: $project_id})-[:HAS_REPO]->(r:Repository)-[:HAS_ROOT|CONTAINS*]->(f:File)
            WHERE f.path CONTAINS '.github/workflows' OR f.path CONTAINS 'gitlab-ci' OR f.path CONTAINS 'Jenkins' OR f.path CONTAINS 'docker-compose' OR f.path CONTAINS 'deploy'
            RETURN DISTINCT r.name AS repo, f.path AS path
            LIMIT 100
            """
            futures['pipeline'] = executor.submit(run_query, q_pipe, {"project_id": project_id})
            
            concurrent.futures.wait(futures.values())
            
            # Assemble output
            if 'downstream_symbol' in futures:
                output += f"--- 1. DOWNSTREAM DEPENDENTS (Symbol: {symbol_name}) ---\n"
                records = futures['downstream_symbol'].result()
                if records:
                    for r in records:
                        output += f"[{r['repo']}] {r['path']} ({r['edge_type']})\n"
                else:
                    output += "None found.\n"
                    
            if filepaths:
                output += f"\n--- 1. DOWNSTREAM DEPENDENTS (Files: {filepaths}) ---\n"
                for r in futures['downstream_file'].result():
                    output += f"[{r['repo']}] {r['path']} uses {r['symbol']} from {r['source']}\n"
                    
                output += f"\n--- 2. UPSTREAM DEPENDENCIES (Configs/Utilities) ---\n"
                for r in futures['upstream'].result():
                    output += f"{r['source']} imports {r['symbol']} from {r['up']}\n"
                    
                output += f"\n--- 3. DATABASE SCHEMA IMPLICATIONS ---\n"
                db_found = False
                for r in futures['db'].result():
                    db_found = True
                    output += f"WARNING: Model {r['model']} in {r['path']} is modified.\n"
                if not db_found:
                    output += "No direct schema modifications detected.\n"
                    
                output += f"\n--- 4. TEST SUITE IMPLICATIONS ---\n"
                for r in futures['test'].result():
                    output += f"{r['test']} tests {r['target']}\n"
                    
            output += f"\n--- 5. CROSS-REPO API CONTRACTS ---\n"
            for r in futures['cross_repo'].result():
                output += f"[{r['r1']}] {r['f1']} --({r['method']})--> [{r['r2']}] {r['f2']}\n"
                
            output += f"\n--- 6. CI/CD PIPELINE IMPACT ---\n"
            for r in futures['pipeline'].result():
                output += f"[{r['repo']}] {r['path']}\n"
                
        return output
    except Exception as e:
        return f"Error executing omni-query: {e}"

@tool
def get_file_ast_summary(filepath: str) -> str:
    """
    Fetches the AST skeleton (Functions, Classes, Variables) defined in a specific file directly from Neo4j.
    Use this INSTEAD of read_source_file to understand what is inside a file using only ~100 tokens.
    """
    from ..shared.tools import get_db
    db = get_db()
    
    query = """
    MATCH (f:File)-[:DEFINES]->(s)
    WHERE f.path ENDS WITH $filepath
    RETURN labels(s) AS type, s.name AS name, s.full_moniker AS moniker
    ORDER BY type, name
    """
    try:
        with db.driver.session() as session:
            result = session.run(query, filepath=filepath)
            records = [record.data() for record in result]
            if not records:
                return f"No AST symbols found for {filepath} in Neo4j."
            
            output = f"AST Summary for {filepath}:\n"
            for r in records:
                t = r['type'][0] if r['type'] else "Symbol"
                output += f" - [{t}] {r.get('moniker', r['name'])}\n"
            return output
    except Exception as e:
        return f"Error fetching AST summary: {e}"
