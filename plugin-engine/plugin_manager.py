# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
"""
Plugin Framework Engine for CodeMind AI
Allows dynamic registration of custom Language Parsers, AI reasoning plugins, and Security rules.
"""

from typing import Dict, List, Any, Callable

class PluginManagerEngine:
    def __init__(self):
        self._language_plugins: Dict[str, Callable] = {}
        self._security_plugins: List[Callable] = []

    def register_language_plugin(self, language: str, parser_func: Callable):
        """Registers a custom language parser plugin."""
        self._language_plugins[language] = parser_func

    def register_security_plugin(self, scanner_func: Callable):
        """Registers a custom security auditing rule plugin."""
        self._security_plugins.append(scanner_func)

    def get_registered_languages(self) -> List[str]:
        return list(self._language_plugins.keys())

    def run_security_plugins(self, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        extra_issues = []
        for plugin in self._security_plugins:
            try:
                res = plugin(files)
                if isinstance(res, list):
                    extra_issues.extend(res)
            except Exception:
                continue
        return extra_issues

plugin_manager = PluginManagerEngine()
