// ============================================
// UNIFIED TURKUS TYPES
// ============================================
// TypeScript types for the new unified turkus schema

export type AssignmentType = 'risk' | 'task' | 'audit' | 'non_conformance' | 'issue';

export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export type AssignmentPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ItemType = 'issue' | 'non_conformance' | 'audit';

export type ItemStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

// Unified assignment interface
export interface TurkusUnifiedAssignment {
  id: string;
  assignment_type: AssignmentType;
  reference_id: string; // ID of the assigned item
  assigned_to: string; // user auth_id
  assigned_by?: string | null;
  department_id?: string | null;
  due_date?: string | null;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  started_at?: string | null;
  completed_at?: string | null;
  metadata?: Record<string, any>;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Unified items (issues, non-conformances, audits)
export interface TurkusItem {
  id: string;
  item_type: ItemType;
  title: string;
  description?: string | null;
  department_id?: string | null;
  severity?: Severity | null;
  category?: string | null;
  status: ItemStatus;
  resolved_by?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  metadata?: Record<string, any>;
  photo_urls?: string[];
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

// Extended assignment with full details (returned by get_user_turkus_assignments)
export interface TurkusAssignmentWithDetails extends TurkusUnifiedAssignment {
  title: string;
  description?: string | null;
  department_name?: string | null;
}

// For task assignments (existing turkus_tasks remain)
export interface TurkusTask {
  id: string;
  title: string;
  area?: string | null;
  frequency: string;
  instructions?: string | null;
  type?: string;
  description?: string | null;
  archived: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  version: number;
}

// For risk assessments (existing turkus_risks remain)
export interface TurkusRisk {
  id: string;
  title: string;
  description: string;
  severity: string;
  likelihood: number;
  risk_rating?: number | null;
  created_at: string;
  review_period_months: number;
  department_id?: string | null;
  created_by?: string | null;
  photo_urls?: string[];
  control_measures?: string | null;
  persons_at_risk?: string | null;
  injury_risk?: string | null;
}

// Overdue assignment details
export interface OverdueAssignment {
  id: string;
  assignment_type: AssignmentType;
  reference_id: string;
  title: string;
  assigned_to: string;
  assigned_to_name: string;
  due_date: string;
  days_overdue: number;
}

// API request types
export interface CreateAssignmentRequest {
  assignment_type: AssignmentType;
  reference_id: string;
  assigned_to: string;
  assigned_by?: string;
  department_id?: string;
  due_date?: string;
  priority?: AssignmentPriority;
  metadata?: Record<string, any>;
}

export interface CreateItemRequest {
  item_type: ItemType;
  title: string;
  description?: string;
  department_id?: string;
  severity?: Severity;
  created_by?: string;
  assign_to?: string;
  due_date?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAssignmentStatusRequest {
  assignment_id: string;
  status: AssignmentStatus;
  notes?: string;
}

export interface CompleteAssignmentRequest {
  assignment_id: string;
  notes?: string;
}

// Database function parameter types
export interface AssignTurkusItemParams {
  p_assignment_type: AssignmentType;
  p_reference_id: string;
  p_assigned_to: string;
  p_assigned_by?: string;
  p_department_id?: string;
  p_due_date?: string;
  p_priority?: AssignmentPriority;
  p_metadata?: Record<string, any>;
}

export interface GetUserAssignmentsParams {
  p_user_auth_id: string;
  p_assignment_type?: AssignmentType;
  p_status?: AssignmentStatus;
}

export interface CreateTurkusItemParams {
  p_item_type: ItemType;
  p_title: string;
  p_description?: string;
  p_department_id?: string;
  p_severity?: Severity;
  p_created_by?: string;
  p_assign_to?: string;
  p_due_date?: string;
  p_metadata?: Record<string, any>;
}

// Legacy compatibility types (for backward compatibility views)
export interface LegacyTaskAssignment {
  id: string;
  task_id: string;
  user_auth_id: string;
  assigned_by?: string | null;
  department_id?: string | null;
  due_date?: string | null;
  status?: string | null;
  completed_at?: string | null;
  'auth-id'?: string | null;
}

export interface LegacyRiskAssignment {
  id: string;
  risk_id: string;
  auth_id: string;
  assigned_at: string;
}

export interface LegacyNonConformance {
  id: string;
  answer_id?: string | null;
  title?: string | null;
  description?: string | null;
  assigned_to?: string | null;
  department_id?: string | null;
  status?: string;
  resolved_by?: string | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
}

// Helper type guards
export function isTaskAssignment(assignment: TurkusUnifiedAssignment): boolean {
  return assignment.assignment_type === 'task';
}

export function isRiskAssignment(assignment: TurkusUnifiedAssignment): boolean {
  return assignment.assignment_type === 'risk';
}

export function isIssueAssignment(assignment: TurkusUnifiedAssignment): boolean {
  return assignment.assignment_type === 'issue';
}

export function isOverdue(assignment: TurkusUnifiedAssignment): boolean {
  if (!assignment.due_date) return false;
  return new Date(assignment.due_date) < new Date() &&
         assignment.status !== 'completed' &&
         assignment.status !== 'cancelled';
}

export function getDaysUntilDue(assignment: TurkusUnifiedAssignment): number | null {
  if (!assignment.due_date) return null;
  const due = new Date(assignment.due_date);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getPriorityColor(priority: AssignmentPriority): string {
  switch (priority) {
    case 'urgent': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'green';
    default: return 'gray';
  }
}

export function getStatusColor(status: AssignmentStatus): string {
  switch (status) {
    case 'completed': return 'green';
    case 'in_progress': return 'blue';
    case 'overdue': return 'red';
    case 'cancelled': return 'gray';
    case 'assigned': return 'yellow';
    default: return 'gray';
  }
}
