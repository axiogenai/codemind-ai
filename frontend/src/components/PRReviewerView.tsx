import React, { useState } from 'react';
import { GitPullRequest, Play } from 'lucide-react';
import type { PRReviewResult } from '../types';
import { reviewPullRequest } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

interface Props {
  projectId?: string;
}

export const PRReviewerView: React.FC<Props> = ({ projectId }) => {
  const [title, setTitle] = useState('feat: Upgrade GNN Physics & Add Next-Gen Intelligence Suite');
  const [diff, setDiff] = useState('+ export const CodeDNAView = ...\n+ export const PRReviewerView = ...');
  const [review, setReview] = useState<PRReviewResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReview = async () => {
    setLoading(true);
    const res = await reviewPullRequest(title, diff, projectId);
    setReview(res);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-6 md:p-8 overflow-y-auto space-y-6 bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
            <GitPullRequest className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Autonomous Pull Request Reviewer</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Evaluates PR intent, architectural consistency, security, performance, and merge conflicts.</p>
          </div>
        </div>
      </SpotlightCard>

      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">PR Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs text-zinc-900 dark:text-white outline-none font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Git Diff</label>
          <textarea
            rows={3}
            value={diff}
            onChange={(e) => setDiff(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 text-xs text-zinc-900 dark:text-white outline-none font-mono"
          />
        </div>

        <button
          onClick={handleReview}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold text-xs transition-all cursor-pointer flex items-center space-x-2 shadow-xs hover:scale-[1.01]"
        >
          <Play className="w-4 h-4" />
          <span>{loading ? 'Reviewing PR...' : 'Run Autonomous PR Review'}</span>
        </button>
      </SpotlightCard>

      {review && (
        <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">{review.pr_title}</h3>
            <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08]">
              Verdict: {review.verdict}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06]">
              <span className="text-zinc-500 dark:text-zinc-400 font-bold block uppercase font-mono text-[10px]">Intent Summary</span>
              <p className="text-zinc-800 dark:text-zinc-200 mt-0.5">{review.intent_summary}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06]">
              <span className="text-zinc-500 dark:text-zinc-400 font-bold block uppercase font-mono text-[10px]">Architectural Consistency</span>
              <p className="text-zinc-800 dark:text-zinc-200 mt-0.5">{review.architectural_consistency}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06]">
              <span className="text-zinc-500 dark:text-zinc-400 font-bold block uppercase font-mono text-[10px]">Merge Conflict Prediction</span>
              <p className="text-zinc-800 dark:text-zinc-200 mt-0.5">{review.merge_conflict_prediction}</p>
            </div>
          </div>
        </SpotlightCard>
      )}
    </div>
  );
};
