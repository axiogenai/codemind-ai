import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, Loader2, Layers, FileText, Database, Compass, BookOpen } from 'lucide-react';
import { fetchDoc } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { SpotlightCard } from './ui/SpotlightCard';

interface DocGeneratorViewProps {
  projectId?: string;
}

export const DocGeneratorView: React.FC<DocGeneratorViewProps> = ({ projectId }) => {
  const { isDarkMode } = useTheme();
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
        m.default.initialize({
          startOnLoad: false,
          theme: 'base',
          flowchart: {
            diagramPadding: 24,
            nodeSpacing: 28,
            rankSpacing: 22,
            htmlLabels: false,
            curve: 'linear'
          },
          themeVariables: isDarkMode ? {
            darkMode: true,
            background: 'transparent',
            mainBkg: '#141518',
            clusterBkg: 'rgba(255, 255, 255, 0.02)',
            clusterBorder: '#27272A',
            nodeBorder: '#3F3F46',
            lineColor: '#71717A',
            textColor: '#E4E4E7',
            primaryColor: '#18191E',
            primaryTextColor: '#E4E4E7',
            primaryBorderColor: '#3F3F46'
          } : {
            darkMode: false,
            background: 'transparent',
            mainBkg: '#F8FAFC',
            clusterBkg: 'rgba(0, 0, 0, 0.01)',
            clusterBorder: '#E2E8F0',
            nodeBorder: '#CBD5E1',
            lineColor: '#64748B',
            textColor: '#0F172A',
            primaryColor: '#F8FAFC',
            primaryTextColor: '#0F172A',
            primaryBorderColor: '#CBD5E1'
          }
        });
        m.default.run({ querySelector: '.markdown-content .mermaid' }).catch(() => {});
      });
    }
  }, [docContent, isDarkMode]);

  const formatInlineCode = (code: string) => {
    const trimmed = code.trim();
    const baseStyle = "font-family: 'JetBrains Mono', monospace; font-size: 0.82em; font-weight: 600; padding: 0.18rem 0.45rem; border-radius: 0.375rem; display: inline-block; vertical-align: middle;";

    // HTTP methods & Status in API spec
    if (['GET', 'ACTIVE', '200 OK'].includes(trimmed)) {
      return `<code class="rich-badge-teal" style="${baseStyle} color: ${isDarkMode ? '#2DD4BF' : '#0D9488'} !important; background: ${isDarkMode ? 'rgba(45, 212, 191, 0.12)' : 'rgba(13, 148, 136, 0.1)'} !important; border: 1px solid ${isDarkMode ? 'rgba(45, 212, 191, 0.3)' : 'rgba(13, 148, 136, 0.25)'} !important;">${trimmed}</code>`;
    }
    if (['POST'].includes(trimmed)) {
      return `<code class="rich-badge-sky" style="${baseStyle} color: ${isDarkMode ? '#38BDF8' : '#0284C7'} !important; background: ${isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.1)'} !important; border: 1px solid ${isDarkMode ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.25)'} !important;">${trimmed}</code>`;
    }
    if (['PUT', 'PATCH'].includes(trimmed)) {
      return `<code class="rich-badge-slate" style="${baseStyle} color: ${isDarkMode ? '#E4E4E7' : '#3F3F46'} !important; background: ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(113, 113, 122, 0.1)'} !important; border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(113, 113, 122, 0.25)'} !important;">${trimmed}</code>`;
    }
    if (['DELETE'].includes(trimmed)) {
      return `<code class="rich-badge-rose" style="${baseStyle} color: ${isDarkMode ? '#FB7185' : '#E11D48'} !important; background: ${isDarkMode ? 'rgba(251, 113, 133, 0.12)' : 'rgba(225, 29, 72, 0.1)'} !important; border: 1px solid ${isDarkMode ? 'rgba(251, 113, 133, 0.3)' : 'rgba(225, 29, 72, 0.25)'} !important;">${trimmed}</code>`;
    }

    // Default code token
    return `<code class="rich-code-token" style="${baseStyle} color: ${isDarkMode ? '#E4E4E7' : '#27272A'} !important; background: ${isDarkMode ? '#18181B' : '#F4F4F5'} !important; border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} !important;">${trimmed}</code>`;
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

    // Parse tables with proper thead (th) and tbody (td)
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

    // Re-insert clean Mermaid blocks with blueprint container
    mermaidBlocks.forEach((code, idx) => {
      processed = processed.replace(
        `___MERMAID_BLOCK_${idx}___`,
        `<div class="mermaid-blueprint-card my-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#111215]/80 p-5 shadow-xs overflow-x-auto"><div class="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-zinc-200/80 dark:border-white/[0.06]"><span class="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">Interactive Architectural Blueprint</span><span class="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Mermaid SVG</span></div><div class="mermaid flex justify-center py-2">${code}</div></div>`
      );
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
    <div className="h-[calc(100vh-4rem)] p-6 space-y-6 flex flex-col bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      {/* Selector Header: Studio-Grade Precision Control Bar */}
      <SpotlightCard className="p-5 md:p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-2xs shrink-0">
            <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              Automated Documentation Engine
              <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#151619] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.06]">
                Universal AST
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Reverse engineered directly from Universal AST & Knowledge Graph</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1 xl:pt-0">
          {/* Segmented Tab Control */}
          <div className="inline-flex items-center p-1 bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.06] rounded-xl gap-1">
            {[
              { id: 'architecture', label: 'Architecture Blueprint', icon: Layers },
              { id: 'api', label: 'REST API Spec', icon: FileText },
              { id: 'database', label: 'Database ERD', icon: Database },
              { id: 'developer_guide', label: 'Developer Onboarding', icon: Compass }
            ].map((tab) => {
              const isActive = activeDoc === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDoc(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-white dark:bg-[#24262B] text-zinc-900 dark:text-zinc-100 shadow-2xs border border-zinc-200 dark:border-white/[0.08]'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#151619] hover:bg-zinc-100 dark:hover:bg-[#1E2024] border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs border border-transparent transition-colors cursor-pointer shadow-xs outline-none focus:outline-none focus:ring-0 select-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Markdown</span>
            </button>
          </div>
        </div>
      </SpotlightCard>

      {/* Main Document Viewer */}
      <div className="flex-1 bg-white dark:bg-[#0A0A0A] rounded-2xl p-8 overflow-y-auto border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 shadow-xs custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-zinc-600 dark:text-zinc-300 animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Generating Universal Documentation</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Synthesizing AST dependencies, APIs, and ERD relations...</p>
            </div>
          </div>
        ) : (
          <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(docContent) }} />
        )}
      </div>
    </div>
  );
};
