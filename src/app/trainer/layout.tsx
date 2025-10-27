// app/trainer/layout.tsx
import type { ReactNode } from "react";

export default function TrainerLayout({ children }: { children: ReactNode }) {
  // AppWrapper in the root layout already handles ProjectGlobalHeader, DynamicToolbar, and footer
  // This layout just passes through the children
  return <>{children}</>;
}
