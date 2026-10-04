import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import type { EngineeringScore } from '../types';
import { fetchEngineeringScore } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

interface Props {
  projectId?: string;
}

export const EngineeringScoreView: React.FC<Props> = ({ projectId }) => {
  const [scores, setScores] = useState<EngineeringScore | null>(null);

  useEffect(() => {
    fetchEngineeringScore(projectId).then(res => {
      setScores(res);
    });
  }, [projectId]);

  if (!scores) return <div className="p-8 text-xs text-zinc-500">Loading Engineering Intelligence Scores...</div>;

  const categories = [
    { label: 'Maintainability', value: scores.maintainability },
    { label: 'Architecture', value: scores.architecture },
    { label: 'Security', value: scores.security },
    { label: 'Scalability', value: scores.scalability },
    { label: 'Complexity Index', value: scores.complexity },
    { label: 'Documentation', value: scores.documentation },
    { label: 'Testing Coverage', value: scores.testing }
  ];

  return (
    <div className="h-[calc(100vh-4rem)] p-6 md:p-8 overflow-y-auto space-y-6 bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Engineering Intelligence Score</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Repository-wide quality assessment across 7 architectural dimensions.</p>
          </div>
        </div>

        <div className="px-6 py-3 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] text-right">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-mono font-bold block">Overall Score</span>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">{scores.overall} / 100</span>
        </div>
      </SpotlightCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categories.map((cat, idx) => (
          <SpotlightCard key={idx} className="p-5 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-zinc-800 dark:text-zinc-200">{cat.label}</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-mono">{cat.value} / 100</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 dark:bg-[#18191D] rounded-full overflow-hidden border border-zinc-200 dark:border-white/[0.04]">
              <div
                className="h-full bg-zinc-800 dark:bg-zinc-200 rounded-full transition-all duration-700"
                style={{ width: `${cat.value}%` }}
              />
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
};
