// app/manager/layout.tsx
import type { ReactNode } from "react";
import ManagerLayoutWrapper from "@/components/manager/ManagerLayoutWrapper";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <ManagerLayoutWrapper>{children}</ManagerLayoutWrapper>
  );
}
