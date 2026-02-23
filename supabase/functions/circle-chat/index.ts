import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODELS = {
  lite: "google/gemini-2.5-flash-lite",
  standard: "google/gemini-2.5-flash",
  pro: "google/gemini-2.5-pro",
};

// ── Keyword classifier ───────────────────────────────────────────────
function classifyMessage(message: string): { model: string; tier: string } {
  const lower = message.toLowerCase();

  const proPatterns = [
    /\bwhy\b/, /\bcould\s+\w+\s+cause\b/, /\bcorrelat/, /\binteraction\b/,
    /\bside\s*effect/, /\bmedication.*(?:caus|affect|impact)/,
    /\b(?:blood\s*pressure|bp).*(?:weight|sleep|heart)/,
    /\b(?:weight).*(?:bp|blood\s*pressure|medication)/,
    /\banalyze\b/, /\bexplain\b.*\b(?:trend|change|pattern)/,
  ];
  if (proPatterns.some((p) => p.test(lower))) {
    return { model: MODELS.pro, tier: "pro" };
  }

  const litePatterns = [
    /\bpharmacy\b/, /\bdoctor\b.*\b(?:name|number|phone|contact)\b/,
    /\ballerg/, /\bmedication\s*list\b/, /\bwhat\s+(?:meds|medications)\b/,
    /\bappointment\b/, /\binsurance\b/, /\bhospital\b/,
    /\bwhat\s+is\s+(?:mom|dad|her|his)\s+(?:doctor|pharmacy|hospital)\b/,
  ];
  if (litePatterns.some((p) => p.test(lower))) {
    return { model: MODELS.lite, tier: "lite" };
  }

  return { model: MODELS.standard, tier: "standard" };
}

// ── Detect /feedback trigger ─────────────────────────────────────────
function extractFeedback(message: string): string | null {
  const match = message.match(/\/feedback\s+(.+)/is);
  return match ? match[1].trim() : null;
}

const SYSTEM_PROMPT = [
  "You are Circle, a warm and knowledgeable AI assistant embedded in a family caregiving group chat for Rosa Martinez (Mom).",
  "",
  "Mom's Medical Context:",
  "- Name: Rosa Martinez, Age 73, DOB April 15 1952",
  "- Conditions: Hypertension, Type 2 Diabetes, GERD, History of heart disease",
  "- Allergies: Penicillin (rash), Sulfa drugs (anaphylaxis, SEVERE)",
  "- Preferred Hospital: Elmhurst Hospital",
  "- Preferred Pharmacy: CVS Queens Blvd",
  "",
  "Current Medications:",
  "- Lisinopril 10mg, 1x daily morning, Blood Pressure (Dr. Fuzaylov)",
  "- Jardiance 10mg, 1x daily morning with food, Diabetes (Dr. Patel)",
  "- Omeprazole 20mg, 1x daily evening, GERD (Dr. Patel)",
  "- Amlodipine 5mg, 1x daily morning, Blood Pressure (Dr. Fuzaylov)",
  "",
  "Doctors:",
  "- Dr. Fuzaylov, Cardiology, (718) 897-0327",
  "- Dr. Patel, Primary Care, (718) 555-0456",
  "- Dr. Mehta, Gastroenterology, (718) 555-0789",
  "",
  "Recent BP (7-day): 132/85, 128/82, 135/88, 140/90, 130/84, 126/80, 138/87",
  "Dr. Fuzaylov target: below 140/90",
  "",
  "Standing Instructions: Elevate bed to 35 degrees per MD. Reduce sodium intake.",
  "",
  "Family: Manny (Son, admin), Maria (Daughter), Jessica (Daughter)",
  "",
  "Your personality: Warm, caring, never condescending. Use first person like 'Let me check Mom\\'s records'. Always defer medical judgment to doctors. Keep responses concise. Use emoji sparingly.",
].join("\n");

const FEEDBACK_SYSTEM_PROMPT = [
  "You are Circle, the AI assistant in a family caregiving app called CareCircle.",
  "A family member just submitted feedback or an idea using the /feedback command.",
  "Your job is to 'stress test' the idea by:",
  "1. Briefly acknowledging the idea warmly",
  "2. Evaluating its feasibility within the CareCircle app",
  "3. Playing devil's advocate — what could go wrong? What edge cases exist?",
  "4. Suggesting how the idea could be improved or refined",
  "5. Giving an overall verdict: 👍 Great idea, 🤔 Needs refinement, or ⚠️ Potential issues",
  "",
  "Keep your response concise (under 200 words). Be constructive, not dismissive.",
  "End with: '✅ I've logged this feedback for Manny to review.'",
].join("\n");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, feedbackMode, feedbackText, userName, userId, careCircleId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── Feedback mode ──────────────────────────────────────────────
    if (feedbackMode && feedbackText) {
      console.log(`[feedback] From ${userName}: "${feedbackText.slice(0, 80)}"`);

      // Get AI stress-test analysis
      const aiResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODELS.standard,
            messages: [
              { role: "system", content: FEEDBACK_SYSTEM_PROMPT },
              { role: "user", content: `Feedback from ${userName}: ${feedbackText}` },
            ],
          }),
        }
      );

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("AI gateway error on feedback:", aiResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: "AI gateway error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResponse.json();
      const analysis = aiData.choices?.[0]?.message?.content || "I've logged your feedback.";

      // Log to database
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        await supabaseAdmin.from("feedback").insert({
          user_id: userId || "anonymous",
          user_name: userName || "Unknown",
          care_circle_id: careCircleId || null,
          original_message: feedbackText,
          ai_analysis: analysis,
          status: "new",
        });
        console.log("[feedback] Logged to database");
      } catch (dbErr) {
        console.error("[feedback] DB insert error:", dbErr);
        // Don't fail the response — still return the AI analysis
      }

      return new Response(
        JSON.stringify({ content: analysis }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Normal chat mode ───────────────────────────────────────────
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    const { model, tier } = lastUserMsg
      ? classifyMessage(lastUserMsg.content)
      : { model: MODELS.standard, tier: "standard" };

    console.log(`[chat-${tier}] Model: ${model} | Message: "${(lastUserMsg?.content || "").slice(0, 80)}"`);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "I'm not sure how to respond to that.";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("circle-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
