import type { Document, Section, Standard } from "@/types/document";

/**
 * Format a date string to locale date format
 */
export function formatDate(dateString: string | undefined | null, locale: string = "en-GB"): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString(locale);
  } catch {
    return "—";
  }
}

/**
 * Format a date string to locale date/time format
 */
export function formatDateTime(dateString: string | undefined | null, locale: string = "en-GB"): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString(locale);
  } catch {
    return "—";
  }
}

/**
 * Get section display name (code + title)
 */
export function getSectionDisplayName(
  sectionId: string | null | undefined,
  sections: Section[]
): string {
  if (!sectionId) return "—";
  const section = sections.find(s => s.id === sectionId);
  return section ? `${section.code} - ${section.title}` : "—";
}

/**
 * Get standard name for a section
 */
export function getStandardNameForSection(
  sectionId: string | null | undefined,
  sections: Section[],
  standards: Standard[]
): string {
  if (!sectionId) return "—";
  const section = sections.find(s => s.id === sectionId);
  if (!section?.standard_id) return "—";
  const standard = standards.find(std => std.id === section.standard_id);
  return standard?.name || "—";
}

/**
 * Filter documents by standard
 */
export function filterDocumentsByStandard(
  documents: Document[],
  filterStandardId: string,
  sections: Section[]
): Document[] {
  if (!filterStandardId) return documents;

  return documents.filter((doc) => {
    if (!doc.section_id) return false;
    const docSection = sections.find(s => s.id === doc.section_id);
    return docSection && docSection.standard_id === filterStandardId;
  });
}

/**
 * Filter documents by section
 */
export function filterDocumentsBySection(
  documents: Document[],
  filterSectionId: string
): Document[] {
  if (!filterSectionId) return documents;
  return documents.filter((doc) => doc.section_id === filterSectionId);
}

/**
 * Filter documents by type
 */
export function filterDocumentsByType(
  documents: Document[],
  filterTypeId: string
): Document[] {
  if (!filterTypeId) return documents;
  return documents.filter((doc) => doc.document_type_id === filterTypeId);
}

/**
 * Search documents by title or reference code
 */
export function searchDocuments(
  documents: Document[],
  searchQuery: string
): Document[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return documents;

  return documents.filter((doc) =>
    (doc.title || "").toLowerCase().includes(query) ||
    (doc.reference_code || "").toLowerCase().includes(query)
  );
}

/**
 * Apply all filters to documents
 */
export function applyDocumentFilters(
  documents: Document[],
  filters: {
    search?: string;
    typeId?: string;
    standardId?: string;
    sectionId?: string;
  },
  sections: Section[]
): Document[] {
  let filtered = documents;

  if (filters.search) {
    filtered = searchDocuments(filtered, filters.search);
  }

  if (filters.typeId) {
    filtered = filterDocumentsByType(filtered, filters.typeId);
  }

  if (filters.standardId) {
    filtered = filterDocumentsByStandard(filtered, filters.standardId, sections);
  }

  if (filters.sectionId) {
    filtered = filterDocumentsBySection(filtered, filters.sectionId);
  }

  return filtered;
}

/**
 * Sort documents by reference code (natural sort)
 */
export function sortDocumentsByRefCode(documents: Document[]): Document[] {
  return [...documents].sort((a, b) => {
    const aRef = a.reference_code || '';
    const bRef = b.reference_code || '';
    return aRef.localeCompare(bRef, undefined, { numeric: true, sensitivity: 'base' });
  });
}

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(str: string | null | undefined): boolean {
  return (
    !!str &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str)
  );
}

/**
 * Build reference code from parts
 */
export function buildReferenceCode(parts: {
  location?: string;
  typeCode?: string;
  sectionCode?: string;
  suffix?: string;
}): string {
  const { location, typeCode, sectionCode, suffix } = parts;

  let prefix = '';

  if (location) {
    prefix = location;

    if (typeCode) {
      prefix += `-${typeCode}`;

      if (sectionCode) {
        prefix += `-${sectionCode}`;
      }
    }
  }

  if (prefix && suffix) {
    return `${prefix}-${suffix}`;
  }

  return prefix || '';
}
