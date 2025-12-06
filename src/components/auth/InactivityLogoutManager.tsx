"use client";

import { useState } from "react";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import OverlayDialog from "@/components/ui/OverlayDialog";

interface InactivityLogoutManagerProps {
  /**
   * Timeout duration in minutes
   * Default: 30 minutes
   */
  timeoutMinutes?: number;
  /**
   * Warning time in seconds before logout
   * Default: 60 seconds
   */
  warningSeconds?: number;
  /**
   * Whether to enable inactivity logout
   * Default: true
   */
  enabled?: boolean;
}

export default function InactivityLogoutManager({
  timeoutMinutes = 30,
  warningSeconds = 60,
  enabled = true,
}: InactivityLogoutManagerProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningSeconds);

  const { resetTimer } = useInactivityLogout({
    timeout: timeoutMinutes * 60 * 1000,
    warningTime: warningSeconds * 1000,
    enabled,
    onWarning: () => {
      setShowWarning(true);
      setCountdown(warningSeconds);

      // Start countdown
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onLogout: () => {
      setShowWarning(false);
    },
  });

  const handleStaySignedIn = () => {
    setShowWarning(false);
    resetTimer();
  };

  if (!enabled) return null;

  return (
    <OverlayDialog
      open={showWarning}
      onClose={handleStaySignedIn}
      closeOnOutsideClick={false}
      width={500}
      ariaLabelledby="inactivity-warning-title"
      zIndexOverlay={100000}
      zIndexContent={100001}
    >
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2
          id="inactivity-warning-title"
          style={{
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#fa7a20",
            marginBottom: "1rem",
          }}
        >
          Session Expiring
        </h2>

        <p
          style={{
            color: "#40e0d0",
            fontSize: "1.1rem",
            marginBottom: "1.5rem",
          }}
        >
          You will be logged out due to inactivity in:
        </p>

        <div
          style={{
            fontSize: "3rem",
            fontWeight: "800",
            color: countdown <= 10 ? "#ff4d4f" : "#fa7a20",
            marginBottom: "1.5rem",
            transition: "color 0.3s ease",
          }}
        >
          {countdown}s
        </div>

        <p
          style={{
            color: "#fff",
            fontSize: "0.95rem",
            marginBottom: "2rem",
            opacity: 0.8,
          }}
        >
          Click the button below to stay signed in.
        </p>

        <button
          onClick={handleStaySignedIn}
          style={{
            width: "100%",
            padding: "12px 24px",
            fontSize: "18px",
            fontWeight: "700",
            color: "#ffffff",
            backgroundColor: "#fa7a20",
            border: "2px solid #fa7a20",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#ff8c3a";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#fa7a20";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Stay Signed In
        </button>
      </div>
    </OverlayDialog>
  );
}
