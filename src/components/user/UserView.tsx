import React from "react";
import { useUser } from "@/lib/useUser";
import UserProfileCardSection from "@/components/UserProfileCardSection";
import UserTrainingDashboard from "@/components/training/UserTrainingDashboard";
import UserTrainingRequest from "@/components/user/UserTrainingRequest";

const UserView: React.FC = () => {
  const { user } = useUser();
  if (!user || !user.id) return null;
  return (
    <div className="user-view global-content">
      <UserProfileCardSection />
      <UserTrainingDashboard authId={user.id} />
      <UserTrainingRequest userId={user.id} />
    </div>
  );
};

export default UserView;
