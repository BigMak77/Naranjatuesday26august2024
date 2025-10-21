"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  children: React.ReactElement;
  delay?: number; // milliseconds, default 100ms
}

export function CustomTooltip({ text, children, delay = 100 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top - 8, // 8px above the element
          left: rect.left + rect.width / 2, // center horizontally
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
      // Preserve original ref if exists
      const originalRef = (children as any).ref;
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
            transform: 'translate(-50%, -100%)',
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
