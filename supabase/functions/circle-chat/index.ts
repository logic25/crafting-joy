import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
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
