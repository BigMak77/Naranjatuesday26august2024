# Document Confirmation Components

A complete solution for tracking user confirmations and acknowledgments of documents in your application.

## Two Approaches

This package provides **two approaches** for handling document confirmations:

1. **Standalone Approach**: Separate `document_confirmations` table (original implementation)
2. **Integrated Approach**: Confirmation columns in `user_assignments` table ⭐ **RECOMMENDED**

The integrated approach is recommended as it keeps all assignment tracking in one place and works seamlessly with your existing assignment system.

---

## Integrated Approach (user_assignments)

### Setup

Run the migration to add confirmation columns to `user_assignments`:

```bash
psql -d your_database -f scripts/add-confirmation-to-user-assignments.sql
```

This adds:
- Confirmation tracking columns to `user_assignments` table
- Two database views: `pending_confirmations` and `confirmation_report`
- Database functions for confirming assignments and counting pending confirmations
- Indexes for performance

### Components (Integrated)

#### 1. AssignmentConfirmation
Main component for confirming an assignment (document or module).

**Props:**
```typescript
interface AssignmentConfirmationProps {
  assignmentId: string;         // Required: user_assignments.id
  userId: string;               // Required: User's auth UUID
  onConfirm?: () => void;       // Callback on success
  onCancel?: () => void;        // Cancel callback
  customAgreementText?: string; // Custom agreement text
}
```

**Usage:**
```typescript
import { AssignmentConfirmation } from "@/components/confirmationdocs";

function ConfirmAssignmentPage({ assignmentId }) {
  const { user } = useUser();

  return (
    <AssignmentConfirmation
      assignmentId={assignmentId}
      userId={user.id}
      onConfirm={() => router.push("/dashboard")}
      onCancel={() => router.back()}
    />
  );
}
```

#### 2. PendingConfirmationsList
Shows all pending confirmations for a user with action buttons.

**Props:**
```typescript
interface PendingConfirmationsListProps {
  userId: string;                                    // Required
  onConfirmClick?: (assignmentId: string) => void;  // Click handler
  showCount?: boolean;                              // Show count badge
}
```

**Usage:**
```typescript
import { PendingConfirmationsList } from "@/components/confirmationdocs";

function UserDashboard() {
  const { user } = useUser();

  return (
    <PendingConfirmationsList
      userId={user.id}
      onConfirmClick={(id) => router.push(`/confirm/${id}`)}
    />
  );
}
```

#### 3. ConfirmationBadge
Small badge showing count of pending confirmations (with real-time updates).

**Props:**
```typescript
interface ConfirmationBadgeProps {
  userId: string;        // Required
  showZero?: boolean;    // Show when count is 0 (default: false)
  className?: string;    // Additional CSS classes
  onClick?: () => void;  // Click handler
}
```

**Usage:**
```typescript
import { ConfirmationBadge } from "@/components/confirmationdocs";

function Navbar() {
  const { user } = useUser();

  return (
    <nav>
      <ConfirmationBadge
        userId={user.id}
        onClick={() => router.push("/confirmations")}
      />
    </nav>
  );
}
```

### Database Schema (Integrated)

New columns added to `user_assignments`:
```sql
- confirmation_required: BOOLEAN (default false)
- confirmed_at: TIMESTAMPTZ
- confirmation_signature: TEXT
- confirmation_ip_address: INET
- confirmation_notes: TEXT
```

### Database Functions

**confirm_user_assignment()**
```sql
confirm_user_assignment(
  p_assignment_id UUID,
  p_signature TEXT,
  p_notes TEXT,
  p_ip_address INET
) RETURNS JSONB
```

**get_pending_confirmations_count()**
```sql
get_pending_confirmations_count(p_auth_id UUID) RETURNS INTEGER
```

### Workflow Example (Integrated)

