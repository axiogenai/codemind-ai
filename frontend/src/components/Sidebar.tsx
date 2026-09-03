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

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  securityIssuesCount,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'overview' as ActiveTab, label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'transform' as ActiveTab, label: 'Repo Transformation', icon: RefreshCw, badge: null },
    { id: 'graph' as ActiveTab, label: 'Knowledge Graph', icon: Network, badge: null },
    { id: 'diagrams' as ActiveTab, label: 'Architecture Diagrams', icon: Layers, badge: null },
    { id: 'impact' as ActiveTab, label: 'Change Impact', icon: GitPullRequest, badge: null },
    { id: 'chat' as ActiveTab, label: 'AI RAG Assistant', icon: MessageSquareCode, badge: null },
    { id: 'security' as ActiveTab, label: 'Security & Smells', icon: ShieldAlert, badge: securityIssuesCount > 0 ? securityIssuesCount : null, isAlert: securityIssuesCount > 0 },
    { id: 'docs' as ActiveTab, label: 'Auto Documentation', icon: FileCode, badge: null },
    { id: 'files' as ActiveTab, label: 'AST & Code Explorer', icon: FolderTree, badge: null },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 border-r border-neutral-800 bg-[#0A0A0A] flex flex-col justify-between py-5 px-3 h-full md:h-[calc(100vh-4rem)] shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-1.5 overflow-y-auto sidebar-scroll flex-1 pr-1">
          <div className="px-3 pb-3 flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">
              Intelligence Modules
            </p>
            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white md:hidden cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-neutral-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className="tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
              </div>

              {item.badge !== null && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    item.isAlert
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="w-full pt-5 pb-2 border-t border-neutral-800 flex items-center justify-center text-center">
        <p className="text-xs text-neutral-400 font-medium tracking-wide">
          Made by{' '}
          <a
            href="https://team.axiogen.in"
            target="_blank"
            rel="noreferrer"
            className="text-white hover:text-cyan-400 transition-colors font-bold underline underline-offset-4 decoration-neutral-600 hover:decoration-cyan-400"
          >
            team.axiogen.in
          </a>
        </p>
      </div>
    </aside>
    </>
  );
};
