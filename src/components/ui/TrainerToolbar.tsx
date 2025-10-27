"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { FiMail, FiBook } from "react-icons/fi";

type TrainerSection = "Dashboard" | "Training Assessments" | "Log Training" | "Training Matrix";

export default function TrainerToolbar() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<TrainerSection>("Dashboard");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const trainerSections: Array<{
    section: TrainerSection;
    label: string;
    path: string;
    description: string;
  }> = [
    {
      section: "Dashboard",
      label: "Trainer Dashboard",
      path: "/trainer/dashboard",
      description: "Overview of training activities"
    },
    {
      section: "Log Training",
      label: "Log Training",
      path: "/training/complete",
      description: "Record and log training sessions for users"
    },
    {
      section: "Training Matrix",
      label: "Training Matrix",
      path: "/training/matrix",
      description: "View comprehensive training matrix for all users"
    },
    {
      section: "Training Assessments",
      label: "Training Assessments",
      path: "/training/assessment",
      description: "View and manage training assessments"
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

  const handleSectionSelect = (section: TrainerSection, path: string) => {
    setSelectedSection(section);
    setIsOpen(false);
    router.push(path);
    console.log(`Trainer navigating to: ${path}`);
  };

  const handleContactAdmin = () => {
    console.log('Contact Admin clicked');
    alert('Contact Admin feature - Coming soon!');
  };

  // Show loading state if user data is still loading
  if (loading) {
    return (
      <section className="section-toolbar">
        <span>Loading Trainer Toolbar...</span>
      </section>
    );
  }

  // Show error state if no user
  if (!user) {
    return (
      <section className="section-toolbar">
        <span>Trainer Toolbar - Access Denied</span>
      </section>
    );
  }

  return (
    <section className="section-toolbar">
      <span>Trainer Toolbar</span>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Trainer Sections Dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            className="neon-btn neon-btn-list"
            onClick={handleToggle}
            aria-label="Select trainer section"
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
                Trainer Sections
                <div style={{ fontSize: "0.8em", opacity: 0.7 }}>
                  {user.first_name} {user.last_name}
                </div>
              </div>
              <ul className="list-button-dropdown-list">
                {trainerSections.map(({ section, label, path, description }) => (
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

        {/* Training Modules Button */}
        <button
          className="neon-btn neon-btn-icon"
          onClick={() => router.push('/trainer/modules')}
          aria-label="Training Modules"
          title="View Training Modules"
          type="button"
        >
          <FiBook size={18} />
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
