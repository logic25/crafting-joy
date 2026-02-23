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

// ── Dynamic system prompt builder ──────────────────────────────
async function buildSystemPrompt(supabaseAdmin: any, careCircleId: string): Promise<string> {
  const lines: string[] = [
    "You are Circle, a warm and knowledgeable AI assistant embedded in a family caregiving group chat.",
    "",
  ];

  // 1. Care recipient
  const { data: recipients } = await supabaseAdmin
    .from("care_recipients")
    .select("*")
    .eq("care_circle_id", careCircleId)
    .limit(1);

  const recipient = recipients?.[0];
  if (!recipient) {
    return [
      "You are Circle, a warm AI assistant for family caregiving.",
      "No care recipient has been set up yet — help the family get started by encouraging them to add their loved one's information in the app settings.",
      "Your personality: Warm, caring, never condescending. Keep responses concise. Use emoji sparingly.",
    ].join("\n");
  }

  const age = recipient.date_of_birth
    ? Math.floor((Date.now() - new Date(recipient.date_of_birth).getTime()) / (365.25 * 86400000))
    : null;

  lines.push(`${recipient.name}'s Medical Context:`);
  lines.push(`- Name: ${recipient.name}${age ? `, Age ${age}` : ""}${recipient.date_of_birth ? `, DOB ${recipient.date_of_birth}` : ""}`);

  if (recipient.medical_conditions?.length) {
    lines.push(`- Conditions: ${recipient.medical_conditions.join(", ")}`);
  }

  if (recipient.allergies && Array.isArray(recipient.allergies) && recipient.allergies.length) {
    const allergyStrs = recipient.allergies.map((a: any) =>
      typeof a === "string" ? a : `${a.name}${a.reaction ? ` (${a.reaction}${a.severity === "severe" ? ", SEVERE" : ""})` : ""}`
    );
    lines.push(`- Allergies: ${allergyStrs.join(", ")}`);
  }

  if (recipient.preferred_hospital) lines.push(`- Preferred Hospital: ${recipient.preferred_hospital}`);
  if (recipient.preferred_pharmacy) lines.push(`- Preferred Pharmacy: ${recipient.preferred_pharmacy}`);

  if (recipient.standing_instructions?.length) {
    lines.push(`- Standing Instructions: ${recipient.standing_instructions.join("; ")}`);
  }
  lines.push("");

  // 2. Active medications
  const { data: meds } = await supabaseAdmin
    .from("medications")
    .select("name, dosage, frequency, purpose, prescriber, instructions")
    .eq("care_circle_id", careCircleId)
    .eq("is_active", true);

  if (meds?.length) {
    lines.push("Current Medications:");
    for (const m of meds) {
      const parts = [`${m.name}${m.dosage ? ` ${m.dosage}` : ""}`];
      if (m.frequency) parts.push(m.frequency);
      if (m.purpose) parts.push(m.purpose);
      if (m.prescriber) parts.push(`(${m.prescriber})`);
      if (m.instructions) parts.push(`— ${m.instructions}`);
      lines.push(`- ${parts.join(", ")}`);
    }
    lines.push("");
  }

  // 3. Providers
  const { data: providers } = await supabaseAdmin
    .from("providers")
    .select("name, specialty, phone")
    .eq("care_circle_id", careCircleId);

  if (providers?.length) {
    lines.push("Doctors:");
    for (const p of providers) {
      lines.push(`- ${p.name}, ${p.specialty}${p.phone ? `, ${p.phone}` : ""}`);
    }
    lines.push("");
  }

  // 4. Upcoming appointments
  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("provider_name, provider_specialty, purpose, date_time, location")
    .eq("care_circle_id", careCircleId)
    .gte("date_time", new Date().toISOString())
    .order("date_time", { ascending: true })
    .limit(5);

  if (appointments?.length) {
    lines.push("Upcoming Appointments:");
    for (const a of appointments) {
      const dt = new Date(a.date_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      lines.push(`- ${dt}: ${a.provider_name}${a.provider_specialty ? ` (${a.provider_specialty})` : ""} — ${a.purpose}${a.location ? ` at ${a.location}` : ""}`);
    }
    lines.push("");
  }

  // 5. Recent health readings
  const { data: readings } = await supabaseAdmin
    .from("health_readings")
    .select("type, value_primary, value_secondary, unit, created_at")
    .eq("care_circle_id", careCircleId)
    .order("created_at", { ascending: false })
    .limit(14);

  if (readings?.length) {
    const grouped: Record<string, string[]> = {};
    for (const r of readings) {
      const label = r.type;
      if (!grouped[label]) grouped[label] = [];
      const val = r.value_secondary ? `${r.value_primary}/${r.value_secondary}` : `${r.value_primary}`;
      grouped[label].push(val);
    }
    lines.push("Recent Health Readings:");
    for (const [type, vals] of Object.entries(grouped)) {
      lines.push(`- ${type}: ${vals.join(", ")}`);
    }
    lines.push("");
  }

  // 6. Family members
  const { data: members } = await supabaseAdmin
    .from("care_circle_members")
    .select("role, user_id")
    .eq("care_circle_id", careCircleId);

  if (members?.length) {
    const userIds = members.map((m: any) => m.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);

    if (profiles?.length) {
      const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));
      lines.push("Family:");
      for (const m of members) {
        const p = profileMap[m.user_id];
        const name = p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown" : "Unknown";
        lines.push(`- ${name} (${m.role})`);
      }
      lines.push("");
    }
  }

  lines.push("Your personality: Warm, caring, never condescending. Use first person like 'Let me check the records'. Always defer medical judgment to doctors. Keep responses concise. Use emoji sparingly.");

  return lines.join("\n");
}

