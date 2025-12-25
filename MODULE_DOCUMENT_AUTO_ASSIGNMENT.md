# Module Document Auto-Assignment Feature

## Overview

This feature automatically assigns linked documents to users when they are assigned to a module. When a user receives a module assignment, all documents linked to that module through the `document_modules` junction table will automatically be assigned to that user as well.

## How It Works

### 1. Automatic Assignment (Database Trigger)

The system uses a PostgreSQL trigger that fires whenever a new record is inserted into the `user_assignments` table with `item_type = 'module'`.

**Migration Files:**
- `20251225000000_auto_assign_module_documents.sql` - Initial trigger
- `20251225000001_add_auto_assigned_tracking.sql` - Adds tracking column
- `20251225000005_update_auto_assign_with_tracking.sql` - Updates trigger to use tracking

**Trigger Function:** `auto_assign_module_documents()`

**Behavior:**
- Fires AFTER INSERT on `user_assignments` table
- Only processes module assignments (`item_type = 'module'`)
- Queries `document_modules` to find all documents linked to the module
- Creates document assignments inheriting properties from the module assignment:
  - `assigned_at` - same assignment date
  - `due_at` - same due date
  - `confirmation_required` - same confirmation requirement
  - `assignment_reason` - same reason (initial, refresh, follow_up_assessment, etc.)
  - `refresh_due_date` - same refresh schedule
  - `follow_up_assessment_required` - same follow-up requirement
  - `follow_up_assessment_due_date` - same follow-up due date
  - `auto_assigned_from_module` - tracks which module created this assignment
- Uses `ON CONFLICT ... DO NOTHING` to skip documents already assigned to the user

### 1.5. Automatic Removal (Database Trigger)

The system also automatically removes document assignments when a module assignment is deleted.

**Migration Files:**
- `20251225000003_auto_remove_module_documents.sql` - Initial removal trigger
- `20251225000006_update_auto_remove_with_tracking.sql` - Updates trigger to use tracking column

**Trigger Function:** `auto_remove_module_documents()`

**Behavior:**
- Fires BEFORE DELETE on `user_assignments` table
- Only processes module assignments (`item_type = 'module'`)
- Deletes document assignments that were auto-assigned from the specific module being removed
- **Safety checks** before removing documents:
  1. Only removes documents where `auto_assigned_from_module` matches the module being deleted
  2. Does NOT remove documents that are also linked to other modules the user is still assigned to
  3. Does NOT remove manually assigned documents (those with `auto_assigned_from_module = NULL`)
- This ensures that:
  - Documents shared across multiple modules remain assigned if user still has other modules
  - Manually assigned documents are never automatically removed
  - Only truly orphaned auto-assigned documents are removed

### 2. Backfill Existing Assignments

For existing module assignments that were created before this feature was implemented, a backfill migration is provided.

**Migration File:** `20251225000004_backfill_module_document_assignments.sql`

**Behavior:**
- Runs once during migration
- Creates document assignments for all existing module assignments
- If a module assignment is already completed, the document assignments are also marked as completed
- Logs the number of assignments created
- Safe to run multiple times (uses `ON CONFLICT ... DO NOTHING`)

### 3. Manual Sync Function

A database function is available for manual synchronization when needed.

**Migration File:** `20251225000002_add_manual_sync_function.sql`

**Function:** `sync_module_document_assignments(p_auth_id UUID, p_module_id UUID)`

**Parameters:**
- `p_auth_id` - Optional user ID to sync (NULL = all users)
- `p_module_id` - Optional module ID to sync (NULL = all modules)

**Returns:** Table of created assignments with columns:
- `user_id` - The user's auth_id
- `document_id` - The document that was assigned
- `action` - Always 'created' for new assignments

**Usage Examples:**
```sql
-- Sync all users and all modules
SELECT * FROM sync_module_document_assignments(NULL, NULL);

-- Sync specific user across all their module assignments
SELECT * FROM sync_module_document_assignments('user-uuid-here', NULL);

-- Sync specific module for all users assigned to it
SELECT * FROM sync_module_document_assignments(NULL, 'module-uuid-here');

-- Sync specific user-module combination
SELECT * FROM sync_module_document_assignments('user-uuid-here', 'module-uuid-here');
```

