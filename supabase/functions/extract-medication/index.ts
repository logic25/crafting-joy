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

    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a medication label reader. Extract medication details from prescription bottle labels, pharmacy labels, or medication packaging photos.

You MUST call the extract_medication function with the extracted data. If you can't read the label clearly, fill in what you can and leave the rest as null.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the medication details from this photo of a medication label/bottle:" },
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_medication",
              description: "Extract structured medication information from a label image",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Medication name (generic or brand)" },
                  dosage: { type: "string", description: "Dosage strength (e.g., '10mg', '500mg')" },
                  frequency: { type: "string", description: "How often to take (e.g., '1x daily', '2x daily with meals')" },
                  instructions: { type: "string", description: "Any special instructions on the label", nullable: true },
                  purpose: { type: "string", description: "What condition it treats, if mentioned", nullable: true },
                  prescriber: { type: "string", description: "Doctor/prescriber name if visible", nullable: true },
                  pharmacy: { type: "string", description: "Pharmacy name if visible", nullable: true },
                  quantity: { type: "number", description: "Prescription quantity if visible", nullable: true },
                  refills: { type: "number", description: "Number of refills remaining if visible", nullable: true },
                },
                required: ["name"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_medication" } },
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
      const extracted = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ medication: extracted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Could not extract medication details from this image. Try a clearer photo of the label." }), {
      status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-medication error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
