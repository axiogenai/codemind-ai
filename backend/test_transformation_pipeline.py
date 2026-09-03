"""
Test Suite — Phase 2 Repository Transformation Engine Pipeline
"""

import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from prompt_interpreter import prompt_interpreter
from transformation_planner import transformation_planner
from ast_transformer import ast_transformer
from rollback_manager import rollback_manager
from validation_engine import validation_engine
from explanation_generator import explanation_generator
from transformation_engine import transformation_engine

def run_transformation_tests():
    print("=== Running Phase 2 Transformation Engine Verification ===\n")

    project_data = {"name": "CodeMind AI", "primary_language": "Python", "total_files": 12}
    files = [
        {
            "path": "backend/services/user_service.py",
            "lines": 120,
            "code": "class UserService:\n    def get_user(self, user_id: str):\n        return {'id': user_id, 'name': 'Aditya'}\n",
            "symbols": {"classes": ["UserService"], "functions": ["get_user"]}
        },
        {
            "path": "backend/controllers/user_controller.py",
            "lines": 45,
            "code": "from backend.services.user_service import UserService\n\ndef handle_user_request():\n    service = UserService()\n    return service.get_user('123')\n",
            "symbols": {"functions": ["handle_user_request"]}
        }
    ]

    # Test 1: Intent Interpretation
    prompt = "Rename UserService to IdentityService"
    intent = prompt_interpreter.interpret_prompt(prompt, project_data)
    assert intent["transformation_type"] == "RENAME_SYMBOL"
    assert intent["source_symbol"] == "UserService"
    assert intent["target_symbol"] == "IdentityService"
    print("  [OK] Intent Interpretation -> PASSED")

    # Test 2: Execution Planning
    plan = transformation_planner.create_plan(intent, project_data, files)
    assert len(plan["affected_files"]) > 0
    assert plan["confidence_percentage"] >= 80.0
    print("  [OK] Execution Planning -> PASSED")

    # Test 3: AST Transformation
    transform_res = ast_transformer.transform_repository(plan, files)
    assert len(transform_res["modified_files"]) > 0
    assert "IdentityService" in transform_res["modified_files"][0]["transformed_code"]
    print("  [OK] AST Code Transformation -> PASSED")

    # Test 4: Snapshot & Rollback
    snap = rollback_manager.create_snapshot("proj_1", project_data, files)
    assert snap["snapshot_id"].startswith("SNAP-")
    rb = rollback_manager.rollback_latest("proj_1")
    assert rb["snapshot_id"] == snap["snapshot_id"]
    print("  [OK] Repository Snapshot & Rollback -> PASSED")

    # Test 5: Validation Engine
    val = validation_engine.validate_transformation(transform_res["modified_files"])
    assert val["is_valid"] is True
    print("  [OK] Integrity Validation Engine -> PASSED")

    # Test 6: AI Explanation Generator
    exp = explanation_generator.generate_explanation(plan, val)
    assert "refactor(" in exp["suggested_commit_message"].lower()
    print("  [OK] AI Rationale & Commit Summary Generator -> PASSED")

    # Test 7: Master Transformation Engine Orchestration
    exec_res = transformation_engine.execute("proj_2", plan, project_data, files)
    assert exec_res["status"] == "SUCCESS"
    print("  [OK] Master Transformation Engine Pipeline -> PASSED")

    print("\nTotal Transformation Subsystems Verified: 7 / 7 Operational.")

if __name__ == "__main__":
    run_transformation_tests()
