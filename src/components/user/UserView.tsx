'use client';

import React from 'react';
import { useUser } from '@/lib/useUser';
import UserProfileCardSection from '@/components/UserProfileCardSection';
import UserTrainingDashboard from '@/components/training/UserTrainingDashboard';
import UserTrainingRequest from '@/components/user/UserTrainingRequest';

export default function UserView() {
  const { user, profile } = useUser() as {
    user?: { id?: string } | null;            // Supabase Auth user (auth.uid)
    profile?: { id?: string; auth_id?: string } | null; // Your app users row
  };

  const authId = user?.id ?? profile?.auth_id ?? null;
  const appUserId = profile?.id ?? authId;

  if (!authId) {
    return <div className="p-4 text-sm opacity-70">Loading your profile…</div>;
  }

  return (
    <div className="user-view global-content">
      <UserProfileCardSection />
      <UserTrainingDashboard authId={authId} />
      <UserTrainingRequest userId={appUserId!} />
    </div>
  );
}
