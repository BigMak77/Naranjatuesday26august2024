"use client";

import React from 'react'
import { useRouter } from 'next/navigation'

type NeonFeatureCardProps = {
  icon: React.ReactNode
  title: string
  text: string
  href: string
  children?: React.ReactNode // <-- add children prop
}

export default function NeonFeatureCard({
  icon,
  title,
  text,
  href,
  children,
  className,
}: NeonFeatureCardProps & { className?: string }) {
  const router = useRouter();
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent navigation if clicking a child link/button
    if (
      e.target instanceof HTMLElement &&
      (e.target.tagName === 'A' || e.target.tagName === 'BUTTON')
    ) {
      return;
    }
    if (href) router.push(href);
  };
  return (
    <div
      className={["neon-feature-card", className].filter(Boolean).join(" ")}
      tabIndex={0}
      role="button"
      onClick={handleClick}
      onKeyDown={e => {
        if ((e.key === 'Enter' || e.key === ' ') && href) {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      <div className="neon-feature-card-header">
        <span className="neon-btn neon-icon-btn" tabIndex={-1} aria-hidden="true">{icon}</span>
        <span className="neon-feature-card-title">{title}</span>
      </div>
      <div className="neon-feature-card-text">{text}</div>
      {children && (
        <div className="neon-feature-card-children">{children}</div>
      )}
    </div>
  )
}

// No further changes needed; already globally styled.
