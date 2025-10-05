import React, { useState } from 'react';

// Type definition for a tree node
type TreeNode = {
  id: string;
  name: string;
  children?: TreeNode[];
};

// Mock data structure for demonstration
const mockTree: TreeNode = {
  id: 'root',
  name: 'Company',
  children: [
    {
      id: 'dept1',
      name: 'Department 1',
      children: [
        { id: 'team1', name: 'Team 1', children: [
          { id: 'squad1', name: 'Squad 1', children: [] },
          { id: 'squad2', name: 'Squad 2', children: [] },
        ] },
        { id: 'team2', name: 'Team 2', children: [] },
      ],
    },
    {
      id: 'dept2',
      name: 'Department 2',
      children: [
        { id: 'team3', name: 'Team 3', children: [
          { id: 'squad3', name: 'Squad 3', children: [] },
          { id: 'squad4', name: 'Squad 4', children: [] },
        ] },
        { id: 'team4', name: 'Team 4', children: [] },
      ],
    },
    {
      id: 'dept3',
      name: 'Department 3',
      children: [
        { id: 'team5', name: 'Team 5', children: [
          { id: 'squad5', name: 'Squad 5', children: [] },
        ] },
        { id: 'team6', name: 'Team 6', children: [] },
        { id: 'team7', name: 'Team 7', children: [] },
      ],
    },
    {
      id: 'dept4',
      name: 'Department 4',
      children: [
        { id: 'team8', name: 'Team 8', children: [] },
        { id: 'team9', name: 'Team 9', children: [
          { id: 'squad6', name: 'Squad 6', children: [] },
          { id: 'squad7', name: 'Squad 7', children: [] },
        ] },
      ],
    },
  ],
};

interface StructureTreeProps {
  nodes: TreeNode[];
  level?: number;
}

function StructureTree({ nodes, level = 2 }: StructureTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!nodes || nodes.length === 0) return null;

  return (
    <div>
      {nodes.map((node: TreeNode) => {
        const isExpanded = expanded[node.id];
        return (
          <div key={node.id} style={{ marginLeft: (level - 2) * 24, position: 'relative', marginBottom: 8, width: 220 }}>
            <div
              onClick={() => setExpanded((prev) => ({ ...prev, [node.id]: !isExpanded }))}
              style={{
                cursor: node.children && node.children.length > 0 ? 'pointer' : 'default',
                padding: '12px 16px',
                borderRadius: 12,
                background: isExpanded ? 'rgba(0,255,255,0.08)' : 'rgba(30,30,40,0.7)',
                border: isExpanded ? '1.5px solid #00fff7' : '1.5px solid #222',
                color: '#fff',
                fontWeight: 500,
                boxShadow: isExpanded ? '0 0 12px #00fff7aa' : 'none',
                transition: 'all 0.2s',
                position: 'relative',
                zIndex: 1,
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              {node.name}
              {node.children && node.children.length > 0 && (
                <span style={{ float: 'right', opacity: 0.7, fontSize: 18 }}>
                  {isExpanded ? '−' : '+'}
                </span>
              )}
            </div>
            {/* Overlay for expanded node */}
            {isExpanded && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,255,255,0.08)',
                  borderRadius: 12,
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />
            )}
            {/* Render children if expanded */}
            {isExpanded && node.children && node.children.length > 0 && (
              <StructureTree nodes={node.children} level={level + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Main Structure component: starts at level 2 (children of root)
export default function Structure() {
  // In real usage, replace mockTree.children with your data source
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 32 }}>
      <h2 style={{ color: '#00fff7', marginBottom: 24 }}>Organisation Structure</h2>
      <StructureTree nodes={mockTree.children || []} level={2} />
    </div>
  );
}
