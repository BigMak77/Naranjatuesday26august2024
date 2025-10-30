"use client";

import React, { ReactNode } from "react";

interface ManagerLayoutWrapperProps {
  children: ReactNode;
}

/**
 * ManagerLayoutWrapper - Layout wrapper for manager pages
 *
 * Note: ManagerProvider is now provided globally in AppWrapper
 * This wrapper is kept for potential future manager-specific layout logic
 */
export default function ManagerLayoutWrapper({ children }: ManagerLayoutWrapperProps) {
  return <>{children}</>;
}
