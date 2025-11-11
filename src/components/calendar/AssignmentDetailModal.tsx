"use client";

import React from "react";
import { FiClock, FiAlertTriangle, FiCheckCircle, FiUser, FiCalendar } from "react-icons/fi";
import OverlayDialog from "@/components/ui/OverlayDialog";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

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

interface AssignmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  assignments: Assignment[];
  onMarkComplete?: (assignmentId: string) => Promise<void>;
}

export default function AssignmentDetailModal({
  isOpen,
  onClose,
  date,
  assignments,
  onMarkComplete
}: AssignmentDetailModalProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'var(--status-danger)';
      case 'high': return 'var(--status-warning)';
      case 'medium': return 'var(--status-info)';
      case 'low': return 'var(--status-success)';
      default: return 'var(--status-info)';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent': return <FiAlertTriangle size={16} />;
      case 'high': return <FiAlertTriangle size={16} />;
      default: return <FiClock size={16} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'audit': return <FiCheckCircle size={16} />;
      case 'module': return <FiUser size={16} />;
      case 'task': return <FiClock size={16} />;
      default: return <FiCalendar size={16} />;
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (!date) return null;

  return (
    <OverlayDialog open={isOpen} onClose={onClose}>
      <div className="assignment-detail-modal">
        <div className="assignment-detail-header">
          <div className="assignment-detail-date">
            <FiCalendar size={20} />
            <h2>{formatDate(date)}</h2>
          </div>
          <p className="assignment-count">
            {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'} due
          </p>
        </div>

        <div className="assignment-list">
          {assignments.length === 0 ? (
            <div className="no-assignments">
              <FiCheckCircle size={48} />
              <p>No assignments due on this date</p>
            </div>
          ) : (
            assignments.map((assignment) => (
              <div 
                key={assignment.id} 
                className={`assignment-item ${isOverdue(assignment.due_date) ? 'overdue' : ''}`}
              >
                <div className="assignment-item-header">
                  <div className="assignment-type">
                    {getTypeIcon(assignment.item_type)}
                    <span className="assignment-type-text">
                      {assignment.item_type.charAt(0).toUpperCase() + assignment.item_type.slice(1)}
                    </span>
                  </div>
                  
                  {assignment.priority && (
                    <CustomTooltip text={`Priority: ${assignment.priority}`}>
                      <div 
                        className="assignment-priority"
                        style={{ color: getPriorityColor(assignment.priority) }}
                      >
                        {getPriorityIcon(assignment.priority)}
                        <span>{assignment.priority.toUpperCase()}</span>
                      </div>
                    </CustomTooltip>
                  )}
                </div>

                <div className="assignment-content">
                  <h3 className="assignment-title">
                    {assignment.title || 'Untitled Assignment'}
                  </h3>
                  
                  {assignment.description && (
                    <p className="assignment-description">
                      {assignment.description}
                    </p>
                  )}

                  <div className="assignment-meta">
                    <div className="assignment-due">
                      <FiClock size={14} />
                      <span>
                        Due: {assignment.due_date 
                          ? new Date(assignment.due_date).toLocaleDateString()
                          : 'No due date'
                        }
                      </span>
                      {isOverdue(assignment.due_date) && (
                        <span className="overdue-badge">OVERDUE</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="assignment-actions">
                  <CustomTooltip text="View details">
                    <button 
                      className="neon-btn neon-btn-secondary assignment-action-btn"
                      onClick={() => {
                        // Navigate to assignment details or open assignment
                        console.log('View assignment:', assignment.id);
                      }}
                    >
                      View
                    </button>
                  </CustomTooltip>
                  
                  {onMarkComplete && (
                    <CustomTooltip text="Mark as complete">
                      <button 
                        className="neon-btn neon-btn-save assignment-action-btn"
                        onClick={() => onMarkComplete(assignment.id)}
                      >
                        Complete
                      </button>
                    </CustomTooltip>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="assignment-detail-footer">
          <button className="neon-btn neon-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </OverlayDialog>
  );
}
