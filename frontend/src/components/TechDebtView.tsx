import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import type { TechDebtMetrics } from '../types';
import { fetchTechDebtMetrics } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

interface Props {
  projectId?: string;
}

export const TechDebtView: React.FC<Props> = ({ projectId }) => {
  const [data, setData] = useState<TechDebtMetrics | null>(null);

  useEffect(() => {
    fetchTechDebtMetrics(projectId).then(res => {
      setData(res);
    });
  }, [projectId]);

  return (
    <div className="h-[calc(100vh-4rem)] p-6 md:p-8 overflow-y-auto space-y-6 bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Technical Debt Intelligence & ROI</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Calculates Technical Debt Index, fix hours, and prioritizes refactoring tasks by ROI.</p>
          </div>
        </div>
      </SpotlightCard>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Technical Debt Index</span>
              <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{data.debt_score_pct}%</p>
            </SpotlightCard>

            <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Estimated Fix Time</span>
              <p className="text-3xl font-black text-zinc-900 dark:text-white">{data.estimated_fix_hours} Hours</p>
            </SpotlightCard>

            <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-2">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Risk Rating</span>
              <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{data.risk_level}</p>
            </SpotlightCard>
          </div>

          <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-700 dark:text-zinc-300" /> Highest ROI Refactoring Candidates
            </h3>

            <div className="space-y-3">
              {data.highest_roi_refactors.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#121316] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{item.component}</h4>
                    <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/[0.08] border border-zinc-300 dark:border-white/[0.12]">{item.roi_rating}</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{item.impact_description}</p>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block">Requires ~{item.debt_hours} Hours</span>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </>
      )}
    </div>
  );
};
