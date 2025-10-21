"use client";

import React, { ReactNode } from "react";
import { ManagerProvider } from "@/context/ManagerContext";
import ManagerToolbar from "@/components/ui/ManagerToolbar";

interface ManagerLayoutWrapperProps {
  children: ReactNode;
}

export default function ManagerLayoutWrapper({ children }: ManagerLayoutWrapperProps) {
  return (
    <ManagerProvider>
      <ManagerToolbar />
      <main className="content">{children}</main>
    </ManagerProvider>
  );
}
