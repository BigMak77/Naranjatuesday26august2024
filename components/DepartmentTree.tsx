// components/DepartmentTree.tsx
import React from 'react'

interface Department {
  id: string
  name: string
  parent_id: string | null
}

interface Role {
  id: string
  title: string
  department_id: string
}

interface TreeNode extends Department {
  children: TreeNode[]
}

interface Props {
  departments: Department[]
  roles: Role[]
}

function buildTree(departments: Department[]): TreeNode[] {
  const map: { [key: string]: TreeNode } = {}
  const roots: TreeNode[] = []

  departments.forEach((dept) => {
    map[dept.id] = { ...dept, children: [] }
  })

  departments.forEach((dept) => {
    if (dept.parent_id) {
      map[dept.parent_id]?.children.push(map[dept.id])
    } else {
      roots.push(map[dept.id])
    }
  })

  return roots
}

const DepartmentTree: React.FC<Props> = ({ departments, roles }) => {
  const tree = buildTree(departments)

  const renderTree = (nodes: TreeNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="ml-4 border-l border-gray-300 pl-4 mt-2">
        <div className="font-medium text-teal-800">
          {'—'.repeat(level)} {node.name}
        </div>
        <ul className="text-sm text-gray-600 ml-4">
          {roles
            .filter((r) => r.department_id === node.id)
            .map((r) => (
              <li key={r.id} className="list-disc ml-4">
                {r.title}
              </li>
            ))}
        </ul>
        {node.children.length > 0 && renderTree(node.children, level + 1)}
      </div>
    ))
  }

  return <div>{renderTree(tree)}</div>
}

export default DepartmentTree
