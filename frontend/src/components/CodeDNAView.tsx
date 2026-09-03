import React, { useEffect, useState } from 'react';
import { Dna, CheckCircle2, Award, Fingerprint } from 'lucide-react';
import type { CodeDNAData } from '../types';
import { fetchCodeDNA } from '../services/api';

interface Props {
  projectId?: string;
}

export const CodeDNAView: React.FC<Props> = ({ projectId }) => {
  const [dna, setDna] = useState<CodeDNAData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCodeDNA(projectId).then(data => {
      setDna(data);
      setLoading(false);
    });
  }, [projectId]);

  if (loading) {
    return <div className="p-8 text-neutral-400 text-xs">Loading Code DNA Fingerprint...</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <Dna className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              Semantic Code DNA Engine
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                {dna?.architecture_fingerprint}
              </span>
            </h2>
            <p className="text-xs text-neutral-400">Architectural fingerprinting, style profiling, and engineering maturity rating.</p>
          </div>
        </div>
        <div className="px-4 py-2 rounded-2xl bg-neutral-900 border border-neutral-800 text-right">
          <span className="text-[10px] text-neutral-400 uppercase font-bold block">Maturity Rating</span>
          <span className="text-lg font-black text-emerald-400">{dna?.maturity_score} / 100 ({dna?.maturity_level})</span>
        </div>
      </div>

      {/* DNA Attributes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-neutral-400" /> Architectural Attributes
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-neutral-400 block font-semibold">Coding Style</span>
              <p className="text-neutral-200 font-medium mt-0.5">{dna?.coding_style}</p>
            </div>
            <div>
              <span className="text-neutral-400 block font-semibold">Architecture Philosophy</span>
              <p className="text-neutral-200 font-medium mt-0.5">{dna?.architecture_philosophy}</p>
            </div>
            <div>
              <span className="text-neutral-400 block font-semibold">Naming Conventions</span>
              <p className="text-neutral-200 font-mono mt-0.5 text-[11px]">{dna?.naming_conventions}</p>
            </div>
            <div>
              <span className="text-neutral-400 block font-semibold">Error Handling Strategy</span>
              <p className="text-neutral-200 font-medium mt-0.5">{dna?.error_handling_strategy}</p>
            </div>
          </div>
        </div>

        {/* Patterns & Recommendations */}
        <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-neutral-400" /> Detected Design Patterns
          </h3>
          <div className="flex flex-wrap gap-2">
            {dna?.design_patterns.map((pattern, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-200">
                {pattern}
              </span>
            ))}
          </div>

          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pt-4 border-t border-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Recommendations
          </h3>
          <ul className="space-y-2 text-xs">
            {dna?.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-center gap-2 text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
