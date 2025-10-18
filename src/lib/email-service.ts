import { supabase } from "./supabase-client";

export interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  startDate: string;
  department?: string;
  role?: string;
}

/**
 * Send a welcome email to a new employee with setup instructions
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{success: boolean; error?: string}> {
  try {
    // Generate a magic link for password setup
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      data.email,
      {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          employee_number: data.employeeNumber
        }
      }
    );

    if (inviteError) {
      console.error("Error sending invite:", inviteError);
      return { success: false, error: inviteError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in sendWelcomeEmail:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome emails to multiple employees
 */
export async function sendBulkWelcomeEmails(employees: WelcomeEmailData[]): Promise<{
  successCount: number;
  failureCount: number;
  errors: { email: string; error: string }[];
}> {
  const results = {
    successCount: 0,
    failureCount: 0,
    errors: [] as { email: string; error: string }[]
  };

  // Send in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < employees.length; i += batchSize) {
    const batch = employees.slice(i, i + batchSize);

    const promises = batch.map(async (emp) => {
      const result = await sendWelcomeEmail(emp);
      if (result.success) {
        results.successCount++;
      } else {
        results.failureCount++;
        results.errors.push({ email: emp.email, error: result.error || "Unknown error" });
      }
    });

    await Promise.all(promises);

    // Small delay between batches
    if (i + batchSize < employees.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Generate a temporary password for manual account setup
 * (Use this if email invitations are not available)
 */
export function generateTemporaryPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one of each type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  password += "0123456789"[Math.floor(Math.random() * 10)];
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)];

  // Fill the rest
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
