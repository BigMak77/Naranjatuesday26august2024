// components/SearchableDropdown.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { FiPlus } from "react-icons/fi";

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  onSelect: (value: string) => void;
  placeholder?: string;
}

export default function SearchableDropdown({
  options,
  onSelect,
  placeholder = "Select an option...",
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="searchable-dropdown-container">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="searchable-dropdown-input"
      />
      <NeonIconButton variant="add" icon={<FiPlus />} title="Add Option" />
      {isOpen && (
        <ul className="searchable-dropdown-list">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  setQuery(opt.label);
                  setIsOpen(false);
                  onSelect(opt.value);
                }}
                className="searchable-dropdown-list-item"
              >
                {opt.label}
              </li>
            ))
          ) : (
            <li className="searchable-dropdown-list-empty">No matches</li>
          )}
        </ul>
      )}
    </div>
  );
}
