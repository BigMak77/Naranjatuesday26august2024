import React from "react";

interface NeonPanelProps {
  children: React.ReactNode;
  className?: string;
}

export default function NeonPanel({
  children,
  className = "",
}: NeonPanelProps) {
  // Use global neon classes for panel styling
  return (
    <div className={`neon-panel ${className}`.trim()}>
      {children}
    </div>
  );
}
