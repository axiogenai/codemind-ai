import React, { useEffect, useState } from 'react';
import { Cpu, Activity, AlertTriangle } from 'lucide-react';
import type { DigitalTwinMetric } from '../types';
import { fetchDigitalTwin } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

interface Props {
  projectId?: string;
}

export const DigitalTwinView: React.FC<Props> = ({ projectId }) => {
  const [metrics, setMetrics] = useState<DigitalTwinMetric[]>([]);

  useEffect(() => {
    fetchDigitalTwin(projectId).then(res => {
      setMetrics(res.metrics || []);
    });
  }, [projectId]);

  return (
    <div className="h-[calc(100vh-4rem)] p-6 md:p-8 overflow-y-auto space-y-6 bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Runtime Digital Twin</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Static-to-dynamic performance simulation: predicts CPU, Memory, Network & Deadlocks prior to deployment.</p>
          </div>
        </div>
      </SpotlightCard>

      <div className="space-y-6">
        {metrics.map((item, idx) => (
          <SpotlightCard key={idx} className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                {item.component}
              </h3>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
                Deadlock Risk: {item.deadlock_risk}
              </span>
            </div>

            <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-[#121316] p-3 rounded-xl border border-zinc-200 dark:border-white/[0.06]">
              Request Flow: {item.request_flow}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06]">
                <span className="text-zinc-500 dark:text-zinc-400 font-bold block">Predicted CPU Usage</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-mono mt-1 block">{item.predicted_cpu}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06]">
                <span className="text-zinc-500 dark:text-zinc-400 font-bold block">Predicted RAM Memory</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-mono mt-1 block">{item.predicted_memory}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06]">
                <span className="text-zinc-500 dark:text-zinc-400 font-bold block">Predicted Network Overhead</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-mono mt-1 block">{item.predicted_network}</span>
              </div>
            </div>

            {item.bottleneck_warning && (
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-300 dark:border-white/[0.12] text-zinc-800 dark:text-zinc-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-zinc-700 dark:text-zinc-300" />
                <span>{item.bottleneck_warning}</span>
              </div>
            )}
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
};
