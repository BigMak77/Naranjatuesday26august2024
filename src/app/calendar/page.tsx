"use client";

import React, { useState } from "react";
import { FiCalendar, FiInfo, FiHelpCircle } from "react-icons/fi";
import AssignmentCalendar from "@/components/calendar/AssignmentCalendar";
import ContentHeader from "@/components/ui/ContentHeader";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import OverlayDialog from "@/components/ui/OverlayDialog";

export default function CalendarPage() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="page-container">
      <ContentHeader
        title="Assignment Calendar"
        description="View your assignments and due dates in calendar format"
      />
      
      <div className="page-content">
        {/* Info Banner */}
        <div className="calendar-info-banner">
          <div className="info-content">
            <FiInfo size={20} />
            <div>
              <h4>Your Assignment Calendar</h4>
              <p>
                This calendar shows all your assigned tasks, training modules, audits, and document reviews. 
                Colors indicate urgency - red for overdue, orange for due soon, and green for normal priority.
                Click on any date with assignments to view details.
              </p>
            </div>
          </div>
          <CustomTooltip text="Learn more about calendar features">
            <button 
              className="info-help-btn"
              onClick={() => setShowInfo(true)}
            >
              <FiHelpCircle size={20} />
            </button>
          </CustomTooltip>
        </div>
        
        <div className="calendar-page-content">
          <AssignmentCalendar />
        </div>
      </div>

      {/* Help Modal */}
      <OverlayDialog showCloseButton={true} open={showInfo} onClose={() => setShowInfo(false)}>
        <div className="calendar-help-modal">
          <h2 className="neon-heading">Calendar Help</h2>
          
          <div className="help-section">
            <h3>Color Coding</h3>
            <div className="help-colors">
              <div className="help-color-item">
                <div className="help-color-dot" style={{ backgroundColor: 'var(--status-danger)' }}></div>
                <strong>Red:</strong> Overdue assignments or urgent priority
              </div>
              <div className="help-color-item">
                <div className="help-color-dot" style={{ backgroundColor: 'var(--status-warning)' }}></div>
                <strong>Orange:</strong> Due within 3 days or high priority
              </div>
              <div className="help-color-item">
                <div className="help-color-dot" style={{ backgroundColor: 'var(--status-success)' }}></div>
                <strong>Green:</strong> Normal priority assignments
              </div>
              <div className="help-color-item">
                <div className="help-color-dot" style={{ backgroundColor: 'var(--status-info)' }}></div>
                <strong>Blue:</strong> No due date or low priority
              </div>
            </div>
          </div>

          <div className="help-section">
            <h3>Assignment Types</h3>
            <ul>
              <li><strong>Training Modules:</strong> Complete assigned training courses</li>
              <li><strong>Document Reviews:</strong> Review and acknowledge policy documents</li>
              <li><strong>Audits:</strong> Participate in or conduct safety/compliance audits</li>
              <li><strong>Tasks:</strong> General tasks assigned by managers</li>
            </ul>
          </div>

          <div className="help-section">
            <h3>How to Use</h3>
            <ul>
              <li>Click on any date with colored dots to see assignment details</li>
              <li>Use the navigation arrows to browse different months</li>
              <li>Click "Today" to quickly return to the current date</li>
              <li>Use the refresh button to update with latest assignments</li>
            </ul>
          </div>

          <div className="help-footer">
            <button 
              className="neon-btn neon-btn-secondary"
              onClick={() => setShowInfo(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      </OverlayDialog>
    </div>
  );
}
