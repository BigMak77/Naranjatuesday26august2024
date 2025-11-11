# Assignment Calendar Components

This directory contains calendar components that highlight when users have assignments due from the `user_assignments` and `turkus_unified_assignments` tables.

## Components

### 1. AssignmentCalendar
A full-featured calendar component that displays assignments in a monthly view.

**Features:**
- Monthly calendar view with navigation
- Color-coded assignment indicators based on priority and due dates
- Interactive day clicking to view assignment details  
- Legend showing color meanings
- Responsive design
- Integration with assignment detail modal

**Usage:**
```tsx
import { AssignmentCalendar } from '@/components/calendar';

function CalendarPage() {
  return <AssignmentCalendar />;
}
```

### 2. CompactAssignmentCalendar
A smaller, widget-friendly version of the calendar.

**Features:**
- Compact monthly view
- Assignment dots on dates with due items
- Click handler for date selection  
- Minimal UI suitable for dashboard widgets
- Quick stats display

**Usage:**
```tsx
import { CompactAssignmentCalendar } from '@/components/calendar';

function Dashboard() {
  const handleDateClick = (date: Date, assignments: Assignment[]) => {
    // Handle date click
    console.log('Selected date:', date, 'with assignments:', assignments);
  };

  return (
    <CompactAssignmentCalendar onDateClick={handleDateClick} />
  );
}
```

### 3. CalendarWidget
A complete dashboard widget that combines the compact calendar with modal functionality.

**Features:**
- Self-contained widget with header and "View All" link
- Integrated assignment detail modal
- Perfect for dashboard integration
- Customizable title and styling

**Usage:**
```tsx
import { CalendarWidget } from '@/components/calendar';

function UserDashboard() {
  return (
    <div className="dashboard-widgets">
      <CalendarWidget 
        title="My Assignments" 
        showViewAll={true}
        className="calendar-widget-custom"
      />
    </div>
  );
}
```

### 4. AssignmentDetailModal
A modal that displays detailed assignment information for a selected date.

**Features:**
- Detailed assignment list for selected date
- Priority indicators and overdue warnings
- Assignment completion functionality
- Responsive design
- Assignment type icons

**Usage:**
```tsx
import { AssignmentDetailModal } from '@/components/calendar';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const handleMarkComplete = async (assignmentId: string) => {
    // Handle assignment completion
  };

  return (
    <AssignmentDetailModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      date={selectedDate}
      assignments={assignments}
      onMarkComplete={handleMarkComplete}
    />
  );
}
```

## Data Sources

The calendar components fetch assignments from two tables:

### 1. `user_assignments` Table
Legacy assignments table with structure:
- `id`: Assignment ID
- `auth_id`: User's auth ID
- `item_id`: Referenced item ID (module, document, etc.)
- `item_type`: Type of assignment ('module', 'document', 'audit')
- `completed_at`: Completion timestamp

**Note:** This table may not have explicit due dates, so the component estimates them:
- Training modules: 30 days from assignment
- Document reviews: Based on `review_period_months`
- Audits: Uses audit's `due_date` field

### 2. `turkus_unified_assignments` Table
New unified assignments table with structure:
- `id`: Assignment ID
- `assigned_to`: User's auth ID  
- `reference_id`: Referenced item ID
- `assignment_type`: Type of assignment
- `due_date`: Explicit due date
- `status`: Assignment status
- `priority`: Priority level ('low', 'medium', 'high', 'urgent')
- `metadata`: Additional assignment data

## Color Coding

The calendar uses a color-coded system to indicate assignment urgency:

- **Red (Danger)**: Overdue assignments or urgent priority
- **Orange (Warning)**: Due within 3 days or high priority  
- **Green (Success)**: Normal priority assignments
- **Blue (Info)**: No due date or low priority

## Integration Examples

### Dashboard Integration
```tsx
// In UserView.tsx
import { CalendarWidget } from "@/components/calendar";

export default function UserView() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem' }}>
      <div>
        <MyTasks />
        <MyIssues />
      </div>
      <CalendarWidget title="My Assignments" />
    </div>
  );
}
```

### Full Page Calendar
```tsx
// In app/calendar/page.tsx
import { AssignmentCalendar } from "@/components/calendar";
import ContentHeader from "@/components/ui/ContentHeader";

export default function CalendarPage() {
  return (
    <>
      <ContentHeader 
        title="Assignment Calendar"
        description="View your assignments and due dates"
      />
      <AssignmentCalendar />
    </>
  );
}
```

### Manager Dashboard Integration
```tsx
// Show team assignments in manager view
import { CalendarWidget } from "@/components/calendar";

function ManagerDashboard() {
  return (
    <div className="manager-widgets">
      <CalendarWidget 
        title="Team Assignments"
        showViewAll={true}
      />
    </div>
  );
}
```

## Styling

The components use the existing neon theme with CSS custom properties:
- `--panel`: Background color
- `--border`: Border color
- `--neon`: Accent color
- `--status-*`: Status colors for priorities
- `--text-white`: Text color
- `--header-text`: Header text color

Custom CSS classes are available:
- `.assignment-calendar`: Main calendar container
- `.compact-assignment-calendar`: Compact calendar container  
- `.calendar-widget`: Widget container
- `.assignment-detail-modal`: Modal container

## Responsive Design

All components are fully responsive:
- Desktop: Full featured layout
- Tablet: Adjusted spacing and layout
- Mobile: Stacked layout with touch-friendly interactions

## Error Handling

The components gracefully handle:
- Missing assignment data
- Database connection issues  
- Invalid date formats
- Missing user authentication
- Table permission errors

## Future Enhancements

Potential improvements:
- Week view mode
- Assignment filtering by type/priority
- Drag-and-drop assignment rescheduling
- Team calendar view for managers
- Calendar export functionality
- Assignment reminders/notifications
- Integration with external calendar systems
