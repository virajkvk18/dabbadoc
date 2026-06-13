import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseAdminConfigured
} from "./admin-config";

export function createSupabaseAdmin() {
  if (!isSupabaseAdminConfigured()) return null;

  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
