'use client'

import React, { useState } from 'react'

type Column = {
  header: string
  accessor: string
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

type NeonTableProps = {
  columns: Column[]
  data: Record<string, unknown>[]
}

export default function NeonTable({ columns, data }: NeonTableProps) {
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortBy) return data
    return [...data].sort((a, b) => {
      const aValue = a[sortBy] as string | number
      const bValue = b[sortBy] as string | number
      if (aValue < bValue) return sortDir === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortBy, sortDir])

  return (
    <table className="neon-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.accessor}
              className="text-center font-bold tracking-wide cursor-pointer select-none"
              onClick={() => {
                if (sortBy === col.accessor) {
                  setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                } else {
                  setSortBy(col.accessor)
                  setSortDir('asc')
                }
              }}
            >
              {col.header}
              {sortBy === col.accessor && (
                <span className="ml-2">{sortDir === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="text-center py-6">
              No data available.
            </td>
          </tr>
        ) : (
          sortedData.map((row, i) => (
            <tr key={i} className="neon-table-row">
              {columns.map((col) => (
                <td key={col.accessor} className="neon-table-cell">
                  {col.render ? col.render(row[col.accessor], row) : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}
