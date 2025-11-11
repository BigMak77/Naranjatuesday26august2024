"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiClock, FiAlertTriangle } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

interface Assignment {
  id: string;
  item_id: string;
  item_type: string;
  due_date: string | null;
  title?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface CalendarDay {
  date: Date;
  assignments: Assignment[];
  isToday: boolean;
}

interface CompactCalendarProps {
  className?: string;
  onDateClick?: (date: Date, assignments: Assignment[]) => void;
}

export default function CompactAssignmentCalendar({ 
  className = "", 
  onDateClick 
}: CompactCalendarProps) {
  const { user } = useUser();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch user assignments
  const fetchAssignments = async () => {
    if (!user?.auth_id) return;

    try {
      // Fetch from turkus_unified_assignments table
      const { data: turkusAssignments } = await supabase
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
        .neq("status", "cancelled")
        .not("due_date", "is", null);

      const formattedAssignments: Assignment[] = (turkusAssignments || []).map(ta => ({
        id: ta.id,
        item_id: ta.reference_id,
        item_type: ta.assignment_type,
        due_date: ta.due_date,
        title: ta.metadata?.title || `${ta.assignment_type.charAt(0).toUpperCase() + ta.assignment_type.slice(1)} Assignment`,
        priority: ta.priority
      }));

      setAssignments(formattedAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user?.auth_id]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      if (date.getMonth() !== month) continue; // Only show current month days

      const isToday = date.getTime() === today.getTime();

      const dayAssignments = assignments.filter(assignment => {
        if (!assignment.due_date) return false;
        const dueDate = new Date(assignment.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === date.getTime();
      });

      days.push({
        date: new Date(date),
        assignments: dayAssignments,
        isToday
      });
    }

    return days;
  }, [currentDate, assignments]);

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

  const getAssignmentColor = (assignment: Assignment) => {
    if (!assignment.due_date) return 'var(--status-info)';
    
    const dueDate = new Date(assignment.due_date);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'var(--status-danger)';
    if (diffDays <= 3) return 'var(--status-warning)';
    if (assignment.priority === 'urgent') return 'var(--status-danger)';
    if (assignment.priority === 'high') return 'var(--status-warning)';
    return 'var(--status-success)';
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className={`compact-assignment-calendar ${className}`}>
      {/* Compact Header */}
      <div className="compact-calendar-header">
        <button 
          className="compact-nav-btn" 
          onClick={goToPrevMonth}
          aria-label="Previous month"
        >
          <FiChevronLeft size={16} />
        </button>
        
        <h3 className="compact-calendar-title">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        
        <button 
          className="compact-nav-btn" 
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          <FiChevronRight size={16} />
        </button>
      </div>

      {/* Compact Grid */}
      <div className="compact-calendar-grid">
        {/* Day headers */}
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="compact-day-header">{day}</div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`compact-calendar-day ${day.isToday ? 'today' : ''} ${
              day.assignments.length > 0 ? 'has-assignments' : ''
            }`}
            onClick={() => onDateClick?.(day.date, day.assignments)}
          >
            <span className="compact-day-number">{day.date.getDate()}</span>
            
            {day.assignments.length > 0 && (
              <div className="compact-assignments">
                {day.assignments.slice(0, 2).map((assignment) => (
                  <CustomTooltip key={assignment.id} text={assignment.title || 'Assignment'}>
                    <div
                      className="compact-assignment-dot"
                      style={{ backgroundColor: getAssignmentColor(assignment) }}
                    />
                  </CustomTooltip>
                ))}
                {day.assignments.length > 2 && (
                  <div className="compact-assignment-more">+</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Compact Stats */}
      <div className="compact-calendar-stats">
        <div className="compact-stat">
          <FiClock size={12} />
          <span>{assignments.length} due this month</span>
        </div>
      </div>
    </div>
  );
}
