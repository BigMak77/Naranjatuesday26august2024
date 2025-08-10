import React from 'react';

interface NeonPanelProps {
  children: React.ReactNode;
  className?: string;
}

export default function NeonPanel({ children, className = '' }: NeonPanelProps) {
  return (
    <div className={`neon-panel ${className}`}>
      {children}
    </div>
  );
}
