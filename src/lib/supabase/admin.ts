import "server-only";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

/**
 * Creates an elevated Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * STRICTLY SERVER-ONLY - protected by 'server-only' import.
 * Used for webhook processing, background tasks, and system migrations.
 * Bypasses RLS - use with strict authorization checks.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
