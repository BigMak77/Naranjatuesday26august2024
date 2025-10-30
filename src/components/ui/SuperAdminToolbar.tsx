"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiShield, FiHeart } from "react-icons/fi";

type AdminSection = "Dashboard" | "Roles" | "HR" | "Compliance" | "Reports" | "Utilities" | "Trainer";

export default function SuperAdminToolbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<AdminSection>("Dashboard");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const adminSections: Array<{
    section: AdminSection;
    label: string;
    path: string;
    description: string;
  }> = [
    {
      section: "Dashboard",
      label: "Dashboard",
      path: "/admin/dashboard",
      description: "System overview and analytics"
    },
    {
      section: "Roles",
      label: "Roles",
      path: "/admin/roles",
      description: "Manage user roles and permissions"
    },
    {
      section: "HR",
      label: "HR Dashboard",
      path: "/hr/dashboard",
      description: "HR management and operations"
    },
    {
      section: "Trainer",
      label: "Trainer Dashboard",
      path: "/trainer/dashboard",
      description: "Training management and tracking"
    },
    {
      section: "Compliance",
      label: "Compliance",
      path: "/admin/incomplete",
      description: "Compliance tracking and reports"
    },
    {
      section: "Reports",
      label: "Reports",
      path: "/admin/reports",
      description: "System reports and analytics"
    },
    {
      section: "Utilities",
      label: "Utilities",
      path: "/admin/utility",
      description: "Admin tools and utilities"
    }
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

  const handleSectionSelect = (section: AdminSection, path: string) => {
    setSelectedSection(section);
    setIsOpen(false);
    router.push(path);
    console.log(`Navigating to: ${path}`);
  };

  const handleContactAdmin = () => {
    console.log('Contact Support clicked');
    alert('Contact Support feature - Coming soon!');
  };

  const handleTurkusClick = () => {
    router.push('/turkus');
    console.log('Navigating to Turkus');
  };

  const handleHealthSafetyClick = () => {
    router.push('/health-safety');
    console.log('Navigating to Health & Safety');
  };

  return (
    <section className="section-toolbar">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Admin Sections Dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            className="neon-btn neon-btn-list"
            onClick={handleToggle}
            aria-label="Select admin section"
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
              <div className="list-button-dropdown-header">Admin Sections</div>
              <ul className="list-button-dropdown-list">
                {adminSections.map(({ section, label, path, description }) => (
                  <li key={section}>
                    <button
                      className={`list-button-dropdown-item ${selectedSection === section ? "active" : ""}`}
                      onClick={() => handleSectionSelect(section, path)}
                      type="button"
                      title={description}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Health & Safety Button */}
        <button
          className="neon-btn neon-btn-icon"
          onClick={handleHealthSafetyClick}
          aria-label="Health & Safety"
          title="Health & Safety"
          type="button"
        >
          <FiHeart size={18} />
        </button>

        {/* Turkus Button */}
        <button
          className="neon-btn neon-btn-icon"
          onClick={handleTurkusClick}
          aria-label="Turkus Issues"
          title="Turkus Issues"
          type="button"
        >
          <FiShield size={18} />
        </button>

        {/* Contact Support Button */}
        <button
          className="neon-btn neon-btn-icon"
          onClick={handleContactAdmin}
          aria-label="Contact Support"
          title="Contact Support"
          type="button"
        >
          <FiMail size={18} />
        </button>
      </div>

      <span>Super Admin Toolbar</span>
    </section>
  );
}
