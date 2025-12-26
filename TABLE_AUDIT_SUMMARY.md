# Table Audit Summary & Recommendations

**Generated:** 2025-12-26
**Based on:** AUDIT_ALL_TABLES.sql results

---

## Quick Stats from RLS Analysis

From the RLS section alone, I can see:
- **Total tables visible:** 105 tables
- **Tables with RLS enabled:** 16 tables (✓)
- **Tables with RLS disabled:** 89 tables (⚠️)

This is a **major security concern** - 85% of your tables have no Row Level Security!

---

## RLS Status Breakdown

### ✅ Tables WITH RLS Enabled (16 tables)
These are properly secured:
1. department_assignments
2. document_archive
3. document_modules
4. locations
5. module_categories
6. people_personal_information
7. question_options
8. question_packs
9. questions
10. test_attempt_answers
11. trainer_permissions
12. training_group_assignments
13. training_group_members
14. training_groups
15. user_role_history
16. user_view_permissions

### ⚠️ Critical Tables WITHOUT RLS (High Priority)

These tables contain sensitive data and NEED RLS:

#### User & Authentication Data
- **users** - ⚠️ CRITICAL - Contains all user data
- **user_assignments** - ⚠️ CRITICAL - Training assignments
- **user_behaviours** - User behavior tracking
- **user_role_change_log** - Audit trail
- **user_role_profiles** - Role assignments
- **user_shifts** - Schedule data
- **users_roles** - User-role mappings

#### Training & Testing Data
- **training_logs** - ⚠️ CRITICAL - Training completion records
- **training** - Training sessions
- **training_questions** - Test questions
- **training_requests** - Training requests
- **test_attempts** - ⚠️ CRITICAL - Test results
- **module_completions** - Training completions
- **module_assignments** - Training assignments
- **pack_assignments** - Question pack assignments

#### Security & Permissions
- **permissions** - ⚠️ CRITICAL - User permissions
- **roles** - ⚠️ CRITICAL - Role definitions
- **role_assignments** - ⚠️ CRITICAL - Role assignments

#### Sensitive Business Data
- **incidents** - ⚠️ CRITICAL - Incident reports
- **incident_people** - People involved in incidents
- **incident_persons** - Person details in incidents
- **first_aid_treatments** - Medical data
- **audit_submissions** - Audit results
- **audits** - Audit records

---

## Potential Redundant/Duplicate Tables

Based on naming patterns, these tables may be redundant:

### Training Tables - Possible Overlap
1. **training** vs **training_logs**
   - Are these the same thing or different?
   - `training_logs` has RLS enabled
   - `training` does NOT have RLS
   - Likely one is legacy

2. **module_assignments** vs **user_assignments** (where item_type='module')
   - Do you need both?
   - `user_assignments` is more generic
   - `module_assignments` might be legacy

3. **module_completions** vs **user_assignments.completed_at**
   - Completion tracking in two places?
   - Potential data inconsistency

### User/Role Tables - Possible Overlap
4. **users_roles** vs **user_role_profiles**
   - Both track user-role relationships
   - One might be legacy

5. **user_role_change_log** vs **user_role_history**
   - Both track role changes
   - `user_role_history` has RLS enabled
   - `user_role_change_log` does NOT
   - One is likely redundant

### Assignment Tables - Possible Overlap
6. **role_assignments** vs **role_profile_assignments**
   - Multiple assignment tracking systems
   - May need consolidation

7. **department_modules** vs **department_assignments** (where type='module')
   - Duplicate tracking of department-module relationships

### Document Tables
8. **document_archive** vs **documents**
   - Is archive for old/deleted documents?
   - Should verify if needed

### Question/Test Tables
9. **questions** vs **training_questions** vs **audit_questions**
   - Three separate question systems
   - May be intentional (different contexts)
   - Or may indicate duplication

### Incident Tables
10. **incident_people** vs **incident_persons**
    - These look like duplicates!
    - Very similar names - likely one is legacy

### Task Tables
11. **task** vs **turkus_tasks** vs **role_tasks**
    - Multiple task systems
    - May be intentional or redundant

---

## Tables That May Be Unused/Legacy

Based on naming patterns, these are candidates for removal:

### "Turkus" Prefixed Tables (Legacy System?)
- **turkus_assignments**
- **turkus_non_conformances**
- **turkus_risk_assignments**
- **turkus_risks**
- **turkus_tasks**

**Question:** Is "Turkus" a legacy system that's been replaced?

### Neon Dashboard
- **neon_dashboard_cards**

**Question:** Is this still in use? (You mentioned archiving neon components in commits)

### Other Candidates
- **applications** - What is this for?
- **behaviours** - vs module_behaviours, role_behaviours, user_behaviours
- **events** - Generic name, may be unused
- **issues** - What issues does this track?
- **metrics** - What metrics?
- **uploads** - Generic file uploads?
- **vacancies** - Job vacancies? Still needed?

---

## Tables Without Indexes (Performance Risk)

