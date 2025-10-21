"use client";

import React, { useState, useRef, useEffect } from "react";
import { useManagerContext } from "@/context/ManagerContext";
import { FiMail, FiHome } from "react-icons/fi";

type ManagerView = "My Team" | "My Team Training" | "My Team Tasks" | "My Team Issues" | "My Team Audits" | "My Team Compliance" | "User Dashboard";

interface ManagerToolbarProps {
  className?: string;
}

export default function ManagerToolbar({
  className = "",
}: ManagerToolbarProps) {
  const { currentView, setCurrentView } = useManagerContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const managerViews: ManagerView[] = [
    "My Team",
    "My Team Training",
    "My Team Tasks",
    "My Team Issues",
    "My Team Audits",
    "My Team Compliance"
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleViewSelect = (view: ManagerView) => {
    setCurrentView(view);
    setIsOpen(false);
    console.log('Manager view changed to:', view);
  };

  const handleContactAdmin = () => {
    console.log('Contact Admin clicked');
    // TODO: Implement contact admin functionality
    // This could open a modal, redirect to a contact form, or send an email
    alert('Contact Admin feature - Coming soon!');
  };

  const handleUserDashboard = () => {
    console.log('User Dashboard clicked');
    setCurrentView("User Dashboard");
  };

  return (
    <section className={`section-toolbar ${className}`.trim()}>
      <span>Manager Toolbar</span>
      
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Localized Manager View Dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            className="neon-btn neon-btn-list"
            onClick={handleToggle}
            aria-label="Select manager view"
            aria-expanded={isOpen}
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>

          {isOpen && (
            <div className="list-button-dropdown">
              <div className="list-button-dropdown-header">Manager View</div>
              <ul className="list-button-dropdown-list">
                {managerViews.map((view) => (
                  <li key={view}>
                    <button
                      className={`list-button-dropdown-item ${currentView === view ? "active" : ""}`}
                      onClick={() => handleViewSelect(view)}
                      type="button"
                    >
                      {view}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* User Dashboard Button */}
        <button
          className="neon-btn neon-btn-icon"
          onClick={handleUserDashboard}
          aria-label="User Dashboard"
          title="User Dashboard"
          type="button"
        >
          <FiHome size={18} />
        </button>

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
