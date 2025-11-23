"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { FiMail, FiAlertTriangle } from "react-icons/fi";
import TextIconButton from "@/components/ui/TextIconButtons";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

type HSSection = "Dashboard" | "Incidents" | "Risk Assessments" | "First Aiders" | "Compliance";

export default function HSAdminToolbar() {
  const router = useRouter();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<HSSection>("Dashboard");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hsSections: Array<{
    section: HSSection;
    label: string;
    path: string;
    description: string;
  }> = [
    {
      section: "Dashboard",
      label: "H&S Dashboard",
      path: "/health-safety",
      description: "Health & Safety overview"
    },
    {
      section: "Incidents",
      label: "Incident Management",
      path: "/health-safety/incidents",
      description: "View and manage all incidents (all departments)"
    },
    {
      section: "Risk Assessments",
      label: "Risk Assessments",
      path: "/health-safety/risk-assessments",
      description: "Manage organization-wide risk assessments"
    },
    {
      section: "First Aiders",
      label: "First Aiders",
      path: "/health-safety/first-aiders",
      description: "Manage first aider registry"
    },
    {
      section: "Compliance",
      label: "H&S Compliance",
      path: "/health-safety/compliance",
      description: "Track health & safety compliance"
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

  const handleSectionSelect = (section: HSSection, path: string) => {
    setSelectedSection(section);
    setIsOpen(false);
    router.push(path);
    console.log(`H&S Admin navigating to: ${path}`);
  };

  const handleContactAdmin = () => {
    console.log('Contact Admin clicked');
    alert('Contact Admin feature - Coming soon!');
  };

  return (
    <section className="section-toolbar">
      <div className="toolbar-buttons">
        {/* H&S Sections Dropdown */}
        <div ref={dropdownRef} className="toolbar-dropdown">
          <CustomTooltip text="Toolbar Menu" placement="bottom">
            <button
              className="neon-btn neon-btn-list"
              onClick={handleToggle}
              aria-label="Select H&S section"
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
          </CustomTooltip>

          {isOpen && (
            <div className="list-button-dropdown">
              <div className="list-button-dropdown-header">
                H&S Sections
                <div className="list-button-dropdown-subtext">
                  Access: All Departments
                </div>
              </div>
              <ul className="list-button-dropdown-list">
                {hsSections.map(({ section, label, path, description }) => (
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

        {/* Incidents Button */}
        <CustomTooltip text="View All Incidents" placement="bottom">
          <TextIconButton
            icon={<FiAlertTriangle />}
            variant="alert"
            label="Incidents"
            onClick={() => router.push('/health-safety/incidents')}
          />
        </CustomTooltip>

        {/* Contact Admin Button */}
        <CustomTooltip text="Contact Admin" placement="bottom">
          <TextIconButton
            icon={<FiMail />}
            variant="send"
            label="Contact Admin"
            onClick={handleContactAdmin}
          />
        </CustomTooltip>
      </div>

      <span className="toolbar-user-info">
        {user?.first_name ? `${user.first_name}, Access level: H&S Admin` : "H&S Admin Toolbar"}
      </span>
    </section>
  );
}
