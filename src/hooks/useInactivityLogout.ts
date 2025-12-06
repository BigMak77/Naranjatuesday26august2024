"use client";

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

interface UseInactivityLogoutOptions {
  /**
   * Timeout duration in milliseconds after which user will be logged out
   * Default: 30 minutes (1800000ms)
   */
  timeout?: number;
  /**
   * Whether to enable inactivity logout
   * Default: true
   */
  enabled?: boolean;
  /**
   * Show a warning before logging out (in milliseconds before timeout)
   * Default: 60000 (1 minute before)
   */
  warningTime?: number;
  /**
   * Callback when warning is triggered
   */
  onWarning?: () => void;
  /**
   * Callback when logout occurs
   */
  onLogout?: () => void;
}

/**
 * Hook to automatically log out users after a period of inactivity
 * Tracks mouse movements, clicks, keyboard events, and touch events
 */
export function useInactivityLogout(options: UseInactivityLogoutOptions = {}) {
  const {
    timeout = 30 * 60 * 1000, // 30 minutes default
    enabled = true,
    warningTime = 60 * 1000, // 1 minute warning
    onWarning,
    onLogout,
  } = options;

  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      onLogout?.();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    } catch (error) {
      console.error("Error during inactivity logout:", error);
    }
  }, [onLogout]);

  const showWarning = useCallback(() => {
    if (!warningShownRef.current) {
      warningShownRef.current = true;
      onWarning?.();
    }
  }, [onWarning]);

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Reset warning flag
    warningShownRef.current = false;

    if (!enabled) return;

    // Set warning timer if configured
    if (warningTime > 0 && warningTime < timeout) {
      warningTimeoutRef.current = setTimeout(() => {
        showWarning();
      }, timeout - warningTime);
    }

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeout);
  }, [enabled, timeout, warningTime, handleLogout, showWarning]);

  useEffect(() => {
    if (!enabled) return;

    // Events to track for user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttle the reset to avoid too many calls
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledResetTimer = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetTimer();
          throttleTimeout = null;
        }, 1000); // Throttle to once per second
      }
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, throttledResetTimer);
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledResetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [enabled, resetTimer]);

  return {
    resetTimer,
  };
}
