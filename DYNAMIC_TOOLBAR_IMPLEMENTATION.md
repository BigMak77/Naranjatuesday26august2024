// Example usage of the Dynamic Toolbar System

## Overview
The new toolbar system automatically shows the appropriate toolbar based on the user's access level:

### Components Created:
1. **ManagerToolbar** - Toolbar specifically for Manager users
2. **DynamicToolbar** - Smart toolbar that shows the right toolbar based on user role
3. **AppLayoutWrapper** - Universal layout wrapper with toolbar integration

### Access Level to Toolbar Mapping:
- **Admin** → AdminToolbar (with admin-specific actions)
- **Manager** → ManagerToolbar (with team management actions)
- **HR/HR Admin** → HR Toolbar (with HR-specific actions)
- **Trainer** → Trainer Toolbar (with training-specific actions)
- **H&S Admin** → Health & Safety Toolbar
- **User** → Basic User Toolbar
- **Unknown/None** → Default basic toolbar

### Usage Examples:

#### 1. In Layout Files (Automatic):
```tsx
// app/manager/layout.tsx
import AppLayoutWrapper from "@/components/ui/AppLayoutWrapper";

export default function ManagerLayout({ children }) {
  return (
    <>
      <AuthListener />
      <AppLayoutWrapper forceToolbarType="manager">
        {children}
      </AppLayoutWrapper>
    </>
  );
}
```

#### 2. Direct Component Usage:
```tsx
import DynamicToolbar from "@/components/ui/DynamicToolbar";

// Shows toolbar based on logged-in user's access level
<DynamicToolbar 
  onViewChange={(view) => console.log('View changed to:', view)}
  onAddEmployee={() => router.push('/hr/employees/add')}
  onManageTeam={() => setShowTeamModal(true)}
  onViewReports={() => router.push('/manager/reports')}
/>

// Force a specific toolbar type
<DynamicToolbar forceToolbarType="manager" />
```

#### 3. Manager Toolbar Specific Usage:
```tsx
import ManagerToolbar from "@/components/ui/ManagerToolbar";

<ManagerToolbar
  onAddEmployee={() => router.push('/hr/employees/add')}
  onManageTeam={() => setShowTeamManagement(true)}
  onViewReports={() => router.push('/manager/reports')}
  onViewChange={(view) => setCurrentView(view)}
/>
```

### Features:
- **Automatic Role Detection**: Uses UserContext to determine user's access level
- **Flexible Overrides**: Can force specific toolbar types when needed
- **Consistent Styling**: Uses existing section-toolbar CSS classes
- **Extensible**: Easy to add new toolbar types for other roles
- **Callback Support**: All actions are customizable via props

### Integration Status:
✅ ManagerToolbar component created
✅ DynamicToolbar smart router created  
✅ AppLayoutWrapper universal layout created
✅ Updated Admin/Manager/HR/User/Trainer layouts
✅ Fixed AdminToolbar to accept props
✅ All TypeScript errors resolved

The system is now ready for use and will automatically show the appropriate toolbar for each user based on their access level.
