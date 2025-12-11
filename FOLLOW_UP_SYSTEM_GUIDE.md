# Training Follow-Up System Guide

## Overview

The training follow-up system has been refactored to handle **three distinct scenarios** clearly and without confusion:

### 1. **Follow-Up Assessment** 📋
Post-training competency check to ensure understanding

### 2. **Refresh Training** 🔄
Scheduled re-training to maintain competency over time

### 3. **Unsatisfactory Training Outcome** ⚠️
Training logged but not completed satisfactorily

---

## Database Schema Changes

### New Fields in `modules` Table

| Field | Type | Description |
|-------|------|-------------|
| `follow_up_period` | TEXT | Period after training for competency assessment (formerly `review_period`) |
| `refresh_period` | TEXT | Period after training when refresher is required ("6 months", "1 year", "2 years", "3 years", "Never") |
| `requires_follow_up` | BOOLEAN | Whether module requires post-training assessment |

### New Fields in `user_assignments` Table

| Field | Type | Description |
|-------|------|-------------|
| `assignment_reason` | TEXT | "initial", "refresh", "follow_up_assessment", "unsatisfactory_retrain" |
| `training_outcome` | TEXT | "completed", "needs_improvement", "failed" |
| `follow_up_assessment_required` | BOOLEAN | Renamed from `follow_up_required` |
| `follow_up_assessment_due_date` | TIMESTAMP | Renamed from `follow_up_due_date` |
| `follow_up_assessment_completed_at` | TIMESTAMP | Renamed from `follow_up_completed_at` |
| `follow_up_assessment_outcome` | TEXT | "satisfactory", "needs_improvement" |
| `follow_up_assessment_notes` | TEXT | Trainer notes from assessment |
| `follow_up_assessment_signature` | TEXT | Trainer signature (base64) |
| `refresh_due_date` | TIMESTAMP | When refresher training is due |

### Database Functions

- `calculate_follow_up_assessment_date(completion_date, follow_up_period)` - Calculates assessment due date
- `calculate_refresh_date(completion_date, refresh_period)` - Calculates refresh training due date

### Database Views

- `training_follow_ups` - View for querying follow-up assessments with status
- `training_refresh_due` - View for querying refresh training due dates

---

## How It Works

### Scenario 1: Follow-Up Assessment

**When:** Module has `requires_follow_up = true` and `follow_up_period` set

**Trigger:** Training is marked as "Completed - Satisfactory"

**What Happens:**
1. Training is marked complete (`completed_at` set)
2. Follow-up assessment is scheduled based on `follow_up_period`
3. `follow_up_assessment_due_date` is calculated from training completion date
4. Trainer receives notification to conduct assessment
5. Trainer signs off assessment via [TrainingAssessment](src/components/training/TrainingAssessment.tsx)

**Example:**
```
Module: "Fire Safety Training"
requires_follow_up: true
follow_up_period: "1 month"

Training completed: 2025-01-10
Follow-up assessment due: 2025-02-10
```

---

### Scenario 2: Refresh Training

**When:** Module has `refresh_period` set (not "Never")

**Trigger:** Training is marked as "Completed - Satisfactory"

**What Happens:**
1. Training is marked complete (`completed_at` set)
2. `refresh_due_date` is calculated from training completion date
3. When refresh date arrives, a NEW training assignment is created automatically
4. User must complete the module again

**Example:**
```
Module: "First Aid Certification"
refresh_period: "1 year"

Training completed: 2025-01-10
Refresh due: 2026-01-10
New assignment created: 2026-01-10
```

---

### Scenario 3: Unsatisfactory Training Outcome

**When:** Trainer marks training as "Needs Improvement" or "Failed"

**Trigger:** During training log in [TrainerView](src/components/userview/TrainerView.tsx)

**What Happens:**
1. Training is logged in `training_logs` table
2. `training_outcome` field is set to "needs_improvement" or "failed"
3. Assignment remains OPEN (`completed_at` stays NULL)
4. No follow-up assessment or refresh training is scheduled
5. Trainer must re-train the user

**Example:**
```
Training logged: 2025-01-10
Outcome: "Needs Improvement"
Assignment status: Open (incomplete)
Action required: Re-training
```

---

## User Interface Changes

