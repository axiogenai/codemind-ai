import React, { useEffect, useState } from 'react';
import { Database, User } from 'lucide-react';
import type { ModuleMemoryBank } from '../types';
import { fetchKnowledgeMemory } from '../services/api';

interface Props {
  projectId?: string;
}

export const KnowledgeMemoryView: React.FC<Props> = ({ projectId }) => {
  const [modules, setModules] = useState<ModuleMemoryBank[]>([]);

  useEffect(() => {
    fetchKnowledgeMemory(projectId).then(res => {
      setModules(res.modules || []);
    });
  }, [projectId]);

  return (
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">AI Knowledge Memory</h2>
            <p className="text-xs text-neutral-400">Persistent memory bank remembering module owners, dependencies, known issues & security history.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod, idx) => (
          <div key={idx} className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{mod.module_name}</h3>
              <span className="text-xs font-bold text-emerald-400">Security: {mod.security_score}/100</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-400">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                <span>Last Modified By: <strong className="text-white">{mod.last_modified_by}</strong></span>
              </div>

              <div>
                <span className="text-neutral-400 block font-semibold mb-1">Dependencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {mod.dependencies.map((dep, dIdx) => (
                    <span key={dIdx} className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-[11px]">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-neutral-400 block font-semibold mb-1">Known Issues & Caveats</span>
                <ul className="space-y-1">
                  {mod.known_issues.map((issue, iIdx) => (
                    <li key={iIdx} className="text-amber-300 text-[11px] bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                      • {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
