import React, { useEffect, useState } from 'react';
import { Network } from 'lucide-react';
import type { OrgKnowledgeNode, OrgKnowledgeEdge } from '../types';
import { fetchOrgKnowledgeGraph } from '../services/api';

interface Props {
  projectId?: string;
}

export const OrgKnowledgeGraphView: React.FC<Props> = ({ projectId }) => {
  const [nodes, setNodes] = useState<OrgKnowledgeNode[]>([]);
  const [edges, setEdges] = useState<OrgKnowledgeEdge[]>([]);

  useEffect(() => {
    fetchOrgKnowledgeGraph(projectId).then(res => {
      setNodes(res.nodes || []);
      setEdges(res.edges || []);
    });
  }, [projectId]);

  return (
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Organizational Knowledge Graph</h2>
            <p className="text-xs text-neutral-400">Connects code symbols with developers, commits, issues, deployments & incidents.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Organizational Nodes</h3>
          <div className="space-y-2">
            {nodes.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
                <span className="font-bold text-white">{n.label}</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
                  {n.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Knowledge Linkages</h3>
          <div className="space-y-2">
            {edges.map((e, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-300">{e.source}</span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase border border-neutral-800 px-2 py-0.5 rounded bg-[#0A0A0A]">
                  -- {e.relation} --&gt;
                </span>
                <span className="text-neutral-300">{e.target}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
