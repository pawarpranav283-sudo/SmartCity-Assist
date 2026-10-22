// ==============================================================================
// CivicFix AI 2.0 - Application Configuration
// ==============================================================================

const STORAGE_KEYS = {
  SUPABASE_URL: "cfx_supabase_url",
  SUPABASE_ANON_KEY: "cfx_supabase_anon_key",
  EDGE_FUNCTION_URL: "cfx_edge_function_url",
  FORCE_DEMO: "cfx_force_demo_mode",
  DEMO_ROLE: "cfx_demo_current_role", // 'citizen' or 'admin'
  LOCAL_REPORTS_V1: "civicfix-reports-v1", // Legacy data from v1
  LOCAL_REPORTS_V2: "civicfix-reports-v2"  // Enhanced v2 data with images, coords, ai
};

// Default environment placeholders or overrides from localStorage
const storedUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || "";
const storedKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY) || "";
const storedEdgeUrl = localStorage.getItem(STORAGE_KEYS.EDGE_FUNCTION_URL) || "";
const forcedDemo = localStorage.getItem(STORAGE_KEYS.FORCE_DEMO) === "true";

export const Config = {
  // If user has supplied credentials via settings modal or env, and not forced into demo
  supabaseUrl: storedUrl.trim(),
  supabaseAnonKey: storedKey.trim(),
  edgeFunctionUrl: storedEdgeUrl.trim() || (storedUrl ? `${storedUrl.trim().replace(/\/$/, "")}/functions/v1/analyze-issue` : ""),
  
  // Is live mode truly connected?
  isLive: Boolean(storedUrl.trim() && storedKey.trim() && !forcedDemo),
  isDemoMode: Boolean(!storedUrl.trim() || !storedKey.trim() || forcedDemo),

  // Default Map center (Default: Central Metro Area)
  defaultMapCenter: [28.6139, 77.2090],
  defaultZoom: 13,

  // Haversine threshold for proximity duplicate warning (in meters)
  duplicateProximityMeters: 350,

  // Save custom credentials from browser UI settings
  saveCredentials(url, key, edgeUrl = "") {
    if (url) localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
    if (key) localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, key.trim());
    if (edgeUrl) localStorage.setItem(STORAGE_KEYS.EDGE_FUNCTION_URL, edgeUrl.trim());
    localStorage.removeItem(STORAGE_KEYS.FORCE_DEMO);
    window.location.reload();
  },

  // Switch to demo mode
  enableDemoMode() {
    localStorage.setItem(STORAGE_KEYS.FORCE_DEMO, "true");
    window.location.reload();
  },

  // Clear credentials
  clearCredentials() {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
    localStorage.removeItem(STORAGE_KEYS.EDGE_FUNCTION_URL);
    localStorage.setItem(STORAGE_KEYS.FORCE_DEMO, "true");
    window.location.reload();
  },

  // Storage keys constants
  STORAGE_KEYS
};
