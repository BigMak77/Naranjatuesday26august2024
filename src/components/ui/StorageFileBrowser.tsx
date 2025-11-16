"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiFile, FiSearch, FiX } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import type { FileObject } from "@supabase/storage-js";

type StorageFile = FileObject;

interface StorageFileBrowserProps {
  bucket?: string;
  onSelectFile: (fileUrl: string, fileName: string) => void;
  onClose: () => void;
}

export default function StorageFileBrowser({
  bucket = "documents", // Default bucket - should be overridden by parent component
  onSelectFile,
  onClose,
}: StorageFileBrowserProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFiles();
  }, [bucket]);

  const fetchFiles = async () => {
    setLoading(true);
    setError("");
    try {
      console.log(`[StorageFileBrowser] Fetching files from bucket: "${bucket}"`);

      const { data, error: fetchError } = await supabase.storage
        .from(bucket)
        .list("", {
          limit: 1000,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (fetchError) {
        console.error("[StorageFileBrowser] Fetch error:", fetchError);
        setError(`Error: ${fetchError.message}`);
        setFiles([]);
      } else {
        console.log(`[StorageFileBrowser] Found ${data?.length || 0} files in bucket "${bucket}"`);
        // Filter out the .emptyFolderPlaceholder file that Supabase creates
        const filteredData = (data || []).filter(file => file.name !== '.emptyFolderPlaceholder');
        setFiles(filteredData);
      }
    } catch (err) {
      console.error("[StorageFileBrowser] Catch error:", err);
      setError(`Failed to fetch files from storage: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return files;
    const searchLower = searchTerm.toLowerCase();
    return files.filter((file) =>
      file.name.toLowerCase().includes(searchLower)
    );
  }, [files, searchTerm]);

  const handleSelectFile = (file: StorageFile) => {
    try {
      // Get the public URL and populate the field
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(file.name);
      const publicUrl = urlData.publicUrl;

      if (!publicUrl) {
        setError("Failed to get public URL for file");
        return;
      }

      // Simply populate the URL field - no download needed
      onSelectFile(publicUrl, file.name);
    } catch (err) {
      console.error("File selection error:", err);
      setError("Failed to select file");
    }
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid #fa7a20",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "800px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid #fa7a20",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 className="neon-text" style={{ margin: 0, fontSize: "1.25rem" }}>
              Select File from Storage
            </h2>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", opacity: 0.6 }}>
              Bucket: {bucket}
            </p>
          </div>
          <CustomTooltip text="Close">
            <button
              onClick={onClose}
              className="neon-btn neon-btn-danger"
              style={{
                padding: "0.5rem",
                minWidth: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiX size={20} />
            </button>
          </CustomTooltip>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "1rem", borderBottom: "1px solid rgba(250, 122, 32, 0.3)" }}>
          <div style={{ position: "relative" }}>
            <FiSearch
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#fa7a20",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              className="neon-input"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: "2.5rem",
                width: "100%",
              }}
            />
          </div>
          <div style={{ marginTop: "0.5rem", opacity: 0.7, fontSize: "0.875rem" }}>
            {filteredFiles.length} of {files.length} files
          </div>
        </div>

        {/* File List */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "1rem",
          }}
        >
          {loading ? (
            <p className="neon-text" style={{ textAlign: "center", padding: "2rem" }}>
              Loading files...
            </p>
          ) : error ? (
            <p className="neon-text danger-text" style={{ textAlign: "center", padding: "2rem" }}>
              {error}
            </p>
          ) : filteredFiles.length === 0 ? (
            <p className="neon-text" style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
              {searchTerm ? "No files found matching your search" : "No files available"}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleSelectFile(file)}
                  style={{
                    padding: "1rem",
                    border: "1px solid rgba(250, 122, 32, 0.3)",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#fa7a20";
                    e.currentTarget.style.background = "rgba(250, 122, 32, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(250, 122, 32, 0.3)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <FiFile size={24} color="#fa7a20" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="neon-text"
                      style={{
                        fontWeight: "bold",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        opacity: 0.7,
                        marginTop: "0.25rem",
                      }}
                    >
                      {formatFileSize(file.metadata?.size as number | undefined)} •{" "}
                      {formatDate(file.created_at || "")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem",
            borderTop: "1px solid #fa7a20",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button onClick={onClose} className="neon-btn neon-btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
