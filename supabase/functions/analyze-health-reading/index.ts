import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Model definitions & pricing ──────────────────────────────────────
const MODELS = {
  lite:     "google/gemini-2.5-flash-lite",
  standard: "google/gemini-3-flash-preview",
  pro:      "google/gemini-2.5-pro",
} as const;

const PRICING: Record<string, { input: number; output: number }> = {
  [MODELS.lite]:     { input: 0.075  / 1_000_000, output: 0.30 / 1_000_000 },
  [MODELS.standard]: { input: 0.15   / 1_000_000, output: 0.60 / 1_000_000 },
  [MODELS.pro]:      { input: 1.25   / 1_000_000, output: 5.00 / 1_000_000 },
};

const RATE_LIMIT_PER_CIRCLE_PER_DAY = 10;

// ── Normal-range definitions ─────────────────────────────────────────
function isNormalRange(reading: any): boolean {
  if (reading.type === "bp") {
    const sys = reading.value_primary;
    const dia = reading.value_secondary;
    return sys >= 90 && sys <= 130 && dia >= 60 && dia <= 85;
  }
  if (reading.type === "heart_rate") {
    const hr = reading.value_primary;
    return hr >= 55 && hr <= 90;
  }
  if (reading.type === "weight") {
    // Can't check without history — handled in selectModel
    return false;
  }
  // For types we don't have norms for, treat as not-normal to get standard analysis
  return false;
}

function isWeightStable(newReading: any, weightReadings: any[]): boolean {
  if (newReading.type !== "weight" || weightReadings.length < 2) return false;
  const recent = weightReadings.filter((r: any) => r.id !== newReading.id).slice(0, 10);
  if (recent.length === 0) return false;
  const avg = recent.reduce((s: number, r: any) => s + r.value_primary, 0) / recent.length;
  const pctChange = Math.abs(newReading.value_primary - avg) / avg;
  return pctChange <= 0.02; // within 2%
}

// ── Check if other signal types changed recently ─────────────────────
function otherSignalsChangedRecently(newReading: any, byType: Record<string, any[]>): boolean {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  for (const [type, readings] of Object.entries(byType)) {
    if (type === newReading.type) continue;
    const recentOfType = readings.filter((r: any) => new Date(r.created_at) >= sevenDaysAgo);
    if (recentOfType.length > 0) return true;
  }
  return false;
}

// ── Model router ─────────────────────────────────────────────────────
function selectModel(
  newReading: any,
  byType: Record<string, any[]>,
  _readings: any[]
): { model: string; complexity: string } {
  const normal = newReading.type === "weight"
    ? isWeightStable(newReading, byType["weight"] || [])
    : isNormalRange(newReading);

  if (normal) {
    const othersChanged = otherSignalsChangedRecently(newReading, byType);
    return othersChanged
      ? { model: MODELS.pro, complexity: "pro" }
      : { model: MODELS.lite, complexity: "lite" };
  }

  // Abnormal reading
  const signalTypesWithData = Object.keys(byType).length;
  if (signalTypesWithData >= 2) {
    return { model: MODELS.pro, complexity: "pro" };
  }
  return { model: MODELS.standard, complexity: "standard" };
}

