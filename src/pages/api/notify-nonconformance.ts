// /src/pages/api/notify-nonconformance.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase-client";

// You may want to use a real email/SMS/notification service in production
// For now, this just logs and returns success

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { task_assignment_step_id, reason } = req.body;
  if (!task_assignment_step_id || !reason) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Find managers/admins to notify (example: by role in users table)
  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, access_level")
    .in("access_level", ["Manager", "Admin"]);
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Here you would send an email, SMS, or in-app notification
  // For now, just log
  console.log("Non-conformance notification:", {
    task_assignment_step_id,
    reason,
    notify: users?.map(u => u.email),
  });

  // Optionally: record a notification in a table
  // await supabase.from("notifications").insert(...)

  return res.status(200).json({ success: true });
}
