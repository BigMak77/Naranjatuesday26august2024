// components/SubmissionsTab.tsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import NeonPanel from '@/components/NeonPanel'

export default function SubmissionsTab() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('audit_submissions')
        .select('id, template_id, auth_id, submitted_at, status, notes')
        .order('submitted_at', { ascending: false })
      if (error) {
        console.error('Error loading submissions:', error.message)
      } else {
        setSubmissions(data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <NeonPanel bgColor="#012f34" glowColor="#40E0D0" className="submissions-tab-panel">
      <h3 className="submissions-tab-title">Audit Submissions</h3>
      {loading ? (
        <p className="submissions-tab-loading-msg">Loading...</p>
      ) : submissions.length === 0 ? (
        <p className="submissions-tab-empty-msg">No submissions yet.</p>
      ) : (
        <ul className="submissions-tab-list">
          {submissions.map((s: any) => (
            <li key={s.id} className="submissions-tab-list-item">
              <div className="submissions-tab-list-item-content">
                <p><strong>Submission ID:</strong> {s.id}</p>
                <p><strong>Template ID:</strong> {s.template_id}</p>
                <p><strong>User ID:</strong> {s.auth_id}</p>
                <p><strong>Status:</strong> {s.status || 'Unknown'}</p>
                <p><strong>Submitted At:</strong> {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'Not submitted'}</p>
                {s.notes && <p><strong>Notes:</strong> {s.notes}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </NeonPanel>
  )
}
