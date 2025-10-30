"use client";

import React from "react";
import { useUser } from "@/lib/useUser";
import UserTrainingDashboard from "@/components/training/UserTrainingDashboard";
import UserTrainingRequest from "@/components/user/UserTrainingRequest";
import MyTasks from "@/components/tasks/MyTasks";
import MyIssues from "@/components/issues/MyIssues";

export default function UserView() {
  const { user, profile } = useUser() as {
    user?: { id?: string } | null; // Supabase Auth user (auth.uid)
    profile?: { id?: string; auth_id?: string } | null; // Your app users row
  };

  const authId = user?.id ?? profile?.auth_id ?? null;
  const appUserId = profile?.id ?? authId;

  if (!authId) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-white)', opacity: 0.7, padding: '2rem' }}>
        Loading your profile…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <MyIssues />
      <MyTasks />
      <UserTrainingDashboard authId={authId} />
      <UserTrainingRequest userId={appUserId!} />
    </div>
  );
}
