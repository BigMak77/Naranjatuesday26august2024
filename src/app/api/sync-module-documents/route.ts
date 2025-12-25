import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/sync-module-documents
 * Manually syncs document assignments for users who have module assignments.
 * When a user is assigned to a module, this ensures all documents linked to that module
 * are also assigned to the user.
 *
 * Body params:
 * - auth_id: Optional UUID - sync only for specific user
 * - module_id: Optional UUID - sync only for specific module
 * - cleanup: Optional boolean - if true, also removes orphaned document assignments
 * - If auth_id and module_id omitted, syncs all module-document assignments
 */
export async function POST(req: NextRequest) {
  try {
    const { auth_id, module_id, cleanup = false } = await req.json();

    // Call the database function to sync module document assignments
    const { data: syncData, error: syncError } = await supabase
      .rpc('sync_module_document_assignments', {
        p_auth_id: auth_id || null,
        p_module_id: module_id || null
      });

    if (syncError) {
      console.error("Sync error:", syncError);
      return NextResponse.json(
        { error: "Failed to sync module document assignments", details: syncError },
        { status: 500 }
      );
    }

    const createdCount = syncData?.length || 0;
    let removedCount = 0;
    let cleanupData = [];

    // If cleanup is requested, remove orphaned document assignments
    if (cleanup) {
      const { data: cleanupResult, error: cleanupError } = await supabase
        .rpc('cleanup_orphaned_document_assignments', {
          p_auth_id: auth_id || null
        });

      if (cleanupError) {
        console.error("Cleanup error:", cleanupError);
        // Don't fail the whole request if cleanup fails
        console.warn("Cleanup failed but sync succeeded");
      } else {
        removedCount = cleanupResult?.length || 0;
        cleanupData = cleanupResult || [];
      }
    }

    return NextResponse.json({
      success: true,
      created: createdCount,
      removed: removedCount,
      assignments: syncData || [],
      orphaned_removed: cleanupData
    });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync-module-documents
 * Returns information about which document assignments would be created
 * without actually creating them (dry-run mode).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const auth_id = searchParams.get('auth_id');
    const module_id = searchParams.get('module_id');

    // Get all module assignments that would trigger document assignments
    let query = supabase
      .from('user_assignments')
      .select(`
        auth_id,
        item_id,
        item_type,
        assigned_at,
        due_at
      `)
      .eq('item_type', 'module');

    if (auth_id) {
      query = query.eq('auth_id', auth_id);
    }
    if (module_id) {
      query = query.eq('item_id', module_id);
    }

    const { data: moduleAssignments, error: moduleError } = await query;

    if (moduleError) {
      return NextResponse.json(
        { error: "Failed to fetch module assignments", details: moduleError },
        { status: 500 }
      );
    }

    if (!moduleAssignments || moduleAssignments.length === 0) {
      return NextResponse.json({
        module_assignments: 0,
        potential_documents: 0,
        details: []
      });
    }

    // For each module assignment, get linked documents
    const details = [];
    for (const ma of moduleAssignments) {
      const { data: linkedDocs, error: docsError } = await supabase
        .from('document_modules')
        .select('document_id')
        .eq('module_id', ma.item_id);

      if (!docsError && linkedDocs) {
        for (const doc of linkedDocs) {
          // Check if assignment already exists
          const { data: existing } = await supabase
            .from('user_assignments')
            .select('id')
            .eq('auth_id', ma.auth_id)
            .eq('item_id', doc.document_id)
            .eq('item_type', 'document')
            .single();

          details.push({
            user_id: ma.auth_id,
            module_id: ma.item_id,
            document_id: doc.document_id,
            already_assigned: !!existing
          });
        }
      }
    }

    const newAssignments = details.filter(d => !d.already_assigned);

    return NextResponse.json({
      module_assignments: moduleAssignments.length,
      potential_documents: newAssignments.length,
      already_assigned: details.filter(d => d.already_assigned).length,
      details
    });
  } catch (err) {
    console.error("Preview error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
