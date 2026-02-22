import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Use service role for fetching context
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

    // Calculate age
    let age = "";
    if (recipient?.date_of_birth) {
      const dob = new Date(recipient.date_of_birth);
      const ageDiff = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      age = `, age ${ageDiff}`;
    }

    // Group readings by type for context
    const byType: Record<string, any[]> = {};
    for (const r of readings) {
      if (!byType[r.type]) byType[r.type] = [];
      byType[r.type].push(r);
    }

    // Find the new reading
    const newReading = readings.find((r: any) => r.id === reading_id);
    if (!newReading) {
      return new Response(JSON.stringify({ error: "Reading not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
      } else if (type === "steps") {
        readingsContext += `\nSteps (last ${recent.length} readings):\n`;
        recent.forEach((r: any) => {
          readingsContext += `  ${r.created_at}: ${r.value_primary} steps\n`;
        });
      } else if (type === "sleep") {
        readingsContext += `\nSleep (last ${recent.length} readings):\n`;
        recent.forEach((r: any) => {
          readingsContext += `  ${r.created_at}: ${r.value_primary} hours\n`;
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

    const medicalConditions = recipient?.medical_conditions?.join(", ") || "None listed";

    const systemPrompt = `You are a family health monitoring assistant for ${recipientName}${age}.

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

You MUST respond with valid JSON in this exact format:
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

    const userPrompt = `NEW READING JUST LOGGED:
${newReadingDesc}
Logged at: ${newReading.created_at}
Source: ${newReading.source}
${newReading.notes ? `Notes: ${newReading.notes}` : ""}

RECENT HEALTH DATA (last 30 days):
${readingsContext || "No prior readings available — this is the first one."}

Analyze this reading and respond with the JSON assessment.`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
    
    // Extract tool call result
    let assessment: any;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      assessment = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content directly
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

    // Save alert to health_alerts
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
      })
      .select()
      .single();

    if (alertError) {
      console.error("Error saving alert:", alertError);
      // Still return the assessment even if save fails
      return new Response(JSON.stringify({ alert: assessment, saved: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
