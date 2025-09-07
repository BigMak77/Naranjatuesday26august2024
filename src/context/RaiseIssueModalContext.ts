import { createContext } from "react";

export const RaiseIssueModalContext = createContext<{
  openRaiseIssue: () => void;
} | null>(null);
