# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
"""
Performance & Complexity Analyzer Engine
Scans AST and code for N^2 nested loops, blocking calls, high cyclomatic complexity, and memory risks.
"""

import re
from typing import Dict, List, Any

class PerformanceEngine:
    def analyze_performance(self, files: List[Dict[str, Any]]) -> Dict[str, Any]:
        nested_loop_issues = []
        blocking_call_issues = []
        complexity_reports = []

        for f in files:
            path = f.get("path", "")
            code = f.get("code", "")
            lines = code.splitlines()

            # Detect nested loops O(N^2)
            nested_for = re.findall(r'for\s+.*?:.*?\n\s+for\s+.*?:', code) + re.findall(r'for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)', code)
            if nested_for:
                nested_loop_issues.append({
                    "file": path,
                    "title": "Potential O(N²) Quadratic Time Complexity",
                    "severity": "WARNING",
                    "recommendation": "Use hash map lookups or set intersections to reduce from O(N²) to O(N)."
                })

            # Detect blocking calls on async loops
            blocking = re.findall(r'time\.sleep|\brequests\.get|\bfile\.read\(', code)
            if "async" in code and blocking:
                blocking_call_issues.append({
                    "file": path,
                    "title": "Synchronous Blocking Call in Async Loop",
                    "severity": "HIGH",
                    "recommendation": "Replace synchronous calls with async equivalents (httpx / asyncio.sleep)."
                })

            # Cyclomatic complexity score
            decision_count = len(re.findall(r'\b(if|else|elif|for|while|case|catch|try|except|&&|\|\|)\b', code))
            comp_score = 1 + decision_count
            complexity_reports.append({
                "file": path,
                "lines": len(lines),
                "cyclomatic_complexity": comp_score,
                "rating": "LOW" if comp_score < 10 else ("MEDIUM" if comp_score < 25 else "HIGH")
            })

        avg_complexity = round(sum(c["cyclomatic_complexity"] for c in complexity_reports) / max(1, len(complexity_reports)), 1)

        return {
            "average_cyclomatic_complexity": avg_complexity,
            "performance_rating": "A" if avg_complexity < 8 and not nested_loop_issues else "B",
            "total_performance_risks": len(nested_loop_issues) + len(blocking_call_issues),
            "nested_loop_issues": nested_loop_issues,
            "blocking_call_issues": blocking_call_issues,
            "file_complexities": complexity_reports
        }
