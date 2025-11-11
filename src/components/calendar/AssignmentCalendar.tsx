"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiClock, FiAlertTriangle } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import NeonIconButton from "@/components/ui/NeonIconButton";
import AssignmentDetailModal from "./AssignmentDetailModal";

interface Assignment {
  id: string;
  item_id: string;
  item_type: string;
  due_date: string | null;
  completed_at: string | null;
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignment_type?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  assignments: Assignment[];
  isToday: boolean;
  isPast: boolean;
}

export default function AssignmentCalendar() {
  const { user } = useUser();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<Assignment[]>([]);

  // Fetch user assignments with due dates
  const fetchAssignments = async () => {
    if (!user?.auth_id) return;

    setLoading(true);
    try {
      // Fetch from user_assignments table
      const { data: userAssignments, error: uaError } = await supabase
        .from("user_assignments")
        .select("id, item_id, item_type, completed_at")
        .eq("auth_id", user.auth_id)
        .is("completed_at", null); // Only uncompleted assignments

      if (uaError) {
        console.error("Error fetching user assignments:", uaError);
        return;
      }

      // Fetch from turkus_unified_assignments table (if it exists)
      const { data: turkusAssignments, error: turkusError } = await supabase
        .from("turkus_unified_assignments")
        .select(`
          id,
          reference_id,
          assignment_type,
          due_date,
          status,
          priority,
          metadata
        `)
        .eq("assigned_to", user.auth_id)
        .neq("status", "completed")
        .neq("status", "cancelled");

      // Don't throw error if table doesn't exist
      if (turkusError && !turkusError.message.includes("does not exist")) {
        console.error("Error fetching turkus assignments:", turkusError);
      }

      // Combine and format assignments
      const allAssignments: Assignment[] = [
        // Format user_assignments (these might not have due dates, so we'll estimate)
        ...(userAssignments || []).map(ua => ({
          id: ua.id,
          item_id: ua.item_id,
          item_type: ua.item_type,
          due_date: null, // Will be populated later if we can determine it
          completed_at: ua.completed_at,
          title: `${ua.item_type.charAt(0).toUpperCase() + ua.item_type.slice(1)} Assignment`,
          assignment_type: ua.item_type
        })),
        // Format turkus assignments
        ...(turkusAssignments || []).map(ta => ({
          id: ta.id,
          item_id: ta.reference_id,
          item_type: ta.assignment_type,
          due_date: ta.due_date,
          completed_at: null,
          title: ta.metadata?.title || `${ta.assignment_type.charAt(0).toUpperCase() + ta.assignment_type.slice(1)} Assignment`,
          priority: ta.priority,
          assignment_type: ta.assignment_type
        }))
      ];

      // For assignments without due dates, let's try to get more context
      await enrichAssignments(allAssignments);

      setAssignments(allAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Enrich assignments with additional data and estimated due dates
  const enrichAssignments = async (assignments: Assignment[]) => {
    for (const assignment of assignments) {
      try {
        // Try to get module info for training assignments
        if (assignment.item_type === 'module' && assignment.item_id) {
          const { data: module } = await supabase
            .from("modules")
            .select("name, description")
            .eq("id", assignment.item_id)
            .single();

          if (module) {
            assignment.title = module.name || assignment.title;
            assignment.description = module.description;
          }

          // If no due date, estimate 30 days from now for training
          if (!assignment.due_date) {
            const estimatedDue = new Date();
            estimatedDue.setDate(estimatedDue.getDate() + 30);
            assignment.due_date = estimatedDue.toISOString();
          }
        }

        // Try to get audit info
        if (assignment.item_type === 'audit' && assignment.item_id) {
          const { data: audit } = await supabase
            .from("audits")
            .select("title, description, due_date")
            .eq("id", assignment.item_id)
            .single();

          if (audit) {
            assignment.title = audit.title || assignment.title;
            assignment.description = audit.description;
            assignment.due_date = audit.due_date || assignment.due_date;
          }
        }

        // Try to get document review info
        if (assignment.item_type === 'document' && assignment.item_id) {
          const { data: document } = await supabase
            .from("documents")
            .select("title, last_reviewed_at, review_period_months")
            .eq("id", assignment.item_id)
            .single();

          if (document) {
            assignment.title = `Review: ${document.title}`;
            
            // Calculate next review due date
            if (document.last_reviewed_at && document.review_period_months) {
              const lastReview = new Date(document.last_reviewed_at);
              const dueDate = new Date(lastReview);
              dueDate.setMonth(dueDate.getMonth() + document.review_period_months);
              assignment.due_date = dueDate.toISOString();
            }
          }
        }
      } catch (error) {
        console.error(`Error enriching assignment ${assignment.id}:`, error);
      }
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user?.auth_id]);

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and adjust for week start (Sunday = 0)
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate 6 weeks of days (42 days total)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;

      // Find assignments for this date
      const dayAssignments = assignments.filter(assignment => {
        if (!assignment.due_date) return false;
        const dueDate = new Date(assignment.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === date.getTime();
      });

      days.push({
        date: new Date(date),
        isCurrentMonth,
        assignments: dayAssignments,
        isToday,
        isPast
      });
    }

    return days;
  }, [currentDate, assignments]);

  // Navigation functions
  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const goToPrevMonth = () => {
    setCurrentDate(prev => {
      const prev_month = new Date(prev);
      prev_month.setMonth(prev_month.getMonth() - 1);
      return prev_month;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle day click
  const handleDayClick = (day: CalendarDay) => {
    if (day.assignments.length > 0) {
      setSelectedDate(day.date);
      setSelectedAssignments(day.assignments);
      setShowDetailModal(true);
    }
  };

  // Handle assignment completion
  const handleMarkComplete = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("turkus_unified_assignments")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", assignmentId);

      if (error) {
        console.error("Error marking assignment complete:", error);
        return;
      }

      // Refresh assignments
      await fetchAssignments();
      
      // Update selected assignments
      setSelectedAssignments(prev => 
        prev.filter(assignment => assignment.id !== assignmentId)
      );
    } catch (error) {
      console.error("Error completing assignment:", error);
    }
  };

  // Get assignment priority color
  const getAssignmentColor = (assignment: Assignment) => {
    if (!assignment.due_date) return 'var(--status-info)';
    
    const dueDate = new Date(assignment.due_date);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'var(--status-danger)'; // Overdue
    if (diffDays <= 3) return 'var(--status-warning)'; // Due soon
    if (assignment.priority === 'urgent') return 'var(--status-danger)';
    if (assignment.priority === 'high') return 'var(--status-warning)';
    return 'var(--status-success)';
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <div className="assignment-calendar-loading">
        <FiClock className="spin" />
        <p>Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="assignment-calendar">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-navigation">
          <CustomTooltip text="Previous month">
            <NeonIconButton
              variant="back"
              title=""
              onClick={goToPrevMonth}
              aria-label="Previous month"
            />
          </CustomTooltip>
          
          <h2 className="calendar-title">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <CustomTooltip text="Next month">
            <NeonIconButton
              variant="next"
              title=""
              onClick={goToNextMonth}
              aria-label="Next month"
            />
          </CustomTooltip>
        </div>

        <div className="calendar-actions">
          <CustomTooltip text="Go to today">
            <button className="neon-btn neon-btn-secondary" onClick={goToToday}>
              Today
            </button>
          </CustomTooltip>
          
          <CustomTooltip text="Refresh assignments">
            <NeonIconButton
              variant="refresh"
              title=""
              onClick={fetchAssignments}
              aria-label="Refresh assignments"
            />
          </CustomTooltip>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${
              !day.isCurrentMonth ? 'other-month' : ''
            } ${day.isToday ? 'today' : ''} ${
              day.assignments.length > 0 ? 'has-assignments clickable' : ''
            }`}
            onClick={() => handleDayClick(day)}
          >
            <div className="calendar-day-number">
              {day.date.getDate()}
            </div>
            
            {day.assignments.length > 0 && (
              <div className="calendar-assignments">
                {day.assignments.slice(0, 3).map((assignment, i) => (
                  <CustomTooltip
                    key={assignment.id}
                    text={`${assignment.title}${assignment.description ? ` - ${assignment.description}` : ''}`}
                  >
                    <div
                      className="calendar-assignment-dot"
                      style={{
                        backgroundColor: getAssignmentColor(assignment)
                      }}
                    >
                      {assignment.assignment_type === 'audit' && <FiAlertTriangle size={8} />}
                      {assignment.assignment_type === 'module' && <FiClock size={8} />}
                    </div>
                  </CustomTooltip>
                ))}
                
                {day.assignments.length > 3 && (
                  <div className="calendar-assignment-more">
                    +{day.assignments.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <h4>Legend:</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: 'var(--status-danger)' }}></div>
            <span>Overdue / Urgent</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: 'var(--status-warning)' }}></div>
            <span>Due Soon / High Priority</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: 'var(--status-success)' }}></div>
            <span>Normal</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: 'var(--status-info)' }}></div>
            <span>No Due Date</span>
          </div>
        </div>
      </div>

      {/* Assignment Detail Modal */}
      <AssignmentDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDate(null);
          setSelectedAssignments([]);
        }}
        date={selectedDate}
        assignments={selectedAssignments}
        onMarkComplete={handleMarkComplete}
      />
    </div>
  );
}
