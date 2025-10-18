import React from "react";

interface MainHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * MainHeader - Neon styled page header and subheader for main content sections.
 * Usage:
 * <MainHeader title="Dashboard" subtitle="Welcome to your dashboard" />
 */
export default function MainHeader({ title, subtitle, className = "" }: MainHeaderProps) {
  const containerClasses = [
    "main-header-container",
    subtitle ? "with-subtitle" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div className={containerClasses}>
      <h1 className="main-header">{title}</h1>
      {subtitle && <div className="main-subheader">{subtitle}</div>}
    </div>
  );
}
