"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type UserView = "Super Admin" | "Admin" | "Manager" | "Trainer" | "HR Admin" | "H&S Admin" | "User";

interface ListButtonProps {
  onViewChange?: (view: UserView) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export default function ListButton({ 
  onViewChange, 
  disabled = false, 
  className = "",
  "aria-label": ariaLabel = "Select user view"
}: ListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<UserView>("User");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const userViews: UserView[] = [
    "Super Admin",
    "Admin",
    "Manager",
    "Trainer",
    "HR Admin",
    "H&S Admin",
    "User"
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
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (view: UserView) => {
    setSelectedView(view);
    setIsOpen(false);
    onViewChange?.(view);
    
    // Navigate based on selected view
    switch (view) {
      case "Trainer":
        router.push("/trainer/dashboard");
        break;
      case "User":
        router.push("/user/dashboard");
        break;
      case "H&S Admin":
        router.push("/health-safety");
        break;
      case "HR Admin":
        router.push("/hr/dashboard");
        break;
      // Add other views as needed
      default:
        console.log(`Navigation for ${view} not yet implemented`);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        className={`neon-btn neon-btn-list ${className}`.trim()}
        onClick={handleToggle}
        disabled={disabled}
        aria-label={ariaLabel}
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
          <div className="list-button-dropdown-header">User View</div>
          <ul className="list-button-dropdown-list">
            {userViews.map((view) => (
              <li key={view}>
                <button
                  className={`list-button-dropdown-item ${selectedView === view ? "active" : ""}`}
                  onClick={() => handleSelect(view)}
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
  );
}
