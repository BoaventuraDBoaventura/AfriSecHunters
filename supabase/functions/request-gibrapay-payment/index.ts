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

// Background task to call GibaPay API
async function processGibrapayRequest(
  gibrapayApiKey: string,
  gibrapayWalletId: string,
  cleanedPhone: string,
  amount: number,
  transactionId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    logStep("Background: Calling GibaPay API", { phone: `***${cleanedPhone.slice(-4)}`, amount });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    logStep("Background: GibaPay response", { status: response.status, data });

    const isSuccess = response.ok && data.status === "success";

    // Update transaction with result
    await supabaseClient
      .from("platform_transactions")
      .update({
        gibrapay_status: isSuccess ? "completed" : "failed",
        gibrapay_transaction_id: data.data?.id || data.transaction_id || null,
        gibrapay_error: isSuccess ? null : (data.message || data.error || "Unknown error"),
        deposit_status: isSuccess ? "confirmed" : "pending",
      })
      .eq("id", transactionId);

    logStep("Background: Transaction updated", { transactionId, success: isSuccess });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logStep("Background: Error", { error: errorMsg });

    // Update transaction with error
    await supabaseClient
      .from("platform_transactions")
      .update({
        gibrapay_status: "failed",
        gibrapay_error: errorMsg.includes("abort") ? "Timeout aguardando confirmação" : errorMsg,
      })
      .eq("id", transactionId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const gibrapayApiKey = Deno.env.get("GIBRAPAY_API_KEY");
    const gibrapayWalletId = Deno.env.get("GIBRAPAY_WALLET_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!gibrapayApiKey || !gibrapayWalletId) {
      throw new Error("GibaPay credentials not configured");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { 
      phoneNumber, 
      amount, 
      reportId,
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

    if (!reportId || !companyId || !pentesterId) {
      throw new Error("Dados da transação incompletos");
    }

    const cleanedPhone = cleanPhoneNumber(phoneNumber);
    logStep("Cleaned phone number", { cleanedPhone: `***${cleanedPhone.slice(-4)}` });

    // Create transaction record first
    const { data: newTx, error: txError } = await supabaseClient
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
        phone_number: cleanedPhone,
      })
      .select("id")
      .single();

    if (txError) {
      logStep("Error creating transaction", { error: txError.message });
      throw new Error("Erro ao criar registo de transação");
    }

    const transactionId = newTx.id;
    logStep("Transaction created", { transactionId });

    // Start background task to call GibaPay (non-blocking)
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(
      processGibrapayRequest(
        gibrapayApiKey,
        gibrapayWalletId,
        cleanedPhone,
        amount,
        transactionId,
        supabaseUrl,
        supabaseServiceKey
      )
    );

    // Return immediately - don't wait for GibaPay response
    logStep("Returning success - background task started");

    return new Response(JSON.stringify({
      success: true,
      message: "USSD enviado! Confirme o pagamento no seu telefone.",
      transaction_id: transactionId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMsg });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMsg 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
