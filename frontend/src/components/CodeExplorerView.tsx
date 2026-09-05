import React, { useState, useEffect, useRef } from 'react';
import { FileCode, Cpu, FolderTree, Code2, Layers, Network, Save, RotateCcw, Copy, Check, FileEdit, Eye, AlignLeft } from 'lucide-react';
import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import type { ProjectFile } from '../types';
import { saveFileContent } from '../services/api';

interface CodeExplorerViewProps {
  files: ProjectFile[];
  projectId?: string;
  onUpdateFile?: (path: string, newCode: string) => void;
}

const getFileIconColor = (path: string) => {
  const p = path.toLowerCase();
  if (p.endsWith('.tsx') || p.endsWith('.ts')) return 'text-sky-400';
  if (p.endsWith('.jsx') || p.endsWith('.js') || p.endsWith('.mjs') || p.endsWith('.cjs')) return 'text-amber-400';
  if (p.endsWith('.css') || p.endsWith('.scss')) return 'text-indigo-400';
  if (p.endsWith('.json') || p.endsWith('.yml') || p.endsWith('.yaml') || p.endsWith('.toml')) return 'text-amber-300';
  if (p.endsWith('.md') || p.endsWith('.txt')) return 'text-zinc-400';
  if (p.endsWith('.py')) return 'text-emerald-400';
  return 'text-zinc-400';
};

const getMonacoLanguage = (path: string): string => {
  const p = path.toLowerCase();
  if (p.endsWith('.tsx') || p.endsWith('.ts')) return 'typescript';
  if (p.endsWith('.jsx') || p.endsWith('.js') || p.endsWith('.mjs') || p.endsWith('.cjs')) return 'javascript';
  if (p.endsWith('.py')) return 'python';
  if (p.endsWith('.json')) return 'json';
  if (p.endsWith('.css') || p.endsWith('.scss')) return 'css';
  if (p.endsWith('.html') || p.endsWith('.htm')) return 'html';
  if (p.endsWith('.md') || p.endsWith('.markdown')) return 'markdown';
  if (p.endsWith('.sql')) return 'sql';
  if (p.endsWith('.yaml') || p.endsWith('.yml')) return 'yaml';
  if (p.endsWith('.sh') || p.endsWith('.bash')) return 'shell';
  if (p.endsWith('.rs')) return 'rust';
  if (p.endsWith('.go')) return 'go';
  return 'plaintext';
};

