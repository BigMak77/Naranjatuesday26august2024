'use client'

import React, { useEffect, useState } from 'react'
import * as FiIcons from 'react-icons/fi'
import { supabase } from '@/lib/supabase-client'
import { useUser } from '@/lib/useUser'

export type NeonCard = {
  id?: string
  title: string
  text: string
  icon: string
  href: string
  bgcolor?: string
  accentcolor?: string
}

export default function NeonDashboard({ editable = false }: { editable?: boolean }) {
  const [cards, setCards] = useState<NeonCard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useUser()
  const iconNames = Object.keys(FiIcons).filter((name) => name.startsWith('Fi'))

  useEffect(() => {
    if (!user) return

    const fetchCards = async () => {
      const { data, error } = await supabase
        .from('neon_dashboard_cards')
        .select('id, title, text, icon, href, bgcolor, accentcolor')
        .eq('auth_id', user.id)

      if (!error && data) {
        setCards(data)
      }
      setLoading(false)
    }

    fetchCards()
  }, [user])

  const handleChange = (index: number, field: keyof NeonCard, value: string) => {
    const updated = [...cards]
    updated[index][field] = value
    setCards(updated)
  }

  const handleAddCard = () => {
    setCards((prev) => [
      ...prev,
      {
        title: 'New Card',
        text: 'Describe this feature.',
        icon: 'FiActivity',
        href: '#',
        bgcolor: '#0c1f24',
        accentcolor: '#40E0D0',
      },
    ])
  }

  const handleRemoveCard = (index: number) => {
    const updated = [...cards]
    updated.splice(index, 1)
    setCards(updated)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    // Delete previous cards for this user
    const { error: deleteError } = await supabase.from('neon_dashboard_cards').delete().eq('auth_id', user.id)
    if (deleteError) {
      setSaving(false)
      alert('Failed to delete previous cards: ' + deleteError.message)
      return
    }

    // Insert new cards, but remove any 'id' property so Supabase can auto-generate
    const withAuthId = cards.map(card => ({
      ...card,
      auth_id: user.id,
      bgcolor: (card as any).bgColor,
      accentcolor: (card as any).accentColor
    }))
    if (withAuthId.length > 0) {
      const { error: insertError } = await supabase.from('neon_dashboard_cards').insert(withAuthId)
      if (insertError) {
        setSaving(false)
        alert('Failed to save cards: ' + insertError.message)
        return
      }
    }

    setSaving(false)
  }

  if (loading || !user) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="relative rounded-2xl bg-[#0c1f24] animate-pulse p-6 h-56 overflow-hidden"
            style={{ boxShadow: '0 0 12px #40E0D0' }}
          >
            <div className="absolute top-0 left-0 h-full w-[3px] bg-[#40E0D0]" />
            <div className="h-10 w-10 mb-4 bg-[#1b3e44] rounded-full mx-auto" />
            <div className="h-4 bg-[#1b3e44] rounded w-2/3 mx-auto mb-2" />
            <div className="h-3 bg-[#1b3e44] rounded w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mb-12">
      {editable && (
        <div className="neon-flex justify-between items-center mb-4">
          <button
            onClick={handleAddCard}
            className="neon-btn neon-btn-add"
          >
            ➕ Add Card
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`neon-btn neon-btn-submit${saving ? ' neon-btn-disabled' : ''}`}
          >
            {saving ? 'Saving...' : '💾 Save'}
          </button>
        </div>
      )}

      <div className="neon-grid-cards">
        {cards.map((card, i) => {
          const IconComponent = (FiIcons as any)[card.icon] || FiIcons.FiActivity

          return (
            <div
              key={i}
              className="neon-feature-card relative text-center transition hover:scale-[1.02] overflow-hidden"
              style={{
                backgroundColor: card.bgcolor || '',
                boxShadow: '0 0 12px var(--neon)',
              }}
            >
              <div
                className="neon-feature-card-accent absolute top-0 left-0 h-full"
                style={{
                  width: '3px',
                  backgroundColor: card.accentcolor || 'var(--neon)',
                }}
              />

              <div className="p-4">
                {editable && (
                  <button
                    onClick={() => handleRemoveCard(i)}
                    className="neon-btn neon-btn-delete absolute top-2 right-2 text-sm px-2 py-1"
                  >
                    ✖
                  </button>
                )}

                <div className="neon-feature-card-icon text-5xl mb-4 mt-4">
                  <IconComponent />
                </div>

                {editable ? (
                  <>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => handleChange(i, 'title', e.target.value)}
                      className="neon-input neon-feature-card-title w-full text-center mb-2"
                      placeholder="Card Title"
                    />
                    <textarea
                      value={card.text}
                      onChange={(e) => handleChange(i, 'text', e.target.value)}
                      className="neon-input neon-feature-card-text w-full mb-2"
                      rows={2}
                      placeholder="Card description"
                    />
                    <input
                      type="text"
                      value={card.href}
                      onChange={(e) => handleChange(i, 'href', e.target.value)}
                      className="neon-input w-full mb-2"
                      placeholder="Link URL"
                    />
                    <select
                      value={card.icon}
                      onChange={(e) => handleChange(i, 'icon', e.target.value)}
                      className="neon-input w-full mb-2"
                    >
                      {iconNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <div className="neon-flex items-center justify-between gap-2 mb-2">
                      <label className="neon-label text-sm">Background</label>
                      <input
                        type="color"
                        value={card.bgcolor || '#0c1f24'}
                        onChange={(e) => handleChange(i, 'bgcolor', e.target.value)}
                        className="neon-input neon-color-input w-10 h-8"
                      />
                    </div>

                    <div className="neon-flex items-center justify-between gap-2 mb-4">
                      <label className="neon-label text-sm">Accent</label>
                      <input
                        type="color"
                        value={card.accentcolor || '#40E0D0'}
                        onChange={(e) => handleChange(i, 'accentcolor', e.target.value)}
                        className="neon-input neon-color-input w-10 h-8"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="neon-feature-card-title mb-1">{card.title}</h3>
                    <p className="neon-feature-card-text" style={{whiteSpace: 'pre-line'}}>{card.text}</p>
                    <a href={card.href} className="neon-link block mt-4 text-sm">
                      Go
                    </a>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
