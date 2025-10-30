"use client";
import { useState } from "react";
import MyProfileModal from "@/components/user/MyProfileModal";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function ProfilePage() {
  const [open, setOpen] = useState(true);
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "HR Admin", "H&S Admin", "Dept. Manager", "Manager", "Trainer", "User"]}
      redirectOnNoAccess={true}
      noAccessMessage="You must be logged in to view your profile. Redirecting to login..."
    >
      <MyProfileModal open={open} onClose={() => setOpen(false)} />
    </AccessControlWrapper>
  );
}
