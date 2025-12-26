"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import ContentHeader from "@/components/ui/ContentHeader";
import OverlayDialog from "@/components/ui/OverlayDialog";
import SuccessModal from "@/components/ui/SuccessModal";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiUpload, FiDownload } from "react-icons/fi";
import Image from "next/image";

/**
 * TrainingUpload Component
 *
 * Enables supadmin and admin users to bulk upload training completions via CSV.
 *
 * Features:
 * - Download CSV template with current incomplete user_assignments
 * - Upload CSV with completed_at dates to mark training as complete
 * - Updates both user_assignments and training_logs tables
 * - Supports date formats: YYYY-MM-DD or DD/MM/YYYY
 * - Batch processing with detailed error reporting
 */

type ImportResult = {
  open: boolean;
  success: number;
  errors: number;
  errorDetails: string[];
};

export default function TrainingUpload() {
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [resultModal, setResultModal] = useState<ImportResult>({
    open: false,
    success: 0,
    errors: 0,
    errorDetails: [],
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Fetch all records from a table with pagination
   * Supabase has a default limit of 1000 records, so we need to paginate
   */
  const fetchAllRecords = async <T,>(
    table: string,
    selectQuery: string,
    filters?: { column: string; value: any; operator?: string }[]
  ): Promise<T[]> => {
    const pageSize = 1000;
    let allRecords: T[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from(table)
        .select(selectQuery)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Apply filters if provided
      if (filters) {
        filters.forEach(filter => {
          if (filter.operator === 'is') {
            query = query.is(filter.column, filter.value);
          } else if (filter.operator === 'order') {
            query = query.order(filter.column, filter.value);
          }
        });
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching from ${table}:`, error);
        throw error;
      }

      if (data && data.length > 0) {
        allRecords = [...allRecords, ...(data as T[])];
        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    return allRecords;
  };

  // Helper function to parse CSV properly (handles quoted fields)
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  /**
   * Download CSV template with current incomplete training assignments
   */
  const downloadTemplate = async () => {
    try {
      setBusy(true);

      console.log('📥 Fetching all incomplete user assignments...');

      // Fetch ALL incomplete user assignments (completed_at is NULL) with pagination
      const userAssignments = await fetchAllRecords<{
        id: string;
        auth_id: string;
        item_id: string;
        item_type: string;
        assigned_at: string;
        completed_at: string | null;
      }>(
        "user_assignments",
        "id, auth_id, item_id, item_type, assigned_at, completed_at",
        [
          { column: "completed_at", value: null, operator: "is" },
          { column: "assigned_at", value: { ascending: false }, operator: "order" }
        ]
      );

      console.log(`✅ Fetched ${userAssignments.length} incomplete assignments`);

      // Get ALL user details with pagination
      const users = await fetchAllRecords<{
        id: string;
        auth_id: string;
        first_name: string;
        last_name: string;
        email: string;
        department_id: string;
      }>(
        "users",
        "id, auth_id, first_name, last_name, email, department_id"
      );

      console.log(`✅ Fetched ${users.length} users`);

      // Get ALL modules with pagination
      const modulesList = await fetchAllRecords<{
        id: string;
        name: string;
      }>(
        "modules",
        "id, name"
      );

      console.log(`✅ Fetched ${modulesList.length} modules`);

      // Get ALL documents with pagination
      const documents = await fetchAllRecords<{
        id: string;
        title: string;
      }>(
        "documents",
        "id, title"
      );

      console.log(`✅ Fetched ${documents.length} documents`);

      // Create lookup maps
      const userMap = new Map(users?.map(u => [u.auth_id, u]) || []);
      const moduleMap = new Map(modulesList?.map(m => [m.id, m]) || []);
      const documentMap = new Map(documents?.map(d => [d.id, d]) || []);

      // Prepare CSV data
      const csvData = (userAssignments || []).map(assignment => {
        const user = userMap.get(assignment.auth_id);
        const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
        const userEmail = user?.email || '';

        let itemName = '';
        if (assignment.item_type === 'module') {
          itemName = moduleMap.get(assignment.item_id)?.name || `Module ${assignment.item_id}`;
        } else if (assignment.item_type === 'document') {
          itemName = documentMap.get(assignment.item_id)?.title || `Document ${assignment.item_id}`;
        }

        // Format dates as YYYY-MM-DD for consistency
        const formatDateYYYYMMDD = (dateString: string | null) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        return {
          assignment_id: assignment.id,
          user_auth_id: assignment.auth_id,
          user_name: userName,
          user_email: userEmail,
          item_type: assignment.item_type,
          item_id: assignment.item_id,
          item_name: itemName,
          assigned_at: formatDateYYYYMMDD(assignment.assigned_at),
          completed_at: '', // Fill this in to mark as complete (YYYY-MM-DD format)
        };
      });

      // Convert to CSV
      if (csvData.length === 0) {
        alert("No incomplete user assignments found to export");
        return;
      }

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row =>
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `training_upload_template_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      setSuccessMessage(`Successfully exported ${csvData.length} incomplete assignment${csvData.length !== 1 ? 's' : ''} to CSV`);
      setShowSuccessModal(true);

    } catch (error) {
      console.error("Error downloading CSV:", error);
      setResultModal({
        open: true,
        success: 0,
        errors: 1,
        errorDetails: ['Failed to download CSV template. Please try again.'],
      });
    } finally {
      setBusy(false);
    }
  };

  /**
   * Upload and process CSV file to mark training as complete
   */
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    try {
      setBusy(true);
      setUploading(true);
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('CSV file appears to be empty or invalid');
        return;
      }

      // Remove BOM if present and parse headers
      const firstLine = lines[0].replace(/^\uFEFF/, ''); // Remove BOM
      const headers = parseCSVLine(firstLine).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const dataRows = lines.slice(1);

      console.log('Parsed headers:', headers);

      // Validate headers - only assignment_id is required
      const requiredHeaders = ['assignment_id'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        alert(`Missing required headers: ${missingHeaders.join(', ')}`);
        return;
      }

      console.log('Processing', dataRows.length, 'data rows');

      // Check if completed_at column exists
      if (!headers.includes('completed_at')) {
        setResultModal({
          open: true,
          success: 0,
          errors: 1,
          errorDetails: ['CSV is missing the "completed_at" column. Please ensure your CSV has this column header.'],
        });
        return;
      }

      const updates = [];
      const errors = [];

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = parseCSVLine(dataRows[i]);
          const rowData: any = {};

          headers.forEach((header, index) => {
            rowData[header] = row[index]?.trim() || '';
          });

          console.log(`Row ${i + 1} data:`, rowData);

          // Process row if assignment_id exists
          if (!rowData.assignment_id || rowData.assignment_id === '') {
            console.log(`Row ${i + 1}: Skipped - no assignment_id`);
            continue;
          }

          const updateData: any = {};

          // Check for completed_at column value
          const dateValue = rowData.completed_at || '';

          if (dateValue && dateValue !== '') {
            // Parse date - support multiple formats
            let parsedDate: Date | null = null;

            // Format 1: YYYY-MM-DD or ISO timestamp
            const isoRegex = /^\d{4}-\d{2}-\d{2}/;
            if (isoRegex.test(dateValue)) {
              parsedDate = dateValue.includes('T')
                ? new Date(dateValue)
                : new Date(dateValue + 'T00:00:00Z');
            }
            // Format 2: DD/MM/YYYY (common UK/AU format)
            else {
              const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
              const match = dateValue.match(ddmmyyyyRegex);
              if (match) {
                const day = parseInt(match[1], 10);
                const month = parseInt(match[2], 10);
                const year = parseInt(match[3], 10);

                // Validate day and month ranges
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                  // Create ISO date string (month is 0-indexed in Date constructor)
                  const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00Z`;
                  parsedDate = new Date(isoString);
                } else {
                  errors.push(`Row ${i + 2}: Invalid date "${dateValue}". Day must be 1-31, month must be 1-12.`);
                  continue;
                }
              }
            }

            if (parsedDate && !isNaN(parsedDate.getTime())) {
              updateData.completed_at = parsedDate.toISOString();
              console.log(`Row ${i + 1}: Will update assignment ${rowData.assignment_id} with completed_at = ${updateData.completed_at}`);
            } else {
              errors.push(`Row ${i + 2}: Invalid date format "${dateValue}". Use YYYY-MM-DD or DD/MM/YYYY format.`);
              continue;
            }
          } else {
            // No date provided - skip this row silently
            console.log(`Row ${i + 1}: Skipped - no completed_at date provided`);
            continue;
          }

          if (Object.keys(updateData).length > 0) {
            updates.push({
              id: rowData.assignment_id,
              ...updateData
            });
          }
        } catch (rowError) {
          console.error(`Error processing row ${i + 1}:`, rowError);
          errors.push(`Row ${i + 2}: Error parsing row - ${rowError}`);
        }
      }

      if (errors.length > 0) {
        setResultModal({
          open: true,
          success: 0,
          errors: errors.length,
          errorDetails: errors,
        });
        return;
      }

      if (updates.length === 0) {
        alert('No rows with completed_at dates found to update');
        return;
      }

      console.log(`Found ${updates.length} valid updates to process`);

      // Set initial progress
      setUploadProgress({ current: 0, total: updates.length });

      // Process updates in batches
      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;
      const errorDetails: string[] = [];

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        for (const update of batch) {
          const { id, ...updateData } = update;
          console.log(`[CSV Import] Updating assignment ${id} with:`, updateData);

          // First, fetch the assignment details to get auth_id and item_id for training_logs
          const { data: assignmentData, error: fetchError } = await supabase
            .from("user_assignments")
            .select("auth_id, item_id, item_type")
            .eq("id", id)
            .single();

          if (fetchError) {
            console.error(`[CSV Import] ❌ Error fetching assignment ${id}:`, fetchError);
            errorDetails.push(`${id.substring(0, 8)}: ${fetchError.message}`);
            errorCount++;
            // Update progress even on error
            setUploadProgress({ current: successCount + errorCount, total: updates.length });
            continue;
          }

          // Update the assignment
          const { data, error } = await supabase
            .from("user_assignments")
            .update(updateData)
            .eq("id", id)
            .select();

          if (error) {
            console.error(`[CSV Import] ❌ Error updating assignment ${id}:`, error);
            errorDetails.push(`${id.substring(0, 8)}: ${error.message}`);
            errorCount++;
            // Update progress on error
            setUploadProgress({ current: successCount + errorCount, total: updates.length });
          } else {
            console.log(`[CSV Import] ✅ Successfully updated assignment ${id}`, data);
            successCount++;
            // Update progress on success
            setUploadProgress({ current: successCount + errorCount, total: updates.length });

            // Insert into training_logs for completion tracking
            if (assignmentData && updateData.completed_at) {
              const trainingDate = updateData.completed_at.split('T')[0];
              const trainingTime = new Date(updateData.completed_at).toTimeString().split(' ')[0];

              // Check if a log entry already exists to avoid duplicates
              const { data: existingLog } = await supabase
                .from("training_logs")
                .select("id")
                .eq("auth_id", assignmentData.auth_id)
                .eq("topic", assignmentData.item_id)
                .eq("date", trainingDate)
                .maybeSingle();

              if (!existingLog) {
                const { error: logError } = await supabase
                  .from("training_logs")
                  .insert([{
                    auth_id: assignmentData.auth_id,
                    date: trainingDate,
                    topic: assignmentData.item_id,
                    duration_hours: 1,
                    outcome: 'completed',
                    notes: `Bulk uploaded from CSV`,
                    signature: null,
                    trainer_signature: null,
                    time: trainingTime
                  }]);

                if (logError) {
                  console.warn(`[CSV Import] ⚠️ Failed to insert training log for ${id} (non-critical):`, logError.message);
                } else {
                  console.log(`[CSV Import] ✅ Training log created for ${id}`);
                }
              } else {
                console.log(`[CSV Import] ℹ️ Training log already exists for ${id} - skipping duplicate`);
              }
            }
          }
        }
      }

      console.log(`[CSV Import] Final results: ${successCount} success, ${errorCount} errors`);

      // Show appropriate modal based on results
      if (errorCount === 0 && successCount > 0) {
        // Success only - use SuccessModal
        setSuccessMessage(`Successfully updated ${successCount} training assignment${successCount !== 1 ? 's' : ''}`);
        setShowSuccessModal(true);
      } else {
        // Has errors - use detailed results modal
        setResultModal({
          open: true,
          success: successCount,
          errors: errorCount,
          errorDetails: errorDetails,
        });
      }

      // Clear the file input
      event.target.value = '';

    } catch (error) {
      console.error("Error processing CSV:", error);
      setResultModal({
        open: true,
        success: 0,
        errors: 1,
        errorDetails: [`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      });
    } finally {
      setBusy(false);
      setUploading(false);
      // Reset progress
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <>
      {/* CSV Upload Loading Overlay */}
      {uploading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            gap: '1.5rem'
          }}
        >
          <style jsx>{`
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
            .spinning-logo {
              animation: spin 2s linear infinite;
            }
          `}</style>
          <Image
            src="/landing page image.png"
            alt="Loading"
            width={120}
            height={120}
            className="spinning-logo"
            unoptimized
          />
          <div style={{ color: 'var(--neon)', fontSize: '1.25rem', fontWeight: 600 }}>
            Processing CSV Upload...
          </div>
          {uploadProgress.total > 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-primary)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--neon)', marginBottom: '0.5rem' }}>
                {uploadProgress.current} / {uploadProgress.total}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                {Math.round((uploadProgress.current / uploadProgress.total) * 100)}% Complete
              </div>
              <div
                style={{
                  width: '300px',
                  height: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  marginTop: '1rem',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    backgroundColor: 'var(--neon)',
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <ContentHeader
        title="Bulk Training Upload"
        description="Download template, fill in completion dates, and upload to mark training as complete"
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          {/* Instructions Card */}
          <div className="neon-panel p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--neon)' }}>
              How to Use Bulk Training Upload
            </h2>
            <ol className="space-y-3 list-decimal list-inside opacity-90">
              <li className="text-sm">
                <strong>Download Template:</strong> Click the &quot;Download Template&quot; button to get a CSV file containing all incomplete training assignments.
              </li>
              <li className="text-sm">
                <strong>Fill in Completion Dates:</strong> Open the CSV in Excel or a text editor and fill in the <code className="bg-black/30 px-1 rounded">completed_at</code> column with completion dates (YYYY-MM-DD or DD/MM/YYYY format).
              </li>
              <li className="text-sm">
                <strong>Upload CSV:</strong> Click the &quot;Upload CSV&quot; button and select your updated file.
              </li>
              <li className="text-sm">
                <strong>Review Results:</strong> The system will update <code className="bg-black/30 px-1 rounded">user_assignments</code> and <code className="bg-black/30 px-1 rounded">training_logs</code> tables automatically.
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <TextIconButton
                variant="download"
                icon={<FiDownload />}
                label="Download Template"
                onClick={downloadTemplate}
                disabled={busy}
              />
            </div>

            <div className="flex-1">
              <TextIconButton
                variant="upload"
                icon={<FiUpload />}
                label="Upload CSV"
                onClick={() => document.getElementById('csv-upload')?.click()}
                disabled={busy}
              />
            </div>
          </div>

          {/* Hidden file input for CSV upload */}
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleCSVUpload}
          />

          {/* Information Panel */}
          <div className="neon-panel p-6 bg-blue-900/10">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--neon)' }}>
              Important Notes
            </h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li>• Only rows with a valid <code className="bg-black/30 px-1 rounded">completed_at</code> date will be processed</li>
              <li>• Date formats supported: YYYY-MM-DD or DD/MM/YYYY</li>
              <li>• The system automatically creates training log entries for each completion</li>
              <li>• Duplicate training logs are prevented automatically</li>
              <li>• Processing is done in batches of 50 for optimal performance</li>
              <li>• All changes are logged to both <code className="bg-black/30 px-1 rounded">user_assignments</code> and <code className="bg-black/30 px-1 rounded">training_logs</code> tables</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CSV Import Result Modal */}
      <OverlayDialog
        open={resultModal.open}
        onClose={() => setResultModal({ ...resultModal, open: false })}
        width={700}
        showCloseButton
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--neon)' }}>
          CSV Import Results
        </h2>

        <div className="space-y-4">
          {/* Success Count */}
          {resultModal.success > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#14532d', border: '1px solid #16a34a' }}>
              <span style={{ fontSize: '24px' }}>✅</span>
              <div>
                <div className="font-semibold" style={{ color: '#22c55e' }}>
                  {resultModal.success} assignment{resultModal.success !== 1 ? 's' : ''} updated successfully
                </div>
              </div>
            </div>
          )}

          {/* Error Count */}
          {resultModal.errors > 0 && (
            <div className="p-3 rounded-lg" style={{ background: '#7f1d1d', border: '1px solid #dc2626' }}>
              <div className="flex items-center gap-3 mb-2">
                <span style={{ fontSize: '24px' }}>❌</span>
                <div className="font-semibold" style={{ color: '#ef4444' }}>
                  {resultModal.errors} error{resultModal.errors !== 1 ? 's' : ''} occurred
                </div>
              </div>
              {resultModal.errorDetails.length > 0 && (
                <div className="ml-10 mt-2 space-y-1">
                  {resultModal.errorDetails.slice(0, 5).map((error, idx) => (
                    <div key={idx} className="text-sm opacity-90" style={{ color: '#fca5a5' }}>
                      • {error}
                    </div>
                  ))}
                  {resultModal.errorDetails.length > 5 && (
                    <div className="text-sm opacity-75 italic" style={{ color: '#fca5a5' }}>
                      ...and {resultModal.errorDetails.length - 5} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </OverlayDialog>

      {/* Success Modal - for successful uploads with no errors */}
      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Upload Successful"
        message={successMessage}
        autoCloseMs={3000}
      />
    </>
  );
}
