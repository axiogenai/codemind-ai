import React from 'react';
import logoImg from '../assets/codemind-logo.png';

interface CodeMindLogoProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

export const CodeMindLogo: React.FC<CodeMindLogoProps> = ({
  className = 'w-8 h-8',
  size,
  alt = 'CodeMind AI Logo',
}) => {
  return (
    <img
      src={logoImg}
      alt={alt}
      style={size ? { width: size, height: size } : undefined}
      className={`shrink-0 select-none object-contain rounded-full transition-transform duration-200 ${className}`}
      draggable={false}
    />
  );
};

export default CodeMindLogo;