After running the full audit, check PART 5 results for tables without indexes.

**Critical tables that MUST have indexes:**
- `users` (on auth_id, email, role_id)
- `user_assignments` (on auth_id, item_id, item_type)
- `training_logs` (on auth_id, topic, date)
- `test_attempts` (on user_id, pack_id, passed)
- `role_assignments` (on role_id, item_id)
- `department_assignments` (on department_id, item_id)

---

## Recommended Actions

### Immediate (Security Critical)

1. **Enable RLS on Critical Tables:**
   ```sql
   -- Users table
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;

   -- User assignments
   ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;

   -- Training logs
   ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;

   -- Test attempts
   ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

   -- Permissions
   ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

   -- Roles
   ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;

   -- Incidents (sensitive data)
   ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
   ALTER TABLE incident_people ENABLE ROW LEVEL SECURITY;
   ```

2. **Create RLS Policies** for each table above based on user roles.

### High Priority (Data Integrity)

3. **Investigate Duplicate Tables:**
   - Compare `incident_people` vs `incident_persons` - DROP one
   - Compare `training` vs `training_logs` - consolidate or clarify
   - Compare `module_assignments` vs `user_assignments` - consolidate
   - Compare `user_role_change_log` vs `user_role_history` - DROP one

4. **Verify Turkus Tables:**
   - If legacy system, migrate data and DROP tables
   - If still in use, document purpose

5. **Check Empty Tables:**
   - Run PART 2 of audit to see which tables have 0 rows
   - DROP empty legacy tables

### Medium Priority (Cleanup)

6. **Add Missing Indexes:**
   - Review PART 5 results
   - Add indexes on foreign keys and frequently queried columns

7. **Add Missing Timestamps:**
   - Review PART 9 results
   - Add created_at/updated_at where missing

### Low Priority (Documentation)

8. **Document Table Purposes:**
   - Create a data dictionary
   - Clarify purpose of ambiguous tables (applications, events, issues, metrics)

---

## Security Risk Assessment

### 🔴 CRITICAL RISKS

1. **users table has NO RLS**
   - Anyone with database access can read all user data
   - IMMEDIATE FIX REQUIRED

2. **user_assignments has NO RLS**
   - Training data is exposed
   - Users could see each other's assignments

3. **training_logs has NO RLS**
   - Training completion records exposed
   - Privacy violation

4. **test_attempts has NO RLS**
   - Test scores/results exposed
   - Cheating possible

5. **incidents has NO RLS**
   - Sensitive incident data exposed
   - Legal/compliance issue

### ⚠️ HIGH RISKS

6. **permissions table has NO RLS**
   - Permission structure exposed
   - Security through obscurity broken

7. **roles/role_assignments have NO RLS**
   - Organizational structure exposed

### 💡 MEDIUM RISKS

8. **Documents tables have NO RLS**
   - Document access not controlled at DB level
   - Relies on application logic only

---

## Cleanup Candidates

After reviewing audit results, these are likely safe to drop:

### Definitely Investigate
- [ ] `incident_people` vs `incident_persons` (one is likely a typo/duplicate)
- [ ] `neon_dashboard_cards` (if neon was archived)
- [ ] All `turkus_*` tables (if legacy system)

### Probably Unused
- [ ] `applications` (verify first)
- [ ] `events` (verify first)
- [ ] `issues` (verify first)
- [ ] `metrics` (verify first)
- [ ] `vacancies` (verify first)

### Consolidation Candidates
- [ ] `training` → merge into `training_logs`
- [ ] `module_assignments` → use `user_assignments` instead
- [ ] `user_role_change_log` → use `user_role_history` instead
- [ ] `department_modules` → use `department_assignments` instead

---

## Next Steps

1. **Run the complete audit** - Save all results
2. **Enable RLS on critical tables** - See SQL above
3. **Create RLS policies** - Based on your access control needs
4. **Investigate duplicate tables** - Compare structures and data
5. **Drop confirmed redundant tables** - After backing up
6. **Add missing indexes** - For performance
7. **Document remaining tables** - For future reference

---

## Questions to Answer

Before cleanup, verify:

1. Is the Turkus system still in use?
2. Is Neon dashboard still in use?
3. What is the difference between `training` and `training_logs`?
4. What is the difference between `incident_people` and `incident_persons`?
5. Are `module_assignments` and `user_assignments` both needed?
6. Are `user_role_change_log` and `user_role_history` both needed?
7. What are these tables for: applications, events, issues, metrics, vacancies?
8. Can we consolidate the multiple assignment tracking systems?

---

## Estimated Impact

### Storage Savings
After cleanup, you could potentially:
- Remove 10-20 unused tables
- Save 10-30% of database size
- Improve query performance

### Security Improvements
- 89 tables need RLS policies
- Focus on 15-20 critical tables first
- Massive reduction in security risk

### Maintenance Benefits
- Clearer data model
- Faster development
- Easier onboarding
- Better documentation
