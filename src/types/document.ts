// Shared TypeScript types for document management

export interface Standard {
  id: string;
  name: string;
}

export interface Section {
  id: string;
  code: string;
  title: string;
  description?: string;
  parent_section_id?: string | null;
  standard_id?: string | null;
  ref_code?: string;
}

export interface DocumentType {
  id: string;
  name: string;
  ref_code?: string;
  summary?: string;
  created_by?: string;
  created_at?: string;
}

export interface Document {
  id: string;
  title: string;
  reference_code?: string;
  document_type_id: string;
  section_id?: string | null;
  file_url?: string;
  notes?: string;
  standard_id?: string;
  current_version?: number;
  created_at?: string;
  last_reviewed_at?: string;
  archived?: boolean;
  review_period_months?: number;
  document_type_name?: string;
  location?: string;
}

export interface Module {
  id: string;
  name: string;
  ref_code?: string;
  description?: string;
  is_archived?: boolean;
}

export interface ArchivedDocument {
  id: string;
  document_id: string;
  title: string;
  archived_version: string;
  file_url: string;
  document_type_id: string;
  document_type_name?: string;
  document_type_icon?: string | null;
  change_date: string;
  archived_by_auth_id: string;
  change_summary?: string;
  reference_code?: string;
  section_id?: string | null;
  notes?: string;
  created_at?: string;
}
