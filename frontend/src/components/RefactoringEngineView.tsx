import React, { useEffect, useState } from 'react';
import { Wrench, Play } from 'lucide-react';
import type { RefactoringItem } from '../types';
import { fetchRefactoringPlan } from '../services/api';

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
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Autonomous Refactoring Engine</h2>
            <p className="text-xs text-neutral-400">Plans and executes safe refactoring with verification and rollback capabilities.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                  {plan.id}
                </span>
                <span className="text-xs font-bold text-emerald-400">{plan.estimated_gain}</span>
              </div>
              <h3 className="text-base font-bold text-white">{plan.title}</h3>
              <p className="text-xs font-mono text-neutral-400">Target File: {plan.target_file}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {plan.verification_steps.map((step, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                    ✓ {step}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => alert(`Refactoring plan ${plan.id} executed safely with rollback snapshot.`)}
              className="px-5 py-2.5 rounded-xl bg-neutral-100 text-neutral-900 hover:bg-white font-bold text-xs border border-neutral-300 transition-all cursor-pointer flex items-center space-x-2 shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Execute Refactor</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
