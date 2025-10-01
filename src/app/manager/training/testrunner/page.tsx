"use client";
import TestRunner from "@/components/training/TestRunner";
import { useUser } from "@/lib/useUser";

export default function Page() {
  const { user } = useUser();
  if (!user) return <div>Please sign in to access the test runner.</div>;
  // Use the user's id directly in simple mode
  return <TestRunner rpcMode="simple" testingUserId={user.id} />;
}
