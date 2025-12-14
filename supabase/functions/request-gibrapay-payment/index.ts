import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GIBRAPAY-PAYMENT-REQUEST] ${step}${detailsStr}`);
};

// Clean phone number - remove all non-numeric characters
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const gibrapayApiKey = Deno.env.get("GIBRAPAY_API_KEY");
    const gibrapayWalletId = Deno.env.get("GIBRAPAY_WALLET_ID");

    if (!gibrapayApiKey || !gibrapayWalletId) {
      throw new Error("GibaPay credentials not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { 
      phoneNumber, 
      amount, 
      reportId, 
      transactionId,
      companyId,
      pentesterId,
      grossAmount,
      platformFee,
      netAmount
    } = await req.json();
    
    logStep("Processing payment request", { 
      phoneNumber: phoneNumber ? `***${phoneNumber.slice(-4)}` : null, 
      amount,
      reportId 
    });

    if (!phoneNumber || !amount) {
      throw new Error("Número de telefone e valor são obrigatórios");
    }

    const cleanedPhone = cleanPhoneNumber(phoneNumber);
    logStep("Cleaned phone number", { cleanedPhone: `***${cleanedPhone.slice(-4)}` });

    // Call GibaPay API to request payment (send USSD to customer)
    // Using the transfer endpoint as per user's API documentation
    // This will request payment FROM the phone number TO the wallet
    const response = await fetch("https://gibrapay.online/v1/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Key": gibrapayApiKey,
      },
      body: JSON.stringify({
        wallet_id: gibrapayWalletId,
        number_phone: cleanedPhone,
        amount: amount,
      }),
    });

    const data = await response.json();
    logStep("GibaPay response", { status: response.status, data });

    const isSuccess = response.ok && data.status === "success";

    if (isSuccess) {
      // Create or update transaction record
      if (transactionId) {
        // Update existing transaction
        await supabaseClient
          .from("platform_transactions")
          .update({
            gibrapay_status: "ussd_sent",
            gibrapay_transaction_id: data.data?.id || data.transaction_id,
          })
          .eq("id", transactionId);
      } else if (reportId && companyId && pentesterId) {
        // Create new transaction
        await supabaseClient
          .from("platform_transactions")
          .insert({
            report_id: reportId,
            company_id: companyId,
            pentester_id: pentesterId,
            gross_amount: grossAmount,
            platform_fee: platformFee,
            net_amount: netAmount,
            status: "pending",
            deposit_status: "pending",
            payout_type: "pending",
            gibrapay_status: "ussd_sent",
            gibrapay_transaction_id: data.data?.id || data.transaction_id,
            phone_number: cleanedPhone,
          });
      }

      logStep("Payment request successful", { 
        transactionId: data.data?.id || data.transaction_id 
      });

      return new Response(JSON.stringify({
        success: true,
        message: "USSD enviado com sucesso! Confirme o pagamento no seu telefone.",
        transaction_id: data.data?.id || data.transaction_id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If failed, log the error
    const errorMessage = data.message || data.error || "Falha ao enviar USSD";
    logStep("Payment request failed", { error: errorMessage });

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMsg });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMsg 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
