import React, { useState, useEffect } from 'react';
import { Cpu, Play } from 'lucide-react';
import type { ArchitectureSimulationData } from '../types';
import { simulateArchitectureEvolution } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

interface Props {
  projectId?: string;
}

export const ArchitectureSimulatorView: React.FC<Props> = ({ projectId }) => {
  const [scenario, setScenario] = useState('microservices');
  const [simulation, setSimulation] = useState<ArchitectureSimulationData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRunSimulation = async (selectedScenario?: string) => {
    setLoading(true);
    const targetScenario = selectedScenario || scenario;
    const res = await simulateArchitectureEvolution(targetScenario, projectId);
    setSimulation(res);
    setLoading(false);
  };

  useEffect(() => {
    handleRunSimulation('microservices');
  }, [projectId]);

  return (
    <div className="h-[calc(100vh-4rem)] p-6 md:p-8 overflow-y-auto space-y-6 bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      {/* Header */}
      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">AI Architecture Evolution Simulator</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Simulate microservices, event-driven pub/sub, or DB migrations before writing code.</p>
          </div>
        </div>
      </SpotlightCard>

      {/* Simulator Inputs */}
      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-4">
        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Select Evolution Scenario</label>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="flex-1 bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs text-zinc-900 dark:text-white outline-none"
          >
            <option value="microservices">Migrate Monolith to Event-Driven Microservices</option>
            <option value="event_driven">Introduce Event-Driven Pub/Sub Queue (Apache Kafka)</option>
            <option value="caching">Implement Redis Multi-Tier Caching Layer</option>
          </select>

          <button
            onClick={() => handleRunSimulation()}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold text-xs transition-all cursor-pointer flex items-center space-x-2 shadow-xs hover:scale-[1.01]"
          >
            <Play className="w-4 h-4" />
            <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
        </div>
      </SpotlightCard>

      {/* Simulation Results */}
      {simulation && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Complexity Impact</span>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{simulation.complexity_increase}</p>
          </SpotlightCard>

          <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Performance Impact</span>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{simulation.performance_impact}</p>
          </SpotlightCard>

          <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Technical Debt Change</span>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{simulation.technical_debt_delta}</p>
          </SpotlightCard>

          <SpotlightCard className="md:col-span-3 p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Recommended Migration Steps</h3>
            <div className="space-y-2 text-xs">
              {simulation.suggested_steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
                  <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>
      )}
    </div>
  );
};
