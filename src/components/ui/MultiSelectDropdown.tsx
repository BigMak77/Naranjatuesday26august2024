"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface MultiSelectDropdownProps {
  options: Array<{ id: string; name: string }>;
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function MultiSelectDropdown({
  options,
  selectedIds,
  onChange,
  placeholder = "Select options...",
  label,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedNames = options
    .filter((opt) => selectedIds.includes(opt.id))
    .map((opt) => opt.name)
    .join(", ");

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {label && (
        <label className="add-module-tab-label" style={{ display: "block", marginBottom: "8px" }}>
          {label}
        </label>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="neon-input"
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "40px",
          padding: "8px 12px",
        }}
      >
        <span style={{ color: selectedIds.length === 0 ? "var(--text-secondary)" : "var(--text)" }}>
          {selectedIds.length === 0 ? placeholder : selectedNames}
        </span>
        {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: "#fa7a20",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
            minWidth: "200px",
          }}
        >
          {options.length === 0 ? (
            <div
              style={{
                padding: "0.75rem 1rem",
                color: "var(--text-white)",
                fontSize: "var(--font-size-base)",
                textAlign: "center",
              }}
            >
              No categories available
            </div>
          ) : (
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {options.sort((a, b) => a.name.localeCompare(b.name)).map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleToggle(option.id)}
                  style={{
                    padding: "0.75rem 1rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    backgroundColor: selectedIds.includes(option.id)
                      ? "var(--primary-color)"
                      : "transparent",
                    color: "var(--text-white)",
                    fontWeight: selectedIds.includes(option.id)
                      ? "var(--font-weight-bold)"
                      : "var(--font-weight-normal)",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedIds.includes(option.id)) {
                      e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedIds.includes(option.id)) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    } else {
                      e.currentTarget.style.backgroundColor = "var(--primary-color)";
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(option.id)}
                    onChange={() => {}} // Handled by parent div onClick
                    className="neon-checkbox"
                    style={{ pointerEvents: "none" }}
                  />
                  <span style={{ fontSize: "var(--font-size-base)" }}>{option.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
