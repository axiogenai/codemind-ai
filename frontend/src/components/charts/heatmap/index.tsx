import React, { createContext, useContext, useState, useRef, useMemo } from 'react';

export interface HeatmapDayBin {
  bin: number; // 0..6 (day of week)
  count: number;
  date: Date;
  files?: Array<{ path: string; lines: number; language?: string }>;
}

export interface HeatmapDataColumn {
  bin: number; // 0..N (week column)
  monthLabel?: string;
  bins: HeatmapDayBin[];
}

interface HeatmapHoverInfo {
  weekBin: number;
  dayBin: number;
  item: HeatmapDayBin;
  clientX: number;
  clientY: number;
}

interface HeatmapContextType {
  data: HeatmapDataColumn[];
  setData: (data: HeatmapDataColumn[]) => void;
  hoveredCell: HeatmapHoverInfo | null;
  setHoveredCell: (cell: HeatmapHoverInfo | null) => void;
  layout: 'fluid' | 'fixed';
  setLayout: (layout: 'fluid' | 'fixed') => void;
  maxCount: number;
}

const HeatmapContext = createContext<HeatmapContextType | undefined>(undefined);

export const useHeatmap = () => {
  const ctx = useContext(HeatmapContext);
  if (!ctx) {
    throw new Error('useHeatmap must be used within a HeatmapInteractionProvider');
  }
  return ctx;
};

export const HeatmapInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<HeatmapDataColumn[]>([]);
  const [hoveredCell, setHoveredCell] = useState<HeatmapHoverInfo | null>(null);
  const [layout, setLayout] = useState<'fluid' | 'fixed'>('fluid');

  const maxCount = useMemo(() => {
    let max = 0;
    data.forEach((col) => {
      col.bins.forEach((b) => {
        if (b.count > max) max = b.count;
      });
    });
    return Math.max(max, 1);
  }, [data]);

  return (
    <HeatmapContext.Provider
      value={{
        data,
        setData,
        hoveredCell,
        setHoveredCell,
        layout,
        setLayout,
        maxCount,
      }}
    >
      {children}
    </HeatmapContext.Provider>
  );
};

export const HeatmapInteractionBoundary: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const { setHoveredCell } = useHeatmap();

  return (
    <div
      className={`relative w-full ${className}`}
      onMouseLeave={() => setHoveredCell(null)}
    >
      {children}
    </div>
  );
};

export interface HeatmapChartProps {
  data: HeatmapDataColumn[];
  layout?: 'fluid' | 'fixed';
  className?: string;
  children: React.ReactNode;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  layout = 'fluid',
  className = '',
  children,
}) => {
  const { setData, setLayout } = useHeatmap();

  React.useEffect(() => {
    setData(data);
  }, [data, setData]);

  React.useEffect(() => {
    setLayout(layout);
  }, [layout, setLayout]);

  return (
    <div className={`w-full overflow-x-auto custom-scrollbar select-none py-1 ${className}`}>
      <div className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 min-w-[340px] sm:min-w-0 w-full items-start">
        {children}
      </div>
    </div>
  );
};

export const HeatmapYAxis: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`col-start-1 row-start-2 flex flex-col gap-[3px] pr-1.5 shrink-0 select-none ${className}`}>
      <span className="h-[11px] leading-[11px] text-[9px] font-mono text-transparent select-none">&nbsp;</span>
      <span className="h-[11px] leading-[11px] text-[9px] font-mono text-zinc-400 dark:text-zinc-500">Mon</span>
      <span className="h-[11px] leading-[11px] text-[9px] font-mono text-transparent select-none">&nbsp;</span>
      <span className="h-[11px] leading-[11px] text-[9px] font-mono text-zinc-400 dark:text-zinc-500">Wed</span>
      <span className="h-[11px] leading-[11px] text-[9px] font-mono text-transparent select-none">&nbsp;</span>
      <span className="h-[11px] leading-[11px] text-[9px] font-mono text-zinc-400 dark:text-zinc-500">Fri</span>
      <span className="h-[11px] leading-[11px] text-[9px] font-mono text-transparent select-none">&nbsp;</span>
    </div>
  );
};

