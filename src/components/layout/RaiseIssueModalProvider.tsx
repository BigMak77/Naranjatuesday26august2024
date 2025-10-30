"use client";

import React, { useState, ReactNode } from "react";
import { RaiseIssueModalContext } from "@/context/RaiseIssueModalContext";
import OverlayDialog from "@/components/ui/OverlayDialog";
import RaiseIssueWizard from "@/components/issues/RaiseIssueWizard";

interface RaiseIssueModalProviderProps {
  children: ReactNode;
}

export default function RaiseIssueModalProvider({ children }: RaiseIssueModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openRaiseIssue = () => {
    setIsOpen(true);
  };

  const closeRaiseIssue = () => {
    setIsOpen(false);
  };

  return (
    <RaiseIssueModalContext.Provider value={{ openRaiseIssue }}>
      {children}
      <OverlayDialog
        open={isOpen}
        onClose={closeRaiseIssue}
        ariaLabelledby="raise-issue-title"
        width={600}
      >
        <div style={{ marginBottom: "1rem" }}>
          <h2 id="raise-issue-title" className="neon-form-title">
            Raise Issue
          </h2>
          <p style={{ color: "var(--text-white)", marginTop: "0.5rem" }}>
            Report a new issue or concern to the appropriate department
          </p>
        </div>
        <RaiseIssueWizard onClose={closeRaiseIssue} />
      </OverlayDialog>
    </RaiseIssueModalContext.Provider>
  );
}
