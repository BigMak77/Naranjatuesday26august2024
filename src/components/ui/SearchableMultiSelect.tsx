"use client";

import React, { useState, useRef, useEffect } from "react";
import "./searchable-multi-select.css";

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
    <div ref={containerRef} className="searchable-multi-select">
      {/* Selected items tags */}
      {selected.length > 0 && (
        <div className="selected-tags">
          {selected.map((value) => {
            const option = options.find((opt) => String(opt[valueKey]) === value);
            if (!option) return null;
            return (
              <span key={value} className="selected-tag">
                {String(option[labelKey])}
                <button
                  type="button"
                  onClick={() => removeItem(value)}
                  className="remove-tag"
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
        className="searchable-multi-select-input"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsOpen(true)}
      />

      {/* Dropdown */}
      {isOpen && (
        <div className="searchable-multi-select-dropdown">
          {filteredOptions.length === 0 ? (
            <div className="no-options">No options found</div>
          ) : (
            filteredOptions.map((option) => {
              const value = String(option[valueKey]);
              const isSelected = selected.includes(value);
              return (
                <label
                  key={value}
                  className={`dropdown-option ${isSelected ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOption(value)}
                  />
                  <span>{String(option[labelKey])}</span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
