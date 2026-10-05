import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { GitGraph, Layers, Database, Workflow, ZoomIn, ZoomOut, Maximize2, RotateCcw, Move } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { ProjectFile, KnowledgeGraphData } from '../types';

interface ArchitectureDiagramsProps {
  files?: ProjectFile[];
  knowledgeGraph?: KnowledgeGraphData;
}

const INVALID_NAMES = new Set([
  'from', 'class', 'import', 'def', 'function', 'const', 'let', 'var',
  'return', 'if', 'else', 'elif', 'while', 'for', 'try', 'except', 'self',
  'string', 'number', 'boolean', 'any', 'object', 'list', 'dict', 'set', 'array',
  'end', 'note', 'participant', 'loop', 'alt', 'rect', 'er', 'diagram',
  'new', 'this', 'super', 'null', 'undefined', 'true', 'false', 'void',
  'type', 'interface', 'enum', 'module', 'export', 'default', 'extends',
  'where', 'select', 'values', 'async', 'await', 'yield', 'static',
  'public', 'private', 'protected', 'abstract', 'final', 'override',
]);

/** Strip non-alphanumeric chars and ensure the name is safe for Mermaid identifiers */
const safeMermaidId = (raw: string): string => {
  let clean = raw.replace(/[^a-zA-Z0-9_]/g, '');
  if (!clean || clean.length < 2) return '';
  if (!/^[a-zA-Z]/.test(clean)) clean = 'N' + clean;
  if (INVALID_NAMES.has(clean.toLowerCase())) return '';
  return clean;
};

