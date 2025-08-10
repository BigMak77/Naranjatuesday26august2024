import ModuleSelectorWidget from '@/components/admin/role-profiles/widgets/ModuleSelectorWidget'
import DocumentSelectorWidget from '@/components/admin/role-profiles/widgets/DocumentSelectorWidget'
import BehaviourSelectorWidget from '@/components/admin/role-profiles/widgets/BehaviourSelectorWidget'
import AssignmentSelectorWidget from '@/components/admin/role-profiles/widgets/AssignmentSelectorWidget'
import { FiUserPlus } from 'react-icons/fi'

interface RoleProfileWidgetsProps {
  selectedModules: string[]
  setSelectedModules: (ids: string[]) => void
  selectedDocuments: string[]
  setSelectedDocuments: (ids: string[]) => void
  selectedBehaviours: string[]
  setSelectedBehaviours: (ids: string[]) => void
  selectedAssignments: { type: 'user' | 'role' | 'department'; id: string; label: string }[]
  setSelectedAssignments: (assignments: { type: 'user' | 'role' | 'department'; id: string; label: string }[]) => void
}

export default function RoleProfileWidgets({
  selectedModules,
  setSelectedModules,
  selectedDocuments,
  setSelectedDocuments,
  selectedBehaviours,
  setSelectedBehaviours,
  selectedAssignments,
  setSelectedAssignments,
}: RoleProfileWidgetsProps) {
  return (
    <>
      <div className="neon-widget-section">
        <h2 className="neon-section-title"><FiUserPlus /> Add Modules</h2>
        <ModuleSelectorWidget selectedModules={selectedModules} onChange={setSelectedModules} />
      </div>
      <div className="neon-widget-section">
        <h2 className="neon-section-title"><FiUserPlus /> Add Documents</h2>
        <DocumentSelectorWidget selectedDocuments={selectedDocuments} onChange={setSelectedDocuments} />
      </div>
      <div className="neon-widget-section">
        <h2 className="neon-section-title"><FiUserPlus /> Add Behaviours</h2>
        <BehaviourSelectorWidget selectedBehaviours={selectedBehaviours} onChange={setSelectedBehaviours} />
      </div>
      <div className="neon-widget-section">
        <h2 className="neon-section-title"><FiUserPlus /> Assign Profile</h2>
        <AssignmentSelectorWidget selectedAssignments={selectedAssignments} onChange={setSelectedAssignments} />
      </div>
    </>
  )
}
