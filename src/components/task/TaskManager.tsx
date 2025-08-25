"use client";

import React from "react";
import TaskListWidget from "@/components/task/TaskListWidget";
import TaskAssignmentWidget from "@/components/task/TaskAssignmentWidget";
import TaskCreateWidget from "@/components/task/TaskCreateWidget";
import TaskAmendWidget from "@/components/task/TaskAmendWidget";
import MyTasksWidget from "@/components/task/MyTasksWidget";
import {
  FiList,
  FiUserPlus,
  FiEdit,
  FiTool,
  FiClipboard,
} from "react-icons/fi";
import { UserProvider } from "@/context/UserContext";

const widgetSections = [
  {
    title: "All Tasks",
    icon: <FiList />,
    Component: TaskListWidget,
  },
  {
    title: "Assign Tasks",
    icon: <FiUserPlus />,
    Component: TaskAssignmentWidget,
  },
  {
    title: "Create Task",
    icon: <FiEdit />,
    Component: TaskCreateWidget,
  },
  {
    title: "Amend Tasks",
    icon: <FiTool />,
    Component: TaskAmendWidget,
  },
  {
    title: "My Tasks",
    icon: <FiClipboard />,
    Component: MyTasksWidget,
  },
];

export default function TaskManager() {
  return (
    <UserProvider>
      <div>
        {widgetSections.map(({ title, icon, Component }, idx) => (
          <section key={idx}>
            <div className="neon-section-title">
              {icon} {title}
            </div>
            <Component />
          </section>
        ))}
      </div>
    </UserProvider>
  );
}
