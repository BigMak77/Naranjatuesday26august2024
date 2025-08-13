'use client'

import React from 'react'
import MyTasks from '@/components/task/MyTasksWidget'

export default function TurkusTasksPage() {
  return (
    <div className="after-hero">
      <div className="page-content">
        <main className="page-main">
          <MyTasks />
        </main>
      </div>
    </div>
  )
}
