// src/components/ui/ThemedTable.tsx
"use client";

import React from "react";

interface ThemedTableProps {
  headers: string[];
  rows: any[][];
}

export default function ThemedTable({ headers, rows }: ThemedTableProps) {
  return (
    <table className="neon-table">
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th key={i} className="text-left">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, colIndex) => (
              <td key={colIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
