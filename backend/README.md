# Backend: Codebase to Neo4j Knowledge Graph

This backend service ingests software repositories and constructs a semantic knowledge graph in Neo4j using universal AST parsing (via Tree-sitter).

## Architecture

This project is built with a production-ready, modular architecture:

*   **`docker-compose.yml`**: Spins up the Neo4j Graph Database (with APOC plugins).
*   **`src/db/`**: Handles Neo4j database connections, schema management, and Cypher queries.
*   **`src/parser/`**: Contains the `UniversalParser`, utilizing Tree-sitter and language-specific grammars to extract generic structures (Classes, Functions, Methods) from any language.
*   **`src/ingester/`**: Orchestrates the pipeline—traversing file systems, coordinating parsing, and batch-uploading to the database.

## Prerequisites

*   Docker and Docker Compose
*   Python 3.10+

## Setup Instructions

1. **Start the Database**
   ```bash
   docker-compose up -d
   ```
   *Neo4j will be available at `http://localhost:7474` (default credentials: `neo4j` / `production_password`).*

2. **Install Python Dependencies**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Run the Ingester**
   ```bash
   python -m src.main
   ```

## Design Principles

*   **Language Agnostic**: Built to support Python, JavaScript, Go, and more by dynamically mapping AST nodes.
*   **Scalable**: Schema utilizes unique constraints and `MERGE` statements optimized for batch insertion.
