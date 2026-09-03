"""
CodeMind AI Modular Unit & Integration Test Suite
"""

import sys
import os
import pytest

# Ensure modules are on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../language-detectors')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../ast-engine')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../dependency-engine')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../knowledge-graph')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../change-impact-engine')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../security-engine')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../performance-engine')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../report-engine')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../plugin-engine')))

from detector import LanguageDetectorEngine
from ast_normalizer import ASTNormalizerEngine
from dependency_resolver import DependencyEngine
from graph_builder import KnowledgeGraphEngine
from impact_analyzer import ChangeImpactAnalyzer
from vulnerability_scanner import SecurityEngine
from complexity_analyzer import PerformanceEngine
from report_generator import ReportGeneratorEngine
from plugin_manager import plugin_manager

def test_language_detection():
    detector = LanguageDetectorEngine()
    assert detector.detect_language("main.py") == "Python"
    assert detector.detect_language("app.ts") == "TypeScript"
    assert detector.detect_language("Dockerfile") == "Dockerfile"

def test_ast_normalizer():
    normalizer = ASTNormalizerEngine()
    code = "class PaymentProcessor:\n    def process(self):\n        pass"
    ast = normalizer.normalize("payment.py", code, "Python")
    assert ast.file == "payment.py"
    assert "PaymentProcessor" in ast.classes
    assert "process" in ast.functions

def test_dependency_engine():
    dep_engine = DependencyEngine()
    files = [
        {"path": "a.py", "symbols": {"imports": ["b"]}},
        {"path": "b.py", "symbols": {"imports": []}}
    ]
    deps = dep_engine.resolve_dependencies(files)
    assert len(deps) == 1
    assert deps[0] == ("a.py", "b.py", "IMPORTS")

def test_knowledge_graph_builder():
    graph_engine = KnowledgeGraphEngine()
    files = [
        {
            "path": "auth.py",
            "language": "Python",
            "symbols": {
                "classes": ["JWTAuth"],
                "functions": ["login"],
                "apis": ["POST /login"],
                "tables": ["users"]
            }
        }
    ]
    graph = graph_engine.build_and_validate("proj_1", "Test Project", files)
    assert graph["node_count"] > 1
    assert graph["edge_count"] > 1

def test_change_impact_predictor():
    impact_engine = ChangeImpactAnalyzer()
    nodes = [{"id": "auth.py", "type": "File", "label": "auth.py"}]
    links = []
    impact = impact_engine.predict_impact("auth.py", [], nodes, links)
    assert impact["target"] == "auth.py"
    assert "risk_level" in impact

def test_security_engine():
    security = SecurityEngine()
    files = [{"path": "config.py", "code": "api_key = 'sk_live_123456789012345'"}]
    res = security.scan_codebase(files)
    assert len(res["vulnerabilities"]) > 0
    assert res["vulnerabilities"][0]["severity"] == "CRITICAL"

def test_performance_engine():
    perf = PerformanceEngine()
    files = [{"path": "algo.py", "code": "for i in range(10):\n    for j in range(10):\n        print(i, j)"}]
    res = perf.analyze_performance(files)
    assert len(res["nested_loop_issues"]) == 1

def test_report_generator():
    rep = ReportGeneratorEngine()
    res = rep.generate_full_report({"name": "TestProj", "files": []}, {"health_score": 90}, {"average_cyclomatic_complexity": 2.5})
    assert "Executive Summary" in res["markdown"]

def test_plugin_manager():
    plugin_manager.register_language_plugin("Cobol", lambda x: {})
    assert "Cobol" in plugin_manager.get_registered_languages()
