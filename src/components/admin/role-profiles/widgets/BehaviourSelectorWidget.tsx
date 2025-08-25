// components/role-profiles/widgets/BehaviourSelectorWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@radix-ui/react-tooltip";
import * as FiIcons from "react-icons/fi";
import NeonPanel from "@/components/NeonPanel";

interface Behaviour {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof FiIcons;
}

type Props = {
  selectedBehaviours: string[];
  onChange: (ids: string[]) => void;
};

export default function BehaviourSelectorWidget({
  selectedBehaviours,
  onChange,
}: Props) {
  const [behaviours, setBehaviours] = useState<Behaviour[]>([]);
  const [showBehaviours, setShowBehaviours] = useState(false);

  useEffect(() => {
    const fetchBehaviours = async () => {
      const { data, error } = await supabase
        .from("behaviours")
        .select("id, name, description, icon");
      if (error) {
        console.error("Error fetching behaviours:", error);
        return;
      }
      if (data) setBehaviours(data);
    };
    fetchBehaviours();
  }, []);

  const toggleBehaviour = (id: string) => {
    if (selectedBehaviours.includes(id)) {
      onChange(selectedBehaviours.filter((bid) => bid !== id));
    } else if (selectedBehaviours.length < 5) {
      onChange([...selectedBehaviours, id]);
    }
  };

  return (
    <NeonPanel className="space-y-4">
      <button
        type="button"
        className="neon-btn neon-section-toggle"
        data-tooltip={showBehaviours ? "Hide Behaviours" : "Show Behaviours"}
        onClick={() => setShowBehaviours((v) => !v)}
        aria-label={showBehaviours ? "Hide Behaviours" : "Show Behaviours"}
      >
        {showBehaviours ? (
          <FiIcons.FiMinus className="neon-icon" />
        ) : (
          <FiIcons.FiPlus className="neon-icon" />
        )}
      </button>
      {showBehaviours && (
        <div className="neon-grid">
          <TooltipProvider>
            {behaviours.map((b) => {
              const Icon = FiIcons[b.icon] || FiIcons.FiHelpCircle;
              const selected = selectedBehaviours.includes(b.id);
              return (
                <Tooltip key={b.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => toggleBehaviour(b.id)}
                      className={`neon-btn neon-behaviour-btn${selected ? " selected" : ""}`}
                      data-tooltip={b.name}
                      aria-label={b.name}
                    >
                      <Icon className="neon-icon" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="neon-tooltip">{b.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      )}
    </NeonPanel>
  );
}
