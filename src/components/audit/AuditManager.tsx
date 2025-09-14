"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

import NeonPanel from "@/components/NeonPanel";
import FolderTabs from "@/components/FolderTabs";
import MainHeader from "@/components/ui/MainHeader";

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
  const router = useRouter();
  const params = useSearchParams();

  // Read tab from URL (?tab=assign etc.)
  const tabFromUrl = (params?.get("tab") as TabKey) || "create";
  const [activeTab, setActiveTab] = useState<TabKey>(tabFromUrl);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch counts in-line (inside main component)
  const [assignments, setAssignments] = useState<number | null>(null);
  const [incomplete, setIncomplete] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<number | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      setStatsError(null);
      try {
        const { count: uaAll } = await supabase
          .from("user_assignments")
          .select("id", { count: "exact", head: true })
          .eq("item_type", "audit");
        const { count: uaOpen } = await supabase
          .from("user_assignments")
          .select("id", { count: "exact", head: true })
          .eq("item_type", "audit")
          .is("completed_at", null);
        setAssignments(uaAll ?? 0);
        setIncomplete(uaOpen ?? 0);
      } catch (e: unknown) {
        setAssignments(null);
        setIncomplete(null);
        setStatsError(
          e instanceof Error ? e.message : "Failed to read assignments",
        );
      }
      try {
        const { count: subs } = await supabase
          .from("audit_submissions")
          .select("id", { count: "exact", head: true });
        setSubmissions(subs ?? 0);
      } catch {
        setSubmissions(null);
      }
    };
    fetchCounts();
  }, []);

  // Keep URL in sync when tab changes
  const handleTabChange = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      const qs = new URLSearchParams(Array.from((params ?? new URLSearchParams()).entries()));
      qs.set("tab", tab);
      router.replace(`?${qs.toString()}`);
    },
    [params, router],
  );

  const bumpRefresh = useCallback(() => setRefreshKey((n) => n + 1), []);

  const tabs = useMemo(
    () =>
      [
        {
          key: "create",
          label: "Create New Audit",
          icon: <FiPlus className="folder-tab-icon" />,
        },
        {
          key: "view",
          label: "View Audits",
          icon: <FiClipboard className="folder-tab-icon" />,
        },
        {
          key: "assign",
          label: "Assign Audit",
          icon: <FiSend className="folder-tab-icon" />,
        },
        {
          key: "submissions",
          label: "Submissions",
          icon: <FiFileText className="folder-tab-icon" />,
        },
        {
          key: "questions",
          label: "Edit Questions",
          icon: <FiHelpCircle className="folder-tab-icon" />,
        },
        {
          key: "assigned",
          label: "Assigned To",
          icon: <FiClipboard className="folder-tab-icon" />,
        },
        {
          key: "auditors",
          label: "Auditors",
          icon: <FiShield className="folder-tab-icon" />,
        },
       
        {
          key: "standards",
          label: "Standards",
          icon: <FiFileText className="folder-tab-icon" />,
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
        <div className="audit-manager-inner">
          <MainHeader
            title="Audit Manager"
            subtitle="Create, assign, and review audits and submissions"
          />
          <FolderTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabKey) => handleTabChange(tabKey as TabKey)}
          />

          {/* Stats bar in-line, with custom backgrounds and spacing */}
          <div className="flex gap-3 mb-3">
            <NeonPanel className="bg-orange-100">
              <div className="flex items-center justify-between py-2 px-3">
                <span className="opacity-70 mr-4">Audit assignments</span>
                <strong className="text-lg">{assignments ?? "—"}</strong>
              </div>
            </NeonPanel>
            <NeonPanel className="bg-blue-100">
              <div className="flex items-center justify-between py-2 px-3">
                <span className="opacity-70 mr-4">Incomplete</span>
                <strong className="text-lg">{incomplete ?? "—"}</strong>
              </div>
            </NeonPanel>
            <NeonPanel className="bg-green-100">
              <div className="flex items-center justify-between py-2 px-3">
                <span className="opacity-70 mr-4">Submissions</span>
                <strong className="text-lg">{submissions ?? "—"}</strong>
              </div>
            </NeonPanel>
            {statsError && (
              <div className="text-xs text-red-400 self-center">
                Stats error: {statsError}
              </div>
            )}
          </div>

          {/* Render selected tab */}
          <div key={activeTab}>
            {activeTab === "create" && <CreateAuditTab />}
            {activeTab === "view" && <ViewAuditTab />}
            {activeTab === "assign" && <AssignAuditTab />}
            {activeTab === "submissions" && <SubmissionsTab />}
            {activeTab === "questions" && <QuestionTab />}
            {activeTab === "assigned" && <AssignedToTab />}
            {activeTab === "auditors" && <AuditorsListWidget />}
            {activeTab === "standards" && <StandardsTab />}
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
