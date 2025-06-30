'use client'

import { useState } from 'react'

type Category = {
  id: string
  name: string
}

type Props = {
  categories: Category[]
  onSelect: (categoryName: string) => void
}

export default function CategoryFilter({ categories, onSelect }: Props) {
  const [selected, setSelected] = useState('All')

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelected(value)
    onSelect(value)
  }

  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium text-teal-800">Filter by Category:</label>
      <select
        value={selected}
        onChange={handleChange}
        className="border border-teal-300 rounded px-3 py-2 w-full"
      >
        <option value="All">All</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.name}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  )
}
