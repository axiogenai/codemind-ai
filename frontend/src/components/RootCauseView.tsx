import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Search } from 'lucide-react';
import type { RootCauseTrace } from '../types';
import { analyzeRootCause } from '../services/api';

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
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Root Cause AI Engine</h2>
            <p className="text-xs text-neutral-400">Traces stack traces back through the dependency graph to recent commits and root causes.</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
        <label className="text-xs font-bold text-neutral-300 block">Paste Error Log or Stack Trace</label>
        <textarea
          rows={4}
          value={stackTrace}
          onChange={(e) => setStackTrace(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs text-white outline-none font-mono"
        />

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-neutral-100 text-neutral-900 hover:bg-white font-bold text-xs border border-neutral-300 transition-all cursor-pointer flex items-center space-x-2"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'Analyzing Trace...' : 'Trace Root Cause'}</span>
        </button>
      </div>

      {result && (
        <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Root Cause Diagnosis
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 font-bold block">Matched Function & File</span>
              <span className="text-neutral-200 font-mono mt-0.5 block">{result.matched_function} in {result.matched_file}</span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 font-bold block">Likely Root Cause</span>
              <p className="text-neutral-200 mt-1">{result.likely_root_cause}</p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 font-bold block">Related Commit</span>
              <span className="text-neutral-300 font-mono mt-0.5 block">{result.related_commit}</span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900 border border-emerald-900/50 text-emerald-300">
              <span className="font-bold block mb-1">Recommended Fix</span>
              <p>{result.recommended_fix}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
