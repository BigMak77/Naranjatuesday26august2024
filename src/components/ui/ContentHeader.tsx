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
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
        <h1 className="content-header-title">{title}</h1>
        {description && (
          <>
            <span style={{ fontSize: "1.5rem", fontWeight: "normal" }}>-</span>
            <p className="content-header-desc" style={{ margin: 0, fontStyle: "italic" }}>{description}</p>
          </>
        )}
      </div>
      {/* Orange separator line underneath the description */}
      <div style={{
        width: "100%",
        height: "3px",
        background: "#fa7a20",
        marginTop: "10px",
        marginBottom: "10px"
      }}></div>
      {children}
    </div>
  </div>
);

export default ContentHeader;
