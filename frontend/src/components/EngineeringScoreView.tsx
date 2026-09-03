import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import type { EngineeringScore } from '../types';
import { fetchEngineeringScore } from '../services/api';

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

  if (!scores) return <div className="p-8 text-xs text-neutral-400">Loading Engineering Intelligence Scores...</div>;

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
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Engineering Intelligence Score</h2>
            <p className="text-xs text-neutral-400">Repository-wide quality assessment across 7 architectural dimensions.</p>
          </div>
        </div>

        <div className="px-6 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-right">
          <span className="text-xs text-neutral-400 uppercase font-bold block">Overall Score</span>
          <span className="text-3xl font-black text-emerald-400">{scores.overall} / 100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat, idx) => (
          <div key={idx} className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-neutral-300">{cat.label}</span>
              <span className="text-emerald-400">{cat.value} / 100</span>
            </div>
            <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-neutral-200 rounded-full transition-all duration-700"
                style={{ width: `${cat.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
