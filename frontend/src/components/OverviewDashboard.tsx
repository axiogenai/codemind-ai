import React from 'react';
import {
  FileCode,
  ShieldCheck,
  Zap,
  GitPullRequest,
  ArrowUpRight,
  Code2,
  Clock,
  Network
} from 'lucide-react';
import type { ProjectMeta, ProjectFile, SecurityReport } from '../types';
import type { ActiveTab } from './Sidebar';

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

  return (
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-8 bg-[#0A0A0A]">
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
        {/* Language Breakdown */}
        <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-neutral-300" />
              Language Composition
            </h3>
            <span className="text-xs font-bold text-gray-300">{primaryLang} Primary</span>
          </div>

          <div className="space-y-4">
            {Object.entries(project.languages || { [primaryLang]: 100 }).map(([lang, pct]) => (
              <div key={lang} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-300">{lang}</span>
                  <span className="text-gray-400">{pct}%</span>
                </div>
                <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-neutral-400 rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
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

      {/* Quick Change Impact Analyzer Trigger Bar */}
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Quick Blast Radius Predictor
          </h4>
          <p className="text-xs text-gray-400">Select any source file to calculate downstream breaking changes prior to deployment.</p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            onChange={(e) => {
              onSelectImpactTarget(e.target.value);
              onNavigateTab('impact');
            }}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none code-font"
          >
            <option value="">-- Select File to Analyze Impact --</option>
            {files.map((f) => (
              <option key={f.path} value={f.path}>
                {f.path}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
