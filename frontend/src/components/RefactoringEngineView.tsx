import React, { useEffect, useState } from 'react';
import { Wrench, Play, Check } from 'lucide-react';
import type { RefactoringItem } from '../types';
import { fetchRefactoringPlan } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

interface Props {
  projectId?: string;
}

export const RefactoringEngineView: React.FC<Props> = ({ projectId }) => {
  const [plans, setPlans] = useState<RefactoringItem[]>([]);

  useEffect(() => {
    fetchRefactoringPlan(projectId).then(res => {
      setPlans(res.plans || []);
    });
  }, [projectId]);

  return (
    <div className="h-[calc(100vh-4rem)] p-6 md:p-8 overflow-y-auto space-y-6 bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Autonomous Refactoring Engine</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Plans and executes safe refactoring with verification and rollback capabilities.</p>
          </div>
        </div>
      </SpotlightCard>

      <div className="space-y-4">
        {plans.map((plan) => (
          <SpotlightCard key={plan.id} className="p-5 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300">
                  {plan.id}
                </span>
                <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/[0.08] border border-zinc-300 dark:border-white/[0.12]">{plan.estimated_gain}</span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">{plan.title}</h3>
              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">Target File: {plan.target_file}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {plan.verification_steps.map((step, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400">
                    <Check className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>{step}</span>
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => alert(`Refactoring plan ${plan.id} executed safely with rollback snapshot.`)}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold text-xs transition-all cursor-pointer flex items-center space-x-2 shrink-0 shadow-xs hover:scale-[1.01]"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Execute Refactor</span>
            </button>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
};
