// ==============================================================================
// CivicFix AI 2.0 - Gemini AI Analysis Edge Function
// Supabase Edge Function (Deno Runtime)
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AnalysisRequest {
  title?: string;
  description: string;
  category?: string;
  imageBase64?: string;
  mimeType?: string;
  imageUrl?: string;
}

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Read server-side Gemini API Key
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is not configured on the Supabase Edge Function.",
          status: "unconfigured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Parse and validate request body
    const body: AnalysisRequest = await req.json();
    const { title = "", description = "", category = "", imageBase64, mimeType = "image/jpeg", imageUrl } = body;

    if (!description && !imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Either a description or an image must be provided." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Construct Gemini Prompt & Payload
    const promptText = `
You are an expert AI civic infrastructure and public safety triage engineer.
Analyze the following citizen-reported municipal issue:
- User-provided Title: ${title || "N/A"}
- User-provided Category: ${category || "N/A"}
- User-provided Description: ${description || "N/A"}

Carefully inspect the visual evidence (if provided) and description.
Evaluate:
1. Exact civic issue category (Choose strictly from: "Road Damage", "Garbage", "Streetlight", "Water Supply", "Public Hazard", "Other").
2. Punchy, professional summary (10-15 words).
3. Public safety severity level: "Critical" (life hazard, imminent electrocution/deep crater/severe flood), "High" (heavy disruption/health risk), "Medium" (standard public inconvenience), or "Low" (minor cosmetic/non-urgent).
4. Recommended municipal priority: "High", "Medium", or "Low".
5. Confidence level (float between 0.0 and 1.0).
6. Technical reasoning citing specific visual and contextual cues.
7. List of detected physical hazards.
8. Recommended municipal action items.

CRITICAL: Return ONLY valid, parseable JSON with no conversational prefix or suffix. Use this exact schema:
{
  "suggested_category": "Road Damage | Garbage | Streetlight | Water Supply | Public Hazard | Other",
  "summary": "string",
  "safety_severity": "Critical | High | Medium | Low",
  "recommended_priority": "High | Medium | Low",
  "confidence_score": 0.95,
  "reasoning": "string",
  "detected_hazards": ["hazard1", "hazard2"],
  "action_recommendations": ["action1", "action2"]
}
`.trim();

    // Prepare contents array for Gemini
    const contentsParts: Array<Record<string, unknown>> = [
      { text: promptText }
    ];

    // If inline base64 image was supplied
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      contentsParts.push({
        inline_data: {
          mime_type: mimeType,
          data: cleanBase64,
        },
      });
    }

    // 5. Call Gemini API endpoint
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: contentsParts }],
        generationConfig: {
          temperature: 0.2,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return new Response(
        JSON.stringify({
          error: "Gemini API request failed",
          details: errText,
          status: geminiResponse.status,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawCandidate = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 6. Clean markdown code fences if present
    const cleanJson = rawCandidate
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanJson);
    } catch {
      return new Response(
        JSON.stringify({
          error: "Failed to parse structured JSON from Gemini response",
          raw: rawCandidate,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 7. Return verified structured response
    return new Response(
      JSON.stringify({
        success: true,
        data: parsedResult,
        model: "gemini-2.0-flash",
        analyzed_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
