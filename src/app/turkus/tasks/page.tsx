'use client'

import React from 'react'
import MyTasks from '@/components/task/MyTasksWidget'

export default function TurkusTasksPage() {
  return (
    <div className="after-hero">
      <div className="global-content">
        <main className="page-main">
          {/* Ensure MyTasksWidget is client-only and hydration-safe */}
          <MyTasks />
        </main>
      </div>
    </div>
  )
}
