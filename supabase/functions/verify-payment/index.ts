import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { reportId } = await req.json();
    if (!reportId) {
      throw new Error("Missing reportId");
    }
    logStep("Request data parsed", { reportId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Search for completed checkout sessions with this report ID
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    const matchingSession = sessions.data.find(
      (session: Stripe.Checkout.Session) => session.metadata?.report_id === reportId && session.payment_status === 'paid'
    );

    if (!matchingSession) {
      logStep("No paid session found for report", { reportId });
      return new Response(JSON.stringify({ paid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found paid session", { sessionId: matchingSession.id });

    // Get the reward amount from metadata
    const rewardAmount = parseFloat(matchingSession.metadata?.reward_amount || '0');

    // Fetch report details to get company and pentester IDs
    const { data: report, error: reportFetchError } = await supabaseAdmin
      .from('reports')
      .select('*, program:programs!reports_program_id_fkey(*)')
      .eq('id', reportId)
      .single();

    if (reportFetchError || !report) {
      logStep("Error fetching report", { error: reportFetchError?.message });
      throw new Error(`Failed to fetch report: ${reportFetchError?.message}`);
    }

    // Calculate platform fee (10%)
    const platformFee = rewardAmount * 0.10;
    const netAmount = rewardAmount - platformFee;

    // Update the report status to paid
    const { error: updateError } = await supabaseAdmin
      .from('reports')
      .update({
        status: 'paid',
        reward_amount: rewardAmount,
      })
      .eq('id', reportId);

    if (updateError) {
      logStep("Error updating report", { error: updateError.message });
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    // Record the transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('platform_transactions')
      .insert({
        report_id: reportId,
        company_id: report.program?.company_id,
        pentester_id: report.pentester_id,
        gross_amount: rewardAmount,
        platform_fee: platformFee,
        net_amount: netAmount,
        stripe_session_id: matchingSession.id,
        stripe_payment_intent: matchingSession.payment_intent as string,
        status: 'completed',
        completed_at: new Date().toISOString(),
        payout_type: 'pending',
      })
      .select()
      .single();

    if (transactionError) {
      logStep("Error recording transaction", { error: transactionError.message });
      // Don't throw - the payment was successful, just log the error
    } else {
      logStep("Transaction recorded", { platformFee, netAmount, transactionId: transaction?.id });
    }

    logStep("Report updated to paid", { reportId, rewardAmount, platformFee, netAmount });

    // Trigger automatic GibaPay payout
    try {
      const gibrapayResponse = await fetch(
        `${supabaseUrl}/functions/v1/process-gibrapay-payout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ 
            reportId, 
            transactionId: transaction?.id 
          }),
        }
      );
      
      const gibrapayResult = await gibrapayResponse.json();
      logStep("GibaPay payout result", gibrapayResult);
    } catch (gibrapayError) {
      logStep("GibaPay payout failed", { error: gibrapayError instanceof Error ? gibrapayError.message : String(gibrapayError) });
      // Don't throw - the Stripe payment was successful, payout can be retried later
    }

    return new Response(JSON.stringify({ 
      paid: true, 
      rewardAmount,
      sessionId: matchingSession.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
