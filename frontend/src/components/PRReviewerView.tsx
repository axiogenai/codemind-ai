import React, { useState } from 'react';
import { GitPullRequest, Play } from 'lucide-react';
import type { PRReviewResult } from '../types';
import { reviewPullRequest } from '../services/api';

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
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <GitPullRequest className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Autonomous Pull Request Reviewer</h2>
            <p className="text-xs text-neutral-400">Evaluates PR intent, architectural consistency, security, performance, and merge conflicts.</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-300 block">PR Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-300 block">Git Diff</label>
          <textarea
            rows={3}
            value={diff}
            onChange={(e) => setDiff(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs text-white outline-none font-mono"
          />
        </div>

        <button
          onClick={handleReview}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-neutral-100 text-neutral-900 hover:bg-white font-bold text-xs border border-neutral-300 transition-all cursor-pointer flex items-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>{loading ? 'Reviewing PR...' : 'Run Autonomous PR Review'}</span>
        </button>
      </div>

      {review && (
        <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">{review.pr_title}</h3>
            <span className="text-xs font-black uppercase px-3 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              Verdict: {review.verdict}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 font-bold block">Intent Summary</span>
              <p className="text-neutral-200 mt-0.5">{review.intent_summary}</p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 font-bold block">Architectural Consistency</span>
              <p className="text-neutral-200 mt-0.5">{review.architectural_consistency}</p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 font-bold block">Merge Conflict Prediction</span>
              <p className="text-neutral-200 mt-0.5">{review.merge_conflict_prediction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
