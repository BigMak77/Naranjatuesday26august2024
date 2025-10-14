"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import NeonPanel from "@/components/NeonPanel";
import { FiArchive, FiPlus } from "react-icons/fi";
import { supabase } from "@/lib/supabase-client";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

// Custom tooltip added

export interface Module {
  id: string;
  name: string;
  is_archived?: boolean;
}

/** Minimal portal used only here; no global CSS changes required */
function BodyPortal({ children }: { children: React.ReactNode }) {
  const elRef = useRef<HTMLElement | null>(null);
  if (!elRef.current) {
    elRef.current = document.createElement("div");
    elRef.current.setAttribute("data-portal", "archive-module-dialog");
  }
  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);
  return createPortal(children, elRef.current);
}

export default function ArchiveModuleTab({
  module,
  onArchive,
  useServerRoute = false,
}: {
  module: Module | null;
  onArchive?: (archived: Module) => void;
  useServerRoute?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDialog = () => {
    setError(null);
    setDialogOpen(true);
  };
  const closeDialog = useCallback(() => {
    if (loading) return;
    setDialogOpen(false);
  }, [loading]);

  // optional: Esc to close (matches your working panel behavior)
  useEffect(() => {
    if (!dialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDialog();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [dialogOpen, closeDialog, loading]);

  const handleArchive = async () => {
    if (!module) return;
    setLoading(true);
    setError(null);

    try {
      let archived: Module | null = null;

      if (useServerRoute) {
        const res = await fetch(`/api/modules/${module.id}/archive`, {
          method: "POST",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to archive module");
        archived = json.module as Module;
      } else {
        const { data, error } = await supabase
          .from("modules")
          .update({ is_archived: true, updated_at: new Date().toISOString() })
          .eq("id", module.id)
          .select("id,name,is_archived")
          .single();
        if (error) throw error;
        archived = data as Module;
      }

      onArchive?.(archived);
      setDialogOpen(false);
    } catch (e: unknown) {
      setError(
        `Failed to archive module: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NeonPanel className="p-6">
        {!module || module.is_archived ? (
          <div>No module selected.</div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-3">Archive Module</h2>
            <p className="mb-4">
              Selected: <span className="font-semibold">{module.name}</span>
            </p>
            <NeonIconButton
              variant="add"
              icon={<FiPlus />}
              title="Add"
              onClick={openDialog}
            />
          </>
        )}
      </NeonPanel>

      {dialogOpen && (
        <BodyPortal>
          {/* overlay centers its child (content) using your existing CSS */}
          <div
            className="ui-dialog-overlay"
            style={{ zIndex: 60000 }} // higher than anything local; safe override
            onClick={(e) => {
              if (e.target === e.currentTarget) closeDialog();
            }}
          >
            <div
              className="ui-dialog-content neon-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="archive-title"
              style={{ zIndex: 60001 }}
            >
              <div
                className="neon-form-title"
                id="archive-title"
                style={{ marginBottom: "1.25rem" }}
              >
                Archive Module
              </div>

              {module && (
                <>
                  <p className="mb-2">
                    Are you sure you want to archive{" "}
                    <span className="font-semibold">{module.name}</span>?
                  </p>
                  <div className="mb-4 text-sm opacity-80">
                    Archiving marks this module as inactive and hides it from
                    active lists. It does not delete data.
                  </div>

                  {error && <div className="neon-error mb-3">{error}</div>}

                  <div
                    className="neon-panel-actions"
                    style={{
                      display: "flex",
                      gap: "1rem",
                      justifyContent: "flex-end",
                      marginTop: "1.25rem",
                    }}
                  >
                    <CustomTooltip text="Archive this module">
                      <button
                        className="btn-archive neon-btn neon-btn-archive"
                        onClick={handleArchive}
                        disabled={loading}
                        autoFocus
                      >
                        <FiArchive />
                        {/* Icon only, no label */}
                      </button>
                    </CustomTooltip>
                    <CustomTooltip text="Cancel">
                      <button
                        className="neon-btn neon-btn-danger"
                        onClick={closeDialog}
                        disabled={loading}
                      >
                        {/* Icon only, no label */}
                      </button>
                    </CustomTooltip>
                  </div>
                </>
              )}
            </div>
          </div>
        </BodyPortal>
      )}
    </>
  );
}
