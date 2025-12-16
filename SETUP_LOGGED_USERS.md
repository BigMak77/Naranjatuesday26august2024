# LoggedUsers Component Setup Guide

## Overview
The LoggedUsers component displays user login history from Supabase, showing when users last signed in.

## Setup Steps

### 1. Apply the Database Migration

Run the migration to create the database function:

```bash
npx supabase db push
```

Or if you're using the Supabase CLI:

```bash
supabase migration up
```

### 2. Use the Component

Import and use the component in any page:

```tsx
import LoggedUsers from '@/components/utility/LoggedUsers';

export default function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <LoggedUsers />
    </div>
  );
}
```

## How It Works

1. The component calls the `get_user_login_times()` database function
2. This function has `SECURITY DEFINER` which allows it to access `auth.users` table
3. The function returns user email, last sign-in time, and account creation date
4. The component displays this in a nice table with relative time formatting

## Security Considerations

The current implementation allows any authenticated user to view login times. If you want to restrict this to admins only:

1. Uncomment the role check in the migration file:
```sql
IF NOT EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
) THEN
  RAISE EXCEPTION 'Insufficient permissions';
END IF;
```

2. Adjust the query to match your roles table structure

## Features

- Real-time relative timestamps ("5 minutes ago", "2 hours ago", etc.)
- Handles users who have never logged in
- Loading and error states
- Responsive table design
- Shows total user count

## Troubleshooting

If you see an error about the function not existing:
1. Make sure you ran the migration
2. Check that you're connected to the correct Supabase project
3. Verify the function exists by running in SQL editor:
   ```sql
   SELECT * FROM get_user_login_times();
   ```

If you get a "Not authenticated" error:
- Make sure the user is logged in before accessing the component
- Wrap the component in an auth check or protected route
