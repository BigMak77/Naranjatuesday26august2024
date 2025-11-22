"use client";
import TaskDashboard from "@/components/tasks/TaskDashboard";
import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";

export default function TasksPage() {
  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "HR Admin", "Dept. Manager", "Manager"]}
      redirectOnNoAccess={true}
      noAccessMessage="Manager or Admin access required. Redirecting to your dashboard..."
    >
      <ContentHeader
        title="Task Management"
        description="Create, assign, and track tasks across your organization"
      />
      <TaskDashboard />
    </AccessControlWrapper>
  );
}
