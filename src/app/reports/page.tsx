"use client";
import { useState } from "react";
import { FiCalendar, FiGrid, FiLayers, FiAlertTriangle, FiFileText } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import Rota from "@/components/people/Rota";
import ContentHeader from "@/components/ui/ContentHeader";
import AccessControlWrapper from "@/components/AccessControlWrapper";

// Custom tooltip added
import TrainingMatrix from "@/components/training/TrainingMatrix";
import RotaByDepartment from "@/components/people/RotaByDepartment";
import WithoutManager from "@/components/people/WithoutManager";
import GroupModuleReport from "@/components/modules/GroupModuleReport";
import TrainingWithTest from "@/components/reports/TrainingWithTest";

export default function RotaPage() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  // Example departmentId, replace with real one or make dynamic as needed
  const departmentId = "your-department-id";

  return (
    <AccessControlWrapper
      requiredRoles={["Super Admin", "Admin", "HR Admin", "Dept. Manager", "Manager"]}
      redirectOnNoAccess={true}
      noAccessMessage="You don't have permission to access reports."
    >
      <ContentHeader
        title="Reports"
        description="Access various reporting tools and views"
      />
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {!activeReport ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start', justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <CustomTooltip text="Open main rota">
              <button
                className="large-neon-icon-btn blue"
                onClick={() => setActiveReport('rota')}
                aria-label="Open Rota"
              >
                <FiCalendar size={40} />
              </button>
            </CustomTooltip>
            <div style={{ color: '#fff', fontSize: '1.1rem' }}>
              <strong>Rota:</strong> View the main rota for all staff.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <CustomTooltip text="View training matrix">
              <button
                className="large-neon-icon-btn orange"
                onClick={() => setActiveReport('training-matrix')}
                aria-label="Open Training Matrix"
              >
                <FiGrid size={40} />
              </button>
            </CustomTooltip>
            <div style={{ color: '#fff', fontSize: '1.1rem' }}>
              <strong>Training Matrix:</strong> See training completion by user and module.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <CustomTooltip text="View department rotas">
              <button
                className="large-neon-icon-btn green"
                onClick={() => setActiveReport('rota-by-dept')}
                aria-label="Open Rota By Department"
              >
                <FiLayers size={40} />
              </button>
            </CustomTooltip>
            <div style={{ color: '#fff', fontSize: '1.1rem' }}>
              <strong>Department Rotas:</strong> View rotas filtered by department.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <CustomTooltip text="Departments without manager">
              <button
                className="large-neon-icon-btn"
                onClick={() => setActiveReport('without-manager')}
                aria-label="Departments Without Manager"
              >
                <FiAlertTriangle size={40} />
              </button>
            </CustomTooltip>
            <div style={{ color: '#fff', fontSize: '1.1rem' }}>
              <strong>Without Manager:</strong> List departments that do not have a manager assigned.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <CustomTooltip text="View group module report">
              <button
                className="large-neon-icon-btn purple"
                onClick={() => setActiveReport('group-module')}
                aria-label="Open Group Module Report"
              >
                <FiLayers size={40} />
              </button>
            </CustomTooltip>
            <div style={{ color: '#fff', fontSize: '1.1rem' }}>
              <strong>Group Module Report:</strong> Filter by module and see attached departments and roles.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <CustomTooltip text="View modules with tests">
              <button
                className="large-neon-icon-btn cyan"
                onClick={() => setActiveReport('training-with-test')}
                aria-label="Open Training With Test"
              >
                <FiFileText size={40} />
              </button>
            </CustomTooltip>
            <div style={{ color: '#fff', fontSize: '1.1rem' }}>
              <strong>Training With Test:</strong> View all modules with attached question packs and questions.
            </div>
          </div>
        </div>
      ) : activeReport === 'training-with-test' ? (
        <TrainingWithTest />
      ) : activeReport === 'group-module' ? (
        <GroupModuleReport />
      ) : activeReport === 'rota' ? (
        <Rota />
      ) : activeReport === 'training-matrix' ? (
        <TrainingMatrix />
      ) : activeReport === 'rota-by-dept' ? (
        <RotaByDepartment departmentId={departmentId} />
      ) : activeReport === 'without-manager' ? (
        <WithoutManager />
      ) : null}
    </div>
    </AccessControlWrapper>
  );
}