export const ArchitectureDiagrams: React.FC<ArchitectureDiagramsProps> = ({ files = [], knowledgeGraph }) => {
  const { isDarkMode } = useTheme();
  const [activeDiagram, setActiveDiagram] = useState<'component' | 'class' | 'sequence' | 'erd'>('component');
  const [svgContent, setSvgContent] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const naturalDimensionsRef = useRef<{ width: number; height: number }>({ width: 800, height: 600 });

  useEffect(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, [activeDiagram]);

  useEffect(() => {
    let isSubscribed = true;
    const renderDiagram = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          theme: 'base',
          flowchart: {
            diagramPadding: 16,
            nodeSpacing: 32,
            rankSpacing: 36,
            htmlLabels: true,
            curve: 'basis'
          },
          sequence: {
            diagramMarginX: 20,
            diagramMarginY: 16,
            boxMargin: 8,
            boxTextMargin: 6,
            noteMargin: 8,
            messageMargin: 20
          },
          class: {
            diagramPadding: 16
          },
          er: {
            diagramPadding: 16
          },
          themeVariables: {
            darkMode: isDarkMode,
            background: isDarkMode ? '#0A0A0A' : '#FAFAFA',
            mainBkg: isDarkMode ? '#121316' : '#FFFFFF',
            nodeBorder: isDarkMode ? '#3F3F46' : '#E4E4E7',
            clusterBkg: 'transparent',
            clusterBorder: isDarkMode ? '#3F3F46' : '#E4E4E7',
            lineColor: isDarkMode ? '#CBD5E1' : '#475569',
            textColor: isDarkMode ? '#E2E8F0' : '#18181B',
            primaryColor: isDarkMode ? '#141518' : '#FFFFFF',
            primaryTextColor: isDarkMode ? '#E2E8F0' : '#18181B',
            primaryBorderColor: isDarkMode ? '#3F3F46' : '#E4E4E7',
            secondaryColor: isDarkMode ? '#141518' : '#F4F4F5',
            secondaryTextColor: isDarkMode ? '#E2E8F0' : '#18181B',
            secondaryBorderColor: isDarkMode ? '#3F3F46' : '#E4E4E7',
            tertiaryColor: isDarkMode ? '#141518' : '#F4F4F5',
            tertiaryTextColor: isDarkMode ? '#E2E8F0' : '#18181B',
            tertiaryBorderColor: isDarkMode ? '#3F3F46' : '#E4E4E7',
            edgeLabelBackground: isDarkMode ? '#0A0A0A' : '#FAFAFA',
            actorBkg: isDarkMode ? '#141518' : '#FFFFFF',
            actorBorder: isDarkMode ? '#3F3F46' : '#E4E4E7',
            actorTextColor: isDarkMode ? '#E2E8F0' : '#18181B',
            signalColor: isDarkMode ? '#CBD5E1' : '#475569',
            signalTextColor: isDarkMode ? '#E2E8F0' : '#18181B'
          }
        });
        const id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const code = generateDynamicMermaid();
        const { svg } = await mermaid.render(id, code);
        if (isSubscribed) {
          // Remove any error popups inserted into body by mermaid.js
          document.querySelectorAll('[id^="dmermaid"], .error-icon, #mermaid-error').forEach(el => el.remove());
          
          // Extract natural viewBox dimensions
          const vbMatch = svg.match(/viewBox="([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)"/);
          const vbWidth = vbMatch ? Math.round(parseFloat(vbMatch[3])) : 800;
          const vbHeight = vbMatch ? Math.round(parseFloat(vbMatch[4])) : 600;
          naturalDimensionsRef.current = { width: vbWidth, height: vbHeight };

          // Render at natural diagram scale - never clamp wide architectures to 660px!
          const renderedWidth = Math.max(vbWidth, 750);

          // Inject custom styling strictly scoped to this diagram's id so no styles leak to sidebar or global SVGs
          // High-contrast, 2.2px visible connection lines with crisp arrows and readable nodes
          const customStyle = `
            #${id} { width: ${renderedWidth}px !important; max-width: none !important; height: auto !important; display: block !important; margin: 0 auto !important; }
            #${id} .cluster rect, #${id} rect.cluster, #${id} g.cluster rect { fill: none !important; fill-opacity: 0 !important; stroke: ${isDarkMode ? '#3F3F46' : '#E4E4E7'} !important; stroke-width: 1.5px !important; stroke-dasharray: 4 4 !important; rx: 6px !important; }
            #${id} .cluster text, #${id} .cluster span { fill: ${isDarkMode ? '#A1A1AA' : '#71717A'} !important; color: ${isDarkMode ? '#A1A1AA' : '#71717A'} !important; font-weight: 700 !important; font-size: 11px !important; letter-spacing: 0.05em !important; text-transform: uppercase !important; }
            #${id} .node rect, #${id} .node circle, #${id} .node polygon { fill: ${isDarkMode ? '#141518' : '#FFFFFF'} !important; stroke: ${isDarkMode ? '#3F3F46' : '#D4D4D8'} !important; stroke-width: 1.6px !important; rx: 6px !important; }
            #${id} .node text { fill: ${isDarkMode ? '#F4F4F5' : '#09090B'} !important; font-size: 11px !important; font-weight: 500 !important; }
            #${id} .classGroup rect { fill: ${isDarkMode ? '#141518' : '#FFFFFF'} !important; stroke: ${isDarkMode ? '#3F3F46' : '#D4D4D8'} !important; stroke-width: 1.6px !important; rx: 4px !important; }
            #${id} .classGroup text { fill: ${isDarkMode ? '#F4F4F5' : '#09090B'} !important; font-size: 11px !important; }
            #${id} .edgePath path,
            #${id} .flowchart-link,
            #${id} .relation,
            #${id} path.relation,
            #${id} .relationshipLine,
            #${id} .messageLine0,
            #${id} .messageLine1,
            #${id} .actor-line {
              stroke: ${isDarkMode ? '#CBD5E1' : '#475569'} !important;
              stroke-width: 2.2px !important;
              stroke-opacity: 0.95 !important;
            }
            #${id} .marker,
            #${id} marker path,
            #${id} .arrowheadPath {
              fill: ${isDarkMode ? '#CBD5E1' : '#475569'} !important;
              stroke: ${isDarkMode ? '#CBD5E1' : '#475569'} !important;
              stroke-width: 1.8px !important;
            }
            #${id} .edgeLabel text, #${id} .edgeLabel span { font-size: 10px !important; font-weight: 600 !important; fill: ${isDarkMode ? '#E2E8F0' : '#334155'} !important; }
            #${id} .actor { fill: ${isDarkMode ? '#141518' : '#FFFFFF'} !important; stroke: ${isDarkMode ? '#3F3F46' : '#D4D4D8'} !important; stroke-width: 1.5px !important; rx: 6px !important; }
            #${id} text { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important; fill: ${isDarkMode ? '#F4F4F5' : '#09090B'} !important; pointer-events: none !important; }
          `;

          // Strip Mermaid's restrictive inline max-width, height, and width attributes on root svg tag
          let styledSvg = svg.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
            const cleanAttrs = attrs
              .replace(/\bstyle="[^"]*"/gi, '')
              .replace(/\bwidth="[^"]*"/gi, '')
              .replace(/\bheight="[^"]*"/gi, '');
            return `<svg class="architecture-diagram-svg" style="width: ${renderedWidth}px; max-width: none; height: auto; display: block; margin: 0 auto;" ${cleanAttrs}>`;
          });

          styledSvg = styledSvg.includes('</style>')
            ? styledSvg.replace(/<\/style>/i, `${customStyle}</style>`)
            : styledSvg.replace(/<svg[^>]*>/i, `$&<style>${customStyle}</style>`);

          styledSvg = styledSvg
            // Remove any background fill attributes on cluster rects
            .replace(/(<g[^>]*class="[^"]*cluster[^"]*"[^>]*>[\s\S]*?<rect[^>]*)(fill="[^"]*")/gi, '$1fill="none" fill-opacity="0"')
            .replace(/(<rect[^>]*class="[^"]*cluster[^"]*"[^>]*)(fill="[^"]*")/gi, '$1fill="none" fill-opacity="0"')
            .replace(/fill="#(?:[123][0-9a-f]{5}|2d3748|334155)"/gi, 'fill="none"');

          setSvgContent(styledSvg);

          // Auto-calculate comfortable initial zoom to fit diagram in viewport
          const container = containerRef.current;
          if (container && vbWidth > 0 && vbHeight > 0) {
            const pad = 64;
            const availW = Math.max(container.clientWidth - pad, 300);
            const availH = Math.max(container.clientHeight - pad, 300);
            const scaleX = availW / vbWidth;
            const scaleY = availH / vbHeight;
            const fitScale = Math.min(Math.max(Number(Math.min(scaleX, scaleY).toFixed(2)), 0.3), 1.0);
            setZoom(fitScale);
          } else {
            setZoom(1.0);
          }
          setPan({ x: 0, y: 0 });
        }
      } catch (e) {
        if (isSubscribed) {
          document.querySelectorAll('[id^="dmermaid"], .error-icon, #mermaid-error').forEach(el => el.remove());
          setSvgContent('<div style="color:#94A3B8; font-size: 12px; text-align: center; padding: 20px;">Architecture topology diagram rendering...</div>');
        }
      }
    };
    renderDiagram();
    return () => { isSubscribed = false; };
  }, [activeDiagram, files, knowledgeGraph, isDarkMode]);

  interface RealModel {
    name: string;
    fields: Array<{ name: string; type: string; is_pk?: boolean; is_fk?: boolean }>;
    file?: string;
  }

  // Extract real data models, classes, and typed attributes directly from files & AST
  const extractRealModels = (fileList: ProjectFile[]): RealModel[] => {
    const models: RealModel[] = [];
    const seen = new Set<string>();

    // 1. From symbols.models if present from backend AST
    for (const f of fileList) {
      for (const m of f.symbols.models || []) {
        if (m.name && !seen.has(m.name) && !INVALID_NAMES.has(m.name.toLowerCase())) {
          seen.add(m.name);
          models.push({
            name: m.name,
            fields: m.fields.map(fld => ({
              ...fld,
              is_fk: fld.name.endsWith('Id') && fld.name !== 'id'
            })),
            file: f.path
          });
        }
      }
    }

    // 2. Direct source code extraction fallback
    if (models.length === 0) {
      const modelPattern = /(?:export\s+)?(?:interface|class|type)\s+([A-Za-z0-9_]+)(?:\s*=\s*)?[^{]*\{([^}]+)\}/g;
      for (const f of fileList) {
        const pLower = f.path.toLowerCase();
        if (['.json', '.md', '.txt', '.bat', '.css', '.html', '.svg'].some(ext => pLower.endsWith(ext))) continue;
        if (pLower.includes('node_modules') || pLower.includes('dist') || pLower.includes('test')) continue;

        let match;
        while ((match = modelPattern.exec(f.code)) !== null) {
          const mName = match[1];
          if (
            ['StoreData', 'Store', 'Config', 'Options', 'Props', 'State', 'Context', 'Params'].includes(mName) ||
            INVALID_NAMES.has(mName.toLowerCase()) ||
            seen.has(mName) ||
            mName.length < 2
          ) continue;

          const body = match[2];
          const fields: Array<{ name: string; type: string; is_pk?: boolean; is_fk?: boolean }> = [];
          for (const line of body.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
            const fMatch = trimmed.match(/([A-Za-z0-9_]+)\??\s*:\s*([^;,\n]+)/);
            if (fMatch) {
              const fname = fMatch[1];
              const ftype = fMatch[2].trim();
              fields.push({
                name: fname,
                type: ftype,
                is_pk: fname.toLowerCase() === 'id',
                is_fk: fname.endsWith('Id') && fname.toLowerCase() !== 'id'
              });
            }
          }
          if (fields.length > 0) {
            seen.add(mName);
            models.push({ name: mName, fields, file: f.path });
          }
        }
      }
    }

    return models;
  };

  const generateDynamicMermaid = () => {
    if (!files || files.length === 0) {
      return `graph TD\n    Client[Client Request] --> Engine[CodeMind AI Engine]\n    Engine --> Import[Import Codebase First]`;
    }

    // Filter source code files only (no config junk)
    const codeFiles = files.filter(f => {
      const lower = f.path.toLowerCase();
      const name = (f.path.split('/').pop() || '').toLowerCase();
      if (['package.json', 'tsconfig', 'eslint', 'prettier', 'postcss', 'tailwind', 'readme', 'store.json', 'start.bat'].some(p => name.includes(p))) return false;
      if (['.json', '.md', '.txt', '.bat', '.css', '.html', '.svg', '.lock'].some(ext => lower.endsWith(ext))) return false;
      return true;
    });

    const realModels = extractRealModels(files);

    // 1. COMPONENT TOPOLOGY DIAGRAM - Layered Architectural Subgraphs
    if (activeDiagram === 'component') {
      const entrypoints = codeFiles.filter(f => /(?:server|main|app|index)\.(?:ts|js|py|go|java)/i.test(f.path));
      const routes = codeFiles.filter(f => /(?:route|router|api|endpoint)/i.test(f.path) || f.symbols.apis.length > 0);
      const controllers = codeFiles.filter(f => /(?:controller|handler)/i.test(f.path));
      const services = codeFiles.filter(f => /(?:service|engine|manager|worker)/i.test(f.path));
      const frontend = codeFiles.filter(f => /(?:component|page|view|ui|modal|panel|editor)/i.test(f.path));

      let diag = 'graph TD\n';
      diag += '    Client["Client / User Agent"]\n\n';

      // 1. Frontend UI Layer
      const displayUI = frontend.slice(0, 3);
      if (displayUI.length > 0) {
        diag += '    subgraph UILayer ["1. Frontend Presentation Layer"]\n';
        for (const u of displayUI) {
          const uName = u.path.split('/').pop() || 'UI';
          const uId = safeMermaidId(uName);
          if (uId) diag += `        ${uId}["${uName}"]\n`;
        }
        diag += '    end\n\n';
      }

      // 2. API Routing & Gateway Layer
      const entryFile = entrypoints[0] || routes[0] || codeFiles[0];
      const entryName = entryFile.path.split('/').pop() || 'server.ts';
      const entryId = safeMermaidId(entryName) || 'ServerGateway';

      const displayRoutes = routes.slice(0, 3);
      diag += '    subgraph APILayer ["2. API Gateway & Routing Layer"]\n';
      diag += `        ${entryId}["${entryName}"]\n`;
      for (const r of displayRoutes) {
        const rName = r.path.split('/').pop() || 'Route';
        const rId = safeMermaidId(rName);
        if (rId && rId !== entryId) {
          diag += `        ${rId}["${rName}"]\n`;
        }
      }
      diag += '    end\n\n';

      // 3. Controllers Layer
      const displayControllers = controllers.slice(0, 4);
      if (displayControllers.length > 0) {
        diag += '    subgraph ControllerLayer ["3. Business Logic Controllers"]\n';
        for (const c of displayControllers) {
          const cName = c.path.split('/').pop() || 'Controller';
          const cId = safeMermaidId(cName);
          if (cId) diag += `        ${cId}["${cName}"]\n`;
        }
        diag += '    end\n\n';
      }

      // 4. Execution & Services Layer
      const displayServices = services.slice(0, 2);
      if (displayServices.length > 0) {
        diag += '    subgraph ServiceLayer ["4. Core Execution & Services Engine"]\n';
        for (const s of displayServices) {
          const sName = s.path.split('/').pop() || 'Service';
          const sId = safeMermaidId(sName);
          if (sId) diag += `        ${sId}["${sName}"]\n`;
        }
        diag += '    end\n\n';
      }

      // 5. Data Persistence Layer
      const dbLabel = realModels.length > 0 ? realModels.slice(0, 4).map(m => m.name).join(', ') : 'Database Store';
      diag += '    subgraph DBLayer ["5. Data Persistence & Models"]\n';
      diag += `        DB["Data Persistence (${dbLabel})"]\n`;
      diag += '    end\n\n';

      // Tier-to-Tier Structured Architectural Connections
      if (displayUI.length > 0) {
        const primaryUI = safeMermaidId(displayUI[0].path.split('/').pop() || 'UI');
        diag += `    Client --> ${primaryUI}\n`;
        diag += `    ${primaryUI} --> ${entryId}\n`;
      } else {
        diag += `    Client --> ${entryId}\n`;
      }

      // Gateway distributes to route handlers
      for (const r of displayRoutes) {
        const rName = r.path.split('/').pop() || '';
        const rId = safeMermaidId(rName);
        if (rId && rId !== entryId) {
          diag += `    ${entryId} --> ${rId}\n`;
        }
      }

      // Route handlers connect into Controllers
      if (displayControllers.length > 0) {
        if (displayRoutes.length > 0) {
          for (let i = 0; i < displayControllers.length; i++) {
            const cId = safeMermaidId(displayControllers[i].path.split('/').pop() || '');
            const rId = safeMermaidId(displayRoutes[i % displayRoutes.length].path.split('/').pop() || '');
            if (cId && rId && rId !== cId) {
              diag += `    ${rId} --> ${cId}\n`;
            } else if (cId) {
              diag += `    ${entryId} --> ${cId}\n`;
            }
          }
        } else {
          for (const c of displayControllers) {
            const cId = safeMermaidId(c.path.split('/').pop() || '');
            if (cId) diag += `    ${entryId} --> ${cId}\n`;
          }
        }
      }

      // Controllers orchestrate Services
      if (displayServices.length > 0 && displayControllers.length > 0) {
        for (let i = 0; i < displayControllers.length; i++) {
          const cId = safeMermaidId(displayControllers[i].path.split('/').pop() || '');
          const sId = safeMermaidId(displayServices[i % displayServices.length].path.split('/').pop() || '');
          if (cId && sId) diag += `    ${cId} --> ${sId}\n`;
        }
      }

      // Services connect to DB
      if (displayServices.length > 0) {
        for (const s of displayServices) {
          const sId = safeMermaidId(s.path.split('/').pop() || '');
          if (sId) diag += `    ${sId} --> DB\n`;
        }
      } else if (displayControllers.length > 0) {
        const cId = safeMermaidId(displayControllers[0].path.split('/').pop() || '');
        if (cId) diag += `    ${cId} --> DB\n`;
      }

      return diag;
    }

    // 2. REAL CLASS HIERARCHY WITH REAL PROPERTIES & METHODS
    if (activeDiagram === 'class') {
      let diag = 'classDiagram\n';

      if (realModels.length > 0) {
        for (const m of realModels.slice(0, 6)) {
          const cName = safeMermaidId(m.name);
          if (!cName) continue;
          diag += `    class ${cName} {\n`;
          for (const fld of m.fields.slice(0, 6)) {
            let ftype = 'string';
            const raw = fld.type.toLowerCase();
            if (anyContains(raw, ['number', 'int', 'float'])) ftype = 'int';
            else if (anyContains(raw, ['date', 'time'])) ftype = 'datetime';
            else if (anyContains(raw, ['bool'])) ftype = 'boolean';
            diag += `        +${ftype} ${fld.name}\n`;
          }
          diag += '    }\n';
        }

        // Draw real associations based on foreign keys
        const drawn = new Set<string>();
        for (const m of realModels) {
          for (const fld of m.fields) {
            if (fld.is_fk) {
              const target = fld.name.slice(0, -2);
              for (const other of realModels) {
                if (other.name === m.name) continue;
                if (other.name.toLowerCase().includes(target.toLowerCase()) || (target.toLowerCase() === 'owner' && other.name.toLowerCase() === 'user')) {
                  const key = `${other.name}-${m.name}`;
                  if (!drawn.has(key)) {
                    drawn.add(key);
                    diag += `    ${other.name} "1" --> "*" ${m.name} : references\n`;
                  }
                  break;
                }
              }
            }
          }
        }
      } else {
        // Fallback to service/controller classes
        for (const f of codeFiles.slice(0, 4)) {
          const cName = safeMermaidId(f.symbols.classes[0] || f.path.split('/').pop()?.split('.')[0] || 'Module');
          if (!cName) continue;
          diag += `    class ${cName} {\n`;
          for (const fn of f.symbols.functions.slice(0, 4)) {
            const cleanFn = safeMermaidId(fn);
            if (cleanFn) diag += `        +${cleanFn}()\n`;
          }
          diag += '    }\n';
        }
      }

      return diag;
    }

    // 3. REAL API SEQUENCE FLOW
    if (activeDiagram === 'sequence') {
      let diag = 'sequenceDiagram\n    autonumber\n';
      diag += '    actor Client as Web Client\n';

      // Find real route files, controllers, and services
      const routeFiles = codeFiles.filter(f => /(?:route|router|api)/i.test(f.path) || f.symbols.apis.length > 0);
      const controllerFiles = codeFiles.filter(f => /(?:controller)/i.test(f.path));
      const serviceFiles = codeFiles.filter(f => /(?:service)/i.test(f.path));

      // Extract discovered APIs
      const allApis = codeFiles.flatMap(f => f.symbols.apis).filter(a => a && a.length > 2);
      const api1 = allApis[0] || 'POST /api/execute';
      const api2 = allApis[1] || 'GET /api/projects';

      const routerName = routeFiles[0] ? (safeMermaidId(routeFiles[0].path.split('/').pop()?.split('.')[0] || 'Router')) : 'Router';
      const controllerName = controllerFiles[0] ? (safeMermaidId(controllerFiles[0].path.split('/').pop()?.split('.')[0] || 'Controller')) : 'Controller';
      const serviceName = serviceFiles[0] ? (safeMermaidId(serviceFiles[0].path.split('/').pop()?.split('.')[0] || 'Service')) : 'Database';

      diag += `    participant Gateway as ${routerName}\n`;
      diag += `    participant Handler as ${controllerName}\n`;
      diag += `    participant Engine as ${serviceName}\n`;
      diag += `    participant Store as Database Store\n`;

      // Call 1: Real Mutation / Action Call
      const fn1 = controllerFiles[0]?.symbols.functions[0] || 'handleRequest';
      const svcFn = serviceFiles[0]?.symbols.functions[0] || 'executeBusinessLogic';

      diag += `    Client->>Gateway: ${api1}\n`;
      diag += `    Gateway->>Handler: ${fn1}(req, res)\n`;
      diag += `    Handler->>Engine: ${svcFn}(payload)\n`;
      diag += `    Engine->>Store: saveRecord(entity)\n`;
      diag += `    Store-->>Engine: Confirmation / Saved Record\n`;
      diag += `    Engine-->>Handler: Execution Result (payload)\n`;
      diag += `    Handler-->>Client: 200 OK Response (JSON)\n`;

      // Call 2: Real Query / Read Call
      const fn2 = controllerFiles[0]?.symbols.functions[1] || 'queryRecords';
      diag += `    Client->>Gateway: ${api2}\n`;
      diag += `    Gateway->>Handler: ${fn2}()\n`;
      diag += `    Handler->>Store: findRecordsByCriteria()\n`;
      diag += `    Store-->>Handler: Data Entities Collection\n`;
      diag += `    Handler-->>Client: 200 OK (Dataset Payload)\n`;

      return diag;
    }

    // 4. REAL DATABASE ERD WITH ACTUAL MODELS & FIELDS
    let diag = 'erDiagram\n';

    if (realModels.length > 0) {
      for (const m of realModels.slice(0, 8)) {
        diag += `    ${m.name} {\n`;
        for (const fld of m.fields.slice(0, 8)) {
          let ftype = 'string';
          const raw = fld.type.toLowerCase();
          if (anyContains(raw, ['number', 'int', 'float', 'double'])) ftype = 'int';
          else if (anyContains(raw, ['date', 'time'])) ftype = 'datetime';
          else if (anyContains(raw, ['bool'])) ftype = 'boolean';
          const pk = fld.is_pk ? ' PK' : '';
          diag += `        ${ftype} ${fld.name}${pk}\n`;
        }
        diag += '    }\n';
      }

      // Foreign key relationships
      const rels = new Set<string>();
      for (const m of realModels) {
        for (const fld of m.fields) {
          if (fld.is_fk) {
            const prefix = fld.name.slice(0, -2).toLowerCase();
            for (const other of realModels) {
              if (other.name === m.name) continue;
              if (other.name.toLowerCase().includes(prefix) || (prefix === 'owner' && other.name.toLowerCase() === 'user')) {
                rels.add(`    ${other.name} ||--o{ ${m.name} : "has many"`);
                break;
              }
            }
          }
        }
      }

      for (const r of Array.from(rels)) {
        diag += `${r}\n`;
      }
    } else {
      diag += '    ENTITIES {\n        string id PK\n        string label\n    }\n';
    }

    return diag;
  };

  const anyContains = (str: string, targets: string[]) => targets.some(t => str.includes(t));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: Number((e.clientX - dragStartRef.current.x).toFixed(1)),
      y: Number((e.clientY - dragStartRef.current.y).toFixed(1)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - pan.x,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - pan.y,
        dist,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: Number((e.touches[0].clientX - touchStartRef.current.x).toFixed(1)),
        y: Number((e.touches[0].clientY - touchStartRef.current.y).toFixed(1)),
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = newDist / touchStartRef.current.dist;
      touchStartRef.current.dist = newDist;
      setZoom((prev) => Math.min(Math.max(Number((prev * factor).toFixed(2)), 0.2), 4.0));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prevZoom) => {
      const nextZoom = Math.min(Math.max(Number((prevZoom * factor).toFixed(2)), 0.2), 4.0);
      const scaleRatio = nextZoom / prevZoom;
      setPan((prevPan) => ({
        x: Number((mouseX - (mouseX - prevPan.x) * scaleRatio).toFixed(1)),
        y: Number((mouseY - (mouseY - prevPan.y) * scaleRatio).toFixed(1)),
      }));
      return nextZoom;
    });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (zoom < 1.25) {
      // Zoom in to 1.8x focused on the double-clicked position
      const targetZoom = 1.8;
      const scaleRatio = targetZoom / zoom;
      setPan({
        x: Number((mouseX - (mouseX - pan.x) * scaleRatio).toFixed(1)),
        y: Number((mouseY - (mouseY - pan.y) * scaleRatio).toFixed(1)),
      });
      setZoom(targetZoom);
    } else {
      // Reset back to fit overview
      handleFit();
    }
  };

  const handleFit = () => {
    const container = containerRef.current;
    if (container && naturalDimensionsRef.current.width > 0) {
      const pad = 64;
      const availW = Math.max(container.clientWidth - pad, 300);
      const availH = Math.max(container.clientHeight - pad, 300);
      const scaleX = availW / naturalDimensionsRef.current.width;
      const scaleY = availH / naturalDimensionsRef.current.height;
      const fitScale = Math.min(Math.max(Number(Math.min(scaleX, scaleY).toFixed(2)), 0.25), 1.25);
      setZoom(fitScale);
      setPan({ x: 0, y: 0 });
      return;
    }
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="h-full p-2.5 sm:p-3 space-y-2.5 flex flex-col overflow-hidden bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      {/* Selector Header: Studio-Grade Precision Control Bar */}
      <div className="bg-white dark:bg-[#0D0E11] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-2xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">Dynamic Architecture Diagrams</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">Generated dynamically from your codebase's Universal AST & Knowledge Graph</p>
          </div>
        </div>

        {/* Precision Segmented Tab Control */}
        <div className="flex items-center overflow-x-auto max-w-full custom-scrollbar p-0.5 bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.06] rounded-lg">
          {[
            { id: 'component', label: 'Component Topology', shortLabel: 'Component', icon: Layers, color: '#0284C7' },
            { id: 'class', label: 'Class Hierarchy', shortLabel: 'Class', icon: GitGraph, color: '#475569' },
            { id: 'sequence', label: 'API Sequence Flow', shortLabel: 'Sequence', icon: Workflow, color: '#D97706' },
            { id: 'erd', label: 'Database ERD', shortLabel: 'ERD', icon: Database, color: '#0D9488' }
          ].map((tab) => {
            const isActive = activeDiagram === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDiagram(tab.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer select-none shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-[#24262B] text-zinc-900 dark:text-zinc-100 shadow-2xs border border-zinc-200 dark:border-white/[0.08]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <Icon
                  className="w-3.5 h-3.5 transition-colors shrink-0"
                  style={{ color: isActive ? tab.color : undefined }}
                />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Diagram Area with Interactive Precision Controls */}
      <div className="flex-1 bg-white dark:bg-[#0A0A0A] rounded-xl border border-zinc-200 dark:border-white/[0.08] relative shadow-2xs overflow-hidden flex flex-col min-h-0">
        {/* Floating Precision Zoom & Pan Controls */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-white/95 dark:bg-[#141518]/90 backdrop-blur-md border border-zinc-200 dark:border-white/[0.08] rounded-xl p-1.5 shadow-md select-none">
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 border-r border-zinc-200 dark:border-white/[0.08] mr-0.5">
            <Move className="w-3 h-3 text-zinc-400" />
            <span>Drag • Scroll • 2x Click</span>
          </div>
          <button
            onClick={() => setZoom(z => Math.max(0.2, Number((z - 0.2).toFixed(2))))}
            title="Zoom Out (Scroll Down)"
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/[0.08] rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 px-1 select-none min-w-[44px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(4.0, Number((z + 0.2).toFixed(2))))}
            title="Zoom In (Scroll Up)"
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/[0.08] rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3.5 bg-zinc-200 dark:border-white/[0.08] mx-0.5" />
          <button
            onClick={handleFit}
            title="Fit to Screen"
            className="px-2 py-1 hover:bg-zinc-100 dark:hover:bg-white/[0.08] rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-mono font-semibold">Fit</span>
          </button>
          <button
            onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
            title="Reset to 100%"
            className="px-2 py-1 hover:bg-zinc-100 dark:hover:bg-white/[0.08] rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-mono font-semibold">1:1</span>
          </button>
        </div>

        {/* Interactive Pan & Zoom Canvas Viewport */}
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          className={`w-full flex-1 overflow-hidden relative select-none flex items-center justify-center ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ touchAction: 'none' }}
        >
          <div 
            ref={contentRef}
            className="transition-transform duration-75 ease-out inline-flex items-center justify-center p-8 pointer-events-auto"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
              transformOrigin: 'center center',
              willChange: 'transform'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }} 
          />
        </div>
      </div>
    </div>
  );
};
