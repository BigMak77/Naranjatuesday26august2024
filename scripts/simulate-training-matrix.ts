/**
 * Simulate exactly what TrainingMatrix.tsx does to diagnose the UI issue
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use ANON client - exactly like the UI
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to fetch all rows from a table (bypassing 1000 row limit)
async function fetchAllRows<T>(
  tableName: string,
  selectQuery: string,
  orderBy?: { column: string; ascending: boolean }
): Promise<{ data: T[] | null; error: any }> {
  const allData: T[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    let query = supabase
      .from(tableName)
      .select(selectQuery)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    if (!data || data.length === 0) break;

    allData.push(...(data as T[]));

    if (data.length < pageSize) break;
    page++;
  }

  return { data: allData, error: null };
}

async function simulate() {
  console.log('🔍 SIMULATING TRAINING MATRIX DATA FETCH (WITH PAGINATION FIX)\n');
  console.log('Using anonymous client (same as UI)\n');

  // Fetch data exactly like TrainingMatrix.tsx does with pagination
  const [
    usersRes,
    modulesRes,
    assignmentsRes,
    departmentsRes,
    rolesRes,
    documentsRes,
    roleAssignmentsRes,
    departmentAssignmentsRes,
  ] = await Promise.all([
    fetchAllRows("users", "auth_id, first_name, last_name, department_id, role_id"),
    fetchAllRows("modules", "id, name", { column: "name", ascending: true }),
    fetchAllRows("user_assignments", "auth_id, item_id, item_type, completed_at"),
    fetchAllRows("departments", "id, name", { column: "name", ascending: true }),
    fetchAllRows("roles", "id, title, department_id", { column: "title", ascending: true }),
    fetchAllRows("documents", "id, title", { column: "title", ascending: true }),
    fetchAllRows("role_assignments", "role_id, item_id, type"),
    fetchAllRows("department_assignments", "department_id, item_id, type"),
  ]);

  // Check for errors (lines 89-96)
  console.log('═'.repeat(60));
  console.log('QUERY RESULTS');
  console.log('═'.repeat(60));

  if (usersRes.error) console.error("❌ Users query failed:", usersRes.error);
  else console.log(`✅ Users: ${usersRes.data?.length} fetched`);

  if (modulesRes.error) console.error("❌ Modules query failed:", modulesRes.error);
  else console.log(`✅ Modules: ${modulesRes.data?.length} fetched`);

  if (assignmentsRes.error) console.error("❌ Assignments query failed:", assignmentsRes.error);
  else console.log(`✅ User Assignments: ${assignmentsRes.data?.length} fetched`);

  if (departmentsRes.error) console.error("❌ Departments query failed:", departmentsRes.error);
  else console.log(`✅ Departments: ${departmentsRes.data?.length} fetched`);

  if (rolesRes.error) console.error("❌ Roles query failed:", rolesRes.error);
  else console.log(`✅ Roles: ${rolesRes.data?.length} fetched`);

  if (documentsRes.error) console.error("❌ Documents query failed:", documentsRes.error);
  else console.log(`✅ Documents: ${documentsRes.data?.length} fetched`);

  if (roleAssignmentsRes.error) console.error("❌ Role assignments query failed:", roleAssignmentsRes.error);
  else console.log(`✅ Role Assignments: ${roleAssignmentsRes.data?.length} fetched`);

  if (departmentAssignmentsRes.error) console.error("❌ Department assignments query failed:", departmentAssignmentsRes.error);
  else console.log(`✅ Department Assignments: ${departmentAssignmentsRes.data?.length} fetched`);

  // Find Gail Cue
  console.log('\n' + '═'.repeat(60));
  console.log('GAIL CUE SPECIFIC ANALYSIS');
  console.log('═'.repeat(60));

  const gail = usersRes.data?.find(u =>
    u.first_name === 'Gail' && u.last_name === 'Cue'
  );

  if (!gail) {
    console.log('❌ Gail Cue not found in users query!');
    return;
  }

  console.log(`✅ Found Gail Cue:`);
  console.log(`   auth_id: ${gail.auth_id}`);
  console.log(`   role_id: ${gail.role_id}`);
  console.log(`   department_id: ${gail.department_id}`);

  // Find Gail's assignments in the data
  const gailAssignments = assignmentsRes.data?.filter(a =>
    a.auth_id === gail.auth_id
  ) || [];

  console.log(`\n📋 Gail's assignments in user_assignments query: ${gailAssignments.length}`);

  if (gailAssignments.length > 0) {
    console.log('\nAssignment details:');
    gailAssignments.forEach((a, idx) => {
      console.log(`  ${idx + 1}. item_id: ${a.item_id}, type: ${a.item_type}, completed: ${a.completed_at ? 'YES' : 'NO'}`);
    });
  } else {
    console.log('⚠️  NO ASSIGNMENTS FOUND for Gail Cue in the query results!');
    console.log('\nThis means either:');
    console.log('1. RLS policy is filtering out Gail\'s assignments');
    console.log('2. The query is not returning all data');
    console.log('3. There\'s a data consistency issue');
  }

  // Build assignment map exactly like the UI does (lines 213-219)
  console.log('\n' + '═'.repeat(60));
  console.log('ASSIGNMENT MAP (how UI builds it)');
  console.log('═'.repeat(60));

  const assignmentMap = new Map<string, any>();
  for (const a of assignmentsRes.data || []) {
    if (!a.auth_id || !a.item_id) continue; // skip bad rows
    assignmentMap.set(`${a.auth_id}|${a.item_id}|${a.item_type}`, a);
  }

  console.log(`\nTotal entries in assignment map: ${assignmentMap.size}`);

  // Check what keys exist for Gail
  const gailKeys: string[] = [];
  for (const [key, value] of assignmentMap.entries()) {
    if (key.startsWith(`${gail.auth_id}|`)) {
      gailKeys.push(key);
    }
  }

  console.log(`\nGail Cue's entries in assignment map: ${gailKeys.length}`);
  if (gailKeys.length > 0) {
    console.log('\nKeys:');
    gailKeys.forEach(key => console.log(`  ${key}`));
  } else {
    console.log('⚠️  NO KEYS FOUND for Gail in assignment map!');
  }

  // Simulate cell rendering for Gail + first few modules
  console.log('\n' + '═'.repeat(60));
  console.log('SIMULATED CELL RENDERING');
  console.log('═'.repeat(60));

  const modules = modulesRes.data?.slice(0, 5) || [];
  console.log(`\nChecking first ${modules.length} modules for Gail Cue:\n`);

  modules.forEach(module => {
    const aKey = gail.auth_id && module.id
      ? `${gail.auth_id}|${module.id}|module`
      : null;
    const a = aKey ? assignmentMap.get(aKey) : undefined;

    let cellStatus = "unassigned";
    let cellContent = "";

    if (a) {
      if (a.completed_at) {
        cellStatus = "complete";
        const d = new Date(a.completed_at);
        cellContent = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
      } else {
        cellStatus = "incomplete";
        cellContent = "NO";
      }
    }

    const icon = cellStatus === "complete" ? "✅" : cellStatus === "incomplete" ? "❌" : "⚪";
    console.log(`${icon} ${module.name}: ${cellStatus} ${cellContent ? `(${cellContent})` : ''}`);
  });

  console.log('\n' + '═'.repeat(60));
  console.log('DIAGNOSIS');
  console.log('═'.repeat(60));

  if (gailAssignments.length === 0) {
    console.log('\n❌ PROBLEM: user_assignments query returns 0 rows for Gail');
    console.log('\nPossible causes:');
    console.log('1. RLS policy is filtering rows based on authenticated user');
    console.log('2. Anonymous client doesn\'t have permission to see assignments');
    console.log('3. Query is missing a .select() parameter');
    console.log('\n💡 SOLUTION: Check RLS policies on user_assignments table');
  } else {
    console.log('\n✅ Data is being fetched correctly');
    console.log('The UI should be showing Gail\'s assignments properly.');
  }
}

simulate();
