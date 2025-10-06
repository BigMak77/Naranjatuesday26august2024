import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

import {
  FiTarget,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiMessageSquare,
  FiZap,
  FiRepeat,
  FiEye,
  FiStar,
  FiFileText,
  FiAlertTriangle,
  FiTrash2,
  FiTrendingUp,
  FiBookOpen,
  FiHeart,
  FiPackage,
  FiAlertCircle,
  FiDatabase,
  FiUserCheck,
  FiTag,
  FiClipboard,
  FiTruck,
} from "react-icons/fi";

import {
  GiBroom,
  GiGearHammer,
  GiKnifeFork,
  GiHazardSign,
  GiWaterDrop,
  GiForklift,
  GiChemicalDrop,
  GiWrench,
  GiFactory,
} from "react-icons/gi";

// Map icon string to actual React icon components
const iconMap: Record<string, React.ReactElement> = {
  FiTarget: <FiTarget />,
  FiShield: <FiShield />,
  FiClock: <FiClock />,
  FiCheckCircle: <FiCheckCircle />,
  FiMessageSquare: <FiMessageSquare />,
  FiZap: <FiZap />,
  FiRepeat: <FiRepeat />,
  FiEye: <FiEye />,
  FiStar: <FiStar />,
  FiFileText: <FiFileText />,
  FiAlertTriangle: <FiAlertTriangle />,
  FiTrash2: <FiTrash2 />,
  FiTrendingUp: <FiTrendingUp />,
  FiBookOpen: <FiBookOpen />,
  FiHeart: <FiHeart />,
  FiPackage: <FiPackage />,
  FiAlertCircle: <FiAlertCircle />,
  FiDatabase: <FiDatabase />,
  FiUserCheck: <FiUserCheck />,
  FiTag: <FiTag />,
  FiClipboard: <FiClipboard />,
  FiTruck: <FiTruck />,
  GiBroom: <GiBroom />,
  GiGearHammer: <GiGearHammer />,
  GiKnifeFork: <GiKnifeFork />,
  GiHazardSign: <GiHazardSign />,
  GiWaterDrop: <GiWaterDrop />,
  GiForklift: <GiForklift />,
  GiChemicalDrop: <GiChemicalDrop />,
  GiWrench: <GiWrench />,
  GiFactory: <GiFactory />,
};

export interface Behaviour {
  id: string;
  name: string;
  icon: string;
}

interface BehaviourIconProps {
  behaviour: Behaviour;
  selected?: boolean;
  onClick?: (id: string) => void;
  className?: string; // <-- optional className added
}

export default function BehaviourIcon({
  behaviour,
  selected,
  onClick,
  className = "",
}: BehaviourIconProps) {
  const colorClass = selected
    ? "behaviour-icon-selected"
    : "behaviour-icon-default";

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span
            onClick={() => onClick && onClick(behaviour.id)}
            className={`behaviour-icon ${colorClass} ${className}`}
            aria-label={behaviour.name}
            role="img"
          >
            {iconMap[behaviour.icon] || <FiStar />}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content
          side="top"
          align="center"
          className="behaviour-icon-tooltip"
        >
          {behaviour.name}
          <Tooltip.Arrow className="behaviour-icon-tooltip-arrow" />
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
