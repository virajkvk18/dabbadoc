"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured
} from "./config";

export function createSupabaseBrowser() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase browser client is not configured.");
  }

  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
