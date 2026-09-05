import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, Loader2, Layers, FileText, Database, Compass, BookOpen } from 'lucide-react';
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

  const formatInlineCode = (code: string) => {
    const trimmed = code.trim();
    const baseStyle = "font-family: 'JetBrains Mono', monospace; font-size: 0.82em; font-weight: 500; padding: 0.2rem 0.5rem; border-radius: 0.375rem; display: inline-block; vertical-align: middle; letter-spacing: -0.01em;";

    // HTTP methods & Status in API spec
    if (['GET', 'ACTIVE', '200 OK'].includes(trimmed)) {
      return `<code class="rich-badge-emerald" style="${baseStyle} color: #34D399 !important; background: rgba(52, 211, 153, 0.1) !important; border: 1px solid rgba(52, 211, 153, 0.25) !important;">${trimmed}</code>`;
    }
    if (['POST'].includes(trimmed)) {
      return `<code class="rich-badge-blue" style="${baseStyle} color: #60A5FA !important; background: rgba(96, 165, 250, 0.1) !important; border: 1px solid rgba(96, 165, 250, 0.25) !important;">${trimmed}</code>`;
    }
    if (['PUT', 'PATCH'].includes(trimmed)) {
      return `<code class="rich-badge-amber" style="${baseStyle} color: #FBBF24 !important; background: rgba(251, 191, 36, 0.1) !important; border: 1px solid rgba(251, 191, 36, 0.25) !important;">${trimmed}</code>`;
    }
    if (['DELETE'].includes(trimmed)) {
      return `<code class="rich-badge-rose" style="${baseStyle} color: #FB7185 !important; background: rgba(251, 113, 133, 0.1) !important; border: 1px solid rgba(251, 113, 133, 0.25) !important;">${trimmed}</code>`;
    }

    // Unified, Ice Platinum / Titanium Silver for all source paths, symbols, utilities, and components
    return `<code class="rich-code-token" style="${baseStyle} color: #E2E8F0 !important; background: #121316 !important; border: 1px solid rgba(255, 255, 255, 0.09) !important;">${trimmed}</code>`;
  };

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
      .replace(/`([^`\n]+)`/g, (_m, c) => formatInlineCode(c))
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');

    processed = processed.replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>');
    processed = processed.replace(/<\/ul>\s*<ul>/g, '');

    // Parse tables with proper thead (th) and tbody (td) inside a studio-grade container
    processed = processed.replace(/((?:^\|[^\n]+\|\r?\n?)+)/gm, (tableBlock) => {
      const lines = tableBlock.trim().split(/\r?\n/).filter(l => l.trim().startsWith('|'));
      if (lines.length === 0) return '';

      const parseCells = (line: string) => {
        return line
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map(c => c.trim());
      };

      const headerLine = lines[0];
      const hasSeparator = lines.length > 1 && lines[1].includes('---');
      const dataLines = hasSeparator ? lines.slice(2) : lines.slice(1);

      const headerHtml = parseCells(headerLine)
        .map(c => `<th>${c}</th>`)
        .join('');
      const thead = `<thead><tr>${headerHtml}</tr></thead>`;

      const bodyHtml = dataLines
        .map(line => {
          const cells = parseCells(line)
            .map(c => `<td>${c}</td>`)
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');
      const tbody = `<tbody>${bodyHtml}</tbody>`;

      return `<div class="table-container"><table>${thead}${tbody}</table></div>`;
    });

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
      {/* Selector Header: Studio-Grade Precision Control Bar */}
      <div className="bg-[#0D0E11] border border-white/[0.08] rounded-xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#151619] border border-white/[0.08] flex items-center justify-center text-indigo-400 shadow-inner">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              Automated Documentation Generator
              <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-md bg-[#151619] text-zinc-400 border border-white/[0.06]">
                1-Click Export
              </span>
            </h3>
            <p className="text-xs text-zinc-400 font-normal">Reverse engineered directly from Universal AST & Knowledge Graph</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Segmented Tab Control */}
          <div className="inline-flex items-center p-0.5 bg-[#151619] border border-white/[0.06] rounded-lg">
            {[
              { id: 'architecture', label: 'Architecture Blueprint', icon: Layers, color: '#38BDF8' },
              { id: 'api', label: 'REST API Spec', icon: FileText, color: '#C084FC' },
              { id: 'database', label: 'Database ERD', icon: Database, color: '#34D399' },
              { id: 'developer_guide', label: 'Developer Onboarding', icon: Compass, color: '#FBBF24' }
            ].map((tab) => {
              const isActive = activeDoc === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDoc(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#24262B] text-zinc-100 shadow-xs border border-white/[0.08]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Icon
                    className="w-3.5 h-3.5 transition-colors"
                    style={{ color: isActive ? tab.color : undefined }}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#151619] hover:bg-[#1E2024] border border-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 font-medium text-xs hover:bg-white border border-zinc-300 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown</span>
          </button>
        </div>
      </div>

      {/* Main Document Viewer */}
      <div className="flex-1 bg-[#0A0A0A] rounded-xl p-8 overflow-y-auto border border-white/[0.08] text-gray-200">
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
