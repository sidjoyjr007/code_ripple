import os
import subprocess

# Generic configuration map for SCIP language indexers
SCIP_TOOLCHAINS = {
    "javascript": {
        "extensions": (".js", ".ts", ".jsx", ".tsx"),
        "docker_image": "node:20",
        "pre_install": "apt-get update && apt-get install -y curl",
        "deps_install": "(npm install --ignore-scripts --legacy-peer-deps 2>/dev/null || yarn install --ignore-scripts 2>/dev/null || true)",
        "indexer_install": "npm install -g @sourcegraph/scip-typescript",
        "index_command": "scip-typescript index",
        "output_file": "js_index.scip",
        "deps_files": ["package.json", "yarn.lock", "pnpm-lock.yaml"]
    },
    "python": {
        "extensions": (".py",),
        "docker_image": "node:20",
        "pre_install": "apt-get update && apt-get install -y python3 python3-pip python3-venv curl build-essential",
        "deps_install": "(pip3 install --prefer-binary --break-system-packages -r requirements.txt 2>/dev/null || pip3 install -r requirements.txt 2>/dev/null || true)",
        "indexer_install": "npm install -g @sourcegraph/scip-python",
        "index_command": "scip-python index",
        "output_file": "py_index.scip",
        "deps_files": ["requirements.txt", "Pipfile", "pyproject.toml"]
    },
    "go": {
        "extensions": (".go",),
        "docker_image": "golang:1.21",
        "pre_install": "apt-get update",
        "deps_install": "go mod download || true",
        "indexer_install": "go install github.com/sourcegraph/scip-go/cmd/scip-go@latest",
        "index_command": "scip-go",
        "output_file": "go_index.scip",
        "deps_files": ["go.mod"]
    },
    "rust": {
        "extensions": (".rs",),
        "docker_image": "rust:1.75",
        "pre_install": "apt-get update && apt-get install -y curl",
        "deps_install": "cargo fetch || true",
        "indexer_install": "cargo install rust-analyzer",
        "index_command": "rust-analyzer scip .",
        "output_file": "rust_index.scip",
        "deps_files": ["Cargo.toml"]
    }
}

class SCIPGenerator:
    def _detect_languages(self, repo_path):
        """Scans the repository to figure out which toolchains are needed."""
        detected = set()
        ignored_scan = {'node_modules', 'venv', '.venv', '__pycache__', '.git', 'dist', 'build', '.next'}
        for root_dir, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in ignored_scan and not d.startswith('.')]
            
            for file_name in files:
                for lang, config in SCIP_TOOLCHAINS.items():
                    if file_name.endswith(config["extensions"]):
                        detected.add(lang)
                        
            if len(detected) == len(SCIP_TOOLCHAINS):
                break
                
        return detected

    def generate_scip_indexes(self, repo_path):
        print(f"Analyzing file extensions in {repo_path} to determine toolchains...")
        detected_langs = self._detect_languages(repo_path)
        
        for lang in detected_langs:
            config = SCIP_TOOLCHAINS[lang]
            target_output = os.path.join(repo_path, config["output_file"])
            
            # GENERIC FIX 1: Check for the language-specific output file, not a hardcoded 'index.scip'
            if os.path.exists(target_output):
                print(f"{config['output_file']} already exists, skipping {lang} generation.")
                continue
                
            print(f"{lang.capitalize()} files detected. Spinning up {config['docker_image']} Docker sandbox for SCIP...")
            
            try:
                # GENERIC FIX 2: Check multiple possible dependency files (yarn vs npm, Pipfile vs requirements)
                has_deps = False
                if "deps_files" in config:
                    has_deps = any(os.path.exists(os.path.join(repo_path, df)) for df in config["deps_files"])
                
                # GENERIC FIX 3: Build the bash command robustly without trailing '&&' if a step is empty
                cmd_steps = []
                if config.get("pre_install"):
                    cmd_steps.append(config["pre_install"])
                if has_deps and config.get("deps_install"):
                    cmd_steps.append(config["deps_install"])
                if config.get("indexer_install"):
                    cmd_steps.append(config["indexer_install"])
                if config.get("index_command"):
                    cmd_steps.append(config["index_command"])
                
                cmd_steps.append(f"mv index.scip {config['output_file']}")
                
                full_cmd = " && ".join(cmd_steps)

                subprocess.run([
                    "docker", "run", "--rm", 
                    "-v", f"{repo_path}:/app", 
                    "-w", "/app", 
                    config["docker_image"], 
                    "/bin/bash", "-c", full_cmd
                ], check=True, timeout=600)
                
            except Exception as e:
                print(f"{lang.capitalize()} SCIP generation failed: {e}")
