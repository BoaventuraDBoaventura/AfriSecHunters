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

    logStep("Report updated to paid", { reportId, rewardAmount });

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
