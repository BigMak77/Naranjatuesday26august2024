"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewIncidentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/health-safety?tab=incidents");
  }, [router]);

  return null;
}
