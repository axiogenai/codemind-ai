import React from 'react';
import {
  LayoutDashboard,
  RefreshCw,
  Network,
  Layers,
  GitPullRequest,
  MessageSquareCode,
  ShieldAlert,
  FileCode,
  FolderTree,
  X
} from 'lucide-react';

export type ActiveTab = 
  | 'overview'
  | 'transform'
  | 'graph'
  | 'diagrams'
  | 'impact'
  | 'chat'
  | 'security'
  | 'docs'
  | 'files';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  securityIssuesCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number | null;
    isAlert?: boolean;
    shortcut?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  securityIssuesCount,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const sections: NavSection[] = [
    {
      title: 'EXPLORE & ARCHITECTURE',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, shortcut: '1' },
        { id: 'graph', label: 'Knowledge Graph', icon: Network, shortcut: '2' },
        { id: 'diagrams', label: 'Architecture Diagrams', icon: Layers, shortcut: '3' },
      ]
    },
    {
      title: 'INTELLIGENCE & IMPACT',
      items: [
        { id: 'impact', label: 'Change Impact', icon: GitPullRequest, shortcut: '4' },
        { id: 'chat', label: 'AI RAG Assistant', icon: MessageSquareCode, shortcut: '5' },
        { id: 'files', label: 'AST & Code Explorer', icon: FolderTree, shortcut: '6' },
      ]
    },
    {
      title: 'SYNTHESIS & AUDIT',
      items: [
        { id: 'transform', label: 'Repo Transformation', icon: RefreshCw, shortcut: '7' },
        {
          id: 'security',
          label: 'Security & Smells',
          icon: ShieldAlert,
          badge: securityIssuesCount > 0 ? securityIssuesCount : null,
          isAlert: securityIssuesCount > 0,
          shortcut: '8'
        },
        { id: 'docs', label: 'Auto Documentation', icon: FileCode, shortcut: '9' },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-60 border-r border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0D0E11] flex flex-col justify-between py-3 px-2.5 h-full shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out select-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {/* Mobile Header Close */}
          {onCloseMobile && (
            <div className="px-2 pt-1 pb-1 flex items-center justify-between md:hidden">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Navigation</span>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-neutral-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                aria-label="Close navigation sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Categorized Navigation Sections */}
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-2.5 pt-1.5 pb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-zinc-400 dark:text-zinc-500">
                  {section.title}
                </p>
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`relative w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${
                      isActive
                        ? 'bg-zinc-900 dark:bg-white/[0.10] text-white dark:text-white font-bold'
                        : 'text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Left accent bar — only shown when active */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-white dark:bg-white" />
                    )}

                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-white dark:text-white'
                            : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
                        }`}
                      />
                      <span className="tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      {item.badge !== undefined && item.badge !== null && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                            item.isAlert
                              ? 'bg-zinc-200 dark:bg-white/[0.12] text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-white/[0.16]'
                              : 'bg-zinc-100 dark:bg-[#202228] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.shortcut && (
                        <span className={`text-[10px] font-mono px-1 py-0.2 rounded opacity-0 group-hover:opacity-60 transition-opacity ${
                          isActive ? 'opacity-70 text-zinc-400 dark:text-zinc-400' : 'text-zinc-400'
                        }`}>
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="w-full pt-3 pb-1 border-t border-zinc-200 dark:border-white/[0.08] flex items-center justify-between px-2 text-center">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
            v1.0 Studio
          </p>
          <a
            href="https://team.axiogen.in"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium hover:underline underline-offset-2"
          >
            team.axiogen.in
          </a>
        </div>
      </aside>
    </>
  );
};
