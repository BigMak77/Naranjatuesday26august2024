"use client";
import React from "react";
import ListButton from "./ListButton";

export default function AdminToolbar() {
  const handleViewChange = (view: string) => {
    console.log('User view changed to:', view);
    // Add logic here to handle view changes (e.g., update context, state, etc.)
  };

  return (
    <section className="section-toolbar">
      <span>Admin Toolbar</span>
      <ListButton 
        onViewChange={handleViewChange} 
        aria-label="Select user view"
      />
    </section>
  );
}
