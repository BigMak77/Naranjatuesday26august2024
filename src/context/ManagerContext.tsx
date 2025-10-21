"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type ManagerView = "My Team" | "My Team Training" | "My Team Tasks" | "My Team Issues" | "My Team Audits" | "My Team Compliance" | "User Dashboard";

interface ManagerContextType {
  currentView: ManagerView;
  setCurrentView: (view: ManagerView) => void;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export function useManagerContext() {
  const context = useContext(ManagerContext);
  if (context === undefined) {
    throw new Error("useManagerContext must be used within a ManagerProvider");
  }
  return context;
}

interface ManagerProviderProps {
  children: ReactNode;
}

export function ManagerProvider({ children }: ManagerProviderProps) {
  const [currentView, setCurrentView] = useState<ManagerView>("My Team");

  return (
    <ManagerContext.Provider value={{ currentView, setCurrentView }}>
      {children}
    </ManagerContext.Provider>
  );
}
