"use client";

import React, { useEffect, useState } from "react";
import NeonTable from "@/components/NeonTable";
import { supabase } from "@/lib/supabase-client";
import { FiSearch, FiFileText, FiDownload, FiEye } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import OverlayDialog from "@/components/ui/OverlayDialog";
import { getFileIcon } from "@/lib/file-utils";
import TextIconButton from "@/components/ui/TextIconButtons";

interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  ref_code?: string;
  learning_objectives?: string;
  estimated_duration?: string;
  delivery_format?: string;
  target_audience?: string;
  prerequisites?: string[];
  tags?: string[];
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
    uploaded_at: string;
  }>;
}

export default function TrainerModuleView() {
  const [modules, setModules] = useState<Module[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [paginationControls, setPaginationControls] = useState<React.ReactNode>(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("is_archived", false)
      .order("name", { ascending: true });

    if (!error && data) {
      const cleaned = data.map((m) => ({
        ...m,
        description: m.description ?? "",
        learning_objectives: m.learning_objectives ?? "",
        estimated_duration: m.estimated_duration ?? "",
        delivery_format: m.delivery_format ?? "",
        target_audience: m.target_audience ?? "",
        prerequisites: m.prerequisites ?? [],
        tags: m.tags ?? [],
        attachments: m.attachments ?? [],
      }));
      setModules(cleaned);
    }
    setLoading(false);
  };

  const filteredModules = modules.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      m.ref_code?.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewDetails = (module: Module) => {
    setSelectedModule(module);
  };

  const formatDuration = (duration: string | undefined) => {
    if (!duration) return "—";
    const mins = parseInt(duration);
    if (isNaN(mins)) return duration;
    if (mins < 60) return `${mins} mins`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDownload = async (attachment: { name: string; url: string }) => {
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <p>Loading modules...</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: 16 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
            <FiSearch
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--accent)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules by name, description, or ref code..."
              className="neon-input"
              style={{ paddingLeft: 40, width: "100%" }}
            />
          </div>
          {paginationControls && (
            <div style={{ marginLeft: "auto" }}>{paginationControls}</div>
          )}
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 16 }}>
          {filteredModules.length} module{filteredModules.length !== 1 ? "s" : ""} available
        </p>
      </div>

      <NeonTable
        paginationPosition="toolbar"
        onPaginationChange={setPaginationControls}
        columns={[
          { header: "Name", accessor: "name" },
          { header: "Ref Code", accessor: "ref_code", width: 120 },
          { header: "Description", accessor: "description" },
          { header: "Duration", accessor: "duration", width: 100 },
          { header: "Files", accessor: "files", width: 80 },
          { header: "Actions", accessor: "actions", width: 100 },
        ]}
        data={filteredModules.map((m) => ({
          ...m,
          ref_code: m.ref_code || (
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>—</span>
          ),
          duration: formatDuration(m.estimated_duration),
          files: m.attachments && m.attachments.length > 0 ? (
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <FiFileText style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "0.875rem" }}>{m.attachments.length}</span>
            </div>
          ) : (
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>—</span>
          ),
          actions: (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <CustomTooltip text="View module details">
                <TextIconButton
                  variant="view"
                  icon={<FiEye />}
                  label="View"
                  onClick={() => handleViewDetails(m)}
                />
              </CustomTooltip>
            </div>
          ),
        }))}
      />

      {/* Module Details Dialog */}
      {selectedModule && (
        <OverlayDialog
          open={true}
          onClose={() => setSelectedModule(null)}
          showCloseButton={true}
          width={900}
        >
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.75rem", marginBottom: 8 }}>
                {selectedModule.name}
              </h2>
              {selectedModule.ref_code && (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 16 }}>
                  Reference Code: <span style={{ color: "var(--neon)", fontWeight: 600 }}>{selectedModule.ref_code}</span>
                </p>
              )}
            </div>

            <div style={{ display: "grid", gap: 24 }}>
              {/* Description */}
              {selectedModule.description && (
                <div>
                  <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1rem", marginBottom: 8 }}>
                    Description
                  </h3>
                  <p style={{ color: "var(--text)", lineHeight: 1.6 }}>
                    {selectedModule.description}
                  </p>
                </div>
              )}

              {/* Learning Objectives */}
              {selectedModule.learning_objectives && (
                <div>
                  <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1rem", marginBottom: 8 }}>
                    Learning Objectives
                  </h3>
                  <p style={{ color: "var(--text)", lineHeight: 1.6 }}>
                    {selectedModule.learning_objectives}
                  </p>
                </div>
              )}

              {/* Module Details Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                {selectedModule.estimated_duration && (
                  <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 4 }}>
                      Estimated Duration
                    </p>
                    <p style={{ color: "var(--accent)", fontSize: "1.125rem", fontWeight: 600 }}>
                      {formatDuration(selectedModule.estimated_duration)}
                    </p>
                  </div>
                )}

                {selectedModule.delivery_format && (
                  <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 4 }}>
                      Delivery Format
                    </p>
                    <p style={{ color: "var(--text)", fontSize: "1rem" }}>
                      {selectedModule.delivery_format}
                    </p>
                  </div>
                )}

                {selectedModule.version && (
                  <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 4 }}>
                      Version
                    </p>
                    <p style={{ color: "var(--text)", fontSize: "1rem" }}>
                      {selectedModule.version}
                    </p>
                  </div>
                )}
              </div>

              {/* Target Audience */}
              {selectedModule.target_audience && (
                <div>
                  <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1rem", marginBottom: 8 }}>
                    Target Audience
                  </h3>
                  <p style={{ color: "var(--text)" }}>
                    {selectedModule.target_audience}
                  </p>
                </div>
              )}

              {/* Prerequisites */}
              {selectedModule.prerequisites && selectedModule.prerequisites.length > 0 && (
                <div>
                  <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1rem", marginBottom: 8 }}>
                    Prerequisites
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 24, color: "var(--text)" }}>
                    {selectedModule.prerequisites.map((prereq, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>{prereq}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {selectedModule.tags && selectedModule.tags.length > 0 && (
                <div>
                  <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1rem", marginBottom: 8 }}>
                    Tags
                  </h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selectedModule.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "4px 12px",
                          background: "var(--surface)",
                          border: "1px solid var(--neon)",
                          borderRadius: 16,
                          fontSize: "0.875rem",
                          color: "var(--neon)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedModule.attachments && selectedModule.attachments.length > 0 && (
                <div>
                  <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1rem", marginBottom: 12 }}>
                    Attached Files ({selectedModule.attachments.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedModule.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: 12,
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                          {getFileIcon(attachment.name, attachment.type, 20)}
                          <div style={{ flex: 1 }}>
                            <p style={{ color: "var(--text)", fontWeight: 500, marginBottom: 2 }}>
                              {attachment.name}
                            </p>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>
                        </div>
                        <CustomTooltip text="Download file">
                          <TextIconButton
                            variant="download"
                            icon={<FiDownload />}
                            label="Download"
                            onClick={() => handleDownload(attachment)}
                          />
                        </CustomTooltip>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <TextIconButton
                variant="cancel"
                label="Close"
                onClick={() => setSelectedModule(null)}
              />
            </div>
          </div>
        </OverlayDialog>
      )}
    </>
  );
}
