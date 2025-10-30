import ContentHeader from "@/components/ui/ContentHeader";
import NeonFeatureCard from "@/components/NeonFeatureCard";
import {
  FiBarChart2,
  FiGrid,
  FiPieChart,
  FiSettings,
  FiFileText,
  FiAlertTriangle,
} from "react-icons/fi";

export default function TurkusHomePage() {
  const iconSize = 20;
  const cards = [
    {
      title: "Tasks",
      icon: <FiGrid size={iconSize} />,
      text: "Manage and assign tasks.",
      href: "/turkus/tasks",
      borderColor: "#3b82f6",
    },
    {
      title: "Assignments",
      icon: <FiSettings size={iconSize} />,
      text: "Manage Turkus assignments.",
      href: "/turkus/assignments",
      borderColor: "#a855f7",
    },
    {
      title: "Audit",
      icon: <FiBarChart2 size={iconSize} />,
      text: "Audit and compliance tools.",
      href: "/turkus/audit",
      borderColor: "#22c55e",
    },
    {
      title: "Documents",
      icon: <FiFileText size={iconSize} />,
      text: "Manage Turkus documents.",
      href: "/turkus/documents",
      borderColor: "#f59e0b",
    },
    {
      title: "Issues",
      icon: <FiAlertTriangle size={iconSize} />,
      text: "Track and resolve issues.",
      href: "/turkus/issues",
      borderColor: "#ef4444",
    },
    {
      title: "Reports",
      icon: <FiPieChart size={iconSize} />,
      text: "View and create reports.",
      href: "/turkus/reports",
      borderColor: "#06b6d4",
    },
  ];
  return (
    <>
      <ContentHeader
        title="Turkus Management System"
        description="Comprehensive compliance and quality management platform"
      />

      <div className="grid grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            style={{ borderLeft: `4px solid ${card.borderColor}` }}
          >
            <NeonFeatureCard
              icon={card.icon}
              title={card.title}
              text={card.text}
              href={card.href}
            />
          </div>
        ))}
      </div>
    </>
  );
}
