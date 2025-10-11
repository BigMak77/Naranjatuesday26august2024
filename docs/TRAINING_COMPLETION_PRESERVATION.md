# Training Completion Preservation System

## Problem Solved

Previously, when users changed roles, they lost all their training completion history. This meant:
- Users had to redo training they'd already completed
- No audit trail of training completion across role changes
- Loss of valuable training data and compliance records

## Solution Overview

The new system separates **assignment tracking** from **completion tracking**:

### 1. Current Assignments (`user_assignments` table)
- Tracks what training users are **currently assigned** based on their role
- Changes when users change roles
- Shows current training requirements

### 2. Permanent Completions (`user_training_completions` table)
- **Permanently** tracks when users complete training
- **Never deleted** when roles change
- Provides complete training history audit trail

## How It Works

### When a User Completes Training
1. Completion is recorded in both tables:
   - `user_assignments.completed_at` is updated
   - New record created in `user_training_completions`

### When a User Changes Roles
1. **Preserve completions**: Copy completed training to permanent table
2. **Remove old assignments**: Clear current role assignments
3. **Create new assignments**: Add assignments for new role
4. **Restore completions**: If user previously completed any new role requirements, restore those completion dates

### Benefits
- ✅ Training completion history preserved across role changes
- ✅ Users don't lose credit for completed training
- ✅ Complete audit trail of all training completions
- ✅ Compliance reporting across user's entire history
- ✅ Role-based training requirements still enforced

## Database Schema

### New Table: `user_training_completions`
```sql
CREATE TABLE user_training_completions (
  id BIGSERIAL PRIMARY KEY,
  auth_id TEXT NOT NULL,           -- User who completed training
  item_id TEXT NOT NULL,           -- Module/document ID
  item_type TEXT NOT NULL,         -- 'module' or 'document'
  completed_at TIMESTAMPTZ NOT NULL,
  completed_by_role_id TEXT,       -- Role user had when completing
  
  UNIQUE(auth_id, item_id, item_type)
);
```

## API Endpoints

### `/api/change-user-role-assignments` (Updated)
- Now preserves training completions during role changes
- Returns `completions_restored` count in response

### `/api/record-training-completion` (New)
- Records new training completions
- Updates both current assignments and permanent records

## Implementation Steps

### 1. Database Setup
```bash
# Create the new table
psql -f db/create-user-training-completions-table.sql

# Migrate existing completion data
psql -f db/migrate-preserve-training-completions.sql
```

### 2. Update Frontend Components
- TrainingMatrix: Use new completion data source
- Training modules: Call completion recording API

### 3. Testing
```bash
# Test the new system
node scripts/test-completion-preservation.js
```

## Example Scenarios

### Scenario 1: Manager → Senior Manager
1. **Before**: Manager completes Fire Safety and GDPR training
2. **Role Change**: Promoted to Senior Manager
3. **Result**: 
   - Gets new Senior Manager training requirements
   - **Keeps** Fire Safety and GDPR completion dates
   - Only needs to complete new Senior Manager-specific training

### Scenario 2: Department Transfer
1. **Before**: HR Assistant completes HR-specific training
2. **Role Change**: Transfers to Finance Assistant
3. **Result**:
   - Gets Finance-specific training requirements
   - **Keeps** any overlapping training completions (e.g., general compliance)
   - Retains complete training history for audit purposes

## Migration Strategy

### Phase 1: Preserve Existing Data
- Run migration script to copy current completions
- No user impact - system continues working

### Phase 2: Deploy New System
- Update APIs to use new completion tracking
- Frontend continues to work normally

### Phase 3: Verification
- Run tests to verify completion preservation
- Monitor for any issues

## Monitoring and Maintenance

### Key Metrics to Track
- Completion preservation rate during role changes
- Training completion audit trail completeness
- User satisfaction with preserved training history

### Regular Maintenance
- Monitor permanent completions table growth
- Archive old completion records if needed
- Verify data integrity between tables

## Rollback Plan

If issues arise:
1. Revert API changes to original behavior
2. Current assignments table remains functional
3. Permanent completions table can be kept for future use
4. No data loss occurs

---

*This system ensures that users' training achievements are permanently preserved while maintaining role-based training requirements.*
