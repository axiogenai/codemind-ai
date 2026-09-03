import React, { useState, useEffect } from 'react';
import { Award, Download, Copy, Check, Loader2, FileCheck2, Cpu } from 'lucide-react';
import { fetchPatentSpec } from '../services/api';

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
    <div className="h-[calc(100vh-4rem)] p-6 space-y-6 overflow-y-auto">
      {/* Header Banner */}
      <div className="glass-panel-glow p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-amber-500/40 relative overflow-hidden bg-gradient-to-r from-amber-950/30 via-purple-950/20 to-cyan-950/20">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center space-x-2.5">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-lg shadow-amber-500/10">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              USPTO PATENT CLAIMS GENERATOR
            </span>
            <span className="text-xs text-gray-400 font-mono">Patent Specification & Prior Art Matrix</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Automated Invention Specification & Patent Claims
          </h2>
          <p className="text-xs text-gray-300 max-w-2xl">
            Synthesizes USPTO-compliant patent claims, Shannon structural entropy equations, and GNN topological novelty proofs directly from your reverse engineered codebase AST.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10 shrink-0">
          <button
            onClick={handleCopy}
            disabled={loading || !patentData}
            className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 hover:border-amber-500/50 text-xs font-bold text-gray-200 hover:text-white transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copied ? 'Claims Copied!' : 'Copy Specification'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={loading || !patentData}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export Patent Specification</span>
          </button>
        </div>
      </div>

      {/* Telemetry Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400 font-bold uppercase">Patent App Ref</p>
            <p className="text-base font-black text-amber-300 code-font mt-0.5">{patentData?.patent_id || 'US-PAT-000000'}</p>
          </div>
          <FileCheck2 className="w-8 h-8 text-amber-400/80" />
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400 font-bold uppercase">Inventive Claims</p>
            <p className="text-xl font-black text-cyan-300 code-font mt-0.5">{patentData?.metrics?.claims_count || 20} Claims</p>
          </div>
          <Award className="w-8 h-8 text-cyan-400/80" />
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400 font-bold uppercase">Shannon Entropy</p>
            <p className="text-xl font-black text-purple-300 code-font mt-0.5">{patentData?.metrics?.shannon_entropy || 1.42} bits</p>
          </div>
          <Cpu className="w-8 h-8 text-purple-400/80" />
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400 font-bold uppercase">Indexed Symbol Nodes</p>
            <p className="text-xl font-black text-emerald-300 code-font mt-0.5">{patentData?.metrics?.total_symbols || 84}</p>
          </div>
          <Award className="w-8 h-8 text-emerald-400/80" />
        </div>
      </div>

      {/* Main Patent Markdown Container */}
      <div className="glass-panel p-8 rounded-3xl border border-gray-800 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
            <span className="text-xs font-bold text-amber-300">Synthesizing USPTO Patent Specification & Prior Art Matrix...</span>
          </div>
        ) : (
          <article className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-code:text-cyan-300 prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-800 text-xs">
            <div dangerouslySetInnerHTML={{ 
              __html: patentData?.markdown
                ?.replace(/^# (.*$)/gim, '<h1 class="text-xl font-black text-amber-300 border-b border-gray-800 pb-2 mb-4">$1</h1>')
                ?.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-white mt-6 mb-3 flex items-center gap-2">$1</h2>')
                ?.replace(/^### (.*$)/gim, '<h3 class="text-sm font-semibold text-cyan-300 mt-4 mb-2">$1</h3>')
                ?.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                ?.replace(/`([^`]+)`/g, '<code class="bg-gray-900 text-cyan-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-gray-800">$1</code>')
                ?.replace(/\n\n/g, '<br/><br/>') || ''
            }} />
          </article>
        )}
      </div>
    </div>
  );
};
