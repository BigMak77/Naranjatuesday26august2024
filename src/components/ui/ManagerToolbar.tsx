"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useManagerContext } from "@/context/ManagerContext";
import { useUser } from "@/lib/useUser";
import { usePermissions } from "@/lib/usePermissions";
import { FiMail, FiHome } from "react-icons/fi";

type ManagerView = "My Team" | "My Team Training" | "My Team Tasks" | "My Team Issues" | "My Team Audits" | "My Team Compliance" | "User Dashboard";

interface ManagerToolbarProps {
  className?: string;
}

export default function ManagerToolbar({
  className = "",
}: ManagerToolbarProps) {
  const router = useRouter();
  const { currentView, setCurrentView } = useManagerContext();
  const { user, loading: userLoading } = useUser();
  const { isManager, isAdmin, canAccessManager } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Define all possible manager views with their access requirements
  const allManagerViews: Array<{
    view: ManagerView;
    label: string;
    description: string;
    requiresManagerAccess: boolean;
    requiresDepartment: boolean;
    comingSoon?: boolean;
  }> = [
    {
      view: "My Team",
      label: "My Team",
      description: "View and manage your team members",
      requiresManagerAccess: true,
      requiresDepartment: true,
    },
    {
      view: "My Team Training",
      label: "My Team Training",
      description: "Manage team training assignments and progress",
      requiresManagerAccess: true,
      requiresDepartment: true,
    },
    {
      view: "My Team Tasks",
      label: "My Team Tasks",
      description: "Assign and track team tasks",
      requiresManagerAccess: true,
      requiresDepartment: true,
      comingSoon: true,
    },
    {
      view: "My Team Issues",
      label: "My Team Issues",
      description: "View and manage team issues and incidents",
      requiresManagerAccess: true,
      requiresDepartment: true,
    },
    {
      view: "My Team Audits",
      label: "My Team Audits",
      description: "Conduct and review team audits",
      requiresManagerAccess: true,
      requiresDepartment: true,
      comingSoon: true,
    },
    {
      view: "My Team Compliance",
      label: "My Team Compliance",
      description: "Monitor team compliance status",
      requiresManagerAccess: true,
      requiresDepartment: true,
    },
  ];

  // Filter views based on user access level and department
  const availableViews = useMemo(() => {
    if (userLoading || !user) return [];

    return allManagerViews.filter(({ requiresManagerAccess, requiresDepartment }) => {
      // Check manager access requirement
      if (requiresManagerAccess && !canAccessManager) {
        return false;
      }

      // Check department requirement
      if (requiresDepartment && !user.department_id) {
        console.warn(`Manager ${user.first_name} ${user.last_name} has no department assigned`);
        return false;
      }

      return true;
    });
  }, [user, userLoading, canAccessManager]);

  const managerViews: ManagerView[] = availableViews.map(item => item.view);

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
    // Additional access check before allowing view change
    const viewConfig = allManagerViews.find(v => v.view === view);

    if (viewConfig?.requiresManagerAccess && !canAccessManager) {
      console.warn(`Access denied to ${view} - insufficient permissions`);
      alert('You do not have permission to access this section.');
      return;
    }

    if (viewConfig?.requiresDepartment && !user?.department_id) {
      console.warn(`Access denied to ${view} - no department assigned`);
      alert('You need to be assigned to a department to access this section. Please contact your administrator.');
      return;
    }

    if (viewConfig?.comingSoon) {
      console.log(`${view} selected - feature coming soon`);
      alert(`${viewConfig.label} - Coming soon!`);
      setIsOpen(false);
      return;
    }

    // Handle specific route navigation for My Team Issues
    if (view === "My Team Issues") {
      router.push('/manager/myteamissues');
      setIsOpen(false);
      console.log(`Navigating to My Team Issues page (Department: ${user?.department_id})`);
      return;
    }

    // Set the view in context
    setCurrentView(view);
    setIsOpen(false);

    // Navigate to manager page so ManagerPageWrapper can display the view
    router.push('/manager');
    console.log(`Manager view changed to: ${view} (Department: ${user?.department_id})`);
  };

  const handleContactAdmin = () => {
    console.log('Contact Admin clicked');
    // TODO: Implement contact admin functionality
    // This could open a modal, redirect to a contact form, or send an email
    alert('Contact Admin feature - Coming soon!');
  };

  const handleUserDashboard = () => {
    // Check if user can access User Dashboard view
    if (!canAccessManager) {
      alert('You do not have permission to access the User Dashboard view.');
      return;
    }

    console.log(`User Dashboard clicked by ${user?.access_level} user`);
    // Set view in context and navigate to manager page
    setCurrentView("User Dashboard");
    router.push('/manager');
  };

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

  const departmentInfo = user.department_id ? ` (Dept: ${user.department_id})` : ' (No Dept)';

  return (
    <section className={`section-toolbar ${className}`.trim()}>
      <span>Manager Toolbar{departmentInfo}</span>
      
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Localized Manager View Dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            className="neon-btn neon-btn-list"
            onClick={handleToggle}
            aria-label="Select manager view"
            aria-expanded={isOpen}
            type="button"
            disabled={availableViews.length === 0}
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
                Manager View
                {user.department_id && (
                  <div style={{ fontSize: "0.8em", opacity: 0.7 }}>
                    Department: {user.department_id}
                  </div>
                )}
              </div>
              <ul className="list-button-dropdown-list">
                {availableViews.length === 0 ? (
                  <li>
                    <div className="list-button-dropdown-item" style={{ opacity: 0.6 }}>
                      No sections available
                      {!user.department_id && <br />}
                      {!user.department_id && <small>Contact admin to assign department</small>}
                    </div>
                  </li>
                ) : (
                  availableViews.map(({ view, label, description, comingSoon }) => (
                    <li key={view}>
                      <button
                        className={`list-button-dropdown-item ${currentView === view ? "active" : ""} ${comingSoon ? "coming-soon" : ""}`}
                        onClick={() => handleViewSelect(view)}
                        type="button"
                        title={description}
                      >
                        {label}
                        {comingSoon && <span style={{ opacity: 0.6, fontSize: "0.8em" }}> (Soon)</span>}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* User Dashboard Button - Only for Managers/Admins */}
        {canAccessManager && (
          <button
            className="neon-btn neon-btn-icon"
            onClick={handleUserDashboard}
            aria-label="User Dashboard View"
            title="Switch to User Dashboard View"
            type="button"
          >
            <FiHome size={18} />
          </button>
        )}

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
