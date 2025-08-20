import React from 'react';

interface NeonPanelProps {
  children: React.ReactNode;
  bgColor?: string;
  glowColor?: string;
  className?: string;
}

export default function NeonPanel({ children, bgColor = '#012f34', glowColor = '#40E0D0', className = '' }: NeonPanelProps) {
  return (
    <div
      className={`p-6 rounded-xl ${className}`}
      style={{
        backgroundColor: bgColor,
        boxShadow: `0 0 12px ${glowColor}`,
      }}
    >
      {children}
    </div>
  );
}
