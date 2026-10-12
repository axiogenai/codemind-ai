import React, { useEffect, useMemo, useState } from 'react';
import { AgentActivity, type AgentActivityItem } from './agent-activity';

interface CodebaseProcessingActivityProps {
  mode?: 'local' | 'upload' | 'url';
  targetName?: string;
  className?: string;
}

const CHARACTERS_PER_SECOND = 90;

export const CodebaseProcessingActivity: React.FC<CodebaseProcessingActivityProps> = ({
  mode = 'local',
  targetName,
  className,
}) => {
  const [stream, setStream] = useState('');

  const reasoningText = useMemo(() => {
    const label = targetName?.trim()
      ? targetName.trim()
      : mode === 'upload'
      ? 'uploaded archive'
      : mode === 'url'
      ? 'target web application'
      : 'local repository';

    return [
      `Scanning ${label} and separating source modules from build artifacts.`,
      'Parsing Abstract Syntax Tree tokens and resolving cross-file import and export declarations.',
      'Mapping call hierarchies and symbol references into the Universal Knowledge Graph.',
      'Calculating downstream dependency blast radius and topological coupling metrics across modules.',
      'Running static security vulnerability patterns and code smell heuristics across source files.',
      'Synthesizing architectural digital twin diagrams and interactive component relationships.',
      'Finalizing codebase index and preparing interactive workspace views.',
    ].join('\n');
  }, [mode, targetName]);

  const streamSeconds = reasoningText.length / CHARACTERS_PER_SECOND;

  useEffect(() => {
    const startedAt = performance.now();
    let frame = 0;
    let lastUpdate = 0;

    const streamNextFrame = (now: number) => {
      if (now - lastUpdate >= 28) {
        lastUpdate = now;
        const cursor = Math.min(
          reasoningText.length,
          Math.floor(((now - startedAt) / 1000) * CHARACTERS_PER_SECOND),
        );
        const next = reasoningText.slice(0, cursor);
        setStream((current) => (current === next ? current : next));

        if (cursor >= reasoningText.length) {
          return;
        }
      }
      frame = requestAnimationFrame(streamNextFrame);
    };

    frame = requestAnimationFrame(streamNextFrame);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [reasoningText]);

  const items: AgentActivityItem[] = stream
    .split('\n')
    .filter(Boolean)
    .map((content, index) => ({
      id: `reasoning-${index}`,
      type: 'text',
      content,
    }));

  return (
    <AgentActivity
      items={items}
      contentType="text"
      status="working"
      duration={streamSeconds}
      defaultOpen={false}
      collapseOnComplete={true}
      maxHeight={180}
      className={className}
    />
  );
};

export default CodebaseProcessingActivity;
