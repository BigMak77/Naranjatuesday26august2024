"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import ContentHeader from "@/components/ui/ContentHeader";
import { FiFileText, FiPackage, FiUsers, FiLayout, FiSettings } from "react-icons/fi";

export default function DashboardPage() {
  const router = useRouter();

  const navigationCards = [
    {
      title: "Documents",
      description: "Manage training documents and content",
      icon: FiFileText,
      path: "/admin/documents",
      color: "#3b82f6"
    },
    {
      title: "Modules",
      description: "Organize training modules and curriculum",
      icon: FiPackage,
      path: "/admin/modules",
      color: "#10b981"
    },
    {
      title: "Roles",
      description: "Configure user roles and permissions",
      icon: FiUsers,
      path: "/admin/roles",
      color: "#a855f7"
    },
    {
      title: "Standard Sections",
      description: "Define reusable content sections",
      icon: FiLayout,
      path: "/admin/standard-sections",
      color: "#f97316"
    },
    {
      title: "Utility",
      description: "Access management tools and settings",
      icon: FiSettings,
      path: "/admin/utility",
      color: "#6b7280"
    }
  ];

  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="Admin access required. Redirecting to your dashboard..."
    >
      <ContentHeader
        title="Admin Dashboard"
        description="Quick access to people management, roles, and compliance"
      />

      <div className="global-content">
        <div className="dashboard-cards-grid">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.path}
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid #e5e7eb'
                }}
                onClick={() => router.push(card.path)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Icon size={24} style={{ color: card.color }} />
                  <h3 className="main-header" style={{ margin: 0, fontSize: '18px' }}>{card.title}</h3>
                </div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                  {card.description}
                </p>
                <button
                  className="neon-button"
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '14px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(card.path);
                  }}
                >
                  Go to {card.title}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AccessControlWrapper>
  );
}
