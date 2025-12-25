import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Standard, Section, DocumentType } from "@/types/document";

/**
 * Shared hook to fetch document metadata (standards, sections, document types)
 * Reduces code duplication across document management pages
 */
export function useDocumentMetadata() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);

      try {
        const [standardsResult, sectionsResult, docTypesResult] = await Promise.all([
          supabase
            .from("document_standard")
            .select("id, name")
            .order("name", { ascending: true }),
          supabase
            .from("standard_sections")
            .select("id, code, title, description, parent_section_id, standard_id, ref_code"),
          supabase
            .from("document_types")
            .select("id, name, ref_code, summary")
        ]);

        if (cancelled) return;

        if (standardsResult.error) throw standardsResult.error;
        if (sectionsResult.error) throw sectionsResult.error;
        if (docTypesResult.error) throw docTypesResult.error;

        setStandards(standardsResult.data || []);
        setSections(sectionsResult.data || []);
        setDocumentTypes(docTypesResult.data || []);
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error fetching document metadata:", err);
          setError(err.message || "Failed to load metadata");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    standards,
    sections,
    documentTypes,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Re-trigger the effect by updating a dependency
    }
  };
}
