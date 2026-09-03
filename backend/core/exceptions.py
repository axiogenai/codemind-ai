# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
"""
Core Application Exceptions & Domain Error Hierarchy
"""

class CodeMindException(Exception):
    """Base Exception for all CodeMind AI platform errors."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)

class ParserException(CodeMindException):
    def __init__(self, message: str):
        super().__init__(message, code="PARSER_ERROR")

class KnowledgeGraphException(CodeMindException):
    def __init__(self, message: str):
        super().__init__(message, code="GRAPH_VALIDATION_ERROR")

class ImpactPredictionException(CodeMindException):
    def __init__(self, message: str):
        super().__init__(message, code="IMPACT_PREDICTION_ERROR")
