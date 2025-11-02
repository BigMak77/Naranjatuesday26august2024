import { ReactNode } from "react";
import "./login.css";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="login-layout">
      <div className="login-bg-wrapper">
        <div className="login-bg-image" aria-hidden="true" />
        <div className="login-bg-overlay" aria-hidden="true" />
      </div>
      {children}
    </div>
  );
}
