import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { FiHeart } from 'react-icons/fi'

export default function FirstAiderReport() {
  const [firstAiders, setFirstAiders] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedDept, setSelectedDept] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: users } = await supabase
        .from('users')
        .select('id, first_name, last_name, departments(name), is_first_aid')
        .eq('is_first_aid', 'YES')
      // Map departments to a single object for each user
      const usersWithDept = (users || []).map(u => ({
        ...u,
        department: Array.isArray(u.departments) ? u.departments[0] : u.departments
      }))
      setFirstAiders(usersWithDept)
      const uniqueDepts = Array.from(new Set(usersWithDept.map(u => u.department?.name).filter(Boolean)))
      setDepartments(uniqueDepts)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = selectedDept === 'All'
    ? firstAiders
    : firstAiders.filter(fa => fa.department?.name === selectedDept)

  const handlePrint = () => {
    window.print()
  }

  return (
    <main className="first-aider-report-bg">
      <div className="first-aider-report-container">
        <div className="first-aider-report-toolbar">
          <label className="first-aider-report-label">Department:
            <select
              className="first-aider-report-select"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
            >
              <option value="All">All</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <button
            onClick={handlePrint}
            className="first-aider-report-print-btn"
          >
            Print / Save as PDF
          </button>
        </div>
        <div className="first-aider-report-table-wrapper">
          {loading ? (
            <p className="first-aider-report-loading">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="first-aider-report-empty">No first aiders found for this department.</p>
          ) : (
            <table className="first-aider-report-table">
              <thead className="first-aider-report-table-head">
                <tr>
                  <th className="first-aider-report-th">Name</th>
                  <th className="first-aider-report-th">Department</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(fa => (
                  <tr key={fa.id} className="first-aider-report-tr">
                    <td className="first-aider-report-td">{fa.first_name} {fa.last_name}</td>
                    <td className="first-aider-report-td">{fa.department?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}
