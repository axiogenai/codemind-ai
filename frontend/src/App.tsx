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

// Phase 2 Repository Transformation Engine
import { TransformationEngineView } from './components/TransformationEngineView';

import type { ProjectMeta, ProjectFile, KnowledgeGraphData, SecurityReport } from './types';
import { FolderSearch, Cpu, ShieldCheck, Zap } from 'lucide-react';
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
  const [websiteUrlInput, setWebsiteUrlInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [recentProjects, setRecentProjects] = useState<ProjectMeta[]>([]);

  // Load existing projects on startup
  useEffect(() => {
    fetchProjects().then(projs => {
      if (projs && projs.length > 0) {
        setRecentProjects(projs);
      }
    });
  }, []);

  const handleScanLocal = async (path?: string) => {
    const targetPath = (path || localDirInput).trim();
    if (!targetPath || isImporting) return;
    setIsImporting(true);
    setImportError('');
    try {
      const result = await scanLocalDirectory(targetPath);
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
    try {
      const result = await uploadProjectZip(file);
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
    try {
      const result = await scrapeWebsiteUrl(websiteUrlInput.trim());
      handleImportSuccess(result);
    } catch (err: any) {
      setImportError(err.message || 'Failed to reverse engineer website');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectRecentProject = async (pId: string) => {
    setIsImporting(true);
    setImportError('');
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
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
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
      <div className="flex-1 flex overflow-hidden">
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
        <main className="flex-1 overflow-y-auto relative bg-[#0A0A0A]">
          {!currentProject ? (
            /* Dedicated Interactive Full-Screen Importer Hub */
            <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-12 bg-[#0A0A0A]">
              <div className="max-w-2xl w-full space-y-8 animate-in fade-in duration-200">
                {/* Hero Title */}
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-[#121212] border border-neutral-800 flex items-center justify-center mx-auto text-neutral-300 shadow-2xl">
                    <Cpu className="w-8 h-8 text-white" />
                  </div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-extrabold bg-neutral-900 text-neutral-300 border border-neutral-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>STANDALONE CODE INTELLIGENCE PLATFORM</span>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight">
                    Import Codebase to Begin
                  </h2>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                    Scan a local repository on disk, upload a ZIP archive, or reverse engineer a web URL to unlock deep AST graphs and code intelligence.
                  </p>
                </div>

                {/* Importer Card Container */}
                <div className="p-6 rounded-3xl bg-[#121212] border border-neutral-800 shadow-2xl space-y-5">
                  {/* Tab Selector */}
                  <div className="flex items-center p-1 rounded-2xl bg-neutral-900 border border-neutral-800 gap-1">
                    <button
                      onClick={() => { setLandingTab('local'); setImportError(''); }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                        landingTab === 'local' ? 'bg-[#0A0A0A] text-white shadow-sm border border-neutral-700' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <FolderSearch className="w-4 h-4 text-emerald-400" />
                      <span>Local Folder</span>
                    </button>
                    <button
                      onClick={() => { setLandingTab('upload'); setImportError(''); }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                        landingTab === 'upload' ? 'bg-[#0A0A0A] text-white shadow-sm border border-neutral-700' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span>Upload ZIP</span>
                    </button>
                    <button
                      onClick={() => { setLandingTab('url'); setImportError(''); }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                        landingTab === 'url' ? 'bg-[#0A0A0A] text-white shadow-sm border border-neutral-700' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>Web / URL</span>
                    </button>
                  </div>

                  {/* Tab 1: Local Folder */}
                  {landingTab === 'local' && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-300">Local Directory Absolute Path</label>
                        <input
                          type="text"
                          placeholder="e.g. C:\Users\aditya\projects\my-repo or /home/user/project"
                          value={localDirInput}
                          onChange={(e) => setLocalDirInput(e.target.value)}
                          className="w-full bg-[#0A0A0A] border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-white transition-all font-mono"
                          disabled={isImporting}
                        />
                      </div>
                      <button
                        onClick={() => handleScanLocal()}
                        disabled={!localDirInput.trim() || isImporting}
                        className="w-full py-3 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                      >
                        {isImporting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></span>
                            <span>Reverse Engineering Codebase...</span>
                          </>
                        ) : (
                          <>
                            <FolderSearch className="w-4 h-4" />
                            <span>Scan & Reverse Engineer</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Tab 2: Upload ZIP */}
                  {landingTab === 'upload' && (
                    <div className="space-y-4">
                      <label className="border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#0A0A0A] group">
                        <input
                          type="file"
                          accept=".zip"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadZip(f);
                          }}
                          disabled={isImporting}
                        />
                        <Zap className="w-8 h-8 text-neutral-400 group-hover:text-white transition-all mb-2" />
                        <span className="text-xs font-bold text-neutral-200">Click or Drag & Drop .ZIP repository archive</span>
                        <span className="text-[11px] text-neutral-500 mt-1">Supports TypeScript, JavaScript, Python, Go, Java, Rust</span>
                      </label>
                      {isImporting && (
                        <div className="text-center text-xs text-neutral-300 font-bold flex items-center justify-center space-x-2">
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Extracting & Parsing AST Symbols...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: URL */}
                  {landingTab === 'url' && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-300">Website or Repository URL</label>
                        <input
                          type="text"
                          placeholder="e.g. https://example.com"
                          value={websiteUrlInput}
                          onChange={(e) => setWebsiteUrlInput(e.target.value)}
                          className="w-full bg-[#0A0A0A] border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-white transition-all font-mono"
                          disabled={isImporting}
                        />
                      </div>
                      <button
                        onClick={handleScrapeUrl}
                        disabled={!websiteUrlInput.trim() || isImporting}
                        className="w-full py-3 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                      >
                        {isImporting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></span>
                            <span>Fetching & Reverse Engineering...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Reverse Engineer URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Error Alert */}
                  {importError && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
                      {importError}
                    </div>
                  )}
                </div>

                {/* Recently Imported Projects Quick Load */}
                {recentProjects.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Recently Scanned Repositories
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {recentProjects.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectRecentProject(p.id)}
                          className="p-3.5 rounded-2xl bg-[#121212] hover:bg-[#181818] border border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="space-y-1 truncate pr-3">
                            <h4 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors truncate">
                              {p.name}
                            </h4>
                            <div className="flex items-center space-x-2 text-[10px] text-neutral-400 font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                                {p.primary_language}
                              </span>
                              <span>{p.total_files} files</span>
                            </div>
                          </div>
                          <button className="px-3 py-1.5 rounded-xl bg-neutral-900 group-hover:bg-white group-hover:text-black text-neutral-300 text-[11px] font-bold transition-all border border-neutral-800 shrink-0">
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Brand */}
                <div className="pt-4 text-center">
                  <p className="text-xs text-neutral-500 font-medium">
                    Made by{' '}
                    <a
                      href="https://team.axiogen.in"
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-400 hover:text-cyan-400 transition-colors font-semibold underline underline-offset-2"
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
                <CodeExplorerView files={files} />
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
