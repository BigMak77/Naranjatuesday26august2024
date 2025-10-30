"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiUsers } from "react-icons/fi";

type HRSection = "Dashboard" | "Employees" | "Compliance" | "Reports";

export default function HRAdminToolbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<HRSection>("Dashboard");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hrSections: Array<{
    section: HRSection;
    label: string;
    path: string;
    description: string;
  }> = [
    {
      section: "Dashboard",
      label: "HR Dashboard",
      path: "/hr/dashboard",
      description: "HR overview and analytics"
    },
    {
      section: "Employees",
      label: "Employee Management",
      path: "/hr/employees",
      description: "Manage employee records (all departments)"
    },
    {
      section: "Compliance",
      label: "Compliance",
      path: "/hr/compliance",
      description: "Organization-wide compliance tracking"
    },
    {
      section: "Reports",
      label: "Reports",
      path: "/hr/reports",
      description: "Generate HR reports across all departments"
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

  const handleSectionSelect = (section: HRSection, path: string) => {
    setSelectedSection(section);
    setIsOpen(false);
    router.push(path);
    console.log(`HR Admin navigating to: ${path}`);
  };

  const handleContactAdmin = () => {
    console.log('Contact Admin clicked');
    alert('Contact Admin feature - Coming soon!');
  };

  return (
    <section className="section-toolbar">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* HR Sections Dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            className="neon-btn neon-btn-list"
            onClick={handleToggle}
            aria-label="Select HR section"
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
              <div className="list-button-dropdown-header">
                HR Sections
                <div style={{ fontSize: "0.8em", opacity: 0.7 }}>
                  Access: All Departments
                </div>
              </div>
              <ul className="list-button-dropdown-list">
                {hrSections.map(({ section, label, path, description }) => (
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

        {/* Employee Management Button */}
        <button
          className="neon-btn neon-btn-icon"
          onClick={() => router.push('/hr/employees')}
          aria-label="Employee Management"
          title="Manage All Employees"
          type="button"
        >
          <FiUsers size={18} />
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

      <span>HR Admin Toolbar (All Departments)</span>
    </section>
  );
}
