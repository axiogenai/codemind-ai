import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Search } from 'lucide-react';
import type { RootCauseTrace } from '../types';
import { analyzeRootCause } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

interface Props {
  projectId?: string;
}

export const RootCauseView: React.FC<Props> = ({ projectId }) => {
  const [stackTrace, setStackTrace] = useState(
    `NullPointerException: Cannot read property 'get_project' of null\n  at main.py:65 in get_project()\n  at main.py:142 in execute_query_pipeline()`
  );
  const [result, setResult] = useState<RootCauseTrace | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const res = await analyzeRootCause(stackTrace, projectId);
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-6 md:p-8 overflow-y-auto space-y-6 bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Root Cause AI Engine</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Traces stack traces back through the dependency graph to recent commits and root causes.</p>
          </div>
        </div>
      </SpotlightCard>

      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-4">
        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Paste Error Log or Stack Trace</label>
        <textarea
          rows={4}
          value={stackTrace}
          onChange={(e) => setStackTrace(e.target.value)}
          className="w-full bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 text-xs text-zinc-900 dark:text-white outline-none font-mono"
        />

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold text-xs transition-all cursor-pointer flex items-center space-x-2 shadow-xs hover:scale-[1.01]"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'Analyzing Trace...' : 'Trace Root Cause'}</span>
        </button>
      </SpotlightCard>

      {result && (
        <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-zinc-700 dark:text-zinc-300" /> Root Cause Diagnosis
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06]">
              <span className="text-zinc-500 dark:text-zinc-400 font-bold block uppercase font-mono text-[10px]">Matched Function & File</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-mono mt-0.5 block">{result.matched_function} in {result.matched_file}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06]">
              <span className="text-zinc-500 dark:text-zinc-400 font-bold block uppercase font-mono text-[10px]">Likely Root Cause</span>
              <p className="text-zinc-800 dark:text-zinc-200 mt-1">{result.likely_root_cause}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06]">
              <span className="text-zinc-500 dark:text-zinc-400 font-bold block uppercase font-mono text-[10px]">Related Commit</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-mono mt-0.5 block">{result.related_commit}</span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-300 dark:border-white/[0.12] text-zinc-800 dark:text-zinc-200">
              <span className="font-bold block mb-1">Recommended Fix</span>
              <p>{result.recommended_fix}</p>
            </div>
          </div>
        </SpotlightCard>
      )}
    </div>
  );
};
