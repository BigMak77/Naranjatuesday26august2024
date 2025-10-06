"use client";
import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import NeonTable from "@/components/NeonTable";
import OverlayDialog from "@/components/ui/OverlayDialog";
import { FiFolder } from "react-icons/fi";
import TrainingQuestionForm from "./TrainingQuestionForm";

type MaterialType = "video" | "image" | "audio" | "document";
interface TrainingMaterial {
  id: string;
  type: MaterialType;
  title: string;
  url: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
const SUPABASE_BUCKET = "documents";

function detectTypeByExt(name: string): MaterialType | "audio" {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext)) return "image";
  if (["mp3", "wav", "ogg", "m4a", "flac", "aac", "wma"].includes(ext)) return "audio";
  return "document";
}

interface TrainingMaterialsManagerProps {
  showAddQuestion?: boolean;
  onCloseAddQuestion?: () => void;
}

const TrainingMaterialsManager: React.FC<TrainingMaterialsManagerProps> = ({ showAddQuestion: showAddQuestionProp, onCloseAddQuestion }) => {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialFile, setNewMaterialFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  // Pagination state (main + dialog)
  const [page, setPage] = useState(1);
  const [dialogPage, setDialogPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).list("", { limit: 100 });
      if (error) {
        console.error(error);
        return;
      }
      const docs: TrainingMaterial[] = (data || [])
        .filter((i) => i.name && !i.name.endsWith("/"))
        .map((i) => ({
          id: i.id || i.name,
          type: detectTypeByExt(i.name),
          title: i.name,
          url: supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(i.name).data.publicUrl,
        }));
      setMaterials(docs);
    })();
  }, []);

  useEffect(() => {
    if (typeof showAddQuestionProp === 'boolean') setShowAddQuestion(showAddQuestionProp);
  }, [showAddQuestionProp]);

  async function handleUploadMaterial(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);
    if (!newMaterialFile || !newMaterialTitle.trim()) {
      setUploadError("Please provide a title and file.");
      return;
    }
    setUploading(true);
    try {
      const filePath = `${Date.now()}_${newMaterialFile.name}`;
      const { error: upErr } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(filePath, newMaterialFile, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const publicUrl = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath).data.publicUrl;
      const type = detectTypeByExt(newMaterialFile.name);

      // Insert into modules table
      const { error: insertErr } = await supabase
        .from("modules")
        .insert([
          {
            name: newMaterialTitle.trim(),
            type,
            content: publicUrl, // or use another field if you prefer
            // Add other fields as needed
          },
        ]);
      if (insertErr) throw insertErr;

      setMaterials((p) => [
        ...p,
        {
          id: filePath,
          type,
          title: newMaterialTitle.trim(),
          url: publicUrl,
        },
      ]);

      setShowAddMaterial(false);
      setNewMaterialTitle("");
      setNewMaterialFile(null);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Filtering
  const filteredMaterials = useMemo(() => {
    const q = search.trim().toLowerCase();
    return materials.filter(
      (m) => (!typeFilter || m.type === typeFilter) && (!q || m.title.toLowerCase().includes(q))
    );
  }, [materials, search, typeFilter]);

  // Totals
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredMaterials.length / pageSize)),
    [filteredMaterials.length, pageSize]
  );
  const dialogTotalPages = totalPages; // same dataset in both views

  // Reset to page 1 when filters or dataset change
  useEffect(() => {
    setPage(1);
    setDialogPage(1);
  }, [search, typeFilter, materials.length]);

  // Clamp pages if they drift out of range after dataset shrinks
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  useEffect(() => {
    if (dialogPage > dialogTotalPages) setDialogPage(dialogTotalPages);
  }, [dialogTotalPages, dialogPage]);

  // Slices (computed after clamping)
  const paginatedMaterials = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, page, pageSize]);

  const dialogPaginatedMaterials = useMemo(() => {
    const start = (dialogPage - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, dialogPage, pageSize]);

  const materialColumns = [
    { header: "Title", accessor: "title" },
    { header: "Type", accessor: "type" },
    {
      header: "Link",
      accessor: "url",
      render: (v: unknown) =>
        typeof v === "string" ? (
          <a href={v} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
            Open
          </a>
        ) : null,
    },
  ];

  const pageWrap: React.CSSProperties = {
    display: "flex",
    gap: 24,
    alignItems: "flex-start",
    padding: 24,
    maxWidth: 1200,
    margin: "0 auto",
  };
  const main: React.CSSProperties = { flex: 1, minWidth: 0 };

  return (
    <section>
      {/* Top tools / triggers */}
      <div style={{ display: "flex", gap: 12, padding: "16px 24px", alignItems: "center" }}>
        <button
          onClick={() => setDialogOpen(true)}
          className="sidebar-action"
          aria-haspopup="dialog"
          aria-expanded={dialogOpen}
        >
          <FiFolder style={{ fontSize: 20 }} /> Browse &amp; Filter Materials
        </button>
        <button
          type="button"
          className="sidebar-action"
          onClick={() => setShowAddQuestion(true)}
        >
          Add Training Question
        </button>
      </div>

      <div style={pageWrap}>
        {/* MAIN */}
        <div style={main}>
          <h2 className="neon-heading" style={{ marginBottom: 16 }}>Training Materials Manager</h2>

          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="neon-modal-title">Materials</h3>
              <button
                type="button"
                className="sidebar-action"
                onClick={() => setShowAddMaterial(true)}
              >
                Add Material
              </button>
            </div>

            {filteredMaterials.length === 0 ? (
              <div className="neon-muted" style={{ margin: "16px 0" }}>No materials yet.</div>
            ) : (
              <>
                <NeonTable
                  columns={materialColumns}
                  data={paginatedMaterials.map((m) => ({ ...m })) as Record<string, unknown>[]}
                />

                {/* Pagination controls */}
                <div className="neon-duallistbox-pagination" style={{ justifyContent: "center", gap: 8, marginTop: 16 }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="sidebar-action"
                    style={{ width: "auto", padding: "6px 14px" }}
                  >
                    Prev
                  </button>
                  <span style={{ alignSelf: "center" }} className="font-xs">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="sidebar-action"
                    style={{ width: "auto", padding: "6px 14px" }}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Browse & Filter dialog */}
      <OverlayDialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <div style={{ padding: 24, minWidth: 600, maxWidth: 1100 }}>
          <h3 className="neon-modal-title" style={{ marginBottom: 16 }}>All Training Materials</h3>
          <div style={{ display: "flex", gap: 16, marginBottom: 18, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setDialogPage(1);
              }}
              className="neon-input"
              style={{ minWidth: 180 }}
            />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setDialogPage(1);
              }}
              className="neon-input"
              style={{ minWidth: 120 }}
            >
              <option value="">All Types</option>
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
            </select>
            <button
              onClick={() => {
                setShowAddMaterial(true);
                setDialogOpen(false);
              }}
              className="sidebar-action"
              style={{ width: "auto", padding: "8px 18px", marginLeft: "auto" }}
            >
              + Add Material
            </button>
          </div>

          <NeonTable
            columns={materialColumns}
            data={dialogPaginatedMaterials.map((m) => ({ ...m })) as Record<string, unknown>[]}
          />

          {/* Pagination controls for dialog */}
          <div className="neon-duallistbox-pagination" style={{ justifyContent: "center", gap: 8, marginTop: 16 }}>
            <button
              onClick={() => setDialogPage((p) => Math.max(1, p - 1))}
              disabled={dialogPage === 1}
              className="sidebar-action"
              style={{ width: "auto", padding: "6px 14px" }}
            >
              Prev
            </button>
            <span style={{ alignSelf: "center" }} className="font-xs">
              Page {dialogPage} of {dialogTotalPages}
            </span>
            <button
              onClick={() => setDialogPage((p) => Math.min(dialogTotalPages, p + 1))}
              disabled={dialogPage === dialogTotalPages}
              className="sidebar-action"
              style={{ width: "auto", padding: "6px 14px" }}
            >
              Next
            </button>
          </div>

          <button
            onClick={() => setDialogOpen(false)}
            className="sidebar-action"
            style={{ width: "auto", padding: "6px 16px", background: "#c75c00", color: "#fff", marginTop: 24 }}
          >
            Close
          </button>
        </div>
      </OverlayDialog>

      {/* Add Material modal */}
      <OverlayDialog open={showAddMaterial} onClose={() => setShowAddMaterial(false)}>
        <form
          onSubmit={handleUploadMaterial}
          style={{ background: "#fff", border: "2px solid #40e0d0", borderRadius: 8, padding: 24, minWidth: 340 }}
        >
          <h4 className="neon-modal-title" style={{ marginBottom: 16 }}>Add New Material</h4>
          <label style={{ display: "block", marginBottom: 12 }}>
            Title
            <input
              type="text"
              value={newMaterialTitle}
              onChange={(e) => setNewMaterialTitle(e.target.value)}
              className="neon-input"
              style={{ marginTop: 4 }}
              required
            />
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            File
            <input
              type="file"
              onChange={(e) => setNewMaterialFile(e.target.files?.[0] || null)}
              className="neon-input"
              style={{ marginTop: 4 }}
              required
            />
          </label>
          {uploadError && <div style={{ color: "red", marginBottom: 8 }}>{uploadError}</div>}
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button
              type="submit"
              disabled={uploading}
              className="sidebar-action"
              style={{ width: "auto", padding: "6px 16px" }}
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddMaterial(false)}
              className="sidebar-action"
              style={{ width: "auto", padding: "6px 16px", background: "#eee", color: "#333" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </OverlayDialog>

      {/* Render the form as a modal or inline below the button */}
      {((typeof showAddQuestionProp === 'boolean' && showAddQuestionProp) || showAddQuestion) && (
        <OverlayDialog open onClose={() => {
          setShowAddQuestion(false);
          if (onCloseAddQuestion) onCloseAddQuestion();
        }}>
          <div style={{ padding: 24, minWidth: 400, maxWidth: 600 }}>
            <TrainingQuestionForm moduleId={"" /* Pass the correct moduleId here */} onAdded={() => {
              setShowAddQuestion(false);
              if (onCloseAddQuestion) onCloseAddQuestion();
            }} />
          </div>
        </OverlayDialog>
      )}
    </section>
  );
};

export default TrainingMaterialsManager;
