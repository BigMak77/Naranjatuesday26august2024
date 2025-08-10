'use client'

import TaskManager from '@/components/task/TaskManager'
import { UserProvider } from '@/context/UserContext'

export default function ManagerTasksPage() {
  return (
    <main className="min-h-screen bg-background text-neon py-10">
      <UserProvider>
        <TaskManager />
      </UserProvider>
    </main>
  )
}
