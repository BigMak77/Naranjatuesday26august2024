# Turkus Tables Usage Analysis

## Summary
Analysis of all Turkus tables in the codebase to identify which are actively used and which are unused.

## Tables Analysis

### ✅ **ACTIVELY USED TABLES**

#### 1. **turkus_risks** 
- **Status**: ✅ ACTIVELY USED
- **Usage Location**: `src/components/healthsafety/RiskAssessmentManager.tsx`
- **Operations**: SELECT, INSERT, UPDATE
- **Purpose**: Risk assessment management
- **Key Columns Used**: 
  - `id`, `title`, `description`, `severity`, `likelihood`, `risk_rating`
  - `created_at`, `review_period_months`, `department_id`, `created_by`
  - `photo_urls`, `control_measures`, `persons_at_risk`, `injury_risk`

#### 2. **turkus_risk_assignments**
- **Status**: ✅ ACTIVELY USED  
- **Usage Location**: `src/components/healthsafety/RiskAssessmentManager.tsx`
- **Operations**: INSERT
- **Purpose**: Assigning risk assessments to users
- **Key Columns Used**: `risk_id`, `auth_id`

#### 3. **turkus_tasks**
- **Status**: ✅ ACTIVELY USED
- **Usage Location**: `src/app/turkus/assignments/page.tsx`
- **Operations**: SELECT (with JOIN)
- **Purpose**: Task management and assignment
- **Key Columns Used**: `id`, `title`, `area`, `frequency`

#### 4. **turkus_assignments**
- **Status**: ✅ ACTIVELY USED
- **Usage Location**: `src/app/turkus/assignments/page.tsx` 
- **Operations**: SELECT, INSERT
- **Purpose**: Task assignment management
- **Key Columns Used**: 
  - `id`, `task_id`, `user_auth_id`, `department_id`, `due_date`

---

### ❌ **UNUSED TABLES**

#### 5. **turkus_non_conformances**
- **Status**: ❌ NOT USED
- **Columns**: 10 columns including `id`, `answer_id`, `title`, `description`, `assigned_to`, etc.
- **Purpose**: Likely intended for non-conformance tracking
- **Recommendation**: Consider removal if not planned for future use

#### 6. **turkus_schedules** 
- **Status**: ❌ NOT USED
- **Columns**: 7 columns including `id`, `task_id`, `assigned_to`, `department_id`, `start_date`, `recurrence`
- **Purpose**: Likely intended for recurring task scheduling
- **Recommendation**: Consider removal if not planned for future use

#### 7. **turkus_submission_answers**
- **Status**: ❌ NOT USED
- **Columns**: 6 columns including `id`, `submission_id`, `question_id`, `answer`, `comment`, `task_id`
- **Purpose**: Likely intended for task submission answers/responses
- **Recommendation**: Consider removal if not planned for future use

#### 8. **turkus_submissions**
- **Status**: ❌ NOT USED
- **Columns**: 5 columns including `id`, `task_id`, `user_auth_id`, `notes`, `submitted_at`
- **Purpose**: Likely intended for task submissions
- **Recommendation**: Consider removal if not planned for future use

---

## Usage Statistics

| Table Name | Status | Files Using | Operations | Last Activity |
|------------|--------|-------------|------------|---------------|
| `turkus_risks` | ✅ Active | 1 | SELECT, INSERT, UPDATE | Recent |
| `turkus_risk_assignments` | ✅ Active | 1 | INSERT | Recent |
| `turkus_tasks` | ✅ Active | 1 | SELECT (JOIN) | Recent |
| `turkus_assignments` | ✅ Active | 1 | SELECT, INSERT | Recent |
| `turkus_non_conformances` | ❌ Unused | 0 | None | Never |
| `turkus_schedules` | ❌ Unused | 0 | None | Never |
| `turkus_submission_answers` | ❌ Unused | 0 | None | Never |
| `turkus_submissions` | ❌ Unused | 0 | None | Never |

## Detailed File Analysis

### Active Implementations

1. **Risk Management System** (`src/components/healthsafety/RiskAssessmentManager.tsx`)
   - Uses `turkus_risks` for risk assessment CRUD operations
   - Uses `turkus_risk_assignments` for assigning risks to users
   - Full implementation with UI, forms, and database operations

2. **Task Assignment System** (`src/app/turkus/assignments/page.tsx`)
   - Uses `turkus_tasks` for task selection and display
   - Uses `turkus_assignments` for creating and viewing task assignments
   - Full implementation with assignment forms and status tracking

### Potential Schema Issues

1. **turkus_assignments** has a duplicate column:
   - `user_auth_id` (uuid, NOT NULL)
   - `auth-id` (text, nullable) ← This appears to be a duplicate/mistake

## Recommendations

### Immediate Actions
1. **Clean up unused tables**: Consider dropping the 4 unused tables if they're not planned for future features
2. **Fix schema issue**: Remove duplicate `auth-id` column from `turkus_assignments`
3. **Document active tables**: Update database documentation to reflect actual usage

### Future Considerations
1. **Task Submissions**: If you plan to implement task completion tracking, `turkus_submissions` and `turkus_submission_answers` could be useful
2. **Scheduling**: If recurring tasks are needed, `turkus_schedules` could be implemented
3. **Non-conformances**: If quality management features are planned, `turkus_non_conformances` could be useful

## SQL Cleanup Script (Optional)

If you decide to remove unused tables:

```sql
-- CAUTION: This will permanently delete data
-- Only run if you're certain these tables won't be needed

DROP TABLE IF EXISTS turkus_non_conformances;
DROP TABLE IF EXISTS turkus_schedules; 
DROP TABLE IF EXISTS turkus_submission_answers;
DROP TABLE IF EXISTS turkus_submissions;

-- Fix the duplicate column issue
ALTER TABLE turkus_assignments DROP COLUMN IF EXISTS "auth-id";
```

## Conclusion

**4 out of 8** Turkus tables are actively used in the codebase:
- ✅ `turkus_risks` - Risk assessment management
- ✅ `turkus_risk_assignments` - Risk assignment tracking  
- ✅ `turkus_tasks` - Task definitions
- ✅ `turkus_assignments` - Task assignments

The remaining 4 tables appear to be unused legacy/planning tables that could be candidates for removal or future implementation.
