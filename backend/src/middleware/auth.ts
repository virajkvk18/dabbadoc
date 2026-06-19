import type { RequestHandler } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  config,
  isSupabaseJwtVerificationConfigured
} from "../config.js";
import { ApiError } from "./errors.js";
import { logEvent } from "../utils/log.js";

let supabase: SupabaseClient | null = null;

function getSupabaseClient() {
  if (!isSupabaseJwtVerificationConfigured()) return null;
  if (!supabase) {
    supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return supabase;
}

function bearerToken(header?: string) {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export const requireSupabaseUser: RequestHandler = async (request, _response, next) => {
  try {
    const token = bearerToken(request.header("authorization"));
    if (!token) {
      throw new ApiError("Login is required for this backend route.", 401);
    }

    const client = getSupabaseClient();
    if (!client) {
      throw new ApiError("Supabase JWT verification is not configured.", 503);
    }

    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      logEvent("warn", "backend_auth_rejected", {
        requestId: request.requestId,
        path: request.path,
        reason: error?.message || "missing_user"
      });
      throw new ApiError("Invalid or expired login session.", 401);
    }

    request.user = {
      id: data.user.id,
      email: data.user.email ?? undefined
    };
    next();
  } catch (error) {
    next(error);
  }
};
