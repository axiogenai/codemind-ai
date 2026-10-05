import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldAlert, FileCode, Play, Zap, ChevronDown, Target } from 'lucide-react';
import type { ImpactAnalysis, ProjectFile } from '../types';
import { predictImpact } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

interface ChangeImpactViewProps {
  initialTarget?: string;
  projectId?: string;
  files?: ProjectFile[];
}

export const ChangeImpactView: React.FC<ChangeImpactViewProps> = ({ initialTarget, projectId, files }) => {
  const [selectedTarget, setSelectedTarget] = useState<string>(initialTarget || 'services/payment_processor.py');
  const [customTarget, setCustomTarget] = useState<string>('');
  const [impactData, setImpactData] = useState<ImpactAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableTargets = React.useMemo(() => {
    if (!files || files.length === 0) return [
      'services/payment_processor.py',
      'services/auth_service.py',
      'database/db_manager.py',
      'services/ledger_service.py',
      'POST /api/v1/payments/charge',
      'table:wallets'
    ];
    
    const targets = new Set<string>();
    files.forEach(f => {
      if (f.path) targets.add(f.path);
      f.symbols?.classes?.forEach(c => c && targets.add(c));
      f.symbols?.functions?.forEach(fn => fn && targets.add(`${fn}()`));
      f.symbols?.apis?.forEach(api => api && targets.add(api));
      f.symbols?.tables?.forEach(table => table && table.trim() && targets.add(`table:${table}`));
    });
    return Array.from(targets).filter(t => t && t.trim() !== '' && t !== ':' && t !== 'table:').sort();
  }, [files]);

  const handleRunAnalysis = async (target: string) => {
    setLoading(true);
    setSelectedTarget(target);
    const result = await predictImpact(target, projectId);
    setImpactData(result);
    setLoading(false);
  };

  useEffect(() => {
    if (files && files.length > 0) {
      const realTarget = files.find(f => /(?:server|main|app|index)\.(?:ts|js|py|go)/i.test(f.path))?.path || files[0]?.path;
      if (realTarget && (!initialTarget || selectedTarget === 'services/payment_processor.py')) {
        setSelectedTarget(realTarget);
        handleRunAnalysis(realTarget);
        return;
      }
    }
    handleRunAnalysis(selectedTarget);
  }, [files]);

  return (
    <div className="h-[calc(100vh-4rem)] p-6 space-y-6 overflow-y-auto bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      {/* Header & Target Selector: Studio-Grade Precision Control Bar */}
      <SpotlightCard className="p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-white/[0.06] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08] shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <span>Blast Radius Predictor</span>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Universal AST Graph Cognitive Intelligence</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Change Impact Prediction Engine
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Select any File, Class, Method, or API to simulate cascading breaking changes and downstream ripple effects before editing code.
          </p>
        </div>

        {/* Selector Input: Precision Studio Target Selector */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full md:w-80" ref={dropdownRef}>
            <div className="flex items-center bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] focus-within:border-zinc-400 dark:focus-within:border-zinc-500 rounded-xl h-10 px-3 transition-all shadow-2xs">
              <Target className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0 mr-2" />
              <input
                type="text"
                value={customTarget || selectedTarget}
                onChange={(e) => {
                  setCustomTarget(e.target.value);
                  setSelectedTarget(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search symbol, file, or API..."
                className="w-full bg-transparent border-none text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded cursor-pointer transition-colors"
                aria-label="Toggle target dropdown"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Custom Dropdown: Opens downwards */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-full md:w-96 bg-white dark:bg-[#131417] border border-zinc-200 dark:border-white/[0.1] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in duration-100 max-h-64 overflow-y-auto custom-scrollbar">
                <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Available Targets ({availableTargets.length})
                </div>
                {availableTargets
                  .filter(t => !customTarget || t.toLowerCase().includes(customTarget.toLowerCase()))
                  .slice(0, 100)
                  .map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedTarget(t);
                        setCustomTarget(t);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{t}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleRunAnalysis(customTarget || selectedTarget)}
            disabled={loading || (!customTarget && !selectedTarget)}
            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs border border-transparent transition-colors disabled:opacity-40 cursor-pointer shrink-0 shadow-xs outline-none focus:outline-none focus:ring-0 select-none"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{loading ? 'Predicting...' : 'Predict Impact'}</span>
          </button>
        </div>
      </SpotlightCard>

      {/* Main Results Display */}
      {impactData && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SpotlightCard className="p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-mono">Target Symbol</span>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-1.5 truncate">{impactData.target}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-sans">Under AST Analysis</p>
            </SpotlightCard>

            <SpotlightCard className="p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-mono">Risk Level</span>
              <div className="flex items-center space-x-2 mt-1.5">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                  impactData.risk_level === 'HIGH' || impactData.risk_level === 'CRITICAL'
                    ? 'bg-zinc-200 dark:bg-white/[0.12] text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-white/[0.16]'
                    : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.08]'
                }`}>
                  {impactData.risk_level} RISK
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">Confidence: {impactData.confidence_score}%</p>
            </SpotlightCard>

            <SpotlightCard className="p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-mono">Blast Radius Score</span>
              <div className="flex items-baseline space-x-2 mt-1.5">
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">{impactData.blast_radius_score}</span>
                <span className="text-xs text-zinc-500 font-mono">/ 100</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-[#18191D] rounded-full mt-2.5 overflow-hidden border border-zinc-200 dark:border-white/[0.04]">
                <div
                  className="h-full rounded-full bg-zinc-800 dark:bg-zinc-200 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, impactData.blast_radius_score))}%` }}
                />
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-mono">Downstream Scope</span>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-1.5">
                {impactData.affected_files_count} Files • {impactData.affected_apis_count} APIs
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{(impactData.affected_tests || []).length} Unit Test Suites Affected</p>
            </SpotlightCard>
          </div>

          {/* Deep Trace Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Panel: Impacted Files & APIs */}
            <SpotlightCard className="p-5 rounded-2xl space-y-4 flex flex-col h-[560px] border border-zinc-200 dark:border-white/[0.08] shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-3">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>Affected Downstream Files & Endpoints</span>
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-[#18191D] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08]">
                  {impactData.affected_files.length} Files
                </span>
              </div>

              {/* Independent scroll container for file list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
                {impactData.affected_files.map((file) => (
                  <div
                    key={file}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-[#141518] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between text-xs hover:border-zinc-300 dark:hover:border-white/[0.15] transition-colors"
                  >
                    <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate mr-2">{file}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-200/70 dark:bg-[#18191D] text-zinc-600 dark:text-zinc-400 border border-zinc-300/50 dark:border-white/[0.08] shrink-0 font-medium">
                      Direct Import
                    </span>
                  </div>
                ))}
              </div>

              {impactData.affected_apis.length > 0 && (
                <div className="pt-3 border-t border-zinc-200 dark:border-white/[0.08] shrink-0 space-y-2">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-300">
                    Impacted API Contracts ({impactData.affected_apis.length})
                  </h4>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {impactData.affected_apis.map((api) => (
                      <div
                        key={api}
                        className="p-2 rounded-lg bg-zinc-50 dark:bg-[#141518] border border-zinc-200 dark:border-white/[0.08] text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate"
                      >
                        {api}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SpotlightCard>

            {/* Right Panel: AI Migration Strategy & Potential Breaking Changes */}
            <SpotlightCard className="p-5 rounded-2xl flex flex-col h-[560px] overflow-y-auto space-y-4 border border-zinc-200 dark:border-white/[0.08] shadow-xs pr-2 custom-scrollbar">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-3 shrink-0">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                  <span>AI Refactoring & Migration Strategy</span>
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] space-y-3 shrink-0">
                {(impactData.migration_strategy || []).map((step, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-sans">{step}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-zinc-700 dark:text-zinc-300" /> Potential Breaking Changes
                </h4>
                <ul className="list-disc list-inside text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 pl-1 leading-relaxed">
                  {(impactData.potential_breaking_changes || []).map((bc, idx) => (
                    <li key={idx}>{bc}</li>
                  ))}
                </ul>
              </div>
            </SpotlightCard>
          </div>
        </div>
      )}
    </div>
  );
};
