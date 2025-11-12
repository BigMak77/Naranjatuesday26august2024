import React, { useState, useMemo } from "react";
import NeonTable from "@/components/NeonTable";
import OverlayDialog from "@/components/ui/OverlayDialog";
import { createClient } from "@supabase/supabase-js";

type MaterialType = "video" | "image" | "document";
interface TrainingMaterial {
  id: string;
  type: MaterialType;
  title: string;
  url: string;
}

const SUPABASE_BUCKET = "documents";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface TrainingMaterialsManagerDialogProps {
  open: boolean;
  onClose: () => void;
}

const TrainingMaterialsManagerDialog: React.FC<TrainingMaterialsManagerDialogProps> = ({ open, onClose }) => {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialFile, setNewMaterialFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  React.useEffect(() => {
    async function fetchDocuments() {
      const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).list("", { limit: 100 });
      if (error) {
        console.error("Error fetching documents from Supabase bucket:", error);
        return;
      }
      if (data) {
        const docs = data
          .filter((item) => item.name && !item.name.endsWith("/"))
          .map((item) => ({
            id: item.id || item.name,
            type: "document" as const,
            title: item.name,
            url: supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(item.name).data.publicUrl,
          }));
        setMaterials(docs);
      }
    }
    if (open) fetchDocuments();
  }, [open]);

  async function handleUploadMaterial(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);
    if (!newMaterialFile || !newMaterialTitle) {
      setUploadError("Please provide a title and select a file.");
      return;
    }
    setUploading(true);
    try {
      const fileExt = newMaterialFile.name.split('.').pop()?.toLowerCase();
      let type: MaterialType = "document";
      if (["mp4", "mov", "avi", "webm"].includes(fileExt!)) type = "video";
      if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(fileExt!)) type = "image";
      const filePath = `${Date.now()}_${newMaterialFile.name}`;
      const { error: uploadError } = await supabase.storage.from(SUPABASE_BUCKET).upload(filePath, newMaterialFile);
      if (uploadError) throw uploadError;
      const publicUrl = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath).data.publicUrl;
      setMaterials(prev => [
        ...prev,
        { id: filePath, type, title: newMaterialTitle, url: publicUrl },
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

  const filteredMaterials = useMemo(() =>
    materials.filter((m) => {
      const matchesType = typeFilter ? m.type === typeFilter : true;
      const matchesSearch =
        search.trim() === "" ||
        m.title.toLowerCase().includes(search.trim().toLowerCase());
      return matchesType && matchesSearch;
    }),
    [materials, search, typeFilter]
  );

  const materialsTableData = filteredMaterials.map(m => ({ ...m }));
  const materialColumns = [
    { header: "Title", accessor: "title" },
    { header: "Type", accessor: "type" },
    { header: "Link", accessor: "url", render: (value: unknown) => (
      typeof value === "string" ? <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: "#c75c00" }}>Open</a> : null
    ) },
  ];

  return (
    <OverlayDialog showCloseButton={true} open={open} onClose={onClose}>
      <div style={{ padding: 24, minWidth: 600, maxWidth: 1100 }}>
        <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>All Training Materials</h3>
        <div style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 180 }}
          />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }}
          >
            <option value="">All Types</option>
            <option value="document">Document</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
          </select>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => setShowAddMaterial(true)}
            style={{ padding: '8px 18px', fontWeight: 600, background: '#40e0d0', color: '#012b2b', border: 0, borderRadius: 6 }}
          >
            + Add Material
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 18px', fontWeight: 600, background: '#c75c00', color: '#fff', border: 0, borderRadius: 6 }}
          >
            Close
          </button>
        </div>
        <NeonTable columns={materialColumns} data={materialsTableData} />
      </div>
      {showAddMaterial && (
        <OverlayDialog showCloseButton={true} open={showAddMaterial} onClose={() => setShowAddMaterial(false)}>
          <form onSubmit={handleUploadMaterial} style={{ background: "#fff", border: "2px solid #40e0d0", borderRadius: 8, padding: 24, minWidth: 340 }}>
            <h4 style={{ marginBottom: 16 }}>Add New Material</h4>
            <label style={{ display: 'block', marginBottom: 12 }}>
              Title
              <input
                type="text"
                value={newMaterialTitle}
                onChange={e => setNewMaterialTitle(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }}
                required
              />
            </label>
            <label style={{ display: 'block', marginBottom: 12 }}>
              File
              <input
                type="file"
                onChange={e => setNewMaterialFile(e.target.files?.[0] || null)}
                style={{ width: '100%', marginTop: 4 }}
                required
              />
            </label>
            {uploadError && <div style={{ color: 'red', marginBottom: 8 }}>{uploadError}</div>}
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button type="submit" disabled={uploading} style={{ padding: '6px 16px', fontWeight: 600, background: '#40e0d0', color: '#012b2b', border: 0, borderRadius: 6 }}>
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <button type="button" onClick={() => setShowAddMaterial(false)} style={{ padding: '6px 16px', fontWeight: 600, background: '#eee', color: '#333', border: 0, borderRadius: 6 }}>
                Cancel
              </button>
            </div>
          </form>
        </OverlayDialog>
      )}
    </OverlayDialog>
  );
};

export default TrainingMaterialsManagerDialog;
