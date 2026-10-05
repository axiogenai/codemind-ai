import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Play, ChevronDown, Check } from 'lucide-react';
import type { ArchitectureSimulationData } from '../types';
import { simulateArchitectureEvolution } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

interface Props {
  projectId?: string;
}

const SCENARIO_OPTIONS = [
  {
    id: 'microservices',
    label: 'Migrate Monolith to Event-Driven Microservices',
    description: 'Decouple monolithic codebase into bounded contexts with asynchronous messaging'
  },
  {
    id: 'event_driven',
    label: 'Introduce Event-Driven Pub/Sub Queue (Apache Kafka)',
    description: 'High-throughput event streaming, distributed topics, and consumer groups'
  },
  {
    id: 'caching',
    label: 'Implement Redis Multi-Tier Caching Layer',
    description: 'Sub-millisecond distributed caching with write-through cache invalidation'
  }
];

export const ArchitectureSimulatorView: React.FC<Props> = ({ projectId }) => {
  const [scenario, setScenario] = useState('microservices');
  const [simulation, setSimulation] = useState<ArchitectureSimulationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const currentOption = SCENARIO_OPTIONS.find(o => o.id === scenario) || SCENARIO_OPTIONS[0];

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
      <SpotlightCard overflowVisible className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-4 relative z-30 overflow-visible">
        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Select Evolution Scenario</label>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Custom Precision Dropdown */}
          <div className="flex-1 w-full relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-zinc-50 hover:bg-zinc-100 dark:bg-[#121316] dark:hover:bg-[#18191D] border border-zinc-200 dark:border-white/[0.08] focus:border-zinc-400 dark:focus:border-zinc-500 rounded-xl px-4 py-3 text-xs text-zinc-900 dark:text-white outline-none cursor-pointer transition-colors shadow-2xs"
              aria-expanded={isDropdownOpen}
            >
              <div className="flex flex-col text-left truncate mr-3">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{currentOption.label}</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{currentOption.description}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-full bg-white dark:bg-[#141518] border border-zinc-200 dark:border-white/[0.1] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in duration-100 space-y-1">
                {SCENARIO_OPTIONS.map((opt) => {
                  const isSelected = opt.id === scenario;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setScenario(opt.id);
                        setIsDropdownOpen(false);
                        handleRunSimulation(opt.id);
                      }}
                      className={`w-full text-left p-3 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-2xs'
                          : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex flex-col truncate mr-3">
                        <span className="font-semibold">{opt.label}</span>
                        <span className={`text-[11px] mt-0.5 ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          {opt.description}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => handleRunSimulation()}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xs shrink-0 hover:scale-[1.01]"
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
