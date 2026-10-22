from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import dotenv
from .routers import repos, graph, agent, projects

dotenv.load_dotenv()

app = FastAPI(title="Code Ripple - Multi-Repo Codebase Knowledge Graph API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow frontend to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api")
app.include_router(repos.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(agent.router, prefix="/api")
