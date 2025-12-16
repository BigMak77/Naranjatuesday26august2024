# Access Levels Guide

Complete breakdown of what each access level can do in the system.

## Access Level Hierarchy

```
Super Admin (Highest)
    ↓
Admin
    ↓
HR Admin / H&S Admin (Specialized admins)
    ↓
Dept. Manager (Department-wide manager)
    ↓
Manager (Shift-level manager)
    ↓
Trainer (Training specialist)
    ↓
User (Standard employee)
```

---

## 1. Super Admin

**WHO**: System owners, IT administrators
**SCOPE**: Entire system across all departments and shifts

### Can Access:
- ✅ Admin Dashboard (`/admin/dashboard`)
- ✅ HR Dashboard (`/hr/dashboard`)
- ✅ Trainer Dashboard (`/trainer/dashboard`)
- ✅ Manager Dashboard (`/manager`)
- ✅ Health & Safety (`/health-safety`)
- ✅ User Dashboard (`/user/dashboard`)

### Permissions:
- ✅ `canAccessAdmin` - Full admin panel access
- ✅ `canAccessManager` - Manager features
- ✅ `canAccessHR` - HR management
- ✅ `canAccessHS` - Health & Safety
- ✅ `canAccessTrainer` - Training management
- ✅ `canAccessUser` - User-level features
- ✅ `canManageUsers` - Create, edit, delete users
- ✅ `canManageRoles` - Manage roles and departments
- ✅ `canViewAllReports` - Access all reports
- ✅ `canManageSystem` - System configuration
- ✅ `canViewAllDepartments` - See all departments
- ✅ `canViewAllShifts` - See all shifts
- ✅ `canManageTraining` - Full training management

### Toolbar Access:
- Dashboard
- HR Dashboard
- Trainer Dashboard
- Training Modules
- Documents
- Tasks
- Issues
- Audits
- Compliance
- Reports
- Utilities
- Health & Safety
- Log Training

### What They Can Do:
- **Everything** - Full system access
- Manage all users across all departments
- Configure system settings
- Create and manage training modules
- View all reports and analytics
- Manage organizational structure
- Access all dashboards and features

---

## 2. Admin

**WHO**: Senior administrators, operations managers
**SCOPE**: Entire system (almost same as Super Admin)

### Can Access:
- ✅ Admin Dashboard
- ✅ HR Dashboard
- ✅ Trainer Dashboard
- ✅ Manager Dashboard
- ✅ Health & Safety
- ✅ User Dashboard

### Permissions:
- ✅ `canAccessAdmin`
- ✅ `canAccessManager`
- ✅ `canAccessHR`
- ✅ `canAccessHS`
- ✅ `canAccessTrainer`
- ✅ `canAccessUser`
- ✅ `canManageUsers`
- ✅ `canManageRoles`
- ✅ `canViewAllReports`
- ✅ `canManageSystem`
- ✅ `canViewAllDepartments`
- ✅ `canViewAllShifts`
- ✅ `canManageTraining`

### What They Can Do:
- Same as Super Admin
- Full access to all features
- Manage users and departments
- Configure training and compliance
- Access all reports and dashboards

---

## 3. HR Admin

**WHO**: HR managers, People Operations
**SCOPE**: All departments (HR focused)

### Can Access:
- ✅ HR Dashboard (`/hr/dashboard`)
- ✅ User Dashboard
- ❌ Admin Dashboard (no system config)
- ❌ Health & Safety
- ❌ Trainer Dashboard
- ❌ Manager Dashboard

### Permissions:
- ❌ `canAccessAdmin`
- ❌ `canAccessManager`
- ✅ `canAccessHR`
- ❌ `canAccessHS`
- ❌ `canAccessTrainer`
- ✅ `canAccessUser`
- ✅ `canManageUsers` - Full user management
- ✅ `canManageRoles` - Manage roles and departments
- ✅ `canViewAllReports` - Access all reports
- ❌ `canManageSystem`
- ✅ `canViewAllDepartments` - See all departments
- ✅ `canViewAllShifts` - See all shifts
- ❌ `canManageTraining`

### Toolbar Access:
- HR Dashboard
- People Management
- Department & Shifts
- Structure
- Reports

### What They Can Do:
- **People Management**: Create, edit, archive users
- **Department Management**: View and manage all departments
- **Shift Management**: View and manage all shifts
- **Reports**: Access HR reports across all departments
- **User Data**: Edit employee information, roles, departments
- **Cannot**: Configure system settings, manage training content, access H&S features