### 3.5. Cleanup Function for Orphaned Assignments

A cleanup function is available to remove orphaned document assignments.

**Migration File:** `20251225000007_add_cleanup_function.sql`

**Function:** `cleanup_orphaned_document_assignments(p_auth_id UUID)`

**Parameters:**
- `p_auth_id` - Optional user ID to cleanup (NULL = all users)

**Returns:** Table of removed assignments with columns:
- `user_id` - The user's auth_id
- `document_id` - The document that was removed
- `orphaned_from_module` - The module ID that originally created this assignment
- `action` - Always 'removed' for deleted assignments

**What it does:**
An assignment is considered "orphaned" if:
1. It was auto-assigned from a module (`auto_assigned_from_module IS NOT NULL`)
2. The user no longer has that module assignment
3. The document is not linked to any other modules the user is currently assigned to

**Usage Examples:**
```sql
-- Cleanup all orphaned assignments for all users
SELECT * FROM cleanup_orphaned_document_assignments(NULL);

-- Cleanup orphaned assignments for specific user
SELECT * FROM cleanup_orphaned_document_assignments('user-uuid-here');
```

**When to use:**
- After bulk deletion of module assignments
- To fix inconsistent state after manual database changes
- Periodic maintenance to ensure data integrity
- Before generating reports to ensure accurate assignment counts

### 4. API Endpoint

An API endpoint is available for frontend applications to trigger manual syncs.

**File:** `src/app/api/sync-module-documents/route.ts`

#### POST /api/sync-module-documents

Creates document assignments for module assignments and optionally cleans up orphaned assignments.

**Request Body:**
```json
{
  "auth_id": "optional-user-uuid",
  "module_id": "optional-module-uuid",
  "cleanup": false
}
```

**Parameters:**
- `auth_id` - Optional user UUID to sync (omit to sync all users)
- `module_id` - Optional module UUID to sync (omit to sync all modules)
- `cleanup` - Optional boolean (default: false). If true, also removes orphaned document assignments

**Response:**
```json
{
  "success": true,
  "created": 15,
  "removed": 3,
  "assignments": [
    {
      "user_id": "user-uuid",
      "document_id": "document-uuid",
      "action": "created"
    }
  ],
  "orphaned_removed": [
    {
      "user_id": "user-uuid",
      "document_id": "document-uuid",
      "orphaned_from_module": "module-uuid",
      "action": "removed"
    }
  ]
}
```

**Example Requests:**
```bash
# Sync all module-document assignments
curl -X POST http://localhost:3000/api/sync-module-documents \
  -H "Content-Type: application/json" \
  -d '{}'

# Sync specific user and cleanup orphaned assignments
curl -X POST http://localhost:3000/api/sync-module-documents \
  -H "Content-Type: application/json" \
  -d '{"auth_id": "user-uuid-here", "cleanup": true}'

# Sync specific module for all users
curl -X POST http://localhost:3000/api/sync-module-documents \
  -H "Content-Type: application/json" \
  -d '{"module_id": "module-uuid-here"}'
```

#### GET /api/sync-module-documents

Preview mode - shows what would be created without actually creating assignments.

**Query Parameters:**
- `auth_id` - Optional user UUID
- `module_id` - Optional module UUID

**Response:**
```json
{
  "module_assignments": 10,
  "potential_documents": 25,
  "already_assigned": 5,
  "details": [
    {
      "user_id": "user-uuid",
      "module_id": "module-uuid",
      "document_id": "document-uuid",
      "already_assigned": false
    }
  ]
}
```

## Database Schema

### document_modules (Junction Table)

Links documents to modules in a many-to-many relationship.

```sql
CREATE TABLE document_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(document_id, module_id)
);
```

### user_assignments

Stores assignments for both modules and documents.

