"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { supabase } from "@/lib/supabase-client";
import {
  FiUsers,
  FiPlus,
  FiGrid,
  FiClipboard,
  FiPieChart,
  FiAlertTriangle,
  FiFileText,
  FiBookOpen,
  FiShield,
  FiActivity,
  FiSettings,
  FiHome,
  FiCheckCircle,
  FiBarChart2,
  FiDatabase,
  FiLayers,
  FiUserCheck,
  FiClock,
} from "react-icons/fi";

/*********************************
 * Types
 *********************************/
interface DashboardAction {
  href: string;
  label: React.ReactNode; // usually <Icon/> Text
  className?: string; // keep for future variants
  ariaLabel?: string; // spoken label for icon-only buttons
}

interface DashboardSection {
  key: string;
  title: string;
  icon: React.ReactNode; // large icon for card header
  primary: DashboardAction; // main click target for the card
  actions?: DashboardAction[]; // secondary icon-only actions
}

/*********************************
 * Data fetching
 *********************************/
const fetchCompliance = async () => {
  const { data, error } = await supabase
    .from("user_compliance_dashboard")
    .select("completed_items,total_items");
  if (error) throw error;
  return data as { completed_items: number; total_items: number }[];
};

function useCompliance() {
  const { data, error, isLoading } = useSWR(
    "user_compliance_dashboard",
    fetchCompliance,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
    }
  );

  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return { avg: null as number | null, lowCount: 0 };
    }
    let percentSum = 0;
    let counted = 0;
    let low = 0;
    for (const row of data) {
      const total = row.total_items || 0;
      if (total > 0) {
        const p = (row.completed_items / total) * 100;
        percentSum += p;
        counted += 1;
        if (p < 70) low += 1;
      }
    }
    const avg = counted ? Number((percentSum / counted).toFixed(1)) : null;
    return { avg, lowCount: low };
  }, [data]);

  return { ...stats, isLoading, error };
}

/*********************************
 * Config (DRY)
 *********************************/
const iconSize = 18;

const SECTIONS: DashboardSection[] = [
  {
    key: "people",
    title: "People",
    icon: <FiUsers size={20} aria-hidden />,
    primary: {
      href: "/admin/roles",
      label: (
        <>
          <FiUserCheck size={iconSize} aria-hidden /> Roles
        </>
      ),
      ariaLabel: "Manage roles",
    },
    actions: [],
  },
  {
    key: "modules",
    title: "Modules",
    icon: <FiLayers size={20} aria-hidden />,
    primary: {
      href: "/admin/modules",
      label: (
        <>
          <FiLayers size={iconSize} aria-hidden /> Modules
        </>
      ),
      ariaLabel: "Browse modules",
    },
    actions: [
      {
        href: "/admin/modules/add",
        label: (
          <>
            <FiPlus size={iconSize} aria-hidden /> Add Module
          </>
        ),
        ariaLabel: "Add module",
      },
      {
        href: "/admin/modules/assign",
        label: (
          <>
            <FiUserCheck size={iconSize} aria-hidden /> Assign Module
          </>
        ),
        ariaLabel: "Assign module",
      },
    ],
  },
  {
    key: "documents",
    title: "Documents",
    icon: <FiFileText size={20} aria-hidden />,
    primary: {
      href: "/admin/documents",
      label: (
        <>
          <FiFileText size={iconSize} aria-hidden /> Documents
        </>
      ),
      ariaLabel: "Document manager",
    },
    actions: [
      {
        href: "/admin/documents/add",
        label: (
          <>
            <FiPlus size={iconSize} aria-hidden /> Add Document
          </>
        ),
        ariaLabel: "Add document",
      },
      {
        href: "/admin/documents/versions",
        label: (
          <>
            <FiClock size={iconSize} aria-hidden /> Versions
          </>
        ),
        ariaLabel: "Document versions",
      },
    ],
  },
  {
    key: "org",
    title: "Org Chart",
    icon: <FiUsers size={20} aria-hidden />,
    primary: {
      href: "/admin/org-chart",
      label: (
        <>
          <FiUsers size={iconSize} aria-hidden /> Org Chart
        </>
      ),
      ariaLabel: "View org chart",
    },
    actions: [
      {
        href: "/admin/roles/add",
        label: (
          <>
            <FiPlus size={iconSize} aria-hidden /> Add Role
          </>
        ),
        ariaLabel: "Add role",
      },
    ],
  },
  {
    key: "roles",
    title: "Role Profiles",
    icon: <FiUserCheck size={20} aria-hidden />,
    primary: {
      href: "/admin/role-profiles",
      label: (
        <>
          <FiUserCheck size={iconSize} aria-hidden /> Role Profiles
        </>
      ),
      ariaLabel: "View role profiles",
    },
    actions: [
      {
        href: "/admin/role-profiles/add",
        label: (
          <>
            <FiPlus size={iconSize} aria-hidden /> Add Profile
          </>
        ),
        ariaLabel: "Add profile",
      },
      {
        href: "/admin/role-profiles/manage",
        label: (
          <>
            <FiSettings size={iconSize} aria-hidden /> Manage Profiles
          </>
        ),
        ariaLabel: "Manage profiles",
      },
    ],
  },
  {
    key: "hs",
    title: "Health & Safety",
    icon: <FiShield size={20} aria-hidden />,
    primary: {
      href: "/turkus/health-safety",
      label: (
        <>
          <FiShield size={iconSize} aria-hidden /> H&S Home
        </>
      ),
      ariaLabel: "Health and Safety home",
    },
    actions: [
      {
        href: "/turkus/health-safety/policies",
        label: (
          <>
            <FiFileText size={iconSize} aria-hidden /> Policies
          </>
        ),
        ariaLabel: "H&S policies",
      },
      {
        href: "/turkus/health-safety/assessments",
        label: (
          <>
            <FiActivity size={iconSize} aria-hidden /> Risk Assessments
          </>
        ),
        ariaLabel: "Risk assessments",
      },
      {
        href: "/turkus/health-safety/incidents",
        label: (
          <>
            <FiAlertTriangle size={iconSize} aria-hidden /> Incidents
          </>
        ),
        ariaLabel: "Incidents",
      },
      {
        href: "/turkus/health-safety/resources",
        label: (
          <>
            <FiBookOpen size={iconSize} aria-hidden /> Resources
          </>
        ),
        ariaLabel: "H&S resources",
      },
    ],
  },
  {
    key: "turkus",
    title: "Turkus",
    icon: <FiHome size={20} aria-hidden />,
    primary: {
      href: "/turkus",
      label: (
        <>
          <FiHome size={iconSize} aria-hidden /> Turkus Home
        </>
      ),
      ariaLabel: "Turkus home",
    },
    actions: [
      {
        href: "/turkus/tasks/dashboard",
        label: (
          <>
            <FiBarChart2 size={iconSize} aria-hidden /> Dashboard
          </>
        ),
        ariaLabel: "Turkus dashboard",
      },
      {
        href: "/turkus/tasks",
        label: (
          <>
            <FiGrid size={iconSize} aria-hidden /> Tasks
          </>
        ),
        ariaLabel: "Turkus tasks",
      },
      {
        href: "/turkus/reports",
        label: (
          <>
            <FiPieChart size={iconSize} aria-hidden /> Reports
          </>
        ),
        ariaLabel: "Turkus reports",
      },
      {
        href: "/turkus/assignments",
        label: (
          <>
            <FiSettings size={iconSize} aria-hidden /> Assignments
          </>
        ),
        ariaLabel: "Turkus assignments",
      },
      {
        href: "/turkus/taskmanager",
        label: (
          <>
            <FiClipboard size={iconSize} aria-hidden /> Task Manager
          </>
        ),
        ariaLabel: "Turkus task manager",
      },
      {
        href: "/turkus/audit",
        label: (
          <>
            <FiDatabase size={iconSize} aria-hidden /> Audit
          </>
        ),
        ariaLabel: "Turkus audit",
      },
      {
        href: "/turkus/documents",
        label: (
          <>
            <FiFileText size={iconSize} aria-hidden /> Document Manager
          </>
        ),
        ariaLabel: "Turkus document manager",
      },
      {
        href: "/turkus/issues",
        label: (
          <>
            <FiAlertTriangle size={iconSize} aria-hidden /> Issues
          </>
        ),
        ariaLabel: "Turkus issues",
      },
    ],
  },
];