### View Scope:
- **Departments**: ALL departments
- **Shifts**: ALL shifts
- **No view permissions needed** - they see everything by default

---

## 4. H&S Admin (Health & Safety Admin)

**WHO**: Health & Safety officers, compliance managers
**SCOPE**: All departments (H&S focused)

### Can Access:
- ✅ Health & Safety Dashboard (`/health-safety`)
- ✅ User Dashboard
- ❌ Admin Dashboard
- ❌ HR Dashboard
- ❌ Trainer Dashboard
- ❌ Manager Dashboard

### Permissions:
- ❌ `canAccessAdmin`
- ❌ `canAccessManager`
- ❌ `canAccessHR`
- ✅ `canAccessHS`
- ❌ `canAccessTrainer`
- ✅ `canAccessUser`
- ❌ `canManageUsers`
- ❌ `canManageRoles`
- ✅ `canViewAllReports` - H&S reports
- ❌ `canManageSystem`
- ✅ `canViewAllDepartments` - For H&S monitoring
- ✅ `canViewAllShifts` - For H&S monitoring
- ❌ `canManageTraining`

### Toolbar Access:
- Health & Safety Dashboard
- Emergency Contacts
- Locations
- Templates
- Reports
- Settings
- Audit Log

### What They Can Do:
- **Health & Safety**: Manage incidents, first aid, safety protocols
- **Emergency Contacts**: Manage emergency contact information
- **Locations**: Manage site locations and safety data
- **Reports**: Generate H&S compliance reports
- **Audit Logs**: View H&S activity logs
- **Cannot**: Manage users, edit HR data, manage training

### View Scope:
- **Departments**: ALL departments
- **Shifts**: ALL shifts
- **No view permissions needed** - they see everything for H&S purposes

---

## 5. Dept. Manager (Department Manager)

**WHO**: Department heads, department supervisors
**SCOPE**: Their entire department (all shifts)

### Can Access:
- ✅ Manager Dashboard (`/manager`)
- ✅ User Dashboard
- ❌ Admin Dashboard
- ❌ HR Dashboard
- ❌ Health & Safety
- ❌ Trainer Dashboard

### Permissions:
- ❌ `canAccessAdmin`
- ✅ `canAccessManager`
- ❌ `canAccessHR`
- ❌ `canAccessHS`
- ❌ `canAccessTrainer`
- ✅ `canAccessUser`
- ❌ `canManageUsers`
- ❌ `canManageRoles`
- ❌ `canViewAllReports`
- ❌ `canManageSystem`
- ❌ `canViewAllDepartments` - **ONLY their department**
- ✅ `canViewAllShifts` - **All shifts in their department**
- ❌ `canManageTraining`

### Toolbar Access:
- Manager Dashboard
- My Team (all shifts in their department)
- Issues Management
- Reports (department-specific)

### What They Can Do:
- **Team Management**: View all team members in their department (all shifts)
- **Issues**: Manage department issues
- **Reports**: View department performance reports
- **Cannot**: Edit user data, manage other departments, create training

### Default View Scope:
- **Departments**: Their assigned department ONLY
- **Shifts**: ALL shifts within their department

### Extended View Permissions:
- Can be granted additional departments via `user_view_permissions`
- Can be granted additional shifts via `user_view_permissions`
- Use the 👥 icon in HR Admin → People to configure

---

## 6. Manager (Shift-Level Manager)

**WHO**: Shift supervisors, team leaders
**SCOPE**: Their shift in their department

### Can Access:
- ✅ Manager Dashboard (`/manager`)
- ✅ User Dashboard
- ❌ Admin Dashboard
- ❌ HR Dashboard
- ❌ Health & Safety
- ❌ Trainer Dashboard

### Permissions:
- ❌ `canAccessAdmin`
- ✅ `canAccessManager`
- ❌ `canAccessHR`
- ❌ `canAccessHS`
- ❌ `canAccessTrainer`
- ✅ `canAccessUser`
- ❌ `canManageUsers`
- ❌ `canManageRoles`
- ❌ `canViewAllReports`
- ❌ `canManageSystem`
- ❌ `canViewAllDepartments` - **ONLY their department**
- ❌ `canViewAllShifts` - **ONLY their shift**
- ❌ `canManageTraining`

### Toolbar Access:
- Manager Dashboard
- My Team (their shift only)
- Issues Management
- Reports (shift-specific)

### What They Can Do:
- **Team Management**: View team members on their shift
- **Issues**: Manage shift-level issues
- **Reports**: View shift performance reports
- **Cannot**: Edit user data, see other shifts, manage other departments

