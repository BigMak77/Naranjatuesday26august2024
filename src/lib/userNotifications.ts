import { supabase } from "@/lib/supabase-client";

// Add a notification to the user's notifications array
export async function addNotification(userId: string, notification: any) {
  // Fetch current notifications
  const { data, error } = await supabase
    .from("users")
    .select("notifications")
    .eq("id", userId)
    .single();

  if (error) throw error;

  const notifications = data?.notifications || [];
  notifications.push(notification);

  // Update notifications array
  const { error: updateError } = await supabase
    .from("users")
    .update({ notifications })
    .eq("id", userId);

  if (updateError) throw updateError;
}

// Get all notifications for a user
export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("notifications")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data?.notifications || [];
}

// Clear all notifications for a user
export async function clearNotifications(userId: string) {
  const { error } = await supabase
    .from("users")
    .update({ notifications: [] })
    .eq("id", userId);

  if (error) throw error;
}
