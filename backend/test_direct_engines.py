"""
Direct Python Engine Test Suite — Verifying All 14 Intelligence Engines
"""

import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from code_dna_engine import dna_engine
from evolution_simulator import evolution_simulator
from refactoring_engine import refactoring_engine
from evolution_timeline import evolution_timeline_engine
from digital_twin_engine import digital_twin_engine
from knowledge_memory import knowledge_memory_engine
from cross_repo_engine import cross_repo_engine
from tech_debt_engine import tech_debt_engine
from test_generator import test_generator_engine
from root_cause_ai import root_cause_ai_engine
from intelligence_score import intelligence_score_engine
from dependency_risk_engine import dependency_risk_engine
from pr_reviewer import pr_reviewer_engine
from org_knowledge_graph import org_knowledge_graph_engine

def run_direct_tests():
    print("=== Running Direct Engine Test Verification ===\n")
    proj = {"name": "CodeMind AI", "primary_language": "Python", "total_files": 97, "total_lines": 14000}
    files = [{"path": "backend/main.py", "lines": 400, "symbols": {"classes": ["App"], "apis": ["/api/scan"]}}]
    sec = {"health_score": 92, "total_issues": 3, "technical_debt_hours": 24}

    tests = [
        ("Code DNA Engine", lambda: dna_engine.analyze_dna(proj, files)),
        ("Evolution Simulator", lambda: evolution_simulator.simulate("microservices", proj)),
        ("Refactoring Engine", lambda: refactoring_engine.get_plans(proj, files)),
        ("Evolution Timeline Engine", lambda: evolution_timeline_engine.get_timeline(proj)),
        ("Digital Twin Engine", lambda: digital_twin_engine.simulate_twin(proj, files)),
        ("Knowledge Memory Engine", lambda: knowledge_memory_engine.get_module_memory(proj)),
        ("Cross-Repo Engine", lambda: cross_repo_engine.get_ecosystem(proj)),
        ("Tech Debt Engine", lambda: tech_debt_engine.calculate_debt(proj, sec)),
        ("Test Generator Engine", lambda: test_generator_engine.generate_tests("backend/main.py", "")),
        ("Root Cause AI Engine", lambda: root_cause_ai_engine.analyze_stacktrace("NullPointer", proj)),
        ("Intelligence Score Engine", lambda: intelligence_score_engine.calculate_score(proj, sec)),
        ("Dependency Risk Engine", lambda: dependency_risk_engine.get_risk_network(proj)),
        ("PR Reviewer Engine", lambda: pr_reviewer_engine.review_pr("feat: test", "diff", proj)),
        ("Org Knowledge Graph Engine", lambda: org_knowledge_graph_engine.get_org_graph(proj))
    ]

    passed = 0
    for name, fn in tests:
        try:
            res = fn()
            assert res is not None
            print(f"  [OK] {name} -> PASSED (Output Keys: {list(res.keys()) if isinstance(res, dict) else len(res)})")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {name} -> FAILED: {e}")

    print(f"\nTotal Engines Verified: {passed} / {len(tests)} Operational.")

if __name__ == "__main__":
    run_direct_tests()
