"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGlobalSearch, SearchResult } from "@/context/GlobalSearchContext";
import { FiX, FiUser, FiFile, FiBook, FiAlertCircle, FiCheckSquare, FiBriefcase, FiSearch, FiLoader } from "react-icons/fi";
import { useRouter } from "next/navigation";

const categoryIcons = {
  user: FiUser,
  document: FiFile,
  training: FiBook,
  issue: FiAlertCircle,
  audit: FiCheckSquare,
  department: FiBriefcase,
};

const categoryLabels = {
  user: "Users",
  document: "Documents",
  training: "Training",
  issue: "Issues",
  audit: "Audits",
  department: "Departments",
};

export default function GlobalSearchModal() {
  const {
    isSearchOpen,
    closeSearch,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
  } = useGlobalSearch();

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Debug logging
  useEffect(() => {
    console.log("GlobalSearchModal - isSearchOpen:", isSearchOpen);
  }, [isSearchOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Perform search with debouncing
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [setSearchResults, setIsSearching]);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, performSearch, setSearchResults, setIsSearching]);

  // Keyboard navigation
  useEffect(() => {
    if (!isSearchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSearch();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && searchResults[selectedIndex]) {
        e.preventDefault();
        handleResultClick(searchResults[selectedIndex]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, searchResults, selectedIndex, closeSearch]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    closeSearch();
  };

  // Group results by category
  const groupedResults = searchResults.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  if (!isSearchOpen) return null;

  return (
    <div
      className="global-search-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSearch();
      }}
    >
      <div className="global-search-modal">
        {/* Search Header */}
        <div className="global-search-header">
          <FiSearch className="global-search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search users, documents, training, issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="global-search-input"
          />
          {isSearching && <FiLoader className="global-search-loading" />}
          <button
            type="button"
            onClick={closeSearch}
            className="global-search-close"
            aria-label="Close search"
          >
            <FiX />
          </button>
        </div>

        {/* Search Results */}
        <div className="global-search-results">
          {searchQuery.trim().length < 2 ? (
            <div className="global-search-empty">
              <FiSearch size={48} />
              <p>Type at least 2 characters to search</p>
            </div>
          ) : searchResults.length === 0 && !isSearching ? (
            <div className="global-search-empty">
              <FiSearch size={48} />
              <p>No results found for "{searchQuery}"</p>
            </div>
          ) : (
            Object.entries(groupedResults).map(([type, results]) => {
              const Icon = categoryIcons[type as keyof typeof categoryIcons];
              const label = categoryLabels[type as keyof typeof categoryLabels];

              return (
                <div key={type} className="global-search-category">
                  <div className="global-search-category-header">
                    <Icon />
                    <span>{label}</span>
                    <span className="global-search-category-count">{results.length}</span>
                  </div>
                  <div className="global-search-category-results">
                    {results.map((result, index) => {
                      const globalIndex = searchResults.indexOf(result);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <button
                          key={result.id}
                          type="button"
                          className={`global-search-result-item ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => handleResultClick(result)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        >
                          <div className="global-search-result-content">
                            <div className="global-search-result-title">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="global-search-result-subtitle">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Search Footer */}
        <div className="global-search-footer">
          <div className="global-search-footer-hint">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="global-search-footer-hint">
            <kbd>Enter</kbd>
            <span>Select</span>
          </div>
          <div className="global-search-footer-hint">
            <kbd>Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
