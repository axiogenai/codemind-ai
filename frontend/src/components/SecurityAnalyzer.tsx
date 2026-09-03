import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle, Bug } from 'lucide-react';
import type { SecurityReport } from '../types';

interface SecurityAnalyzerProps {
  security: SecurityReport;
}

export const SecurityAnalyzer: React.FC<SecurityAnalyzerProps> = ({ security }) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const allIssues = [...security.vulnerabilities, ...security.code_smells];

  const filteredIssues = filter === 'ALL'
    ? allIssues
    : allIssues.filter(i => (i.severity || 'MEDIUM').toUpperCase() === filter);

  // Dynamic color coding based on Security Grade
  const getGradeTheme = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A':
        return {
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-400'
        };
      case 'B':
        return {
          text: 'text-cyan-400',
          border: 'border-cyan-500/30',
          bg: 'bg-cyan-500/10',
          iconColor: 'text-cyan-400'
        };
      case 'C':
        return {
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/10',
          iconColor: 'text-amber-400'
        };
      case 'D':
      case 'F':
      default:
        return {
          text: 'text-rose-400',
          border: 'border-rose-500/30',
          bg: 'bg-rose-500/10',
          iconColor: 'text-rose-400'
        };
    }
  };

  const theme = getGradeTheme(security.security_grade);

  return (
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-8">
      {/* Header Summary Panel */}
      <div className={`glass-panel-glow p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 border ${theme.border}`}>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <ShieldAlert className={`w-5 h-5 ${theme.iconColor} ${security.vulnerabilities.length > 0 ? 'animate-pulse' : ''}`} />
            <span className={`text-xs font-extrabold uppercase tracking-widest ${theme.text}`}>AST Security & Code Smell Audit</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Security Grade: <span className={theme.text}>{security.security_grade}</span> ({security.health_score}/100)
          </h2>
          <p className="text-xs text-gray-300">
            Detected {security.vulnerabilities.length} security vulnerabilities and {security.code_smells.length} code smells requiring {security.technical_debt_hours} technical debt hours.
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-gray-900/90 border border-gray-800 p-4 rounded-2xl">
          <div className="text-center px-3">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Vulnerabilities</p>
            <p className={`text-2xl font-black ${security.vulnerabilities.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {security.vulnerabilities.length}
            </p>
          </div>
          <div className="h-8 w-[1px] bg-gray-800" />
          <div className="text-center px-3">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Code Smells</p>
            <p className={`text-2xl font-black ${security.code_smells.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {security.code_smells.length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center space-x-2">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-gray-400 hover:bg-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">No Issues Found</h4>
            <p className="text-xs text-gray-400">No security vulnerabilities or code smells detected for filter '{filter}'.</p>
          </div>
        ) : (
          filteredIssues.map((issue, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-3xl border border-gray-800 space-y-4 hover:border-rose-500/40 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${issue.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <Bug className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{issue.title}</h4>
                    <p className="text-xs font-mono text-cyan-400">{issue.file}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
                    (issue.severity || 'MEDIUM') === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {issue.severity || 'MEDIUM'} SEVERITY
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Remediation Strategy:</span>
                </div>
                <p className="text-gray-300 pl-6">{issue.recommendation}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
