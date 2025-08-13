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
      <div className="neon-dashboard-skeleton-list">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="neon-dashboard-skeleton-card"
          >
            <div className="neon-feature-card-accent" />
            <div className="neon-feature-card-skeleton-icon" />
            <div className="neon-feature-card-skeleton-title" />
            <div className="neon-feature-card-skeleton-text" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="neon-dashboard">
      {editable && (
        <div className="neon-dashboard-toolbar">
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

      <div className="neon-feature-card-list">
        {cards.map((card, i) => {
          const IconComponent = (FiIcons as Record<string, React.ComponentType<{ className?: string }>>)[card.icon] || FiIcons.FiActivity

          return (
            <div
              key={i}
              className="neon-feature-card"
              style={{
                backgroundColor: card.bgcolor || '',
                boxShadow: '0 0 12px var(--neon)',
              }}
            >
              <div
                className="neon-feature-card-accent"
                style={{
                  width: '3px',
                  backgroundColor: card.accentcolor || 'var(--neon)',
                }}
              />

              <div className="neon-feature-card-content">
                {editable && (
                  <button
                    onClick={() => handleRemoveCard(i)}
                    className="neon-btn neon-btn-delete neon-feature-card-remove-btn"
                  >
                    ✖
                  </button>
                )}

                <div className="neon-feature-card-icon">
                  <IconComponent />
                </div>

                {editable ? (
                  <>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => handleChange(i, 'title', e.target.value)}
                      className="neon-input neon-feature-card-title"
                      placeholder="Card Title"
                    />
                    <textarea
                      value={card.text}
                      onChange={(e) => handleChange(i, 'text', e.target.value)}
                      className="neon-input neon-feature-card-text"
                      rows={2}
                      placeholder="Card description"
                    />
                    <input
                      type="text"
                      value={card.href}
                      onChange={(e) => handleChange(i, 'href', e.target.value)}
                      className="neon-input"
                      placeholder="Link URL"
                    />
                    <select
                      value={card.icon}
                      onChange={(e) => handleChange(i, 'icon', e.target.value)}
                      className="neon-input"
                    >
                      {iconNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <div className="neon-feature-card-color-row">
                      <label className="neon-label">Background</label>
                      <input
                        type="color"
                        value={card.bgcolor || '#0c1f24'}
                        onChange={(e) => handleChange(i, 'bgcolor', e.target.value)}
                        className="neon-input neon-color-input"
                      />
                    </div>

                    <div className="neon-feature-card-color-row">
                      <label className="neon-label">Accent</label>
                      <input
                        type="color"
                        value={card.accentcolor || '#40E0D0'}
                        onChange={(e) => handleChange(i, 'accentcolor', e.target.value)}
                        className="neon-input neon-color-input"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="neon-feature-card-title">{card.title}</h3>
                    <p className="neon-feature-card-text" style={{whiteSpace: 'pre-line'}}>{card.text}</p>
                    <a href={card.href} className="neon-link">
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
