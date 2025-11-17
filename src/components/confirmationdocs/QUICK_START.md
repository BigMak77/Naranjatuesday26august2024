# Quick Start Guide - Document Confirmations

## Installation

### 1. Run the Database Migration

```bash
psql -d your_database -f scripts/add-confirmation-to-user-assignments.sql
```

This adds confirmation tracking to your existing `user_assignments` table.

### 2. Import Components

```typescript
import {
  AssignmentConfirmation,
  PendingConfirmationsList,
  ConfirmationBadge,
} from "@/components/confirmationdocs";
```

## Common Use Cases

### Use Case 1: Show Pending Confirmations on Dashboard

```typescript
// components/Dashboard.tsx
import { PendingConfirmationsList } from "@/components/confirmationdocs";
import { useUser } from "@/lib/useUser";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div>
      <h1>My Dashboard</h1>
      <PendingConfirmationsList
        userId={user.id}
        onConfirmClick={(assignmentId) =>
          router.push(`/confirm/${assignmentId}`)
        }
      />
    </div>
  );
}
```

### Use Case 2: Add Badge to Navbar

```typescript
// components/Navbar.tsx
import { ConfirmationBadge } from "@/components/confirmationdocs";
import { useUser } from "@/lib/useUser";

export default function Navbar() {
  const { user } = useUser();

  return (
    <nav>
      <div className="nav-links">
        {/* other nav items */}
        <ConfirmationBadge
          userId={user.id}
          onClick={() => router.push("/confirmations")}
        />
      </div>
    </nav>
  );
}
```

### Use Case 3: Confirmation Page

```typescript
// app/confirm/[assignmentId]/page.tsx
"use client";

import { AssignmentConfirmation } from "@/components/confirmationdocs";
import { useUser } from "@/lib/useUser";
import { useRouter } from "next/navigation";

export default function ConfirmPage({ params }: { params: { assignmentId: string } }) {
  const { user } = useUser();
  const router = useRouter();

  return (
    <div className="container">
      <AssignmentConfirmation
        assignmentId={params.assignmentId}
        userId={user.id}
        onConfirm={() => {
          // Show success message
          router.push("/dashboard?confirmed=true");
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}
```

### Use Case 4: Assign Document with Confirmation Required

```typescript
// When assigning a document to a user
const assignDocument = async (documentId: string, userId: string) => {
  const { error } = await supabase
    .from("user_assignments")
    .insert({
      auth_id: userId,
      item_id: documentId,
      item_type: "document",
      assigned_at: new Date().toISOString(),
      due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 7 days
      confirmation_required: true, // ⭐ This enables confirmation tracking
    });

  if (!error) {
    // Optionally send notification
    // Redirect user to confirmation page
  }
};
```

### Use Case 5: Check Confirmation Status

```typescript
// Query assignments with confirmation info
const { data: assignments } = await supabase
  .from("user_assignments")
  .select("*")
  .eq("auth_id", userId)
  .eq("item_type", "document")
  .eq("confirmation_required", true);

// Separate into confirmed and pending
const confirmed = assignments?.filter(a => a.confirmed_at !== null) || [];
const pending = assignments?.filter(a => a.confirmed_at === null) || [];

console.log(`${pending.length} pending confirmations`);
console.log(`${confirmed.length} completed confirmations`);
```

### Use Case 6: Admin Report - Who Confirmed What

```typescript
// Admin view to see all confirmations
const { data: confirmations } = await supabase
  .from("confirmation_report")
  .select("*")
  .order("confirmed_at", { ascending: false });

// Export to CSV, display in table, etc.
confirmations?.forEach(c => {
  console.log(`${c.user_name} confirmed "${c.item_title}" on ${new Date(c.confirmed_at).toLocaleDateString()}`);
  console.log(`Signature: ${c.confirmation_signature}`);
  console.log(`Time to confirm: ${c.hours_to_confirm} hours`);
});
```

### Use Case 7: Get Count of Pending Confirmations

```typescript
// Using the database function
const { data: count } = await supabase.rpc(
  "get_pending_confirmations_count",
  { p_auth_id: userId }
);

console.log(`User has ${count} pending confirmations`);
```

### Use Case 8: Manual Confirmation (Server-side)

```typescript
// Confirm an assignment programmatically (e.g., in an API route)
const { data } = await supabase.rpc("confirm_user_assignment", {
  p_assignment_id: assignmentId,
  p_signature: "John Doe",
  p_notes: "Confirmed during onboarding session",
  p_ip_address: "192.168.1.1",
});

// Returns: { assignment_id, confirmed_at, signature }
```

## Database Views

Two helpful views are created:

### `pending_confirmations`
Shows all unconfirmed assignments with item details:
```sql
SELECT * FROM pending_confirmations WHERE auth_id = 'user-uuid';
```

### `confirmation_report`
Shows all confirmed assignments with metrics:
```sql
SELECT * FROM confirmation_report WHERE department = 'Engineering';
```

## Real-time Updates

`ConfirmationBadge` automatically subscribes to real-time changes, so the count updates instantly when:
- A new assignment is created with `confirmation_required = true`
- A user confirms an assignment
- An assignment is deleted

## Styling

All components use the Neon design system classes from your `globals.css`:
- `.neon-card`
- `.neon-form`
- `.neon-input`
- `.neon-badge-warning`
- `.neon-link`
- etc.

## TypeScript Support

All components are fully typed. Import types as needed:

```typescript
import type {
  AssignmentConfirmationProps,
  ConfirmationRecord,
  ConfirmationListRecord,
} from "@/components/confirmationdocs";
```

## Tips

1. **Set confirmation_required = true** when creating assignments that need user acknowledgment
2. **Use PendingConfirmationsList** on dashboards to show users what they need to confirm
3. **Use ConfirmationBadge** in navigation to alert users of pending confirmations
4. **Use AssignmentConfirmation** on a dedicated confirmation page
5. **Query confirmation_report view** for admin reporting and compliance tracking
6. **Check confirmed_at IS NOT NULL** to verify if an assignment has been confirmed
7. **Use the database functions** for server-side operations and counting

## Security

- RLS policies ensure users can only confirm their own assignments
- The `confirm_user_assignment` function validates ownership before updating
- Electronic signatures are stored for audit trail
- IP addresses can be captured for additional security (optional)

## Next Steps

- Add email notifications when new confirmations are required
- Create admin dashboard to monitor confirmation compliance rates
- Add reminders for overdue confirmations
- Generate compliance reports by department or time period