**Relevant Columns:**
- `auth_id` - User's authentication ID
- `item_id` - UUID of module or document
- `item_type` - 'module' or 'document'
- `assigned_at` - When assigned
- `due_at` - Due date
- `completed_at` - Completion timestamp (nullable)
- `confirmation_required` - Boolean flag
- `assignment_reason` - 'initial', 'refresh', 'follow_up_assessment', 'unsatisfactory_retrain'
- `refresh_due_date` - When refresher is due
- `follow_up_assessment_required` - Boolean flag
- `follow_up_assessment_due_date` - When follow-up is due
- **`auto_assigned_from_module`** - UUID (nullable) - Tracks which module auto-created this document assignment. NULL for manually assigned documents or module assignments.

**Unique Constraint:**
```sql
UNIQUE(auth_id, item_id, item_type)
```

**Indexes:**
- `idx_user_assignments_auto_assigned` - Index on `auto_assigned_from_module` (partial index for non-NULL values)

## Use Cases

### Use Case 1: New Module Assignment
1. Admin assigns "Health & Safety Module" to a user
2. The module has 3 linked documents: "Safety Guidelines", "Emergency Procedures", "PPE Requirements"
3. Trigger automatically creates 3 document assignments for the user
4. All assignments inherit the same due date and properties

### Use Case 2: Role-Based Assignment
1. Admin uses role-based assignment system to assign modules to all users with "Warehouse Worker" role
2. 20 users receive "Forklift Safety Module" assignment
3. Trigger creates document assignments for all 5 linked documents for each user
4. Result: 100 document assignments created automatically (20 users × 5 documents)

### Use Case 3: Bulk Sync After Changes
1. Admin adds new document links to existing modules
2. Admin calls API endpoint: `POST /api/sync-module-documents`
3. System identifies users with module assignments but missing document assignments
4. Creates only the missing assignments

### Use Case 4: Individual User Sync
1. User's assignments get out of sync due to manual changes
2. Admin calls: `POST /api/sync-module-documents` with `{"auth_id": "user-uuid"}`
3. System syncs all module-document assignments for that specific user

### Use Case 5: Module Assignment Removal
1. User completes "Warehouse Safety Module" and is then unassigned from it
2. The module had 5 linked documents: "PPE Guide", "Forklift Safety", "Loading Procedures", "Emergency Exits", "Incident Reporting"
3. However, user is also assigned to "General Safety Module" which shares 2 of these documents: "PPE Guide" and "Incident Reporting"
4. Trigger automatically removes only the 3 unique documents: "Forklift Safety", "Loading Procedures", "Emergency Exits"
5. Keeps "PPE Guide" and "Incident Reporting" because they're still linked to "General Safety Module"
6. If any documents were manually assigned (not auto-assigned), those are also kept

### Use Case 6: Cleanup Orphaned Assignments
1. Admin performs bulk deletion of old module assignments directly in the database
2. This bypasses the trigger, leaving orphaned document assignments
3. Admin runs: `POST /api/sync-module-documents` with `{"cleanup": true}`
4. System identifies and removes all orphaned document assignments
5. Reports back which assignments were removed and from which modules they were orphaned

## Migration Order

The migrations must be applied in this order:

1. `20251225000000_auto_assign_module_documents.sql` - Creates initial auto-assign trigger (without tracking)
2. `20251225000001_add_auto_assigned_tracking.sql` - **Adds `auto_assigned_from_module` column** and backfills existing data
3. `20251225000002_add_manual_sync_function.sql` - Adds manual sync function (initial version without tracking)
4. `20251225000003_auto_remove_module_documents.sql` - Creates initial auto-remove trigger (timestamp-based)
5. `20251225000004_backfill_module_document_assignments.sql` - Backfills existing module assignments (with tracking)
6. `20251225000005_update_auto_assign_with_tracking.sql` - Updates auto-assign trigger to set tracking column
7. `20251225000006_update_auto_remove_with_tracking.sql` - Updates auto-remove trigger to use tracking column
8. `20251225000007_add_cleanup_function.sql` - Adds cleanup function for orphaned assignments
9. `20251225000008_update_sync_function_with_tracking.sql` - Updates sync function to set tracking column

**Note:**
- The tracking column must be added (migration 2) before the backfill (migration 5)
- Functions are created in simple form first (2, 3, 4) then updated to use tracking (6, 7, 9)

## Testing

