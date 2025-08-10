import HeroHeader from '@/components/HeroHeader';
import NeonFeatureCard from '@/components/NeonFeatureCard';
import { FiBarChart2, FiGrid, FiPieChart, FiSettings, FiClipboard, FiFileText, FiAlertTriangle } from 'react-icons/fi';

export default function TurkusHomePage() {
  const iconSize = 20;
  const cards = [
    {
      title: 'Dashboard',
      icon: <FiBarChart2 size={iconSize} />,
      text: 'View Turkus dashboard and analytics.',
      href: '/turkus/tasks/dashboard',
      accentColor: '#40E0D0',
    },
    {
      title: 'Tasks',
      icon: <FiGrid size={iconSize} />,
      text: 'Manage and assign tasks.',
      href: '/turkus/tasks',
      accentColor: '#FF8C00',
    },
    {
      title: 'Reports',
      icon: <FiPieChart size={iconSize} />,
      text: 'View and create reports.',
      href: '/turkus/reports',
      accentColor: '#FFD700',
    },
    {
      title: 'Assignments',
      icon: <FiSettings size={iconSize} />,
      text: 'Manage Turkus assignments.',
      href: '/turkus/assignments',
      accentColor: '#00BFFF',
    },
    {
      title: 'Task Manager',
      icon: <FiClipboard size={iconSize} />,
      text: 'Advanced task management.',
      href: '/turkus/taskmanager',
      accentColor: '#FF69B4',
    },
    {
      title: 'Audit',
      icon: <FiBarChart2 size={iconSize} />,
      text: 'Audit and compliance tools.',
      href: '/turkus/audit',
      accentColor: '#32CD32',
    },
    {
      title: 'Document Manager',
      icon: <FiFileText size={iconSize} />,
      text: 'Manage Turkus documents.',
      href: '/turkus/documents',
      accentColor: '#FF6347',
    },
    {
      title: 'Issues',
      icon: <FiAlertTriangle size={iconSize} />,
      text: 'Track and resolve issues.',
      href: '/turkus/issues',
      accentColor: '#8A2BE2',
    },
  ];
  return (
    <>
      <HeroHeader
        title="Welcome to Turkus"
        subtitle="Turkus is your central hub for managing tasks, audits, documents, and issues. Use the navigation on the left to access dashboards, manage assignments, create and track audits, and handle all compliance documentation and reporting for your organization."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-8 mt-10">
        {cards.map((card, idx) => (
          <NeonFeatureCard
            key={card.title}
            icon={card.icon}
            title={card.title}
            text={card.text}
            href={card.href}
            bgColor="#011f24"
            borderColor="#40E0D0"
            textColor="#b2f1ec"
            linkColor="#40E0D0"
            glowColor="#40E0D0"
            accentColor={card.accentColor}
          />
        ))}
      </div>
    </>
  );
}