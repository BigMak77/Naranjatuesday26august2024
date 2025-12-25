"use client";

import { useParams } from "next/navigation";
import DocumentEditForm from "@/components/documents/DocumentEditForm";

export default function EditDocumentPage() {
  const params = useParams();
  const id = params?.id ?? "";

  return <DocumentEditForm documentId={id as string} />;
}