### Default View Scope:
- **Departments**: Their assigned department ONLY
- **Shifts**: Their assigned shift ONLY

### Extended View Permissions:
- ⚠️ **IMPORTANT**: This is where `user_view_permissions` is critical
- Can be granted additional departments via `user_view_permissions`
- Can be granted additional shifts via `user_view_permissions`
- Use the 👥 icon in HR Admin → People to configure

**Example Use Case:**
- Sarah is a Manager on the "Morning Shift" in "Warehouse"
- By default: She only sees Morning Shift + Warehouse employees
- HR Admin grants her Evening Shift access
- Now she sees: Morning Shift + Evening Shift in Warehouse
- HR Admin also grants her "Shipping" department access
- Now she sees: Morning & Evening shifts in Warehouse + Shipping

---

## 7. Trainer

**WHO**: Training coordinators, certified trainers
**SCOPE**: Assigned departments/shifts (multi-department capable)

### Can Access:
- ✅ Trainer Dashboard (`/trainer/dashboard`)
- ✅ User Dashboard
- ❌ Admin Dashboard
- ❌ HR Dashboard
- ❌ Health & Safety
- ❌ Manager Dashboard

### Permissions:
- ❌ `canAccessAdmin`
- ❌ `canAccessManager`
- ❌ `canAccessHR`
- ❌ `canAccessHS`
- ✅ `canAccessTrainer`
- ✅ `canAccessUser`
- ❌ `canManageUsers`
- ❌ `canManageRoles`
- ❌ `canViewAllReports`
- ❌ `canManageSystem`
- ❌ `canViewAllDepartments` - **Assigned departments only**
- ❌ `canViewAllShifts`
- ✅ `canManageTraining` - Log training, track completions

### Toolbar Access:
- Trainer Dashboard
- Log Training
- Training Modules
- Training Documents
- Training Reports

### What They Can Do:
- **Log Training**: Record training completions for users
- **View Training Status**: See who needs training
- **Track Progress**: Monitor training compliance
- **Cannot**: Create training modules (Admin only), edit user data, manage departments

### Default View Scope:
- **Departments**: Their assigned department (if set)
- **Shifts**: Their assigned shift (if set)
- **Often not assigned to specific dept/shift** - use permissions instead

### Extended View Permissions:
- ✅ **Use `user_view_permissions` to grant department access**
- ✅ **Use `user_view_permissions` to grant shift access**
- This allows trainers to work across multiple departments
- Use the 👥 icon in HR Admin → People to configure

**Example Use Case:**
- John is a Trainer for "First Aid" training
- He needs to train people in: Warehouse, Shipping, and Production
- HR Admin grants him: Warehouse, Shipping, Production departments
- Now John can log training for users in all 3 departments

---

## 8. User

**WHO**: Standard employees
**SCOPE**: Personal information only

### Can Access:
- ✅ User Dashboard (`/user/dashboard`)
- ❌ All other dashboards

### Permissions:
- ❌ `canAccessAdmin`
- ❌ `canAccessManager`
- ❌ `canAccessHR`
- ❌ `canAccessHS`
- ❌ `canAccessTrainer`
- ✅ `canAccessUser`
- ❌ `canManageUsers`
- ❌ `canManageRoles`
- ❌ `canViewAllReports`
- ❌ `canManageSystem`
- ❌ `canViewAllDepartments`
- ❌ `canViewAllShifts`
- ❌ `canManageTraining`

### Toolbar Access:
- User Dashboard
- Profile
- My Training
- Tasks (assigned to them)

### What They Can Do:
- **View Profile**: See their own information
- **Training History**: View their training records
- **Tasks**: See tasks assigned to them
- **Cannot**: View other users, manage anything, access admin features

### View Scope:
- **Only themselves** - no access to other users' data

---

## ⚠️ IMPORTANT: Self-Access to Training

**ALL users, regardless of access level, can ALWAYS view their own training records.**

This is a fundamental rule that overrides all department/shift restrictions:

- ✅ A Manager can view their own training assignments
- ✅ A User can view their own training history
- ✅ A Trainer can view their own training records
- ✅ Everyone can see what training they've completed or need to complete

### How This Works:

