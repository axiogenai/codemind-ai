import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldAlert, FileCode, Play, Zap, ChevronDown, Target } from 'lucide-react';
import type { ImpactAnalysis, ProjectFile } from '../types';
import { predictImpact } from '../services/api';

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
    handleRunAnalysis(selectedTarget);
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] p-6 space-y-6 overflow-y-auto">
      {/* Header & Target Selector: Studio-Grade Precision Control Bar */}
      <div className="bg-[#0D0E11] border border-white/[0.08] rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#141518] text-zinc-300 border border-white/[0.08] shadow-xs">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Blast Radius Predictor</span>
            </div>
            <span className="text-xs text-zinc-400 font-normal">Graph Cognitive Intelligence</span>
          </div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Change Impact Prediction Engine</h2>
          <p className="text-xs text-zinc-400 mt-1">Select any File, Class, Method, or API to calculate downstream breaking changes before editing code.</p>
        </div>

        {/* Selector Input: Precision Studio Target Selector */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full md:w-80" ref={dropdownRef}>
            <div className="flex items-center bg-[#151619] border border-white/[0.08] focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-600/40 rounded-lg h-9 px-3 transition-all shadow-inner">
              <Target className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-2" />
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
                className="w-full bg-transparent border-none text-xs text-zinc-200 placeholder:text-zinc-500 outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-zinc-400 hover:text-zinc-200 p-0.5 rounded cursor-pointer transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Custom Dropdown: Opens downwards */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-full md:w-96 bg-[#131417] border border-white/[0.1] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in duration-100 max-h-64 overflow-y-auto custom-scrollbar">
                <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
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
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center justify-between cursor-pointer"
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
            className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs border border-zinc-300 transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{loading ? 'Predicting...' : 'Predict Impact'}</span>
          </button>
        </div>
      </div>

      {/* Main Results Display */}
      {impactData && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="glass-panel p-5 rounded-2xl border border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Target Symbol</span>
              <p className="text-sm font-bold text-indigo-300 code-font mt-1 truncate">{impactData.target}</p>
              <p className="text-[11px] text-gray-400 mt-1">Under Analysis</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Risk Assessment</span>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className="px-3 py-1 rounded-lg text-xs font-extrabold text-white"
                  style={{ backgroundColor: impactData.risk_color }}
                >
                  {impactData.risk_level} RISK
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Confidence Rating: {impactData.confidence_score}%</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Blast Radius Score</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-white">{impactData.blast_radius_score}</span>
                <span className="text-xs text-gray-400">/ 100</span>
              </div>
              <div className="h-1.5 w-full bg-gray-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${impactData.blast_radius_score}%`, backgroundColor: impactData.risk_color }}
                />
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Downstream Impact</span>
              <p className="text-2xl font-black text-white mt-1">
                {impactData.affected_files_count} Files | {impactData.affected_apis_count} APIs
              </p>
              <p className="text-[11px] text-amber-400 mt-1">{(impactData.affected_tests || []).length} Unit Test Suites Affected</p>
            </div>
          </div>

          {/* Deep Trace Details Grid (Independent Scrolling Panels) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Panel: Impacted Files & APIs */}
            <div className="glass-panel p-6 rounded-2xl space-y-4 flex flex-col h-[560px] border border-gray-800/90">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>Affected Downstream Files & Endpoints</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {impactData.affected_files.length} Files
                </span>
              </div>

              {/* Independent scroll container for file list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {impactData.affected_files.map((file) => (
                  <div key={file} className="p-3 rounded-xl bg-[#12141C] border border-white/[0.06] flex items-center justify-between text-xs hover:border-indigo-500/30 transition-colors">
                    <span className="code-font text-indigo-200 truncate mr-2">{file}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0 font-medium">
                      Direct Import
                    </span>
                  </div>
                ))}
              </div>

              {impactData.affected_apis.length > 0 && (
                <div className="pt-2 border-t border-gray-800 shrink-0">
                  <h4 className="text-xs font-bold text-amber-400 mb-2">Impacted API Contracts ({impactData.affected_apis.length})</h4>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                    {impactData.affected_apis.map((api) => (
                      <div key={api} className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 code-font truncate">
                        {api}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: AI Migration Strategy & Potential Breaking Changes */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col h-[560px] overflow-y-auto space-y-4 border border-gray-800/90 pr-2">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3 shrink-0">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>AI Refactoring & Migration Strategy</span>
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3 shrink-0">
                {(impactData.migration_strategy || []).map((step, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Potential Breaking Changes
                </h4>
                <ul className="list-disc list-inside text-xs text-gray-300 space-y-1.5">
                  {(impactData.potential_breaking_changes || []).map((bc, idx) => (
                    <li key={idx}>{bc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