const FEEDBACK_SYSTEM_PROMPT = [
  "You are Circle, the AI assistant in a family caregiving app called CareThread.",
  "An admin wants you to stress-test a piece of feedback or idea submitted by a family member.",
  "Your job is to:",
  "1. Briefly acknowledge the idea",
  "2. Evaluate its feasibility within a caregiving coordination app",
  "3. Play devil's advocate — what could go wrong? What edge cases exist?",
  "4. Suggest how the idea could be improved or refined",
  "5. Give an overall verdict: 👍 Great idea, 🤔 Needs refinement, or ⚠️ Potential issues",
  "",
  "Keep your response concise (under 200 words). Be constructive, not dismissive.",
].join("\n");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // ── Feedback logging (just save, no AI) ────────────────────────
    if (body.feedbackMode && body.feedbackText) {
      console.log(`[feedback] From ${body.userName}: "${body.feedbackText.slice(0, 80)}"`);

      try {
        await supabaseAdmin.from("feedback").insert({
          user_id: body.userId || "anonymous",
          user_name: body.userName || "Unknown",
          care_circle_id: body.careCircleId || null,
          original_message: body.feedbackText,
          status: "new",
        });
        console.log("[feedback] Logged to database");
      } catch (dbErr) {
        console.error("[feedback] DB insert error:", dbErr);
      }

      return new Response(
        JSON.stringify({ content: `Thanks for the feedback! 📝 I've logged your idea for the admin to review.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Stress test (admin-triggered) ──────────────────────────────
    if (body.stressTest && body.feedbackText) {
      console.log(`[stress-test] "${body.feedbackText.slice(0, 80)}"`);

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
              { role: "user", content: `Feedback from ${body.userName || "a family member"}: ${body.feedbackText}` },
            ],
          }),
        }
      );

      if (!aiResponse.ok) {
        console.error("AI gateway error on stress test:", aiResponse.status);
        return new Response(
          JSON.stringify({ error: "AI gateway error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResponse.json();
      const analysis = aiData.choices?.[0]?.message?.content || "Unable to analyze.";

      return new Response(
        JSON.stringify({ analysis }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Normal chat mode ───────────────────────────────────────────
    const { messages, careCircleId } = body;
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    const { model, tier } = lastUserMsg
      ? classifyMessage(lastUserMsg.content)
      : { model: MODELS.standard, tier: "standard" };

    console.log(`[chat-${tier}] Model: ${model} | Message: "${(lastUserMsg?.content || "").slice(0, 80)}"`);

    // Build dynamic system prompt from real data
    let systemPrompt: string;
    if (careCircleId) {
      systemPrompt = await buildSystemPrompt(supabaseAdmin, careCircleId);
    } else {
      systemPrompt = [
        "You are Circle, a warm AI assistant for family caregiving.",
        "No care circle context was provided. Help the user with general caregiving questions.",
        "Your personality: Warm, caring, never condescending. Keep responses concise. Use emoji sparingly.",
      ].join("\n");
    }

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
            { role: "system", content: systemPrompt },
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
