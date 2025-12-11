"use client";

import React, { useState, useRef, useEffect } from "react";

interface SearchableMultiSelectProps<T> {
  options: T[];
  selected: string[];
  onChange: (selected: string[]) => void;
  labelKey: keyof T;
  valueKey: keyof T;
  placeholder?: string;
}

export default function SearchableMultiSelect<T extends Record<string, any>>({
  options,
  selected,
  onChange,
  labelKey,
  valueKey,
  placeholder = "Search...",
}: SearchableMultiSelectProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term and sort alphabetically
  const filteredOptions = options
    .filter((option) => {
      const label = String(option[labelKey] || "").toLowerCase();
      return label.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const labelA = String(a[labelKey] || "").toLowerCase();
      const labelB = String(b[labelKey] || "").toLowerCase();
      return labelA.localeCompare(labelB);
    });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeItem = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Selected items tags */}
      {selected.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          {selected.map((value) => {
            const option = options.find((opt) => String(opt[valueKey]) === value);
            if (!option) return null;
            return (
              <span
                key={value}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "var(--neon)",
                  color: "var(--background)",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                }}
              >
                {String(option[labelKey])}
                <button
                  type="button"
                  onClick={() => removeItem(value)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    padding: "0",
                    fontSize: "1rem",
                    lineHeight: "1",
                  }}
                  aria-label={`Remove ${option[labelKey]}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        className="neon-input"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsOpen(true)}
      />

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "0.25rem",
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "#1a2b2b",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            zIndex: 10000,
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.5)",
          }}
        >
          {filteredOptions.length === 0 ? (
            <div
              style={{
                padding: "1rem",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              No options found
            </div>
          ) : (
            filteredOptions.map((option) => {
              const value = String(option[valueKey]);
              const isSelected = selected.includes(value);
              return (
                <label
                  key={value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    cursor: "pointer",
                    backgroundColor: isSelected
                      ? "rgba(var(--neon-rgb), 0.1)"
                      : "transparent",
                    borderBottom: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(var(--neon-rgb), 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOption(value)}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ color: "var(--text)" }}>
                    {String(option[labelKey])}
                  </span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
