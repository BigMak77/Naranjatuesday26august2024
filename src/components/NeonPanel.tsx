import React from "react";

interface NeonPanelProps {
  children: React.ReactNode;
  bgColor?: string;
  glowColor?: string;
  className?: string;
}

export default function NeonPanel({
  children,
  bgColor = undefined,
  glowColor = undefined,
  className = "",
}: NeonPanelProps) {
  // Use global neon classes for panel styling
  return (
    <div
      className={`neon-panel ${className}`.trim()}
      style={{
        backgroundColor: bgColor || undefined,
        boxShadow: glowColor ? `0 0 8px ${glowColor}` : undefined,
      }}
    >
      {children}
    </div>
  );
}
