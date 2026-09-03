import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import type { DependencyRiskItem } from '../types';
import { fetchDependencyRisk } from '../services/api';

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
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">AI Dependency Risk Network</h2>
            <p className="text-xs text-neutral-400">Third-party package security risk, license audit, breaking change forecast & update urgency.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {deps.map((item, idx) => (
          <div key={idx} className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">{item.package_name}</span>
                <span className="text-xs text-neutral-400 font-mono">{item.version}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                  {item.license}
                </span>
              </div>
              <p className="text-xs text-neutral-400">{item.maintenance_status}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300">
                <span>Security Risk: </span>
                <strong className="text-emerald-400">{item.security_risk}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300">
                <span>Update Urgency: </span>
                <strong className="text-neutral-200">{item.update_urgency}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
