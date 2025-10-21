"use client";
import React from "react";
import ListButton from "./ListButton";
import { FiMail } from "react-icons/fi";

export default function AdminToolbar() {
  const handleViewChange = (view: string) => {
    console.log('User view changed to:', view);
    // Add logic here to handle view changes (e.g., update context, state, etc.)
  };

  const handleContactAdmin = () => {
    console.log('Contact Admin clicked');
    // TODO: Implement contact admin functionality
    alert('Contact Admin feature - Coming soon!');
  };

  return (
    <section className="section-toolbar">
      <span>Admin Toolbar</span>
      
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <ListButton 
          onViewChange={handleViewChange} 
          aria-label="Select user view"
        />
        
        {/* Contact Admin Button */}
        <button
          className="neon-btn neon-btn-icon"
          onClick={handleContactAdmin}
          aria-label="Contact Admin"
          title="Contact Admin"
          type="button"
        >
          <FiMail size={18} />
        </button>
      </div>
    </section>
  );
}
