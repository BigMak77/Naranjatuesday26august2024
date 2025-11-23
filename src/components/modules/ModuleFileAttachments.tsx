"use client";
import React, { useState } from "react";
import {
  FiSearch,
  FiEye,
  FiTrash2,
} from "react-icons/fi";
import TextIconButton from "@/components/ui/TextIconButtons";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import { supabase } from "@/lib/supabase-client";
import { STORAGE_BUCKETS } from "@/lib/storage-config";
import { getFileIcon, formatFileSize } from "@/lib/file-utils";

export interface ModuleAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
}

interface ModuleFileAttachmentsProps {
  attachments: ModuleAttachment[];
  onChange: (attachments: ModuleAttachment[]) => void;
  disabled?: boolean;
}

export default function ModuleFileAttachments({
  attachments,
  onChange,
  disabled = false,
}: ModuleFileAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newAttachments: ModuleAttachment[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`);

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `training-modules/${timestamp}_${safeName}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.MODULES)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKETS.MODULES).getPublicUrl(filePath);

        // Create attachment object
        const attachment: ModuleAttachment = {
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type,
          uploaded_at: new Date().toISOString(),
        };

        newAttachments.push(attachment);
      }

      // Update attachments list
      onChange([...attachments, ...newAttachments]);
      setUploadProgress("");
    } catch (error) {
      console.error("Error uploading files:", error);
      alert(error instanceof Error ? error.message : "Failed to upload files");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onChange(newAttachments);
  };

  const handleViewFile = (attachment: ModuleAttachment) => {
    // Open the file in a new tab for viewing/playing
    // The browser will handle PDFs, videos, images, etc. natively
    window.open(attachment.url, '_blank');
  };

  return (
    <div className="module-file-attachments">
      <div
        className="neon-input"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 12px",
          minHeight: "40px"
        }}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          onChange={handleFileUpload}
          disabled={disabled || uploading}
          style={{ display: "none" }}
          accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.mp4,.mov,.avi,.jpg,.jpeg,.png,.scorm"
        />
        <label htmlFor="file-upload">
          <TextIconButton
            variant="add"
            icon={<FiSearch size={16} />}
            label={uploading ? "Uploading..." : "Choose Files"}
            disabled={disabled || uploading}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("file-upload")?.click();
            }}
          />
        </label>
        {uploading && (
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
            }}
          >
            {uploadProgress}
          </span>
        )}
      </div>

      {attachments.length > 0 && (
        <div
          style={{
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            padding: "12px",
            backgroundColor: "#fa7a20",
            marginTop: "8px"
          }}
        >
          <h4
            style={{
              color: "var(--text-white)",
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Attached Files ({attachments.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.name}-${attachment.size}-${attachment.uploaded_at}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "4px",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    {getFileIcon(attachment.name, attachment.type, 20)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "var(--text-white)",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {attachment.name}
                    </div>
                    <div
                      style={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {formatFileSize(attachment.size)} •{" "}
                      {new Date(attachment.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <CustomTooltip text="View file">
                    <TextIconButton
                      variant="edit"
                      icon={<FiEye size={14} />}
                      label="View"
                      onClick={() => handleViewFile(attachment)}
                    />
                  </CustomTooltip>
                  {!disabled && (
                    <CustomTooltip text="Remove file">
                      <TextIconButton
                        variant="delete"
                        icon={<FiTrash2 size={14} />}
                        label="Remove"
                        onClick={() => handleRemoveAttachment(index)}
                      />
                    </CustomTooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .module-file-attachments {
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
