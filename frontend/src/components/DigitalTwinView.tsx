import React, { useEffect, useState } from 'react';
import { Cpu, Activity, AlertTriangle } from 'lucide-react';
import type { DigitalTwinMetric } from '../types';
import { fetchDigitalTwin } from '../services/api';

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
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Runtime Digital Twin</h2>
            <p className="text-xs text-neutral-400">Static-to-dynamic performance simulation: predicts CPU, Memory, Network & Deadlocks prior to deployment.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {metrics.map((item, idx) => (
          <div key={idx} className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-neutral-400" />
                {item.component}
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                Deadlock Risk: {item.deadlock_risk}
              </span>
            </div>

            <p className="text-xs font-mono text-neutral-400 bg-neutral-900 p-3 rounded-xl border border-neutral-800">
              Request Flow: {item.request_flow}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400 font-bold block">Predicted CPU Usage</span>
                <span className="text-neutral-200 font-mono mt-1 block">{item.predicted_cpu}</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400 font-bold block">Predicted RAM Memory</span>
                <span className="text-neutral-200 font-mono mt-1 block">{item.predicted_memory}</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400 font-bold block">Predicted Network Overhead</span>
                <span className="text-neutral-200 font-mono mt-1 block">{item.predicted_network}</span>
              </div>
            </div>

            {item.bottleneck_warning && (
              <div className="p-3 rounded-xl bg-neutral-900 border border-amber-900/50 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{item.bottleneck_warning}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
