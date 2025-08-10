'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import CertificateTemplate from '@/components/training/CertificateTemplate'
import NeonPanel from '@/components/NeonPanel'
import NeonTable from '@/components/NeonTable'
import NeonIconButton from '../ui/NeonIconButton';
import { FiX, FiDownload, FiCheck } from 'react-icons/fi';

interface Assignment {
  id: string
  name: string
  type: 'module' | 'document' | 'behaviour'
  completed: boolean
  completed_at?: string
  opened_at?: string
}

export default function UserTrainingDashboard({ authId }: { authId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCert, setShowCert] = useState<{ name: string; training: string; date: string } | null>(null)
  const [userFullName, setUserFullName] = useState('User')
  const [openedModuleIds, setOpenedModuleIds] = useState<string[]>([])
  const [openedDocumentIds, setOpenedDocumentIds] = useState<string[]>([])
  const [viewingModule, setViewingModule] = useState<{ id: string, name: string } | null>(null)
  const [viewingDocument, setViewingDocument] = useState<{ id: string, name: string } | null>(null)
  const [moduleContent, setModuleContent] = useState<string | null>(null)
  const [documentContent, setDocumentContent] = useState<string | null>(null)

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: assignmentsRaw, error: assignErr } = await supabase
          .from('user_training_assignments')
          .select('*')
          .eq('auth_id', authId)

        if (assignErr) throw assignErr

        const moduleIds = assignmentsRaw.filter(a => a.type === 'module').map(a => a.module_id)
        const documentIds = assignmentsRaw.filter(a => a.type === 'document').map(a => a.document_id)
        const behaviourIds = assignmentsRaw.filter(a => a.type === 'behaviour').map(a => a.behaviour_id)

        const [{ data: modules }, { data: documents }, { data: behaviours }, { data: moduleCompletions }, { data: documentCompletions }] = await Promise.all([
          supabase.from('modules').select('id, name'),
          supabase.from('documents').select('id, title'),
          supabase.from('behaviours').select('id, name'),
          supabase.from('module_completions').select('module_id, completed_at').eq('auth_id', authId),
          supabase.from('document_completions').select('document_id, completed_at').eq('auth_id', authId)
        ])

        // Fetch module/document opens for this user
        const [{ data: moduleOpens }, { data: documentOpens }] = await Promise.all([
          supabase.from('module_opens').select('module_id, opened_at').eq('auth_id', authId),
          supabase.from('document_opens').select('document_id, opened_at').eq('auth_id', authId)
        ])
        const moduleOpenMap = Object.fromEntries((moduleOpens || []).map(o => [o.module_id, o.opened_at]))
        const documentOpenMap = Object.fromEntries((documentOpens || []).map(o => [o.document_id, o.opened_at]))

        const moduleMap = Object.fromEntries((modules || []).map(m => [m.id, m.name]))
        const documentMap = Object.fromEntries((documents || []).map(d => [d.id, d.title]))
        const behaviourMap = Object.fromEntries((behaviours || []).map(b => [b.id, b.name]))

        const moduleCompletionMap = Object.fromEntries((moduleCompletions || []).map(c => [c.module_id, c.completed_at]))
        const documentCompletionMap = Object.fromEntries((documentCompletions || []).map(c => [c.document_id, c.completed_at]))

        const finalAssignments: Assignment[] = assignmentsRaw.map(a => {
          const id = a.module_id || a.document_id || a.behaviour_id
          const type = a.type
          const name = type === 'module' ? moduleMap[id]
                      : type === 'document' ? documentMap[id]
                      : behaviourMap[id] || 'Behaviour'
          const completed = type === 'module' ? !!moduleCompletionMap[id]
                          : type === 'document' ? !!documentCompletionMap[id]
                          : false
          const completed_at = type === 'module' ? moduleCompletionMap[id]
                              : type === 'document' ? documentCompletionMap[id]
                              : undefined
          const opened_at = type === 'module' ? moduleOpenMap[id]
                          : type === 'document' ? documentOpenMap[id]
                          : undefined

          return { id, name, type, completed, completed_at, opened_at }
        })

        const userFirstName = assignmentsRaw[0]?.first_name
        const userLastName = assignmentsRaw[0]?.last_name
        if (userFirstName || userLastName) {
          setUserFullName(`${userFirstName || ''} ${userLastName || ''}`.trim())
        } else {
          setUserFullName(authId)
        }

        setAssignments(finalAssignments)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [authId])

  const handleComplete = async (assignment: Assignment) => {
    if (assignment.completed) return
    const now = new Date().toISOString()

    // Fetch user's name from users table
    const { data: userData } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('auth_id', authId)
      .single()
    const userFirstName = userData?.first_name || ''
    const userLastName = userData?.last_name || ''

    if (assignment.type === 'module') {
      await supabase.from('module_completions').insert({
        auth_id: authId,
        module_id: assignment.id,
        completed_at: now,
        first_name: userFirstName,
        last_name: userLastName
      })
    } else if (assignment.type === 'document') {
      await supabase.from('document_completions').insert({
        auth_id: authId,
        document_id: assignment.id,
        completed_at: now,
        first_name: userFirstName,
        last_name: userLastName
      })
    }

    setAssignments(prev =>
      prev.map(item =>
        item.id === assignment.id ? { ...item, completed: true, completed_at: now } : item
      )
    )
  }

  // Separate assignments by type and completion
  const modules = assignments.filter(a => a.type === 'module' && !a.completed)
  const documents = assignments.filter(a => a.type === 'document' && !a.completed)
  const behaviours = assignments.filter(a => a.type === 'behaviour' && !a.completed)
  const completed = assignments.filter(a => a.completed)

  const handleShowCertificate = async (assignment: Assignment) => {
    let userName = userFullName
    if (assignment.type === 'module') {
      const { data } = await supabase
        .from('module_completions')
        .select('first_name, last_name')
        .eq('auth_id', authId)
        .eq('module_id', assignment.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()
      if (data) userName = `${data.first_name || ''} ${data.last_name || ''}`.trim()
    } else if (assignment.type === 'document') {
      const { data } = await supabase
        .from('document_completions')
        .select('first_name, last_name')
        .eq('auth_id', authId)
        .eq('document_id', assignment.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()
      if (data) userName = `${data.first_name || ''} ${data.last_name || ''}`.trim()
    }
    setShowCert({
      name: userName,
      training: assignment.name,
      date: assignment.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : ''
    })
  }

  // When viewing a module, record the open event
  const handleViewModule = async (module: { id: string, name: string }) => {
    setViewingModule(module)
    setOpenedModuleIds(prev => prev.includes(module.id) ? prev : [...prev, module.id])
    await supabase.from('module_opens').insert({ auth_id: authId, module_id: module.id })
    // Fetch module content
    const { data } = await supabase.from('modules').select('content').eq('id', module.id).single()
    setModuleContent(data?.content || 'No content available.')
  }

  // When viewing a document, record the open event
  const handleViewDocument = async (doc: { id: string, name: string }) => {
    setViewingDocument(doc)
    setOpenedDocumentIds(prev => prev.includes(doc.id) ? prev : [...prev, doc.id])
    await supabase.from('document_opens').insert({ auth_id: authId, document_id: doc.id })
    // Fetch document file_url
    const { data } = await supabase.from('documents').select('file_url').eq('id', doc.id).single()
    setDocumentContent(data?.file_url || null)
  }

  return (
    <NeonPanel className="w-full">
      {loading ? (
        <p className="neon-success">Loading...</p>
      ) : error ? (
        <p className="neon-error">{error}</p>
      ) : assignments.length === 0 ? (
        <p className="neon-info">No training assigned.</p>
      ) : (
        <>
          {/* Modules Section */}
          <h3 className="neon-form-title mt-4 mb-2">Modules</h3>
          {modules.length === 0 ? <p className="neon-info mb-4">No modules assigned.</p> : (
            <NeonTable columns={[{ header: 'Name', accessor: 'name' }, { header: 'Status', accessor: 'status' }, { header: 'Completed At', accessor: 'completed_at' }, { header: 'Action', accessor: 'action' }]} data={modules.map(a => ({
              name: a.name,
              status: 'Incomplete',
              completed_at: a.completed
                ? new Date(a.completed_at!).toLocaleDateString()
                : a.opened_at
                  ? `Opened on ${new Date(a.opened_at).toLocaleDateString()}`
                  : '—',
              action: (
                <div className="flex gap-2">
                  <NeonIconButton
                    as="button"
                    variant="view"
                    icon={<FiDownload />}
                    title="View Module"
                    onClick={() => handleViewModule({ id: a.id, name: a.name })}
                  />
                  {openedModuleIds.includes(a.id) && (
                    <NeonIconButton
                      as="button"
                      variant="save"
                      icon={<FiCheck />}
                      title="Mark Complete"
                      onClick={() => handleComplete(a)}
                    />
                  )}
                </div>
              )
            }))} />
          )}

          {/* Documents Section */}
          <h3 className="neon-form-title mt-4 mb-2">Documents</h3>
          {documents.length === 0 ? <p className="neon-info mb-4">No documents assigned.</p> : (
            <NeonTable columns={[{ header: 'Name', accessor: 'name' }, { header: 'Status', accessor: 'status' }, { header: 'Completed At', accessor: 'completed_at' }, { header: 'Action', accessor: 'action' }]} data={documents.map(a => ({
              name: a.name,
              status: 'Incomplete',
              completed_at: a.completed
                ? new Date(a.completed_at!).toLocaleDateString()
                : a.opened_at
                  ? `Opened on ${new Date(a.opened_at).toLocaleDateString()}`
                  : '—',
              action: (
                <div className="flex gap-2">
                  <NeonIconButton
                    as="button"
                    variant="view"
                    icon={<FiDownload />}
                    title="View Document"
                    onClick={() => handleViewDocument({ id: a.id, name: a.name })}
                  />
                  {openedDocumentIds.includes(a.id) && (
                    <NeonIconButton
                      as="button"
                      variant="save"
                      icon={<FiCheck />}
                      title="Mark Complete"
                      onClick={() => handleComplete(a)}
                    />
                  )}
                </div>
              )
            }))} />
          )}

          {/* Behaviours Section */}
          <h3 className="neon-form-title mt-4 mb-2">Behaviours</h3>
          {behaviours.length === 0 ? <p className="neon-info mb-4">No behaviours assigned.</p> : (
            <NeonTable columns={[{ header: 'Name', accessor: 'name' }, { header: 'Status', accessor: 'status' }, { header: 'Completed At', accessor: 'completed_at' }, { header: 'Action', accessor: 'action' }]} data={behaviours.map(a => ({
              name: a.name,
              status: 'Incomplete',
              completed_at: '—',
              action: (
                <NeonIconButton
                  as="button"
                  variant="save"
                  icon={<FiCheck />}
                  title="Mark Complete"
                  onClick={() => handleComplete(a)}
                />
              )
            }))} />
          )}

          {/* Completed Section */}
          <h3 className="neon-form-title mt-8 mb-2 neon-info">Completed Training</h3>
          {completed.length === 0 ? <p className="neon-info">No completed training yet.</p> : (
            <NeonTable columns={[{ header: 'Name', accessor: 'name' }, { header: 'Type', accessor: 'type' }, { header: 'Completed At', accessor: 'completed_at' }, { header: 'Certificate', accessor: 'certificate' }]} data={completed.map(a => ({
              name: a.name,
              type: a.type,
              completed_at: a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '—',
              certificate: (
                <NeonIconButton
                  as="button"
                  variant="download"
                  icon={<FiDownload />}
                  title="Download Certificate"
                  onClick={() => handleShowCertificate(a)}
                />
              )
            }))} />
          )}
        </>
      )}

      {/* Certificate Modal */}
      {showCert && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-lg relative">
            <NeonIconButton variant="delete" icon={<FiX />} title="Close" onClick={() => setShowCert(null)} className="absolute top-2 right-2" />
            <CertificateTemplate
              userName={showCert.name}
              trainingName={showCert.training}
              completionDate={showCert.date}
            />
            <NeonIconButton variant="download" icon={<FiDownload />} title="Print / Save as PDF" onClick={() => window.print()} className="mt-4" />
          </div>
        </div>
      )}

      {/* Module/document modal (simple placeholder) */}
      {viewingModule && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-lg relative max-w-xl w-full">
            <NeonIconButton variant="delete" icon={<FiX />} title="Close" onClick={() => { setViewingModule(null); setModuleContent(null); }} className="absolute top-2 right-2" />
            <h2 className="neon-form-title mb-4">Module: {viewingModule.name}</h2>
            <div className="prose max-w-none">{moduleContent || 'Loading...'}</div>
          </div>
        </div>
      )}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-lg relative max-w-xl w-full">
            <NeonIconButton variant="delete" icon={<FiX />} title="Close" onClick={() => { setViewingDocument(null); setDocumentContent(null); }} className="absolute top-2 right-2" />
            <h2 className="neon-form-title mb-4">Document: {viewingDocument.name}</h2>
            {documentContent ? (
              <a href={documentContent} rel="noopener noreferrer" className="neon-btn neon-btn-view">Open Document</a>
            ) : (
              <div className="prose max-w-none">No file available.</div>
            )}
          </div>
        </div>
      )}
    </NeonPanel>
  )
}
