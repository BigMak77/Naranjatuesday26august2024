import NeonFeatureCard from "@/components/NeonFeatureCard";
import {
  FiBarChart2,
  FiGrid,
  FiPieChart,
  FiSettings,
  FiFileText,
  FiAlertTriangle,
  FiCheckCircle,
  FiShield,
  FiPlus,
} from "react-icons/fi";
import NeonIconButton from "@/components/ui/NeonIconButton";

export default function TurkusHomePage() {
  const iconSize = 20;
  const cards = [
    {
      title: "Tasks",
      icon: <FiGrid size={iconSize} />,
      text: "Manage and assign tasks.",
      href: "/turkus/tasks",
    },
    {
      title: "Assignments",
      icon: <FiSettings size={iconSize} />,
      text: "Manage Turkus assignments.",
      href: "/turkus/assignments",
    },
    {
      title: "Audit",
      icon: <FiBarChart2 size={iconSize} />,
      text: "Audit and compliance tools.",
      href: "/turkus/audit",
    },
    {
      title: "Documents",
      icon: <FiFileText size={iconSize} />,
      text: "Manage Turkus documents.",
      href: "/turkus/documents",
    },
    {
      title: "Health & Safety",
      icon: <FiShield size={iconSize} />,
      text: "Policies, incidents, and risk assessments.",
      href: "/health-safety",
    },
    {
      title: "Issues",
      icon: <FiAlertTriangle size={iconSize} />,
      text: "Track and resolve issues.",
      href: "/turkus/issues",
    },
    {
      title: "Reports",
      icon: <FiPieChart size={iconSize} />,
      text: "View and create reports.",
      href: "/turkus/reports",
    },
    {
      title: "Auditors",
      icon: <FiShield size={iconSize} />,
      text: "Manage and add auditors.",
      href: "/turkus/auditors",
    },
  ];
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <NeonFeatureCard
            key={card.title}
            icon={card.icon}
            title={card.title}
            text={card.text}
            href={card.href}
          />
        ))}
      </div>
      <div className="flex justify-center">
        <a href="/homepage/login" className="neon-btn neon-btn-primary">
          Log In
        </a>
      </div>
      <div className="flex justify-center">
        <NeonIconButton variant="add" icon={<FiPlus />} title="Add" />
      </div>
    </>
  );
}
