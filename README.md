# Code Ripple ⚡

> An AI-powered code change impact analysis platform. Understand the blast radius of any code change across your entire codebase — before you merge.

## What it does

Code Ripple ingests your repositories into a Neo4j knowledge graph enriched with semantic vector embeddings, then runs a multi-agent pipeline to:

- **Trace call graphs** — find every upstream caller of a changed function
- **Detect contract breaches** — spot API signature changes before they break consumers
- **Assess infrastructure impact** — surface env vars, DB models and Docker configs touched by a change
- **Cross-repo linking** — connect related files across microservices via semantic similarity

## Architecture

```
frontend/          React + Vite UI
backend/
  src/
    api/           FastAPI REST endpoints
    agent/         LangGraph supervisor + specialist agents
    ingester/      Repository ingestion pipeline
      graph_builder.py     Neo4j directory/file graph
      scip_generator.py    SCIP index generation (Docker)
      scip_parser.py       Symbol extraction → Neo4j
      vector_generator.py  Ollama embeddings → Neo4j
      cross_repo_linker.py Cosine ANN cross-repo edges
    parser/        SCIP protobuf parser
    db/            Neo4j client + schema
```

## Stack

| Layer | Tech |
|-------|------|
| Graph DB | Neo4j (with vector index) |
| Embeddings | Ollama `nomic-embed-text` (local) |
| LLM | Gemini 2.5 Flash / Claude Sonnet |
| Agent framework | LangGraph |
| Backend | FastAPI + Python 3.13 |
| Frontend | React + Vite + Tailwind |

## Getting Started

### Prerequisites

- Python 3.11+
- Node 18+
- Neo4j 5.x running locally (or via Docker)
- Ollama running locally with `nomic-embed-text` pulled

### Backend

```bash
cd backend
cp .env.example .env        # fill in your keys
pip install -r requirements.txt
uvicorn src.api.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Ingesting a Repository

Use the `/api/ingest` endpoint (or the UI) to point Code Ripple at a GitHub repo URL. The pipeline will:

1. Clone the repo
2. Generate a SCIP index
3. Build the Neo4j graph
4. Generate vector embeddings
5. Link cross-repo relationships

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for all required variables. **Never commit `.env`.**
