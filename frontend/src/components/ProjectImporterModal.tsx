import React, { useState } from 'react';
import { Upload, FolderSearch, ArrowRight, AlertCircle, Loader2, Globe, X } from 'lucide-react';
import type { ProjectMeta, ProjectFile, KnowledgeGraphData, SecurityReport } from '../types';
import { scanLocalDirectory, uploadProjectZip, scrapeWebsiteUrl } from '../services/api';
import { LoadingLines } from './LoadingLines';
import { MeshDriftShaderBackground } from './MeshDriftShaderBackground';

interface ProjectImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: {
    project: ProjectMeta;
    files: ProjectFile[];
    knowledge_graph: KnowledgeGraphData;
    security: SecurityReport;
  }) => void;
}

export const ProjectImporterModal: React.FC<ProjectImporterModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [localPath, setLocalPath] = useState('');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'local' | 'upload' | 'url'>('local');

  if (!isOpen) return null;

  if (importing) {
    return (
      <div className="fixed inset-0 z-[9999] w-screen h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex flex-col items-center justify-center select-none overflow-hidden transition-colors">
        <LoadingLines />
      </div>
    );
  }

  const handleScanLocal = async () => {
    if (!localPath.trim() || importing) return;
    setImporting(true);
    setErrorMessage('');
    const startTime = Date.now();
    try {
      const result = await scanLocalDirectory(localPath.trim());
      const elapsed = Date.now() - startTime;
      if (elapsed < 4000) {
        await new Promise((r) => setTimeout(r, 4000 - elapsed));
      }
      onImportSuccess(result);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to scan local directory');
    } finally {
      setImporting(false);
    }
  };

  const handleUploadZip = async () => {
    if (!zipFile || importing) return;
    setImporting(true);
    setErrorMessage('');
    const startTime = Date.now();
    try {
      const result = await uploadProjectZip(zipFile);
      const elapsed = Date.now() - startTime;
      if (elapsed < 4000) {
        await new Promise((r) => setTimeout(r, 4000 - elapsed));
      }
      onImportSuccess(result);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse uploaded ZIP file');
    } finally {
      setImporting(false);
    }
  };

  const handleScrapeUrl = async () => {
    if (!websiteUrl.trim() || importing) return;
    setImporting(true);
    setErrorMessage('');
    const startTime = Date.now();
    try {
      const result = await scrapeWebsiteUrl(websiteUrl.trim());
      const elapsed = Date.now() - startTime;
      if (elapsed < 4000) {
        await new Promise((r) => setTimeout(r, 4000 - elapsed));
      }
      onImportSuccess(result);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch website URL');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-hidden bg-black/80">
      {/* Animated WebGL Shader Background covering previous project */}
      <MeshDriftShaderBackground className="z-0" />
      {/* Backdrop contrast overlay - subtle so shader animation shines through on mobile and desktop */}
      <div 
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px] z-[1]" 
        onClick={() => { if (!importing) onClose(); }} 
      />

      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 bg-white/95 dark:bg-[#141518]/92 backdrop-blur-md border border-zinc-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar transition-colors duration-200"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              Reverse Engineer Codebase or Website
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Select a local directory path, upload a project ZIP, or enter a website URL
            </p>
          </div>
          <button 
            onClick={onClose} 
            disabled={importing}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] p-1 rounded-2xl">
          <button
            onClick={() => !importing && setActiveTab('local')}
            disabled={importing}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'local'
                ? 'bg-white dark:bg-[#141518] text-zinc-900 dark:text-white shadow-2xs border border-zinc-200 dark:border-white/[0.08]'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <FolderSearch className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Local Directory</span>
          </button>

          <button
            onClick={() => !importing && setActiveTab('upload')}
            disabled={importing}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-[#141518] text-zinc-900 dark:text-white shadow-2xs border border-zinc-200 dark:border-white/[0.08]'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>ZIP Archive</span>
          </button>

          <button
            onClick={() => !importing && setActiveTab('url')}
            disabled={importing}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white dark:bg-[#141518] text-zinc-900 dark:text-white shadow-2xs border border-zinc-200 dark:border-white/[0.08]'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Website URL</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Local Directory */}
        {activeTab === 'local' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-2">
                Absolute Directory Path on Disk
              </label>
              <input
                type="text"
                placeholder="e.g. C:/Users/aditya/projects/my-awesome-app"
                value={localPath}
                disabled={importing}
                onChange={(e) => setLocalPath(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] focus:border-zinc-400 dark:focus:border-zinc-500 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none code-font disabled:opacity-50 transition-colors"
              />
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                CodeMind AI will automatically ignore node_modules, .git, binaries, and virtualenvs.
              </p>
            </div>

            <button
              onClick={handleScanLocal}
              disabled={importing || !localPath.trim()}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs transition-colors disabled:opacity-40 flex items-center justify-center space-x-2 cursor-pointer shadow-xs outline-none focus:outline-none focus:ring-0 select-none"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-current" />
                  <span>Scanning & Parsing Universal AST...</span>
                </>
              ) : (
                <>
                  <span>Scan & Reverse Engineer Directory</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: ZIP Archive */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center text-center transition-all relative ${
              zipFile
                ? 'border-zinc-500/60 dark:border-white/40 bg-zinc-100 dark:bg-white/[0.04]'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-zinc-50 dark:bg-zinc-900/40'
            }`}>
              <input
                type="file"
                accept=".zip"
                disabled={importing}
                onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              {importing ? (
                <div className="flex flex-col items-center space-y-2 py-2">
                  <Loader2 className="w-8 h-8 text-zinc-700 dark:text-zinc-300 animate-spin" />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-2">
                    Analyzing AST structure & building Knowledge Graph...
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-zinc-500 dark:text-zinc-400 mb-2" />
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-1">
                    {zipFile ? zipFile.name : 'Click or Drag & Drop Project ZIP File'}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm">
                    Supports .zip archives containing Python, TS/JS, Java, Go, Rust, C++, SQL, Dockerfiles
                  </p>
                </>
              )}
            </div>

            <button
              onClick={handleUploadZip}
              disabled={importing || !zipFile}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs transition-colors disabled:opacity-40 flex items-center justify-center space-x-2 cursor-pointer shadow-xs outline-none focus:outline-none focus:ring-0 select-none"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-current" />
                  <span>Extracting & Generating Knowledge Graph...</span>
                </>
              ) : (
                <>
                  <span>Extract & Reverse Engineer ZIP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 3: Live Website URL Scrape */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-2">
                Live Website URL
              </label>
              <input
                type="text"
                placeholder="e.g. https://example.com or http://localhost:3000"
                value={websiteUrl}
                disabled={importing}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] focus:border-zinc-400 dark:focus:border-zinc-500 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none code-font disabled:opacity-50 transition-colors"
              />
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                CodeMind AI will fetch HTML markup, JS script bundles, CSS stylesheets, and API endpoints directly from the website.
              </p>
            </div>

            <button
              onClick={handleScrapeUrl}
              disabled={importing || !websiteUrl.trim()}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs transition-colors disabled:opacity-40 flex items-center justify-center space-x-2 cursor-pointer shadow-xs outline-none focus:outline-none focus:ring-0 select-none"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-current" />
                  <span>Fetching Website Source & Analyzing AST...</span>
                </>
              ) : (
                <>
                  <span>Fetch & Reverse Engineer Website URL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
