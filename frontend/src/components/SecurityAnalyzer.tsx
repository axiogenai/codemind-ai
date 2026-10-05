import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle, Bug, AlertTriangle } from 'lucide-react';
import type { SecurityReport } from '../types';
import { SpotlightCard } from './ui/SpotlightCard';

interface SecurityAnalyzerProps {
  security: SecurityReport;
}

export const SecurityAnalyzer: React.FC<SecurityAnalyzerProps> = ({ security }) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const allIssues = [...security.vulnerabilities, ...security.code_smells];

  const filteredIssues = filter === 'ALL'
    ? allIssues
    : allIssues.filter(i => (i.severity || 'MEDIUM').toUpperCase() === filter);

  const getSeverityBadgeClass = (severity?: string) => {
    const s = (severity || 'MEDIUM').toUpperCase();
    if (s === 'CRITICAL' || s === 'HIGH') {
      return 'bg-zinc-200 dark:bg-white/[0.12] text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-white/[0.16]';
    }
    if (s === 'MEDIUM') {
      return 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.08]';
    }
    return 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 overflow-y-auto bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      {/* Header Summary Panel */}
      <SpotlightCard className="p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 shadow-xs border border-zinc-200 dark:border-white/[0.08]">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.06]">
              <ShieldAlert className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
              AST Security & Code Smell Audit
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Security Grade: <span className="font-mono text-zinc-900 dark:text-zinc-100">{security.security_grade}</span>{' '}
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 font-mono">
              ({security.health_score}/100 Health Score)
            </span>
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Detected {security.vulnerabilities.length} vulnerabilities and {security.code_smells.length} code smells across the codebase, requiring an estimated {security.technical_debt_hours}h of technical remediation debt.
          </p>
        </div>

        <div className="flex items-center bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] px-5 py-3 rounded-xl shadow-2xs divide-x divide-zinc-200 dark:divide-white/[0.08] shrink-0">
          <div className="text-center pr-5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Vulnerabilities</p>
            <p className="text-xl font-mono font-bold mt-0.5 text-zinc-900 dark:text-zinc-100">
              {security.vulnerabilities.length}
            </p>
          </div>
          <div className="text-center pl-5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Code Smells</p>
            <p className="text-xl font-mono font-bold mt-0.5 text-zinc-900 dark:text-zinc-100">
              {security.code_smells.length}
            </p>
          </div>
        </div>
      </SpotlightCard>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-white/[0.08] pb-3">
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.06] rounded-xl gap-1 overflow-x-auto max-w-full custom-scrollbar">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-white dark:bg-[#24262B] text-zinc-900 dark:text-zinc-100 shadow-2xs border border-zinc-200 dark:border-white/[0.08]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          Showing {filteredIssues.length} of {allIssues.length} items
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <SpotlightCard className="p-12 rounded-2xl text-center space-y-3 shadow-xs border border-zinc-200 dark:border-white/[0.08]">
            <ShieldCheck className="w-10 h-10 text-teal-600 dark:text-teal-400 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">No Issues Found</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">No security vulnerabilities or code smells detected for filter '{filter}'.</p>
          </SpotlightCard>
        ) : (
          filteredIssues.map((issue, idx) => (
            <SpotlightCard
              key={idx}
              className="p-5 rounded-2xl space-y-3.5 border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.15] transition-all shadow-xs"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5">
                    {issue.type === 'vulnerability' ? (
                      <AlertTriangle className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                    ) : (
                      <Bug className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {issue.title}
                    </h4>
                    <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate">
                      {issue.file}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${getSeverityBadgeClass(issue.severity)}`}>
                  {(issue.severity || 'MEDIUM').toUpperCase()} SEVERITY
                </span>
              </div>

              {issue.recommendation && (
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#141518] border border-zinc-200 dark:border-white/[0.06] space-y-1.5 text-xs">
                  <div className="flex items-center space-x-2 text-zinc-800 dark:text-zinc-200 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>Remediation Recommendation</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 pl-5 leading-relaxed font-sans">
                    {issue.recommendation}
                  </p>
                </div>
              )}
            </SpotlightCard>
          ))
        )}
      </div>
    </div>
  );
};
