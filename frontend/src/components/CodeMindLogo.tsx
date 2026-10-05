import React, { useId } from 'react';

interface CodeMindLogoProps {
  className?: string;
  size?: number | string;
}

export const CodeMindLogo: React.FC<CodeMindLogoProps> = ({
  className = 'w-full h-full',
  size,
}) => {
  const rawId = useId();
  const idPrefix = `cm-${rawId.replace(/:/g, '')}`;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={size ? { width: size, height: size } : undefined}
      className={`shrink-0 select-none transition-transform duration-200 ${className}`}
    >
      <defs>
        {/* Facet 1: Top Plane (Electric Sky / Cyan to Cobalt) */}
        <linearGradient id={`${idPrefix}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Facet 2: Left Plane (Royal Blue to Deep Indigo) */}
        <linearGradient id={`${idPrefix}-left`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        {/* Facet 3: Right Plane (Electric Violet to Purple) */}
        <linearGradient id={`${idPrefix}-right`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* Outer Isometric Hexagon Prism (AST Knowledge Core) */}
      {/* Top Facet: Code Architecture & AST Syntax */}
      <path
        d="M 24 6 L 39.5 15 L 24 24 L 8.5 15 Z"
        fill={`url(#${idPrefix}-top)`}
      />

      {/* Left Facet: Neural Graph & Intelligence Engine */}
      <path
        d="M 8.5 15 L 24 24 L 24 42 L 8.5 33 Z"
        fill={`url(#${idPrefix}-left)`}
      />

      {/* Right Facet: Reverse Engineering & Repository Transformation */}
      <path
        d="M 24 24 L 39.5 15 L 39.5 33 L 24 42 Z"
        fill={`url(#${idPrefix}-right)`}
      />

      {/* Precision Negative Space Separators */}
      <path
        d="M 24 6 L 24 24 M 8.5 15 L 24 24 M 39.5 15 L 24 24 M 24 24 L 24 42"
        className="stroke-zinc-950 dark:stroke-[#0A0A0A]"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Central Nexus Core (Graph Hub) */}
      <circle cx="24" cy="24" r="2.2" className="fill-white" />

      {/* AST Branching Connection Nodes on Vertices */}
      <circle cx="24" cy="6" r="1.5" fill="#38BDF8" />
      <circle cx="39.5" cy="15" r="1.5" fill="#6366F1" />
      <circle cx="39.5" cy="33" r="1.5" fill="#7C3AED" />
      <circle cx="24" cy="42" r="1.5" fill="#4F46E5" />
      <circle cx="8.5" cy="33" r="1.5" fill="#2563EB" />
      <circle cx="8.5" cy="15" r="1.5" fill="#38BDF8" />
    </svg>
  );
};

export default CodeMindLogo;
