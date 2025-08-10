import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import HeroHeader from '@/components/HeroHeader'
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
    <main className="min-h-screen bg-[#011f24] text-white">
      <HeroHeader
        title="Recognised First Aiders"
        titleIcon={<FiHeart />}
        subtitle="View and print a list of recognised first aiders by department."
      />
      <div className="max-w-2xl mx-auto py-10">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <label className="font-semibold text-[#40E0D0]">Department:
            <select
              className="ml-2 p-2 rounded bg-[#011f24] border border-[#40E0D0] text-white"
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
            className="px-4 py-2 rounded bg-[#40E0D0] text-black font-bold hover:bg-orange-400 transition print:hidden"
          >
            Print / Save as PDF
          </button>
        </div>
        <div className="bg-[#0c1f24] p-6 rounded-xl shadow border border-[#40E0D0]">
          {loading ? (
            <p className="text-[#40E0D0]">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-[#40E0D0]">No first aiders found for this department.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="text-[#40E0D0] border-b border-[#40E0D0]">
                <tr>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Department</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(fa => (
                  <tr key={fa.id} className="border-b border-[#024747]">
                    <td className="px-4 py-2">{fa.first_name} {fa.last_name}</td>
                    <td className="px-4 py-2">{fa.department?.name || '—'}</td>
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
