import React, { useState, useRef, useEffect } from 'react';
import {
  FileCode,
  ShieldCheck,
  Zap,
  GitPullRequest,
  ArrowUpRight,
  Code2,
  Clock,
  Network,
  ChevronDown,
  Search
} from 'lucide-react';
import type { ProjectMeta, ProjectFile, SecurityReport } from '../types';
import type { ActiveTab } from './Sidebar';
import { RingChart } from './charts/ring-chart';
import { Ring } from './charts/ring';
import { RingCenter } from './charts/ring-center';
import type { RingData } from './charts/ring-context';

const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#38BDF8',
  TypeScript: '#818CF8',
  JavaScript: '#FBBF24',
  HTML: '#F472B6',
  CSS: '#C084FC',
  Rust: '#FB923C',
  Go: '#2DD4BF',
  C: '#94A3B8',
  'C++': '#60A5FA',
  Java: '#F87171',
  Shell: '#A3E635',
  SQL: '#34D399',
  Markdown: '#CBD5E1',
};

const PALETTE_FALLBACK = [
  '#38BDF8',
  '#818CF8',
  '#34D399',
  '#FBBF24',
  '#F472B6',
  '#A78BFA',
  '#FB923C',
];

interface OverviewDashboardProps {
  project: ProjectMeta;
  files: ProjectFile[];
  security: SecurityReport;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectImpactTarget: (symbol: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  project,
  files,
  security,
  onNavigateTab,
  onSelectImpactTarget
}) => {
  const primaryLang = project.primary_language || 'Python';
  const totalFiles = project.total_files || files.length;
  const totalLines = project.total_lines || files.reduce((acc, f) => acc + f.lines, 0);

  const kpis = [
    { label: 'Total Source Files', value: totalFiles.toLocaleString(), icon: FileCode, color: 'from-blue-500 to-cyan-400', border: 'border-blue-500/30' },
    { label: 'Lines of Code (LOC)', value: totalLines.toLocaleString(), icon: Code2, color: 'from-indigo-500 to-purple-400', border: 'border-indigo-500/30' },
    { label: 'Security Health Score', value: `${security.health_score} / 100`, icon: ShieldCheck, color: security.health_score >= 80 ? 'from-emerald-500 to-teal-400' : 'from-amber-500 to-rose-400', border: 'border-emerald-500/30' },
    { label: 'Technical Debt', value: `${security.technical_debt_hours} Hours`, icon: Clock, color: 'from-purple-500 to-pink-400', border: 'border-purple-500/30' }
  ];

  const [hoveredLangIndex, setHoveredLangIndex] = React.useState<number | null>(null);
  const [isImpactDropdownOpen, setIsImpactDropdownOpen] = useState<boolean>(false);
  const [impactFileSearch, setImpactFileSearch] = useState<string>('');
  const impactDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (impactDropdownRef.current && !impactDropdownRef.current.contains(e.target as Node)) {
        setIsImpactDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rawLanguages = project.languages && Object.keys(project.languages).length > 0
    ? project.languages
    : { [primaryLang]: 100 };

  const sortedLanguages = Object.entries(rawLanguages).sort((a, b) => b[1] - a[1]);

  const ringData: RingData[] = sortedLanguages.map(([lang, pct], idx) => ({
    label: lang,
    value: pct,
    maxValue: 100,
    color: LANGUAGE_COLORS[lang] || PALETTE_FALLBACK[idx % PALETTE_FALLBACK.length],
  }));

  const ringCount = ringData.length;
  const strokeWidth = ringCount <= 2 ? 14 : ringCount === 3 ? 11 : 9;
  const ringGap = ringCount <= 2 ? 8 : ringCount === 3 ? 6 : 5;
  const baseInnerRadius = Math.max(34, 90 - ringCount * strokeWidth - (ringCount - 1) * ringGap);


  return (
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-8 bg-[#0A0A0A] pb-32">
      {/* Hero Welcome Banner */}
      <div className="p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-neutral-800 bg-[#121212]">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-gray-300">Reverse Engineering Active</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {project.name}
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            {project.description || 'Full AST normalized codebase with real-time Knowledge Graph indexing and change impact prediction.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => onNavigateTab('graph')}
            className="px-5 py-3 rounded-2xl bg-neutral-900 text-neutral-200 border border-neutral-800 text-xs font-extrabold hover:bg-neutral-800 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Network className="w-4 h-4" />
            <span>Explore Knowledge Graph</span>
          </button>
          <button
            onClick={() => onNavigateTab('impact')}
            className="px-5 py-3 rounded-2xl bg-neutral-100 text-neutral-900 hover:bg-white text-xs font-extrabold border border-neutral-300 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Predict Change Impact</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">{kpi.label}</span>
                <div className="p-2.5 rounded-2xl bg-neutral-900 text-neutral-200 border border-neutral-800">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-white tracking-tight">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Language Breakdown with @bklit/ring-chart */}
        <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-neutral-300" />
              Language Composition
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-gray-300">
              {primaryLang} Primary
            </span>
          </div>

          {/* Ring Chart Centerpiece */}
          <div className="flex justify-center items-center py-2">
            <RingChart
              data={ringData}
              size={210}
              strokeWidth={strokeWidth}
              ringGap={ringGap}
              baseInnerRadius={baseInnerRadius}
              hoveredIndex={hoveredLangIndex}
              onHoverChange={setHoveredLangIndex}
              className="mx-auto"
            >
              {ringData.map((d, index) => (
                <Ring
                  key={d.label}
                  index={index}
                  color={d.color}
                  showGlow={false}
                  lineCap="round"
                />
              ))}
              <RingCenter
                defaultLabel="Total"
                suffix="%"
                valueClassName="text-2xl font-black text-white tracking-tight"
                labelClassName="text-xs font-semibold text-gray-400 mt-0.5"
              />
            </RingChart>
          </div>

          {/* Interactive Language Legend */}
          <div className="space-y-2 pt-3 border-t border-neutral-800">
            {ringData.map((d, idx) => {
              const isHovered = hoveredLangIndex === idx;
              const isFaded = hoveredLangIndex !== null && !isHovered;
              return (
                <div
                  key={d.label}
                  onMouseEnter={() => setHoveredLangIndex(idx)}
                  onMouseLeave={() => setHoveredLangIndex(null)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl transition-all duration-150 cursor-pointer ${
                    isHovered
                      ? 'bg-neutral-900 border border-neutral-700'
                      : isFaded
                      ? 'opacity-40 border border-transparent'
                      : 'hover:bg-neutral-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-xs font-bold text-gray-200 truncate">{d.label}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400 font-mono">
                    {d.value}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Audit Snapshot */}
        <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Security Audit & Technical Debt
            </h3>
            <button
              onClick={() => onNavigateTab('security')}
              className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>View All Issues ({security.vulnerabilities.length + security.code_smells.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <p className={`text-xs font-bold ${security.vulnerabilities.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {security.vulnerabilities.length > 0 ? 'Detected Vulnerabilities' : 'Security Vulnerabilities'}
              </p>
              <p className="text-xl font-black text-white">{security.vulnerabilities.length}</p>
              <p className="text-[11px] text-gray-400">
                {security.vulnerabilities.length > 0 ? 'CWE-798 Hardcoded secrets & SQL injections.' : 'Zero critical vulnerabilities detected.'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <p className={`text-xs font-bold ${security.code_smells.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                Code Smells & Debt
              </p>
              <p className="text-xl font-black text-white">{security.code_smells.length}</p>
              <p className="text-[11px] text-gray-400">
                {security.code_smells.length > 0 ? 'God classes & cyclomatic complexity points.' : 'Clean architecture with 0 code debt.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Change Impact Analyzer Trigger Bar: Studio-Grade Control */}
      <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0D0E11] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#151619] border border-white/[0.08] flex items-center justify-center text-amber-400 shadow-inner shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              Quick Blast Radius Predictor
            </h4>
            <p className="text-xs text-zinc-400 font-normal">Select any source file to calculate downstream breaking changes prior to deployment.</p>
          </div>
        </div>

        <div className="relative w-full md:w-auto" ref={impactDropdownRef}>
          <button
            type="button"
            onClick={() => setIsImpactDropdownOpen(!isImpactDropdownOpen)}
            className="w-full md:w-80 flex items-center justify-between gap-3 bg-[#151619] hover:bg-[#1A1C20] border border-white/[0.08] focus:border-zinc-500 rounded-lg px-3.5 py-2 text-xs text-zinc-200 shadow-inner transition-all cursor-pointer"
          >
            <span className="truncate text-zinc-300 font-mono text-xs">
              Select File to Analyze Impact...
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isImpactDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Studio Dropup - Opens UPWARDS above the bottom bar */}
          {isImpactDropdownOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-full md:w-96 bg-[#131417] border border-white/[0.1] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in duration-100">
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Filter project files..."
                  value={impactFileSearch}
                  onChange={(e) => setImpactFileSearch(e.target.value)}
                  className="w-full bg-[#1A1C20] border border-white/[0.08] focus:border-zinc-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
                {files.filter(f => f.path.toLowerCase().includes(impactFileSearch.toLowerCase())).length === 0 ? (
                  <div className="px-3 py-4 text-xs text-zinc-500 text-center">No files match "{impactFileSearch}"</div>
                ) : (
                  files
                    .filter(f => f.path.toLowerCase().includes(impactFileSearch.toLowerCase()))
                    .map((f) => (
                      <button
                        key={f.path}
                        onClick={() => {
                          setIsImpactDropdownOpen(false);
                          onSelectImpactTarget(f.path);
                          onNavigateTab('impact');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{f.path}</span>
                        <span className="text-[10px] text-zinc-500 font-sans ml-2 shrink-0">{f.lines} LOC</span>
                      </button>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
