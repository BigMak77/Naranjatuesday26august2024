"use client";
import UserProfileCard from "@/components/user/UserProfileCard";
import { useUser } from "@/lib/useUser";

export default function UserProfileCardSection() {
  const { user } = useUser();
  if (!user?.auth_id) return null;
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        margin: ".5 rem 0",
      }}
    >
      <UserProfileCard authId={user.auth_id} />
    </div>
  );
}
