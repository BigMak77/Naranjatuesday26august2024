"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FirstAidPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/health-safety?tab=firstaid");
  }, [router]);

  return null;
}
