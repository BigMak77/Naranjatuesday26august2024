"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { FiMail, FiSettings } from "react-icons/fi";
import TextIconButton from "@/components/ui/TextIconButtons";

type AdminSection = "Dashboard" | "Users" | "Modules" | "Departments" | "Utilities";

export default function AdminToolbar() {
  const router = useRouter();
  const { user } = useUser();
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
      section: "Users",
      label: "User Management",
      path: "/admin/users",
      description: "Manage system users"
    },
    {
      section: "Modules",
      label: "Training Modules",
      path: "/admin/modules",
      description: "Manage training content"
    },
    {
      section: "Departments",
      label: "Departments",
      path: "/admin/departments",
      description: "Manage organizational structure"
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

  return (
    <section className="section-toolbar">
      <div className="toolbar-buttons">
        {/* Admin Sections Dropdown */}
        <div ref={dropdownRef} className="toolbar-dropdown">
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

        {/* System Settings Button */}
        <TextIconButton
          icon={<FiSettings />}
          variant="edit"
          label="System Settings"
          onClick={() => router.push('/admin/settings')}
        />

        {/* Contact Support Button */}
        <TextIconButton
          icon={<FiMail />}
          variant="send"
          label="Contact Support"
          onClick={handleContactAdmin}
        />
      </div>

      <span className="toolbar-user-info">
        {user?.first_name ? `${user.first_name}, Access level: Admin` : "Admin Toolbar"}
      </span>
    </section>
  );
}
