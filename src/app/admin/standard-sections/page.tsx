'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

type Section = {
  id: string;
  standard_name: string;
  code: string;
  title: string;
  description: string;
  parent_section_id: string | null;
};

export default function StandardSectionPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStandard, setSelectedStandard] = useState<string>('All');

  useEffect(() => {
    const fetchSections = async () => {
      const { data, error } = await supabase
        .from('standard_sections')
        .select(`
          id,
          code,
          title,
          description,
          parent_section_id,
          document_standard:standard_id (
            name
          )
        `);

      if (error) {
        console.error('Error loading sections:', error.message);
      } else {
        const formatted = data.map((item: any) => ({
          id: item.id,
          code: item.code,
          title: item.title,
          description: item.description,
          parent_section_id: item.parent_section_id,
          standard_name: item.document_standard?.name || 'Unknown',
        }));

        // Sort numerically by clause code
        formatted.sort((a, b) => {
          const aParts = a.code.split('.').map(Number);
          const bParts = b.code.split('.').map(Number);
          for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aVal = aParts[i] ?? 0;
            const bVal = bParts[i] ?? 0;
            if (aVal !== bVal) return aVal - bVal;
          }
          return 0;
        });

        setSections(formatted);
      }
      setLoading(false);
    };

    fetchSections();
  }, []);

  const standardOptions = Array.from(
    new Set(sections.map((s) => s.standard_name))
  ).sort();

  const groupedByStandard: Record<string, Section[]> = sections.reduce((acc, section) => {
    const key = section.standard_name.trim().toLowerCase();
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(section);
    return acc;
  }, {} as Record<string, Section[]>);

  return (
    <main className="standard-sections-page-wrapper">
      <h1 className="standard-sections-title">Standard Sections</h1>
      <p className="standard-sections-desc">
        Below are the structured clauses and sub-clauses for each compliance standard used in your system.
      </p>
      {/* Filter Dropdown */}
      <div className="standard-sections-filter-wrapper">
        <label className="standard-sections-filter-label">Filter by Standard</label>
        <select
          value={selectedStandard}
          onChange={(e) => setSelectedStandard(e.target.value)}
          className="standard-sections-filter-select"
        >
          <option value="All">All Standards</option>
          {standardOptions.map((std) => (
            <option key={std} value={std}>
              {std}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="standard-sections-loading">Loading sections...</p>
      ) : (
        Object.entries(groupedByStandard)
          .filter(([key]) => {
            const keyNormalized = key.trim().toLowerCase();
            const filterNormalized = selectedStandard.trim().toLowerCase();
            return selectedStandard === 'All' || keyNormalized === filterNormalized;
          })
          .map(([standardKey, items]) => {
            const sortedItems = [...items].sort((a, b) => {
              const aParts = a.code.split('.').map(Number);
              const bParts = b.code.split('.').map(Number);
              for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                const aVal = aParts[i] ?? 0;
                const bVal = bParts[i] ?? 0;
                if (aVal !== bVal) return aVal - bVal;
              }
              return 0;
            });
            return (
              <div key={standardKey} className="standard-sections-group">
                <h2 className="standard-sections-group-title">
                  {standardOptions.find((std) => std.trim().toLowerCase() === standardKey) || standardKey}
                </h2>
                <div className="standard-sections-list">
                  {sortedItems.length === 0 ? (
                    <div className="standard-sections-empty">No sections found.</div>
                  ) : (
                    sortedItems.map((section) => (
                      <div
                        key={section.id}
                        className="standard-sections-list-item"
                      >
                        <div className="standard-sections-list-code">{section.code}</div>
                        <div className="standard-sections-list-title">{section.title}</div>
                        {section.description && (
                          <div className="standard-sections-list-desc">{section.description}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
      )}
    </main>
  );
}
