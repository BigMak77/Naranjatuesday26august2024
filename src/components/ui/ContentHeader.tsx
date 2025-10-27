import React from "react";

interface ContentHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const ContentHeader: React.FC<ContentHeaderProps> = ({
  title,
  description,
  children,
}) => (
  <div className="global-content-header content-header-fullwidth">
    <div className="content-header-inner">
      <h1 className="content-header-title">{title}</h1>
      {description && <p className="content-header-desc">{description}</p>}
      {/* Orange separator line underneath the description */}
      <div style={{ 
        width: "100%", 
        height: "3px", 
        background: "#ff8c00",
        marginTop: "10px",
        marginBottom: "10px"
      }}></div>
      {children}
    </div>
  </div>
);

export default ContentHeader;
