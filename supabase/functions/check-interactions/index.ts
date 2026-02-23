import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { newMedication, existingMedications } = await req.json();
    if (!newMedication || !existingMedications?.length) {
      return new Response(JSON.stringify({ interactions: [], safe: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const medList = existingMedications.map((m: any) => `${m.name}${m.dosage ? ` (${m.dosage})` : ""}`).join(", ");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a clinical pharmacist assistant. Check for drug-drug interactions between a NEW medication and a list of EXISTING medications a patient is taking. 

Be concise and practical. Only flag clinically significant interactions. For each interaction found, provide:
- The two drugs involved
- Severity (mild, moderate, severe)
- A brief plain-language explanation of the risk
- A recommended action

If there are no significant interactions, say so clearly.

IMPORTANT: This is for caregiver awareness only, not medical advice. Always recommend consulting the prescribing doctor for concerns.`,
          },
          {
            role: "user",
            content: `NEW medication being added: ${newMedication}

EXISTING medications the patient is currently taking: ${medList}

Check for any drug-drug interactions between the new medication and the existing ones.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_interactions",
              description: "Report drug interaction check results",
              parameters: {
                type: "object",
                properties: {
                  safe: { type: "boolean", description: "True if no significant interactions found" },
                  summary: { type: "string", description: "Brief overall summary for the caregiver" },
                  interactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        drug1: { type: "string" },
                        drug2: { type: "string" },
                        severity: { type: "string", enum: ["mild", "moderate", "severe"] },
                        description: { type: "string", description: "Plain language explanation" },
                        action: { type: "string", description: "Recommended action" },
                      },
                      required: ["drug1", "drug2", "severity", "description", "action"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["safe", "summary", "interactions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_interactions" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ interactions: [], safe: true, summary: "No interactions detected." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-interactions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
