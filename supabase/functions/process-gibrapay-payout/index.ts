import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GIBRAPAY-PAYOUT] ${step}${detailsStr}`);
};

interface GibrapayTransferResponse {
  success: boolean;
  message?: string;
  transaction_id?: string;
  error?: string;
}

async function makeGibrapayTransfer(
  apiKey: string,
  walletId: string,
  phoneNumber: string,
  amount: number,
  reference: string
): Promise<GibrapayTransferResponse> {
  logStep("Making GibaPay transfer", { phoneNumber: phoneNumber.slice(-4), amount, reference });
  
  try {
    const response = await fetch("https://gibrapay.online/v1/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Key": apiKey,
      },
      body: JSON.stringify({
        wallet_id: walletId,
        number_phone: phoneNumber,
        amount: amount,
      }),
    });

    const data = await response.json();
    logStep("GibaPay response", { status: response.status, data });

    // GibaPay returns status: "success" in data.status field
    const isSuccess = response.ok && data.status === "success";
    
    if (isSuccess) {
      return {
        success: true,
        transaction_id: data.data?.id || data.transaction_id,
        message: data.message,
      };
    }

    return {
      success: false,
      error: data.message || data.error || "Transfer failed",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logStep("GibaPay transfer error", { error: errorMsg });
    return {
      success: false,
      error: errorMsg || "Network error",
    };
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
    const platformMpesaNumber = Deno.env.get("PLATFORM_MPESA_NUMBER");

    if (!gibrapayApiKey || !gibrapayWalletId) {
      throw new Error("GibaPay credentials not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { reportId, transactionId, directPayment, phoneNumber: providedPhoneNumber, walletType, rewardAmount: providedRewardAmount } = await req.json();
    logStep("Processing payout", { reportId, transactionId, directPayment, providedPhoneNumber: providedPhoneNumber ? providedPhoneNumber.slice(-4) : null, walletType });

    if (!reportId) {
      throw new Error("Report ID is required");
    }

    // Fetch report with pentester and program info
    const { data: report, error: reportError } = await supabaseClient
      .from("reports")
      .select(`
        *,
        pentester:profiles!reports_pentester_id_fkey(
          id, display_name, payout_method, payout_details
        ),
        program:programs!reports_program_id_fkey(
          company_id
        )
      `)
      .eq("id", reportId)
      .maybeSingle();

    if (reportError || !report) {
      throw new Error(`Report not found: ${reportError?.message || "No data"}`);
    }

    // Use provided reward amount or fall back to report's reward_amount
    const effectiveRewardAmount = providedRewardAmount || report.reward_amount;

    logStep("Report found", { 
      pentesterId: report.pentester_id,
      rewardAmount: effectiveRewardAmount,
      payoutMethod: report.pentester?.payout_method
    });

    const pentester = report.pentester;
    
    // Determine phone number: use provided number from company, or fall back to pentester's configured number
    let phoneNumber = providedPhoneNumber;
    let payoutMethod = walletType || 'mpesa';
    
    if (!phoneNumber) {
      // Fall back to pentester's configured payout details
      const pentesterPayoutMethod = pentester?.payout_method;
      const payoutDetails = pentester?.payout_details;
      
      // Check if payout method is M-Pesa or E-Mola
      if (pentesterPayoutMethod !== "mpesa" && pentesterPayoutMethod !== "emola") {
        logStep("Payout method not automatic", { payoutMethod: pentesterPayoutMethod });
        
        // Update transaction to manual payout
        if (transactionId) {
          await supabaseClient
            .from("platform_transactions")
            .update({ payout_type: "manual" })
            .eq("id", transactionId);
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          automatic: false,
          message: "Payout method requires manual transfer" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      phoneNumber = payoutDetails?.phone_number;
      payoutMethod = pentesterPayoutMethod;
    }
    
    if (!phoneNumber) {
      throw new Error("Número de telefone não fornecido");
    }

    // Fetch platform fee from database
    const { data: feeData } = await supabaseClient
      .rpc('get_platform_fee');
    
    const platformFeePercentage = feeData ? parseFloat(String(feeData)) / 100 : 0.10;
    logStep("Platform fee fetched", { percentage: platformFeePercentage * 100 });

    const grossAmount = effectiveRewardAmount || 0;
    const platformFee = Math.round(grossAmount * platformFeePercentage * 100) / 100;
    const netAmount = Math.round((grossAmount - platformFee) * 100) / 100;

    logStep("Calculated amounts", { grossAmount, platformFee, netAmount });

    // For direct payments (company paying via mobile wallet), create transaction record first
    let existingTransactionId = transactionId;
    if (directPayment && !transactionId) {
      const { data: newTx, error: txError } = await supabaseClient
        .from("platform_transactions")
        .insert({
          report_id: reportId,
          company_id: report.program?.company_id,
          pentester_id: report.pentester_id,
          gross_amount: grossAmount,
          platform_fee: platformFee,
          net_amount: netAmount,
          status: "completed",
          payout_type: "pending",
          gibrapay_status: "processing",
        })
        .select("id")
        .single();

      if (txError) {
        logStep("Error creating transaction", { error: txError.message });
      } else {
        existingTransactionId = newTx.id;
        logStep("Created transaction record", { transactionId: existingTransactionId });
      }
    }
    // Transfer to pentester
    const pentesterReference = `REP-${reportId.slice(0, 8)}-PENT`;
    const pentesterTransfer = await makeGibrapayTransfer(
      gibrapayApiKey,
      gibrapayWalletId,
      phoneNumber,
      netAmount,
      pentesterReference
    );

    let platformTransfer: GibrapayTransferResponse = { success: true };
    
    // Transfer platform fee if configured
    if (platformMpesaNumber && platformFee > 0) {
      const platformReference = `REP-${reportId.slice(0, 8)}-PLAT`;
      platformTransfer = await makeGibrapayTransfer(
        gibrapayApiKey,
        gibrapayWalletId,
        platformMpesaNumber,
        platformFee,
        platformReference
      );
    }

    // Determine overall status
    const overallSuccess = pentesterTransfer.success;
    const gibrapayStatus = overallSuccess ? "complete" : "failed";
    const payoutType = payoutMethod === "emola" ? "automatic_emola" : "automatic_mpesa";

    // Update transaction record
    const updateData: Record<string, unknown> = {
      gibrapay_pentester_tx_id: pentesterTransfer.transaction_id || null,
      gibrapay_platform_tx_id: platformTransfer.transaction_id || null,
      gibrapay_status: gibrapayStatus,
      gibrapay_error: pentesterTransfer.error || platformTransfer.error || null,
      payout_type: payoutType,
    };

    if (overallSuccess) {
      updateData.pentester_paid = true;
      updateData.pentester_paid_at = new Date().toISOString();
      updateData.pentester_payment_reference = pentesterTransfer.transaction_id;
    }

    if (existingTransactionId) {
      await supabaseClient
        .from("platform_transactions")
        .update(updateData)
        .eq("id", existingTransactionId);
    } else {
      // Find and update by report_id
      await supabaseClient
        .from("platform_transactions")
        .update(updateData)
        .eq("report_id", reportId);
    }

    // For direct payment, also update the report status to 'paid'
    if (directPayment && overallSuccess) {
      await supabaseClient
        .from("reports")
        .update({ status: "paid" })
        .eq("id", reportId);
      logStep("Report status updated to paid");
    }

    logStep("Payout complete", { 
      success: overallSuccess,
      pentesterTxId: pentesterTransfer.transaction_id,
      platformTxId: platformTransfer.transaction_id
    });

    return new Response(JSON.stringify({
      success: overallSuccess,
      automatic: true,
      pentester_transaction_id: pentesterTransfer.transaction_id,
      platform_transaction_id: platformTransfer.transaction_id,
      error: pentesterTransfer.error || platformTransfer.error,
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
      status: 500,
    });
  }
});
