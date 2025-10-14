"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StructurePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hr/structure/role-structure');
  }, [router]);

  return (
    <div className="neon-panel">
      <p>Redirecting to structure page...</p>
    </div>
  );
}
