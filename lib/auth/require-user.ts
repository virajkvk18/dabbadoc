import type { User } from "@supabase/supabase-js";
import { ApiError } from "@/lib/security/api-errors";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function requireVerifiedUser(): Promise<User> {
  const supabase = await createSupabaseServer();
  if (!supabase) {
    throw new ApiError("Secure account access is temporarily unavailable.", 503);
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError("Please log in to continue.", 401);
  }

  if (user.email && !user.email_confirmed_at) {
    throw new ApiError("Please verify your email before continuing.", 403);
  }

  return user;
}