/*********************************
 * Helpers
 *********************************/
// Pull the first child of a label (usually the icon). Fallback to a generic icon.
function leadingIcon(node: React.ReactNode) {
  if (React.isValidElement(node)) {
    const children = (node.props as any)?.children;
    if (Array.isArray(children) && children[0]) return children[0];
  }
  return <FiActivity aria-hidden />;
}

/*********************************
 * Presentational components (match your global CSS)
 *********************************/
function FeatureCard({
  title,
  icon,
  primary,
  actions = [],
}: Pick<DashboardSection, "title" | "icon" | "primary" | "actions">) {
  return (
    <div className="neon-feature-card" role="region" aria-label={title}>
      <Link href={primary.href} aria-label={primary.ariaLabel || title}>
        <div className="neon-feature-card-header">
          <span aria-hidden>{icon}</span>
          <span className="neon-feature-card-title">{title}</span>
        </div>
        {/* Optional intro text area if you want */}
        {/* <p className="neon-feature-card-text">Short description</p> */}
      </Link>

      {actions.length > 0 && (
        <div className="neon-feature-card-children" aria-label={`${title} actions`}>
          {/* Use icon-only square buttons to respect your .neon-btn sizing */}
          {actions.map((a, i) => (
            <Link
              key={`${title}-action-${i}`}
              href={a.href}
              className="neon-btn-square"
              aria-label={a.ariaLabel || (typeof a.label === "string" ? a.label : undefined)}
              title={a.ariaLabel || (typeof a.label === "string" ? a.label : undefined)}
            >
              {/* Only render the leading icon to avoid clipped text inside 40x40 */}
              {leadingIcon(a.label)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/*********************************
 * Page
 *********************************/
export default function DashboardPage() {
  const { avg, lowCount, isLoading, error } = useCompliance();

  return (
    <>
      {/* Cards */}
      <section aria-label="Dashboard shortcuts" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        {/* Quick-create card */}
        <Link href="/admin/create-auth-user" className="neon-feature-card" aria-label="Create Auth User">
          <div className="neon-feature-card-header">
            <FiPlus size={iconSize} aria-hidden />
            <span className="neon-feature-card-title">Create Auth User</span>
          </div>
        </Link>

        {SECTIONS.map((s) => (
          <FeatureCard key={s.key} title={s.title} icon={s.icon} primary={s.primary} actions={s.actions} />
        ))}
      </section>

      {error && (
        <p role="alert" className="neon-feature-card-text" style={{ marginTop: "0.75rem", color: "#ffd2d2" }}>
          Failed to load compliance data.
        </p>
      )}
    </>
  );
}
