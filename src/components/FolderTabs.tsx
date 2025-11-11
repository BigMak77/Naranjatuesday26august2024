import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

export type Tab = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  tooltip?: string;
};

interface FolderTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabKey: string) => void;
  toolbar: React.ReactNode;
}

export default function FolderTabs({
  tabs,
  activeTab,
  onChange,
  toolbar,
}: FolderTabsProps) {
  return (
    <>
      <div className="folder-tabs">
        {tabs.map((tab) => {
          const tabContent = (
            <div
              key={tab.key}
              className={`folder-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => onChange(tab.key)}
              tabIndex={0}
              role="button"
              aria-pressed={activeTab === tab.key}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onChange(tab.key);
                }
              }}
            >
              {tab.icon && (
                <span
                  className="folder-tab-icon neon-icon-white"
                  aria-hidden="true"
                >
                  {tab.icon}
                </span>
              )}
              <span className="folder-tab-label">{tab.label}</span>
            </div>
          );

          return tab.tooltip ? (
            <CustomTooltip key={tab.key} text={tab.tooltip}>
              {tabContent}
            </CustomTooltip>
          ) : (
            tabContent
          );
        })}
      </div>

      {/* Toolbar renders directly underneath tabs */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.75rem',
        background: 'var(--panel)',
        border: '1px solid #fa7a20',
        borderRadius: '0 0 8px 8px',
        marginTop: '0',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        {toolbar}
      </div>
    </>
  );
}

type Category = {
  id: string;
  name: string;
  // Add other fields if needed
};

export function FolderTabView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: cats } = await supabase
        .from("document_categories")
        .select("*");

      setCategories(cats || []);
      if (cats && cats.length > 0) setActiveTab(cats[0].id);
    };

    fetchData();
  }, []);

  return (
    <div className="folder-container">
      <FolderTabs
        tabs={categories.map((cat) => ({ key: cat.id, label: cat.name }))}
        activeTab={activeTab || ""}
        onChange={setActiveTab}
        toolbar={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Add toolbar content here */}
            <span style={{ opacity: 0.7, fontSize: '0.875rem' }}>
              {categories.length} categories
            </span>
          </div>
        }
      />

      <div className="folder-content">
        {activeTab && (
          <div className="text-neon">
            {/* Content for the active tab can be placed here */}
            Active Tab ID: {activeTab}
          </div>
        )}
      </div>
    </div>
  );
}
