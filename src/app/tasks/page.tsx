'use client'

import React from 'react'
import MyTasks from '@/components/task/MyTasksWidget'

export default function TurkusTasksPage() {
  return (
    <main className="min-h-screen bg-gradient-to-tr from-teal-50 via-white to-orange-50 text-teal-900">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow-md p-6">
          <MyTasks />
        </div>
      </div>
    </main>
  )
}
