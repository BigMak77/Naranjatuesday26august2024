"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
} from "react";
import { useSearchParams } from "next/navigation";
import { useRouterSafe } from "@/lib/useRouterSafe";
import { supabase } from "@/lib/supabase-client";

import NeonPanel from "@/components/NeonPanel";
import FolderTabs from "@/components/FolderTabs";
import ContentHeader from "@/components/ui/ContentHeader";

import {
  FiPlus,
  FiClipboard,
  FiSend,
  FiFileText,
  FiHelpCircle,
  FiShield,
} from "react-icons/fi";

import QuestionTab from "@/components/audit/QuestionTab";
import ViewAuditTab from "@/components/audit/ViewAuditTab";
import SubmissionsTab from "@/components/audit/SubmissionsTab";
import CreateAuditTab from "@/components/audit/CreateAuditTab";
import AssignAuditTab from "@/components/audit/AssignAuditTab";
import AssignedToTab from "@/components/audit/AssignedToTab";
import AuditorsListWidget from "@/components/audit/AuditorsListWidget";
import StandardsTab from "@/components/audit/StandardsTab";
import AddAuditorWidget from "@/components/audit/AddAuditorWidget";

/* =========================================================
   Shared context (optional for your child tabs to use)
   ========================================================= */
type TabKey =
  | "create"
  | "view"
  | "assign"
  | "submissions"
  | "questions"
  | "assigned"
  | "auditors"
  | "sections"
  | "standards";

type AuditManagerCtx = {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
  refreshKey: number;
  bumpRefresh: () => void;
};

const Ctx = createContext<AuditManagerCtx | null>(null);
export const useAuditManager = () => {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useAuditManager must be used inside <AuditManager/>");
  return ctx;
};

/* =========================================================
   Main component
   ========================================================= */
export default function AuditManager() {
  const router = useRouterSafe();
  const params = useSearchParams();

  // Read tab from URL (?tab=assign etc.)
  const tabFromUrl = (params?.get("tab") as TabKey) || "create";
  const [activeTab, setActiveTab] = useState<TabKey>(tabFromUrl);
  const [refreshKey, setRefreshKey] = useState(0);

  // Remove stats state and effect

  // Keep URL in sync when tab changes
  const handleTabChange = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      const qs = new URLSearchParams(Array.from((params ?? new URLSearchParams()).entries()));
      qs.set("tab", tab);
      // Use safe router with debounce to prevent excessive replaceState calls
      router.replace(`?${qs.toString()}`, 300);
    },
    [params, router], // Keep router in deps but use safe router
  );

  const bumpRefresh = useCallback(() => setRefreshKey((n) => n + 1), []);

  const tabs = useMemo(
    () =>
      [
        {
          key: "create",
          label: "Create New Audit",
          icon: <FiPlus />,
        },
        {
          key: "view",
          label: "View Audits",
          icon: <FiClipboard />,
        },
        {
          key: "assign",
          label: "Assign Audit",
          icon: <FiSend />,
        },
        {
          key: "submissions",
          label: "Submissions",
          icon: <FiFileText />,
        },
        {
          key: "questions",
          label: "Edit Questions",
          icon: <FiHelpCircle />,
        },
        {
          key: "assigned",
          label: "Assigned To",
          icon: <FiClipboard />,
        },
        {
          key: "auditors",
          label: "Auditors",
          icon: <FiShield />,
        },

        {
          key: "standards",
          label: "Standards",
          icon: <FiFileText />,
        },
      ] satisfies { key: TabKey; label: string; icon: React.ReactNode }[],
    [],
  );

  return (
    <Ctx.Provider
      value={{
        activeTab,
        setActiveTab: handleTabChange,
        refreshKey,
        bumpRefresh,
      }}
    >
      <div className="audit-manager-content">
        <ContentHeader
          title="Audit Management"
          description="Create, assign, and manage audits and quality standards"
        />
        <div className="audit-manager-inner">
          <FolderTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabKey) => handleTabChange(tabKey as TabKey)}
          />
          {/* Removed stats bar here */}
          <div key={activeTab}>
            {activeTab === "create" && <CreateAuditTab />}
            {activeTab === "view" && <ViewAuditTab />}
            {activeTab === "assign" && <AssignAuditTab />}
            {activeTab === "submissions" && <SubmissionsTab />}
            {activeTab === "questions" && <QuestionTab />}
            {activeTab === "assigned" && <AssignedToTab />}
            {activeTab === "auditors" && (
              <>
                <AddAuditorWidget onAdded={bumpRefresh} />
                <AuditorsListWidget />
              </>
            )}
            {activeTab === "standards" && <StandardsTab />}
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
