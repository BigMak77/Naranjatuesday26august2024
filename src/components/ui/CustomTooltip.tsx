"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  children: React.ReactElement;
  delay?: number; // milliseconds, default 100ms
  placement?: 'top' | 'bottom'; // default 'top'
}

export function CustomTooltip({ text, children, delay = 100, placement = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipWidth = 120; // Approximate width of tooltip
        let leftPosition = rect.left + rect.width / 2;

        // Adjust if tooltip would go off-screen on the left
        if (leftPosition - tooltipWidth / 2 < 10) {
          leftPosition = tooltipWidth / 2 + 10;
        }

        // Adjust if tooltip would go off-screen on the right
        if (leftPosition + tooltipWidth / 2 > window.innerWidth - 10) {
          leftPosition = window.innerWidth - tooltipWidth / 2 - 10;
        }

        setPosition({
          top: placement === 'bottom' ? rect.bottom + 8 : rect.top - 8,
          left: leftPosition,
        });
        setIsVisible(true);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clonedChild = React.cloneElement(children, {
    ref: (el: HTMLElement) => {
      triggerRef.current = el;
      // Preserve original ref if exists (React 19 compatibility)
      const originalRef = children.props.ref;
      if (typeof originalRef === 'function') {
        originalRef(el);
      } else if (originalRef) {
        originalRef.current = el;
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      children.props.onMouseLeave?.(e);
    },
    title: undefined, // Remove native title
  });

  return (
    <>
      {clonedChild}
      {isVisible && typeof window !== 'undefined' && createPortal(
        <div
          className="custom-tooltip-portal"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: placement === 'bottom' ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            zIndex: 999999,
            pointerEvents: 'none',
          }}
        >
          <div className="custom-tooltip-content">
            {text}
          </div>
          <div className="custom-tooltip-arrow" />
        </div>,
        document.body
      )}
    </>
  );
}
