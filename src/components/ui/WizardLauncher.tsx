"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch, FiX, FiUserPlus, FiUsers, FiAlertCircle,
  FiClipboard, FiShield, FiFileText, FiTool, FiSettings,
  FiChevronRight, FiZap, FiBriefcase, FiPlusCircle
} from "react-icons/fi";

interface WizardOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  keywords: string[];
  category: string;
}

const WIZARD_OPTIONS: WizardOption[] = [
  {
    id: "onboard-employee",
    title: "Onboard New Employee",
    description: "Add single or multiple employees with training assignment",
    icon: <FiUserPlus className="w-5 h-5" />,
    route: "/admin/onboarding",
    keywords: ["onboard", "employee", "new", "hire", "user", "staff", "add", "create", "bulk", "csv"],
    category: "People"
  },
  {
    id: "create-department",
    title: "Create Department",
    description: "Add a new department to the organization",
    icon: <FiBriefcase className="w-5 h-5" />,
    route: "/admin/onboarding?createDepartment=true",
    keywords: ["department", "create", "new", "add", "division", "section"],
    category: "Organization"
  },
  {
    id: "create-role",
    title: "Create Role",
    description: "Define new role with permissions and assignments",
    icon: <FiShield className="w-5 h-5" />,
    route: "/admin/roles",
    keywords: ["role", "permission", "access", "create", "new", "define", "position", "job"],
    category: "Organization"
  },
  {
    id: "raise-issue",
    title: "Raise Issue",
    description: "Report a health & safety issue or incident",
    icon: <FiAlertCircle className="w-5 h-5" />,
    route: "/health-safety",
    keywords: ["issue", "incident", "report", "safety", "health", "raise", "problem"],
    category: "Health & Safety"
  },
  {
    id: "assign-training",
    title: "Assign Training",
    description: "Assign training modules to roles or individuals",
    icon: <FiClipboard className="w-5 h-5" />,
    route: "/admin/roles",
    keywords: ["training", "assign", "module", "course", "learning", "education"],
    category: "Training"
  },
  {
    id: "manage-structure",
    title: "Manage Structure",
    description: "View and edit organizational structure",
    icon: <FiUsers className="w-5 h-5" />,
    route: "/hr/structure",
    keywords: ["structure", "organization", "hierarchy", "department", "team", "org"],
    category: "HR"
  },
  {
    id: "create-task",
    title: "Create Task",
    description: "Create and assign tasks to team members",
    icon: <FiFileText className="w-5 h-5" />,
    route: "/tasks",
    keywords: ["task", "create", "assign", "todo", "action", "work"],
    category: "Tasks"
  },
  {
    id: "configure-system",
    title: "Configure System",
    description: "Access system settings and configuration",
    icon: <FiSettings className="w-5 h-5" />,
    route: "/admin",
    keywords: ["settings", "config", "configure", "system", "setup", "admin"],
    category: "Administration"
  }
];

export default function WizardLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<WizardOption[]>(WIZARD_OPTIONS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOptions(WIZARD_OPTIONS);
      setSelectedIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = WIZARD_OPTIONS.filter(option => {
      return (
        option.title.toLowerCase().includes(query) ||
        option.description.toLowerCase().includes(query) ||
        option.keywords.some(keyword => keyword.includes(query)) ||
        option.category.toLowerCase().includes(query)
      );
    });

    setFilteredOptions(filtered);
    setSelectedIndex(0);
  }, [searchQuery]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filteredOptions[selectedIndex]) {
        e.preventDefault();
        handleSelectOption(filteredOptions[selectedIndex]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredOptions, selectedIndex]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleSelectOption(option: WizardOption) {
    router.push(option.route);
    setIsOpen(false);
    setSearchQuery("");
  }

  // Group options by category
  const groupedOptions = filteredOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, WizardOption[]>);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 px-6 py-4 font-medium"
          title="Open quick actions"
        >
          <FiZap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span>I would like to...</span>
        </button>
      )}

      {/* Wizard Menu */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-[480px] max-h-[600px] flex flex-col animate-slideUp">
          {/* Header with Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <FiZap className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900">I would like to...</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery("");
                }}
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wizards and actions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiSearch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No wizards found matching "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-orange-500 hover:text-orange-600 text-sm mt-2"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedOptions).map(([category, options]) => (
                  <div key={category}>
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {category}
                    </div>
                    <div className="space-y-1">
                      {options.map((option, index) => {
                        const globalIndex = filteredOptions.indexOf(option);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <button
                            key={option.id}
                            onClick={() => handleSelectOption(option)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                              isSelected
                                ? "bg-orange-50 border-2 border-orange-500"
                                : "border-2 border-transparent hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg flex-shrink-0 ${
                                  isSelected
                                    ? "bg-orange-500 text-white"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {option.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4
                                    className={`font-semibold ${
                                      isSelected ? "text-orange-900" : "text-gray-900"
                                    }`}
                                  >
                                    {option.title}
                                  </h4>
                                </div>
                                <p
                                  className={`text-sm mt-0.5 ${
                                    isSelected ? "text-orange-700" : "text-gray-600"
                                  }`}
                                >
                                  {option.description}
                                </p>
                              </div>
                              <FiChevronRight
                                className={`w-5 h-5 flex-shrink-0 ${
                                  isSelected ? "text-orange-500" : "text-gray-400"
                                }`}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with keyboard hints */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">↑</kbd>
                <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">Enter</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">Esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
