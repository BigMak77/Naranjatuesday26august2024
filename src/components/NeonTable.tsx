"use client";

import React, { useState } from "react";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";

type Column = {
  header: string;
  accessor: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  width?: number | string;
};

type NeonTableProps = {
  columns: Column[];
  data: Record<string, unknown>[];
  toolbar?: React.ReactNode; // Optional toolbar section
};

export default function NeonTable({ columns, data, toolbar, onColumnResize }: NeonTableProps & { onColumnResize?: (accessor: string, newWidth: number) => void }) {
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

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
      const aValue = a[sortBy] as string | number;
      const bValue = b[sortBy] as string | number;
      if (aValue < bValue) return sortDir === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortBy, sortDir]);

  // Pagination logic
  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Handlers
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };
  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

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
    </div>
  );
}
