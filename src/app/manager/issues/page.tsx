import DepartmentIssuesWidget from '@/components/manager/DepartmentIssuesWidget'
import DepartmentIssueAssignmentsWidget from '@/components/manager/DepartmentIssueAssignmentsWidget'
import { FiAlertCircle } from 'react-icons/fi' // Add Fi icon import

export default function ManagerIssuesPage() {
  return (
    <main className="min-h-screen bg-[#011f24] text-white pb-10">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <DepartmentIssuesWidget />
        </div>
        <div className="mb-8">
          <DepartmentIssueAssignmentsWidget />
        </div>
      </div>
    </main>
  )
}