// ── Tiered system prompts ────────────────────────────────────────────
function buildSystemPrompt(complexity: string, recipientName: string, age: string, medicalConditions: string): string {
  const jsonSchema = `You MUST respond with valid JSON in this exact format:
{
  "severity": "normal" | "watch" | "attention" | "urgent",
  "title": "short title for the alert (5-8 words)",
  "summary": "2-3 sentences for the family in warm, plain language. Be direct but caring.",
  "correlations": ["list of any cross-signal connections you notice"],
  "action": "what the family should do, if anything. null if nothing needed."
}

Severity guide:
- normal: Values in healthy range, no concerns
- watch: Slightly off but not alarming, worth monitoring
- attention: Above target or showing concerning trend, consider contacting doctor
- urgent: Significantly elevated/dangerous, take action now`;

  if (complexity === "lite") {
    return `You are a health monitoring assistant for ${recipientName}${age}. Medical conditions: ${medicalConditions}. This reading is within normal range. Confirm it briefly and reassuringly in 1-2 sentences.\n\n${jsonSchema}`;
  }

  if (complexity === "pro") {
    return `You are a family health monitoring assistant for ${recipientName}${age}.

Medical conditions: ${medicalConditions}

Known medications context (common side effects to watch for):
- Lisinopril: dry cough, dizziness, hyperkalemia
- Jardiance: UTIs, dehydration, weight loss
- Omeprazole: B12 deficiency long-term, bone density concerns
- Amlodipine: ankle swelling, weight gain, fatigue
- Metformin: GI upset, B12 deficiency, lactic acidosis (rare)

IMPORTANT: This reading may involve CROSS-SIGNAL CORRELATIONS. Carefully analyze:
1. The trend in the specific metric — is it improving or worsening?
2. Cross-signal correlations — did another metric change around the same time? (e.g., weight gain + BP increase, sleep decrease + heart rate increase)
3. Medication side effects — could a medication be causing observed changes? Check timing of medication starts vs symptom onset.
4. Overall patterns — activity level vs BP, sleep quality vs heart rate, weight trajectory vs medication changes.

Be thorough in your cross-correlation analysis. If multiple signals are changing together, explicitly call out the connection.

${jsonSchema}`;
  }

  // Standard
  return `You are a family health monitoring assistant for ${recipientName}${age}.

Medical conditions: ${medicalConditions}

Known medications context (common side effects to watch for):
- Lisinopril: dry cough, dizziness, hyperkalemia
- Jardiance: UTIs, dehydration, weight loss
- Omeprazole: B12 deficiency long-term, bone density concerns
- Amlodipine: ankle swelling, weight gain, fatigue
- Metformin: GI upset, B12 deficiency, lactic acidosis (rare)

When a new health reading arrives, analyze it against:
1. The trend in that specific metric (is it changing? getting better or worse?)
2. Cross-signal correlations (did another metric change around the same time?)
3. Medication side effects (could a medication be causing observed changes?)
4. Overall patterns (activity level vs BP, sleep vs heart rate, etc.)

${jsonSchema}`;
}

// ── Cost calculation ─────────────────────────────────────────────────
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model];
  if (!p) return 0;
  return inputTokens * p.input + outputTokens * p.output;
}

