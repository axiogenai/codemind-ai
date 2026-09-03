import React, { useState, useEffect } from 'react';
import { Cpu, Play } from 'lucide-react';
import type { ArchitectureSimulationData } from '../types';
import { simulateArchitectureEvolution } from '../services/api';

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
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      {/* Header */}
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">AI Architecture Evolution Simulator</h2>
            <p className="text-xs text-neutral-400">Simulate microservices, event-driven pub/sub, or DB migrations before writing code.</p>
          </div>
        </div>
      </div>

      {/* Simulator Inputs */}
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
        <label className="text-xs font-bold text-neutral-300 block">Select Evolution Scenario</label>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
          >
            <option value="microservices">Migrate Monolith to Event-Driven Microservices</option>
            <option value="event_driven">Introduce Event-Driven Pub/Sub Queue (Apache Kafka)</option>
            <option value="caching">Implement Redis Multi-Tier Caching Layer</option>
          </select>

          <button
            onClick={() => handleRunSimulation()}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-neutral-100 text-neutral-900 hover:bg-white font-bold text-xs border border-neutral-300 transition-all cursor-pointer flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Simulation Results */}
      {simulation && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-2">
            <span className="text-xs font-bold text-neutral-400 uppercase">Complexity Impact</span>
            <p className="text-lg font-black text-amber-400">{simulation.complexity_increase}</p>
          </div>

          <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-2">
            <span className="text-xs font-bold text-neutral-400 uppercase">Performance Impact</span>
            <p className="text-lg font-black text-emerald-400">{simulation.performance_impact}</p>
          </div>

          <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-2">
            <span className="text-xs font-bold text-neutral-400 uppercase">Technical Debt Change</span>
            <p className="text-lg font-black text-cyan-400">{simulation.technical_debt_delta}</p>
          </div>

          <div className="md:col-span-3 p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recommended Migration Steps</h3>
            <div className="space-y-2 text-xs">
              {simulation.suggested_steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
