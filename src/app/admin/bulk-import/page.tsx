"use client";

import React from "react";
import ContentHeader from "@/components/ui/ContentHeader";

export default function BulkImportPage() {
  return (
    <>
      <ContentHeader
        title="Bulk Import"
        description="Import multiple records at once"
      />
      <div className="after-hero">
        <div className="global-content">
          <main className="global-content">
            <p style={{ color: "var(--text)" }}>
              Bulk import functionality - Coming soon.
            </p>
          </main>
        </div>
      </div>
    </>
  );
}
