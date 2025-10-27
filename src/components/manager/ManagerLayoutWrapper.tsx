"use client";

import React, { ReactNode } from "react";
import { ManagerProvider } from "@/context/ManagerContext";

interface ManagerLayoutWrapperProps {
  children: ReactNode;
}

/**
 * ManagerLayoutWrapper - Provides ManagerContext for manager pages
 *
 * Note: Does NOT render toolbar or content wrapper.
 * - Toolbar is rendered by DynamicToolbar in AppWrapper (correct position below header)
 * - Content wrapper is rendered by AppWrapper
 * - This only provides the ManagerProvider context so toolbar and pages share state
 */
export default function ManagerLayoutWrapper({ children }: ManagerLayoutWrapperProps) {
  return (
    <ManagerProvider>
      {children}
    </ManagerProvider>
  );
}
