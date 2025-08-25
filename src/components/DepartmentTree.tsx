// components/DepartmentTree.tsx
import React from "react";

interface Department {
  id: string;
  name: string;
  parent_id: string | null;
}

interface Role {
  id: string;
  title: string;
  department_id: string;
}

interface TreeNode extends Department {
  children: TreeNode[];
}

interface Props {
  departments: Department[];
  roles: Role[];
}

function buildTree(departments: Department[]): TreeNode[] {
  const map: { [key: string]: TreeNode } = {};
  const roots: TreeNode[] = [];

  departments.forEach((dept) => {
    map[dept.id] = { ...dept, children: [] };
  });

  departments.forEach((dept) => {
    if (dept.parent_id) {
      map[dept.parent_id]?.children.push(map[dept.id]);
    } else {
      roots.push(map[dept.id]);
    }
  });

  return roots;
}

const DepartmentTree: React.FC<Props> = ({ departments, roles }) => {
  const tree = buildTree(departments);

  const renderTree = (nodes: TreeNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="department-tree-node">
        <div
          className="department-tree-department"
          style={{ marginLeft: level ? `${level * 1.5}rem` : undefined }}
        >
          <span className="department-tree-department-name">
            {"—".repeat(level)} {node.name}
          </span>
        </div>
        <ul className="department-tree-role-list">
          {roles
            .filter((r) => r.department_id === node.id)
            .map((r) => (
              <li key={r.id} className="department-tree-role-item">
                {r.title}
              </li>
            ))}
        </ul>
        {node.children.length > 0 && renderTree(node.children, level + 1)}
      </div>
    ));
  };

  return <div className="department-tree-root">{renderTree(tree)}</div>;
};

export default DepartmentTree;
