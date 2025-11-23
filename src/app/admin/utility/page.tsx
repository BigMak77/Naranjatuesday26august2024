"use client";

import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";
import FolderTabs, { Tab } from "@/components/FolderTabs";
import { useState } from "react";
import DocumentTypeTable from "@/components/documents/DocumentTypeTable";
import ShiftPatternsTable from "@/components/utility/ShiftPatternsTable";
import DepartmentRoleManager from "@/components/utility/DepartmentRoleManager";
import AddAuditorWidget from "@/components/audit/AddAuditorWidget";
import AddTrainerWidget from "@/components/audit/AddTrainerWidget";
import AddFirstAidWidget from "@/components/healthsafety/AddFirstAidWidget";
import ModuleCategoriesTable from "@/components/modules/ModuleCategoriesTable";
import { FiUsers, FiFileText, FiGrid, FiClock, FiUserCheck } from "react-icons/fi";

export default function UtilityPage() {
  const [activeTab, setActiveTab] = useState('departments');

  const tabs: Tab[] = [
    {
      key: 'departments',
      label: 'Departments & Roles',
      icon: <FiUsers />,
      tooltip: 'Manage system departments and user roles'
    },
    {
      key: 'auditors',
      label: 'Auditor Tools',
      icon: <FiUserCheck />,
      tooltip: 'Manage auditors, trainers, and first aid personnel'
    },
    {
      key: 'documents',
      label: 'Document Types',
      icon: <FiFileText />,
      tooltip: 'Configure document type categories'
    },
    {
      key: 'categories',
      label: 'Module Categories',
      icon: <FiGrid />,
      tooltip: 'Organize training modules into categories'
    },
    {
      key: 'shifts',
      label: 'Shift Patterns',
      icon: <FiClock />,
      tooltip: 'Define work shift time patterns'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'departments':
        return <DepartmentRoleManager />;
      case 'auditors':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AddAuditorWidget />
            <AddTrainerWidget />
            <AddFirstAidWidget />
          </div>
        );
      case 'documents':
        return <DocumentTypeTable />;
      case 'categories':
        return <ModuleCategoriesTable />;
      case 'shifts':
        return <ShiftPatternsTable />;
      default:
        return <DepartmentRoleManager />;
    }
  };

  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to access admin utilities."
    >
      <main className="after-hero">
        <ContentHeader
          title="Admin Utilities"
          description="Utilities are similar to global settings, that improve the functionality of the platform."
        />
        <div className="global-content">
          <div className="folder-container">
            <FolderTabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              toolbar={
                <span style={{ opacity: 0.7, fontSize: 'var(--font-size-base)' }}>
                  {tabs.length} utility categories available
                </span>
              }
            />
            <div className="folder-content">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>
    </AccessControlWrapper>
  );
}