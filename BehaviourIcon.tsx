import React from "react";

interface BehaviourIconProps {
  behaviour: {
    id: string;
    name: string;
    icon: string;
  };
  selected: boolean;
  onClick: (id: string) => void;
}

export default function BehaviourIcon({ behaviour, selected, onClick }: BehaviourIconProps) {
  return (
    <div
      className={`behaviour-icon ${selected ? "selected" : ""}`}
      onClick={() => onClick(behaviour.id)}
      style={{
        cursor: "pointer",
        padding: "0.5rem",
        textAlign: "center",
        transition: "all 0.2s",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>
        {behaviour.icon}
      </div>
      <div style={{ fontSize: "0.875rem" }}>{behaviour.name}</div>
    </div>
  );
}