1. **Assign a document/module with confirmation requirement:**
```typescript
const { error } = await supabase
  .from("user_assignments")
  .insert({
    auth_id: userId,
    item_id: documentId,
    item_type: "document",
    assigned_at: new Date().toISOString(),
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    confirmation_required: true, // ⭐ Key flag
  });
```

2. **Show pending confirmations on dashboard:**
```typescript
import { PendingConfirmationsList, ConfirmationBadge } from "@/components/confirmationdocs";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div>
      <header>
        <ConfirmationBadge userId={user.id} />
      </header>

      <main>
        <PendingConfirmationsList
          userId={user.id}
          onConfirmClick={(id) => router.push(`/confirm/${id}`)}
        />
      </main>
    </div>
  );
}
```

3. **Confirmation page:**
```typescript
import { AssignmentConfirmation } from "@/components/confirmationdocs";

export default function ConfirmPage({ params }) {
  const { user } = useUser();

  return (
    <AssignmentConfirmation
      assignmentId={params.assignmentId}
      userId={user.id}
      onConfirm={() => router.push("/dashboard")}
    />
  );
}
```

4. **Check confirmation status in queries:**
```typescript
const { data } = await supabase
  .from("user_assignments")
  .select("*, confirmed_at, confirmation_signature")
  .eq("auth_id", userId)
  .eq("confirmation_required", true);

// Filter confirmed vs pending
const confirmed = data.filter(a => a.confirmed_at !== null);
const pending = data.filter(a => a.confirmed_at === null);
```

---

## Standalone Approach (document_confirmations table)

### Setup

Run the migration to create the standalone table:

```bash
psql -d your_database -f scripts/create-document-confirmations-table.sql
```

### Components (Standalone)

### 1. DocumentConfirmation
Main component that displays a confirmation form for users to acknowledge they have read and agree to abide by a document's contents.

**Features:**
- Electronic signature capture
- Agreement checkbox with customizable text
- User information display
- IP address tracking (optional)
- Prevents duplicate confirmations

**Props:**
```typescript
interface DocumentConfirmationProps {
  documentId: string;              // Required: UUID of the document
  documentTitle: string;            // Required: Title to display
  documentUrl?: string;             // Optional: Link to view the document
  userId: string;                   // Required: User's auth UUID
  userEmail?: string;               // Optional: User's email
  userName?: string;                // Optional: User's display name
  requiresSignature?: boolean;      // Optional: Default true
  onConfirm?: (confirmationId: string) => void;  // Callback on success
  onCancel?: () => void;            // Optional: Cancel callback
  customAgreementText?: string;     // Optional: Custom agreement text
}
```

**Usage:**
```typescript
import { DocumentConfirmation } from "@/components/confirmationdocs";

function AssignDocumentPage() {
  const handleConfirm = (confirmationId: string) => {
    console.log("Document confirmed:", confirmationId);
    // Redirect or show success message
  };

  return (
    <DocumentConfirmation
      documentId="123e4567-e89b-12d3-a456-426614174000"
      documentTitle="Health & Safety Policy 2024"
      documentUrl="/documents/hs-policy-2024.pdf"
      userId={currentUser.id}
      userEmail={currentUser.email}
      userName={currentUser.name}
      onConfirm={handleConfirm}
      onCancel={() => router.back()}
    />
  );
}
```

### 2. DocumentConfirmationStatus
Displays the current confirmation status for a user and document.

**Props:**
```typescript
interface DocumentConfirmationStatusProps {
  documentId: string;    // Required: Document UUID
  userId: string;        // Required: User UUID
  showDetails?: boolean; // Optional: Show confirmation details (default: false)
}
```

**Usage:**
```typescript
import { DocumentConfirmationStatus } from "@/components/confirmationdocs";

function DocumentRow({ documentId, userId }) {
  return (
    <div>
      <h3>Health & Safety Policy</h3>
      <DocumentConfirmationStatus
        documentId={documentId}
        userId={userId}
        showDetails={true}
      />
    </div>
  );
}
```

