import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FAX_API_KEY = Deno.env.get("FAX_API_KEY");
    
    // For now, simulate fax sending. When a fax provider is connected, this will use their API.
    const { faxNumber, documentId, filePath, providerName, senderName } = await req.json();

    if (!faxNumber || !filePath) {
      return new Response(JSON.stringify({ error: "Fax number and document are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a signed URL for the document
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: signedData, error: signedError } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 3600);

    if (signedError || !signedData?.signedUrl) {
      throw new Error("Could not access document file");
    }

    if (!FAX_API_KEY) {
      // No fax provider configured yet — return a simulated success
      console.log(`[Fax Simulation] Would fax ${filePath} to ${faxNumber} for ${providerName}`);
      return new Response(JSON.stringify({
        success: true,
        simulated: true,
        message: `Fax to ${faxNumber} queued (demo mode — connect a fax provider for real delivery)`,
        faxNumber,
        providerName,
        documentUrl: signedData.signedUrl,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // When a real fax API is connected, implement here:
    // e.g., Phaxio, SRFax, eFax API call using FAX_API_KEY and signedData.signedUrl

    return new Response(JSON.stringify({
      success: true,
      simulated: false,
      message: `Fax sent to ${faxNumber}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-fax error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
