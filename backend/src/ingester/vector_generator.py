import os
import uuid
import concurrent.futures
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter, Language
from langchain_community.embeddings import OllamaEmbeddings
from langchain_core.embeddings import Embeddings

class ParallelOllamaEmbeddings(Embeddings):
    def __init__(self):
        self.base_embedder = OllamaEmbeddings(
            model="nomic-embed-text", 
            base_url=os.environ.get("OLLAMA_URL", "http://localhost:11434")
        )
    def embed_documents(self, texts):
        print(f"Firing {len(texts)} concurrent requests to Ollama (max 15 threads)...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
            results = list(executor.map(self.base_embedder.embed_query, texts))
        return results
    def embed_query(self, text):
        return self.base_embedder.embed_query(text)

class VectorGenerator:
    def __init__(self, db_client):
        self.db = db_client

    def generate_vectors(self, repo_path, repo_id):
        print("Generating semantic vector embeddings for all files...")
        try:
            documents = []
            ignored_vector_dirs = {'node_modules', 'venv', '.venv', '__pycache__', '.pytest_cache', '.git', 'dist', 'build', '.next', 'coverage'}
            for root_dir, dirs, files in os.walk(repo_path):
                dirs[:] = [d for d in dirs if d not in ignored_vector_dirs and not d.startswith('.')]
                
                for file_name in files:
                    if file_name.startswith('.'):
                        continue
                    if not file_name.endswith(('.py', '.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml', '.md', '.go', '.rs', '.html', '.css')) and file_name not in ['.env', '.gitignore']:
                        continue
                        
                    file_path = os.path.join(root_dir, file_name)
                    relative_path = os.path.relpath(file_path, repo_path)
                    try:
                        loader = TextLoader(file_path, encoding='utf-8')
                        docs = loader.load()
                        for d in docs:
                            d.metadata["repo_id"] = repo_id
                            d.metadata["filepath"] = relative_path
                        documents.extend(docs)
                    except Exception:
                        pass
            
            print(f"Loaded {len(documents)} core text files for chunking.")
            if documents:
                python_splitter = RecursiveCharacterTextSplitter.from_language(language=Language.PYTHON, chunk_size=1000, chunk_overlap=200)
                js_splitter = RecursiveCharacterTextSplitter.from_language(language=Language.JS, chunk_size=1000, chunk_overlap=200)
                fallback_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
                
                chunks = []
                for doc in documents:
                    filepath = doc.metadata.get("filepath", "")
                    if filepath.endswith(".py"):
                        chunks.extend(python_splitter.split_documents([doc]))
                    elif filepath.endswith((".js", ".ts", ".jsx", ".tsx")):
                        chunks.extend(js_splitter.split_documents([doc]))
                    else:
                        chunks.extend(fallback_splitter.split_documents([doc]))
                        
                print(f"Created {len(chunks)} context-aware code chunks. Parallelizing requests to Ollama...")
                
                parallel_embeddings = ParallelOllamaEmbeddings()
                vectors = parallel_embeddings.embed_documents([c.page_content for c in chunks])
                
                print("Writing chunks directly to Neo4j with modern Cypher...")
                data = []
                for i, chunk in enumerate(chunks):
                    data.append({
                        "id": str(uuid.uuid4()),
                        "text": chunk.page_content,
                        "filepath": chunk.metadata.get("filepath", ""),
                        "repo_id": repo_id,
                        "embedding": vectors[i]
                    })
                    
                with self.db.driver.session() as session:
                    session.run("""
                        CREATE VECTOR INDEX chunk_vector IF NOT EXISTS 
                        FOR (c:Chunk) ON c.embedding 
                        OPTIONS {indexConfig: {`vector.dimensions`: 768, `vector.similarity_function`: 'cosine'}}
                    """)
                    
                    session.run("""
                        UNWIND $data AS row
                        MERGE (c:Chunk {id: row.id})
                        SET c.text = row.text,
                            c.filepath = row.filepath,
                            c.repo_id = row.repo_id
                        WITH c, row
                        CALL db.create.setNodeVectorProperty(c, 'embedding', row.embedding)
                    """, data=data)
                    
                print("Vector embeddings successfully ingested into Neo4j!")
        except Exception as e:
            print(f"Failed to generate vector embeddings: {e}")
