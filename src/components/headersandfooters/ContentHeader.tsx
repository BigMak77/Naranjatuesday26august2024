import React from "react";

interface ContentHeaderProps {
  children?: React.ReactNode;
}

const ContentHeader: React.FC<ContentHeaderProps> = ({ children }) => (
  <div className="hero-header global-content-header">
    {children}
  </div>
);

export default ContentHeader;
