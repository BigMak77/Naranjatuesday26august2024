import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";
import CreateTask from "@/components/tasks/CreateTask";
import FolderTabs from "@/components/FolderTabs";
import { FiList, FiPlus, FiArchive, FiEdit } from "react-icons/fi";
import NeonIconButton from "@/components/ui/NeonIconButton";
import EditTaskStages from "@/components/tasks/EditTaskStages";
import AddTaskStepsModal from "@/components/tasks/AddTaskStepsModal";
import AssignTask from "@/components/tasks/AssignTask";
import { useUser } from "@/lib/useUser";

interface Task {
  id: string;
  title: string;
  area: string;
  frequency: string;
  instructions?: string;
  department: string;
  created_date?: string;
  task_type?: string;
  archived?: boolean;
  status?: string;
}

export default function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editStepsTaskId, setEditStepsTaskId] = useState<string | null>(null);
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null);

  // Types for assigned tasks
  interface AssignedTaskRow {
    id: string;
    status: string;
    assigned_to: string;
    assigned_by: string;
    task_id: string;
    assigned_to_user?: { first_name?: string; last_name?: string; email?: string };
    assigned_by_user?: { first_name?: string; last_name?: string; email?: string };
    task?: { id: string; title?: string; task_type?: string };
  }

  // Fetch assigned tasks from task_assignment table, joining users and tasks
  const [assignedTasks, setAssignedTasks] = useState<AssignedTaskRow[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedError, setAssignedError] = useState<string | null>(null);

  const { user, loading: userLoading } = useUser();

  // Add state for progress data
  const [progressRows, setProgressRows] = useState<any[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Add state for non-conformances
  const [nonConformances, setNonConformances] = useState<any[]>([]);
  const [ncLoading, setNcLoading] = useState(false);
  const [ncError, setNcError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("task")
      .select("id, title, area, frequency, instructions, created_date, department:department_id(name), task_type, archived, status")
      .order("created_date", { ascending: true });
    if (error) setError(error.message);
    setTasks((data || [])
      .filter((t: any) => !t.archived)
      .map((t: any) => ({
        ...t,
        department: t.department?.name || ""
      })));
    setLoading(false);
  };

  // New: fetch only unassigned tasks for assign tab
  const fetchUnassignedTasks = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("task")
      .select("id, title, area, frequency, instructions, created_date, department:department_id(name), task_type, archived, status")
      .order("created_date", { ascending: true })
      .or('status.is.null,status.eq.unassigned');
    if (error) setError(error.message);
    setTasks((data || [])
      .filter((t: any) => !t.archived)
      .map((t: any) => ({
        ...t,
        department: t.department?.name || ""
      })));
    setLoading(false);
  };

  const fetchAssignedTasks = async () => {
    setAssignedLoading(true);
    setAssignedError(null);
    // Fetch assignments and join user and task info manually
    const { data, error } = await supabase
      .from('task_assignments')
      .select('id, status, assigned_to, assigned_by, task_id')
      .order('id', { ascending: false });
    if (error) {
      setAssignedError(error.message);
      setAssignedLoading(false);
      return;
    }
    // Get all unique user and task ids
    const userIds = Array.from(new Set([
      ...data.map((a: any) => a.assigned_to),
      ...data.map((a: any) => a.assigned_by)
    ].filter(Boolean)));
    const taskIds = Array.from(new Set(data.map((a: any) => a.task_id).filter(Boolean)));
    // Fetch users
    const { data: users } = userIds.length
      ? await supabase.from('users').select('auth_id, first_name, last_name, email').in('auth_id', userIds)
      : { data: [] };
    // Fetch tasks
    const { data: tasks } = taskIds.length
      ? await supabase.from('task').select('id, title, task_type').in('id', taskIds)
      : { data: [] };
    // Map for lookup
    const userMap = new Map((users || []).map((u: any) => [u.auth_id, u]));
    const taskMap = new Map((tasks || []).map((t: any) => [t.id, t]));
    // Compose rows
    setAssignedTasks(
      (data || []).map((a: any) => ({
        ...a,
        assigned_to_user: userMap.get(a.assigned_to),
        assigned_by_user: userMap.get(a.assigned_by),
        task: taskMap.get(a.task_id)
      }))
    );
    setAssignedLoading(false);
  };

  // Fetch all assignments and their step progress
  const fetchProgressRows = async () => {
    setProgressLoading(true);
    setProgressError(null);
    try {
      // Fetch all assignments
      const { data: assignments, error: assignErr } = await supabase
        .from('task_assignments')
        .select('id, status, assigned_to, task_id');
      if (assignErr) throw assignErr;
      if (!assignments || assignments.length === 0) {
        setProgressRows([]);
        setProgressLoading(false);
        return;
      }
      // Get all unique user and task ids
      const userIds = Array.from(new Set(assignments.map((a: any) => a.assigned_to).filter(Boolean)));
      const taskIds = Array.from(new Set(assignments.map((a: any) => a.task_id).filter(Boolean)));
      // Fetch users
      const { data: users } = userIds.length
        ? await supabase.from('users').select('auth_id, first_name, last_name, email').in('auth_id', userIds)
        : { data: [] };
      // Fetch tasks
      const { data: tasks } = taskIds.length
        ? await supabase.from('task').select('id, title, task_type').in('id', taskIds)
        : { data: [] };
      // Fetch all assignment steps
      const assignmentIds = assignments.map((a: any) => a.id);
      const { data: steps } = assignmentIds.length
        ? await supabase.from('task_assignment_step').select('task_assignment_id, status').in('task_assignment_id', assignmentIds)
        : { data: [] };
      // Map for lookup
      const userMap = new Map((users || []).map((u: any) => [u.auth_id, u]));
      const taskMap = new Map((tasks || []).map((t: any) => [t.id, t]));
      // Group steps by assignment
      const stepsByAssignment: Record<string, { total: number; completed: number }> = {};
      (steps || []).forEach((s: any) => {
        if (!stepsByAssignment[s.task_assignment_id]) stepsByAssignment[s.task_assignment_id] = { total: 0, completed: 0 };
        stepsByAssignment[s.task_assignment_id].total++;
        if (s.status === 'completed') stepsByAssignment[s.task_assignment_id].completed++;
      });
      // Compose rows
      setProgressRows(
        (assignments || []).map((a: any) => ({
          ...a,
          assigned_to_user: userMap.get(a.assigned_to),
          task: taskMap.get(a.task_id),
          stepsCompleted: stepsByAssignment[a.id]?.completed || 0,
          stepsTotal: stepsByAssignment[a.id]?.total || 0,
        }))
      );
    } catch (err: any) {
      setProgressError(err.message || 'Failed to load progress');
    }
    setProgressLoading(false);
  };

  const fetchNonConformances = async () => {
    setNcLoading(true);
    setNcError(null);
    try {
      // Fetch non-conformances, join with users and steps for display
      const { data: nc, error: ncErr } = await supabase
        .from('non_conformances')
        .select('id, description, status, task_assignment_step_id, reported_by');
      if (ncErr) throw ncErr;
      if (!nc || nc.length === 0) {
        setNonConformances([]);
        setNcLoading(false);
        return;
      }
      // Get unique user and step ids
      const userIds = Array.from(new Set(nc.map((n: any) => n.reported_by).filter(Boolean)));
      const stepIds = Array.from(new Set(nc.map((n: any) => n.task_assignment_step_id).filter(Boolean)));
      // Fetch users
      const { data: users } = userIds.length
        ? await supabase.from('users').select('auth_id, first_name, last_name, email').in('auth_id', userIds)
        : { data: [] };
      // Fetch steps (join to get step description)
      const { data: steps } = stepIds.length
        ? await supabase.from('task_assignment_step').select('id, task_step_id').in('id', stepIds)
        : { data: [] };
      // Fetch step descriptions from task_step
      const taskStepIds = Array.from(new Set((steps || []).map((s: any) => s.task_step_id).filter(Boolean)));
      const { data: taskSteps } = taskStepIds.length
        ? await supabase.from('task_step').select('id, description').in('id', taskStepIds)
        : { data: [] };
      // Map for lookup
      const userMap = new Map((users || []).map((u: any) => [u.auth_id, u]));
      const stepMap = new Map((steps || []).map((s: any) => [s.id, s]));
      const taskStepMap = new Map((taskSteps || []).map((ts: any) => [ts.id, ts]));
      // Compose rows
      setNonConformances(
        (nc || []).map((n: any) => {
          const step = stepMap.get(n.task_assignment_step_id);
          const taskStep = step ? taskStepMap.get(step.task_step_id) : null;
          return {
            ...n,
            reported_by_user: userMap.get(n.reported_by),
            stepDescription: taskStep?.description || '-',
          };
        })
      );
    } catch (err: any) {
      setNcError(err.message || 'Failed to load non-conformances');
    }
    setNcLoading(false);
  };

  useEffect(() => {
    if (activeTab === "assign") {
      fetchUnassignedTasks();
    } else if (activeTab === "assigned") {
      fetchAssignedTasks();
    } else if (activeTab === "progress") {
      fetchProgressRows();
    } else if (activeTab === "nonconformances") {
      fetchNonConformances();
    } else {
      fetchTasks();
    }
  }, [activeTab]);

  const handleTaskCreated = () => {
    fetchTasks();
  };

  const handleArchive = async (taskId: string) => {
    // Archive the task by setting an 'archived' flag in the DB
    const { error } = await supabase
      .from("task")
      .update({ archived: true })
      .eq("id", taskId);
    if (error) {
      alert("Failed to archive task: " + error.message);
    } else {
      fetchTasks();
    }
  };

  const handleEditTask = (taskId: string) => {
    setEditTaskId(taskId);
  };

  const handleEditSteps = (taskId: string) => {
    setEditStepsTaskId(taskId);
  };

  const handleAssigned = () => {
    setAssignTaskId(null);
    // If on assign tab, re-fetch unassigned tasks only
    if (activeTab === "assign") {
      fetchUnassignedTasks();
    } else {
      fetchTasks();
    }
  };

  return (
    <NeonPanel className="neon-form-padding max-w-3xl mx-auto">
      <FolderTabs
        tabs={[
          { label: "All Tasks", key: "all", icon: <FiList /> },
          { label: "Create Task", key: "create", icon: <FiPlus /> },
          { label: "Edit Task", key: "edit", icon: <FiList /> },
          { label: "Assign Task", key: "assign", icon: <FiArchive /> },
          { label: "Assigned Tasks", key: "assigned", icon: <FiEdit /> },
          { label: "Task Progress", key: "progress", icon: <FiList /> },
          { label: "Non-Conformances", key: "nonconformances", icon: <FiArchive /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        toolbar={<div style={{ opacity: 0.7, fontSize: '0.875rem' }}>Task Management</div>}
      />
      <div className="mt-6">
        {activeTab === "nonconformances" ? (
          ncLoading ? (
            <div>Loading non-conformances...</div>
          ) : ncError ? (
            <div className="neon-error">{ncError}</div>
          ) : (
            <NeonTable
              columns={[
                { header: "Description", accessor: "description" },
                { header: "Status", accessor: "status", render: (v) => typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1) : "-" },
                { header: "Related Step", accessor: "stepDescription" },
                { header: "Reported By", accessor: "reported_by_user", render: (v) => {
                  if (v && typeof v === 'object') {
                    const fn = (v as any).first_name;
                    const ln = (v as any).last_name;
                    return [fn, ln].filter(Boolean).join(' ') || '';
                  }
                  return '';
                } },
              ]}
              data={nonConformances as Record<string, unknown>[]}
            />
          )
        ) : activeTab === "assigned" ? (
          assignedLoading ? (
            <div>Loading assigned tasks...</div>
          ) : assignedError ? (
            <div className="neon-error">{assignedError}</div>
          ) : (
            <NeonTable
              columns={[
                { header: "Task Title", accessor: "task.title", render: (_v, row) => (row as any)?.task?.title || "(untitled)" },
                { header: "Type", accessor: "task_type", render: (_v, row) => (row as any)?.task?.task_type || "-" },
                { header: "Assigned To", accessor: "assigned_to_user", render: (v) => {
                  if (v && typeof v === 'object') {
                    const fn = (v as any).first_name;
                    const ln = (v as any).last_name;
                    return [fn, ln].filter(Boolean).join(' ') || '';
                  }
                  return '';
                } },
                { header: "Assigned By", accessor: "assigned_by_user", render: (v) => {
                  if (v && typeof v === 'object') {
                    const fn = (v as any).first_name;
                    const ln = (v as any).last_name;
                    return [fn, ln].filter(Boolean).join(' ') || '';
                  }
                  return '';
                } },
              ]}
              data={assignedTasks as any[]}
            />
          )
        ) : activeTab === "progress" ? (
          progressLoading ? (
            <div>Loading progress...</div>
          ) : progressError ? (
            <div className="neon-error">{progressError}</div>
          ) : (
            <NeonTable
              columns={[
                { header: "Task Title", accessor: "task.title", render: (_v, row) => (row as any)?.task?.title || "(untitled)" },
                { header: "Type", accessor: "task_type", render: (_v, row) => (row as any)?.task?.task_type || "-" },
                { header: "Assigned To", accessor: "assigned_to_user", render: (v) => {
                  if (v && typeof v === 'object') {
                    const fn = (v as any).first_name;
                    const ln = (v as any).last_name;
                    return [fn, ln].filter(Boolean).join(' ') || '';
                  }
                  return '';
                } },
                { header: "Status", accessor: "status", render: (v) => typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1) : "-" },
                { header: "Progress", accessor: "progress", render: (_v, row) => `${(row as any).stepsCompleted}/${(row as any).stepsTotal}` },
              ]}
              data={progressRows as Record<string, unknown>[]}
            />
          )
        ) : activeTab === "all" ? (
          loading ? (
            <div>Loading tasks...</div>
          ) : error ? (
            <div className="neon-error">{error}</div>
          ) : (
            <NeonTable
              columns={[
                { header: "Title", accessor: "title" },
                { header: "Area", accessor: "area" },
                { header: "Frequency", accessor: "frequency" },
                { header: "Department", accessor: "department" },
                { header: "Created", accessor: "created_date", render: (v) => {
                  if (!v || typeof v !== "string") return "";
                  const d = new Date(v);
                  if (isNaN(d.getTime())) return v;
                  return d.toLocaleDateString("en-GB"); // dd/mm/yyyy
                } },
                { header: "Status", accessor: "status", render: (v) => {
                  if (!v) return "Unassigned";
                  if (typeof v === "string") return v.charAt(0).toUpperCase() + v.slice(1);
                  return JSON.stringify(v);
                } },
              ]}
              data={tasks.map(t => ({ ...t })) as Record<string, unknown>[]}
            />
          )
        ) : activeTab === "create" ? (
          <CreateTask onCreated={handleTaskCreated} />
        ) : activeTab === "assign" ? (
          <>
            <NeonTable
              columns={[
                { header: "Title", accessor: "title" },
                { header: "Type", accessor: "task_type" },
                { header: "Assign", accessor: "assign", render: (_: any, row: any) => (
                  <NeonIconButton
                    variant="assign"
                    title="Assign Task"
                    onClick={() => setAssignTaskId(row.id)}
                  />
                ) },
              ]}
              data={tasks.map(t => ({ ...t })) as Record<string, unknown>[]}
            />
            {assignTaskId && activeTab === "assign" && (
              <AssignTask
                taskId={assignTaskId}
                onClose={() => setAssignTaskId(null)}
                onAssigned={handleAssigned}
              />
            )}
          </>
        ) : (
          <>
            <NeonTable
              columns={[
                { header: "Title", accessor: "title" },
                { header: "Type", accessor: "task_type" },
                { header: "Actions", accessor: "actions", render: (_: any, row: any) => (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <NeonIconButton
                      variant="archive"
                      title="Archive Task"
                      onClick={() => handleArchive(row.id)}
                    />
                    <NeonIconButton
                      variant="edit"
                      title="Edit Task"
                      onClick={() => handleEditTask(row.id)}
                    />
                    <NeonIconButton
                      variant="view"
                      title="Edit Steps"
                      onClick={() => handleEditSteps(row.id)}
                    />
                  </div>
                ) },
              ]}
              data={tasks.map(t => ({ ...t })) as Record<string, unknown>[]}
            />
            {editTaskId && (
              <EditTaskStages
                taskId={editTaskId}
                onClose={() => setEditTaskId(null)}
                onSaved={fetchTasks}
              />
            )}
            {editStepsTaskId && (
              <AddTaskStepsModal
                open={!!editStepsTaskId}
                onClose={() => setEditStepsTaskId(null)}
                taskId={editStepsTaskId}
                onStepsSaved={() => {
                  setEditStepsTaskId(null);
                  fetchTasks();
                }}
              />
            )}
          </>
        )}
      </div>
    </NeonPanel>
  );
}
