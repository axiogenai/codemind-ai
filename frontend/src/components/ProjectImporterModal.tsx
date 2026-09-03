import React, { useState } from 'react';
import { Upload, FolderSearch, ArrowRight, AlertCircle, Loader2, RefreshCw, Globe } from 'lucide-react';
import type { ProjectMeta, ProjectFile, KnowledgeGraphData, SecurityReport } from '../types';
import { scanLocalDirectory, uploadProjectZip, scrapeWebsiteUrl } from '../services/api';

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

  const handleScanLocal = async () => {
    if (!localPath.trim() || importing) return;
    setImporting(true);
    setErrorMessage('');
    try {
      const result = await scanLocalDirectory(localPath.trim());
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
    try {
      const result = await uploadProjectZip(zipFile);
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
    try {
      const result = await scrapeWebsiteUrl(websiteUrl.trim());
      onImportSuccess(result);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch website URL');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-neutral-800 rounded-3xl max-w-xl w-full p-6 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              Reverse Engineer Codebase or Website
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Select a local directory path, upload a project ZIP, or enter a website URL</p>
          </div>
          <button 
            onClick={onClose} 
            disabled={importing}
            className="text-gray-400 hover:text-white font-bold text-sm disabled:opacity-30 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-gray-900 border border-gray-800 p-1.5 rounded-2xl">
          <button
            onClick={() => !importing && setActiveTab('local')}
            disabled={importing}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'local' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FolderSearch className="w-4 h-4" />
            <span>Local Directory</span>
          </button>

          <button
            onClick={() => !importing && setActiveTab('upload')}
            disabled={importing}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'upload' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>ZIP Archive</span>
          </button>

          <button
            onClick={() => !importing && setActiveTab('url')}
            disabled={importing}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'url' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Website URL</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Local Directory */}
        {activeTab === 'local' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-2">Absolute Directory Path on Disk</label>
              <input
                type="text"
                placeholder="e.g. C:/Users/aditya/projects/my-awesome-app"
                value={localPath}
                disabled={importing}
                onChange={(e) => setLocalPath(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-500 code-font disabled:opacity-50"
              />
              <p className="text-[11px] text-gray-400 mt-1">CodeMind AI will automatically ignore node_modules, .git, binaries, and virtualenvs.</p>
            </div>

            <button
              onClick={handleScanLocal}
              disabled={importing || !localPath.trim()}
              className="w-full py-3.5 rounded-xl bg-neutral-100 text-neutral-900 font-bold text-xs hover:bg-white border border-neutral-300 transition-all disabled:opacity-50 flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-700" />
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
            <div className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all bg-gray-900/40 relative ${
              zipFile ? 'border-purple-500/60 bg-purple-950/20' : 'border-gray-800 hover:border-purple-500/50'
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
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                    <RefreshCw className="w-5 h-5 text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                  </div>
                  <span className="text-xs font-bold text-purple-300 mt-2">Analyzing AST structure & building Knowledge Graph...</span>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-purple-400 mb-3 animate-bounce" />
                  <h4 className="text-sm font-bold text-white mb-1">
                    {zipFile ? zipFile.name : 'Click or Drag & Drop Project ZIP File'}
                  </h4>
                  <p className="text-xs text-gray-400">Supports .zip archives containing Python, TS/JS, Java, Go, Rust, C++, SQL, Dockerfiles</p>
                </>
              )}
            </div>

            <button
              onClick={handleUploadZip}
              disabled={importing || !zipFile}
              className="w-full py-3.5 rounded-xl bg-neutral-100 text-neutral-900 font-bold text-xs hover:bg-white border border-neutral-300 transition-all disabled:opacity-50 flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-700" />
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
              <label className="text-xs font-bold text-gray-300 block mb-2">Live Website URL</label>
              <input
                type="text"
                placeholder="e.g. https://example.com or http://localhost:3000"
                value={websiteUrl}
                disabled={importing}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500 code-font disabled:opacity-50"
              />
              <p className="text-[11px] text-gray-400 mt-1">CodeMind AI will fetch HTML markup, JS script bundles, CSS stylesheets, and API endpoints directly from the website.</p>
            </div>

            <button
              onClick={handleScrapeUrl}
              disabled={importing || !websiteUrl.trim()}
              className="w-full py-3.5 rounded-xl bg-neutral-100 text-neutral-900 font-bold text-xs hover:bg-white border border-neutral-300 transition-all disabled:opacity-50 flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
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