// ── Main handler ─────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { reading_id, care_circle_id, care_recipient_id } = await req.json();

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch last 30 days of all health readings for this care recipient
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [readingsRes, recipientRes] = await Promise.all([
      adminClient
        .from("health_readings")
        .select("*")
        .eq("care_circle_id", care_circle_id)
        .eq("care_recipient_id", care_recipient_id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(200),
      adminClient
        .from("care_recipients")
        .select("name, medical_conditions, date_of_birth")
        .eq("care_circle_id", care_circle_id)
        .limit(1)
        .single(),
    ]);

    const readings = readingsRes.data || [];
    const recipient = recipientRes.data;
    const recipientName = recipient?.name || "the care recipient";

    let age = "";
    if (recipient?.date_of_birth) {
      const dob = new Date(recipient.date_of_birth);
      const ageDiff = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      age = `, age ${ageDiff}`;
    }

    // Group readings by type
    const byType: Record<string, any[]> = {};
    for (const r of readings) {
      if (!byType[r.type]) byType[r.type] = [];
      byType[r.type].push(r);
    }

    const newReading = readings.find((r: any) => r.id === reading_id);
    if (!newReading) {
      return new Response(JSON.stringify({ error: "Reading not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Rate limit check ──────────────────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: todayAlertCount } = await adminClient
      .from("health_alerts")
      .select("*", { count: "exact", head: true })
      .eq("care_circle_id", care_circle_id)
      .gte("created_at", todayStart.toISOString());

    if ((todayAlertCount || 0) >= RATE_LIMIT_PER_CIRCLE_PER_DAY) {
      // Save a simple "Reading logged" alert without AI
      const { data: alert } = await adminClient
        .from("health_alerts")
        .insert({
          care_circle_id,
          reading_id,
          severity: "normal",
          title: "Reading logged",
          message: "Daily analysis limit reached. Your reading has been saved and will be included in future trend analysis.",
          correlations: [],
          action_needed: null,
          model_used: "skipped",
          complexity: "skipped",
          input_tokens: 0,
          output_tokens: 0,
          response_time_ms: 0,
          estimated_cost: 0,
        })
        .select()
        .single();

      return new Response(JSON.stringify({ alert }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Model routing ─────────────────────────────────────────────
    const { model, complexity } = selectModel(newReading, byType, readings);
    const medicalConditions = recipient?.medical_conditions?.join(", ") || "None listed";
    const systemPrompt = buildSystemPrompt(complexity, recipientName, age, medicalConditions);

    // Build context summary
    let readingsContext = "";
    for (const [type, typeReadings] of Object.entries(byType)) {
      const recent = typeReadings.slice(0, 10);
      if (type === "bp") {
        readingsContext += `\nBlood Pressure (last ${recent.length} readings):\n`;
        recent.forEach((r: any) => {
          readingsContext += `  ${r.created_at}: ${r.value_primary}/${r.value_secondary} mmHg, pulse ${r.value_tertiary || "N/A"}\n`;
        });
      } else if (type === "weight") {
        readingsContext += `\nWeight (last ${recent.length} readings):\n`;
        recent.forEach((r: any) => {
          readingsContext += `  ${r.created_at}: ${r.value_primary} ${r.unit}\n`;
        });
      } else if (type === "heart_rate") {
        readingsContext += `\nHeart Rate (last ${recent.length} readings):\n`;
        recent.forEach((r: any) => {
          readingsContext += `  ${r.created_at}: ${r.value_primary} bpm\n`;
        });
      } else {
        readingsContext += `\n${type} (last ${recent.length} readings):\n`;
        recent.forEach((r: any) => {
          readingsContext += `  ${r.created_at}: ${r.value_primary} ${r.unit}\n`;
        });
      }
    }

    // Format new reading description
    let newReadingDesc = "";
    if (newReading.type === "bp") {
      newReadingDesc = `Blood Pressure: ${newReading.value_primary}/${newReading.value_secondary} mmHg, pulse ${newReading.value_tertiary || "N/A"}`;
    } else if (newReading.type === "weight") {
      newReadingDesc = `Weight: ${newReading.value_primary} ${newReading.unit}`;
    } else {
      newReadingDesc = `${newReading.type}: ${newReading.value_primary} ${newReading.unit}`;
    }

    const userPrompt = `NEW READING JUST LOGGED:
${newReadingDesc}
Logged at: ${newReading.created_at}
Source: ${newReading.source}
${newReading.notes ? `Notes: ${newReading.notes}` : ""}

RECENT HEALTH DATA (last 30 days):
${readingsContext || "No prior readings available — this is the first one."}

Analyze this reading and respond with the JSON assessment.`;

    // ── Call AI with selected model ───────────────────────────────
    const startTime = Date.now();

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "health_assessment",
              description: "Return a structured health assessment for a new health reading",
              parameters: {
                type: "object",
                properties: {
                  severity: { type: "string", enum: ["normal", "watch", "attention", "urgent"] },
                  title: { type: "string" },
                  summary: { type: "string" },
                  correlations: { type: "array", items: { type: "string" } },
                  action: { type: "string", nullable: true },
                },
                required: ["severity", "title", "summary", "correlations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "health_assessment" } },
      }),
    });

    const responseTimeMs = Date.now() - startTime;

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();

    // ── Extract token usage ───────────────────────────────────────
    const inputTokens = aiData.usage?.prompt_tokens || 0;
    const outputTokens = aiData.usage?.completion_tokens || 0;
    const estimatedCost = calculateCost(model, inputTokens, outputTokens);

    // Extract tool call result
    let assessment: any;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      assessment = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      try {
        assessment = JSON.parse(content);
      } catch {
        assessment = {
          severity: "normal",
          title: "Reading logged",
          summary: content || "Reading has been recorded.",
          correlations: [],
          action: null,
        };
      }
    }

    // ── Save alert with tracking data ─────────────────────────────
    const { data: alert, error: alertError } = await adminClient
      .from("health_alerts")
      .insert({
        care_circle_id,
        reading_id,
        severity: assessment.severity,
        title: assessment.title,
        message: assessment.summary,
        correlations: assessment.correlations,
        action_needed: assessment.action || null,
        model_used: model,
        complexity,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        response_time_ms: responseTimeMs,
        estimated_cost: estimatedCost,
      })
      .select()
      .single();

    if (alertError) {
      console.error("Error saving alert:", alertError);
      return new Response(JSON.stringify({ alert: assessment, saved: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[${complexity}] Model: ${model} | Tokens: ${inputTokens}/${outputTokens} | Cost: $${estimatedCost.toFixed(6)} | Time: ${responseTimeMs}ms`);

    return new Response(JSON.stringify({ alert }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-health-reading error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
