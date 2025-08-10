'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import NeonPanel from '@/components/NeonPanel';
import NeonForm from '@/components/NeonForm';
import NeonTable from '@/components/NeonTable';
import HeroHeader from '@/components/HeroHeader';
import { FiPlus, FiClipboard, FiSend, FiFileText, FiHelpCircle } from 'react-icons/fi';
import FolderTabs from '@/components/FolderTabs';
import QuestionTab from './QuestionTab';
import ViewAuditTab from './ViewAuditTab';
import SubmissionsTab from './SubmissionsTab';
import CreateAuditTab from './CreateAuditTab';
import AssignAuditTab from './AssignAuditTab';
import AssignedToTab from './AssignedToTab';

// Types for dropdowns

type Template = { id: string; title: string; archived?: string };
type User = { id: string; email: string };
type Department = { id: string; name: string };
type Standard = { id: string; name: string };
type Section = { id: string; title: string };
type Submission = {
  id: string;
  template_id: string;
  auth_id: string;
  submitted_at: string | null;
  status: string | null;
  notes: string | null;
};

type FullTemplate = Template & {
  description?: string;
  frequency?: string;
  version?: string;
  standard_section_id?: string;
};

export default function AuditManager() {
  const [activeTab, setActiveTab] = useState<'create' | 'view' | 'assign' | 'submissions' | 'questions' | 'assigned'>('create');

  return (
    <>
      <HeroHeader
        title="Audit Template Manager"
        subtitle="Create, assign, and manage audit templates for your organization."
      />
      <div className="centered-content">
        <div className="w-full max-w-[1600px] mx-auto px-8 md:px-12 lg:px-16">
          <FolderTabs
            tabs={[
              { key: 'create', label: 'Create New Audit', icon: <FiPlus className="inline text-lg align-middle" /> },
              { key: 'view', label: 'View Audits', icon: <FiClipboard className="inline text-lg align-middle" /> },
              { key: 'assign', label: 'Assign Audit', icon: <FiSend className="inline text-lg align-middle" /> },
              { key: 'submissions', label: 'Submissions', icon: <FiFileText className="inline text-lg align-middle" /> },
              { key: 'questions', label: 'Edit Questions', icon: <FiHelpCircle className="inline text-lg align-middle" /> },
              { key: 'assigned', label: 'Assigned To', icon: <FiClipboard className="inline text-lg align-middle" /> },
            ]}
            activeTab={activeTab}
            onChange={(tabKey) => setActiveTab(tabKey as typeof activeTab)}
          />
          <div className="mb-6" />
          {activeTab === 'create' && <CreateAuditTab />}
          {activeTab === 'view' && <ViewAuditTab setActiveTab={setActiveTab} />}
          {activeTab === 'assign' && <AssignAuditTab />}
          {activeTab === 'submissions' && <SubmissionsTab />}
          {activeTab === 'questions' && <QuestionTab />}
          {activeTab === 'assigned' && <AssignedToTab />}
        </div>
      </div>
    </>
  );
}
