'use client'

interface TaskItemProps {
  task: {
    id: string
    title: string
    area: string
    frequency: string
  }
  onEdit: (id: string) => void
}

export default function TaskItem({ task, onEdit }: TaskItemProps) {
  return (
    <li className="border border-teal-200 rounded bg-white p-4 shadow-[0_0_2px_#40E0D0] flex justify-between items-center">
      <div>
        <h2 className="font-semibold text-teal-800">{task.title}</h2>
        <p className="text-sm text-gray-500">
          {task.area} · {task.frequency}
        </p>
      </div>
      <button
        onClick={() => onEdit(task.id)}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded text-sm font-medium"
      >
        Amend
      </button>
    </li>
  )
}
