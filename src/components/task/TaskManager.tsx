'use client'

import React from 'react'
import TaskListWidget from '@/components/task/TaskListWidget'
import TaskAssignmentWidget from '@/components/task/TaskAssignmentWidget'
import TaskCreateWidget from '@/components/task/TaskCreateWidget'
import TaskAmendWidget from '@/components/task/TaskAmendWidget'
import MyTasksWidget from '@/components/task/MyTasksWidget'
import {
  FiList,
  FiUserPlus,
  FiEdit,
  FiTool,
  FiClipboard,
} from 'react-icons/fi'
import { UserProvider } from '@/context/UserContext'

const widgetSections = [
  {
    title: 'All Tasks',
    icon: <FiList />,
    Component: TaskListWidget,
  },
  {
    title: 'Assign Tasks',
    icon: <FiUserPlus />,
    Component: TaskAssignmentWidget,
  },
  {
    title: 'Create Task',
    icon: <FiEdit />,
    Component: TaskCreateWidget,
  },
  {
    title: 'Amend Tasks',
    icon: <FiTool />,
    Component: TaskAmendWidget,
  },
  {
    title: 'My Tasks',
    icon: <FiClipboard />,
    Component: MyTasksWidget,
  },
]

export default function TaskManager() {
  return (
    <UserProvider>
      <main className="neon-main">
        <div className="neon-container space-y-10">
          {widgetSections.map(({ title, icon, Component }, idx) => (
            <section
              key={idx}
              className="neon-panel"
            >
              <div className="neon-flex items-center gap-4 mb-4">
                <div className="neon-icon-bg text-2xl">
                  {icon}
                </div>
                <h2 className="neon-section-title">
                  {title}
                </h2>
              </div>
              <Component />
            </section>
          ))}
        </div>
      </main>
    </UserProvider>
  )
}
