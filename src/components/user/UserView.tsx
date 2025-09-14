"use client";

import React from "react";
import { useUser } from "@/lib/useUser";
import UserTrainingDashboard from "@/components/training/UserTrainingDashboard";
import UserTrainingRequest from "@/components/user/UserTrainingRequest";
import MyTasks from "@/components/tasks/MyTasks";
import MyIssues from "@/components/issues/MyIssues";
import IssuesWidget from "@/components/issues/IssuesWidget";
import MainHeader from "@/components/ui/MainHeader";

export default function UserView() {
  const { user, profile } = useUser() as {
    user?: { id?: string } | null; // Supabase Auth user (auth.uid)
    profile?: { id?: string; auth_id?: string } | null; // Your app users row
  };

  const authId = user?.id ?? profile?.auth_id ?? null;
  const appUserId = profile?.id ?? authId;

  if (!authId) {
    return <div className="p-4 text-sm opacity-70">Loading your profile…</div>;
  }

  return (
    <div className="user-view global-content">
      <MainHeader 
        title="User Dashboard" 
        subtitle="View and manage your assigned tasks, department issues, and training progress all in one place."
      />
      <MyIssues />
      <hr className="issues-widget-separator" />
      <IssuesWidget />
      <hr className="issues-widget-separator" />
      <MyTasks />
      <hr className="issues-widget-separator" />
      <UserTrainingDashboard authId={authId} />
      <hr className="issues-widget-separator" />
      <UserTrainingRequest userId={appUserId!} />
    </div>
  );
}
