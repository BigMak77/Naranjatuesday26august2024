"use client";
import React, { useState } from "react";
import {
  FiUpload,
  FiFile,
  FiEye,
  FiTrash2,
  FiFileText,
  FiFilm,
  FiImage,
  FiMusic,
  FiArchive
} from "react-icons/fi";
import {
  BsFileEarmarkPdf,
  BsFileEarmarkWord,
  BsFileEarmarkExcel,
  BsFileEarmarkPpt
} from "react-icons/bs";
import TextIconButton from "@/components/ui/TextIconButtons";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import { supabase } from "@/lib/supabase-client";
import { STORAGE_BUCKETS } from "@/lib/storage-config";

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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileName: string, mimeType: string) => {
    const ext = fileName.toLowerCase().split('.').pop() || '';

    // Check by file extension first
    if (ext === 'pdf') {
      return <BsFileEarmarkPdf size={20} color="var(--accent)" />;
    }
    if (['ppt', 'pptx'].includes(ext) || mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
      return <BsFileEarmarkPpt size={20} color="var(--accent)" />;
    }
    if (['doc', 'docx'].includes(ext) || mimeType.includes("word") || mimeType.includes("document")) {
      return <BsFileEarmarkWord size={20} color="var(--accent)" />;
    }
    if (['xls', 'xlsx'].includes(ext) || mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
      return <BsFileEarmarkExcel size={20} color="var(--accent)" />;
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || mimeType.includes("video")) {
      return <FiFilm size={20} color="var(--accent)" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext) || mimeType.includes("image")) {
      return <FiImage size={20} color="var(--accent)" />;
    }
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(ext) || mimeType.includes("audio")) {
      return <FiMusic size={20} color="var(--accent)" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType.includes("zip") || mimeType.includes("compressed")) {
      return <FiArchive size={20} color="var(--accent)" />;
    }
    if (['txt', 'md', 'json', 'xml', 'csv'].includes(ext) || mimeType.includes("text")) {
      return <FiFileText size={20} color="var(--accent)" />;
    }

    // Default file icon
    return <FiFile size={20} color="var(--accent)" />;
  };

  return (
    <div className="module-file-attachments">
      <div style={{ marginBottom: "12px" }}>
        <label
          htmlFor="file-upload"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            backgroundColor: disabled ? "var(--bg-secondary)" : "var(--neon)",
            color: disabled ? "var(--text-secondary)" : "var(--bg)",
            borderRadius: "4px",
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            fontWeight: 500,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <FiUpload />
          {uploading ? "Uploading..." : "Choose Files"}
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          onChange={handleFileUpload}
          disabled={disabled || uploading}
          style={{ display: "none" }}
          accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.mp4,.mov,.avi,.jpg,.jpeg,.png,.scorm"
        />
        <span
          style={{
            marginLeft: "12px",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          {uploading
            ? uploadProgress
            : "Presentations, SCORM, PDFs, Videos, etc."}
        </span>
      </div>

      {attachments.length > 0 && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "12px",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <h4
            style={{
              color: "var(--accent)",
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
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  backgroundColor: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    {getFileIcon(attachment.name, attachment.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "var(--text)",
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
                        color: "var(--text-secondary)",
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
