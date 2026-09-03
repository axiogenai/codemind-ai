import React, { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import type { TimelineEvent } from '../types';
import { fetchEvolutionTimeline } from '../services/api';

interface Props {
  projectId?: string;
}

export const EvolutionTimelineView: React.FC<Props> = ({ projectId }) => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    fetchEvolutionTimeline(projectId).then(res => {
      setTimeline(res.timeline || []);
    });
  }, [projectId]);

  return (
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Code Evolution Timeline</h2>
            <p className="text-xs text-neutral-400">Interactive history of architectural shifts, module changes, and technical debt evolution.</p>
          </div>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 border-l border-neutral-800 ml-4">
        {timeline.map((event, idx) => (
          <div key={idx} className="relative">
            <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-neutral-400 border-2 border-[#0A0A0A]" />
            <div className="p-5 rounded-2xl border border-neutral-800 bg-[#121212] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-400">{event.date} • {event.author}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                  {event.category}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{event.title}</h3>
              <p className="text-xs text-neutral-400">{event.description}</p>
              <span className="text-[10px] text-neutral-500 font-mono block pt-1">{event.files_changed} files affected</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
