"""
Real User Project Workspace Store for CodeMind AI
Stores user-imported ZIP archives and local directory scans with timestamped recency.
"""

import time
from typing import Dict, Any, Optional, List

class ProjectWorkspaceStore:
    def __init__(self):
        self._workspaces: Dict[str, Dict[str, Any]] = {}
        self._active_project_id: Optional[str] = None
        self._timestamps: Dict[str, float] = {}

    def save_project(self, project_id: str, data: Dict[str, Any]):
        now = time.time()
        self._workspaces[project_id] = data
        self._timestamps[project_id] = now
        self._active_project_id = project_id
        if "project" in data:
            data["project"]["_updated_at"] = now

    def set_active_project(self, project_id: str) -> bool:
        if project_id in self._workspaces:
            self._active_project_id = project_id
            self._timestamps[project_id] = time.time()
            return True
        return False

    def get_active_project_id(self) -> Optional[str]:
        return self._active_project_id

    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        if project_id and project_id in self._workspaces:
            return self._workspaces[project_id]
        if self._active_project_id and self._active_project_id in self._workspaces:
            return self._workspaces[self._active_project_id]
        return None

    def list_projects(self) -> List[Dict[str, Any]]:
        # Sort projects by most recently active / updated first!
        sorted_pids = sorted(
            self._workspaces.keys(),
            key=lambda pid: self._timestamps.get(pid, 0.0),
            reverse=True
        )
        return [
            {
                "id": pid,
                "name": self._workspaces[pid]["project"]["name"],
                "primary_language": self._workspaces[pid]["project"]["primary_language"],
                "total_files": self._workspaces[pid]["project"]["total_files"],
                "total_lines": self._workspaces[pid]["project"]["total_lines"],
                "is_active": pid == self._active_project_id,
                "updated_at": self._timestamps.get(pid, 0.0)
            }
            for pid in sorted_pids
            if pid in self._workspaces and "project" in self._workspaces[pid]
        ]

workspace_store = ProjectWorkspaceStore()
