"use client";
import TaskDashboard from "@/components/tasks/TaskDashboard";
import MainHeader from "@/components/ui/MainHeader";

export default function TasksPage() {
  return (
    <>
      <MainHeader
        title="Task Management"
        subtitle="Create, assign, and track tasks across your organization"
      />
      <main className="after-hero global-content">
        <TaskDashboard />
      </main>
    </>
  );
}
