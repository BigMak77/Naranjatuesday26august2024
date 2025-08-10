'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useUser } from '@/lib/useUser'
import { FiRepeat } from 'react-icons/fi' // Add Fi icon import
import NeonTable from '@/components/NeonTable'

export default function RecurringTaskList() {
  const { user } = useUser()
  const [recurring, setRecurring] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user?.auth_id) return

      const { data: userMeta, error: userError } = await supabase
        .from('users')
        .select('department_id')
        .eq('auth_id', user.auth_id)
        .single()

      if (userError || !userMeta?.department_id) {
        setError('Could not determine your department.')
        setLoading(false)
        return
      }

      const { data, error: recurringError } = await supabase
        .from('recurring_assignments')
        .select(`
          id,
          frequency,
          interval_count,
          next_due_at,
          turkus_tasks (
            id,
            title
          )
        `)
        .eq('department_id', userMeta.department_id)

      if (recurringError) {
        setError('Failed to load recurring tasks.')
        console.error(recurringError)
      } else {
        setRecurring(data || [])
      }

      setLoading(false)
    }

    load()
  }, [user])

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2">
        <FiRepeat /> Recurring Tasks
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : recurring.length === 0 ? (
        <p className="text-gray-600">No recurring tasks found.</p>
      ) : (
        <NeonTable
          columns={[
            { header: 'Task', accessor: 'task' },
            { header: 'Frequency', accessor: 'frequency' },
            { header: 'Interval', accessor: 'interval' },
            { header: 'Next Due', accessor: 'next_due' },
          ]}
          data={recurring.map((r) => ({
            task: r.turkus_tasks?.title || 'Unknown Task',
            frequency: r.frequency,
            interval: r.interval_count,
            next_due: r.next_due_at
              ? new Date(r.next_due_at).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '—',
          }))}
        />
      )}
    </div>
  )
}
