'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import CertificateTemplate from '@/components/training/CertificateTemplate';
import NeonPanel from '@/components/NeonPanel';
import NeonTable from '@/components/NeonTable';
import NeonIconButton from '../ui/NeonIconButton';
import { FiX, FiDownload, FiCheck } from 'react-icons/fi';

type ItemType = 'module' | 'document' | 'behaviour';
type Status = 'assigned' | 'opened' | 'completed';
type ViewMode = 'all' | 'grouped';

type RpcRow = {
  item_id: string;
  item_type: ItemType;
  name: string;
  status: Status;
  opened_at: string | null;
  completed_at: string | null;
};

interface Assignment {
  id: string;
  type: ItemType;
  name: string;
  status: Status;
  opened_at: string | null;
  completed_at: string | null;
}

export default function UserTrainingDashboard({ authId }: { authId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCert, setShowCert] = useState<{ name: string; training: string; date: string } | null>(null);
  const [userFullName, setUserFullName] = useState('User');

  const [viewingModule, setViewingModule] = useState<{ id: string; name: string } | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{ id: string; name: string } | null>(null);
  const [moduleContent, setModuleContent] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // prevent double-click spam while a completion is saving
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const rowKey = (a: Assignment) => `${a.type}:${a.id}`;

  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : '';

  const whenOf = (a: Assignment) =>
    a.status === 'completed'
      ? fmt(a.completed_at)
      : a.status === 'opened'
      ? `Opened on ${fmt(a.opened_at)}`
      : '—';

  const fetchAll = useCallback(async () => {
    if (!authId) return;
    setLoading(true);
    setError(null);
    try {
      // tolerant lookup: works if your 'users' table keys by auth_id or id
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('first_name, last_name')
        .or(`auth_id.eq.${authId},id.eq.${authId}`)
        .limit(1)
        .single();
      if (userErr && userErr.code !== 'PGRST116') throw userErr;
      setUserFullName(`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'User');

      const { data: rpcData, error: rpcErr } = await supabase.rpc('api_get_my_training', { _auth_id: authId });
      if (rpcErr) throw rpcErr;

      const rows = (rpcData as RpcRow[]) ?? [];
      const normalized: Assignment[] = rows
        .map((r) => ({
          id: r.item_id,
          type: r.item_type,
          name: r.name ?? '(untitled)',
          status: r.status,
          opened_at: r.opened_at,
          completed_at: r.completed_at,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

      setAssignments(normalized);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [authId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- Actions: write directly to user_assignments ---------------------------

  const handleComplete = async (a: Assignment) => {
    if (a.status === 'completed') return;

    const k = rowKey(a);
    const now = new Date().toISOString();
    setCompleting((prev) => new Set(prev).add(k));

    // snapshot for rollback
    const snapshot = { ...a };

    // OPTIMISTIC
    setAssignments((prev) =>
      prev.map((x) =>
        x.id === a.id && x.type === a.type
          ? { ...x, status: 'completed', completed_at: now, opened_at: x.opened_at ?? now }
          : x
      )
    );

    try {
      const openedAt = a.opened_at ?? now;
      const { error } = await supabase
        .from('user_assignments')
        .update({ opened_at: openedAt, completed_at: now })
        .eq('auth_id', authId)
        .eq('item_id', a.id)
        .eq('item_type', a.type)
        .select(); // forces error surface + allows checking affected rows if needed
      if (error) throw error;

      // optional: refresh to reflect any server-side changes
      fetchAll();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to mark complete.');
      // rollback
      setAssignments((prev) =>
        prev.map((x) => (x.id === snapshot.id && x.type === snapshot.type ? snapshot : x))
      );
    } finally {
      setCompleting((prev) => {
        const next = new Set(prev);
        next.delete(k);
        return next;
      });
    }
  };

  const handleViewModule = async (mod: { id: string; name: string }) => {
    setViewingModule(mod);
    const now = new Date().toISOString();

    // optimistic open state
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === mod.id && a.type === 'module'
          ? {
              ...a,
              opened_at: a.opened_at ?? now,
              status: a.status === 'assigned' ? 'opened' : a.status,
            }
          : a
      )
    );

    // persist open in union table
    try {
      const { error } = await supabase
        .from('user_assignments')
        .update({ opened_at: now })
        .eq('auth_id', authId)
        .eq('item_id', mod.id)
        .eq('item_type', 'module')
        .is('opened_at', null) // only set if it was null (first open)
        .select();
      if (error) throw error;
    } catch (e) {
      // ignore — optimistic UI already applied
      console.warn('open update failed (module):', e);
    }

    // load content
    const { data } = await supabase.from('modules').select('content').eq('id', mod.id).single();
    setModuleContent(data?.content || 'No content available.');
  };

  const handleViewDocument = async (doc: { id: string; name: string }) => {
    setViewingDocument(doc);
    const now = new Date().toISOString();

    // optimistic open state
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === doc.id && a.type === 'document'
          ? {
              ...a,
              opened_at: a.opened_at ?? now,
              status: a.status === 'assigned' ? 'opened' : a.status,
            }
          : a
      )
    );

    // persist open in union table
    try {
      const { error } = await supabase
        .from('user_assignments')
        .update({ opened_at: now })
        .eq('auth_id', authId)
        .eq('item_id', doc.id)
        .eq('item_type', 'document')
        .is('opened_at', null)
        .select();
      if (error) throw error;
    } catch (e) {
      console.warn('open update failed (document):', e);
    }

    // load link
    const { data } = await supabase.from('documents').select('file_url').eq('id', doc.id).single();
    setDocumentContent(data?.file_url || null);
  };

  const handleShowCertificate = (a: Assignment) => {
    if (a.status !== 'completed' || !a.completed_at) return;
    setShowCert({ name: userFullName, training: a.name, date: fmt(a.completed_at) });
  };

  if (!authId) return null;

  // --- Derived/grouped data --------------------------------------------------

  const allRows = assignments.map((a) => ({
    name: a.name,
    type: a.type,
    status: a.status === 'completed' ? 'Completed' : a.status === 'opened' ? 'Opened' : 'Incomplete',
    when: whenOf(a),
    actions: (
      <div className="flex gap-2">
        {a.type !== 'behaviour' && (
          <NeonIconButton
            as="button"
            variant="view"
            icon={<FiDownload />}
            title={`View ${a.type === 'module' ? 'Module' : 'Document'}`}
            onClick={() =>
              a.type === 'module'
                ? handleViewModule({ id: a.id, name: a.name })
                : handleViewDocument({ id: a.id, name: a.name })
            }
          />
        )}
        {a.status !== 'completed' && (
          <NeonIconButton
            as="button"
            variant="save"
            icon={<FiCheck />}
            title="Mark Complete"
            onClick={() => handleComplete(a)}
            disabled={completing.has(rowKey(a))}
          />
        )}
        {a.status === 'completed' && a.completed_at && (
          <NeonIconButton
            as="button"
            variant="download"
            icon={<FiDownload />}
            title="Certificate"
            onClick={() => handleShowCertificate(a)}
          />
        )}
      </div>
    ),
  }));

  const modules = assignments.filter((a) => a.type === 'module' && a.status !== 'completed');
  const documents = assignments.filter((a) => a.type === 'document' && a.status !== 'completed');
  const behaviours = assignments.filter((a) => a.type === 'behaviour' && a.status !== 'completed');
  const completed = assignments.filter((a) => a.status === 'completed');

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
          {/* View switcher */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="neon-form-title mt-2">Training</h3>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded ${viewMode === 'all' ? 'bg-[var(--neon)] text-black' : 'bg-[var(--field)]'}`}
                onClick={() => setViewMode('all')}
              >
                All (union)
              </button>
              <button
                className={`px-3 py-1 rounded ${viewMode === 'grouped' ? 'bg-[var(--neon)] text-black' : 'bg-[var(--field)]'}`}
                onClick={() => setViewMode('grouped')}
              >
                Grouped
              </button>
            </div>
          </div>

          {viewMode === 'all' ? (
            <NeonTable
              columns={[
                { header: 'Name', accessor: 'name' },
                { header: 'Type', accessor: 'type' },
                { header: 'Status', accessor: 'status' },
                { header: 'When', accessor: 'when' },
                { header: 'Actions', accessor: 'actions' },
              ]}
              data={allRows}
            />
          ) : (
            <>
              {/* Modules */}
              <h4 className="neon-form-title mt-4 mb-2">Modules</h4>
              {modules.length === 0 ? (
                <p className="neon-info mb-4">No modules assigned.</p>
              ) : (
                <NeonTable
                  columns={[
                    { header: 'Name', accessor: 'name' },
                    { header: 'Status', accessor: 'status' },
                    { header: 'When', accessor: 'when' },
                    { header: 'Action', accessor: 'action' },
                  ]}
                  data={modules.map((a) => ({
                    name: a.name,
                    status: a.status === 'completed' ? 'Completed' : a.status === 'opened' ? 'Opened' : 'Incomplete',
                    when: whenOf(a),
                    action: (
                      <div className="flex gap-2">
                        <NeonIconButton
                          as="button"
                          variant="view"
                          icon={<FiDownload />}
                          title="View Module"
                          onClick={() => handleViewModule({ id: a.id, name: a.name })}
                        />
                        <NeonIconButton
                          as="button"
                          variant="save"
                          icon={<FiCheck />}
                          title="Mark Complete"
                          onClick={() => handleComplete(a)}
                          disabled={completing.has(rowKey(a))}
                        />
                      </div>
                    ),
                  }))}
                />
              )}

              {/* Documents */}
              <h4 className="neon-form-title mt-4 mb-2">Documents</h4>
              {documents.length === 0 ? (
                <p className="neon-info mb-4">No documents assigned.</p>
              ) : (
                <NeonTable
                  columns={[
                    { header: 'Name', accessor: 'name' },
                    { header: 'Status', accessor: 'status' },
                    { header: 'When', accessor: 'when' },
                    { header: 'Action', accessor: 'action' },
                  ]}
                  data={documents.map((a) => ({
                    name: a.name,
                    status: a.status === 'completed' ? 'Completed' : a.status === 'opened' ? 'Opened' : 'Incomplete',
                    when: whenOf(a),
                    action: (
                      <div className="flex gap-2">
                        <NeonIconButton
                          as="button"
                          variant="view"
                          icon={<FiDownload />}
                          title="View Document"
                          onClick={() => handleViewDocument({ id: a.id, name: a.name })}
                        />
                        <NeonIconButton
                          as="button"
                          variant="save"
                          icon={<FiCheck />}
                          title="Mark Complete"
                          onClick={() => handleComplete(a)}
                          disabled={completing.has(rowKey(a))}
                        />
                      </div>
                    ),
                  }))}
                />
              )}

              {/* Behaviours */}
              <h4 className="neon-form-title mt-4 mb-2">Behaviours</h4>
              {behaviours.length === 0 ? (
                <p className="neon-info mb-4">No behaviours assigned.</p>
              ) : (
                <NeonTable
                  columns={[
                    { header: 'Name', accessor: 'name' },
                    { header: 'Status', accessor: 'status' },
                    { header: 'When', accessor: 'when' },
                    { header: 'Action', accessor: 'action' },
                  ]}
                  data={behaviours.map((a) => ({
                    name: a.name,
                    status: a.status === 'completed' ? 'Completed' : a.status === 'opened' ? 'Opened' : 'Incomplete',
                    when: whenOf(a),
                    action: (
                      <NeonIconButton
                        as="button"
                        variant="save"
                        icon={<FiCheck />}
                        title="Mark Complete"
                        onClick={() => handleComplete(a)}
                        disabled={completing.has(rowKey(a))}
                      />
                    ),
                  }))}
                />
              )}

              {/* Completed */}
              <h4 className="neon-form-title mt-8 mb-2 neon-info">Completed Training</h4>
              {completed.length === 0 ? (
                <p className="neon-info">No completed training yet.</p>
              ) : (
                <NeonTable
                  columns={[
                    { header: 'Name', accessor: 'name' },
                    { header: 'Type', accessor: 'type' },
                    { header: 'Completed At', accessor: 'completed_at' },
                    { header: 'Certificate', accessor: 'certificate' },
                  ]}
                  data={completed.map((a) => ({
                    name: a.name,
                    type: a.type,
                    completed_at: fmt(a.completed_at),
                    certificate: (
                      <NeonIconButton
                        as="button"
                        variant="download"
                        icon={<FiDownload />}
                        title="Certificate"
                        onClick={() => handleShowCertificate(a)}
                        disabled={a.status !== 'completed' || !a.completed_at}
                      />
                    ),
                  }))}
                />
              )}
            </>
          )}

          {/* Certificate Modal */}
          {showCert && (
            <div className="neon-modal-overlay">
              <div className="neon-modal neon-modal-certificate">
                <NeonIconButton
                  variant="delete"
                  icon={<FiX />}
                  title="Close"
                  onClick={() => setShowCert(null)}
                  className="neon-modal-close-btn"
                />
                <CertificateTemplate
                  userName={showCert.name}
                  trainingName={showCert.training}
                  completionDate={showCert.date}
                />
                <NeonIconButton
                  variant="download"
                  icon={<FiDownload />}
                  title="Print / Save as PDF"
                  onClick={() => window.print()}
                  className="neon-btn neon-btn-print neon-modal-print-btn"
                />
              </div>
            </div>
          )}

          {/* Module/document modals */}
          {viewingModule && (
            <div className="neon-modal-overlay">
              <div className="neon-modal neon-modal-module">
                <NeonIconButton
                  variant="delete"
                  icon={<FiX />}
                  title="Close"
                  onClick={() => {
                    setViewingModule(null);
                    setModuleContent(null);
                  }}
                  className="neon-modal-close-btn"
                />
                <h2 className="neon-modal-title">Module: {viewingModule.name}</h2>
                <div className="neon-modal-content">{moduleContent || 'Loading...'}</div>
              </div>
            </div>
          )}
          {viewingDocument && (
            <div className="neon-modal-overlay">
              <div className="neon-modal neon-modal-document">
                <NeonIconButton
                  variant="delete"
                  icon={<FiX />}
                  title="Close"
                  onClick={() => {
                    setViewingDocument(null);
                    setDocumentContent(null);
                  }}
                  className="neon-modal-close-btn"
                />
                <h2 className="neon-modal-title">Document: {viewingDocument.name}</h2>
                {documentContent ? (
                  <a
                    href={documentContent}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neon-modal-link"
                  >
                    Open Document
                  </a>
                ) : (
                  <div className="neon-modal-content">No file available.</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </NeonPanel>
  );
}
