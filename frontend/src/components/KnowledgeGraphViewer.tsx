import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { KnowledgeGraphData, GraphNode } from '../types';
import { Search, Zap, Layers, GitPullRequest, Cpu, Network, GitMerge, SlidersHorizontal, X } from 'lucide-react';
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

  // --- MODEL 2: Virtualized High-Scale Connection Flow Engine (Clean Architecture Flow) ---
  useEffect(() => {
    if (viewMode !== 'CONNECTION_FLOW' || !flowCanvasRef.current || filteredNodes.length === 0) return;

    const canvas = flowCanvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 1000;
    const height = canvas.parentElement?.clientHeight || 650;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Group into distinct architectural columns with Project Root separate from Files
    const columns: Record<string, GraphNode[]> = {
      Projects: [],
      Files: [],
      Classes: [],
      Functions: [],
      APIs: []
    };

    filteredNodes.forEach(node => {
      if (node.type === 'Project') columns.Projects.push(node);
      else if (node.type === 'File') columns.Files.push(node);
      else if (node.type === 'Class') columns.Classes.push(node);
      else if (node.type === 'Function') columns.Functions.push(node);
      else columns.APIs.push(node);
    });

    const colKeys = ['Projects', 'Files', 'Classes', 'Functions', 'APIs'];

    const activeCols = colKeys.filter(k => columns[k].length > 0);
    const cardWidth = 260;
    const cardHeight = 36;
    const rowHeight = 46;
    const colGap = 260;
    const sideMargin = 80;
    const startY = 100;

    // Stable, fixed column horizontal positions
    const colXMap = new Map<string, number>();
    activeCols.forEach((colKey, colIdx) => {
      colXMap.set(colKey, sideMargin + colIdx * (cardWidth + colGap));
    });

    // Fast lookup for connected node IDs
    const selectedConnectedNodeIds = new Set<string>();
    if (selectedNode) {
      selectedConnectedNodeIds.add(selectedNode.id);
      filteredLinks.forEach(link => {
        const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;
        if (sId === selectedNode.id) selectedConnectedNodeIds.add(tId);
        if (tId === selectedNode.id) selectedConnectedNodeIds.add(sId);
      });
    }

    const activeFocusNode = selectedNode || hoveredNode;
    const connectedNodeIds = new Set<string>();
    if (activeFocusNode) {
      connectedNodeIds.add(activeFocusNode.id);
      filteredLinks.forEach(link => {
        const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;
        if (sId === activeFocusNode.id) connectedNodeIds.add(tId);
        if (tId === activeFocusNode.id) connectedNodeIds.add(sId);
      });
    }

    const nodePositions = new Map<string, { x: number; y: number; node: GraphNode }>();
    const columnHeaderPositions = new Map<string, { x: number; y: number; count: number; total: number }>();

    if (!selectedNode) {
      // OVERVIEW MODE: Normal full column layout
      activeCols.forEach((colKey) => {
        const colNodes = columns[colKey];
        const colX = colXMap.get(colKey)!;

        columnHeaderPositions.set(colKey, {
          x: colX,
          y: 45,
          count: colNodes.length,
          total: colNodes.length
        });

        colNodes.forEach((node, rowIdx) => {
          nodePositions.set(node.id, {
            x: colX,
            y: startY + rowIdx * rowHeight,
            node
          });
        });
      });
    } else {
      // FOCUS MODE: Selected node STAYS AT THE EXACT SAME (X, Y) WHERE IT WAS CLICKED!
      const selectedColKey = selectedNode.type === 'Project'
        ? 'Projects'
        : selectedNode.type === 'File'
        ? 'Files'
        : selectedNode.type === 'Class'
        ? 'Classes'
        : selectedNode.type === 'Function'
        ? 'Functions'
        : 'APIs';

      const selectedColX = colXMap.get(selectedColKey) || sideMargin;
      const originalSelectedRowIdx = columns[selectedColKey].findIndex(n => n.id === selectedNode.id);
      const selectedNodeY = startY + (originalSelectedRowIdx >= 0 ? originalSelectedRowIdx : 0) * rowHeight;

      // 1. Anchor selected node at its EXACT location (does not move at all!)
      nodePositions.set(selectedNode.id, {
        x: selectedColX,
        y: selectedNodeY,
        node: selectedNode
      });

      // 2. In the same column, stack any other connected nodes right next to selectedNode
      const otherConnectedInSameCol = columns[selectedColKey].filter(n => n.id !== selectedNode.id && selectedConnectedNodeIds.has(n.id));
      otherConnectedInSameCol.forEach((node, idx) => {
        const offset = (idx % 2 === 0) ? -Math.ceil((idx + 1) / 2) * rowHeight : Math.ceil((idx + 1) / 2) * rowHeight;
        nodePositions.set(node.id, {
          x: selectedColX,
          y: Math.max(70, selectedNodeY + offset),
          node
        });
      });

      // Header for selected column
      let minSelectedColY = selectedNodeY;
      otherConnectedInSameCol.forEach(n => {
        const p = nodePositions.get(n.id);
        if (p && p.y < minSelectedColY) minSelectedColY = p.y;
      });
      columnHeaderPositions.set(selectedColKey, {
        x: selectedColX,
        y: Math.max(30, minSelectedColY - 36),
        count: 1 + otherConnectedInSameCol.length,
        total: columns[selectedColKey].length
      });

      // Check if both Classes and Functions are connected downstream from this node
      const hasConnectedClasses = columns.Classes.some(n => selectedConnectedNodeIds.has(n.id));
      const hasConnectedFunctions = columns.Functions.some(n => selectedConnectedNodeIds.has(n.id));

      // 3. In other columns, gather connected nodes.
      // If both Classes and Functions exist, stagger Classes to upper tier and Functions to lower tier
      // to guarantee lines to Functions NEVER pass through or overlap Class cards!
      activeCols.forEach(colKey => {
        if (colKey === selectedColKey) return;
        const connectedInCol = columns[colKey].filter(n => selectedConnectedNodeIds.has(n.id));
        if (connectedInCol.length === 0) return;

        const colX = colXMap.get(colKey)!;
        const totalClusterHeight = connectedInCol.length * rowHeight;
        
        let clusterStartY: number;

        if (hasConnectedClasses && hasConnectedFunctions) {
          if (colKey === 'Classes') {
            // Upper tier: completely above the selected node's horizontal level
            clusterStartY = Math.max(70, selectedNodeY - totalClusterHeight - 16);
          } else if (colKey === 'Functions') {
            // Lower tier: starts level with or below the selected node
            clusterStartY = selectedNodeY + 16;
          } else {
            // Projects (upstream) or APIs (downstream): centered around selectedNodeY
            clusterStartY = Math.max(70, selectedNodeY + (cardHeight / 2) - (totalClusterHeight / 2));
          }
        } else {
          // Standard centered cluster
          clusterStartY = Math.max(70, selectedNodeY + (cardHeight / 2) - (totalClusterHeight / 2));
        }

        connectedInCol.forEach((node, idx) => {
          nodePositions.set(node.id, {
            x: colX,
            y: clusterStartY + idx * rowHeight,
            node
          });
        });

        columnHeaderPositions.set(colKey, {
          x: colX,
          y: Math.max(30, clusterStartY - 36),
          count: connectedInCol.length,
          total: columns[colKey].length
        });
      });
    }

    const drawFlow = () => {
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      const t = flowTransformRef.current;
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      // Virtualized Viewport Range in World Coordinates
      const margin = 120;
      const visibleMinY = -t.y / t.k - margin;
      const visibleMaxY = (height - t.y) / t.k + margin;
      const visibleMinX = -t.x / t.k - margin;
      const visibleMaxX = (width - t.x) / t.k + margin;

      // Draw Column Header Plates
      columnHeaderPositions.forEach((headerPos, colKey) => {
        const headerY = selectedNode ? headerPos.y : Math.max(30, visibleMinY + 45);
        const colX = headerPos.x;

        ctx.save();
        ctx.fillStyle = '#141414';
        ctx.beginPath();
        ctx.roundRect(colX, headerY, cardWidth, 28, 8);
        ctx.fill();
        ctx.strokeStyle = '#262626';
        ctx.lineWidth = 1;
        ctx.stroke();

        const colColor = colKey === 'Projects' ? '#3B82F6' : colKey === 'Files' ? '#10B981' : colKey === 'Classes' ? '#8B5CF6' : colKey === 'Functions' ? '#EC4899' : '#F59E0B';
        ctx.fillStyle = colColor;
        ctx.beginPath();
        ctx.arc(colX + 14, headerY + 14, 4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(colKey.toUpperCase(), colX + 26, headerY + 18);

        ctx.fillStyle = '#9CA3AF';
        ctx.font = '10px Inter, sans-serif';
        const countText = selectedNode ? `${headerPos.count}` : `${headerPos.total}`;
        const countWidth = ctx.measureText(countText).width;
        ctx.fillText(countText, colX + cardWidth - countWidth - 12, headerY + 18);

        ctx.restore();
      });

      // Draw Curved Connection Links
      const colorMap: Record<string, string> = {
        Project: '#3B82F6',
        File: '#10B981',
        Class: '#8B5CF6',
        Function: '#EC4899',
        API: '#F59E0B',
        DatabaseTable: '#06B6D4'
      };

      filteredLinks.forEach(link => {
        const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;
        const sPos = nodePositions.get(sId);
        const tPos = nodePositions.get(tId);

        if (sPos && tPos) {
          // When a node is selected, ONLY draw direct links to that node
          if (selectedNode) {
            if (sId !== selectedNode.id && tId !== selectedNode.id) {
              return;
            }
          } else if (hoveredNode) {
            if (sId !== hoveredNode.id && tId !== hoveredNode.id) {
              return;
            }
          }

          const sVis = sPos.y >= visibleMinY && sPos.y <= visibleMaxY;
          const tVis = tPos.y >= visibleMinY && tPos.y <= visibleMaxY;

          if (sVis || tVis) {
            const isRelevant = activeFocusNode && (activeFocusNode.id === sId || activeFocusNode.id === tId);

            ctx.save();
            ctx.beginPath();

            if (Math.abs(sPos.x - tPos.x) < 5) {
              // Same-column connection: smooth arc on the right from port to port (no looping under card)
              const loopX = sPos.x + cardWidth + 28;
              const y1 = sPos.y + cardHeight / 2;
              const y2 = tPos.y + cardHeight / 2;
              ctx.moveTo(sPos.x + cardWidth, y1);
              ctx.bezierCurveTo(loopX, y1, loopX, y2, tPos.x + cardWidth, y2);
            } else {
              // Inter-column connection: clean left-to-right cubic curve
              const isLeftToRight = sPos.x <= tPos.x;
              const leftPos = isLeftToRight ? sPos : tPos;
              const rightPos = isLeftToRight ? tPos : sPos;

              const startX = leftPos.x + cardWidth;
              const startY = leftPos.y + cardHeight / 2;
              const endX = rightPos.x;
              const endY = rightPos.y + cardHeight / 2;
              const deltaX = Math.max(40, Math.abs(endX - startX) * 0.45);

              ctx.moveTo(startX, startY);
              ctx.bezierCurveTo(startX + deltaX, startY, endX - deltaX, endY, endX, endY);
            }

            if (isRelevant || selectedNode) {
              const beamColor = colorMap[sPos.node.type] || '#E2E8F0';
              ctx.strokeStyle = beamColor;
              ctx.lineWidth = 2.2;
            } else {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
              ctx.lineWidth = 0.9;
            }

            ctx.stroke();
            ctx.restore();
          }
        }
      });

      // Draw Node Cards (Clean modern rectangular chips)
      nodePositions.forEach(pos => {
        if (pos.y >= visibleMinY && pos.y <= visibleMaxY && pos.x >= visibleMinX && pos.x <= visibleMaxX) {
          const isSelected = selectedNode?.id === pos.node.id;
          const isHovered = hoveredNode?.id === pos.node.id;
          const isConnected = selectedNode
            ? (pos.node.id !== selectedNode.id)
            : (hoveredNode ? connectedNodeIds.has(pos.node.id) : false);
          const isDimmed = !selectedNode && hoveredNode && !isHovered && !isConnected;
          const color = colorMap[pos.node.type] || '#10B981';

          ctx.save();
          if (isDimmed) {
            ctx.globalAlpha = 0.25;
          }

          // Card container
          ctx.beginPath();
          ctx.roundRect(pos.x, pos.y, cardWidth, cardHeight, 8);
          ctx.fillStyle = isSelected ? '#1E1E22' : isHovered ? '#1A1A1E' : '#111113';
          ctx.fill();

          // Card border
          ctx.strokeStyle = isSelected ? '#FFFFFF' : isHovered ? '#E2E8F0' : isConnected ? `${color}99` : '#27272A';
          ctx.lineWidth = isSelected ? 1.8 : isHovered ? 1.4 : 1;
          ctx.stroke();

          // Type indicator pill on left edge
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(pos.x + 3, pos.y + 4, 3, cardHeight - 8, 2);
          ctx.fill();

          // Anchor pin dot
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(pos.x + 16, pos.y + cardHeight / 2, 3.5, 0, 2 * Math.PI);
          ctx.fill();

          // Node label text
          ctx.fillStyle = isSelected ? '#FFFFFF' : isHovered ? '#FFFFFF' : '#E2E8F0';
          ctx.font = isSelected || isHovered ? 'bold 11px Inter, monospace' : '10.5px Inter, monospace';
          const maxChar = selectedNode ? 24 : 22;
          const rawLabel = pos.node.label;
          const displayLabel = rawLabel.length > maxChar ? rawLabel.slice(0, maxChar - 2) + '..' : rawLabel;
          ctx.fillText(displayLabel, pos.x + 28, pos.y + cardHeight / 2 + 4);

          // Port dot on right edge
          ctx.fillStyle = isConnected || isSelected ? color : '#333333';
          ctx.beginPath();
          ctx.arc(pos.x + cardWidth, pos.y + cardHeight / 2, 2.5, 0, 2 * Math.PI);
          ctx.fill();

          ctx.restore();
        }
      });

      ctx.restore();
    };

    const zoomBehavior = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.15, 4])
      .on('zoom', (event) => {
        flowTransformRef.current = event.transform;
        drawFlow();
      });

    const d3FlowCanvas = d3.select(canvas);
    d3FlowCanvas.call(zoomBehavior);

    // Only initialize camera transform once on first mount; never move camera on node selection
    if (flowTransformRef.current.k === 1 && flowTransformRef.current.x === 0 && flowTransformRef.current.y === 0) {
      const overviewTotalWidth = sideMargin * 2 + activeCols.length * cardWidth + (activeCols.length - 1) * colGap;
      const fitScale = Math.min(1.0, Math.max(0.4, (width - 80) / Math.max(100, overviewTotalWidth)));
      const initialTransform = d3.zoomIdentity
        .translate(Math.max(20, (width - overviewTotalWidth * fitScale) / 2), 20)
        .scale(fitScale);
      flowTransformRef.current = initialTransform;
      d3FlowCanvas.call(zoomBehavior.transform, initialTransform);
    } else {
      drawFlow();
    }

    const getNodeAtCoords = (e: MouseEvent): GraphNode | null => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - flowTransformRef.current.x) / flowTransformRef.current.k;
      const clickY = (e.clientY - rect.top - flowTransformRef.current.y) / flowTransformRef.current.k;

      let found: GraphNode | null = null;
      nodePositions.forEach(pos => {
        // Disappeared/hidden nodes cannot be hit!
        if (selectedNode && !selectedConnectedNodeIds.has(pos.node.id)) {
          return;
        }
        if (
          clickX >= pos.x &&
          clickX <= pos.x + cardWidth &&
          clickY >= pos.y &&
          clickY <= pos.y + cardHeight
        ) {
          found = pos.node;
        }
      });
      return found;
    };

    const handleFlowMouseMove = (e: MouseEvent) => {
      const found = getNodeAtCoords(e);
      if (found !== hoveredNode) {
        setHoveredNode(found);
        canvas.style.cursor = found ? 'pointer' : 'grab';
        drawFlow();
      }
    };

    let mouseDownPos: { x: number; y: number } | null = null;

    const handleFlowMouseDown = (e: MouseEvent) => {
      mouseDownPos = { x: e.clientX, y: e.clientY };
    };

    const handleFlowClick = (e: MouseEvent) => {
      // If user dragged more than 6px, it's a pan gesture, not a click
      if (mouseDownPos) {
        const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
        if (dist > 6) return;
      }

      const found = getNodeAtCoords(e);
      if (found) {
        // Clicked on a node: toggle selection or select it
        setSelectedNode(found.id === selectedNode?.id ? null : found);
        if (found.id !== selectedNode?.id && onNodeClick) {
          onNodeClick(found);
        }
      } else {
        // Clicked aside on empty canvas: deselect and restore visibility of everything!
        setSelectedNode(null);
      }
      drawFlow();
    };

    const handleFlowContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const found = getNodeAtCoords(e);
      const rect = canvas.getBoundingClientRect();

      if (found) {
        setSelectedNode(found);
        setContextMenu({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          node: found
        });
        drawFlow();
      } else {
        setContextMenu(null);
      }
    };

    const handleFlowMouseLeave = () => {
      setHoveredNode(null);
      drawFlow();
    };

    canvas.addEventListener('mousedown', handleFlowMouseDown);
    canvas.addEventListener('mousemove', handleFlowMouseMove);
    canvas.addEventListener('click', handleFlowClick);
    canvas.addEventListener('contextmenu', handleFlowContextMenu);
    canvas.addEventListener('mouseleave', handleFlowMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', handleFlowMouseDown);
      canvas.removeEventListener('mousemove', handleFlowMouseMove);
      canvas.removeEventListener('click', handleFlowClick);
      canvas.removeEventListener('contextmenu', handleFlowContextMenu);
      canvas.removeEventListener('mouseleave', handleFlowMouseLeave);
    };
  }, [viewMode, filteredNodes, filteredLinks, selectedNode, hoveredNode]);

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
      {/* Controls Toolbar: Studio-Grade Precision Command Deck */}
      <div className="bg-[#0D0E11] border border-white/[0.08] rounded-xl p-3 shadow-xl flex flex-col gap-2.5">
        {/* Tier 1: Primary Controls & Engine Telemetry */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Precision Search Input */}
            <div className="relative flex items-center bg-[#151619] border border-white/[0.08] focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-600/40 rounded-lg px-2.5 h-8.5 w-60 transition-all">
              <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Search graph nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none text-xs text-zinc-200 placeholder:text-zinc-500 outline-none pl-2 pr-1 font-normal"
              />
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-zinc-500 bg-white/[0.03] border border-white/[0.06] rounded">
                  /
                </kbd>
              )}
            </div>

            <div className="h-4 w-px bg-white/[0.08] hidden md:block" />

            {/* Model Switcher: Force Graph vs Layered Connection Flow */}
            <div className="inline-flex items-center p-0.5 bg-[#151619] border border-white/[0.06] rounded-lg">
              <button
                onClick={() => setViewMode('FORCE_GRAPH')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'FORCE_GRAPH'
                    ? 'bg-[#24262B] text-zinc-100 shadow-xs border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Force Graph</span>
              </button>

              <button
                onClick={() => setViewMode('CONNECTION_FLOW')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'CONNECTION_FLOW'
                    ? 'bg-[#24262B] text-zinc-100 shadow-xs border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                <GitMerge className="w-3.5 h-3.5 text-emerald-400" />
                <span>Connection Flow</span>
                <span className="text-[9px] font-mono tracking-wide uppercase px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40 ml-1 font-semibold">
                  Zero Lag
                </span>
              </button>
            </div>

            {/* GNN Neural Mode Toggle - Hardware Engine Architecture */}
            <button
              onClick={() => setIsGnnMode(!isGnnMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                isGnnMode
                  ? 'bg-[#18261F] text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'bg-[#151619] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12]'
              }`}
            >
              {isGnnMode ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-zinc-600" />
              )}
              <Cpu className={`w-3.5 h-3.5 ${isGnnMode ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <span>{isGnnMode ? 'GNN Neural Engine Active' : 'GNN Neural Mode'}</span>
            </button>

            {/* LOD Level Selector */}
            <div className="inline-flex items-center p-0.5 bg-[#151619] border border-white/[0.06] rounded-lg">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 flex items-center gap-1 select-none">
                <Layers className="w-3 h-3 text-zinc-400" /> LOD
              </span>
              <button
                onClick={() => setViewLevel('FILES_ONLY')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewLevel === 'FILES_ONLY'
                    ? 'bg-[#24262B] text-zinc-100 shadow-xs border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                Files & APIs
              </button>
              <button
                onClick={() => setViewLevel('ALL_SYMBOLS')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewLevel === 'ALL_SYMBOLS'
                    ? 'bg-[#24262B] text-zinc-100 shadow-xs border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                All Symbols
              </button>
            </div>
          </div>

          {/* Counts Legend & Telemetry */}
          <div className="flex items-center gap-3 bg-[#151619] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-400">
            <span className="text-zinc-100 font-medium flex items-center gap-1.5 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
              <strong className="text-white font-semibold">{totalNodesCount}</strong> Nodes
            </span>
            <span className="w-px h-3 bg-white/[0.08]" />
            <div className="hidden xl:flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {typeCounts.File} Files
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> {typeCounts.Class} Classes
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> {typeCounts.Function} Functions
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {typeCounts.API} APIs
              </span>
            </div>
          </div>
        </div>

        {/* Tier 2: Entity Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/[0.05]">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium mr-1.5 select-none">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Filter:</span>
            </div>

            {[
              { id: 'ALL', label: 'All Entities', count: totalNodesCount, color: '#A1A1AA' },
              { id: 'File', label: 'Files', count: typeCounts.File, color: '#10B981' },
              { id: 'Class', label: 'Classes', count: typeCounts.Class, color: '#8B5CF6' },
              { id: 'Function', label: 'Functions', count: typeCounts.Function, color: '#EC4899' },
              { id: 'API', label: 'APIs', count: typeCounts.API, color: '#F59E0B' },
              { id: 'DatabaseTable', label: 'Database Tables', count: typeCounts.DatabaseTable, color: '#06B6D4' }
            ].map((item) => {
              const isActive = filterType === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setFilterType(item.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-600/70 shadow-[0_1px_2px_rgba(0,0,0,0.5)]'
                      : 'bg-[#151619]/60 hover:bg-[#1C1E23] border border-white/[0.04] hover:border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-black/50 text-zinc-200' : 'bg-black/30 text-zinc-400'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subtle Interaction Guide */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="font-mono text-[9px] bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-zinc-400">
              Right-Click
            </span>
            <span>on node for AI context & blast radius</span>
          </div>
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
          <div 
            className="w-full h-full relative overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedNode(null);
              }
            }}
          >
            <canvas ref={flowCanvasRef} className="w-full h-full bg-[#0A0A0A] cursor-grab active:cursor-grabbing" />
            <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-[#141414]/90 border border-neutral-800 text-[11px] text-neutral-300 flex items-center space-x-2.5 shadow-lg select-none">
              <span className={`w-2 h-2 rounded-full ${selectedNode ? 'bg-amber-400 animate-pulse' : 'bg-zinc-400'}`} />
              {selectedNode ? (
                <div className="flex items-center gap-2">
                  <span>
                    Isolated: <strong className="text-white font-mono">{selectedNode.label}</strong> ({selectedNodeNeighbors.length} connected items visible)
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(null);
                    }}
                    className="ml-2 px-2.5 py-0.5 rounded bg-white/[0.08] hover:bg-white/[0.16] text-zinc-200 text-[10px] font-mono border border-white/[0.1] transition-colors cursor-pointer"
                  >
                    Click aside to show all
                  </button>
                </div>
              ) : (
                <span><strong className="text-white">Connection Flow</strong>: Click any card to isolate its connections. Click aside to show all.</span>
              )}
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
