// components/SearchableDropdown.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface Option {
  label: string
  value: string
}

interface Props {
  options: Option[]
  onSelect: (value: string) => void
  selected: string
  placeholder?: string
}

export default function SearchableDropdown({
  options,
  onSelect,
  selected,
  placeholder = 'Select an option...',
}: Props) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedLabel = options.find((opt) => opt.value === selected)?.label

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full border border-teal-300 rounded px-3 py-2 bg-white text-teal-900"
      />
      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-teal-200 rounded shadow max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  setQuery(opt.label)
                  setIsOpen(false)
                  onSelect(opt.value)
                }}
                className="px-3 py-2 cursor-pointer hover:bg-teal-100 text-teal-900"
              >
                {opt.label}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-gray-400">No matches</li>
          )}
        </ul>
      )}
    </div>
  )
}
