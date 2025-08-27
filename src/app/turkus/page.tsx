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
      accentColor: "#FF8C00",
    },
    {
      title: "Assignments",
      icon: <FiSettings size={iconSize} />,
      text: "Manage Turkus assignments.",
      href: "/turkus/assignments",
      accentColor: "#00BFFF",
    },
    {
      title: "Audit",
      icon: <FiBarChart2 size={iconSize} />,
      text: "Audit and compliance tools.",
      href: "/turkus/audit",
      accentColor: "#32CD32",
    },
    {
      title: "Documents",
      icon: <FiFileText size={iconSize} />,
      text: "Manage Turkus documents.",
      href: "/turkus/documents",
      accentColor: "#FF6347",
    },
    {
      title: "First Aid",
      icon: <FiCheckCircle size={iconSize} />,
      text: "Record and view first aid incidents.",
      href: "/turkus/firstaid",
      accentColor: "#40E0D0",
    },
    {
      title: "Health & Safety",
      icon: <FiShield size={iconSize} />,
      text: "Policies, incidents, and risk assessments.",
      href: "/turkus/health-safety",
      accentColor: "#FFD700",
    },
    {
      title: "Issues",
      icon: <FiAlertTriangle size={iconSize} />,
      text: "Track and resolve issues.",
      href: "/turkus/issues",
      accentColor: "#8A2BE2",
    },
    {
      title: "Reports",
      icon: <FiPieChart size={iconSize} />,
      text: "View and create reports.",
      href: "/turkus/reports",
      accentColor: "#FA7A20",
    },
    {
      title: "Auditors",
      icon: <FiShield size={iconSize} />,
      text: "Manage and add auditors.",
      href: "/turkus/auditors",
      accentColor: "#6A5ACD",
    },
  ];
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-8 mt-10">
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
      <div className="flex justify-center mt-8">
        <a href="/homepage/login" className="neon-btn neon-btn-primary px-6 py-3 text-lg font-semibold rounded shadow">
          Log In
        </a>
      </div>
      <div className="flex justify-center mt-8">
        <NeonIconButton variant="add" icon={<FiPlus />} title="Add" />
      </div>
    </>
  );
}
