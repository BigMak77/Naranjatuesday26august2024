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
    <NeonPanel bgColor="#012f34" glowColor="#40E0D0" className="space-y-4">
      <h3 className="text-xl font-semibold text-[#40E0D0] drop-shadow-glow">Audit Submissions</h3>
      {loading ? (
        <p className="text-[#b2f1ec]">Loading...</p>
      ) : submissions.length === 0 ? (
        <p className="text-[#b2f1ec]">No submissions yet.</p>
      ) : (
        <ul className="space-y-3">
          {submissions.map((s: any) => (
            <li key={s.id} className="border border-[#40E0D0] rounded-xl p-4 shadow-glow bg-[#011f24]">
              <div className="text-sm text-[#b2f1ec] space-y-1">
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
