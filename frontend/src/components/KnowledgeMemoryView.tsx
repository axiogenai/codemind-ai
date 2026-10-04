import React, { useEffect, useState } from 'react';
import { Database, User } from 'lucide-react';
import type { ModuleMemoryBank } from '../types';
import { fetchKnowledgeMemory } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

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
    <div className="h-[calc(100vh-4rem)] p-6 md:p-8 overflow-y-auto space-y-6 bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">AI Knowledge Memory</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Persistent memory bank remembering module owners, dependencies, known issues & security history.</p>
          </div>
        </div>
      </SpotlightCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modules.map((mod, idx) => (
          <SpotlightCard key={idx} className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">{mod.module_name}</h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
                Security: {mod.security_score}/100
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <User className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Last Modified By: <strong className="text-zinc-900 dark:text-zinc-100">{mod.last_modified_by}</strong></span>
              </div>

              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block font-semibold mb-1.5 uppercase font-mono text-[10px]">Dependencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {mod.dependencies.map((dep, dIdx) => (
                    <span key={dIdx} className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block font-semibold mb-1.5 uppercase font-mono text-[10px]">Known Issues & Caveats</span>
                <ul className="space-y-1">
                  {mod.known_issues.map((issue, iIdx) => (
                    <li key={iIdx} className="text-zinc-700 dark:text-zinc-300 text-[11px] bg-zinc-50 dark:bg-[#121316] p-2 rounded-lg border border-zinc-200 dark:border-white/[0.06]">
                      • {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
};
