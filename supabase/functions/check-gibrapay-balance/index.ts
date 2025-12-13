import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const walletId = Deno.env.get("GIBRAPAY_WALLET_ID");
    
    if (!walletId) {
      throw new Error("GIBRAPAY_WALLET_ID not configured");
    }

    console.log("[CHECK-BALANCE] Fetching wallet balance for:", walletId);

    const response = await fetch(`https://gibrapay.online/v1/wallet/${walletId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("[CHECK-BALANCE] Response:", JSON.stringify(data));

    if (data.status === "success") {
      return new Response(JSON.stringify({
        success: true,
        name: data.data?.nome,
        balance: data.data?.balance,
        statistics: data.data?.statistics,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: data.message || "Failed to fetch balance",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[CHECK-BALANCE] Error:", errorMsg);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMsg 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
