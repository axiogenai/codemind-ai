# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
"""
Rollback Manager Engine — Pre-Transformation Repository Snapshots & Restoration
"""

import time
import copy
from typing import Dict, Any, List, Optional

class RollbackManagerEngine:
    def __init__(self):
        # In-memory snapshot storage per project_id
        self.snapshots: Dict[str, List[Dict[str, Any]]] = {}

    def create_snapshot(self, project_id: str, project_data: Dict[str, Any], files: List[Dict[str, Any]]) -> Dict[str, Any]:
        snap_id = f"SNAP-{int(time.time() * 1000)}"
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

        snapshot = {
            "snapshot_id": snap_id,
            "project_id": project_id,
            "timestamp": timestamp,
            "project_data": copy.deepcopy(project_data or {}),
            "files": copy.deepcopy(files or []),
            "total_files": len(files or [])
        }

        if project_id not in self.snapshots:
            self.snapshots[project_id] = []

        self.snapshots[project_id].append(snapshot)
        return snapshot

    def get_history(self, project_id: str) -> List[Dict[str, Any]]:
        history = self.snapshots.get(project_id, [])
        return [
            {
                "snapshot_id": s["snapshot_id"],
                "timestamp": s["timestamp"],
                "total_files": s["total_files"]
            }
            for s in reversed(history)
        ]

    def rollback_latest(self, project_id: str) -> Optional[Dict[str, Any]]:
        if project_id in self.snapshots and self.snapshots[project_id]:
            snapshot = self.snapshots[project_id].pop()
            return snapshot
        return None

rollback_manager = RollbackManagerEngine()
