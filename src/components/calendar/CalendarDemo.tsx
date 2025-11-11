"use client";

import React, { useState } from "react";
import { FiCalendar, FiGrid, FiEye, FiSettings } from "react-icons/fi";
import { AssignmentCalendar, CompactAssignmentCalendar, CalendarWidget, AssignmentDetailModal } from "./index";
import FolderTabs, { type Tab } from "@/components/FolderTabs";

interface Assignment {
  id: string;
  item_id: string;
  item_type: string;
  due_date: string | null;
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignment_type?: string;
}

export default function CalendarDemo() {
  const [activeTab, setActiveTab] = useState("full");
  
  // Demo modal state
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoDate] = useState(new Date());
  const [demoAssignments] = useState<Assignment[]>([
    {
      id: "demo-1",
      item_id: "module-123",
      item_type: "module",
      due_date: new Date().toISOString(),
      title: "Health & Safety Training",
      description: "Complete the mandatory health and safety training module",
      priority: "high",
      assignment_type: "module"
    },
    {
      id: "demo-2", 
      item_id: "audit-456",
      item_type: "audit",
      due_date: new Date().toISOString(),
      title: "Quarterly Safety Audit",
      description: "Conduct quarterly safety audit for your department",
      priority: "medium",
      assignment_type: "audit"
    }
  ]);

  const handleCompactDateClick = (date: Date, assignments: Assignment[]) => {
    console.log("Compact calendar date clicked:", date, assignments);
    if (assignments.length > 0) {
      alert(`${assignments.length} assignments due on ${date.toLocaleDateString()}`);
    }
  };

  const tabs: Tab[] = [
    {
      key: "full",
      label: "Full Calendar",
      icon: <FiCalendar />,
      tooltip: "Full-featured calendar view"
    },
    {
      key: "compact",
      label: "Compact View",
      icon: <FiGrid />,
      tooltip: "Compact calendar widget"
    },
    {
      key: "widget",
      label: "Dashboard Widget",
      icon: <FiEye />,
      tooltip: "Complete dashboard widget"
    },
    {
      key: "demo",
      label: "Demo Features",
      icon: <FiSettings />,
      tooltip: "Interactive demo features"
    }
  ];

  return (
    <div className="calendar-demo">
      <div className="demo-header">
        <h1 className="neon-heading">Assignment Calendar Demo</h1>
        <p className="demo-description">
          Explore the different calendar components and their features. 
          This demo shows how assignments are displayed and how users can interact with the calendar.
        </p>
      </div>

      <div className="folder-container">
        <FolderTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          toolbar={<div style={{ opacity: 0.7, fontSize: '0.875rem' }}>Calendar Views</div>}
        />
        
        <div className="folder-content">
          {activeTab === "full" && (
            <div className="demo-section">
              <h2 className="neon-heading">Full Assignment Calendar</h2>
              <p className="demo-text">
                The full calendar shows assignments in a monthly view with color-coded indicators.
                Click on days with assignments to see details.
              </p>
              <div className="demo-calendar-container">
                <AssignmentCalendar />
              </div>
            </div>
          )}

          {activeTab === "compact" && (
            <div className="demo-section">
              <h2 className="neon-heading">Compact Calendar View</h2>
              <p className="demo-text">
                The compact calendar is perfect for dashboard widgets and sidebar placement.
                It shows a minimal view with assignment indicators.
              </p>
              <div className="demo-compact-container">
                <CompactAssignmentCalendar onDateClick={handleCompactDateClick} />
              </div>
            </div>
          )}

          {activeTab === "widget" && (
            <div className="demo-section">
              <h2 className="neon-heading">Dashboard Widget</h2>
              <p className="demo-text">
                The calendar widget combines the compact calendar with modal functionality.
                It includes a header, "View All" link, and integrated assignment details.
              </p>
              <div className="demo-widget-container">
                <CalendarWidget 
                  title="Demo Assignments"
                  showViewAll={true}
                  className="demo-widget"
                />
              </div>
            </div>
          )}

          {activeTab === "demo" && (
            <div className="demo-section">
              <h2 className="neon-heading">Interactive Demo Features</h2>
              
              <div className="demo-features">
                <div className="demo-feature">
                  <h3 className="neon-subheading">Assignment Detail Modal</h3>
                  <p className="demo-text">
                    Click the button below to see how assignment details are displayed in a modal.
                  </p>
                  <button 
                    className="neon-btn neon-btn-save"
                    onClick={() => setShowDemoModal(true)}
                  >
                    Show Assignment Details
                  </button>
                </div>

                <div className="demo-feature">
                  <h3 className="neon-subheading">Color Coding System</h3>
                  <div className="demo-color-guide">
                    <div className="color-item">
                      <div className="color-dot" style={{ backgroundColor: 'var(--status-danger)' }}></div>
                      <span>Overdue / Urgent Priority</span>
                    </div>
                    <div className="color-item">
                      <div className="color-dot" style={{ backgroundColor: 'var(--status-warning)' }}></div>
                      <span>Due Soon / High Priority</span>
                    </div>
                    <div className="color-item">
                      <div className="color-dot" style={{ backgroundColor: 'var(--status-success)' }}></div>
                      <span>Normal Priority</span>
                    </div>
                    <div className="color-item">
                      <div className="color-dot" style={{ backgroundColor: 'var(--status-info)' }}></div>
                      <span>No Due Date / Low Priority</span>
                    </div>
                  </div>
                </div>

                <div className="demo-feature">
                  <h3 className="neon-subheading">Data Sources</h3>
                  <div className="demo-data-sources">
                    <div className="data-source">
                      <h4>user_assignments</h4>
                      <p>Legacy assignment table with estimated due dates</p>
                    </div>
                    <div className="data-source">
                      <h4>turkus_unified_assignments</h4>
                      <p>New unified table with explicit due dates and priorities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo Modal */}
      <AssignmentDetailModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        date={demoDate}
        assignments={demoAssignments}
        onMarkComplete={async (id) => {
          console.log("Demo: Mark assignment complete:", id);
          alert(`Demo: Assignment ${id} marked as complete!`);
        }}
      />
    </div>
  );
}
