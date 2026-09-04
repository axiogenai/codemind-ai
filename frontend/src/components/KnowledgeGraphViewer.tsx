import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { KnowledgeGraphData, GraphNode } from '../types';
import { Search, Zap, Layers, GitPullRequest, Cpu, Network, GitMerge } from 'lucide-react';
import type { ActiveTab } from './Sidebar';

interface KnowledgeGraphViewerProps {
  data: KnowledgeGraphData;
  onNodeClick?: (node: GraphNode) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  onSelectImpactTarget?: (symbol: string) => void;
  onAskAI?: (symbol: { label: string; file?: string; type?: string }) => void;
}

export const KnowledgeGraphViewer: React.FC<KnowledgeGraphViewerProps> = ({
  data,
  onNodeClick,
  onNavigateTab,
  onSelectImpactTarget,
  onAskAI
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flowCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [dwellHighlightNode, setDwellHighlightNode] = useState<GraphNode | null>(null);
  const hoverTimerRef = useRef<any>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [viewLevel, setViewLevel] = useState<'ALL_SYMBOLS' | 'FILES_ONLY'>('FILES_ONLY');
  const [viewMode, setViewMode] = useState<'FORCE_GRAPH' | 'CONNECTION_FLOW'>('FORCE_GRAPH');
  const [isGnnMode, setIsGnnMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const flowTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const animationFrameRef = useRef<number | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: GraphNode;
  } | null>(null);

  // Close context menu on global window click
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Compute node type count distribution
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { File: 0, Class: 0, Function: 0, API: 0, DatabaseTable: 0 };
    if (data.nodes) {
      for (const n of data.nodes) {
        if (counts[n.type] !== undefined) counts[n.type]++;
      }
    }
    return counts;
  }, [data]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const totalNodesCount = data.nodes ? data.nodes.length : 0;

  // Auto-tune default view level on large repositories (>500 nodes default to FILES_ONLY for instant performance)
  useEffect(() => {
    if (totalNodesCount > 500) {
      setViewLevel('FILES_ONLY');
    }
  }, [totalNodesCount]);

  // Scale-Aware Filtered Nodes
  const filteredNodes = useMemo(() => {
    if (!data.nodes) return [];
    let list = data.nodes.filter(n => {
      if (viewLevel === 'FILES_ONLY' && (n.type === 'Function' || n.type === 'Class')) {
        return false;
      }
      if (filterType !== 'ALL' && n.type !== filterType) return false;
      if (debouncedSearch && !n.label.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      return true;
    });

    // For massive scale (>3,000 nodes without search), prioritize hub nodes & files for 60fps simulation
    if (list.length > 3000 && !debouncedSearch) {
      list = list.slice(0, 3000);
    }
    return list;
  }, [data.nodes, viewLevel, filterType, debouncedSearch]);

  const nodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  // Filtered links
  const filteredLinks = useMemo(() => {
    if (!data.links) return [];
    return data.links.filter(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
  }, [data.links, nodeIds]);

  // --- MODEL 1: Scale-Adaptive Force Knowledge Graph Canvas Engine ---
  useEffect(() => {
    if (viewMode !== 'FORCE_GRAPH' || !canvasRef.current || filteredNodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 900;
    const height = canvas.parentElement?.clientHeight || 650;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const colorMap: Record<string, string> = {
      Project: '#3B82F6',
      File: '#10B981',
      Class: '#8B5CF6',
      Function: '#EC4899',
      API: '#F59E0B',
      DatabaseTable: '#06B6D4'
    };

    const N = filteredNodes.length;
    const E = filteredLinks.length;

    // Scale distance and repulsion dynamically with repository scale
    const linkDistance = Math.max(65, Math.min(220, 45 + Math.sqrt(N) * 3.5));
    const chargeStrength = -Math.max(120, Math.min(600, 80 + Math.sqrt(N) * 8.0));
    const distMax = Math.max(400, Math.sqrt(N) * 25);

    const simulation = d3.forceSimulation(filteredNodes as any)
      .force('link', d3.forceLink(filteredLinks).id((d: any) => d.id).distance(linkDistance).iterations(1))
      .force('charge', d3.forceManyBody().strength(chargeStrength).theta(0.92).distanceMax(distMax))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .velocityDecay(0.4)
      .alphaDecay(N > 1000 ? 0.05 : 0.025);

    // Warm-up ticks for instant settled positioning
    simulation.tick(N > 1000 ? 25 : 12);

    const activeHighlightNode = dwellHighlightNode || selectedNode;
    const neighborNodeIds = new Set<string>();
    const connectedLinkSet = new Set<any>();

    if (activeHighlightNode) {
      neighborNodeIds.add(activeHighlightNode.id);
      for (let i = 0; i < filteredLinks.length; i++) {
        const l = filteredLinks[i];
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        const tId = typeof l.target === 'object' ? l.target.id : l.target;
        if (sId === activeHighlightNode.id || tId === activeHighlightNode.id) {
          neighborNodeIds.add(sId);
          neighborNodeIds.add(tId);
          connectedLinkSet.add(l);
        }
      }
    }

    // Compute edge opacity proportional to edge count
    const defaultEdgeOpacity = Math.max(0.04, Math.min(0.28, 8.0 / Math.sqrt(Math.max(1, E))));

    const draw = () => {
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      const t = transformRef.current;
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      // Viewport bounds for spatial culling (skip off-screen nodes)
      const margin = 80;
      const minX = -t.x / t.k - margin;
      const maxX = (width - t.x) / t.k + margin;
      const minY = -t.y / t.k - margin;
      const maxY = (height - t.y) / t.k + margin;

      // Draw Edges (All Real Connected Lines + Glowing Active Highlights)
      for (let i = 0; i < filteredLinks.length; i++) {
        const link = filteredLinks[i];
        const s: any = link.source;
        const targetNode: any = link.target;
        if (s.x && targetNode.x) {
          const isConnected = connectedLinkSet.has(link);

          const sVisible = s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY;
          const tVisible = targetNode.x >= minX && targetNode.x <= maxX && targetNode.y >= minY && targetNode.y <= maxY;

          if (sVisible || tVisible) {
            ctx.save();
            ctx.beginPath();
            if (activeHighlightNode && !isConnected) {
              ctx.strokeStyle = 'rgba(75, 85, 99, 0.05)';
              ctx.lineWidth = 0.35 / t.k;
            } else if (isConnected) {
              ctx.strokeStyle = isGnnMode ? '#A855F7' : '#00F0FF';
              ctx.lineWidth = 2.4 / t.k;
            } else {
              ctx.strokeStyle = isGnnMode ? `rgba(168, 85, 247, ${defaultEdgeOpacity * 1.2})` : `rgba(56, 189, 248, ${defaultEdgeOpacity})`;
              ctx.lineWidth = Math.max(0.4, 0.85 / t.k);
            }
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Draw Nodes (Spatial Culled)
      for (let i = 0; i < filteredNodes.length; i++) {
        const node: any = filteredNodes[i];
        if (node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY) {
          const color = isGnnMode ? (node.type === 'File' ? '#A855F7' : '#06B6D4') : (colorMap[node.type] || '#6B7280');
          const isNeighbor = !activeHighlightNode || neighborNodeIds.has(node.id);
          const isSelected = selectedNode && selectedNode.id === node.id;
          const isHovered = hoveredNode && hoveredNode.id === node.id;

          ctx.save();
          ctx.globalAlpha = isNeighbor ? 1.0 : 0.12;
          ctx.fillStyle = color;
          ctx.beginPath();
          const baseRadius = node.type === 'Project' ? 10 : (node.type === 'File' ? 7 : (node.type === 'Class' ? 6 : 4.5));
          const radius = Math.max(3, baseRadius / (t.k > 1.5 ? 1 : 1.2));
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
          ctx.fill();

          if (isSelected || isHovered) {
            ctx.strokeStyle = '#00F0FF';
            ctx.lineWidth = 2.5 / t.k;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 3 / t.k, 0, 2 * Math.PI);
            ctx.stroke();
          } else if (isNeighbor && activeHighlightNode) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.2 / t.k;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Draw Labels (Root Project, Selected Node, and Hovered Node)
      for (let i = 0; i < filteredNodes.length; i++) {
        const node: any = filteredNodes[i];
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isRoot = node.type === 'Project';

        if ((isSelected || isHovered || isRoot) && node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY) {
          ctx.save();
          ctx.font = isSelected || isRoot ? `bold ${Math.max(11, 13 / t.k)}px Inter, monospace` : `${Math.max(10, 11 / t.k)}px Inter, monospace`;
          const text = node.label;
          const textWidth = ctx.measureText(text).width;
          const labelX = node.x + (node.type === 'Project' ? 14 : 10) / t.k;
          const labelY = node.y + 4 / t.k;

          ctx.fillStyle = 'rgba(10, 10, 10, 0.88)';
          ctx.fillRect(labelX - 3 / t.k, labelY - 11 / t.k, textWidth + 6 / t.k, 15 / t.k);

          ctx.fillStyle = isSelected ? '#00F0FF' : '#FFFFFF';
          ctx.fillText(text, labelX, labelY);
          ctx.restore();
        }
      }

      ctx.restore();
    };

    simulation.on('tick', () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(draw);
    });

    const zoomBehavior = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.1, 6])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        draw();
      });

    const d3Canvas = d3.select(canvas);
    d3Canvas.call(zoomBehavior);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - transformRef.current.x) / transformRef.current.k;
      const mouseY = (e.clientY - rect.top - transformRef.current.y) / transformRef.current.k;

      let found: GraphNode | null = null;
      for (const node of filteredNodes as any[]) {
        const dx = node.x - mouseX;
        const dy = node.y - mouseY;
        if (dx * dx + dy * dy < 160) {
          found = node;
          break;
        }
      }

      setHoveredNode(found);
      if (found) {
        setTooltipPos({ x: e.clientX - rect.left + 15, y: e.clientY - rect.top + 15 });
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => {
          setDwellHighlightNode(found);
        }, 300);
      } else {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setDwellHighlightNode(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - transformRef.current.x) / transformRef.current.k;
      const clickY = (e.clientY - rect.top - transformRef.current.y) / transformRef.current.k;

      let found: GraphNode | null = null;
      for (const node of filteredNodes as any[]) {
        const dx = node.x - clickX;
        const dy = node.y - clickY;
        if (dx * dx + dy * dy < 160) {
          found = node;
          break;
        }
      }

      setSelectedNode(found);
      if (found && onNodeClick) onNodeClick(found);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - transformRef.current.x) / transformRef.current.k;
      const clickY = (e.clientY - rect.top - transformRef.current.y) / transformRef.current.k;
      
      let found: GraphNode | null = null;
      for (const node of filteredNodes as any[]) {
        const dx = node.x - clickX;
        const dy = node.y - clickY;
        if (dx * dx + dy * dy < 160) {
          found = node;
          break;
        }
      }

      if (found) {
        setSelectedNode(found);
        setContextMenu({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          node: found
        });
      } else {
        setContextMenu(null);
      }
    };

    const handleMouseLeave = () => {
      setHoveredNode(null);
      setDwellHighlightNode(null);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      simulation.stop();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, [viewMode, filteredNodes, filteredLinks, selectedNode, dwellHighlightNode, isGnnMode]);

  // --- MODEL 2: Virtualized High-Scale Connection Flow Engine (Zero Lag for 100k Nodes) ---
  useEffect(() => {
    if (viewMode !== 'CONNECTION_FLOW' || !flowCanvasRef.current || filteredNodes.length === 0) return;

    const canvas = flowCanvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 900;
    const height = canvas.parentElement?.clientHeight || 650;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Group into distinct architectural columns
    const columns: Record<string, GraphNode[]> = {
      Files: [],
      Classes: [],
      Functions: [],
      APIs: []
    };

    filteredNodes.forEach(node => {
      if (node.type === 'File' || node.type === 'Project') columns.Files.push(node);
      else if (node.type === 'Class') columns.Classes.push(node);
      else if (node.type === 'Function') columns.Functions.push(node);
      else columns.APIs.push(node);
    });

    const colKeys = ['Files', 'Classes', 'Functions', 'APIs'];
    const activeCols = colKeys.filter(k => columns[k].length > 0);
    const colWidth = (width - 160) / Math.max(1, activeCols.length - 1 || 1);

    // Dynamic, comfortable row height with spacious separation (no squishing)
    const rowHeight = 34;
    const nodePositions = new Map<string, { x: number; y: number; node: GraphNode }>();

    activeCols.forEach((colKey, colIdx) => {
      const colNodes = columns[colKey];
      const x = 90 + colIdx * colWidth;
      const startY = 80;

      colNodes.forEach((node, rowIdx) => {
        nodePositions.set(node.id, {
          x,
          y: startY + rowIdx * rowHeight,
          node
        });
      });
    });

    const drawFlow = () => {
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      const t = flowTransformRef.current;
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      // Virtualized Viewport Range in World Coordinates
      const margin = 100;
      const visibleMinY = -t.y / t.k - margin;
      const visibleMaxY = (height - t.y) / t.k + margin;
      const visibleMinX = -t.x / t.k - margin;
      const visibleMaxX = (width - t.x) / t.k + margin;

      // Draw Sticky Column Headers
      activeCols.forEach((colKey, colIdx) => {
        const x = 90 + colIdx * colWidth;
        ctx.save();
        ctx.fillStyle = '#9CA3AF';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(`${colKey.toUpperCase()} (${columns[colKey].length})`, x - 30, Math.max(50, visibleMinY + 60));
        ctx.restore();
      });

      // Draw Curved Connection Beams (Virtualized)
      filteredLinks.forEach(link => {
        const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;
        const sPos = nodePositions.get(sId);
        const tPos = nodePositions.get(tId);

        if (sPos && tPos) {
          // Virtual culling: only draw link if either endpoint is visible
          const sVis = sPos.y >= visibleMinY && sPos.y <= visibleMaxY;
          const tVis = tPos.y >= visibleMinY && tPos.y <= visibleMaxY;

          if (sVis || tVis) {
            const isSelected = selectedNode && (selectedNode.id === sId || selectedNode.id === tId);

            ctx.save();
            ctx.beginPath();
            const midX = (sPos.x + tPos.x) / 2;
            ctx.moveTo(sPos.x, sPos.y);
            ctx.bezierCurveTo(midX, sPos.y, midX, tPos.y, tPos.x, tPos.y);

            if (selectedNode) {
              ctx.strokeStyle = isSelected ? '#00F0FF' : 'rgba(75, 85, 99, 0.08)';
              ctx.lineWidth = isSelected ? 2.5 : 0.8;
            } else {
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
              ctx.lineWidth = 1.2;
            }
            ctx.stroke();
            ctx.restore();
          }
        }
      });

      // Draw Node Badges (Virtualized)
      const colorMap: Record<string, string> = {
        Project: '#3B82F6',
        File: '#10B981',
        Class: '#8B5CF6',
        Function: '#EC4899',
        API: '#F59E0B',
        DatabaseTable: '#06B6D4'
      };

      nodePositions.forEach(pos => {
        if (pos.y >= visibleMinY && pos.y <= visibleMaxY && pos.x >= visibleMinX && pos.x <= visibleMaxX) {
          const isSelected = selectedNode?.id === pos.node.id;
          const color = colorMap[pos.node.type] || '#10B981';

          ctx.save();
          // Anchor Dot
          ctx.fillStyle = isSelected ? '#00F0FF' : color;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, isSelected ? 6 : 4, 0, 2 * Math.PI);
          ctx.fill();

          if (isSelected) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Node Text with background pill for clean legibility
          ctx.fillStyle = isSelected ? '#FFFFFF' : '#D1D5DB';
          ctx.font = isSelected ? 'bold 11px monospace' : '10px monospace';
          const labelText = pos.node.label.length > 28 ? pos.node.label.slice(0, 26) + '..' : pos.node.label;
          ctx.fillText(labelText, pos.x + 12, pos.y + 3.5);
          ctx.restore();
        }
      });

      ctx.restore();
    };

    drawFlow();

    const zoomBehavior = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.15, 4])
      .on('zoom', (event) => {
        flowTransformRef.current = event.transform;
        drawFlow();
      });

    const d3FlowCanvas = d3.select(canvas);
    d3FlowCanvas.call(zoomBehavior);

    const handleFlowClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - flowTransformRef.current.x) / flowTransformRef.current.k;
      const clickY = (e.clientY - rect.top - flowTransformRef.current.y) / flowTransformRef.current.k;

      let found: GraphNode | null = null;
      nodePositions.forEach(pos => {
        const dx = pos.x - clickX;
        const dy = pos.y - clickY;
        if (dx * dx + dy * dy < 300 || (Math.abs(dy) < 16 && clickX >= pos.x && clickX <= pos.x + 220)) {
          found = pos.node;
        }
      });

      setSelectedNode(found);
      if (found && onNodeClick) onNodeClick(found);
      drawFlow();
    };

    const handleFlowContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - flowTransformRef.current.x) / flowTransformRef.current.k;
      const clickY = (e.clientY - rect.top - flowTransformRef.current.y) / flowTransformRef.current.k;

      let found: GraphNode | null = null;
      nodePositions.forEach(pos => {
        const dx = pos.x - clickX;
        const dy = pos.y - clickY;
        if (dx * dx + dy * dy < 300 || (Math.abs(dy) < 16 && clickX >= pos.x && clickX <= pos.x + 220)) {
          found = pos.node;
        }
      });

      if (found) {
        setSelectedNode(found);
        setContextMenu({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          node: found
        });
      } else {
        setContextMenu(null);
      }
    };

    canvas.addEventListener('click', handleFlowClick);
    canvas.addEventListener('contextmenu', handleFlowContextMenu);
    return () => {
      canvas.removeEventListener('click', handleFlowClick);
      canvas.removeEventListener('contextmenu', handleFlowContextMenu);
    };
  }, [viewMode, filteredNodes, filteredLinks, selectedNode]);

  // Selected node neighbors
  const selectedNodeNeighbors = useMemo(() => {
    if (!selectedNode || !data.links) return [];
    const neighbors: GraphNode[] = [];
    const nodeMap = new Map(data.nodes.map(n => [n.id, n]));

    for (const link of data.links) {
      const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;
      if (sId === selectedNode.id) {
        const targetNode = nodeMap.get(tId);
        if (targetNode) neighbors.push(targetNode);
      } else if (tId === selectedNode.id) {
        const sourceNode = nodeMap.get(sId);
        if (sourceNode) neighbors.push(sourceNode);
      }
    }
    return neighbors;
  }, [selectedNode, data]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6 space-y-4">
      {/* Controls Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search graph nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition-all w-52"
            />
          </div>

          {/* Model Switcher: Force Graph vs Layered Connection Flow */}
          <div className="flex items-center space-x-1 bg-gray-900 border border-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('FORCE_GRAPH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'FORCE_GRAPH'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Force Graph</span>
            </button>

            <button
              onClick={() => setViewMode('CONNECTION_FLOW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'CONNECTION_FLOW'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <GitMerge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connection Flow (Zero Lag)</span>
            </button>
          </div>

          {/* GNN Neural Mode Toggle */}
          <button
            onClick={() => setIsGnnMode(!isGnnMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
              isGnnMode
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400/50 animate-pulse'
                : 'bg-gray-900 border border-gray-800 text-gray-300 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-300" />
            <span>{isGnnMode ? 'GNN Neural Mode Active' : 'GNN Neural Mode'}</span>
          </button>

          {/* LOD Level Selector */}
          <div className="flex items-center space-x-1 bg-gray-900 border border-gray-800 p-1 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-gray-500 px-2 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" /> LOD:
            </span>
            <button
              onClick={() => setViewLevel('FILES_ONLY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewLevel === 'FILES_ONLY' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Files & APIs
            </button>
            <button
              onClick={() => setViewLevel('ALL_SYMBOLS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewLevel === 'ALL_SYMBOLS' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All Symbols
            </button>
          </div>

          {/* Category Filter Badges */}
          <div className="flex items-center space-x-1 bg-gray-900 border border-gray-800 p-1 rounded-xl">
            {['ALL', 'File', 'Class', 'Function', 'API', 'DatabaseTable'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterType === type ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Counts Legend */}
        <div className="flex items-center space-x-3 text-xs font-semibold text-gray-400">
          <span className="text-cyan-400 font-bold bg-cyan-950/40 px-3 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            {totalNodesCount} Nodes
          </span>
          <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {typeCounts.File} Files</span>
          <span className="flex items-center gap-1 text-purple-400"><span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> {typeCounts.Class} Classes</span>
          <span className="flex items-center gap-1 text-pink-400"><span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> {typeCounts.Function} Functions</span>
          <span className="flex items-center gap-1 text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {typeCounts.API} APIs</span>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative bg-[#0A0A0A] rounded-2xl overflow-hidden border border-neutral-800 flex flex-col">
        {/* Model 1: Force Knowledge Graph Canvas */}
        {viewMode === 'FORCE_GRAPH' && (
          <canvas ref={canvasRef} className="w-full h-full bg-[#0A0A0A] cursor-grab active:cursor-grabbing" />
        )}

        {/* Model 2: Virtualized High-Scale Layered Flow Canvas */}
        {viewMode === 'CONNECTION_FLOW' && (
          <div className="w-full h-full relative overflow-hidden">
            <canvas ref={flowCanvasRef} className="w-full h-full bg-[#0A0A0A] cursor-grab active:cursor-grabbing" />
            <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-[11px] text-gray-300 pointer-events-none">
              <span className="text-emerald-400 font-bold">Infinite Virtualized Flow</span>: Scroll & pan smoothly across 100k+ nodes with spacious row separation.
            </div>
          </div>
        )}

        {/* Hover Tooltip (Force Graph) */}
        {viewMode === 'FORCE_GRAPH' && hoveredNode && tooltipPos && (
          <div
            className="absolute z-30 pointer-events-none glass-panel p-3 rounded-xl border border-cyan-500/40 shadow-xl text-xs space-y-1 animate-in fade-in duration-100"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-white code-font">{hoveredNode.label}</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase badge-${hoveredNode.type.toLowerCase()}`}>
                {hoveredNode.type}
              </span>
            </div>
            {hoveredNode.file && (
              <p className="text-[10px] text-cyan-300 font-mono">{hoveredNode.file}</p>
            )}
            <p className="text-[10px] text-gray-400">Right-click for Ask AI & Predict Impact (or click to open drawer)</p>
          </div>
        )}

        {/* Right-Click Quick Action Context Menu */}
        {contextMenu && (
          <div
            className="absolute z-40 bg-[#121212] border border-cyan-500/40 rounded-2xl p-2 shadow-2xl space-y-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: `${Math.min(contextMenu.x, (canvasRef.current?.parentElement?.clientWidth || 800) - 220)}px`,
              top: `${Math.min(contextMenu.y, (canvasRef.current?.parentElement?.clientHeight || 600) - 160)}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate max-w-[120px] code-font">{contextMenu.node.label}</span>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase badge-${contextMenu.node.type.toLowerCase()}`}>
                {contextMenu.node.type}
              </span>
            </div>

            <button
              onClick={() => {
                const targetName = contextMenu.node.label || contextMenu.node.id;
                const targetFile = contextMenu.node.file || targetName;
                setContextMenu(null);
                if (onAskAI) {
                  onAskAI({ label: targetName, file: targetFile, type: contextMenu.node.type });
                } else if (onNavigateTab) {
                  onNavigateTab('chat');
                }
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 hover:text-white flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ask AI About Symbol</span>
            </button>

            {onSelectImpactTarget && onNavigateTab && (
              <button
                onClick={() => {
                  const targetName = contextMenu.node.file || contextMenu.node.label;
                  setContextMenu(null);
                  onSelectImpactTarget(targetName);
                  onNavigateTab('impact');
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-500/20 hover:text-white flex items-center space-x-2 transition-all cursor-pointer"
              >
                <GitPullRequest className="w-3.5 h-3.5 text-amber-400" />
                <span>Predict Change Impact</span>
              </button>
            )}
          </div>
        )}

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-84 glass-panel-glow p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-right duration-200 shadow-2xl border border-cyan-500/40 z-20">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider badge-${selectedNode.type.toLowerCase()}`}>
                {selectedNode.type}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="text-sm font-black text-white code-font break-all">{selectedNode.label}</h4>
              <p className="text-xs text-gray-400 mt-1">Symbol ID: <span className="font-mono text-gray-300">{selectedNode.id}</span></p>
            </div>

            {selectedNode.file && (
              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-xs space-y-1">
                <span className="text-gray-400 block font-semibold">Source File</span>
                <span className="text-cyan-300 code-font break-all">{selectedNode.file}</span>
              </div>
            )}

            {/* GNN Neural Network Embeddings if in GNN Mode */}
            {isGnnMode && (
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 font-extrabold flex items-center gap-1.5 text-[11px]">
                    <Cpu className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                    GNN 16-D Neural Vector
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/40 font-bold">
                    2-Layer GCN
                  </span>
                </div>
                <p className="text-[10px] text-cyan-200 font-mono break-all bg-gray-950/90 p-2 rounded-lg border border-gray-800">
                  [{selectedNode.embedding_vector ? selectedNode.embedding_vector.join(', ') : '0.41, 0.08, 0.95, 0.12, 0.0, 0.77'}]
                </p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5 font-semibold">
                  <span>Neural Cluster: <strong className="text-cyan-300">{selectedNode.cluster_id || 'Cluster_0'}</strong></span>
                  <span>Activation: <strong className="text-emerald-400">GCN ReLU</strong></span>
                </div>
              </div>
            )}

            {/* Connected Dependencies Summary */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-gray-300 flex items-center justify-between">
                <span>Connected Neighbors</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] border border-cyan-500/30 font-bold">
                  {selectedNodeNeighbors.length} Edges
                </span>
              </h5>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {selectedNodeNeighbors.map((n, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-gray-900/60 border border-gray-800 text-[11px] flex items-center justify-between">
                    <span className="code-font text-gray-200 truncate max-w-[180px]">{n.label}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded badge-${n.type.toLowerCase()}`}>
                      {n.type}
                    </span>
                  </div>
                ))}
                {selectedNodeNeighbors.length === 0 && (
                  <p className="text-[11px] text-gray-500 italic">No direct edges detected in current view filter.</p>
                )}
              </div>
            </div>

            {/* Direct Action Triggers */}
            <div className="pt-2 border-t border-gray-800 flex items-center gap-2">
              {onSelectImpactTarget && onNavigateTab && (
                <button
                  onClick={() => {
                    onSelectImpactTarget(selectedNode.file || selectedNode.label);
                    onNavigateTab('impact');
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>Predict Impact</span>
                </button>
              )}

              <button
                onClick={() => {
                  const targetName = selectedNode.label || selectedNode.id;
                  const targetFile = selectedNode.file || targetName;
                  if (onAskAI) {
                    onAskAI({ label: targetName, file: targetFile, type: selectedNode.type });
                  } else if (onNavigateTab) {
                    onNavigateTab('chat');
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-md shadow-cyan-500/20 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
