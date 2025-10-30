"use client";

import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';

/**
 * A safe wrapper around Next.js router that prevents excessive navigation calls
 * that could trigger the "history.replaceState() more than 100 times per 10 seconds" error
 */
export function useRouterSafe() {
  const router = useRouter();
  const callCountRef = useRef<{ count: number; timestamp: number }>({ count: 0, timestamp: Date.now() });
  const pendingNavigationRef = useRef<NodeJS.Timeout | null>(null);

  const safeNavigate = useCallback((action: () => void, debounceMs: number = 100) => {
    const now = Date.now();
    const timeDiff = now - callCountRef.current.timestamp;

    // Reset counter if more than 10 seconds have passed
    if (timeDiff > 10000) {
      callCountRef.current = { count: 0, timestamp: now };
    }

    // If we're approaching the limit, add a longer delay
    if (callCountRef.current.count > 80) {
      if (pendingNavigationRef.current) {
        clearTimeout(pendingNavigationRef.current);
      }
      
      pendingNavigationRef.current = setTimeout(() => {
        action();
        callCountRef.current.count++;
        pendingNavigationRef.current = null;
      }, Math.max(debounceMs, 1000)); // Minimum 1 second delay when approaching limit
      
      return;
    }

    // Normal debounced navigation
    if (pendingNavigationRef.current) {
      clearTimeout(pendingNavigationRef.current);
    }

    pendingNavigationRef.current = setTimeout(() => {
      action();
      callCountRef.current.count++;
      pendingNavigationRef.current = null;
    }, debounceMs);
  }, []);

  const safePush = useCallback((url: string, debounceMs?: number) => {
    safeNavigate(() => router.push(url), debounceMs);
  }, [router, safeNavigate]);

  const safeReplace = useCallback((url: string, debounceMs?: number) => {
    safeNavigate(() => router.replace(url), debounceMs);
  }, [router, safeNavigate]);

  const safeBack = useCallback((debounceMs?: number) => {
    safeNavigate(() => router.back(), debounceMs);
  }, [router, safeNavigate]);

  const safeForward = useCallback((debounceMs?: number) => {
    safeNavigate(() => router.forward(), debounceMs);
  }, [router, safeNavigate]);

  const safeRefresh = useCallback((debounceMs?: number) => {
    safeNavigate(() => router.refresh(), debounceMs);
  }, [router, safeNavigate]);

  return {
    push: safePush,
    replace: safeReplace,
    back: safeBack,
    forward: safeForward,
    refresh: safeRefresh,
    // Expose original router for cases where immediate action is needed
    original: router,
  };
}
