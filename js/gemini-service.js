// ==============================================================================
// CivicFix AI 2.0 - Gemini AI Analysis Client Service
// Calls secure Supabase Edge Function; falls back to clearly labeled Demo Mode
// ==============================================================================

import { Config } from "./config.js";

export const GeminiService = {
  async analyzeIssue({ title, description, category, imageBase64, mimeType }) {
    // 1. Try Node.js Express backend AI analysis endpoint
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          image_url: imageBase64,
        }),
      });

      if (response.ok) {
        const resJson = await response.json();
        if (resJson.success && resJson.data) {
          return {
            isDemo: !resJson.data.isLiveApi,
            model: resJson.data.model || "CivicFix AI Engine",
            analyzed_at: resJson.data.analyzed_at || new Date().toISOString(),
            ...resJson.data,
          };
        }
      }
    } catch {
      // Backend server not active, proceed to Supabase Edge Function or local simulator
    }

    // 2. Attempt Live Server-Side Analysis if Supabase Edge Function URL is configured
    if (!Config.isDemoMode && Config.edgeFunctionUrl) {
      try {
        const response = await fetch(Config.edgeFunctionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(Config.supabaseAnonKey ? { apikey: Config.supabaseAnonKey } : {}),
            ...(Config.supabaseAnonKey ? { Authorization: `Bearer ${Config.supabaseAnonKey}` } : {}),
          },
          body: JSON.stringify({
            title,
            description,
            category,
            imageBase64,
            mimeType,
          }),
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.data) {
            return {
              isDemo: false,
              model: resJson.model || "gemini-2.0-flash",
              analyzed_at: resJson.analyzed_at || new Date().toISOString(),
              ...resJson.data,
            };
          }
        }
        console.warn("Live Gemini Edge function returned non-ok status. Falling back to labeled demo simulation.");
      } catch (err) {
        console.warn("Could not reach Gemini Edge Function. Falling back to labeled demo simulation:", err);
      }
    }

    // 2. Realistic Simulated Analysis in Demo Mode (Explicitly Labeled)
    // Small natural delay to simulate realistic AI inference (700ms)
    await new Promise((r) => setTimeout(r, 700));

    return this.generateSimulatedAnalysis(title, description, category);
  },

  // Clearly labeled heuristic demo simulator when real Gemini API is unconfigured
  generateSimulatedAnalysis(title = "", description = "", category = "") {
    const combined = `${title} ${description} ${category}`.toLowerCase();

    let detectedCat = category || "Other";
    let severity = "Medium";
    let priority = "Medium";
    let hazards = ["Public inconvenience"];
    let reasoning = "Issue reported in community corridor requiring maintenance attention.";
    let confidence = 0.88;

    if (combined.includes("pothole") || combined.includes("crater") || combined.includes("road") || combined.includes("skid")) {
      detectedCat = "Road Damage";
      severity = combined.includes("deep") || combined.includes("accident") || combined.includes("skid") ? "Critical" : "High";
      priority = severity === "Critical" ? "Critical" : "High";
      hazards = ["Two-wheeler skidding hazard", "Vehicle axle suspension damage", "Nighttime collision risk"];
      reasoning = "Visual description indicates asphalt structural failure with deep cavity in vehicular pathway.";
      confidence = 0.94;
    } else if (combined.includes("garbage") || combined.includes("trash") || combined.includes("dump") || combined.includes("waste") || combined.includes("smell")) {
      detectedCat = "Garbage";
      severity = "High";
      priority = "High";
      hazards = ["Pedestrian sidewalk blockage", "Vermin and vector attraction", "Sanitary hazard"];
      reasoning = "Solid waste accumulation exceeding container capacity, spilling into pedestrian corridor.";
      confidence = 0.91;
    } else if (combined.includes("light") || combined.includes("dark") || combined.includes("lamp") || combined.includes("bulb")) {
      detectedCat = "Streetlight";
      severity = "Medium";
      priority = "Medium";
      hazards = ["Pedestrian night blindspot", "Reduced pedestrian personal safety"];
      reasoning = "Non-illuminated lighting infrastructure along pedestrian access corridor.";
      confidence = 0.89;
    } else if (combined.includes("water") || combined.includes("pipe") || combined.includes("leak") || combined.includes("flood") || combined.includes("drain")) {
      detectedCat = "Water Supply";
      severity = "Critical";
      priority = "Critical";
      hazards = ["Subsurface road foundation erosion", "Aquaplaning", "Potable drinking water wastage"];
      reasoning = "Pressurized plumbing rupture resulting in localized surface inundation.";
      confidence = 0.95;
    } else if (combined.includes("wire") || combined.includes("electric") || combined.includes("shock") || combined.includes("open") || combined.includes("hazard")) {
      detectedCat = "Public Hazard";
      severity = "Critical";
      priority = "Critical";
      hazards = ["Direct electrocution risk", "Short-circuit flashover", "Public contact hazard"];
      reasoning = "Exposed electrical infrastructure directly accessible at pedestrian grade.";
      confidence = 0.97;
    }

    const shortSummary = `${detectedCat}: ${title || description.slice(0, 40)}...`;

    return {
      isDemo: true,
      demoNotice: "DEMO MODE: Simulated AI Analysis (Connect Gemini API in Settings for live inference)",
      model: "CivicFix Demo Heuristic Simulator",
      suggested_category: detectedCat,
      summary: shortSummary,
      safety_severity: severity,
      recommended_priority: priority,
      confidence_score: confidence,
      reasoning,
      detected_hazards: hazards,
      action_recommendations: [
        `Dispatch ${detectedCat} municipal assessment crew`,
        "Erect temporary pedestrian warning markers",
      ],
      analyzed_at: new Date().toISOString(),
    };
  },
};
