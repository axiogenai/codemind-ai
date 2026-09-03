"""
Master Repository Transformation Engine — In-Memory Safety Engine with Zip Download Packaging
"""

import os
import io
import copy
import zipfile
from typing import Dict, Any, List
from prompt_interpreter import prompt_interpreter
from transformation_planner import transformation_planner
from ast_transformer import ast_transformer
from rollback_manager import rollback_manager
from validation_engine import validation_engine
from explanation_generator import explanation_generator
from project_store import workspace_store

class TransformationEngine:
    def interpret(self, user_prompt: str, project_data: Dict[str, Any] = None) -> Dict[str, Any]:
        return prompt_interpreter.interpret_prompt(user_prompt, project_data)

    def plan(self, user_prompt: str, project_data: Dict[str, Any], files: List[Dict[str, Any]]) -> Dict[str, Any]:
        intent = prompt_interpreter.interpret_prompt(user_prompt, project_data)
        plan = transformation_planner.create_plan(intent, project_data, files)
        return {
            "intent": intent,
            "plan": plan
        }

    def execute(self, project_id: str, plan: Dict[str, Any], project_data: Dict[str, Any], files: List[Dict[str, Any]]) -> Dict[str, Any]:
        # 1. Create Pre-Transformation Repository Snapshot for memory safety
        snapshot = rollback_manager.create_snapshot(project_id, project_data, files)

        # 2. Perform Language-Aware AST Transformation (In-Memory)
        transform_result = ast_transformer.transform_repository(plan, files)

        # 3. Validate Transformed AST Codebase
        val_report = validation_engine.validate_transformation(transform_result.get("modified_files", []))

        if not val_report.get("is_valid"):
            rollback_manager.rollback_latest(project_id)
            return {
                "status": "ROLLED_BACK",
                "message": "Validation failed — transformation canceled.",
                "validation": val_report
            }

        # 4. Generate In-Memory Transformed Files Map (NO direct disk overwrites)
        new_files_map = {f["path"]: copy.deepcopy(f) for f in files}
        
        for mod_f in transform_result.get("modified_files", []):
            rel_path = mod_f.get("path")
            if rel_path in new_files_map:
                new_files_map[rel_path]["code"] = mod_f.get("transformed_code")
                new_files_map[rel_path]["lines"] = len(mod_f.get("transformed_code").split('\n'))

        for cre_f in transform_result.get("created_files", []):
            rel_path = cre_f.get("path")
            new_files_map[rel_path] = {
                "path": rel_path,
                "code": cre_f.get("code"),
                "lines": len(cre_f.get("code").split('\n')),
                "language": rel_path.split('.')[-1] if '.' in rel_path else "text",
                "symbols": {"classes": [], "functions": [], "imports": [], "apis": [], "tables": []}
            }

        for del_path in transform_result.get("deleted_files", []):
            if del_path in new_files_map:
                del new_files_map[del_path]

        updated_files = list(new_files_map.values())

        # 5. Generate AI Rationale Explanation & Commit Summary
        explanation = explanation_generator.generate_explanation(plan, val_report)

        return {
            "status": "SUCCESS",
            "snapshot_id": snapshot.get("snapshot_id"),
            "plan": plan,
            "transformation": transform_result,
            "validation": val_report,
            "explanation": explanation,
            "total_files": len(updated_files),
            "download_ready": True
        }

    def generate_transformed_zip(self, plan: Dict[str, Any], files: List[Dict[str, Any]]) -> bytes:
        transform_result = ast_transformer.transform_repository(plan, files)
        transformed_files_map = {}

        # 1. Include all base files from the uploaded codebase
        for f in files:
            path = f.get("path")
            if path:
                transformed_files_map[path] = f.get("code", "")

        # 2. Overlay modified files with transformed code
        for mod_f in transform_result.get("modified_files", []):
            path = mod_f.get("path")
            if path:
                transformed_files_map[path] = mod_f.get("transformed_code", "")

        # 3. Add all newly created files
        for cre_f in transform_result.get("created_files", []):
            path = cre_f.get("path")
            if path:
                transformed_files_map[path] = cre_f.get("code", "")

        # 4. Remove deleted files
        for del_path in transform_result.get("deleted_files", []):
            if del_path in transformed_files_map:
                del transformed_files_map[del_path]

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
            for rel_path, code in transformed_files_map.items():
                zf.writestr(rel_path, code or "")

        buf.seek(0)
        return buf.getvalue()

    def rollback(self, project_id: str) -> Dict[str, Any]:
        restored = rollback_manager.rollback_latest(project_id)
        if restored:
            return {
                "status": "SUCCESS",
                "message": f"Successfully cleared transformation state to snapshot {restored.get('snapshot_id')}",
                "snapshot": restored
            }
        return {
            "status": "ERROR",
            "message": "No snapshot history available."
        }

    def get_history(self, project_id: str) -> List[Dict[str, Any]]:
        return rollback_manager.get_history(project_id)

transformation_engine = TransformationEngine()
