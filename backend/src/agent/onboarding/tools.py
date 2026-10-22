import os
import glob
from langchain.tools import tool
from pydantic import BaseModel, Field
from typing import List

@tool
def generate_directory_tree(repo_id: str) -> str:
    """
    Generates a recursive directory tree of the repository. Use this in the Reconnaissance phase to understand the architectural structure of the codebase.
    """
    from ..shared.tools import get_db
    db = get_db()
    with db.driver.session() as session:
        result = session.run("MATCH (r:Repository) WHERE r.id = $id OR r.name = $id RETURN r.id LIMIT 1", id=repo_id)
        record = result.single()
        if record:
            repo_id = record["r.id"]
            
    repo_path = f"/tmp/repos/{repo_id}"
    if not os.path.exists(repo_path):
        return f"Repository not found locally at {repo_path}."
        
    tree_str = f"Directory Tree for {repo_id}:\n"
    
    # We will do a simple os.walk, ignoring common noisy directories
    ignore_dirs = {'.git', 'node_modules', 'venv', '__pycache__', 'dist', 'build', '.idea', '.vscode'}
    
    for root, dirs, files in os.walk(repo_path):
        # Modify dirs in-place to prune ignored directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        level = root.replace(repo_path, '').count(os.sep)
        indent = ' ' * 4 * (level)
        tree_str += f"{indent}{os.path.basename(root)}/\n"
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            # Skip massive LSIF/SCIP dumps for the tree view
            if f.endswith('.lsif') or f.endswith('.scip') or f == 'scip':
                continue
            tree_str += f"{subindent}{f}\n"
            
    if len(tree_str) > 8000:
        return tree_str[:8000] + "\n... [TREE TRUNCATED DUE TO SIZE]"
        
    return tree_str

class OnboardingStep(BaseModel):
    title: str = Field(description="Step title (e.g., 'Install Dependencies')")
    command: str = Field(description="Terminal command if applicable, else empty")
    description: str = Field(description="Brief explanation of this step")

class CoreFile(BaseModel):
    filepath: str = Field(description="Path to the file")
    importance: str = Field(description="Why this file is important and what it does")

class OnboardingGuideInput(BaseModel):
    repo_purpose: str = Field(description="Detailed summary of what this microservice does and its role in the ecosystem")
    primary_language: str = Field(description="Primary programming language/framework")
    key_dependencies: List[str] = Field(description="List of major libraries or connected services")
    setup_steps: List[OnboardingStep] = Field(description="List of steps to get running locally")
    architecture_patterns: List[str] = Field(description="List of design patterns used (e.g., MVC, Repository Pattern, Event-Driven)")
    core_files_to_read: List[CoreFile] = Field(description="Top 3-5 most critical files a new dev MUST read to understand the app")
    common_gotchas: List[str] = Field(description="List of common pitfalls, confusing logic, or things to watch out for")
    architecture_diagrams: List[str] = Field(description="List of Mermaid.js architecture diagrams (e.g., 'graph TD...'). Generate one or more diagrams illustrating the system. CRITICAL: Do NOT use brackets in subgraph declarations, and wrap any node labels with special characters in double quotes!")

@tool("generate_onboarding_guide", args_schema=OnboardingGuideInput)
def generate_onboarding_guide(**kwargs) -> str:
    """
    Generates a structured Onboarding Guide artifact UI.
    Call this EXACTLY ONCE when you have gathered enough context to welcome a new developer. After calling this, you MUST conclude your response and not call any more tools.
    """
    return "Onboarding guide generated in the UI. Conclude your response."


