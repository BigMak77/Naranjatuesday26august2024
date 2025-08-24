import React from "react";

interface ContentHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const ContentHeader: React.FC<ContentHeaderProps> = ({ title, description, children }) => (
  <div className="global-content-header content-header-fullwidth">
    <div className="content-header-inner">
      <h1 className="content-header-title">{title}</h1>
      {description && <p className="content-header-desc">{description}</p>}
      {children}
    </div>
  </div>
);

export default ContentHeader;
