import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

export type Tab = {
  key: string;
  label: string;
  icon?: React.ReactNode;
};

interface FolderTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabKey: string) => void;
}

export default function FolderTabs({
  tabs,
  activeTab,
  onChange,
}: FolderTabsProps) {
  return (
    <div className="folder-tabs">
      {tabs.map((tab) => (
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
      ))}
    </div>
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
