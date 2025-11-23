import {
  FiFile,
  FiFileText,
  FiFilm,
  FiImage,
  FiMusic,
  FiArchive,
} from "react-icons/fi";
import {
  BsFileEarmarkPdf,
  BsFileEarmarkWord,
  BsFileEarmarkExcel,
  BsFileEarmarkPpt,
} from "react-icons/bs";

/**
 * Returns an appropriate icon component for a given file based on its name and MIME type
 * @param fileName - The name of the file including extension
 * @param mimeType - The MIME type of the file
 * @param size - The size of the icon in pixels (default: 16)
 * @returns A React icon component
 */
export function getFileIcon(
  fileName: string,
  mimeType: string,
  size: number = 16
) {
  const ext = fileName.toLowerCase().split(".").pop() || "";
  const color = "var(--accent)";

  // PDF files
  if (ext === "pdf") {
    return <BsFileEarmarkPdf size={size} color={color} />;
  }

  // Presentation files
  if (
    ["ppt", "pptx"].includes(ext) ||
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint")
  ) {
    return <BsFileEarmarkPpt size={size} color={color} />;
  }

  // Word documents
  if (
    ["doc", "docx"].includes(ext) ||
    mimeType.includes("word") ||
    mimeType.includes("document")
  ) {
    return <BsFileEarmarkWord size={size} color={color} />;
  }

  // Excel spreadsheets
  if (
    ["xls", "xlsx"].includes(ext) ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel")
  ) {
    return <BsFileEarmarkExcel size={size} color={color} />;
  }

  // Video files
  if (
    ["mp4", "mov", "avi", "mkv", "webm"].includes(ext) ||
    mimeType.includes("video")
  ) {
    return <FiFilm size={size} color={color} />;
  }

  // Image files
  if (
    ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext) ||
    mimeType.includes("image")
  ) {
    return <FiImage size={size} color={color} />;
  }

  // Audio files
  if (
    ["mp3", "wav", "ogg", "aac", "m4a", "flac"].includes(ext) ||
    mimeType.includes("audio")
  ) {
    return <FiMusic size={size} color={color} />;
  }

  // Archive files
  if (
    ["zip", "rar", "7z", "tar", "gz"].includes(ext) ||
    mimeType.includes("zip") ||
    mimeType.includes("compressed")
  ) {
    return <FiArchive size={size} color={color} />;
  }

  // Text files
  if (
    ["txt", "md", "json", "xml", "csv"].includes(ext) ||
    mimeType.includes("text")
  ) {
    return <FiFileText size={size} color={color} />;
  }

  // Default file icon
  return <FiFile size={size} color={color} />;
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - The file size in bytes
 * @returns A formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
