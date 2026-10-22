// ==============================================================================
// CivicFix AI 2.0 - Supabase Client Manager
// Safely initializes client when credentials exist; returns null in demo mode
// ==============================================================================

import { Config } from "./config.js";

let supabaseClient = null;

export function getSupabaseClient() {
  if (Config.isDemoMode) {
    return null;
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  // Check if @supabase/supabase-js is loaded from CDN
  if (typeof window !== "undefined" && window.supabase && window.supabase.createClient) {
    try {
      supabaseClient = window.supabase.createClient(Config.supabaseUrl, Config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseClient;
    } catch (err) {
      console.warn("Failed to initialize Supabase client:", err);
      return null;
    }
  } else {
    console.warn("Supabase JS SDK is not loaded on window. Running in demo mode.");
    return null;
  }
}
