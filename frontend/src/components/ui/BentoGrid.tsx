import React from 'react';

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
  const shouldBeVisible = overflowVisible || className.includes('overflow-visible');

  return (
    <div
      className={`group relative ${
        shouldBeVisible ? 'overflow-visible' : 'overflow-hidden'
      } rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0D0E11] p-4.5 sm:p-5 shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.16] transition-colors duration-200 ${colSpan} ${rowSpan} ${className}`}
    >
      <div className={`z-10 h-full flex flex-col ${shouldBeVisible ? 'overflow-visible' : ''}`}>{children}</div>
    </div>
  );
};
