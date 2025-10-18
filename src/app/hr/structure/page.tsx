"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainHeader from '@/components/ui/MainHeader';

export default function StructurePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hr/structure/role-structure');
  }, [router]);

  return (
    <div className="after-hero global-content relative">
      <div className="flex-1 min-w-0">
        <MainHeader
          title="Structure Management"
          subtitle="Redirecting to role structure page..."
        />
        <div className="neon-panel">
          <p className="text-center py-8 text-neon">
            Redirecting to structure page...
          </p>
        </div>
      </div>
    </div>
  );
}
