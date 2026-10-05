import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { ActiveTab } from './components/Sidebar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { KnowledgeGraphViewer } from './components/KnowledgeGraphViewer';
import { ArchitectureDiagrams } from './components/ArchitectureDiagrams';
import { ChangeImpactView } from './components/ChangeImpactView';
import { AIChatConsole } from './components/AIChatConsole';
import { SecurityAnalyzer } from './components/SecurityAnalyzer';
import { DocGeneratorView } from './components/DocGeneratorView';
import { CodeExplorerView } from './components/CodeExplorerView';
import { ProjectImporterModal } from './components/ProjectImporterModal';
import { SpotlightCard } from './components/ui/SpotlightCard';
import { PredictiveArcCanvas } from './components/effects/predictive-arc/PredictiveArcCanvas';
import './components/effects/predictive-arc/styles.css';

// Phase 2 Repository Transformation Engine
import { TransformationEngineView } from './components/TransformationEngineView';

import type { ProjectMeta, ProjectFile, KnowledgeGraphData, SecurityReport } from './types';
import { FolderOpen, Upload, Globe, ArrowRight } from 'lucide-react';
import { CodeMindLogo } from './components/CodeMindLogo';
import { LoadingLines } from './components/LoadingLines';
import { fetchProjects, scanLocalDirectory, uploadProjectZip, scrapeWebsiteUrl, analyzeProject } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [currentProject, setCurrentProject] = useState<ProjectMeta | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraphData>({ node_count: 0, edge_count: 0, nodes: [], links: [] });
  const [security, setSecurity] = useState<SecurityReport>({
    health_score: 100,
    security_grade: 'A',
    maintainability_rating: 'A',
    total_issues: 0,
    vulnerabilities: [],
    code_smells: [],
    technical_debt_hours: 0
  });

  const [importerOpen, setImporterOpen] = useState(false);
  const [impactTargetSymbol, setImpactTargetSymbol] = useState('');
  const [selectedChatSymbol, setSelectedChatSymbol] = useState<{ label: string; file?: string; type?: string } | null>(null);

  // Importer state for full-page onboarding
  const [landingTab, setLandingTab] = useState<'local' | 'upload' | 'url'>('local');
  const [localDirInput, setLocalDirInput] = useState('');
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);
  const [websiteUrlInput, setWebsiteUrlInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [recentProjects, setRecentProjects] = useState<ProjectMeta[]>([]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleImportSuccess = (data: {
    project: ProjectMeta;
    files: ProjectFile[];
    knowledge_graph: KnowledgeGraphData;
    security: SecurityReport;
  }) => {
    setCurrentProject(data.project);
    setFiles(data.files);
    setKnowledgeGraph(data.knowledge_graph);
    setSecurity(data.security);
    setImporterOpen(false);
    setMobileSidebarOpen(false);
    setActiveTab('overview');
    if (data.project?.id) {
      try {
        localStorage.setItem('codemind_active_project_id', data.project.id);
      } catch {}
    }
  };

  const handleSelectRecentProject = async (pId: string) => {
    setIsImporting(true);
    setImportError('');
    try {
      localStorage.setItem('codemind_active_project_id', pId);
    } catch {}
    try {
      const result = await analyzeProject(pId);
      if (result && result.project) {
        handleImportSuccess({
          project: result.project,
          files: result.files,
          knowledge_graph: result.knowledge_graph,
          security: result.security
        });
      }
    } catch (err: any) {
      setImportError(err.message || 'Failed to load project');
    } finally {
      setIsImporting(false);
    }
  };

  // Load existing projects on startup and auto-activate the most recent/active one
  useEffect(() => {
    fetchProjects().then(projs => {
      if (projs && projs.length > 0) {
        setRecentProjects(projs);
        let savedId: string | null = null;
        try {
          savedId = localStorage.getItem('codemind_active_project_id');
        } catch {}
        const matched = projs.find(p => p.id === savedId);
        const target = matched || projs.find(p => (p as any).is_active) || projs[0];
        handleSelectRecentProject(target.id);
      }
    });
  }, []);

  const handleScanLocal = async (path?: string) => {
    const targetPath = (path || localDirInput).trim();
    if (!targetPath || isImporting) return;
    setIsImporting(true);
    setImportError('');
    const startTime = Date.now();
    try {
      const result = await scanLocalDirectory(targetPath);
      const elapsed = Date.now() - startTime;
      if (elapsed < 4000) {
        await new Promise((r) => setTimeout(r, 4000 - elapsed));
      }
      handleImportSuccess(result);
    } catch (err: any) {
      setImportError(err.message || 'Failed to scan local directory');
    } finally {
      setIsImporting(false);
    }
  };

  const handleUploadZip = async (file: File) => {
    if (!file || isImporting) return;
    setIsImporting(true);
    setImportError('');
    const startTime = Date.now();
    try {
      const result = await uploadProjectZip(file);
      const elapsed = Date.now() - startTime;
      if (elapsed < 4000) {
        await new Promise((r) => setTimeout(r, 4000 - elapsed));
      }
      handleImportSuccess(result);
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse uploaded ZIP file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleScrapeUrl = async () => {
    if (!websiteUrlInput.trim() || isImporting) return;
    setIsImporting(true);
    setImportError('');
    const startTime = Date.now();
    try {
      const result = await scrapeWebsiteUrl(websiteUrlInput.trim());
      const elapsed = Date.now() - startTime;
      if (elapsed < 4000) {
        await new Promise((r) => setTimeout(r, 4000 - elapsed));
      }
      handleImportSuccess(result);
    } catch (err: any) {
      setImportError(err.message || 'Failed to reverse engineer website');
    } finally {
      setIsImporting(false);
    }
  };

  if (isImporting) {
    return (
      <div className="fixed inset-0 z-[9999] w-screen h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex flex-col items-center justify-center select-none overflow-hidden transition-colors">
        <LoadingLines />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-200">
      {/* Header */}
      <Header
        currentProject={currentProject}
        onOpenImporter={() => setImporterOpen(true)}
        onOpenImpactTarget={() => {
          setImpactTargetSymbol('');
          setActiveTab('impact');
        }}
        isMobileSidebarOpen={mobileSidebarOpen}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Body Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Navigation Sidebar ONLY rendered when a project is loaded */}
        {currentProject && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            securityIssuesCount={security?.total_issues || 0}
            isOpenMobile={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Dynamic Workspace View */}
        <main className={`flex-1 relative bg-zinc-50 dark:bg-[#0A0A0A] min-h-0 transition-colors duration-200 ${['diagrams', 'graph'].includes(activeTab) ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {!currentProject ? (
            /* Dedicated Interactive Full-Screen Importer Hub - Precision Balanced Layout */
            <div className="min-h-full w-full flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 md:p-8 bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200 relative overflow-y-auto">
              <div className="shader-frame">
                <PredictiveArcCanvas
                  variant="signal-particles"
                  speed={1.00}
                  hue={0}
                  saturation={1.00}
                  brightness={1.00}
                />
              </div>
              <div className="max-w-xl w-full my-auto space-y-5 sm:space-y-7 animate-in fade-in duration-200 relative z-10 py-3 sm:py-6">
                {/* Hero Title */}
                <div className="text-center space-y-2.5 sm:space-y-3 flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-[#141518] border border-zinc-200/80 dark:border-white/[0.08] p-2 sm:p-2.5 flex items-center justify-center shadow-xs">
                    <CodeMindLogo className="w-full h-full" />
                  </div>
                  <div className="inline-flex items-center justify-center gap-2.5 sm:gap-3.5 select-none py-1">
                    <span className="w-6 sm:w-12 h-[1px] bg-zinc-300 dark:bg-zinc-800" />
                    <span className="text-[10px] sm:text-xs font-mono font-medium tracking-[0.2em] uppercase text-zinc-600 dark:text-zinc-400">
                      Code Intelligence & Reverse Engineering
                    </span>
                    <span className="w-6 sm:w-12 h-[1px] bg-zinc-300 dark:bg-zinc-800" />
                  </div>
                  <h1 
                    className="text-xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight"
                    style={{ fontFamily: "'Unbounded', sans-serif", letterSpacing: '-0.03em' }}
                  >
                    Import Codebase to Begin
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Scan a local repository on disk, upload a ZIP archive, or reverse engineer a web URL to unlock deep AST graphs and code intelligence.
                  </p>
                </div>

                {/* Importer Card Container - Spotlight Card */}
                <SpotlightCard className="p-4 sm:p-6 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#111215]/80 backdrop-blur-xl shadow-xs space-y-4">
                  {/* Tab Selector */}
                  <div className="grid grid-cols-3 p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-white/[0.06] gap-1 mb-4 sm:mb-4.5">
                    <button
                      type="button"
                      onClick={() => { setLandingTab('local'); setImportError(''); }}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 outline-none focus:outline-none focus:ring-0 select-none ${
                        landingTab === 'local'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs border border-zinc-200/80 dark:border-zinc-700/60'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-transparent'
                      }`}
                    >
                      <FolderOpen className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" strokeWidth={2} />
                      <span className="truncate">Local Folder</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLandingTab('upload'); setImportError(''); }}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 outline-none focus:outline-none focus:ring-0 select-none ${
                        landingTab === 'upload'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs border border-zinc-200/80 dark:border-zinc-700/60'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-transparent'
                      }`}
                    >
                      <Upload className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" strokeWidth={2} />
                      <span className="truncate">Upload ZIP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLandingTab('url'); setImportError(''); }}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 outline-none focus:outline-none focus:ring-0 select-none ${
                        landingTab === 'url'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs border border-zinc-200/80 dark:border-zinc-700/60'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-transparent'
                      }`}
                    >
                      <Globe className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" strokeWidth={2} />
                      <span className="truncate">Web / URL</span>
                    </button>
                  </div>

                  {/* Tab 1: Local Folder */}
                  {landingTab === 'local' && (
                    <div className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                          <span>Local Directory Absolute Path</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">POSIX / Windows</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. C:\Users\aditya\projects\my-repo or /home/user/project"
                          value={localDirInput}
                          onChange={(e) => setLocalDirInput(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.08] focus:border-zinc-400 dark:focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all font-mono"
                          disabled={isImporting}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleScanLocal()}
                        disabled={!localDirInput.trim() || isImporting}
                        className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs border border-zinc-200/90 dark:border-white/10 shadow-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white outline-none focus:outline-none focus:ring-0 select-none"
                      >
                        {isImporting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            <span>Reverse Engineering Codebase...</span>
                          </>
                        ) : (
                          <>
                            <FolderOpen className="w-4 h-4" strokeWidth={2} />
                            <span>Scan & Reverse Engineer</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Tab 2: Upload ZIP */}
                  {landingTab === 'upload' && (
                    <div className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                          <span>Project Archive File</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">.ZIP Archive</span>
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            id="landing-zip-upload-field"
                            accept=".zip"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setSelectedZipFile(f);
                            }}
                            disabled={isImporting}
                          />
                          <label
                            htmlFor="landing-zip-upload-field"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const f = e.dataTransfer.files?.[0];
                              if (f) setSelectedZipFile(f);
                            }}
                            className="w-full bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.15] rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 flex items-center justify-between cursor-pointer transition-all font-mono select-none"
                          >
                            <span className={`truncate text-xs ${selectedZipFile ? 'text-zinc-900 dark:text-white font-medium' : 'text-zinc-400 dark:text-zinc-500'}`}>
                              {selectedZipFile ? selectedZipFile.name : 'Choose or drop codebase .zip archive...'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-300 font-sans font-medium shrink-0 ml-2">
                              Browse
                            </span>
                          </label>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectedZipFile && handleUploadZip(selectedZipFile)}
                        disabled={!selectedZipFile || isImporting}
                        className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs border border-zinc-200/90 dark:border-white/10 shadow-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white outline-none focus:outline-none focus:ring-0 select-none"
                      >
                        {isImporting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            <span>Extracting & Parsing AST Symbols...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" strokeWidth={2} />
                            <span>Upload & Reverse Engineer ZIP</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Tab 3: URL */}
                  {landingTab === 'url' && (
                    <div className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                          <span>Website or Repository URL</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">HTTPS</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. https://github.com/org/repo or https://example.com"
                          value={websiteUrlInput}
                          onChange={(e) => setWebsiteUrlInput(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/[0.08] focus:border-zinc-400 dark:focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all font-mono"
                          disabled={isImporting}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleScrapeUrl}
                        disabled={!websiteUrlInput.trim() || isImporting}
                        className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs border border-zinc-200/90 dark:border-white/10 shadow-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white outline-none focus:outline-none focus:ring-0 select-none"
                      >
                        {isImporting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            <span>Fetching & Reverse Engineering...</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-4 h-4" strokeWidth={2} />
                            <span>Reverse Engineer URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Error Alert */}
                  {importError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                      {importError}
                    </div>
                  )}
                </SpotlightCard>

                {/* Recently Imported Projects Quick Load */}
                {recentProjects.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between px-0.5">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Recently Scanned Repositories
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                        {recentProjects.length} found
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {recentProjects.slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectRecentProject(p.id)}
                          className="p-3 rounded-xl bg-white/80 dark:bg-[#121316]/90 hover:bg-zinc-50 dark:hover:bg-[#16171b] border border-zinc-200/80 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.16] transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                        >
                          <div className="space-y-0.5 truncate pr-2.5">
                            <h4 className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                              {p.name}
                            </h4>
                            <div className="flex items-center space-x-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                              <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                {p.primary_language || 'Project'}
                              </span>
                              <span>{p.total_files} files</span>
                            </div>
                          </div>
                          <button className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 group-hover:bg-zinc-900 dark:group-hover:bg-white text-zinc-700 dark:text-zinc-300 group-hover:text-white dark:group-hover:text-zinc-950 transition-all shrink-0">
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Brand */}
                <div className="pt-1 text-center">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-300 font-normal">
                    Made by{' '}
                    <a
                      href="https://team.axiogen.in"
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-800 dark:text-zinc-100 hover:text-sky-500 dark:hover:text-sky-400 transition-colors font-medium underline underline-offset-2 decoration-zinc-400 dark:decoration-zinc-500"
                    >
                      team.axiogen.in
                    </a>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Active Codebase Views */
            <>
              {activeTab === 'overview' && (
                <OverviewDashboard
                  project={currentProject}
                  files={files}
                  security={security}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onSelectImpactTarget={(sym) => {
                    setImpactTargetSymbol(sym);
                    setActiveTab('impact');
                  }}
                />
              )}

              {/* Phase 2 Repository Transformation Engine */}
              {activeTab === 'transform' && (
                <TransformationEngineView projectId={currentProject?.id} projectFiles={files} />
              )}

              {activeTab === 'graph' && (
                <KnowledgeGraphViewer
                  data={knowledgeGraph}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onSelectImpactTarget={(sym) => {
                    setImpactTargetSymbol(sym);
                    setActiveTab('impact');
                  }}
                  onAskAI={(sym) => {
                    setSelectedChatSymbol(sym);
                    setActiveTab('chat');
                  }}
                />
              )}

              {/* Architecture Diagrams - STRICTLY PRESERVED FEATURE */}
              {activeTab === 'diagrams' && (
                <ArchitectureDiagrams files={files} knowledgeGraph={knowledgeGraph} />
              )}

              {activeTab === 'impact' && (
                <ChangeImpactView
                  initialTarget={impactTargetSymbol}
                  projectId={currentProject.id}
                  files={files}
                />
              )}

              {activeTab === 'chat' && (
                <AIChatConsole projectId={currentProject.id} selectedSymbol={selectedChatSymbol} />
              )}

              {activeTab === 'security' && (
                <SecurityAnalyzer security={security} />
              )}

              {activeTab === 'docs' && (
                <DocGeneratorView projectId={currentProject.id} />
              )}

              {activeTab === 'files' && (
                <CodeExplorerView 
                  files={files} 
                  projectId={currentProject.id}
                  onUpdateFile={(path, newCode) => {
                    setFiles(prev => prev.map(f => f.path === path ? { ...f, code: newCode, lines: newCode.split('\n').length } : f));
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Importer Modal */}
      <ProjectImporterModal
        isOpen={importerOpen}
        onClose={() => setImporterOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default App;
