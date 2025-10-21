"use client";
import React from "react";
import { FiMail } from "react-icons/fi";
import NeonIconButton from "@/components/ui/NeonIconButton";

export default function UserToolbar() {
  const handleContactAdmin = () => {
    console.log('Contact Admin clicked');
    // TODO: Implement contact admin functionality
    alert('Contact Admin feature - Coming soon!');
  };

  return (
    <section className="section-toolbar">
      <span>User Toolbar</span>
      
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Contact Admin Button */}
        <NeonIconButton
          icon={<FiMail />}
          variant="send"
          title="Contact Admin"
          onClick={handleContactAdmin}
        />
      </div>
    </section>
  );
}