### Test the Trigger
```sql
-- 1. Create a test module
INSERT INTO modules (id, name, description)
VALUES ('test-module-id', 'Test Module', 'For testing')
RETURNING id;

-- 2. Create a test document
INSERT INTO documents (id, title, content)
VALUES ('test-doc-id', 'Test Document', 'For testing')
RETURNING id;

-- 3. Link document to module
INSERT INTO document_modules (module_id, document_id)
VALUES ('test-module-id', 'test-doc-id');

-- 4. Create a module assignment for a user
INSERT INTO user_assignments (auth_id, item_id, item_type, assigned_at, due_at)
VALUES ('user-auth-id', 'test-module-id', 'module', NOW(), NOW() + INTERVAL '7 days')
RETURNING *;

-- 5. Verify document assignment was created automatically
SELECT * FROM user_assignments
WHERE auth_id = 'user-auth-id'
  AND item_id = 'test-doc-id'
  AND item_type = 'document';
```

### Test the Manual Sync Function
```sql
-- Preview what would be synced
SELECT * FROM sync_module_document_assignments(NULL, NULL);

-- Actually sync
SELECT * FROM sync_module_document_assignments(NULL, NULL);
```

### Test the API Endpoint
```bash
# Preview mode (GET)
curl http://localhost:3000/api/sync-module-documents

# Sync all (POST)
curl -X POST http://localhost:3000/api/sync-module-documents \
  -H "Content-Type: application/json" \
  -d '{}'

# Sync specific user (POST)
curl -X POST http://localhost:3000/api/sync-module-documents \
  -H "Content-Type: application/json" \
  -d '{"auth_id": "user-uuid-here"}'
```

## Performance Considerations

- The trigger runs for EACH module assignment insertion
- For bulk operations (e.g., 100 users), this creates 100 trigger executions
- Each trigger execution queries `document_modules` once
- Uses `ON CONFLICT ... DO NOTHING` to avoid duplicate key errors
- Consider using the manual sync API endpoint for very large bulk operations instead of relying on triggers

## Security

- Trigger function runs with `SECURITY DEFINER` to ensure it has permission to insert assignments
- Manual sync function is granted to `authenticated` role only
- API endpoint uses Supabase service role key for elevated permissions
- RLS policies on `user_assignments` table still apply for user-facing queries

## Troubleshooting

### Document assignments not being created
1. Check if trigger is enabled:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_assign_module_documents';
   ```

2. Check if document_modules links exist:
   ```sql
   SELECT * FROM document_modules WHERE module_id = 'your-module-id';
   ```

3. Check for conflicts (document might already be assigned):
   ```sql
   SELECT * FROM user_assignments
   WHERE auth_id = 'user-id'
     AND item_type = 'document';
   ```

### Backfill not working
- Check PostgreSQL logs for NOTICE messages
- Verify migration was applied: Look for migration record in `supabase_migrations` table
- Manually run backfill query to see if any errors occur

### API endpoint errors
- Check Supabase service role key is set in environment variables
- Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'sync_module_document_assignments'`
- Check API logs for detailed error messages

## Future Enhancements

Potential improvements to consider:

1. **Cascade Completion**: When a user completes all linked documents, automatically mark the module as complete
2. **Cascade Updates**: When module assignment due dates are updated, update linked document due dates
3. **Selective Sync**: UI to allow admins to choose which documents should be auto-assigned
4. **Assignment Templates**: Define assignment templates at the module level for document assignment properties
5. **Batch Operations**: Optimize trigger for bulk insertions using statement-level triggers instead of row-level
6. **Notification System**: Notify users when documents are auto-assigned to them
7. **Audit Trail**: Track which assignments were auto-created vs manually created

## Related Files

- `/supabase/migrations/20251216110000_create_document_modules_junction.sql` - document_modules table
- `/src/components/modules/ModuleDocumentLinkDialog.tsx` - UI for linking documents to modules
- `/src/components/documents/DocumentAssignmentDialog.tsx` - UI for assigning documents
- `/src/app/api/sync-training-from-profile/route.ts` - Related role-based sync logic
- `/src/types/document.ts` - TypeScript types for documents and modules
