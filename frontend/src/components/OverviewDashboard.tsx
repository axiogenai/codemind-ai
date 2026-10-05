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
import type { RingData } from './charts/ring-context';
import { BentoGrid, BentoCard } from './ui/BentoGrid';
import { PredictiveArcCanvas } from './effects/predictive-arc/PredictiveArcCanvas';

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




  return (
    <div className="h-full p-3.5 sm:p-5 lg:p-6 overflow-y-auto space-y-4 sm:space-y-4.5 bg-zinc-50 dark:bg-[#0A0A0A] pb-16 transition-colors duration-200">
      {/* Magic UI Bento Grid Hub */}
      <BentoGrid className="gap-3.5 sm:gap-4">
        {/* Bento 1: Large Spatial Hero Card with Signal Particles Animation */}
        <BentoCard colSpan="md:col-span-3 lg:col-span-4" className="!p-4 sm:!p-4.5 relative overflow-hidden">
          {/* Signal Particles wave matrix animation from scan page */}
          <PredictiveArcCanvas
            variant="signal-particles"
            speed={1.00}
            hue={0}
            saturation={1.00}
            brightness={1.00}
            className="opacity-40"
          />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10 min-w-0">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono text-zinc-700 dark:text-zinc-200 truncate">
                  Universal AST Intelligence Engine
                </span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-zinc-200/90 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 shrink-0 whitespace-nowrap">
                  Live Sync
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight truncate">
                {project.name}
              </h1>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal line-clamp-2">
                {project.description || 'Normalized AST repository with real-time Knowledge Graph indexing, downstream impact simulation, and automated architecture synthesis.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={() => onNavigateTab('graph')}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-[#141518] hover:bg-zinc-100 dark:hover:bg-[#1E2024] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs outline-none focus:outline-none focus:ring-0 select-none whitespace-nowrap"
              >
                <Network className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>Knowledge Graph</span>
              </button>
              <button
                onClick={() => onNavigateTab('diagrams')}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-[#141518] hover:bg-zinc-100 dark:hover:bg-[#1E2024] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs outline-none focus:outline-none focus:ring-0 select-none whitespace-nowrap"
              >
                <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Architecture</span>
              </button>
              <button
                onClick={() => onNavigateTab('impact')}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs outline-none focus:outline-none focus:ring-0 select-none whitespace-nowrap"
              >
                <GitPullRequest className="w-4 h-4 shrink-0" />
                <span>Blast Radius</span>
              </button>
            </div>
          </div>
        </BentoCard>

        {/* Bento 2: Total Source Files */}
        <BentoCard colSpan="md:col-span-1 lg:col-span-1" className="space-y-2.5 !p-4">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono truncate">
              Source Files
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-sky-600 dark:text-sky-400 shrink-0">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight font-mono">
              {totalFiles.toLocaleString()}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal min-w-0">
              <span className="truncate">Fully Indexed ASTs</span>
              <span className="font-mono text-[10px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800/50 shrink-0 whitespace-nowrap">
                100% Bound
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Bento 3: Lines of Code (LOC) */}
        <BentoCard colSpan="md:col-span-1 lg:col-span-1" className="space-y-2.5 !p-4">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono truncate">
              Lines of Code
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 shrink-0">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight font-mono">
              {totalLines.toLocaleString()}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal min-w-0">
              <span className="truncate">Analyzed Codebase</span>
              <span className="font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/50 shrink-0 whitespace-nowrap">
                AST Tokens
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Bento 4: Codebase Health Score */}
        <BentoCard colSpan="md:col-span-1 lg:col-span-1" className="space-y-2.5 !p-4">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono truncate">
              Security Health
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 text-teal-600 dark:text-teal-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight font-mono">
                {security.health_score}
              </p>
              <span className="text-xs text-zinc-400 font-mono">/ 100</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal min-w-0">
              <span className="truncate">Grade {security.security_grade} Compliance</span>
              <span className="font-mono text-[10px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800/50 shrink-0 whitespace-nowrap">
                {security.health_score >= 80 ? 'Optimal' : 'Action Req'}
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Bento 5: Technical Debt */}
        <BentoCard colSpan="md:col-span-1 lg:col-span-1" className="space-y-2.5 !p-4">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono truncate">
              Technical Debt
            </span>
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight font-mono">
              {security.technical_debt_hours}h
            </p>
            <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal min-w-0">
              <span className="truncate">Remediation Effort</span>
              <span className="font-mono text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/[0.08] shrink-0 whitespace-nowrap">
                Auto Solvable
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Bento 6: Language Breakdown — Donut + Bar Legend */}
        <BentoCard colSpan="md:col-span-3 lg:col-span-2" className="space-y-3 !p-4 sm:!p-4.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <Code2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="truncate">Language Composition</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Polyglot AST parsing distribution</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 shrink-0 whitespace-nowrap">
              {primaryLang}
            </span>
          </div>

          {/* Body: donut left, bars right */}
          <div className="flex flex-col sm:flex-row items-center gap-4">

            {/* Custom SVG Donut — single ring, colored segments */}
            {(() => {
              const size = 140;
              const cx = size / 2;
              const cy = size / 2;
              const R = 52;
              const strokeW = 18;
              const circumference = 2 * Math.PI * R;
              const topLangs = ringData.slice(0, 8);
              const total = topLangs.reduce((s, d) => s + d.value, 0) || 1;
              const gapDeg = 2.5;
              const gapFrac = gapDeg / 360;
              let cursor = -0.25; // start at top (−90°)

              return (
                <div className="relative shrink-0" style={{ width: size, height: size }}>
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
                    {/* Track ring */}
                    <circle
                      cx={cx} cy={cy} r={R}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={strokeW}
                      className="text-zinc-200 dark:text-white/[0.10]"
                    />
                    {/* Colored segments */}
                    {topLangs.map((d, i) => {
                      const frac = (d.value / total) * (1 - gapFrac * topLangs.length);
                      const start = cursor * circumference;
                      const dash = frac * circumference;
                      const gap = circumference - dash;
                      cursor += frac + gapFrac;
                      return (
                        <circle
                          key={d.label}
                          cx={cx} cy={cy} r={R}
                          fill="none"
                          stroke={d.color}
                          strokeWidth={strokeW}
                          strokeDasharray={`${dash} ${gap}`}
                          strokeDashoffset={-start}
                          strokeLinecap="round"
                          style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(-90deg)` }}
                          opacity={hoveredLangIndex === null || hoveredLangIndex === i ? 1 : 0.25}
                        />
                      );
                    })}
                  </svg>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-extrabold text-zinc-900 dark:text-white font-mono leading-none">
                      {hoveredLangIndex !== null ? `${ringData[hoveredLangIndex]?.value}%` : `${ringData[0]?.value ?? 100}%`}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                      {hoveredLangIndex !== null ? ringData[hoveredLangIndex]?.label : primaryLang}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Language bar rows */}
            <div className="flex-1 w-full min-w-0 space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-0.5">
              {ringData.map((d, idx) => {
                const isHovered = hoveredLangIndex === idx;
                const isFaded = hoveredLangIndex !== null && !isHovered;
                return (
                  <div
                    key={d.label}
                    onMouseEnter={() => setHoveredLangIndex(idx)}
                    onMouseLeave={() => setHoveredLangIndex(null)}
                    className={`group cursor-pointer transition-opacity duration-150 ${isFaded ? 'opacity-30' : 'opacity-100'}`}
                  >
                    {/* Label row */}
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{d.label}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold shrink-0 ml-3" style={{ color: d.color }}>
                        {d.value}%
                      </span>
                    </div>
                    {/* Fill bar */}
                    <div className="w-full h-1 rounded-full bg-zinc-200 dark:bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(d.value / (ringData[0]?.value || 1)) * 100}%`,
                          backgroundColor: d.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </BentoCard>


        {/* Bento 7: Security Audit Findings & Health Breakdown */}
        <BentoCard colSpan="md:col-span-3 lg:col-span-2" className="space-y-3.5 !p-4 sm:!p-4.5">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="truncate">Security &amp; Code Smells</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">AST cyclomatic heuristics &amp; vulnerability scan</p>
            </div>
            <button
              onClick={() => onNavigateTab('security')}
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
            >
              <span>View Audit</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] space-y-1.5 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                  Detected Vulnerabilities
                </p>
                {security.vulnerabilities.length > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-zinc-600 dark:text-zinc-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
                )}
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight font-mono">
                {security.vulnerabilities.length}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                {security.vulnerabilities.length > 0
                  ? 'Hardcoded secrets, injection vectors, or auth bypasses.'
                  : 'Zero high-severity vulnerabilities discovered.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] space-y-1.5 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                  Code Smells & Complexity
                </p>
                <TrendingUp className="w-4 h-4 text-zinc-600 dark:text-zinc-400 shrink-0" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight font-mono">
                {security.code_smells.length}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                {security.code_smells.length > 0
                  ? 'High cyclomatic complexity and duplicate symbol logic.'
                  : 'Clean modular architecture with minimal debt.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-white/[0.08] flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
            <span className="truncate">Maintainability: <strong className="text-zinc-900 dark:text-zinc-100 font-bold font-mono">{security.maintainability_rating || 'A'}</strong></span>
            <span className="shrink-0">Grade: <strong className="text-zinc-900 dark:text-zinc-100 font-bold font-mono">{security.security_grade || 'A'}</strong></span>
          </div>
        </BentoCard>

        {/* Bento 8: Quick Blast Radius Predictor Control */}
        <BentoCard colSpan="md:col-span-3 lg:col-span-4" className="!p-0 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center">
            {/* Left: Info section */}
            <div className="flex items-center gap-3.5 px-4 sm:px-5 py-4 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-800 dark:text-zinc-200 shadow-2xs shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                  Quick Change Impact Simulator
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 line-clamp-1">
                  Calculate downstream breaking changes and affected endpoints prior to making code modifications.
                </p>
              </div>
            </div>

            {/* Divider: horizontal on mobile, vertical on desktop */}
            <div className="h-px lg:h-auto lg:w-px bg-zinc-200 dark:bg-white/[0.08] mx-0 lg:mx-0 lg:self-stretch" />

            {/* Right: Selector section */}
            <div className="px-4 sm:px-5 py-4 lg:w-96 shrink-0" ref={impactDropdownRef}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsImpactDropdownOpen(!isImpactDropdownOpen)}
                  className="w-full flex items-center justify-between gap-3 bg-zinc-100 hover:bg-zinc-200/70 dark:bg-[#151619] dark:hover:bg-[#1E2024] border border-zinc-200 dark:border-white/[0.08] focus:border-zinc-400 dark:focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 shadow-2xs transition-all cursor-pointer font-mono"
                >
                  <span className="truncate text-zinc-600 dark:text-zinc-300">
                    Select File to Analyze Impact...
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isImpactDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropup - Opens UPWARDS above the bottom bar */}
                {isImpactDropdownOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-full min-w-72 bg-white dark:bg-[#141518] border border-zinc-200 dark:border-white/[0.1] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in duration-100">
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
            </div>
          </div>
        </BentoCard>
      </BentoGrid>
    </div>
  );
};
