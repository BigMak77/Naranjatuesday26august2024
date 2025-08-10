import { FiClipboard } from 'react-icons/fi' // Import Fi icon

export default function ManagerRisksPage() {
  return (
    <main className="min-h-screen p-10 bg-white text-teal-900">
      <h1 className="text-2xl font-bold text-orange-600 mb-4 flex items-center gap-2">
        <FiClipboard /> My Risk Assessments
      </h1>
      <p>This page will show risk assessments assigned to you and your team.</p>
    </main>
  )
}


