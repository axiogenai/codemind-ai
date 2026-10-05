import React from 'react';
import { Upload, GitPullRequest, Menu, X } from 'lucide-react';
import type { ProjectMeta } from '../types';
import { CodeMindLogo } from './CodeMindLogo';
import { CircularThemeToggle } from './ui/CircularThemeReveal';

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

  return (
    <header className="h-14 shrink-0 border-b border-zinc-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-md px-4 sm:px-5 flex items-center justify-between sticky top-0 z-40 select-none transition-colors duration-200">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Mobile Hamburger Menu Toggle */}
        {currentProject && onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100 dark:bg-[#141518] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white md:hidden cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}

        <div className="flex items-center space-x-2.5 cursor-pointer select-none">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100 dark:bg-[#141518] p-1 flex items-center justify-center shrink-0 shadow-xs">
            <CodeMindLogo className="w-full h-full" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight leading-tight">
              CodeMind AI
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-300 font-normal hidden sm:block leading-tight mt-0.5">
              Software Intelligence & Reverse Engineering Platform
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons & Gravlens Theme Switcher */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        <CircularThemeToggle />

        {currentProject && (
          <>
            <button
              onClick={onOpenImpactTarget}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/70 dark:bg-[#141518] dark:hover:bg-[#1E2024] border border-zinc-200 dark:border-white/[0.08] text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0 select-none"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Impact Predictor</span>
            </button>

            <button
              onClick={onOpenImporter}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium text-xs border border-zinc-900 dark:border-zinc-300 transition-colors cursor-pointer shadow-xs outline-none focus:outline-none focus:ring-0 select-none"
            >
              <Upload className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
              <span className="hidden sm:inline">Change Codebase</span>
              <span className="sm:hidden">Change</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
