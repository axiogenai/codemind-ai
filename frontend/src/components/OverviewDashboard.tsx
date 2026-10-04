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
  Search,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Layers
} from 'lucide-react';
import type { ProjectMeta, ProjectFile, SecurityReport } from '../types';
import type { ActiveTab } from './Sidebar';
import { RingChart } from './charts/ring-chart';
import { Ring } from './charts/ring';
import { RingCenter } from './charts/ring-center';
import type { RingData } from './charts/ring-context';
import { BentoGrid, BentoCard } from './ui/BentoGrid';
import { ThreeParticleField } from './ui/ThreeParticleField';

const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#0D9488',
  TypeScript: '#0284C7',
  JavaScript: '#D97706',
  HTML: '#E11D48',
  CSS: '#475569',
  Rust: '#EA580C',
  Go: '#0284C7',
  C: '#64748B',
  'C++': '#0284C7',
  Java: '#DC2626',
  Shell: '#65A30D',
  SQL: '#0D9488',
  Markdown: '#71717A',
};

const PALETTE_FALLBACK = [
  '#0284C7',
  '#0D9488',
  '#D97706',
  '#475569',
  '#E11D48',
  '#71717A',
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
  const baseInnerRadius = Math.max(34, 85 - ringCount * strokeWidth - (ringCount - 1) * ringGap);

  return (
    <div className="h-full p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6 sm:space-y-7 bg-zinc-50 dark:bg-[#0A0A0A] pb-24 transition-colors duration-200">
      {/* Magic UI Bento Grid Hub */}
      <BentoGrid>
        {/* Bento 1: Large Spatial Hero Card with ThreeUI Particle Field */}
        <BentoCard colSpan="md:col-span-3 lg:col-span-4" className="min-h-[220px] relative overflow-hidden">
          {/* Subtle ThreeUI 3D particle drift backdrop */}
          <ThreeParticleField count={380} className="opacity-60" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 ring-2 ring-teal-500/20" />
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-zinc-500 dark:text-zinc-400">
                  Universal AST Intelligence Engine
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-[#18191D] border border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300">
                  Live Sync
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {project.name}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                {project.description || 'Normalized AST repository with real-time Knowledge Graph indexing, downstream impact simulation, and automated architecture synthesis.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 relative z-10 w-full md:w-auto shrink-0">
              <button
                onClick={() => onNavigateTab('graph')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white dark:bg-[#141518] hover:bg-zinc-100 dark:hover:bg-[#1E2024] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-2xs hover:scale-[1.01]"
              >
                <Network className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Knowledge Graph</span>
              </button>
              <button
                onClick={() => onNavigateTab('diagrams')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white dark:bg-[#141518] hover:bg-zinc-100 dark:hover:bg-[#1E2024] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-2xs hover:scale-[1.01]"
              >
                <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Architecture</span>
              </button>
              <button
                onClick={() => onNavigateTab('impact')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs hover:scale-[1.01]"
              >
                <GitPullRequest className="w-4 h-4" />
                <span>Blast Radius</span>
              </button>
            </div>
          </div>
        </BentoCard>

        {/* Bento 2: Total Source Files */}
        <BentoCard colSpan="md:col-span-1 lg:col-span-1" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
              Source Files
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-sky-600 dark:text-sky-400">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight font-mono">
              {totalFiles.toLocaleString()}
            </p>
            <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
              <span>Fully Indexed ASTs</span>
              <span className="font-mono text-[10px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.2 rounded border border-teal-200 dark:border-teal-800/50">
                100% Bound
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Bento 3: Lines of Code (LOC) */}
        <BentoCard colSpan="md:col-span-1 lg:col-span-1" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
              Lines of Code
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight font-mono">
              {totalLines.toLocaleString()}
            </p>
            <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
              <span>Analyzed Codebase</span>
              <span className="font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/40 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700/50">
                AST Tokens
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Bento 4: Codebase Health Score */}
        <BentoCard colSpan="md:col-span-1 lg:col-span-1" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
              Security Health
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 text-teal-600 dark:text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline space-x-1">
              <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight font-mono">
                {security.health_score}
              </p>
              <span className="text-xs text-zinc-400 font-mono">/ 100</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
              <span>Grade {security.security_grade} Compliance</span>
              <span className="font-mono text-[10px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.2 rounded border border-teal-200 dark:border-teal-800/50">
                {security.health_score >= 80 ? 'Optimal' : 'Action Req'}
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Bento 5: Technical Debt */}
        <BentoCard colSpan="md:col-span-1 lg:col-span-1" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
              Technical Debt
            </span>
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight font-mono">
              {security.technical_debt_hours}h
            </p>
            <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
              <span>Remediation Effort</span>
              <span className="font-mono text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/[0.08]">
                Auto Solvable
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Bento 6: Language Breakdown (Bklit UI Ring Chart) */}
        <BentoCard colSpan="md:col-span-3 lg:col-span-2" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <Code2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Language Composition
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Polyglot AST parsing distribution</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300">
              {primaryLang}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            <div className="flex justify-center items-center shrink-0">
              <RingChart
                data={ringData}
                size={190}
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
                  valueClassName="text-xl font-bold text-zinc-900 dark:text-white tracking-tight font-mono"
                  labelClassName="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5"
                />
              </RingChart>
            </div>

            <div className="flex-1 w-full space-y-1.5 custom-scrollbar max-h-48 overflow-y-auto pr-1">
              {ringData.map((d, idx) => {
                const isHovered = hoveredLangIndex === idx;
                const isFaded = hoveredLangIndex !== null && !isHovered;
                return (
                  <div
                    key={d.label}
                    onMouseEnter={() => setHoveredLangIndex(idx)}
                    onMouseLeave={() => setHoveredLangIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all duration-150 cursor-pointer ${
                      isHovered
                        ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] shadow-2xs'
                        : isFaded
                        ? 'opacity-40 border border-transparent'
                        : 'hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{d.label}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400">
                      {d.value}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </BentoCard>

        {/* Bento 7: Security Audit Findings & Health Breakdown */}
        <BentoCard colSpan="md:col-span-3 lg:col-span-2" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Security & Code Smells
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">AST cyclomatic heuristics & vulnerability scan</p>
            </div>
            <button
              onClick={() => onNavigateTab('security')}
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View Audit</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Detected Vulnerabilities
                </p>
                {security.vulnerabilities.length > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                )}
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight font-mono">
                {security.vulnerabilities.length}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {security.vulnerabilities.length > 0
                  ? 'Hardcoded secrets, injection vectors, or auth bypasses.'
                  : 'Zero high-severity vulnerabilities discovered.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Code Smells & Complexity
                </p>
                <TrendingUp className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight font-mono">
                {security.code_smells.length}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {security.code_smells.length > 0
                  ? 'High cyclomatic complexity and duplicate symbol logic.'
                  : 'Clean modular architecture with minimal debt.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-white/[0.08] flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Maintainability Rating: <strong className="text-zinc-900 dark:text-zinc-100 font-bold font-mono">{security.maintainability_rating || 'A'}</strong></span>
            <span>Security Grade: <strong className="text-zinc-900 dark:text-zinc-100 font-bold font-mono">{security.security_grade || 'A'}</strong></span>
          </div>
        </BentoCard>

        {/* Bento 8: Quick Blast Radius Predictor Control */}
        <BentoCard colSpan="md:col-span-3 lg:col-span-4" className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 p-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-800 dark:text-zinc-200 shadow-2xs shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                Quick Change Impact Simulator
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                Calculate downstream breaking changes and affected endpoints prior to making code modifications.
              </p>
            </div>
          </div>

          <div className="relative w-full lg:w-auto shrink-0 pt-2 lg:pt-0" ref={impactDropdownRef}>
            <button
              type="button"
              onClick={() => setIsImpactDropdownOpen(!isImpactDropdownOpen)}
              className="w-full lg:w-80 flex items-center justify-between gap-3 bg-zinc-100 hover:bg-zinc-200/70 dark:bg-[#151619] dark:hover:bg-[#1E2024] border border-zinc-200 dark:border-white/[0.08] focus:border-zinc-400 dark:focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 shadow-2xs transition-all cursor-pointer font-mono"
            >
              <span className="truncate text-zinc-600 dark:text-zinc-300">
                Select File to Analyze Impact...
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isImpactDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Studio Dropup - Opens UPWARDS above the bottom bar */}
            {isImpactDropdownOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-full md:w-96 bg-white dark:bg-[#141518] border border-zinc-200 dark:border-white/[0.1] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in duration-100">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter project files..."
                    value={impactFileSearch}
                    onChange={(e) => setImpactFileSearch(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#18191D] border border-zinc-200 dark:border-white/[0.08] focus:border-zinc-400 dark:focus:border-zinc-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none font-mono"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {files.filter(f => f.path.toLowerCase().includes(impactFileSearch.toLowerCase())).length === 0 ? (
                    <div className="px-3 py-4 text-xs text-zinc-400 text-center font-mono">No files match "{impactFileSearch}"</div>
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
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">{f.path}</span>
                          <span className="text-[10px] text-zinc-400 font-sans ml-2 shrink-0">{f.lines} LOC</span>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </BentoCard>
      </BentoGrid>
    </div>
  );
};
