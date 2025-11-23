// components/SearchableDropdown.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  onSelect: (value: string[] | string) => void;
  placeholder?: string;
  multi?: boolean;
  value?: string[] | string;
  zIndex?: number; // Allow custom z-index for use in dialogs
}

export default function SearchableDropdown({
  options,
  onSelect,
  placeholder = "Select an option...",
  multi = false,
  value,
  zIndex = 1000,
}: Props) {
  const [query, setQuery] = useState("");
  const [modalQuery, setModalQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(() =>
    Array.isArray(value) ? value : value ? [value] : []
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const overlayContentRef = useRef<HTMLDivElement>(null);

  // Keep internal state in sync with controlled `value`
  useEffect(() => {
    if (value !== undefined) {
      setSelected(Array.isArray(value) ? value : value ? [value] : []);
    }
  }, [value]);

  // Determine which search string to use based on mode
  const activeSearch = (multi ? modalQuery : query).toLowerCase();
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(activeSearch)
  );

  const handleSelect = (val: string) => {
    if (multi) {
      const newSelected = selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val];
      setSelected(newSelected);
      onSelect(newSelected);
      // keep open in multi mode
    } else {
      setSelected([val]);
      onSelect(val);
      setIsOpen(false); // close in single-select mode
    }
  };

  const displayValue = multi
    ? options
        .filter((opt) => selected.includes(opt.value))
        .map((opt) => opt.label)
        .join(", ")
    : options.find((opt) => opt.value === selected[0])?.label || "";

  const dropdownOverlay = isOpen
    ? createPortal(
        <>
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.18)",
              zIndex: zIndex - 1,
            }}
            onClick={(e) => {
              // Only close if the click was on the backdrop itself
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <div
              ref={overlayContentRef}
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "100%",
                maxWidth: 900,
                zIndex: zIndex,
                background: "var(--panel)",
                borderRadius: 8,
              }}
              // Stop clicks from reaching the backdrop
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {multi && (
                <div
                  style={{
                    padding: 16,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <input
                    type="text"
                    value={modalQuery}
                    onChange={(e) => setModalQuery(e.target.value)}
                    placeholder="Search..."
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 4,
                      border: "1px solid var(--border)",
                      background: "var(--field)",
                      color: "var(--text-white)",
                    }}
                    autoFocus
                  />
                </div>
              )}

              <ul
                className="searchable-dropdown-list"
                style={{
                  background: "var(--panel)",
                  maxHeight: 320,
                  overflowY: "auto",
                  padding: 0,
                  margin: 0,
                  width: "100%",
                  listStyle: "none",
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                }}
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => (
                    <li
                      key={opt.value}
                      onClick={() => !multi && handleSelect(opt.value)}
                      className="searchable-dropdown-list-item"
                      style={{
                        cursor: multi ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 18px",
                        gap: 10,
                      }}
                    >
                      {multi && (
                        <input
                          type="checkbox"
                          checked={selected.includes(opt.value)}
                          onChange={() => handleSelect(opt.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ marginRight: 2 }}
                        />
                      )}
                      {opt.label}
                    </li>
                  ))
                ) : (
                  <li
                    className="searchable-dropdown-list-empty"
                    style={{ padding: "12px 18px" }}
                  >
                    No matches
                  </li>
                )}
              </ul>
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <div
      ref={containerRef}
      className="searchable-dropdown-container"
      style={{ position: "relative", width: "100%" }}
    >
      <input
        type="text"
        value={multi ? displayValue : query}
        onChange={(e) => {
          if (multi) return; // prevent typing in main input in multi mode
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="searchable-dropdown-input"
        readOnly={multi}
        style={{ width: "100%" }}
      />

      {/* In single-select mode, let users type to filter directly */}
      {!multi && isOpen && dropdownOverlay}

      {/* In multi mode, open the overlay when focused/clicked */}
      {multi && dropdownOverlay}
    </div>
  );
}
