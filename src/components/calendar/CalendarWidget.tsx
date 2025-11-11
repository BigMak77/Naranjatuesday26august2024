"use client";

import React, { useState } from "react";
import { FiCalendar, FiClock, FiArrowRight } from "react-icons/fi";
import { useRouter } from "next/navigation";
import CompactAssignmentCalendar from "./CompactAssignmentCalendar";
import AssignmentDetailModal from "./AssignmentDetailModal";

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

interface CalendarWidgetProps {
  title?: string;
  showViewAll?: boolean;
  className?: string;
}

export default function CalendarWidget({ 
  title = "Assignment Calendar",
  showViewAll = true,
  className = ""
}: CalendarWidgetProps) {
  const router = useRouter();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<Assignment[]>([]);

  const handleDateClick = (date: Date, assignments: Assignment[]) => {
    if (assignments.length > 0) {
      setSelectedDate(date);
      setSelectedAssignments(assignments);
      setShowDetailModal(true);
    }
  };

  const handleViewAll = () => {
    router.push('/calendar');
  };

  return (
    <>
      <div className={`calendar-widget ${className}`}>
        <div className="calendar-widget-header">
          <div className="calendar-widget-title">
            <FiCalendar size={20} />
            <h3>{title}</h3>
          </div>
          {showViewAll && (
            <button 
              className="calendar-widget-view-all"
              onClick={handleViewAll}
            >
              View All
              <FiArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="calendar-widget-content">
          <CompactAssignmentCalendar onDateClick={handleDateClick} />
        </div>
      </div>

      <AssignmentDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDate(null);
          setSelectedAssignments([]);
        }}
        date={selectedDate}
        assignments={selectedAssignments}
      />
    </>
  );
}
