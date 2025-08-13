'use client'

import React from 'react'

type NeonFormProps = {
  title: string
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  children: React.ReactNode
  submitLabel?: string
  onCancel?: () => void
}

export default function NeonForm({
  title,
  onSubmit,
  children,
  submitLabel = 'Submit',
  onCancel
}: NeonFormProps) {
  return (
    <form className="neon-form" onSubmit={onSubmit}>
      <h2 className="neon-form-title">{title}</h2>
      {children}
      <div className="neon-form-actions">
        <button
          type="button"
          className="neon-btn"
          onClick={onCancel ? onCancel : () => window.history.back()}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="neon-btn"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
