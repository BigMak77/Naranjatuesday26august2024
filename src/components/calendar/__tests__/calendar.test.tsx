/**
 * Test file for Assignment Calendar Components
 * 
 * This file contains basic tests to verify the calendar components
 * render correctly and handle user interactions properly.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssignmentCalendar, CompactAssignmentCalendar, CalendarWidget } from '../index';

// Mock the useUser hook
jest.mock('@/lib/useUser', () => ({
  useUser: () => ({
    user: { auth_id: 'test-user-123' },
    profile: { id: 'profile-123', auth_id: 'test-user-123' }
  })
}));

// Mock Supabase client
jest.mock('@/lib/supabase-client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          neq: jest.fn(() => ({
            not: jest.fn(() => ({
              data: [],
              error: null
            }))
          })),
          is: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('Assignment Calendar Components', () => {
  describe('AssignmentCalendar', () => {
    it('renders without crashing', () => {
      render(<AssignmentCalendar />);
      expect(screen.getByText(/Loading…/)).toBeInTheDocument();
    });

    it('displays current month in header', async () => {
      render(<AssignmentCalendar />);
      await waitFor(() => {
        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
        expect(screen.getByText(new RegExp(currentMonth))).toBeInTheDocument();
      });
    });

    it('has navigation buttons', async () => {
      render(<AssignmentCalendar />);
      await waitFor(() => {
        expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
        expect(screen.getByLabelText('Next month')).toBeInTheDocument();
        expect(screen.getByText('Today')).toBeInTheDocument();
      });
    });
  });

  describe('CompactAssignmentCalendar', () => {
    it('renders compact calendar', () => {
      const mockOnDateClick = jest.fn();
      render(<CompactAssignmentCalendar onDateClick={mockOnDateClick} />);
      
      // Should show month navigation
      expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
      expect(screen.getByLabelText('Next month')).toBeInTheDocument();
    });

    it('calls onDateClick when date is clicked', async () => {
      const mockOnDateClick = jest.fn();
      render(<CompactAssignmentCalendar onDateClick={mockOnDateClick} />);
      
      await waitFor(() => {
        const dayButtons = screen.getAllByText(/\d+/);
        if (dayButtons.length > 0) {
          fireEvent.click(dayButtons[0]);
          expect(mockOnDateClick).toHaveBeenCalled();
        }
      });
    });
  });

  describe('CalendarWidget', () => {
    it('renders widget with title', () => {
      render(<CalendarWidget title="Test Calendar" />);
      expect(screen.getByText('Test Calendar')).toBeInTheDocument();
    });

    it('shows View All button when enabled', () => {
      render(<CalendarWidget title="Test Calendar" showViewAll={true} />);
      expect(screen.getByText('View All')).toBeInTheDocument();
    });

    it('hides View All button when disabled', () => {
      render(<CalendarWidget title="Test Calendar" showViewAll={false} />);
      expect(screen.queryByText('View All')).not.toBeInTheDocument();
    });
  });
});

describe('Calendar Utilities', () => {
  describe('Date Formatting', () => {
    it('formats dates correctly', () => {
      const testDate = new Date('2025-11-05');
      expect(testDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })).toBe('Tuesday, November 5, 2025');
    });
  });

  describe('Assignment Priority Colors', () => {
    const getAssignmentColor = (assignment: any) => {
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

    it('returns danger color for overdue assignments', () => {
      const overdueAssignment = {
        due_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      };
      expect(getAssignmentColor(overdueAssignment)).toBe('var(--status-danger)');
    });

    it('returns warning color for assignments due soon', () => {
      const soonDueAssignment = {
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // In 2 days
      };
      expect(getAssignmentColor(soonDueAssignment)).toBe('var(--status-warning)');
    });

    it('returns danger color for urgent priority', () => {
      const urgentAssignment = {
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // In 7 days
        priority: 'urgent'
      };
      expect(getAssignmentColor(urgentAssignment)).toBe('var(--status-danger)');
    });

    it('returns info color for assignments without due date', () => {
      const noDueDateAssignment = { due_date: null };
      expect(getAssignmentColor(noDueDateAssignment)).toBe('var(--status-info)');
    });
  });
});