export const HeatmapXAxis: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { data } = useHeatmap();

  const monthLabels = useMemo(() => {
    const labels: Array<{ index: number; label: string }> = [];
    let lastMonth = '';

    data.forEach((col, idx) => {
      const firstValidDay = col.bins.find((b) => b.date);
      if (firstValidDay && firstValidDay.date instanceof Date && !isNaN(firstValidDay.date.getTime())) {
        const m = firstValidDay.date.toLocaleDateString('en-US', { month: 'short' });
        if (m !== lastMonth && (idx === 0 || idx - (labels[labels.length - 1]?.index ?? -10) >= 3)) {
          labels.push({ index: idx, label: m });
          lastMonth = m;
        }
      }
    });

    return labels;
  }, [data]);

  return (
    <div className={`col-start-2 row-start-1 relative w-full h-4 mb-1 text-[10px] font-sans font-normal text-zinc-400 select-none ${className}`}>
      {monthLabels.map((item) => (
        <span
          key={`${item.label}-${item.index}`}
          className="absolute transform -translate-x-1/2 whitespace-nowrap"
          style={{
            left: `${((item.index + 0.5) / Math.max(data.length, 1)) * 100}%`,
          }}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
};

const getCellColorClass = (count: number, maxCount: number) => {
  if (count <= 0) {
    return 'bg-zinc-200/50 dark:bg-[#161619] border border-zinc-300/40 dark:border-white/[0.04] hover:border-zinc-400 dark:hover:border-white/10';
  }
  const ratio = count / Math.max(maxCount, 1);
  if (ratio <= 0.25) {
    return 'bg-slate-300 dark:bg-[#343742] border border-slate-300/80 dark:border-white/[0.06] hover:brightness-110';
  }
  if (ratio <= 0.5) {
    return 'bg-slate-400 dark:bg-[#525667] border border-slate-400/80 dark:border-white/[0.08] hover:brightness-110';
  }
  if (ratio <= 0.75) {
    return 'bg-slate-500 dark:bg-[#9fa4b5] border border-slate-500/80 dark:border-white/[0.1] hover:brightness-110';
  }
  return 'bg-zinc-900 dark:bg-[#ffffff] border border-zinc-900 dark:border-white hover:brightness-110 shadow-2xs';
};

export const HeatmapCells: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { data, maxCount, setHoveredCell } = useHeatmap();

  return (
    <div className={`col-start-2 row-start-2 flex gap-[3px] w-full justify-between items-start overflow-x-auto custom-scrollbar ${className}`}>
      {data.map((col) => (
        <div key={`col-${col.bin}`} className="flex flex-col gap-[3px] flex-1 min-w-[8px] max-w-[12px]">
          {col.bins.map((day) => {
            const colorClass = getCellColorClass(day.count, maxCount);
            return (
              <div
                key={`day-${col.bin}-${day.bin}`}
                className={`w-full h-[11px] rounded-[2px] transition-all duration-150 cursor-pointer hover:scale-125 z-0 hover:z-20 ${colorClass}`}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredCell({
                    weekBin: col.bin,
                    dayBin: day.bin,
                    item: day,
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top,
                  });
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const HeatmapTooltip: React.FC = () => {
  const { hoveredCell } = useHeatmap();
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  if (!hoveredCell) return null;

  const { item, clientX, clientY } = hoveredCell;
  const dateStr = item.date instanceof Date && !isNaN(item.date.getTime())
    ? item.date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date unknown';

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in duration-100"
      style={{
        left: `${clientX}px`,
        top: `${clientY - 8}px`,
      }}
    >
      <div className="rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-white/95 dark:bg-[#141518]/95 p-3 shadow-xl backdrop-blur-md min-w-44 max-w-64 space-y-1.5 transition-colors">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-white/[0.08] pb-1.5">
          <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
            {dateStr}
          </p>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 font-bold shrink-0">
            {item.count} {item.count === 1 ? 'file' : 'files'}
          </span>
        </div>

        {item.count === 0 ? (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal">
            No files created or modified
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Files Created:
            </p>
            <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
              {(item.files || []).slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] font-mono gap-2">
                  <span className="truncate text-zinc-700 dark:text-zinc-300 max-w-[150px]">{f.path}</span>
                  <span className="text-[10px] text-zinc-400 shrink-0">{f.lines} L</span>
                </div>
              ))}
              {(item.files?.length || 0) > 4 && (
                <p className="text-[10px] text-zinc-400 italic">
                  +{(item.files?.length || 0) - 4} more files
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const HeatmapLegend: React.FC<{
  summaryText?: string;
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center gap-1.5 pt-2 text-[10px] font-sans text-zinc-500 dark:text-zinc-400 select-none ${className}`}>
      <span>Less</span>
      <div className="w-2.5 h-2.5 rounded-[2px] bg-zinc-200/50 dark:bg-[#161619] border border-zinc-300/40 dark:border-white/[0.04]" />
      <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-300 dark:bg-[#383a45] border border-slate-300/80 dark:border-white/[0.06]" />
      <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-400 dark:bg-[#5a5d6e] border border-slate-400/80 dark:border-white/[0.08]" />
      <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-500 dark:bg-[#9da3b3] border border-slate-500/80 dark:border-white/[0.1]" />
      <div className="w-2.5 h-2.5 rounded-[2px] bg-zinc-900 dark:bg-[#f4f4f6] border border-zinc-900 dark:border-white" />
      <span>More</span>
    </div>
  );
};
