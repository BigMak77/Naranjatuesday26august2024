"use client";

import NeonIconButton from "@/components/ui/NeonIconButton";

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    area: string;
    frequency: string;
  };
  onEdit: (id: string) => void;
}

export default function TaskItem({ task, onEdit }: TaskItemProps) {
  return (
    <li className="task-list-item">
      <div className="task-list-item-content">
        <h2 className="task-list-item-title">{task.title}</h2>
        <p className="task-list-item-meta">
          {task.area} · {task.frequency}
        </p>
      </div>
      <NeonIconButton
        variant="edit"
        title="Amend Task"
        onClick={() => onEdit(task.id)}
        className="task-list-item-action"
      />
    </li>
  );
}