Training queries use `auth_id` (the user's own ID) when fetching personal training:

```typescript
// User's own training - ALWAYS accessible
const { data } = await supabase
  .from("user_assignments")
  .select("*")
  .eq("auth_id", currentUser.auth_id);  // Their own auth_id
```

This is separate from viewing **other users' training**, which is restricted by access level and view permissions.

### Example:

- Sarah is a Manager in the "Warehouse" department on "Morning Shift"
- Sarah can **ALWAYS** see her own training (First Aid, Safety, etc.)
- But Sarah can only see training for **OTHER users** in Warehouse + Morning Shift
- If granted extended permissions, Sarah can see **OTHER users'** training in additional departments/shifts
- But her **OWN training is always visible** regardless of permissions

---

## Special Flag: `is_trainer`

There's also a separate boolean field `is_trainer` that can be set on ANY user regardless of their access_level.

### What it does:
- Allows users with other access levels to also log training
- Example: An HR Admin who is also certified to train can have `is_trainer = true`
- Shows the 👥 permissions icon in HR Admin → People table

### Common Combinations:
- `access_level = "Manager"` + `is_trainer = true` → Manager who can also log training
- `access_level = "HR Admin"` + `is_trainer = true` → HR Admin who can also train
- `access_level = "Trainer"` + `is_trainer = true` → Standard trainer setup

---

## View Permissions System (`user_view_permissions` table)

### Who Uses It:
- ✅ Managers (shift-level)
- ✅ Dept. Managers
- ✅ Trainers
- ✅ Anyone with `is_trainer = true`

### Who Doesn't Need It:
- ❌ Super Admin (sees everything)
- ❌ Admin (sees everything)
- ❌ HR Admin (sees everything)
- ❌ H&S Admin (sees everything)
- ❌ User (sees only themselves)

### How It Works:
1. User has default access to their `department_id` and `shift_id`
2. HR Admin can grant **additional** departments and shifts
3. These are stored in the `user_view_permissions` table
4. Application queries combine default + extended permissions

### Example Query Pattern:
```typescript
// Get what user can view
const canViewDepartments = [
  user.department_id,  // Their default department
  ...additionalDepartments  // From user_view_permissions
];

const canViewShifts = [
  user.shift_id,  // Their default shift
  ...additionalShifts  // From user_view_permissions
];
```

---

## Quick Reference Table

| Access Level | View All Depts | View All Shifts | Manage Users | Manage Training | Needs Permissions |
|--------------|----------------|-----------------|--------------|-----------------|-------------------|
| Super Admin  | ✅ | ✅ | ✅ | ✅ | ❌ |
| Admin        | ✅ | ✅ | ✅ | ✅ | ❌ |
| HR Admin     | ✅ | ✅ | ✅ | ❌ | ❌ |
| H&S Admin    | ✅ | ✅ | ❌ | ❌ | ❌ |
| Dept. Manager| ❌ (Own only) | ✅ (In dept) | ❌ | ❌ | ⚠️ Optional |
| Manager      | ❌ (Own only) | ❌ (Own only) | ❌ | ❌ | ⚠️ **Yes** |
| Trainer      | ❌ (Assigned) | ❌ (Assigned) | ❌ | ✅ | ⚠️ **Yes** |
| User         | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Navigation Quick Reference

### Super Admin / Admin
- Admin Dashboard
- HR Dashboard
- Trainer Dashboard
- Manager Dashboard
- Health & Safety
- Training Modules
- Documents
- Tasks
- Issues
- Audits
- Reports
- Utilities

### HR Admin
- HR Dashboard
- People Management
- Department & Shifts
- Structure
- Reports

### H&S Admin
- Health & Safety Dashboard
- Emergency Contacts
- Locations
- Templates
- Reports
- Settings

### Dept. Manager / Manager
- Manager Dashboard
- My Team
- Issues
- Reports

### Trainer
- Trainer Dashboard
- Log Training
- Training Modules
- Training Documents
- Reports

### User
- User Dashboard
- My Profile
- My Training
- My Tasks

---

## Configuration Files

- **Permissions Definition**: `/src/lib/permissions.ts`
- **View Permissions Migration**: `/supabase/migrations/20251216_create_trainer_permissions.sql`
- **Permissions Dialog**: `/src/components/user/UserViewPermissionsDialog.tsx`
- **Dynamic Toolbar**: `/src/components/ui-toolbars/DynamicToolbar.tsx`

---

## Need to Grant Extended Access?

1. Go to HR Admin → People
2. Find the user (Manager, Dept. Manager, or Trainer)
3. Look for the green 👥 icon in the "Trainer" column
4. Click it to open the View Permissions dialog
5. Select additional departments and/or shifts
6. Save

The user will now be able to view data from those additional departments/shifts!
