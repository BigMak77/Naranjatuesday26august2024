# Access Control Debugging Guide

## If Super Admin is still being denied access:

### Step 1: Check the Browser Console
1. Open the page where access is denied: http://localhost:3000/turkus/issues
2. Open browser DevTools (F12 or Right-click > Inspect)
3. Go to the Console tab
4. Look for logs starting with `[AccessControlWrapper]`

You should see something like:
```
[AccessControlWrapper] Checking access: {
  userAccessLevel: "...",
  userAccessLevelType: "...",
  requiredRoles: [...],
  normalizedUserLevel: "..."
}
[AccessControlWrapper] Access result: true/false
```

### Step 2: Check Database Value

Run this query in your Supabase SQL editor or database client:

```sql
SELECT id, email, access_level, first_name, last_name
FROM users
WHERE email = 'your-super-admin-email@example.com';
```

**Expected value for Super Admin:** `"Super Admin"` (exactly this string with capital S and A)

**Common issues:**
- Value is a number like `5` instead of `"Super Admin"`
- Value has wrong capitalization like `"super admin"` or `"SUPER ADMIN"`
- Value has extra spaces like `"Super Admin "` or `" Super Admin"`

### Step 3: Fix Database Value (if needed)

If the access_level is wrong, update it:

```sql
UPDATE users
SET access_level = 'Super Admin'
WHERE email = 'your-super-admin-email@example.com';
```

Then log out and log back in to refresh your session.

### Step 4: Valid Access Level Values

Your database `access_level` column should ONLY contain these exact values:
- `"Super Admin"` (highest level - access to everything)
- `"Admin"` (high level admin)
- `"HR Admin"` (HR administration)
- `"H&S Admin"` (Health & Safety admin)
- `"Dept. Manager"` (Department manager)
- `"Manager"` (Shift manager)
- `"Trainer"` (Trainer role)
- `"User"` (Basic user)

Case and spacing matter! They must match exactly.

### Step 5: Clear Browser Cache

If the database is correct but access is still denied:
1. Log out of the application
2. Clear browser cache and cookies for localhost
3. Close all browser tabs for the app
4. Restart the dev server (`npm run dev`)
5. Log back in

### Step 6: Check User Context

Add this temporary debug component to any page:

```tsx
import { useUser } from "@/lib/useUser";

export function DebugUser() {
  const { user } = useUser();
  return (
    <pre style={{ background: '#000', color: '#0f0', padding: '10px', margin: '10px' }}>
      {JSON.stringify(user, null, 2)}
    </pre>
  );
}
```

This will show your complete user object including the access_level value.

## Common Issues & Solutions

### Issue: "Access denied" but I'm Super Admin in database
**Solution:** Log out and log back in. The user context caches the access_level from when you logged in.

### Issue: Access works on some pages but not others
**Solution:** Check if those pages have different `requiredRoles`. Some pages might not include "Super Admin" in the allowed roles (though they should).

### Issue: Console shows `normalizedUserLevel: "5"` instead of "super admin"
**Solution:** Your database is storing numeric IDs instead of role names. Update your database to use role names instead.

### Issue: Access level is correct but canAccessRoute returns false
**Solution:** There might be a type mismatch. Check that the value is a string, not a number. Use `String(data.access_level)` when setting the user.

## Need More Help?

If none of these steps work:
1. Share the console output from Step 1
2. Share the database query result from Step 2
3. Share any error messages you see

The access control system has been properly implemented - the issue is likely with:
- Data format in the database
- Session caching
- Browser cache
