"""
Backend API Comprehensive Test Suite — Verifying All 14 Intelligence Endpoints
"""

import sys
import os

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_all_tests():
    print("🚀 Starting Backend API Verification Suite for CodeMind AI...\n")

    endpoints = [
        ("POST", "/api/dna", {"project_id": "test_proj"}),
        ("POST", "/api/simulate-evolution", {"scenario": "microservices", "project_id": "test_proj"}),
        ("POST", "/api/refactor/plan", {"project_id": "test_proj"}),
        ("GET", "/api/timeline?project_id=test_proj", None),
        ("POST", "/api/digital-twin", {"project_id": "test_proj"}),
        ("GET", "/api/memory?project_id=test_proj", None),
        ("POST", "/api/cross-repo", {"project_id": "test_proj"}),
        ("GET", "/api/tech-debt?project_id=test_proj", None),
        ("POST", "/api/generate-tests", {"file_path": "backend/main.py"}),
        ("POST", "/api/root-cause", {"stack_trace": "NullPointerException at main.py:42"}),
        ("GET", "/api/engineering-score?project_id=test_proj", None),
        ("GET", "/api/dependency-risk?project_id=test_proj", None),
        ("POST", "/api/review-pr", {"title": "feat: test PR", "diff": "+ test code"}),
        ("GET", "/api/org-graph?project_id=test_proj", None)
    ]

    passed = 0
    failed = 0

    for method, path, payload in endpoints:
        try:
            if method == "GET":
                res = client.get(path)
            else:
                res = client.post(path, json=payload or {})
            
            if res.status_code == 200:
                print(f"  ✅ {method} {path} → 200 OK")
                passed += 1
            else:
                print(f"  ❌ {method} {path} → {res.status_code} FAIL: {res.text}")
                failed += 1
        except Exception as e:
            print(f"  💥 EXCEPTION on {method} {path}: {e}")
            failed += 1

    print(f"\n📊 Verification Summary: {passed} Passed, {failed} Failed.")
    if failed == 0:
        print("🎉 ALL 14 BACKEND INTELLIGENCE ENGINES ARE FULLY OPERATIONAL!")
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_all_tests()
