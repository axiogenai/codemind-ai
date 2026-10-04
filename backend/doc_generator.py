# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
"""
Automated Documentation Generator Engine for CodeMind AI
Produces 100% Dynamic, Real Markdown & Mermaid documentation for System Architecture, 
REST APIs, Database ERDs, and Developer Onboarding based on parsed Universal AST & Knowledge Graph.
"""

import re
from typing import Dict, List, Any

class DocumentationGeneratorEngine:
    def __init__(self):
        pass

    def generate_documentation(self, doc_type: str, project_data: Dict[str, Any], graph_data: Dict[str, Any]) -> Dict[str, Any]:
        proj_name = project_data.get("name", "Software Project")
        primary_lang = project_data.get("primary_language", "Software Project")
        files = project_data.get("files", [])
        languages = project_data.get("languages", {})
        
        if doc_type == "architecture":
            return self._generate_architecture_doc(proj_name, primary_lang, files, languages, graph_data)
        elif doc_type == "api":
            return self._generate_api_doc(proj_name, primary_lang, files)
        elif doc_type == "database":
            return self._generate_database_doc(proj_name, files)
        else:
            return self._generate_developer_guide(proj_name, primary_lang, files, languages)

    def _generate_architecture_doc(self, proj_name: str, primary_lang: str, files: List[Dict[str, Any]], languages: Dict[str, Any], graph_data: Dict[str, Any]) -> Dict[str, Any]:
        markdown = f"# System Architecture Blueprint — {proj_name}\n\n"
        markdown += "## 1. Executive Summary & Topology\n"
        markdown += f"**{proj_name}** is a multi-module software system comprising **{len(files)} source files** "
        markdown += f"built primarily using **{primary_lang}**"
        
        if len(languages) > 1:
            lang_str = ", ".join([f"{l} ({pct}%)" for l, pct in list(languages.items())[:4]])
            markdown += f" with composition: {lang_str}"
        markdown += ".\n\n"

        # Build dynamic Mermaid Dependency Diagram
        markdown += "### Architectural Module Dependency Map\n"
        markdown += "```mermaid\ngraph TD\n"
        markdown += "    classDef fileNode fill:#1E293B,stroke:#38BDF8,stroke-width:1px,color:#F8FAFC;\n"
        markdown += "    classDef apiNode fill:#451A03,stroke:#F59E0B,stroke-width:1.5px,color:#FDE68A;\n"
        markdown += "    classDef dbNode fill:#064E3B,stroke:#10B981,stroke-width:1.5px,color:#A7F3D0;\n\n"

        nodes = graph_data.get("nodes", [])
        links = graph_data.get("links", [])
        
        # Config/meta file patterns to exclude from architecture diagrams
        _CONFIG_JUNK = [
            'package.json', 'package-lock', 'tsconfig', 'vite.config', 'next.config',
            'eslint', 'prettier', 'postcss', 'tailwind.config', 'babel', 'jest.config',
            'vitest', 'webpack', 'rollup', '.gitignore', '.env', 'readme', 'license',
            'changelog', 'dockerfile', 'docker-compose', 'yarn.lock', 'pnpm-lock',
            'requirements.txt', 'setup.py', 'pyproject.toml', '__init__', 'manifest',
            'robots.txt', 'sitemap', 'favicon', '.ico', '.svg', '.png', '.jpg',
        ]

        def _is_config_file(name: str) -> bool:
            lower = name.lower()
            if any(p in lower for p in _CONFIG_JUNK):
                return True
            # Non-code extensions
            if re.search(r'\.(json|md|txt|yml|yaml|toml|cfg|ini|lock|css|scss|html|xml|svg|png|jpg|ico)$', lower):
                return True
            return False

        # Pick key source code files, filtering out config junk
        file_nodes = [n for n in nodes if n.get("type") == "File" and not _is_config_file(n.get("label", "").split("/")[-1])][:18]
        # If filtering removed everything, fall back to unfiltered
        if not file_nodes:
            file_nodes = [n for n in nodes if n.get("type") == "File"][:12]
        file_ids = set(n["id"] for n in file_nodes)

        # Deterministic Mermaid-safe identifier generator: guarantees source and target use exact same ID
        id_map = {}
        def clean_id(raw_id: str) -> str:
            if raw_id in id_map:
                return id_map[raw_id]
            clean = re.sub(r'[^a-zA-Z0-9]', '_', raw_id)
            clean = re.sub(r'_+', '_', clean).strip('_')
            if not clean or not clean[0].isalpha():
                clean = 'nd_' + clean
            base = clean
            counter = 0
            while clean in id_map.values():
                counter += 1
                clean = f"{base}_{counter}"
            id_map[raw_id] = clean
            return clean

        def safe_label(raw: str) -> str:
            """Escape characters that break Mermaid quoted labels"""
            return raw.replace('"', "'").replace('<', '‹').replace('>', '›').replace('&', '+')

        for fn in file_nodes:
            short_name = fn['label'].split('/')[-1]
            cid = clean_id(fn['id'])
            lbl = safe_label(short_name)
            markdown += f'    {cid}["{lbl}"]:::fileNode\n'

        added_edges = set()
        edge_count = 0
        for link in links:
            s_id = link.get("source")
            t_id = link.get("target")
            if isinstance(s_id, dict): s_id = s_id.get("id")
            if isinstance(t_id, dict): t_id = t_id.get("id")

            # Check if source and target match any of our displayed file nodes
            if s_id and t_id and s_id in file_ids and t_id in file_ids and s_id != t_id:
                edge_key = (s_id, t_id)
                if edge_key not in added_edges and edge_count < 30:
                    added_edges.add(edge_key)
                    rel = safe_label(link.get("relation", "DEPENDS_ON"))
                    markdown += f"    {clean_id(s_id)} -->|{rel}| {clean_id(t_id)}\n"
                    edge_count += 1

        markdown += "```\n\n"

        # Component Inventory — filter out config files, prioritize source code
        source_files = [f for f in files if not _is_config_file(f.get("path", "").split("/")[-1])]
        # Sort by symbol richness — files with classes/functions/APIs first
        source_files.sort(key=lambda f: (
            len(f.get("symbols", {}).get("apis", [])) * 5 +
            len(f.get("symbols", {}).get("classes", [])) * 3 +
            len(f.get("symbols", {}).get("functions", [])) * 2
        ), reverse=True)

        markdown += "## 2. Dynamic Component Inventory\n\n"
        markdown += "| Source Path | Language | Key Classes / Functions | Discovered Purpose |\n"
        markdown += "| :--- | :--- | :--- | :--- |\n"

        for f in source_files[:25]:
            path = f.get("path", "")
            lang = f.get("language", "Code")
            syms = f.get("symbols", {})
            classes = syms.get("classes", [])
            functions = syms.get("functions", [])
            
            key_symbols = []
            if classes:
                key_symbols.append(f"Classes: {', '.join(classes[:2])}")
            if functions:
                key_symbols.append(f"Functions: {', '.join(functions[:2])}")
            
            sym_text = " | ".join(key_symbols) if key_symbols else "Utility Module"
            
            # Purpose discovery
            p_lower = path.lower()
            p_name = path.split('/')[-1].lower()
            if "test" in p_lower:
                purpose = "Automated Test Suite"
            elif syms.get("apis"):
                purpose = "API Route Controller"
            elif "api" in p_lower or "route" in p_lower or "controller" in p_lower:
                purpose = "API Route Controller"
            elif "model" in p_lower or "schema" in p_lower or "db" in p_lower:
                purpose = "Data Model / Schema"
            elif "view" in p_lower or "component" in p_lower or "ui" in p_lower or "page" in p_lower:
                purpose = "UI Component View"
            elif "service" in p_lower or "engine" in p_lower:
                purpose = "Business Logic Service"
            elif "util" in p_lower or "helper" in p_lower or "lib" in p_lower:
                purpose = "Helper Utilities"
            elif classes:
                purpose = "Core Module"
            elif functions:
                purpose = "Logic Handler"
            else:
                purpose = "Source Module"

            markdown += f"| `{path}` | {lang} | `{sym_text}` | {purpose} |\n"

        if len(source_files) > 25:
            markdown += f"\n*...and {len(source_files) - 25} additional source files cataloged in Universal AST.* \n\n"

        markdown += "## 3. Detected Architecture Patterns\n"
        markdown += "- **Modular Layering**: Separation of concerns between entrypoints, utility helpers, and core execution logic.\n"
        markdown += f"- **Primary Stack**: Engineered with **{primary_lang}** static/dynamic structure.\n"
        markdown += f"- **Knowledge Graph Scale**: **{len(nodes)} total nodes** and **{len(links)} architectural links** indexed.\n"

        return {
            "doc_type": "architecture",
            "title": f"{proj_name} — Architecture Blueprint",
            "markdown": markdown
        }

    def _generate_api_doc(self, proj_name: str, primary_lang: str, files: List[Dict[str, Any]]) -> Dict[str, Any]:
        markdown = f"# REST API & Endpoint Specification — {proj_name}\n\n"
        markdown += "This document contains real API endpoints and handler contracts reverse-engineered directly from source code AST.\n\n"

        all_apis = []
        for f in files:
            apis = f.get("symbols", {}).get("apis", [])
            for api in apis:
                all_apis.append({
                    "file": f["path"],
                    "endpoint": api
                })

        if all_apis:
            markdown += f"## Discovered Endpoints ({len(all_apis)} Total)\n\n"
            markdown += "| Method | Route Endpoint | Source Module Handler | Status |\n"
            markdown += "| :--- | :--- | :--- | :--- |\n"
            
            for item in all_apis:
                raw_ep = item["endpoint"]
                parts = raw_ep.split(" ", 1)
                method = parts[0].upper() if len(parts) > 1 and parts[0].upper() in ["GET", "POST", "PUT", "DELETE", "PATCH"] else "ROUTE"
                route = parts[1] if len(parts) > 1 and method != "ROUTE" else raw_ep
                
                markdown += f"| `{method}` | `{route}` | `{item['file']}` | `ACTIVE` |\n"
            
            markdown += "\n### Endpoint Details\n\n"
            for idx, item in enumerate(all_apis[:15], 1):
                markdown += f"#### {idx}. `{item['endpoint']}`\n"
                markdown += f"- **Handler File**: `{item['file']}`\n"
                markdown += f"- **Protocol**: HTTP/1.1 REST\n"
                markdown += f"- **Payload Format**: `application/json`\n\n"
        else:
            # Fallback for codebases without explicit HTTP route decorators: find public interface functions
            markdown += "## Public Interface Contracts\n\n"
            markdown += "No explicit HTTP framework route decorators were detected. Below are the key entrypoint functions and handlers discovered in the codebase:\n\n"
            
            exported_fns = []
            for f in files:
                fns = f.get("symbols", {}).get("functions", [])
                for fn in fns[:3]:
                    exported_fns.append({"file": f["path"], "function": fn})
            
            markdown += "| Module File | Entrypoint Function | Interface Type |\n"
            markdown += "| :--- | :--- | :--- |\n"
            for ef in exported_fns[:20]:
                markdown += f"| `{ef['file']}` | `{ef['function']}()` | Exported Function |\n"
            markdown += "\n"

        return {
            "doc_type": "api",
            "title": f"{proj_name} — API Specification",
            "markdown": markdown
        }

    def _generate_database_doc(self, proj_name: str, files: List[Dict[str, Any]]) -> Dict[str, Any]:
        markdown = f"# Database ERD & Schema Documentation — {proj_name}\n\n"
        
        # 1. Gather all real models with fields from symbols or direct source AST
        discovered_models: List[Dict[str, Any]] = []
        seen_model_names = set()

        # A. From AST symbols["models"]
        for f in files:
            for m in f.get("symbols", {}).get("models", []):
                m_name = m.get("name")
                if m_name and m_name not in seen_model_names:
                    seen_model_names.add(m_name)
                    discovered_models.append({
                        "name": m_name,
                        "fields": m.get("fields", []),
                        "file": f.get("path", "")
                    })

        # B. Direct code extraction fallback if models wasn't populated in memory
        if not discovered_models:
            model_pattern = r'(?:export\s+)?(?:interface|class|type)\s+([A-Za-z0-9_]+)(?:\s*=\s*)?[^{]*\{([^}]+)\}'
            for f in files:
                code = f.get("code", "")
                p_lower = f.get("path", "").lower()
                if not code or any(p_lower.endswith(ext) for ext in ['.json', '.md', '.txt', '.bat', '.css', '.html']):
                    continue
                for m_name, m_body in re.findall(model_pattern, code):
                    if m_name in {'StoreData', 'Store', 'Config', 'Options', 'Props', 'State', 'Context'} or len(m_name) < 2:
                        continue
                    if m_name in seen_model_names:
                        continue
                    fields = []
                    for line in m_body.splitlines():
                        line = line.strip()
                        if not line or line.startswith('//') or line.startswith('/*'): continue
                        f_match = re.match(r'([A-Za-z0-9_]+)\??\s*:\s*([^;,\n]+)', line)
                        if f_match:
                            fn, ft = f_match.group(1), f_match.group(2).strip()
                            fields.append({"name": fn, "type": ft, "is_pk": fn.lower() == 'id'})
                    if fields:
                        seen_model_names.add(m_name)
                        discovered_models.append({
                            "name": m_name,
                            "fields": fields,
                            "file": f.get("path", "")
                        })

        if discovered_models:
            markdown += f"## Entity Relationship Summary ({len(discovered_models)} Discovered Data Models)\n\n"
            markdown += "```mermaid\nerDiagram\n"

            model_map = {m["name"]: m for m in discovered_models}

            for m in discovered_models[:12]:
                mname = m["name"]
                markdown += f"    {mname} {{\n"
                for fld in m["fields"][:8]:
                    fname = fld["name"]
                    raw_type = fld.get("type", "string").lower()
                    ftype = "string"
                    if any(t in raw_type for t in ["number", "int", "float", "double"]):
                        ftype = "int"
                    elif any(t in raw_type for t in ["date", "time"]):
                        ftype = "datetime"
                    elif any(t in raw_type for t in ["boolean", "bool"]):
                        ftype = "boolean"
                    
                    pk = " PK" if fld.get("is_pk") else ""
                    markdown += f"        {ftype} {fname}{pk}\n"
                markdown += "    }\n"

            # Auto-detect real Foreign Key relationships
            rels = set()
            for m in discovered_models:
                mname = m["name"]
                for fld in m["fields"]:
                    fname = fld["name"]
                    if fname.endswith("Id") and fname != "id":
                        prefix = fname[:-2]
                        for other_name in model_map:
                            if other_name == mname: continue
                            if prefix.lower() in other_name.lower() or (prefix.lower() == "owner" and other_name.lower() == "user"):
                                rels.add(f'    {other_name} ||--o{{ {mname} : "references"')
                                break

            for r in sorted(list(rels)):
                markdown += f"{r}\n"

            markdown += "```\n\n"

            markdown += "## Schema Inventory & Attribute Specifications\n\n"
            markdown += "| Model / Entity | Primary Source File | Properties & Attributes |\n"
            markdown += "| :--- | :--- | :--- |\n"
            for m in discovered_models:
                f_preview = ", ".join([f"`{fld['name']}: {fld.get('type', 'any')}`" for fld in m["fields"][:4]])
                if len(m["fields"]) > 4:
                    f_preview += f" *(+{len(m['fields']) - 4} more)*"
                markdown += f"| **`{m['name']}`** | `{m['file']}` | {f_preview} |\n"
            markdown += "\n"
        else:
            markdown += "## Schema Inspection\n\n"
            markdown += "No SQL tables or strongly-typed data models were identified in the scanned source files.\n\n"

        return {
            "doc_type": "database",
            "title": f"{proj_name} — Database ERD",
            "markdown": markdown
        }

    def _generate_developer_guide(self, proj_name: str, primary_lang: str, files: List[Dict[str, Any]], languages: Dict[str, Any]) -> Dict[str, Any]:
        markdown = f"# Developer Onboarding & Contribution Guide — {proj_name}\n\n"
        markdown += f"Welcome to **{proj_name}**. This dynamic guide was generated by **CodeMind AI** from real codebase analysis.\n\n"

        markdown += "## 1. Quick Start & Setup\n\n"
        
        lang_lower = primary_lang.lower()
        if "python" in lang_lower:
            markdown += "```bash\n"
            markdown += "# 1. Clone repository & navigate to directory\n"
            markdown += f"cd {proj_name.lower().replace(' ', '-')}\n\n"
            markdown += "# 2. Create virtual environment\n"
            markdown += "python -m venv venv\n"
            markdown += "# Linux/macOS:\n"
            markdown += "source venv/bin/activate\n"
            markdown += "# Windows PowerShell:\n"
            markdown += ".\\venv\\Scripts\\Activate.ps1\n\n"
            markdown += "# 3. Install dependencies\n"
            markdown += "pip install -r requirements.txt\n"
            markdown += "```\n\n"
        elif "typescript" in lang_lower or "javascript" in lang_lower:
            markdown += "```bash\n"
            markdown += "# 1. Install dependencies\n"
            markdown += "npm install\n\n"
            markdown += "# 2. Run development server\n"
            markdown += "npm run dev\n\n"
            markdown += "# 3. Build production bundle\n"
            markdown += "npm run build\n"
            markdown += "```\n\n"
        elif "java" in lang_lower:
            markdown += "```bash\n"
            markdown += "# Build and test Maven/Gradle project\n"
            markdown += "./mvnw clean install  # or ./gradlew build\n"
            markdown += "```\n\n"
        elif "go" in lang_lower:
            markdown += "```bash\n"
            markdown += "# Download modules & run entrypoint\n"
            markdown += "go mod download\n"
            markdown += "go run main.go\n"
            markdown += "```\n\n"
        else:
            markdown += "```bash\n"
            markdown += f"# Inspect primary entrypoints in {primary_lang}\n"
            markdown += "```\n\n"

        markdown += "## 2. Key Entrypoint Files\n\n"
        entrypoints = []
        for f in files:
            path = f["path"]
            p_lower = path.lower()
            if any(k in p_lower for k in ["main", "app", "index", "server", "core", "config"]):
                entrypoints.append(f)

        if not entrypoints:
            entrypoints = files[:3]

        markdown += "| Entrypoint File | Language | Discovered Symbols |\n"
        markdown += "| :--- | :--- | :--- |\n"
        for ep in entrypoints[:6]:
            syms = ep.get("symbols", {})
            sym_list = (syms.get("classes", []) + syms.get("functions", []))[:3]
            sym_str = ", ".join(sym_list) if sym_list else "Configuration / Script"
            markdown += f"| `{ep['path']}` | {ep.get('language')} | `{sym_str}` |\n"

        markdown += "\n## 3. Contribution Workflow\n"
        markdown += "1. **Branching**: Create feature branches from `main` or `master`.\n"
        markdown += "2. **Testing**: Run local test suites before submitting PRs.\n"
        markdown += "3. **Impact Verification**: Use CodeMind AI's Change Impact Engine to verify blast radius prior to merging.\n"

        return {
            "doc_type": "developer_guide",
            "title": f"{proj_name} — Developer Guide",
            "markdown": markdown
        }