### Module Configuration ([AddModuleTab.tsx](src/components/modules/AddModuleTab.tsx))

```
┌─────────────────────────────────────────────────────────┐
│ Follow-up Assessment & Refresh Training                │
├─────────────────────────────────────────────────────────┤
│ ℹ️ Follow-up Assessment: Competency check after        │
│    training to ensure understanding.                    │
│    Refresh Training: Scheduled re-training to maintain  │
│    competency over time.                                │
├─────────────────────────────────────────────────────────┤
│ Requires follow-up assessment?  [No ▼]                 │
│   └─ Post-training competency check                     │
│                                                         │
│ Refresh training period  [Never ▼]                     │
│   └─ Scheduled refresher training                      │
│     Options: Never, 6 months, 1 year, 2 years, 3 years │
└─────────────────────────────────────────────────────────┘
```

### Training Log ([TrainerView.tsx](src/components/userview/TrainerView.tsx))

```
┌─────────────────────────────────────────────────────────┐
│ Training Outcome  [Completed - Satisfactory ▼]         │
├─────────────────────────────────────────────────────────┤
│ Options:                                                │
│ • Completed - Satisfactory                              │
│   └─ Training completed to satisfactory standard        │
│                                                         │
│ • Needs Improvement - Re-train Required                │
│   └─ Training logged but requires additional practice   │
│                                                         │
│ • Failed - Must Re-train                                │
│   └─ Training not completed, immediate re-training      │
│      needed                                             │
└─────────────────────────────────────────────────────────┘
```

---

## API Changes

### `/api/record-training-completion`

**Request:**
```json
{
  "auth_id": "user-auth-id",
  "item_id": "module-id",
  "item_type": "module",
  "completed_date": "2025-01-10",
  "training_outcome": "completed" // or "needs_improvement" or "failed"
}
```

**Response:**
```json
{
  "message": "Training completed successfully",
  "training_outcome": "completed",
  "completed_at": "2025-01-10T00:00:00.000Z",
  "follow_up_assessment_required": true,
  "follow_up_assessment_due_date": "2025-02-10T00:00:00.000Z",
  "refresh_due_date": "2026-01-10T00:00:00.000Z"
}
```

**Logic:**
- If `training_outcome` = "completed": Set `completed_at`, calculate follow-up and refresh dates
- If `training_outcome` = "needs_improvement" or "failed": Leave `completed_at` as NULL, no follow-ups created

---

## Dashboard Views

### Training Dashboard ([TrainingDashboard.tsx](src/components/training/TrainingDashboard.tsx))

Shows aggregate statistics:
- Follow-Up Assessments: Upcoming, Overdue
- Refresh Training: Due Soon, Overdue
- Unsatisfactory Outcomes: Needs Improvement, Failed

### Training Assessment ([TrainingAssessment.tsx](src/components/training/TrainingAssessment.tsx))

Individual assessment management:
- Sign-off interface for follow-up assessments
- Digital signature capture
- Outcome recording (Satisfactory / Needs Improvement)

---

## Migration

Run the migration:
```bash
cd supabase
npx supabase migration up
```

Or apply manually:
```sql
-- See: supabase/migrations/20251210_refactor_follow_up_system.sql
```

---

## Benefits of New System

✅ **Clear Separation**: Three distinct scenarios, no confusion
✅ **Accurate Tracking**: Training outcome accurately reflects actual status
✅ **Proper Workflow**: Unsatisfactory training doesn't trigger follow-ups
✅ **Scheduled Refresh**: Automatic re-training reminders
✅ **Better Reporting**: Clear metrics for each scenario
✅ **Historical Data**: Complete audit trail of training outcomes

---

## Future Enhancements

- [ ] Automatic notifications for due follow-up assessments
- [ ] Automatic creation of refresh training assignments
- [ ] Email reminders for overdue assessments
- [ ] Dashboard widgets for managers
- [ ] Compliance reports by department
- [ ] Integration with calendar systems

---

## Questions?

For issues or questions about the follow-up system, check:
- Database schema: `/supabase/migrations/20251210_refactor_follow_up_system.sql`
- API route: `/src/app/api/record-training-completion/route.ts`
- TrainerView: `/src/components/userview/TrainerView.tsx`
- Assessment page: `/src/components/training/TrainingAssessment.tsx`
