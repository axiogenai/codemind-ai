import React, { useState, useEffect } from 'react';
import { Award, Download, Copy, Check, Loader2, FileCheck2, Cpu } from 'lucide-react';
import { fetchPatentSpec } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

interface PatentGeneratorViewProps {
  projectId?: string;
}

export const PatentGeneratorView: React.FC<PatentGeneratorViewProps> = ({ projectId }) => {
  const [patentData, setPatentData] = useState<{ title: string; patent_id: string; markdown: string; metrics: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchPatentSpec(projectId).then(data => {
      if (isMounted) {
        setPatentData(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [projectId]);

  const handleCopy = () => {
    if (!patentData) return;
    navigator.clipboard.writeText(patentData.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!patentData) return;
    const element = document.createElement("a");
    const file = new Blob([patentData.markdown], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${patentData.patent_id || 'patent_specification'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-6 md:p-8 space-y-6 overflow-y-auto bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      {/* Header Banner */}
      <SpotlightCard className="p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-white/[0.06] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08] flex items-center gap-1.5 shadow-2xs font-mono">
              <Award className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              USPTO PATENT CLAIMS GENERATOR
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Patent Specification & Prior Art Matrix</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Automated Invention Specification & Patent Claims
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Synthesizes USPTO-compliant patent claims, Shannon structural entropy equations, and GNN topological novelty proofs directly from your reverse engineered codebase AST.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleCopy}
            disabled={loading || !patentData}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#151619] dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Claims Copied!' : 'Copy Specification'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={loading || !patentData}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50 shadow-xs hover:scale-[1.01]"
          >
            <Download className="w-4 h-4" />
            <span>Export Patent Specification</span>
          </button>
        </div>
      </SpotlightCard>

      {/* Telemetry Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SpotlightCard className="p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase font-mono">Patent App Ref</p>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5">{patentData?.patent_id || 'US-PAT-000000'}</p>
          </div>
          <FileCheck2 className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
        </SpotlightCard>

        <SpotlightCard className="p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase font-mono">Inventive Claims</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5">{patentData?.metrics?.claims_count || 20} Claims</p>
          </div>
          <Award className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
        </SpotlightCard>

        <SpotlightCard className="p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase font-mono">Shannon Entropy</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5">{patentData?.metrics?.shannon_entropy || 1.42} bits</p>
          </div>
          <Cpu className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
        </SpotlightCard>

        <SpotlightCard className="p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase font-mono">Indexed Symbol Nodes</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5">{patentData?.metrics?.total_symbols || 84}</p>
          </div>
          <Award className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
        </SpotlightCard>
      </div>

      {/* Main Patent Markdown Container */}
      <SpotlightCard className="p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-white/[0.08] space-y-6 shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-zinc-700 dark:text-zinc-300 animate-spin" />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Synthesizing USPTO Patent Specification & Prior Art Matrix...</span>
          </div>
        ) : (
          <article className="prose dark:prose-invert max-w-none text-xs">
            <div dangerouslySetInnerHTML={{ 
              __html: patentData?.markdown
                ?.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-white/[0.08] pb-2 mb-4">$1</h1>')
                ?.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-zinc-900 dark:text-white mt-6 mb-3 flex items-center gap-2">$1</h2>')
                ?.replace(/^### (.*$)/gim, '<h3 class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-4 mb-2">$1</h3>')
                ?.replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-900 dark:text-white font-bold">$1</strong>')
                ?.replace(/`([^`]+)`/g, '<code class="bg-zinc-100 dark:bg-[#121316] text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-[11px] font-mono border border-zinc-200 dark:border-white/[0.08]">$1</code>')
                ?.replace(/\n\n/g, '<br/><br/>') || ''
            }} />
          </article>
        )}
      </SpotlightCard>
    </div>
  );
};