### 3. DocumentConfirmationList
Admin view showing all confirmations for a specific document with export functionality.

**Props:**
```typescript
interface DocumentConfirmationListProps {
  documentId: string;       // Required: Document UUID
  documentTitle?: string;   // Optional: Display title
}
```

**Usage:**
```typescript
import { DocumentConfirmationList } from "@/components/confirmationdocs";

function DocumentAdminPage({ documentId }) {
  return (
    <div>
      <h1>Document Confirmations Report</h1>
      <DocumentConfirmationList
        documentId={documentId}
        documentTitle="Health & Safety Policy 2024"
      />
    </div>
  );
}
```

## Database Setup

Run the SQL migration to create the required table:

```bash
psql -d your_database -f scripts/create-document-confirmations-table.sql
```

This creates:
- `document_confirmations` table with RLS policies
- `document_confirmation_report` view for reporting
- Indexes for performance
- Unique constraint to prevent duplicate confirmations

## Database Schema

```sql
document_confirmations:
  - id: UUID (primary key)
  - document_id: UUID (foreign key -> documents)
  - user_id: UUID (foreign key -> user auth)
  - user_email: TEXT
  - user_name: TEXT
  - signature: TEXT (electronic signature)
  - confirmed_at: TIMESTAMPTZ
  - ip_address: INET (optional)
  - user_agent: TEXT (optional)
  - created_at: TIMESTAMPTZ
```

## Security

Row Level Security (RLS) policies ensure:
- Users can only view their own confirmations
- Users can only create confirmations for themselves
- Admins/HR can view all confirmations
- Unique constraint prevents duplicate confirmations

## Workflow Example

1. **Assign Document to User:**
```typescript
// In your document assignment flow
const assignDocument = async (documentId: string, userId: string) => {
  // Create assignment record
  await supabase.from("document_assignments").insert({
    document_id: documentId,
    user_id: userId,
    assigned_at: new Date().toISOString(),
  });

  // Redirect to confirmation page
  router.push(`/confirm-document/${documentId}`);
};
```

2. **Confirmation Page:**
```typescript
"use client";

import { DocumentConfirmation } from "@/components/confirmationdocs";
import { useUser } from "@/lib/useUser";

export default function ConfirmDocumentPage({ params }) {
  const { user } = useUser();

  return (
    <DocumentConfirmation
      documentId={params.documentId}
      documentTitle="Policy Document"
      userId={user.id}
      userEmail={user.email}
      userName={user.name}
      onConfirm={(id) => router.push("/dashboard")}
    />
  );
}
```

3. **Admin Report:**
```typescript
import { DocumentConfirmationList } from "@/components/confirmationdocs";

export default function AdminReportPage() {
  return (
    <div>
      <h1>Document Confirmations</h1>
      <DocumentConfirmationList
        documentId="doc-uuid-here"
        documentTitle="Health & Safety Policy"
      />
    </div>
  );
}
```

## API Integration

The components use Supabase client directly. For server-side operations, create API routes:

```typescript
// app/api/document-confirmations/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();

  const { data, error } = await supabase
    .from("document_confirmations")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(data);
}
```

## Customization

### Custom Agreement Text
```typescript
<DocumentConfirmation
  {...props}
  customAgreementText="I acknowledge that I have read the 2024 Safety Guidelines and will comply with all requirements."
/>
```

### Without Signature Requirement
```typescript
<DocumentConfirmation
  {...props}
  requiresSignature={false}
/>
```

### With IP Address Tracking
For enhanced tracking, capture IP address server-side and pass to the confirmation record.

## Export Features

The `DocumentConfirmationList` component includes CSV export functionality that exports:
- User name
- Email
- Department
- Signature
- Confirmation timestamp
- IP address (if tracked)

## Notes

- All components use the Neon design system classes from `globals.css`
- Components are fully typed with TypeScript
- Uses React hooks for state management
- Supabase RLS ensures data security
- Unique constraint prevents duplicate confirmations
