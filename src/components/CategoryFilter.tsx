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
    <div className="category-filter-wrapper">
      <label className="category-filter-label">Filter by Category:</label>
      <select
        value={selected}
        onChange={handleChange}
        className="category-filter-select"
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
