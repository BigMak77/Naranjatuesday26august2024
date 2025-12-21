"use client";

import React, { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import TextIconButton from "@/components/ui/TextIconButtons";

type Column = {
  header: string;
  accessor: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
};

type NeonTableProps = {
  columns: Column[];
  data: Record<string, unknown>[];
  toolbar?: React.ReactNode; // Optional toolbar section
  onPaginationChange?: (controls: React.ReactNode) => void; // Callback when pagination controls update
  paginationPosition?: 'bottom' | 'toolbar'; // Where to show pagination
};

export default function NeonTable({
  columns,
  data,
  toolbar,
  onColumnResize,
  onPaginationChange,
  paginationPosition = 'bottom'
}: NeonTableProps & { onColumnResize?: (accessor: string, newWidth: number) => void }) {
  const [sortBy, setSortBy] = useState<string | null>("employee_number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Reset to page 1 when data changes (e.g., when search filters change)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  // Add local state for resizing
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [startX, setStartX] = useState<number | null>(null);
  const [startWidth, setStartWidth] = useState<number | null>(null);

  // Mouse move handler
  React.useEffect(() => {
    if (!resizingCol) return;
    const handleMove = (e: MouseEvent) => {
      if (startX !== null && startWidth !== null && onColumnResize) {
        const delta = e.clientX - startX;
        onColumnResize(resizingCol, startWidth + delta);
      }
    };
    const handleUp = () => {
      setResizingCol(null);
      setStartX(null);
      setStartWidth(null);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [resizingCol, startX, startWidth, onColumnResize]);

  // Use data prop directly for sorting and pagination
  const sortedData = React.useMemo(() => {
    if (!sortBy) return data;
    return [...data].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Extract text from React elements (e.g., name field with clickable spans)
      if (React.isValidElement(aValue)) {
        aValue = (aValue.props as any).children || '';
      }
      if (React.isValidElement(bValue)) {
        bValue = (bValue.props as any).children || '';
      }

      // Handle name sorting - extract last name for proper sorting
      if (sortBy === 'name' && typeof aValue === 'string' && typeof bValue === 'string') {
        const aLastName = aValue.trim().split(' ').slice(-1)[0] || '';
        const bLastName = bValue.trim().split(' ').slice(-1)[0] || '';
        const comparison = aLastName.toLowerCase().localeCompare(bLastName.toLowerCase());
        return sortDir === "asc" ? comparison : -comparison;
      }

      // Handle employee number sorting - convert to number if possible
      if (sortBy === 'employee_number') {
        const aStr = String(aValue || '').trim();
        const bStr = String(bValue || '').trim();

        // Check if values are missing or placeholder
        const aIsMissing = aStr === '—' || aStr === '' || aStr === 'undefined' || aStr === 'null';
        const bIsMissing = bStr === '—' || bStr === '' || bStr === 'undefined' || bStr === 'null';

        // Missing values go to end when ascending, beginning when descending
        if (aIsMissing && bIsMissing) return 0;
        if (aIsMissing) return sortDir === "asc" ? 1 : -1;
        if (bIsMissing) return sortDir === "asc" ? -1 : 1;

        const aNum = parseInt(aStr, 10);
        const bNum = parseInt(bStr, 10);

        // Only use numeric comparison if both successfully parsed
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDir === "asc" ? aNum - bNum : bNum - aNum;
        }

        // Fallback to string comparison if parsing fails
        return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      }

      // Handle numeric sorting for any field that looks like a number
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDir === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Convert to string for comparison
      const aStr = String(aValue ?? '');
      const bStr = String(bValue ?? '');

      // Case-insensitive string comparison
      const comparison = aStr.toLowerCase().localeCompare(bStr.toLowerCase());
      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [data, sortBy, sortDir]);

  // Pagination logic
  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Handlers - memoized to prevent recreation on every render
  const handlePageSizeChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  const handlePrev = React.useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNext = React.useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  // Pagination controls component - memoized to prevent infinite loops
  const paginationControls = React.useMemo(() => {
    if (totalRows === 0) return null;

    return (
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}>
        <TextIconButton
          variant="cancel"
          icon={<FiChevronLeft size={16} />}
          label="Previous"
          onClick={handlePrev}
          disabled={currentPage === 1}
        />
        <span style={{ color: 'var(--text)', fontSize: '0.875rem', minWidth: '100px', textAlign: 'center' }}>
          Page {currentPage} of {totalPages}
        </span>
        <TextIconButton
          variant="save"
          icon={<FiChevronRight size={16} />}
          label="Next"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        />
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          className="neon-input"
          style={{ padding: '4px 8px', fontSize: '0.875rem', width: 'auto', marginLeft: '8px' }}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '8px' }}>
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalRows)} of {totalRows}
        </span>
      </div>
    );
  }, [currentPage, pageSize, totalRows, totalPages, handlePrev, handleNext, handlePageSizeChange]);

  // Call the callback when pagination controls change
  React.useEffect(() => {
    if (onPaginationChange) {
      onPaginationChange(paginationControls);
    }
  }, [paginationControls]);

  return (
    <div style={{ width: "100%", margin: 0 }}>
      <table className="neon-table" style={{ width: "100%", tableLayout: "fixed" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.accessor}
                className="neon-table-header"
                style={{
                  ...(col.width ? { width: typeof col.width === 'number' ? `${col.width}px` : col.width } : {}),
                  position: 'relative',
                  userSelect: resizingCol === col.accessor ? 'none' : undefined,
                  textAlign: col.align || 'left',
                }}
                onClick={() => {
                  if (sortBy === col.accessor) {
                    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
                  } else {
                    setSortBy(col.accessor);
                    setSortDir("asc");
                  }
                }}
              >
                {col.header}
                {sortBy === col.accessor && (
                  <span className="ml-2">{sortDir === "asc" ? "▲" : "▼"}</span>
                )}
                {/* Resize handle */}
                {onColumnResize && (
                  <span
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 8,
                      cursor: "col-resize",
                      zIndex: 2,
                      userSelect: "none",
                    }}
                    onMouseDown={e => {
                      setResizingCol(col.accessor);
                      setStartX(e.clientX);
                      setStartWidth(typeof col.width === 'number' ? col.width : 120);
                      e.stopPropagation();
                    }}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-6">
                No data available.
              </td>
            </tr>
          ) : (
            paginatedData.map((row, i) => (
              <tr key={i} className="neon-table-row">
                {columns.map((col) => (
                  <td
                    key={col.accessor}
                    className="neon-table-cell"
                    style={{
                      ...(col.width ? { width: typeof col.width === 'number' ? `${col.width}px` : col.width } : {}),
                      textAlign: col.align || 'left',
                    }}
                  >
                    {col.render
                      ? col.render(row[col.accessor], row)
                      : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Controls - show at bottom unless position is 'toolbar' */}
      {paginationPosition === 'bottom' && paginationControls && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginTop: '16px',
          padding: '12px 0',
          borderTop: '1px solid var(--border)',
        }}>
          {paginationControls}
        </div>
      )}
    </div>
  );
}
