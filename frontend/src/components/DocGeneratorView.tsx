import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, Loader2 } from 'lucide-react';
import { fetchDoc } from '../services/api';

interface DocGeneratorViewProps {
  projectId?: string;
}

export const DocGeneratorView: React.FC<DocGeneratorViewProps> = ({ projectId }) => {
  const [activeDoc, setActiveDoc] = useState<'architecture' | 'api' | 'database' | 'developer_guide'>('architecture');
  const [docContent, setDocContent] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const loadDoc = async (type: string) => {
    setLoading(true);
    const content = await fetchDoc(type, projectId);
    setDocContent(content);
    setLoading(false);
  };

  useEffect(() => {
    loadDoc(activeDoc);
  }, [activeDoc, projectId]);

  useEffect(() => {
    if (docContent) {
      import('mermaid').then(m => {
        m.default.initialize({ startOnLoad: false, theme: 'dark', themeVariables: { darkMode: true, background: '#0A0A0A', primaryColor: '#3B82F6' } });
        m.default.run({ querySelector: '.markdown-content .mermaid' }).catch(() => {});
      });
    }
  }, [docContent]);

  const renderMarkdown = (text: string) => {
    if (!text) return '';
    const mermaidBlocks: string[] = [];
    let processed = text.replace(/```mermaid\n([\s\S]*?)```/gm, (_match, code) => {
      const idx = mermaidBlocks.length;
      mermaidBlocks.push(code.trim());
      return `___MERMAID_BLOCK_${idx}___`;
    });

    processed = processed
      .replace(/```[a-z]*\n([\s\S]*?)```/gm, '<pre><code>$1</code></pre>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');

    processed = processed.replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>');
    processed = processed.replace(/<\/ul>\s*<ul>/g, '');

    processed = processed.replace(/^\|(.*)\|$/gm, (_match: string, p1: string) => {
      if (p1.includes('---')) return '';
      const cells = p1.split('|').map((c: string) => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    });
    processed = processed.replace(/(<tr>.*?<\/tr>)/gs, '<table>$1</table>');
    processed = processed.replace(/<\/table>\s*<table>/g, '');

    processed = processed.replace(/\n\n+/g, '</p><p>');

    // Re-insert clean Mermaid blocks
    mermaidBlocks.forEach((code, idx) => {
      processed = processed.replace(`___MERMAID_BLOCK_${idx}___`, `<div class="mermaid">${code}</div>`);
    });

    return processed;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(docContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([docContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeDoc}_documentation.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-6 space-y-6 flex flex-col">
      {/* Selector Header */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            Automated Documentation Generator
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              1-Click Export
            </span>
          </h3>
          <p className="text-xs text-gray-400">Reverse engineered directly from Universal AST & Knowledge Graph</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-gray-900/90 border border-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveDoc('architecture')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeDoc === 'architecture' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400'
              }`}
            >
              Architecture Blueprint
            </button>
            <button
              onClick={() => setActiveDoc('api')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeDoc === 'api' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-gray-400'
              }`}
            >
              REST API Spec
            </button>
            <button
              onClick={() => setActiveDoc('database')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeDoc === 'database' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-400'
              }`}
            >
              Database ERD
            </button>
            <button
              onClick={() => setActiveDoc('developer_guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeDoc === 'developer_guide' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-gray-400'
              }`}
            >
              Developer Onboarding
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-100 text-neutral-900 font-bold text-xs hover:bg-white border border-neutral-300 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Markdown</span>
          </button>
        </div>
      </div>

      {/* Main Document Viewer */}
      <div className="flex-1 bg-[#0A0A0A] rounded-2xl p-8 overflow-y-auto border border-neutral-800 text-gray-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-neutral-300 animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-white">Generating Universal Documentation</h4>
              <p className="text-xs text-gray-400">Synthesizing AST dependencies, APIs, and ERD relations...</p>
            </div>
          </div>
        ) : (
          <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(docContent) }} />
        )}
      </div>
    </div>
  );
};
