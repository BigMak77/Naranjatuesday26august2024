// API Authentication Helper
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { AccessLevel } from "./permissions";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthenticatedUser {
  id: string;
  auth_id: string;
  email: string;
  access_level: AccessLevel;
  first_name?: string;
  last_name?: string;
}

/**
 * Authenticates a request and returns the user if authenticated
 * @param req The Next.js request object
 * @returns The authenticated user or null if not authenticated
 */
export async function authenticateRequest(
  req: Request
): Promise<AuthenticatedUser | null> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    // Create a Supabase client using the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Get the currently logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Get user details from users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, auth_id, email, access_level, first_name, last_name")
      .eq("auth_id", user.id)
      .single();

    if (profileError || !userProfile) {
      return null;
    }

    return userProfile as AuthenticatedUser;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

/**
 * Checks if a user has one of the required access levels
 * @param user The authenticated user
 * @param requiredLevels Array of access levels that are allowed
 * @returns true if user has required access, false otherwise
 */
export function hasRequiredAccess(
  user: AuthenticatedUser,
  requiredLevels: AccessLevel[]
): boolean {
  return requiredLevels.includes(user.access_level);
}

/**
 * Middleware function to protect API routes with authentication and authorization
 * @param req The Next.js request object
 * @param requiredLevels Array of access levels that are allowed (optional - defaults to requiring any authenticated user)
 * @returns Either the authenticated user or an error response
 */
export async function protectAPIRoute(
  req: Request,
  requiredLevels?: AccessLevel[]
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const user = await authenticateRequest(req);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Authentication required" },
      { status: 401 }
    );
  }

  // If specific access levels are required, check them
  if (requiredLevels && !hasRequiredAccess(user, requiredLevels)) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "You don't have permission to access this resource",
      },
      { status: 403 }
    );
  }

  return { user };
}
