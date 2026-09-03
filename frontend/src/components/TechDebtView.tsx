import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import type { TechDebtMetrics } from '../types';
import { fetchTechDebtMetrics } from '../services/api';

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
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Technical Debt Intelligence & ROI</h2>
            <p className="text-xs text-neutral-400">Calculates Technical Debt Index, fix hours, and prioritizes refactoring tasks by ROI.</p>
          </div>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-2">
              <span className="text-xs font-bold text-neutral-400 uppercase">Technical Debt Index</span>
              <p className="text-3xl font-black text-amber-400">{data.debt_score_pct}%</p>
            </div>

            <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-2">
              <span className="text-xs font-bold text-neutral-400 uppercase">Estimated Fix Time</span>
              <p className="text-3xl font-black text-white">{data.estimated_fix_hours} Hours</p>
            </div>

            <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-2">
              <span className="text-xs font-bold text-neutral-400 uppercase">Risk Rating</span>
              <p className="text-3xl font-black text-emerald-400">{data.risk_level}</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Highest ROI Refactoring Candidates
            </h3>

            <div className="space-y-3">
              {data.highest_roi_refactors.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{item.component}</h4>
                    <span className="text-xs font-bold text-emerald-400">{item.roi_rating}</span>
                  </div>
                  <p className="text-xs text-neutral-400">{item.impact_description}</p>
                  <span className="text-[10px] font-mono text-neutral-500 block">Requires ~{item.debt_hours} Hours</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
