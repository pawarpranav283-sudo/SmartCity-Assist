// ==============================================================================
// CivicFix AI 2.0 - Authentication & Role Authorization
// ==============================================================================

import { Config } from "./config.js";
import { getSupabaseClient } from "./supabase-client.js";

const DEMO_USERS = {
  citizen: {
    id: "demo-user-citizen-01",
    email: "citizen.demo@civicfix.org",
    full_name: "Aarav Sharma (Citizen)",
    role: "citizen",
    isDemo: true,
  },
  admin: {
    id: "demo-user-admin-01",
    email: "admin.officer@civicfix.org",
    full_name: "Inspector Rajesh Kumar (Municipal Admin)",
    role: "admin",
    isDemo: true,
  },
};

export const Auth = {
  // Get active session / user
  async getCurrentUser() {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) return null;

        // Fetch user profile to verify role
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        return {
          id: session.user.id,
          email: session.user.email,
          full_name: profile?.full_name || session.user.user_metadata?.full_name || "Citizen User",
          role: profile?.role || "citizen",
          isDemo: false,
        };
      } catch (e) {
        console.error("Error fetching live user session:", e);
        return null;
      }
    }

    // Demo Mode user resolution
    const currentDemoRole = localStorage.getItem(Config.STORAGE_KEYS.DEMO_ROLE) || "citizen";
    return DEMO_USERS[currentDemoRole] || DEMO_USERS.citizen;
  },

  // Toggle role in demo mode
  setDemoRole(role) {
    if (role === "admin" || role === "citizen") {
      localStorage.setItem(Config.STORAGE_KEYS.DEMO_ROLE, role);
      return DEMO_USERS[role];
    }
    return DEMO_USERS.citizen;
  },

  // Live Sign In
  async signIn(email, password) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error("Live database connection is not configured. Use Demo Mode.");
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  // Live Sign Up
  async signUp(email, password, fullName) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error("Live database connection is not configured. Use Demo Mode.");
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "citizen" },
      },
    });
    if (error) throw error;
    return data.user;
  },

  // Sign Out
  async signOut() {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  },
};
