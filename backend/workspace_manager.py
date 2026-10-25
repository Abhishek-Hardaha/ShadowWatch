import os
import shutil
import sqlite3
import json

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sandbox_workspace"))
GENERATOR_SCRIPT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sandbox_workspace_generator.py"))

class WorkspaceManager:
    def __init__(self, workspace_dir=WORKSPACE_DIR):
        self.workspace_dir = workspace_dir

    def list_files(self):
        file_tree = []
        for root, dirs, files in os.walk(self.workspace_dir):
            rel_dir = os.path.relpath(root, self.workspace_dir)
            if rel_dir == ".":
                rel_dir = ""
            for f in files:
                rel_path = os.path.join(rel_dir, f).replace("\\", "/")
                full_path = os.path.join(root, f)
                size = os.path.getsize(full_path)
                file_tree.append({
                    "path": rel_path,
                    "filename": f,
                    "size_bytes": size,
                    "directory": rel_dir.replace("\\", "/"),
                    "extension": os.path.splitext(f)[1],
                    "is_confidential": any(k in rel_path.lower() for k in ["confidential", "answerkey", "marks", "payroll", ".env", "sqlite", "password"])
                })
        return sorted(file_tree, key=lambda x: x["path"])

    def resolve_path(self, rel_path: str) -> str:
        if not rel_path:
            return ""
        norm = rel_path.strip("/\\").replace("\\", "/")
        safe_path = os.path.abspath(os.path.join(self.workspace_dir, norm))
        if os.path.exists(safe_path):
            return norm
        
        # Smart resolution across workspace files
        files = self.list_files()
        target_name = os.path.splitext(os.path.basename(norm))[0].lower()
        if not target_name:
            return norm

        # 1. Exact match on stem
        for f in files:
            stem = os.path.splitext(f["filename"])[0].lower()
            if stem == target_name:
                return f["path"]

        # 2. Substring match
        for f in files:
            if target_name in f["filename"].lower() or target_name in f["path"].lower():
                return f["path"]

        # 3. Keyword matching (e.g. "cs701" and "endsem")
        keywords = [k for k in target_name.replace("_", " ").replace("-", " ").split() if len(k) > 2]
        if keywords:
            for f in files:
                f_lower = f["path"].lower()
                if all(k in f_lower for k in keywords):
                    return f["path"]

        return norm

    def read_file(self, rel_path: str) -> str:
        resolved = self.resolve_path(rel_path)
        safe_path = os.path.abspath(os.path.join(self.workspace_dir, resolved.lstrip("/\\")))
        if not safe_path.startswith(self.workspace_dir):
            return "ERROR: Path traversal detected. Access outside sandbox workspace is denied."
        if not os.path.exists(safe_path):
            return f"ERROR: File not found: {rel_path}"
        try:
            with open(safe_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read()
        except Exception as e:
            return f"ERROR reading file: {str(e)}"

    def write_file(self, rel_path: str, content: str) -> str:
        safe_path = os.path.abspath(os.path.join(self.workspace_dir, rel_path.lstrip("/\\")))
        if not safe_path.startswith(self.workspace_dir):
            return "ERROR: Path traversal outside sandbox workspace denied."
        os.makedirs(os.path.dirname(safe_path), exist_ok=True)
        try:
            with open(safe_path, "w", encoding="utf-8") as f:
                f.write(content)
            return f"SUCCESS: Wrote {len(content.encode('utf-8'))} bytes to {rel_path}"
        except Exception as e:
            return f"ERROR writing file: {str(e)}"

    def delete_file(self, rel_path: str) -> str:
        safe_path = os.path.abspath(os.path.join(self.workspace_dir, rel_path.lstrip("/\\")))
        if not safe_path.startswith(self.workspace_dir):
            return "ERROR: Path traversal outside sandbox workspace denied."
        if not os.path.exists(safe_path):
            return f"ERROR: File does not exist: {rel_path}"
        try:
            if os.path.isdir(safe_path):
                shutil.rmtree(safe_path)
            else:
                os.remove(safe_path)
            return f"SUCCESS: Deleted {rel_path}"
        except Exception as e:
            return f"ERROR deleting: {str(e)}"

    def execute_sql(self, query: str) -> str:
        db_path = os.path.join(self.workspace_dir, "System_Files", "auth_and_students.sqlite")
        if not os.path.exists(db_path):
            db_path = os.path.join(self.workspace_dir, "it_infrastructure", "auth_and_students.sqlite")
        if not os.path.exists(db_path):
            return "ERROR: Database file not found."
        try:
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute(query)
            if query.strip().upper().startswith(("SELECT", "PRAGMA")):
                rows = cur.fetchall()
                cols = [desc[0] for desc in cur.description] if cur.description else []
                conn.close()
                return json.dumps({"columns": cols, "rows": rows}, indent=2)
            else:
                conn.commit()
                changes = conn.total_changes
                conn.close()
                return f"SUCCESS: Query executed. Affected rows: {changes}"
        except Exception as e:
            return f"SQL ERROR: {str(e)}"

    def reset_workspace(self):
        try:
            if os.path.exists(self.workspace_dir):
                shutil.rmtree(self.workspace_dir)
            import subprocess
            subprocess.run(["python", GENERATOR_SCRIPT], check=True)
            return {"status": "SUCCESS", "message": "Sandbox workspace reset to pristine SIT Pune state."}
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}

workspace_mgr = WorkspaceManager()
