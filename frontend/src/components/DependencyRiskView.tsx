import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import type { DependencyRiskItem } from '../types';
import { fetchDependencyRisk } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

interface Props {
  projectId?: string;
}

export const DependencyRiskView: React.FC<Props> = ({ projectId }) => {
  const [deps, setDeps] = useState<DependencyRiskItem[]>([]);

  useEffect(() => {
    fetchDependencyRisk(projectId).then(res => {
      setDeps(res.dependencies || []);
    });
  }, [projectId]);

  return (
    <div className="h-[calc(100vh-4rem)] p-6 md:p-8 overflow-y-auto space-y-6 bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">AI Dependency Risk Network</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Third-party package security risk, license audit, breaking change forecast & update urgency.</p>
          </div>
        </div>
      </SpotlightCard>

      <div className="space-y-4">
        {deps.map((item, idx) => (
          <SpotlightCard key={idx} className="p-5 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900 dark:text-white font-mono">{item.package_name}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{item.version}</span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300">
                  {item.license}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.maintenance_status}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300">
                <span>Security Risk: </span>
                <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{item.security_risk}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300">
                <span>Update Urgency: </span>
                <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{item.update_urgency}</strong>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
};
