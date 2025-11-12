import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SearchResult } from "@/context/GlobalSearchContext";
import { protectAPIRoute } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
  }
);

export async function GET(req: Request) {
  // Protect this route - require authentication (any logged-in user can search)
  const authResult = await protectAPIRoute(req);
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response if not authenticated
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const searchTerm = `*${query.trim()}*`;
    const results: SearchResult[] = [];

    console.log("Search API - query:", query);
    console.log("Search API - searchTerm:", searchTerm);

    // Search Users - Try multiple approaches
    const searchPattern = `%${query.trim()}%`;

    // Approach 1: Using textSearch or multiple queries
    const { data: usersByFirstName, error: err1 } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .ilike("first_name", searchPattern)
      .limit(5);

    console.log("Search API - usersByFirstName:", usersByFirstName?.length || 0, "error:", err1);

    const { data: usersByLastName, error: err2 } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .ilike("last_name", searchPattern)
      .limit(5);

    console.log("Search API - usersByLastName:", usersByLastName?.length || 0, "error:", err2);

    const { data: usersByEmail, error: err3 } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .ilike("email", searchPattern)
      .limit(5);

    console.log("Search API - usersByEmail:", usersByEmail?.length || 0, "error:", err3);

    // Combine and deduplicate users
    const usersMap = new Map();
    [...(usersByFirstName || []), ...(usersByLastName || []), ...(usersByEmail || [])].forEach(u => {
      if (!usersMap.has(u.id)) {
        usersMap.set(u.id, u);
      }
    });

    const users = Array.from(usersMap.values()).slice(0, 5);

    console.log("Search API - users found:", users?.length || 0);

    if (users) {
      users.forEach((u) => {
        results.push({
          id: `user-${u.id}`,
          type: "user",
          title: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
          subtitle: u.email,
          url: `/admin/users?userId=${u.id}`,
        });
      });
    }

    // Search Documents (Policies)
    const { data: policiesByTitle } = await supabase
      .from("policies")
      .select("id, title, description")
      .ilike("title", searchPattern)
      .limit(5);

    const { data: policiesByDesc } = await supabase
      .from("policies")
      .select("id, title, description")
      .ilike("description", searchPattern)
      .limit(5);

    const policiesMap = new Map();
    [...(policiesByTitle || []), ...(policiesByDesc || [])].forEach(p => {
      if (!policiesMap.has(p.id)) policiesMap.set(p.id, p);
    });
    const policies = Array.from(policiesMap.values()).slice(0, 5);

    if (policies) {
      policies.forEach((p) => {
        results.push({
          id: `policy-${p.id}`,
          type: "document",
          title: p.title || "Untitled Policy",
          subtitle: p.description || "Policy",
          url: `/policies/${p.id}`,
        });
      });
    }

    // Search Work Instructions
    const { data: wiByTitle } = await supabase
      .from("work_instructions")
      .select("id, title, description")
      .ilike("title", searchPattern)
      .limit(5);

    const { data: wiByDesc } = await supabase
      .from("work_instructions")
      .select("id, title, description")
      .ilike("description", searchPattern)
      .limit(5);

    const wiMap = new Map();
    [...(wiByTitle || []), ...(wiByDesc || [])].forEach(w => {
      if (!wiMap.has(w.id)) wiMap.set(w.id, w);
    });
    const workInstructions = Array.from(wiMap.values()).slice(0, 5);

    if (workInstructions) {
      workInstructions.forEach((wi) => {
        results.push({
          id: `work-instruction-${wi.id}`,
          type: "document",
          title: wi.title || "Untitled Work Instruction",
          subtitle: wi.description || "Work Instruction",
          url: `/work-instructions/${wi.id}`,
        });
      });
    }

    // Search Training Modules
    const { data: modulesByTitle } = await supabase
      .from("training_modules")
      .select("id, title, description")
      .ilike("title", searchPattern)
      .limit(5);

    const { data: modulesByDesc } = await supabase
      .from("training_modules")
      .select("id, title, description")
      .ilike("description", searchPattern)
      .limit(5);

    const modulesMap = new Map();
    [...(modulesByTitle || []), ...(modulesByDesc || [])].forEach(m => {
      if (!modulesMap.has(m.id)) modulesMap.set(m.id, m);
    });
    const modules = Array.from(modulesMap.values()).slice(0, 5);

    if (modules) {
      modules.forEach((m) => {
        results.push({
          id: `module-${m.id}`,
          type: "training",
          title: m.title || "Untitled Module",
          subtitle: m.description || "Training Module",
          url: `/training/modules/${m.id}`,
        });
      });
    }

    // Search Issues
    const { data: issuesByTitle } = await supabase
      .from("issues")
      .select("id, title, description, status")
      .ilike("title", searchPattern)
      .limit(5);

    const { data: issuesByDesc } = await supabase
      .from("issues")
      .select("id, title, description, status")
      .ilike("description", searchPattern)
      .limit(5);

    const issuesMap = new Map();
    [...(issuesByTitle || []), ...(issuesByDesc || [])].forEach(i => {
      if (!issuesMap.has(i.id)) issuesMap.set(i.id, i);
    });
    const issues = Array.from(issuesMap.values()).slice(0, 5);

    if (issues) {
      issues.forEach((i) => {
        results.push({
          id: `issue-${i.id}`,
          type: "issue",
          title: i.title || "Untitled Issue",
          subtitle: `Status: ${i.status || "Unknown"}`,
          url: `/issues/${i.id}`,
        });
      });
    }

    // Search Audits
    const { data: auditsByTitle } = await supabase
      .from("audits")
      .select("id, title, audit_type, status")
      .ilike("title", searchPattern)
      .limit(5);

    const { data: auditsByType } = await supabase
      .from("audits")
      .select("id, title, audit_type, status")
      .ilike("audit_type", searchPattern)
      .limit(5);

    const auditsMap = new Map();
    [...(auditsByTitle || []), ...(auditsByType || [])].forEach(a => {
      if (!auditsMap.has(a.id)) auditsMap.set(a.id, a);
    });
    const audits = Array.from(auditsMap.values()).slice(0, 5);

    if (audits) {
      audits.forEach((a) => {
        results.push({
          id: `audit-${a.id}`,
          type: "audit",
          title: a.title || "Untitled Audit",
          subtitle: `${a.audit_type || "Audit"} - ${a.status || "Unknown"}`,
          url: `/audits/${a.id}`,
        });
      });
    }

    // Search Departments
    const { data: deptsByName } = await supabase
      .from("departments")
      .select("id, name, description")
      .ilike("name", searchPattern)
      .limit(5);

    const { data: deptsByDesc } = await supabase
      .from("departments")
      .select("id, name, description")
      .ilike("description", searchPattern)
      .limit(5);

    const deptsMap = new Map();
    [...(deptsByName || []), ...(deptsByDesc || [])].forEach(d => {
      if (!deptsMap.has(d.id)) deptsMap.set(d.id, d);
    });
    const departments = Array.from(deptsMap.values()).slice(0, 5);

    if (departments) {
      departments.forEach((d) => {
        results.push({
          id: `department-${d.id}`,
          type: "department",
          title: d.name || "Untitled Department",
          subtitle: d.description || "Department",
          url: `/departments/${d.id}`,
        });
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
