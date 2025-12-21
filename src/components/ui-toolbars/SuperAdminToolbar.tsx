"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { FiMail } from "react-icons/fi";
import TextIconButton from "@/components/ui/TextIconButtons";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

type AdminSection = "Dashboard" | "HR" | "Compliance" | "Reports" | "Utilities" | "Trainer" | "Tasks" | "Issues" | "Audits" | "Modules" | "Documents" | "HealthSafety";

export default function SuperAdminToolbar() {
  const router = useRouter();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<AdminSection>("Dashboard");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalDropdownRef = useRef<HTMLDivElement>(null);

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
      section: "Modules",
      label: "Training Modules",
      path: "/admin/modules",
      description: "Manage training content"
    },
    {
      section: "Documents",
      label: "Documents",
      path: "/admin/documents",
      description: "Document management and storage"
    },
    {
      section: "HealthSafety",
      label: "Health & Safety",
      path: "/health-safety",
      description: "Manage risk assessments, incidents, policies, and first aid records"
    },
    {
      section: "Tasks",
      label: "Tasks",
      path: "/tasks",
      description: "Task management and tracking"
    },
    {
      section: "Issues",
      label: "Issues",
      path: "/turkus/issues",
      description: "Issue tracking and resolution"
    },
    {
      section: "Audits",
      label: "Audits",
      path: "/turkus/audits",
      description: "System audits and logs"
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
      path: "/reports",
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
      const target = event.target as Node;
      const isOutsideButton = dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsidePortalDropdown = portalDropdownRef.current && !portalDropdownRef.current.contains(target);

      if (isOutsideButton && isOutsidePortalDropdown) {
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
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
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
          <CustomTooltip text="Toolbar Menu" placement="bottom">
            <button
              ref={buttonRef}
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
          </CustomTooltip>

          {isOpen && typeof window !== 'undefined' && createPortal(
            <div
              ref={portalDropdownRef}
              className="list-button-dropdown"
              style={{
                position: 'fixed',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                zIndex: 999999
              }}
            >
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
            </div>,
            document.body
          )}
        </div>

        {/* Contact Support Button */}
        <TextIconButton
          icon={<FiMail />}
          variant="send"
          label="Contact Support"
          onClick={handleContactAdmin}
        />
      </div>

      <span className="toolbar-user-info">
        {user?.first_name ? `${user.first_name}, Access level: Super Admin` : "Super Admin Toolbar"}
      </span>
    </section>
  );
}
