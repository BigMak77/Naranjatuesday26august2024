"use client";

import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactElement;
  delay?: number; // milliseconds, default 100ms
}

export function CustomTooltip({ text, children, delay = 100 }: TooltipProps) {
  // Use CSS-based tooltips for fast timing without JS interference
  return React.cloneElement(children, {
    'data-tooltip': text,
    'data-tooltip-delay': delay,
    className: `${children.props.className || ''} custom-tooltip-trigger`.trim(),
    // Remove native title to avoid duplicate tooltips
    title: undefined
  });
}
