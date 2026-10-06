import React, { useState, useEffect, useRef, useId, useMemo } from 'react';
import mermaid from 'mermaid';
import {
  Download, Copy, Check, Loader2, Layers, FileText, Database, Compass, BookOpen,
  ZoomIn, ZoomOut, RotateCcw, Move
} from 'lucide-react';
import { fetchDoc } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { SpotlightCard } from './ui/SpotlightCard';

interface DocGeneratorViewProps {
  projectId?: string;
}

interface MermaidDiagramBlockProps {
  code: string;
  isDarkMode: boolean;
}

const MermaidDiagramBlock: React.FC<MermaidDiagramBlockProps> = ({ code, isDarkMode }) => {
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });
  const diagramId = useId().replace(/[^a-zA-Z0-9]/g, '');

  // Sanitize code to ensure zero label collisions, fix clipped subgraph text, and remove banned colors
  const sanitizedCode = useMemo(() => {
    let cleaned = code;

    // 1. Replace banned colors (violet, emerald green, neon blue) with titanium neutrals
    cleaned = cleaned.replace(/#0284c7/gi, isDarkMode ? '#F4F4F5' : '#18181B');
    cleaned = cleaned.replace(/#38bdf8/gi, isDarkMode ? '#71717A' : '#52525B');
    cleaned = cleaned.replace(/#312e81/gi, isDarkMode ? '#18181B' : '#F4F4F5');
    cleaned = cleaned.replace(/#818cf8/gi, isDarkMode ? '#71717A' : '#52525B');
    cleaned = cleaned.replace(/#064e3b/gi, isDarkMode ? '#18181B' : '#F4F4F5');
    cleaned = cleaned.replace(/#10b981/gi, isDarkMode ? '#71717A' : '#52525B');
    cleaned = cleaned.replace(/#1e293b/gi, isDarkMode ? '#141416' : '#FFFFFF');

    // 2. Remove cross-subgraph edge labels that collide with subgraph headers in Dagre
    cleaned = cleaned.replace(/-->\|[^|]+\|/g, '-->');
    cleaned = cleaned.replace(/-\.->\|[^|]+\|/g, '-.->');

    // 3. Ensure subgraph titles contain layer purpose so edge labels aren't needed
    if (cleaned.includes('subgraph T2 ["2. API & Gateway Layer"]')) {
      cleaned = cleaned.replace('subgraph T2 ["2. API & Gateway Layer"]', 'subgraph T2 ["2. API & Gateway Layer (HTTP / REST)"]');
    }
    if (cleaned.includes('subgraph T3 ["3. Core Logic & Engines"]')) {
      cleaned = cleaned.replace('subgraph T3 ["3. Core Logic & Engines"]', 'subgraph T3 ["3. Core Logic & Engines (Service Dispatch)"]');
    }
    if (cleaned.includes('subgraph T4 ["4. AST & Data Store"]')) {
      cleaned = cleaned.replace('subgraph T4 ["4. AST & Data Store"]', 'subgraph T4 ["4. Data & AST Store (Queries & Persists)"]');
    }

    return cleaned;
  }, [code, isDarkMode]);

  useEffect(() => {
    let isSubscribed = true;
    const render = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          theme: 'base',
          flowchart: {
            diagramPadding: 24,
            nodeSpacing: 36,
            rankSpacing: 52,
            htmlLabels: true,
            curve: 'basis'
          },
          er: {
            diagramPadding: 20,
            layoutDirection: 'TB',
            minEntityWidth: 100,
            minEntityHeight: 75,
            entityPadding: 15,
            stroke: isDarkMode ? '#3F3F46' : '#E4E4E7',
            fill: isDarkMode ? '#141518' : '#FFFFFF',
            fontSize: 12
          },
          themeVariables: {
            darkMode: isDarkMode,
            background: 'transparent',
            mainBkg: isDarkMode ? '#141518' : '#FFFFFF',
            nodeBorder: isDarkMode ? '#3F3F46' : '#E4E4E7',
            clusterBkg: 'transparent',
            clusterBorder: isDarkMode ? '#3F3F46' : '#E4E4E7',
            lineColor: isDarkMode ? '#CBD5E1' : '#475569',
            textColor: isDarkMode ? '#E4E4E7' : '#0F172A',
            primaryColor: isDarkMode ? '#141518' : '#FFFFFF',
            primaryTextColor: isDarkMode ? '#E4E4E7' : '#0F172A',
            primaryBorderColor: isDarkMode ? '#3F3F46' : '#CBD5E1',
            secondaryColor: isDarkMode ? '#141518' : '#F4F4F5',
            secondaryTextColor: isDarkMode ? '#E4E4E7' : '#0F172A',
            secondaryBorderColor: isDarkMode ? '#3F3F46' : '#CBD5E1',
            tertiaryColor: isDarkMode ? '#141518' : '#F4F4F5',
            tertiaryTextColor: isDarkMode ? '#E4E4E7' : '#0F172A',
            tertiaryBorderColor: isDarkMode ? '#3F3F46' : '#CBD5E1',
            edgeLabelBackground: isDarkMode ? '#141518' : '#FFFFFF'
          }
        });

        const id = `mmd-${diagramId}-${Date.now()}`;
        const { svg } = await mermaid.render(id, sanitizedCode);
        if (!isSubscribed) return;

        // Clean up error divs from body
        document.querySelectorAll('[id^="dmermaid"], .error-icon, #mermaid-error').forEach(el => el.remove());

        // Inject scoped CSS styling for high-contrast, titanium precision
        const scopedCss = `
          #${id} {
            width: 100% !important;
            height: auto !important;
            max-width: none !important;
            display: block !important;
            margin: 0 auto !important;
          }
          #${id} .cluster rect, #${id} rect.cluster, #${id} g.cluster rect {
            fill: ${isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'} !important;
            stroke: ${isDarkMode ? '#3F3F46' : '#E4E4E7'} !important;
            stroke-width: 1.5px !important;
            stroke-dasharray: 4 4 !important;
            rx: 8px !important;
          }
          #${id} .cluster text, #${id} .cluster span, #${id} .cluster .nodeLabel {
            fill: ${isDarkMode ? '#A1A1AA' : '#52525B'} !important;
            color: ${isDarkMode ? '#A1A1AA' : '#52525B'} !important;
            font-weight: 700 !important;
            font-size: 11px !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
          }
          #${id} .node rect, #${id} .node circle, #${id} .node polygon {
            fill: ${isDarkMode ? '#141518' : '#FFFFFF'} !important;
            stroke: ${isDarkMode ? '#3F3F46' : '#D4D4D8'} !important;
            stroke-width: 1.6px !important;
            rx: 6px !important;
          }
          #${id} .node text, #${id} .node span, #${id} .node .nodeLabel {
            fill: ${isDarkMode ? '#F4F4F5' : '#09090B'} !important;
            color: ${isDarkMode ? '#F4F4F5' : '#09090B'} !important;
            font-size: 12px !important;
            font-weight: 500 !important;
          }
          #${id} .edgePath path, #${id} .flowchart-link, #${id} .relation, #${id} path.relation {
            stroke: ${isDarkMode ? '#CBD5E1' : '#475569'} !important;
            stroke-width: 2px !important;
            stroke-opacity: 0.95 !important;
          }
          #${id} .marker, #${id} marker path, #${id} .arrowheadPath {
            fill: ${isDarkMode ? '#CBD5E1' : '#475569'} !important;
            stroke: ${isDarkMode ? '#CBD5E1' : '#475569'} !important;
            stroke-width: 1.5px !important;
          }
          #${id} .edgeLabel text, #${id} .edgeLabel span {
            font-size: 10px !important;
            font-weight: 600 !important;
            fill: ${isDarkMode ? '#E4E4E7' : '#18181B'} !important;
            color: ${isDarkMode ? '#E4E4E7' : '#18181B'} !important;
          }
          #${id} text {
            font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important;
          }
        `;

        let cleanSvg = svg.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
          const cleanAttrs = attrs
            .replace(/\bstyle="[^"]*"/gi, '')
            .replace(/\bwidth="[^"]*"/gi, '')
            .replace(/\bheight="[^"]*"/gi, '');
          return `<svg ${cleanAttrs}><style>${scopedCss}</style>`;
        });

        setSvgHtml(cleanSvg);
      } catch (err) {
        console.error('Mermaid render error:', err);
      }
    };

    render();
    return () => { isSubscribed = false; };
  }, [sanitizedCode, isDarkMode, diagramId]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: panStartRef.current.x + (e.clientX - dragStartRef.current.x),
      y: panStartRef.current.y + (e.clientY - dragStartRef.current.y)
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch pan & pinch-to-zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: panStartRef.current.x + (e.touches[0].clientX - dragStartRef.current.x),
        y: panStartRef.current.y + (e.touches[0].clientY - dragStartRef.current.y)
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartRef.current.dist;
      setZoom(prev => Math.min(Math.max(Number((prev * factor).toFixed(2)), 0.4), 2.5));
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isErDiagram = code.trim().startsWith('erDiagram');

  return (
    <div className="mermaid-blueprint-card my-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#111215]/80 p-3 sm:p-5 shadow-xs overflow-hidden">
      {/* Blueprint Header with Studio-Grade Interactive Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b border-zinc-200/80 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-600 dark:text-zinc-300">
            {isErDiagram ? 'Entity Relationship Diagram' : 'Interactive Architectural Blueprint'}
          </span>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            Mermaid SVG
          </span>
        </div>

        {/* Zoom and Navigation Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
          <button
            onClick={() => setZoom(prev => Math.min(Number((prev + 0.15).toFixed(2)), 2.5))}
            className="p-1.5 rounded-lg bg-white dark:bg-[#18191E] border border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.4))}
            className="p-1.5 rounded-lg bg-white dark:bg-[#18191E] border border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="px-2 py-1 rounded-lg bg-white dark:bg-[#18191E] border border-zinc-200 dark:border-white/[0.08] text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
            title="Reset Zoom & Pan (or double-click canvas)"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{Math.round(zoom * 100)}%</span>
          </button>

          <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg bg-white dark:bg-[#18191E] border border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shadow-2xs flex items-center gap-1 text-[11px]"
            title="Copy Diagram Source Code"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Diagram Canvas: Pannable, Zoomable, Touch-enabled with Double-Click Reset */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleReset}
        className={`relative w-full min-h-[320px] max-h-[640px] overflow-hidden rounded-xl border border-zinc-200/60 dark:border-white/[0.04] bg-white dark:bg-[#0E0F12] select-none flex items-center justify-center ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {svgHtml ? (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.12s ease-out'
            }}
            className="w-full h-full flex items-center justify-center p-4"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 py-16 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            <span className="text-xs font-medium">Synthesizing Architectural Topology...</span>
          </div>
        )}

        {/* Subtle navigation hint */}
        <div className="absolute bottom-2.5 right-3 pointer-events-none text-[10px] text-zinc-400 dark:text-zinc-500 bg-white/80 dark:bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs border border-zinc-200/50 dark:border-white/[0.06] flex items-center gap-1.5">
          <Move className="w-2.5 h-2.5" />
          <span>Drag to pan • Pinch / Double-click to zoom</span>
        </div>
      </div>
    </div>
  );
};

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

  const renderMarkdownChunk = (text: string) => {
    if (!text) return '';

    let processed = text
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
    return processed;
  };

  // Parse document content into structured chunks (Markdown text vs interactive Mermaid diagrams)
  const docSections = useMemo(() => {
    if (!docContent) return [];
    const sections: Array<{ type: 'html' | 'mermaid'; content: string; key: string }> = [];
    const regex = /```mermaid\n([\s\S]*?)```/gm;
    let lastIndex = 0;
    let match;
    let count = 0;

    while ((match = regex.exec(docContent)) !== null) {
      if (match.index > lastIndex) {
        sections.push({
          type: 'html',
          content: renderMarkdownChunk(docContent.slice(lastIndex, match.index)),
          key: `html-${count++}`
        });
      }
      sections.push({
        type: 'mermaid',
        content: match[1].trim(),
        key: `mermaid-${count++}`
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < docContent.length) {
      sections.push({
        type: 'html',
        content: renderMarkdownChunk(docContent.slice(lastIndex)),
        key: `html-${count++}`
      });
    }

    return sections;
  }, [docContent, isDarkMode]);

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
    <div className="h-[calc(100vh-4rem)] p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 flex flex-col bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      {/* Selector Header: Studio-Grade Precision Control Bar */}
      <SpotlightCard className="p-4 sm:p-5 md:p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-5">
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
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.06] rounded-xl gap-1 overflow-x-auto max-w-full custom-scrollbar">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer select-none shrink-0 ${
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
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs border border-transparent transition-colors cursor-pointer shadow-xs outline-none focus:outline-none focus:ring-0 select-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Markdown</span>
            </button>
          </div>
        </div>
      </SpotlightCard>

      {/* Main Document Viewer */}
      <div className="flex-1 bg-white dark:bg-[#0A0A0A] rounded-2xl p-4 sm:p-6 md:p-8 overflow-y-auto border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 shadow-xs custom-scrollbar">
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
          <div className="markdown-content space-y-4">
            {docSections.map(sec => {
              if (sec.type === 'mermaid') {
                return (
                  <MermaidDiagramBlock
                    key={sec.key}
                    code={sec.content}
                    isDarkMode={isDarkMode}
                  />
                );
              }
              return (
                <div
                  key={sec.key}
                  dangerouslySetInnerHTML={{ __html: sec.content }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
