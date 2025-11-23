"use client";

import React, { useState } from "react";
import { FiChevronRight, FiChevronLeft, FiX } from "react-icons/fi";
import TextIconButton from "./TextIconButtons";
import { CustomTooltip } from "./CustomTooltip";

interface Option {
  label: string;
  value: string;
}

interface DualPaneSelectorProps {
  availableOptions: Option[];
  selectedValues: string[];
  onSelectionChange: (selectedValues: string[]) => void;
  availableTitle?: string;
  selectedTitle?: string;
  searchPlaceholder?: string;
}

export default function DualPaneSelector({
  availableOptions,
  selectedValues,
  onSelectionChange,
  availableTitle = "Available",
  selectedTitle = "Selected",
  searchPlaceholder = "Search...",
}: DualPaneSelectorProps) {
  const [availableSearch, setAvailableSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);

  // Filter available options that are not already selected
  const availableItems = availableOptions.filter(
    (option) => !selectedValues.includes(option.value)
  );

  // Filter available items based on search
  const filteredAvailable = availableItems.filter((option) =>
    option.label.toLowerCase().includes(availableSearch.toLowerCase())
  );

  // Get selected options with labels
  const selectedOptions = selectedValues
    .map((value) => availableOptions.find((opt) => opt.value === value))
    .filter(Boolean) as Option[];

  const moveToSelected = () => {
    if (selectedAvailable.length > 0) {
      const newSelected = [...selectedValues, ...selectedAvailable];
      onSelectionChange(newSelected);
      setSelectedAvailable([]);
    }
  };

  const moveToAvailable = () => {
    if (selectedItems.length > 0) {
      const newSelected = selectedValues.filter(
        (value) => !selectedItems.includes(value)
      );
      onSelectionChange(newSelected);
      setSelectedItems([]);
    }
  };

  const removeItem = (valueToRemove: string) => {
    const newSelected = selectedValues.filter((value) => value !== valueToRemove);
    onSelectionChange(newSelected);
  };

  return (
    <div style={{ display: "flex", gap: "16px", minHeight: "300px" }}>
      {/* Available Items Pane */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <h4 style={{ 
          color: "var(--accent)", 
          fontSize: "0.9rem", 
          fontWeight: 600, 
          marginBottom: "12px" 
        }}>
          {availableTitle} ({filteredAvailable.length})
        </h4>
        
        <input
          type="text"
          value={availableSearch}
          onChange={(e) => setAvailableSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="neon-input"
          style={{ marginBottom: "12px" }}
        />

        <div style={{
          flex: 1,
          border: "1px solid var(--border)",
          borderRadius: "4px",
          padding: "8px",
          backgroundColor: "var(--panel)",
          overflowY: "auto",
          maxHeight: "240px"
        }}>
          {filteredAvailable.map((option) => (
            <div
              key={option.value}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderRadius: "4px",
                backgroundColor: selectedAvailable.includes(option.value) 
                  ? "var(--neon-20)" 
                  : "transparent",
                border: selectedAvailable.includes(option.value)
                  ? "1px solid var(--neon)"
                  : "1px solid transparent",
                marginBottom: "4px",
                transition: "all 0.2s",
              }}
              onClick={() => {
                if (selectedAvailable.includes(option.value)) {
                  setSelectedAvailable(prev => prev.filter(v => v !== option.value));
                } else {
                  setSelectedAvailable(prev => [...prev, option.value]);
                }
              }}
              onMouseEnter={(e) => {
                if (!selectedAvailable.includes(option.value)) {
                  e.currentTarget.style.backgroundColor = "var(--hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedAvailable.includes(option.value)) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                fontSize: "0.9rem"
              }}>
                <input
                  type="checkbox"
                  checked={selectedAvailable.includes(option.value)}
                  onChange={() => {}} // Handled by div click
                  style={{ pointerEvents: "none" }}
                />
                {option.label}
              </div>
            </div>
          ))}
          {filteredAvailable.length === 0 && (
            <div style={{ 
              textAlign: "center", 
              color: "var(--text-secondary)", 
              fontSize: "0.85rem",
              padding: "20px"
            }}>
              {availableSearch ? "No items match your search" : "No items available"}
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        gap: "8px",
        alignSelf: "center"
      }}>
        <CustomTooltip text="Move selected items to the right">
          <TextIconButton
            variant="next"
            icon={<FiChevronRight />}
            label=""
            onClick={moveToSelected}
            disabled={selectedAvailable.length === 0}
          />
        </CustomTooltip>
        <CustomTooltip text="Move selected items to the left">
          <TextIconButton
            variant="back"
            icon={<FiChevronLeft />}
            label=""
            onClick={moveToAvailable}
            disabled={selectedItems.length === 0}
          />
        </CustomTooltip>
      </div>

      {/* Selected Items Pane */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <h4 style={{ 
          color: "var(--accent)", 
          fontSize: "0.9rem", 
          fontWeight: 600, 
          marginBottom: "12px" 
        }}>
          {selectedTitle} ({selectedOptions.length})
        </h4>

        <div style={{ height: "40px", marginBottom: "12px" }}>
          {/* Spacer to align with search box on left */}
        </div>

        <div style={{
          flex: 1,
          border: "1px solid var(--border)",
          borderRadius: "4px",
          padding: "8px",
          backgroundColor: "var(--panel)",
          overflowY: "auto",
          maxHeight: "240px"
        }}>
          {selectedOptions.map((option) => (
            <div
              key={option.value}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderRadius: "4px",
                backgroundColor: selectedItems.includes(option.value) 
                  ? "var(--neon-20)" 
                  : "transparent",
                border: selectedItems.includes(option.value)
                  ? "1px solid var(--neon)"
                  : "1px solid transparent",
                marginBottom: "4px",
                transition: "all 0.2s",
              }}
              onClick={() => {
                if (selectedItems.includes(option.value)) {
                  setSelectedItems(prev => prev.filter(v => v !== option.value));
                } else {
                  setSelectedItems(prev => [...prev, option.value]);
                }
              }}
              onMouseEnter={(e) => {
                if (!selectedItems.includes(option.value)) {
                  e.currentTarget.style.backgroundColor = "var(--hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedItems.includes(option.value)) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                fontSize: "0.9rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(option.value)}
                    onChange={() => {}} // Handled by div click
                    style={{ pointerEvents: "none" }}
                  />
                  {option.label}
                </div>
                <CustomTooltip text="Remove this item">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(option.value);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      padding: "2px",
                      borderRadius: "2px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.7,
                      transition: "opacity 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.color = "var(--error)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0.7";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    <FiX size={14} />
                  </button>
                </CustomTooltip>
              </div>
            </div>
          ))}
          {selectedOptions.length === 0 && (
            <div style={{ 
              textAlign: "center", 
              color: "var(--text-secondary)", 
              fontSize: "0.85rem",
              padding: "20px"
            }}>
              No items selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
