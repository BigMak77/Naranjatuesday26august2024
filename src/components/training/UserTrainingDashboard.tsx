"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";
import NeonIconButton from "../ui/NeonIconButton";
import { FiX, FiDownload, FiCheck, FiCircle, FiAlertCircle } from "react-icons/fi";
import jsPDF from "jspdf";
import MainHeader from "../ui/MainHeader";

type ItemType = "module" | "document" | "behaviour";
type Status = "assigned" | "opened" | "completed";
type ViewMode = "all" | "grouped";

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

  const [userFullName, setUserFullName] = useState("User");

  const [viewingModule, setViewingModule] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [moduleContent, setModuleContent] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("all");

  // prevent double-click spam while a completion is saving
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const rowKey = (a: Assignment) => `${a.type}:${a.id}`;

  const fmt = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : "";

  const whenOf = (a: Assignment) =>
    a.status === "completed"
      ? fmt(a.completed_at)
      : a.status === "opened"
        ? `Opened on ${fmt(a.opened_at)}`
        : "—";

  const fetchAll = useCallback(async () => {
    if (!authId) return;
    setLoading(true);
    setError(null);
    try {
      // tolerant lookup: works if your 'users' table keys by auth_id or id
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("first_name, last_name")
        .or(`auth_id.eq.${authId},id.eq.${authId}`)
        .limit(1)
        .single();
      if (userErr && userErr.code !== "PGRST116") throw userErr;
      setUserFullName(
        `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "User",
      );

      // Get all assignments for this user
      const { data: rows, error: rowsErr } = await supabase
        .from("user_assignments")
        .select("item_id, item_type, opened_at, completed_at")
        .eq("auth_id", authId);
      if (rowsErr) throw rowsErr;

      // Get all document IDs assigned
      const documentIds = rows
        .filter((r) => r.item_type === "document")
        .map((r) => r.item_id);
      let docTitles: Record<string, string> = {};
      if (documentIds.length > 0) {
        const { data: docs, error: docsErr } = await supabase
          .from("documents")
          .select("id, title")
          .in("id", documentIds);
        if (!docsErr && docs) {
          docs.forEach((d) => {
            docTitles[d.id] = d.title ?? "(untitled)";
          });
        }
      }

      // Get all module IDs assigned
      const moduleIds = rows
        .filter((r) => r.item_type === "module")
        .map((r) => r.item_id);
      let moduleNames: Record<string, string> = {};
      if (moduleIds.length > 0) {
        const { data: mods, error: modsErr } = await supabase
          .from("modules")
          .select("id, name")
          .in("id", moduleIds);
        if (!modsErr && mods) {
          mods.forEach((m) => {
            moduleNames[m.id] = m.name ?? "(untitled)";
          });
        }
      }

      // Get all behaviour IDs assigned
      const behaviourIds = rows
        .filter((r) => r.item_type === "behaviour")
        .map((r) => r.item_id);
      let behaviourNames: Record<string, string> = {};
      if (behaviourIds.length > 0) {
        const { data: behs, error: behsErr } = await supabase
          .from("behaviours")
          .select("id, name")
          .in("id", behaviourIds);
        if (!behsErr && behs) {
          behs.forEach((b) => {
            behaviourNames[b.id] = b.name ?? "(untitled)";
          });
        }
      }

      // Normalize assignments with correct titles/names
      const normalized: Assignment[] = rows.map((r) => {
        let name = "(untitled)";
        if (r.item_type === "document") name = docTitles[r.item_id] ?? r.item_id;
        else if (r.item_type === "module") name = moduleNames[r.item_id] ?? r.item_id;
        else if (r.item_type === "behaviour") name = behaviourNames[r.item_id] ?? r.item_id;
        return {
          id: r.item_id,
          type: r.item_type,
          name,
          status: r.completed_at ? "completed" : r.opened_at ? "opened" : "assigned",
          opened_at: r.opened_at,
          completed_at: r.completed_at,
        };
      });

      setAssignments(normalized.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [authId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- Actions: write directly to user_assignments ---------------------------

  const handleComplete = async (a: Assignment) => {
    if (a.status === "completed") return;

    const k = rowKey(a);
    const now = new Date().toISOString();
    setCompleting((prev) => new Set(prev).add(k));

    // snapshot for rollback
    const snapshot = { ...a };

    // OPTIMISTIC
    setAssignments((prev) =>
      prev.map((x) =>
        x.id === a.id && x.type === a.type
          ? {
              ...x,
              status: "completed",
              completed_at: now,
              opened_at: x.opened_at ?? now,
            }
          : x,
      ),
    );

    try {
      const openedAt = a.opened_at ?? now;
      const { error } = await supabase
        .from("user_assignments")
        .update({ opened_at: openedAt, completed_at: now })
        .eq("auth_id", authId)
        .eq("item_id", a.id)
        .eq("item_type", a.type)
        .select(); // forces error surface + allows checking affected rows if needed
      if (error) throw error;

      // optional: refresh to reflect any server-side changes
      fetchAll();
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to mark complete.");
      // rollback
      setAssignments((prev) =>
        prev.map((x) =>
          x.id === snapshot.id && x.type === snapshot.type ? snapshot : x,
        ),
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
        a.id === mod.id && a.type === "module"
          ? {
              ...a,
              opened_at: a.opened_at ?? now,
              status: a.status === "assigned" ? "opened" : a.status,
            }
          : a,
      ),
    );

    // persist open in union table
    try {
      const { error } = await supabase
        .from("user_assignments")
        .update({ opened_at: now })
        .eq("auth_id", authId)
        .eq("item_id", mod.id)
        .eq("item_type", "module")
        .is("opened_at", null) // only set if it was null (first open)
        .select();
      if (error) throw error;
    } catch (e) {
      // ignore — optimistic UI already applied
      console.warn("open update failed (module):", e);
    }

    // load content
    const { data } = await supabase
      .from("modules")
      .select("content")
      .eq("id", mod.id)
      .single();
    setModuleContent(data?.content || "No content available.");
  };

  const handleViewDocument = async (doc: { id: string; name: string }) => {
    setViewingDocument(doc);
    const now = new Date().toISOString();

    // optimistic open state
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === doc.id && a.type === "document"
          ? {
              ...a,
              opened_at: a.opened_at ?? now,
              status: a.status === "assigned" ? "opened" : a.status,
            }
          : a,
      ),
    );

    // persist open in union table
    try {
      const { error } = await supabase
        .from("user_assignments")
        .update({ opened_at: now })
        .eq("auth_id", authId)
        .eq("item_id", doc.id)
        .eq("item_type", "document")
        .is("opened_at", null)
        .select();
      if (error) throw error;
    } catch (e) {
      console.warn("open update failed (document):", e);
    }

    // load link
    const { data } = await supabase
      .from("documents")
      .select("file_url")
      .eq("id", doc.id)
      .single();
    setDocumentContent(data?.file_url || null);
  };

  // PDF generation handler
  const handleDownloadCertificatePDFDirect = (a: Assignment) => {
    if (a.status !== "completed" || !a.completed_at) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Certificate of Completion", 20, 30);
    doc.setFontSize(16);
    doc.text(`Awarded to: ${userFullName}`, 20, 50);
    doc.text(`Training: ${a.name}`, 20, 65);
    doc.text(`Date: ${fmt(a.completed_at)}`, 20, 80);
    doc.save(`${userFullName}-certificate.pdf`);
  };

  if (!authId) return null;

  // --- UI rendering ---------------------------------------------------------
  const statusIcon = (completed_at: string | null, opened_at: string | null) => {
    if (completed_at) {
      return <FiCheck style={{ color: "#40E0D0" }} title="Completed" />; // neon teal
    }
    if (opened_at) {
      return <FiCircle style={{ color: "#FFD700" }} title="Opened" />; // gold
    }
    return <FiAlertCircle style={{ color: "#FF6347" }} title="Incomplete" />; // tomato
  };

  const allRows = assignments.map((a) => ({
    name: a.name,
    type: a.type,
    status: statusIcon(a.completed_at, a.opened_at),
    when: whenOf(a),
    actions: (
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {a.type !== "behaviour" && (
          <NeonIconButton
            as="button"
            variant="view"
            title={`View ${a.type === "module" ? "Module" : "Document"}`}
            className="neon-btn-view"
            onClick={() =>
              a.type === "module"
                ? handleViewModule({ id: a.id, name: a.name })
                : handleViewDocument({ id: a.id, name: a.name })
            }
          />
        )}
        {!a.completed_at && (
          <NeonIconButton
            as="button"
            variant="submit"
            title="Mark Complete"
            className="neon-btn-confirm"
            onClick={() => handleComplete(a)}
            disabled={completing.has(rowKey(a))}
          />
        )}
        {a.completed_at && (
          <NeonIconButton
            as="button"
            variant="download"
            title="Certificate"
            className="neon-btn-download"
            onClick={() => handleDownloadCertificatePDFDirect(a)}
          />
        )}
      </div>
    ),
  }));

  const modules = assignments.filter(
    (a) => a.type === "module" && !a.completed_at,
  );
  const documents = assignments.filter(
    (a) => a.type === "document" && !a.completed_at,
  );
  const completed = assignments.filter((a) => !!a.completed_at);

  const moduleColumns = [
    { header: "Name", accessor: "name" },
    {
      header: "Status",
      accessor: "status",
      render: (_v: unknown, row: Record<string, unknown>) => statusIcon(row.completed_at as string | null, row.opened_at as string | null),
    },
    { header: "When", accessor: "when" },
    { header: "Action", accessor: "action" },
  ];

  // --- UI rendering ---------------------------------------------------------
  return (
    <NeonPanel className="w-full">
      <MainHeader title="User Training Dashboard" subtitle={userFullName ? `Welcome, ${userFullName}` : undefined} />
      {loading ? (
        <p className="neon-success">Loading...</p>
      ) : error ? (
        <p className="neon-error">{error}</p>
      ) : assignments.length === 0 ? (
        <p className="neon-info">No training assigned.</p>
      ) : (
        <div className="user-training-dashboard-list">
          <div className="neon-panels-row" style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <h2 className="neon-section-title">Modules</h2>
              {modules.length === 0 ? (
                <p className="neon-info mb-4">No modules assigned.</p>
              ) : (
                <div style={{ marginBottom: 24 }}>
                  <NeonTable
                    columns={moduleColumns}
                    data={modules.map((a) => ({
                      name: a.name,
                      status: a.status === "completed" ? "Completed" : a.status === "opened" ? "Opened" : "Incomplete",
                      when: whenOf(a),
                      action: (
                        <div style={{ display: "flex", gap: 16 }}>
                          <NeonIconButton
                            as="button"
                            variant="view"
                            title="View Module"
                            className="neon-btn-view"
                            onClick={() => handleViewModule({ id: a.id, name: a.name })}
                          />
                          <NeonIconButton
                            as="button"
                            variant="submit"
                            title="Mark Complete"
                            className="neon-btn-confirm"
                            onClick={() => handleComplete(a)}
                            disabled={completing.has(rowKey(a))}
                          />
                        </div>
                      ),
                    }))}
                  />
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 320 }}>
              <h2 className="neon-section-title">Documents</h2>
              {documents.length === 0 ? (
                <p className="neon-info mb-4">No documents assigned.</p>
              ) : (
                <div style={{ marginBottom: 24 }}>
                  <NeonTable
                    columns={[{ header: "Name", accessor: "name" }, { header: "Status", accessor: "status", render: (_v, row) => statusIcon(row.completed_at as string | null, row.opened_at as string | null) }, { header: "When", accessor: "when" }, { header: "Action", accessor: "action" }]}
                    data={documents.map((a) => ({
                      name: a.name,
                      status: a.status === "completed" ? "Completed" : a.status === "opened" ? "Opened" : "Incomplete",
                      when: whenOf(a),
                      action: (
                        <div style={{ display: "flex", gap: 16 }}>
                          <NeonIconButton
                            as="button"
                            variant="view"
                            title="View Document"
                            className="neon-btn-view"
                            onClick={() => handleViewDocument({ id: a.id, name: a.name })}
                          />
                          <NeonIconButton
                            as="button"
                            variant="submit"
                            title="Mark Complete"
                            className="neon-btn-confirm"
                            onClick={() => handleComplete(a)}
                            disabled={completing.has(rowKey(a))}
                          />
                        </div>
                      ),
                    }))}
                  />
                </div>
              )}
            </div>
          </div>

          <h2 className="neon-section-title">Completed Training</h2>
          {completed.length === 0 ? (
            <p className="neon-info">No completed training yet.</p>
          ) : (
            <div style={{ marginBottom: 24 }}>
              <NeonTable
                columns={[{ header: "Name", accessor: "name" }, { header: "Type", accessor: "type" }, { header: "Completed At", accessor: "completed_at" }, { header: "Certificate", accessor: "certificate" }]}
                data={completed.map((a) => ({
                  name: a.name,
                  type: a.type,
                  completed_at: fmt(a.completed_at),
                  certificate: (
                    <NeonIconButton
                      as="button"
                      variant="download"
                      title="Certificate"
                      className="neon-btn-download"
                      onClick={() => handleDownloadCertificatePDFDirect(a)}
                      disabled={a.status !== "completed" || !a.completed_at}
                    />
                  ),
                }))}
              />
            </div>
          )}
        </div>
      )}

      {/* Module/document modals */}
      {viewingModule && (
        <div className="neon-modal-overlay">
          <div className="neon-modal neon-modal-module">
            <NeonIconButton
              variant="close"
              title="Close"
              className="neon-btn-close neon-modal-close-btn"
              onClick={() => {
                setViewingModule(null);
                setModuleContent(null);
              }}
            />
            <h2 className="neon-modal-title">
              Module: {viewingModule.name}
            </h2>
            <div className="neon-modal-content">
              {moduleContent || "Loading..."}
            </div>
          </div>
        </div>
      )}
      {viewingDocument && (
        <div className="neon-modal-overlay">
          <div className="neon-modal neon-modal-document">
            <NeonIconButton
              variant="close"
              title="Close"
              className="neon-btn-close neon-modal-close-btn"
              onClick={() => {
                setViewingDocument(null);
                setDocumentContent(null);
              }}
            />
            <h2 className="neon-modal-title">
              Document: {viewingDocument.name}
            </h2>
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
    </NeonPanel>
  );
}