const getFunctionTypeBadge = (fnName: string) => {
  const lower = fnName.toLowerCase();
  if (lower.startsWith('handle') || lower.startsWith('on') || lower.includes('click') || lower.includes('mouse') || lower.includes('key') || lower.includes('resize')) {
    return { tag: 'event', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  }
  if (lower.startsWith('render') || lower.startsWith('use') || lower.includes('view') || lower.includes('component')) {
    return { tag: 'ui', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  }
  if (lower.startsWith('get') || lower.startsWith('set') || lower === 'height' || lower === 'width') {
    return { tag: 'prop', bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
  }
  if (lower.startsWith('calc') || lower === 'xc' || lower === 'yc' || lower.includes('math') || lower.includes('coord')) {
    return { tag: 'calc', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
  }
  return { tag: 'fn', bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' };
};

export const CodeExplorerView: React.FC<CodeExplorerViewProps> = ({ files, projectId, onUpdateFile }) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(files[0] || null);
  const [editorCode, setEditorCode] = useState<string>(selectedFile?.code || '');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const editorRef = useRef<any>(null);

  // Sync editor content when selected file changes
  useEffect(() => {
    if (selectedFile) {
      setEditorCode(selectedFile.code);
      setIsDirty(false);
      setSavedSuccess(false);
    }
  }, [selectedFile?.path]);

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme('codemind-matte-black', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', background: '0A0A0A' },
      ],
      colors: {
        'editor.background': '#0A0A0A',
        'editorGutter.background': '#0A0A0A',
        'editorLineNumber.foreground': '#52525B',
        'editorLineNumber.activeForeground': '#E2E8F0',
        'editor.lineHighlightBackground': '#141416',
        'editorCursor.foreground': '#E2E8F0',
        'editorWhitespace.foreground': '#27272A',
        'editorIndentGuide.background': '#18181B',
        'editorIndentGuide.activeBackground': '#27272A',
        'minimap.background': '#0A0A0A',
      }
    });
  };

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });

    // Add Ctrl+S / Cmd+S save command directly to Monaco
    editor.addCommand(2048 | 49, () => { // KeyMod.CtrlCmd | KeyCode.KeyS
      handleSave();
    });
  };

  const handleCodeChange = (value: string | undefined) => {
    const val = value ?? '';
    setEditorCode(val);
    setIsDirty(val !== selectedFile?.code);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setIsDirty(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);

    // Update parent state
    if (onUpdateFile) {
      onUpdateFile(selectedFile.path, editorCode);
    }

    // Persist to backend store
    if (projectId) {
      await saveFileContent(projectId, selectedFile.path, editorCode);
    }
  };

  const handleDiscard = () => {
    if (!selectedFile) return;
    setEditorCode(selectedFile.code);
    setIsDirty(false);
    if (editorRef.current) {
      editorRef.current.setValue(selectedFile.code);
    }
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editorCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const monacoLang = selectedFile ? getMonacoLanguage(selectedFile.path) : 'plaintext';
  const currentLinesCount = editorCode.split('\n').length;

  return (
    <div className="h-[calc(100vh-4rem)] p-6 flex space-x-6">
      {/* File Tree List */}
      <div className="w-80 bg-[#0D0E11] border border-white/[0.08] rounded-xl p-4 space-y-3 flex flex-col shrink-0 shadow-xl">
        <div className="flex items-center justify-between px-1 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <FolderTree className="w-3.5 h-3.5 text-zinc-400" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">Project Files</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
            {files.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {files.map((file) => {
            const isSelected = selectedFile?.path === file.path;
            const iconColor = getFileIconColor(file.path);
            const lineCount = isSelected ? currentLinesCount : file.lines;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full px-3 py-2 rounded-lg text-left border transition-all flex items-center justify-between cursor-pointer group ${
                  isSelected
                    ? 'bg-[#1C1E26] border-white/[0.14] shadow-xs text-white'
                    : 'bg-transparent border-transparent hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="w-6 h-6 rounded-md bg-[#14151B] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <FileCode className={`w-3.5 h-3.5 ${iconColor}`} />
                  </div>
                  <span className={`text-xs font-mono truncate ${isSelected ? 'text-zinc-100 font-semibold' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
                    {file.path}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isSelected && isDirty && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono px-1.5 py-0.5 rounded bg-white/[0.03]">
                    {lineCount}L
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Code & AST Inspector */}
      {selectedFile && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* VS Code Studio Editor Panel - Matte Black Edition */}
          <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/[0.08] rounded-xl flex flex-col shadow-xl overflow-hidden">
            {/* VS Code Editor Tab Header & Action Bar */}
            <div className="bg-[#0A0A0A] px-4 py-2.5 border-b border-white/[0.08] flex items-center justify-between gap-3 select-none">
              {/* Active Tab */}
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="flex items-center space-x-2 px-3 py-1 rounded-md bg-[#141414] border border-white/[0.08] text-xs font-mono">
                  <FileCode className={`w-3.5 h-3.5 ${getFileIconColor(selectedFile.path)}`} />
                  <span className="text-zinc-100 font-semibold truncate max-w-[220px]">
                    {selectedFile.path.split('/').pop()}
                  </span>
                  {isDirty && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-xs" title="Unsaved changes" />
                  )}
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141414] text-zinc-400 border border-white/[0.04] hidden sm:inline-block">
                  {monacoLang.toUpperCase()}
                </span>
              </div>

              {/* Editor Controls & Action Triggers */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={!isDirty && !savedSuccess}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    savedSuccess
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isDirty
                      ? 'bg-white/[0.12] hover:bg-white/[0.18] text-white border border-white/[0.2]'
                      : 'bg-white/[0.04] text-zinc-500 border border-white/[0.04] opacity-60 cursor-not-allowed'
                  }`}
                  title="Save (Ctrl+S)"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savedSuccess ? 'Saved' : 'Save'}</span>
                  <kbd className="hidden md:inline-block text-[9px] px-1 py-0.2 rounded bg-black/40 font-mono opacity-80">Ctrl+S</kbd>
                </button>

                {/* Discard / Revert */}
                {isDirty && (
                  <button
                    onClick={handleDiscard}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs transition-colors cursor-pointer border border-white/[0.06]"
                    title="Discard changes"
                  >
                    <RotateCcw className="w-3 h-3 text-zinc-400" />
                    <span className="hidden sm:inline">Discard</span>
                  </button>
                )}

                {/* Format Document - Clean Code2 icon, NO SPARKLES */}
                <button
                  onClick={handleFormat}
                  className="p-1.5 rounded-md hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Format Document (Shift+Alt+F)"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </button>

                {/* Word Wrap Toggle */}
                <button
                  onClick={() => setWordWrap(!wordWrap)}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    wordWrap ? 'bg-white/[0.08] text-zinc-200' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                  title={wordWrap ? 'Word Wrap Enabled (Alt+Z)' : 'Word Wrap Disabled (Alt+Z)'}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>

                {/* Edit / Read-only mode toggle */}
                <button
                  onClick={() => setIsReadOnly(!isReadOnly)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer border ${
                    isReadOnly
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-white/[0.04] text-zinc-300 border-white/[0.06] hover:bg-white/[0.08]'
                  }`}
                  title="Toggle Read-only / Edit Mode"
                >
                  {isReadOnly ? <Eye className="w-3 h-3" /> : <FileEdit className="w-3 h-3 text-emerald-400" />}
                  <span className="text-[11px]">{isReadOnly ? 'Read-only' : 'Edit'}</span>
                </button>

                {/* Copy Code */}
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Copy file contents"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Monaco Editor Container - Matte Black */}
            <div className="flex-1 w-full min-h-[420px] bg-[#0A0A0A]">
              <Editor
                height="100%"
                language={monacoLang}
                value={editorCode}
                theme="codemind-matte-black"
                beforeMount={handleBeforeMount}
                onChange={handleCodeChange}
                onMount={handleEditorMount}
                options={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                  fontLigatures: true,
                  minimap: { enabled: true, maxColumn: 70, scale: 1 },
                  scrollBeyondLastLine: false,
                  wordWrap: wordWrap ? 'on' : 'off',
                  automaticLayout: true,
                  tabSize: 2,
                  lineNumbers: 'on',
                  bracketPairColorization: { enabled: true },
                  formatOnPaste: true,
                  formatOnType: true,
                  renderLineHighlight: 'all',
                  folding: true,
                  padding: { top: 12, bottom: 12 },
                  readOnly: isReadOnly,
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                  suggest: {
                    showWords: true
                  }
                }}
              />
            </div>

            {/* VS Code Status Bar - Matte Black Edition */}
            <div className="bg-[#0A0A0A] border-t border-white/[0.08] text-zinc-400 px-3.5 py-1.5 flex items-center justify-between text-[11px] font-mono select-none">
              <div className="flex items-center space-x-3">
                <span className="text-zinc-300">Ln {cursorPos.line}, Col {cursorPos.col}</span>
                <span className="text-zinc-600">|</span>
                <span>Spaces: 2</span>
                <span className="text-zinc-600">|</span>
                <span>UTF-8</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`flex items-center gap-1.5 ${isDirty ? 'text-amber-400' : 'text-zinc-300'}`}>
                  {isDirty ? <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> : <Check className="w-3 h-3 text-emerald-400" />}
                  <span>{isDirty ? 'Unsaved' : 'Saved'}</span>
                </span>
                <span className="text-zinc-600">|</span>
                <span className="font-semibold text-zinc-300 uppercase tracking-wider">{monacoLang}</span>
              </div>
            </div>
          </div>

          {/* Universal AST Breakdown */}
          <div className="bg-[#0D0E11] border border-white/[0.08] rounded-xl p-5 space-y-5 shadow-xl overflow-y-auto">
            <div className="border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>AST Symbol Inspector</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Abstract Syntax Tree classification</p>
            </div>

            {/* Classes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-purple-400" />
                  <span>Defined Classes</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.04]">
                  {selectedFile.symbols.classes.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {selectedFile.symbols.classes.length > 0 ? (
                  selectedFile.symbols.classes.map((cls) => (
                    <div
                      key={cls}
                      className="px-3 py-2 rounded-lg bg-[#12141A] hover:bg-[#181B22] border border-white/[0.06] flex items-center justify-between text-xs transition-colors shadow-xs"
                    >
                      <span className="font-mono text-zinc-100 font-medium">{cls}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/25">
                        class
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic block px-1">No classes defined</span>
                )}
              </div>
            </div>

            {/* Functions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Code2 className="w-3 h-3 text-sky-400" />
                  <span>Extracted Functions</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                  {selectedFile.symbols.functions.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {selectedFile.symbols.functions.length > 0 ? (
                  selectedFile.symbols.functions.map((fn) => {
                    const { tag, bg } = getFunctionTypeBadge(fn);
                    return (
                      <div
                        key={fn}
                        className="px-3 py-2 rounded-lg bg-[#12141A] hover:bg-[#181B22] border border-white/[0.06] flex items-center justify-between text-xs transition-colors shadow-xs group"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono text-zinc-200 font-medium group-hover:text-white truncate">
                            {fn}
                          </span>
                          <span className="font-mono text-zinc-500 text-[11px]">()</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border shrink-0 ${bg}`}>
                          {tag}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-xs text-zinc-500 italic block px-1">No functions defined</span>
                )}
              </div>
            </div>

            {/* APIs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Network className="w-3 h-3 text-amber-400" />
                  <span>Exposed API Endpoints</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                  {selectedFile.symbols.apis.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {selectedFile.symbols.apis.length > 0 ? (
                  selectedFile.symbols.apis.map((api) => (
                    <div
                      key={api}
                      className="px-3 py-2 rounded-lg bg-[#12141A] hover:bg-[#181B22] border border-white/[0.06] flex items-center justify-between text-xs transition-colors shadow-xs"
                    >
                      <span className="font-mono text-zinc-200 font-medium truncate mr-2">{api}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
                        api
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic block px-1">No API endpoints exposed</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
