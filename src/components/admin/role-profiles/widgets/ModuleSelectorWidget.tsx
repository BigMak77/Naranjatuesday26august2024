// components/role-profiles/widgets/ModuleSelectorWidget.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import NeonPanel from '@/components/NeonPanel'

type Module = {
  id: string
  title: string
}

type Props = {
  selectedModules: string[]
  onChange: (ids: string[]) => void
}

export default function ModuleSelectorWidget({ selectedModules, onChange }: Props) {
  const [modules, setModules] = useState<Module[]>([])
  const [search, setSearch] = useState('')
  const [showModules, setShowModules] = useState(false)

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase.from('modules').select('id, name')
      if (error) console.error('Error fetching modules:', error)
      else setModules(data.map((m: any) => ({ id: m.id, title: m.name })))
    }
    fetchModules()
  }, [])

  const filtered = modules.filter(m => m.title.toLowerCase().includes(search.toLowerCase()))

  const toggleSelection = (id: string) => {
    if (selectedModules.includes(id)) {
      onChange(selectedModules.filter(mid => mid !== id))
    } else {
      onChange([...selectedModules, id])
    }
  }

  return (
    <NeonPanel>
      <button
        type="button"
        className="neon-btn neon-section-toggle"
        data-tooltip={showModules ? 'Hide Modules' : 'Show Modules'}
        onClick={() => setShowModules(v => !v)}
        aria-label={showModules ? 'Hide Modules' : 'Show Modules'}
      >
        {showModules
          ? <svg className="neon-icon" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
          : <svg className="neon-icon" viewBox="0 0 24 24"><path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>
        }
      </button>
      {showModules && (
        <>
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neon-input"
          />
          <div className="neon-grid">
            {filtered.map(mod => (
              <label
                key={mod.id}
                className="neon-checkbox-label"
              >
                <input
                  type="checkbox"
                  checked={selectedModules.includes(mod.id)}
                  onChange={() => toggleSelection(mod.id)}
                  className="neon-checkbox"
                />
                {mod.title}
              </label>
            ))}
          </div>
        </>
      )}
    </NeonPanel>
  )
}
