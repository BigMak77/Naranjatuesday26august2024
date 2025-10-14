"use client";
import { useState } from "react";
import { FiCalendar, FiGrid, FiLayers, FiAlertTriangle } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import Rota from "@/components/people/Rota";

// Custom tooltip added
import TrainingMatrix from "@/components/training/TrainingMatrix";
import RotaByDepartment from "@/components/people/RotaByDepartment";
import WithoutManager from "@/components/people/WithoutManager";
import GroupModuleReport from "@/components/modules/GroupModuleReport";

export default function RotaPage() {
  const [open, setOpen] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showRotaByDept, setShowRotaByDept] = useState(false);
  const [showWithoutManager, setShowWithoutManager] = useState(false);
  const [showGroupModuleReport, setShowGroupModuleReport] = useState(false);
  // Example departmentId, replace with real one or make dynamic as needed
  const departmentId = "your-department-id";

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {!open && !showMatrix && !showRotaByDept && !showWithoutManager && !showGroupModuleReport ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start', justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <CustomTooltip text="Open main rota">
              <button
                className="large-neon-icon-btn blue"
                onClick={() => setOpen(true)}
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
                onClick={() => setShowMatrix(true)}
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
                onClick={() => setShowRotaByDept(true)}
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
                onClick={() => setShowWithoutManager(true)}
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
                onClick={() => setShowGroupModuleReport(true)}
                aria-label="Open Group Module Report"
              >
                <FiLayers size={40} />
              </button>
            </CustomTooltip>
            <div style={{ color: '#fff', fontSize: '1.1rem' }}>
              <strong>Group Module Report:</strong> Filter by module and see attached departments and roles.
            </div>
          </div>
        </div>
      ) : showGroupModuleReport ? (
        <GroupModuleReport />
      ) : open ? (
        <Rota />
      ) : showMatrix ? (
        <TrainingMatrix />
      ) : showRotaByDept ? (
        <RotaByDepartment departmentId={departmentId} />
      ) : (
        <WithoutManager />
      )}
    </div>
  );
}
