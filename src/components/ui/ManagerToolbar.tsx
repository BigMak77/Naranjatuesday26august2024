"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useManagerContext } from "@/context/ManagerContext";
import { useUser } from "@/lib/useUser";
import { usePermissions } from "@/lib/usePermissions";
import { FiUsers, FiAlertCircle, FiCheckSquare, FiBookOpen, FiHome } from "react-icons/fi";

interface ManagerToolbarProps {
  className?: string;
}

interface NavItem {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  requiresDepartment?: boolean;
  comingSoon?: boolean;
}

export default function ManagerToolbar({
  className = "",
}: ManagerToolbarProps) {
  const router = useRouter();
  const { setCurrentView } = useManagerContext();
  const { user, loading: userLoading } = useUser();
  const { canAccessManager } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const navigateToView = (view: "My Team" | "My Team Training" | "Training Matrix" | "My Team Compliance" | "User Dashboard") => {
    setCurrentView(view);
    router.push('/manager');
    setIsOpen(false);
  };

  // Navigation items for the dropdown
  const navItems: NavItem[] = [
    {
      label: "My Team",
      description: "View and manage your team members (user assignments)",
      icon: <FiUsers size={16} />,
      onClick: () => navigateToView("My Team"),
      requiresDepartment: true,
    },
    {
      label: "My Team Issues",
      description: "View and manage team issues and incidents",
      icon: <FiAlertCircle size={16} />,
      onClick: () => {
        router.push('/manager/myteamissues');
        setIsOpen(false);
      },
      requiresDepartment: true,
    },
    {
      label: "My Team Tasks",
      description: "Assign and track team tasks",
      icon: <FiCheckSquare size={16} />,
      onClick: () => {
        alert('My Team Tasks - Coming soon!');
        setIsOpen(false);
      },
      requiresDepartment: true,
      comingSoon: true,
    },
    {
      label: "Team Training",
      description: "View list of team training assignments",
      icon: <FiBookOpen size={16} />,
      onClick: () => navigateToView("My Team Training"),
      requiresDepartment: true,
    },
    {
      label: "Training Matrix",
      description: "View training matrix grid for your team",
      icon: <FiBookOpen size={16} />,
      onClick: () => navigateToView("Training Matrix"),
      requiresDepartment: true,
    },
    {
      label: "User View",
      description: "View your personal dashboard (tasks, issues, training)",
      icon: <FiHome size={16} />,
      onClick: () => navigateToView("User Dashboard"),
      requiresDepartment: false,
    },
  ];

  // Filter nav items based on user access
  const availableNavItems = navItems.filter(item => {
    if (item.requiresDepartment && !user?.department_id) {
      return false;
    }
    return true;
  });

  // Show loading state if user data is still loading
  if (userLoading) {
    return (
      <section className={`section-toolbar ${className}`.trim()}>
        <span>Loading Manager Toolbar...</span>
      </section>
    );
  }

  // Show error state if no user or no manager access
  if (!user || !canAccessManager) {
    return (
      <section className={`section-toolbar ${className}`.trim()}>
        <span>Manager Toolbar - Access Denied</span>
      </section>
    );
  }

  return (
    <section className={`section-toolbar ${className}`.trim()}>
      <span>Manager Toolbar</span>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Manager Navigation Dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            className="neon-btn neon-btn-list"
            onClick={handleToggle}
            aria-label="Manager navigation menu"
            aria-expanded={isOpen}
            type="button"
            disabled={availableNavItems.length === 0}
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
                Manager Menu
              </div>
              <ul className="list-button-dropdown-list">
                {availableNavItems.length === 0 ? (
                  <li>
                    <div className="list-button-dropdown-item" style={{ opacity: 0.6 }}>
                      No sections available
                      {!user.department_id && (
                        <>
                          <br />
                          <small>Contact admin to assign department</small>
                        </>
                      )}
                    </div>
                  </li>
                ) : (
                  availableNavItems.map((item) => (
                    <li key={item.label}>
                      <button
                        className={`list-button-dropdown-item ${item.comingSoon ? "coming-soon" : ""}`}
                        onClick={item.onClick}
                        type="button"
                        title={item.description}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          width: "100%",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", color: "var(--neon)" }}>
                          {item.icon}
                        </span>
                        <span style={{ flex: 1, textAlign: "left" }}>
                          {item.label}
                          {item.comingSoon && (
                            <span style={{ opacity: 0.6, fontSize: "0.8em", marginLeft: "0.5rem" }}>
                              (Soon)
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
