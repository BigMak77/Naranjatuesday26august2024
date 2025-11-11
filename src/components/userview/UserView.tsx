"use client";

import React from "react";
import { useUser } from "@/lib/useUser";
import UserTrainingDashboard from "@/components/training/UserTrainingDashboard";
import UserTrainingRequest from "@/components/user/UserTrainingRequest";
import MyTasks from "@/components/tasks/MyTasks";
import MyIssues from "@/components/issues/MyIssues";
import { CalendarWidget } from "@/components/calendar";

export default function UserView() {
  const { user, profile } = useUser() as {
    user?: { id?: string } | null; // Supabase Auth user (auth.uid)
    profile?: { id?: string; auth_id?: string } | null; // Your app users row
  };

  const authId = user?.id ?? profile?.auth_id ?? null;
  const appUserId = profile?.id ?? authId;

  if (!authId) {
    return (
      <div className="text-center opacity-75 p-8">
        Loading your profile…
      </div>
    );
  }

  return (
    <div className="flex-col gap-8">
      {/* Top row with calendar and issues */}
      <div className="grid gap-8 items-start" style={{ gridTemplateColumns: '1fr auto' }}>
        <div className="flex-col gap-8">
          <MyIssues />
          <MyTasks />
        </div>
        <CalendarWidget title="My Assignments" />
      </div>
      
      {/* Training sections */}
      <UserTrainingDashboard authId={authId} />
      <UserTrainingRequest userId={appUserId!} />
    </div>
  );
}
