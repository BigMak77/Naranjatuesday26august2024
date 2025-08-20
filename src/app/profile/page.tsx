"use client";
import { useState } from "react";
import MyProfileModal from "@/components/user/MyProfileModal";

export default function ProfilePage() {
  const [open, setOpen] = useState(true);
  return <MyProfileModal open={open} onClose={() => setOpen(false)} />;
}
