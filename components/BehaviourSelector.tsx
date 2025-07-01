"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import BehaviourIcon from './BehaviourIcon'

export interface Behaviour {
  id: string
  name: string
  icon: string
}

interface BehaviourSelectorProps {
  selected: string[]
  onChange: (newSelected: string[]) => void
  max?: number
}

export default function BehaviourSelector({ selected, onChange, max = 5 }: BehaviourSelectorProps) {
  const [behaviours, setBehaviours] = useState<Behaviour[]>([])

  useEffect(() => {
    const fetchBehaviours = async () => {
      const { data, error } = await supabase
        .from('behaviours')
        .select('id, name, icon')

      if (error) {
        console.error('Error fetching behaviours:', error)
      } else {
        setBehaviours(data || [])
      }
    }

    fetchBehaviours()
  }, [])

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((b) => b !== id))
    } else if (selected.length < max) {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">Select up to {max} behaviours</p>
      <div className="flex flex-wrap gap-4">
        {behaviours.map((b) => (
          <div
            key={b.id}
            role="button"
            onClick={() => toggle(b.id)}
            className={`border rounded p-2 hover:shadow transition cursor-pointer ${
              selected.includes(b.id) ? 'border-teal-600' : 'border-gray-300'
            }`}
          >
            <BehaviourIcon behaviour={b} selected={selected.includes(b.id)} onClick={toggle} />
          </div>
        ))}
      </div>
    </div>
  )
}
