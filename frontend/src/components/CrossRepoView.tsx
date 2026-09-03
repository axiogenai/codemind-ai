import React, { useEffect, useState } from 'react';
import { Globe, ArrowRight } from 'lucide-react';
import type { CrossRepoNode } from '../types';
import { fetchCrossRepoIntelligence } from '../services/api';

interface Props {
  projectId?: string;
}

export const CrossRepoView: React.FC<Props> = ({ projectId }) => {
  const [services, setServices] = useState<CrossRepoNode[]>([]);

  useEffect(() => {
    fetchCrossRepoIntelligence(projectId).then(res => {
      setServices(res.services || []);
    });
  }, [projectId]);

  return (
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Cross-Repository Intelligence</h2>
            <p className="text-xs text-neutral-400">Multi-repository dependency map: Frontend ↔ Gateway ↔ Microservice ↔ Database ↔ Shared Library.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {services.map((item, idx) => (
          <div key={idx} className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                  {item.type}
                </span>
                <span className="text-xs font-mono text-neutral-400">{item.language}</span>
              </div>
              <h3 className="text-base font-bold text-white">{item.service_name}</h3>
            </div>

            {item.dependencies_on.length > 0 && (
              <div className="text-xs space-y-1">
                <span className="text-neutral-400 font-bold block">Downstream Connections</span>
                <div className="flex flex-wrap gap-2">
                  {item.dependencies_on.map((dep, dIdx) => (
                    <span key={dIdx} className="px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 text-[11px] flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-neutral-400" />
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
