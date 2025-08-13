'use client'

import React, { useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi'

type Column = {
  header: string
  accessor: string
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

type NeonTableProps = {
  columns: Column[]
  data: Record<string, unknown>[]
  toolbar?: React.ReactNode // Optional toolbar section
}

export default function NeonTable({ columns, data, toolbar }: NeonTableProps) {
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  // Filter data by search
  const filteredData = React.useMemo(() => {
    if (!search.trim()) return data
    const lower = search.toLowerCase()
    return data.filter(row =>
      columns.some(col => {
        const value = row[col.accessor]
        return value && String(value).toLowerCase().includes(lower)
      })
    )
  }, [data, columns, search])

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortBy) return filteredData
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortBy] as string | number
      const bValue = b[sortBy] as string | number
      if (aValue < bValue) return sortDir === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortBy, sortDir])

  // Pagination logic
  const totalRows = sortedData.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Handlers
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value))
    setCurrentPage(1)
  }
  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1))
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1))

  return (
    <div>
      {/* Controls Row: Search (left), Toolbar (center, optional), Pagination (right) in-line */}
      <div className="neon-table-controls-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: 0 }}>
        {/* Search Bar (left) */}
        <div className="neon-table-search-bar" style={{ flex: 1, maxWidth: 320, marginRight: 'auto' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--neon)' }} />
            <input
              id="neon-table-search"
              type="search"
              className="neon-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
              autoComplete="off"
            />
          </div>
        </div>
        {/* Toolbar (center, optional) */}
        {toolbar && (
          <div className="neon-table-toolbar" style={{ flex: '0 0 auto', margin: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {toolbar}
          </div>
        )}
        {/* Pagination Controls (right) */}
        <div className="neon-pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto' }}>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="neon-table-page-size-select"
            style={{ width: 'auto', minWidth: 0 }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="neon-btn-square neon-btn-back"
            type="button"
            aria-label="Previous page"
          >
            <FiChevronLeft size={20} />
          </button>
          <span className="neon-table-pagination-label">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="neon-btn-square neon-btn-next"
            type="button"
            aria-label="Next page"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>
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
                  <td key={col.accessor} className="neon-table-cell">
                    {col.render ? col.render(row[col.accessor], row) : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
