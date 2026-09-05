import React, { useState, useEffect } from 'react';
import { Cpu, FolderGit2, Upload, GitPullRequest, Menu, X } from 'lucide-react';
import type { ProjectMeta } from '../types';

interface HeaderProps {
  currentProject: ProjectMeta | null;
  onOpenImporter: () => void;
  onOpenImpactTarget: () => void;
  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  onOpenImporter,
  onOpenImpactTarget,
  isMobileSidebarOpen,
  onToggleMobileSidebar
}) => {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = () => {
      fetch('/api/health')
        .then(res => {
          if (res.ok) {
            setApiOnline(true);
          } else {
            return fetch('http://localhost:8000/api/health').then(r => setApiOnline(r.ok));
          }
        })
        .catch(() => {
          fetch('http://localhost:8000/api/health')
            .then(r => setApiOnline(r.ok))
            .catch(() => setApiOnline(false));
        });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-neutral-800 bg-[#0A0A0A] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3 sm:space-x-6">
        {/* Mobile Hamburger Menu Toggle */}
        {currentProject && onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-xl border border-neutral-800 bg-[#121212] text-neutral-300 hover:text-white md:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border border-neutral-800 bg-[#121212] flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-neutral-200" />
          </div>
          <div>
            <h1 className="text-sm sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
              CodeMind AI 
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800">
                PRO v1.0
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium hidden sm:block">Software Intelligence & Reverse Engineering Platform</p>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-neutral-800 hidden md:block" />

        {/* Server Status Badge: Precision Studio Hardware Indicator */}
        <div className="hidden lg:flex items-center gap-2 bg-[#151619] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs shadow-xs">
          {apiOnline ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          )}
          <span className="text-[11px] font-medium text-zinc-300">
            {apiOnline ? 'Engine Active' : 'Engine Standby'}
          </span>
        </div>

        {/* Active Project Tag */}
        {currentProject && (
          <div className="hidden md:flex items-center gap-2 bg-[#151619] border border-white/[0.08] rounded-lg px-3 py-1 text-xs shadow-xs">
            <FolderGit2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-200">{currentProject.name}</span>
            <span className="text-[10px] font-mono text-zinc-400 bg-black/40 px-1.5 py-0.2 rounded border border-white/[0.06]">
              {currentProject.primary_language}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              ({currentProject.total_files} files · {currentProject.total_lines} LOC)
            </span>
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center space-x-3">
        {currentProject ? (
          <>
            <button
              onClick={onOpenImpactTarget}
              className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#121212] hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-gray-300 transition-all cursor-pointer"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Impact Predictor</span>
            </button>

            <button
              onClick={onOpenImporter}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-black text-xs transition-all cursor-pointer shadow-lg"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Change Codebase</span>
            </button>
          </>
        ) : (
          <button
            onClick={onOpenImporter}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-black text-xs transition-all cursor-pointer shadow-lg"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Codebase</span>
          </button>
        )}
      </div>
    </header>
  );
};
