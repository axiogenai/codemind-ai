import React, { useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 ${className}`}>
      {children}
    </div>
  );
};

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: string; // e.g. 'md:col-span-2'
  rowSpan?: string; // e.g. 'md:row-span-2'
  overflowVisible?: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  colSpan = '',
  rowSpan = '',
  overflowVisible = false,
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const { isDarkMode } = useTheme();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const spotlightColor = isDarkMode
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(100, 116, 139, 0.08)';

  const shouldBeVisible = overflowVisible || className.includes('overflow-visible');

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`group relative ${
        shouldBeVisible ? 'overflow-visible' : 'overflow-hidden'
      } rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0D0E11] p-4.5 sm:p-5 shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.16] transition-colors duration-200 ${colSpan} ${rowSpan} ${className}`}
    >
      {/* Ambient Spotlight Layer (Aceternity UI archetype) */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl sm:rounded-3xl overflow-hidden z-0"
        style={{
          opacity,
          background: `radial-gradient(450px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 65%)`,
        }}
      />
      <div className={`relative z-10 h-full flex flex-col ${shouldBeVisible ? 'overflow-visible' : ''}`}>{children}</div>
    </div>
  );
};
