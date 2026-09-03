import React, { useState } from 'react';
import { FileCode, Cpu } from 'lucide-react';
import type { ProjectFile } from '../types';

interface CodeExplorerViewProps {
  files: ProjectFile[];
}

export const CodeExplorerView: React.FC<CodeExplorerViewProps> = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(files[0] || null);

  return (
    <div className="h-[calc(100vh-4rem)] p-6 flex space-x-6">
      {/* File Tree List */}
      <div className="w-80 glass-panel rounded-2xl p-4 space-y-3 flex flex-col shrink-0">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Project File Tree</h3>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file)}
              className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                selectedFile.path === file.path
                  ? 'bg-gray-900 border-cyan-500/60 shadow-lg shadow-cyan-500/5'
                  : 'bg-gray-900/40 border-gray-800/80 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-bold text-gray-200 code-font truncate">{file.path}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono shrink-0 ml-2">{file.lines}L</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Code & AST Inspector */}
      {selectedFile && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code Viewer Panel */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col space-y-4 border border-gray-800/80">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {selectedFile.language}
                </span>
                <span className="text-xs font-bold text-white code-font">{selectedFile.path}</span>
              </div>
              <span className="text-xs text-gray-400 font-mono">{selectedFile.lines} Lines of Code</span>
            </div>

            {/* Code view container */}
            <div className="flex-1 bg-[#0A0A0A] p-5 rounded-xl border border-neutral-800 font-mono text-xs text-gray-200 overflow-auto leading-relaxed whitespace-pre">
              {selectedFile.code}
            </div>
          </div>

          {/* Universal AST Breakdown */}
          <div className="glass-panel rounded-2xl p-6 space-y-5 border border-gray-800/80 overflow-y-auto">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" /> Universal AST Extracted Symbols
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Abstract Syntax Tree classification</p>
            </div>

            {/* Classes */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Defined Classes</span>
              <div className="space-y-1">
                {selectedFile.symbols.classes.length > 0 ? (
                  selectedFile.symbols.classes.map((cls) => (
                    <div key={cls} className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs font-bold text-purple-300 code-font">
                      class {cls}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">No classes defined</span>
                )}
              </div>
            </div>

            {/* Functions */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block">Extracted Functions</span>
              <div className="space-y-1">
                {selectedFile.symbols.functions.length > 0 ? (
                  selectedFile.symbols.functions.map((fn) => (
                    <div key={fn} className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/30 text-xs font-bold text-pink-300 code-font">
                      def {fn}()
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">No functions defined</span>
                )}
              </div>
            </div>

            {/* APIs */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Exposed API Endpoints</span>
              <div className="space-y-1">
                {selectedFile.symbols.apis.length > 0 ? (
                  selectedFile.symbols.apis.map((api) => (
                    <div key={api} className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 code-font">
                      {api}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">No API endpoints exposed</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
