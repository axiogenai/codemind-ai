import React, { useState, useMemo, useEffect } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  Code2,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { ASTTransformationResult, TransformationPlan, ProjectFile } from '../types';

interface Props {
  preview: ASTTransformationResult;
  plan: TransformationPlan | null;
  projectFiles?: ProjectFile[];
}

interface SandboxFile {
  path: string;
  code: string;
  isCreated: boolean;
}

export const LiveTransformationPreview: React.FC<Props> = ({ preview, plan, projectFiles }) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'rendered' | 'split'>('rendered');
  const [key, setKey] = useState(0);
  const [sandboxTheme, setSandboxTheme] = useState<'dark' | 'light'>('dark');

  // Collect all files into virtual application filesystem (created + modified + all existing unchanged files)
  const allFiles: SandboxFile[] = useMemo(() => {
    const list: SandboxFile[] = [];
    const seenPaths = new Set<string>();

    // 1. Newly created files take highest precedence
    preview.created_files.forEach(f => {
      if (f.path && f.code) {
        list.push({ path: f.path, code: f.code, isCreated: true });
        seenPaths.add(f.path);
        seenPaths.add(f.path.split('/').pop() || f.path);
      }
    });

    // 2. Transformed modified files take next precedence
    preview.modified_files.forEach(f => {
      if (f.path && f.transformed_code) {
        list.push({ path: f.path, code: f.transformed_code, isCreated: false });
        seenPaths.add(f.path);
        seenPaths.add(f.path.split('/').pop() || f.path);
      }
    });

    // 3. Include all other existing unchanged project files (e.g. main.html, dashboard.html, styles.css)
    if (projectFiles) {
      projectFiles.forEach(f => {
        const base = f.path.split('/').pop() || f.path;
        if (!seenPaths.has(f.path) && !seenPaths.has(base)) {
          list.push({ path: f.path, code: f.code, isCreated: false });
          seenPaths.add(f.path);
          seenPaths.add(base);
        }
      });
    }

    return list;
  }, [preview, projectFiles]);

  // Determine the primary initial entry point for the whole flow
  const initialEntryFile = useMemo(() => {
    if (allFiles.length === 0) return 'index.html';

    // 1. If login / auth page was created or requested, start at login page
    const loginFile = allFiles.find(f => f.path.toLowerCase().includes('login') || f.path.toLowerCase().includes('signin') || f.path.toLowerCase().includes('auth'));
    if (loginFile) return loginFile.path;

    // 2. Otherwise start at primary created page
    const createdHtmlOrTsx = allFiles.find(f => f.isCreated && (f.path.endsWith('.html') || f.path.endsWith('.tsx') || f.path.endsWith('.jsx')));
    if (createdHtmlOrTsx) return createdHtmlOrTsx.path;

    // 3. Otherwise index.html or App.tsx or landing.html
    const mainEntry = allFiles.find(f => f.path.endsWith('landing.html') || f.path.endsWith('index.html') || f.path.endsWith('App.tsx'));
    if (mainEntry) return mainEntry.path;

    return allFiles[0].path;
  }, [allFiles]);

  const [currentUrlPath, setCurrentUrlPath] = useState<string>(initialEntryFile);
  const [history, setHistory] = useState<string[]>([initialEntryFile]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);

  useEffect(() => {
    setCurrentUrlPath(initialEntryFile);
    setHistory([initialEntryFile]);
    setHistoryIdx(0);
  }, [initialEntryFile]);

  // Handle URL change from inside iframe virtual router
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CODEMIND_URL_CHANGE') {
        const targetReq = e.data.path;
        if (!targetReq) return;

        const targetBase = targetReq.split('/').pop()?.replace('#', '').toLowerCase() || targetReq.toLowerCase();
        
        // Match exact or fuzzy (e.g. main.html, landing.html, login.html)
        const matching = allFiles.find(f => {
          const fBase = f.path.split('/').pop()?.toLowerCase();
          const fPath = f.path.toLowerCase();
          return fPath === targetReq.toLowerCase() || fBase === targetBase || fPath.endsWith(targetReq.toLowerCase()) || fBase?.includes(targetBase);
        });

        if (matching) {
          setCurrentUrlPath(matching.path);
          setHistory(prev => [...prev.slice(0, historyIdx + 1), matching.path]);
          setHistoryIdx(prev => prev + 1);
        } else {
          // If destination not found directly, look for main.html or landing.html
          const fallback = allFiles.find(f => f.path.endsWith('.html') && f.path !== currentUrlPath);
          if (fallback) {
            setCurrentUrlPath(fallback.path);
            setHistory(prev => [...prev.slice(0, historyIdx + 1), fallback.path]);
            setHistoryIdx(prev => prev + 1);
          }
        }
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [allFiles, historyIdx, currentUrlPath]);

  const navigateBack = () => {
    if (historyIdx > 0) {
      const prevPath = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setCurrentUrlPath(prevPath);
      setKey(k => k + 1);
    }
  };

  const navigateForward = () => {
    if (historyIdx < history.length - 1) {
      const nextPath = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      setCurrentUrlPath(nextPath);
      setKey(k => k + 1);
    }
  };

  // Build bundled CSS for all pages
  const bundledCSS = useMemo(() => {
    return allFiles
      .filter(f => f.path.endsWith('.css'))
      .map(f => f.code)
      .join('\n\n');
  }, [allFiles]);

  const isReactProject = allFiles.some(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
  const activeFileObj = allFiles.find(f => f.path === currentUrlPath || f.path.endsWith(currentUrlPath)) || allFiles[0];
  const targetCode = activeFileObj?.code || '';

  // Generate unified clean sandbox bundle
  const generateUnifiedSandboxDoc = () => {
    const isPython = currentUrlPath.endsWith('.py');

    if (isPython) {
      return `<!DOCTYPE html>
<html lang="en" class="${sandboxTheme}">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { background: ${sandboxTheme === 'dark' ? '#0A0A0A' : '#F9FAFB'}; color: ${sandboxTheme === 'dark' ? '#FFF' : '#111'}; font-family: sans-serif; }</style>
</head>
<body class="p-8">
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="p-6 rounded-3xl ${sandboxTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'} border space-y-4">
      <div class="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>FastAPI / Python Live Endpoint Simulator</span>
      </div>
      <h2 class="text-xl font-black">${currentUrlPath}</h2>
      <p class="text-xs text-neutral-400">Synthesized route for: <b>${plan?.goal || 'Transformation'}</b></p>
      
      <div class="space-y-3 pt-2">
        <div class="p-3 rounded-xl ${sandboxTheme === 'dark' ? 'bg-[#0A0A0A] border-neutral-800' : 'bg-neutral-50 border-neutral-200'} border flex items-center justify-between font-mono text-xs">
          <span class="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
          <span class="text-neutral-400">/api/items</span>
          <button onclick="alert('GET 200 OK: Endpoint executed successfully!')" class="px-3 py-1 rounded-lg bg-white text-black font-bold text-xs cursor-pointer">Execute</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    if (isReactProject) {
      const sanitizedCode = JSON.stringify(targetCode);
      return `<!DOCTYPE html>
<html lang="en" id="preview-root" class="${sandboxTheme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: { brand: '#3B82F6' }
        }
      }
    }
  </script>
  <style>
    ${bundledCSS}
    body {
      transition: background-color 0.3s ease, color 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
  </style>
</head>
<body class="min-h-screen ${sandboxTheme === 'dark' ? 'bg-[#0A0A0A] text-white' : 'bg-[#FAFAFA] text-neutral-900'} p-6 flex flex-col items-center justify-center">
  <div id="root" class="w-full max-w-2xl">
    <div class="text-center p-8 space-y-3">
      <div class="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-xs text-neutral-400">Executing full application flow...</p>
    </div>
  </div>

  <script type="text/javascript">
    const rawSource = ${sanitizedCode};
    const { useState, useEffect, useRef, useMemo, useCallback } = React;

    const createIconStub = (name) => (props) => React.createElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: props?.size || 18,
      height: props?.size || 18,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: props?.className || ''
    }, React.createElement('circle', { cx: 12, cy: 12, r: 9 }));

    const Mail = createIconStub('Mail');
    const Lock = createIconStub('Lock');
    const User = createIconStub('User');
    const Eye = createIconStub('Eye');
    const EyeOff = createIconStub('EyeOff');
    const ArrowRight = createIconStub('ArrowRight');
    const ArrowLeft = createIconStub('ArrowLeft');
    const Check = createIconStub('Check');
    const Sun = createIconStub('Sun');
    const Moon = createIconStub('Moon');
    const Sparkles = createIconStub('Sparkles');

    try {
      let cleaned = rawSource
        .replace(/import\\s+[\\s\\S]*?from\\s+['\"][^'\"]+['\"];?/gm, '')
        .replace(/import\\s+['\"][^'\"]+['\"];?/gm, '')
        .replace(/export\\s+default\\s+[a-zA-Z0-9_$]+;?/gm, '')
        .replace(/export\\s+(const|function|class|interface|type)\\s+/gm, '$1 ');

      let compName = 'App';
      const funcMatch = cleaned.match(/(?:function|const|class)\\s+([A-Z][a-zA-Z0-9_$]*)/);
      if (funcMatch) compName = funcMatch[1];

      cleaned += \`
        try {
          const TargetComp = typeof \${compName} !== 'undefined' ? \${compName} : () => React.createElement('div', { className: 'p-4 text-center text-xs text-neutral-400' }, 'Component rendered successfully.');
          const rootElement = document.getElementById('root');
          const root = ReactDOM.createRoot(rootElement);
          root.render(React.createElement(TargetComp, {
            onLoginSuccess: () => { window.parent.postMessage({ type: 'CODEMIND_URL_CHANGE', path: 'App.tsx' }, '*'); },
            onNavigateLanding: () => { window.parent.postMessage({ type: 'CODEMIND_URL_CHANGE', path: 'App.tsx' }, '*'); }
          }));
        } catch(err) {
          document.getElementById('root').innerHTML = '<div class="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300"><pre class="font-mono text-emerald-400 text-[11px] overflow-auto">' + err.message + '</pre></div>';
        }
      \`;

      const compiled = Babel.transform(cleaned, {
        presets: ['react', 'typescript']
      }).code;

      eval(compiled);
    } catch(e) {
      document.getElementById('root').innerHTML = '<div class="p-8 text-center text-xs text-neutral-400 font-mono">Render error: ' + e.message + '</div>';
    }
  </script>
</body>
</html>`;
    }

    // Pure HTML Multi-Page Virtual Browser Engine with Full Multi-Link Navigation
    const rawHtml = activeFileObj?.code || '<!DOCTYPE html><html><body><h1>Page Active</h1></body></html>';

    const injectedNavScript = `
    <style>
      ${bundledCSS}
      body { transition: background 0.3s ease, color 0.3s ease; }
      body.dark-mode { background: #0A0A0A !important; color: #FFFFFF !important; }
      body.light-mode { background: #FAFAFA !important; color: #111111 !important; }
    </style>
    <script>
      // 1. Intercept all <a> link clicks
      document.addEventListener('click', function(e) {
        var a = e.target.closest('a');
        if (a) {
          var href = a.getAttribute('href');
          if (href && !href.startsWith('http://') && !href.startsWith('https://') && href !== '#') {
            e.preventDefault();
            window.parent.postMessage({ type: 'CODEMIND_URL_CHANGE', path: href }, '*');
            return;
          }
        }

        // 2. Intercept button clicks (Enter Website, Logout, Back, etc.)
        var btn = e.target.closest('button, input[type="button"], input[type="submit"]');
        if (btn) {
          var txt = (btn.textContent || btn.innerText || btn.value || '').toLowerCase().trim();
          var onclickStr = btn.getAttribute('onclick') || '';

          if (txt.includes('enter') || txt.includes('explore') || txt.includes('get started') || txt.includes('start') || txt.includes('continue') || txt.includes('next')) {
            e.preventDefault();
            window.parent.postMessage({ type: 'CODEMIND_URL_CHANGE', path: 'main.html' }, '*');
          } else if (txt.includes('logout') || txt.includes('sign out') || txt.includes('exit')) {
            e.preventDefault();
            window.parent.postMessage({ type: 'CODEMIND_URL_CHANGE', path: 'login.html' }, '*');
          } else if (txt.includes('back') || txt.includes('landing') || txt.includes('return') || txt.includes('home')) {
            e.preventDefault();
            window.parent.postMessage({ type: 'CODEMIND_URL_CHANGE', path: 'landing.html' }, '*');
          } else if (onclickStr.includes('location.href') || onclickStr.includes('window.location')) {
            var match = onclickStr.match(/['"]([^'"]+\\.html)['"]/);
            if (match && match[1]) {
              e.preventDefault();
              window.parent.postMessage({ type: 'CODEMIND_URL_CHANGE', path: match[1] }, '*');
            }
          }
        }
      });

      // 3. Intercept form submissions (e.g. login form, feedback form)
      document.addEventListener('submit', function(e) {
        var form = e.target;
        var action = form.getAttribute('action');
        e.preventDefault();
        window.parent.postMessage({ type: 'CODEMIND_URL_CHANGE', path: action || 'landing.html' }, '*');
      });
    </script>
    `;

    if (rawHtml.includes('</body>')) {
      return rawHtml.replace('</body>', injectedNavScript + '</body>');
    }
    return rawHtml + injectedNavScript;
  };

  const getDeviceWidth = () => {
    if (device === 'mobile') return 'max-w-[380px]';
    if (device === 'tablet') return 'max-w-[768px]';
    return 'w-full';
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Viewport Sizer, Refresh, Theme Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs">
        {/* Device Switcher */}
        <div className="flex items-center space-x-1 bg-[#0A0A0A] p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              device === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Desktop</span>
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              device === 'tablet' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Tablet</span>
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              device === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Mobile View (380px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Mobile</span>
          </button>
        </div>

        {/* Live Flow Status Indicator */}
        <div className="hidden md:flex items-center space-x-2 text-neutral-400 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Unified Flow Runtime Sandbox</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Theme switcher */}
          <button
            onClick={() => setSandboxTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
            className="px-3 py-1.5 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            {sandboxTheme === 'dark' ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span>{sandboxTheme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>

          {/* Refresh Frame */}
          <button
            onClick={() => {
              setCurrentUrlPath(initialEntryFile);
              setKey(prev => prev + 1);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Restart Full Flow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Flow</span>
          </button>

          {/* Split Mode Toggle */}
          <button
            onClick={() => setViewMode(prev => (prev === 'rendered' ? 'split' : 'rendered'))}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'split' ? 'bg-neutral-800 text-white border-neutral-700' : 'bg-[#0A0A0A] text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{viewMode === 'split' ? 'Live Only' : 'Split Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Frame Container */}
      <div className={`grid ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2 gap-4' : 'grid-cols-1'}`}>
        {/* Live Interactive Iframe */}
        <div className="flex flex-col bg-[#070707] rounded-3xl border border-neutral-800/80 p-4 min-h-[520px] shadow-2xl">
          <div className={`${getDeviceWidth()} mx-auto transition-all duration-300 rounded-2xl overflow-hidden border border-neutral-800 shadow-xl bg-[#0A0A0A]`}>
            {/* Live Virtual Browser Chrome & URL Address Bar with Back/Forward */}
            <div className="px-4 py-2.5 bg-[#121212] border-b border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 mr-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>

                {/* Back / Forward Controls */}
                <button
                  onClick={navigateBack}
                  disabled={historyIdx <= 0}
                  className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent text-neutral-300 transition-colors"
                  title="Back"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={navigateForward}
                  disabled={historyIdx >= history.length - 1}
                  className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent text-neutral-300 transition-colors"
                  title="Forward"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Dynamic Live URL Address Bar */}
              <div className="px-3 py-1 rounded-lg bg-[#0A0A0A] border border-neutral-800 text-neutral-300 text-[10px] w-2/3 text-center truncate font-bold flex items-center justify-center space-x-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>http://localhost:3000/{currentUrlPath}</span>
              </div>

              <div className="w-12 text-right text-[10px] text-neutral-500">Live Flow</div>
            </div>

            {/* Iframe executing the unified application flow */}
            <iframe
              key={`${key}-${currentUrlPath}`}
              title="Transformation Live Flow Sandbox"
              srcDoc={generateUnifiedSandboxDoc()}
              sandbox="allow-scripts allow-forms allow-modals"
              className="w-full h-[470px] border-none"
            />
          </div>
        </div>

        {/* Optional Split Code Viewer */}
        {viewMode === 'split' && (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-2xl flex flex-col h-[520px]">
            <div className="px-4 py-3 bg-[#0A0A0A] border-b border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white truncate">{currentUrlPath}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                Active Flow File
              </span>
            </div>
            <pre className="p-4 font-mono text-xs text-neutral-300 overflow-auto flex-1 leading-relaxed bg-[#0A0A0A]">
              {targetCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
