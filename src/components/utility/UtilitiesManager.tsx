"use client";

import FolderTabs, { Tab } from "@/components/FolderTabs";
import { useState } from "react";
import TextIconButton from "@/components/ui/TextIconButtons";
import DocumentTypeTable from "@/components/documents/DocumentTypeTable";
import ShiftPatternsTable from "@/components/utility/ShiftPatternsTable";
import DepartmentRoleManager from "@/components/utility/DepartmentRoleManager";
import AddAuditorWidget from "@/components/audit/AddAuditorWidget";
import AddTrainerWidget from "@/components/audit/AddTrainerWidget";
import AddFirstAidWidget from "@/components/healthsafety/AddFirstAidWidget";
import ModuleCategoriesTable from "@/components/modules/ModuleCategoriesTable";
import LoggedUsers from "@/components/utility/LoggedUsers";
import { FiUsers, FiFileText, FiGrid, FiClock, FiUserCheck, FiActivity } from "react-icons/fi";

export default function UtilitiesManager() {
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
    },
    {
      key: 'logins',
      label: 'User Logins',
      icon: <FiActivity />,
      tooltip: 'View user login history and activity'
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
      case 'logins':
        return <LoggedUsers />;
      default:
        return <DepartmentRoleManager />;
    }
  };

  const renderToolbar = () => {
    switch (activeTab) {
      case 'departments':
        return (
          <>
            <TextIconButton
              variant="view"
              label="View All"
              onClick={() => console.log('View all departments and roles')}
            />
            <TextIconButton
              variant="download"
              label="Export Data"
              onClick={() => console.log('Export departments and roles')}
            />
          </>
        );
      case 'auditors':
        return (
          <>
            <TextIconButton
              variant="view"
              label="View All Auditors"
              onClick={() => console.log('View all auditors')}
            />
            <TextIconButton
              variant="view"
              label="View All Trainers"
              onClick={() => console.log('View all trainers')}
            />
          </>
        );
      case 'documents':
        return (
          <>
            <TextIconButton
              variant="add"
              label="Add Document Type"
              onClick={() => console.log('Add document type')}
            />
            <TextIconButton
              variant="view"
              label="View All Types"
              onClick={() => console.log('View all document types')}
            />
          </>
        );
      case 'categories':
        return (
          <>
            <TextIconButton
              variant="add"
              label="Add Category"
              onClick={() => console.log('Add module category')}
            />
            <TextIconButton
              variant="edit"
              label="Manage Categories"
              onClick={() => console.log('Manage categories')}
            />
          </>
        );
      case 'shifts':
        return (
          <>
            <TextIconButton
              variant="add"
              label="Add Shift Pattern"
              onClick={() => console.log('Add shift pattern')}
            />
            <TextIconButton
              variant="view"
              label="View All Shifts"
              onClick={() => console.log('View all shifts')}
            />
          </>
        );
      case 'logins':
        return (
          <>
            <TextIconButton
              variant="download"
              label="Export Login Data"
              onClick={() => console.log('Export login data')}
            />
            <TextIconButton
              variant="view"
              label="Refresh"
              onClick={() => window.location.reload()}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="folder-container">
      <FolderTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        toolbar={renderToolbar()}
      />
      <div className="folder-content">
        {renderTabContent()}
      </div>
    </div>
  );
}
