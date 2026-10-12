import React from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  overflowVisible?: boolean;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  onClick,
  overflowVisible = false,
}) => {
  const shouldBeVisible = overflowVisible || className.includes('overflow-visible');

  return (
    <div
      onClick={onClick}
      className={`relative ${
        shouldBeVisible ? 'overflow-visible' : 'overflow-hidden'
      } rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141518] p-5 sm:p-6 shadow-xs transition-colors duration-200 ${className}`}
    >
      <div className={`relative z-10 ${shouldBeVisible ? 'overflow-visible' : ''}`}>{children}</div>
    </div>
  );
};
