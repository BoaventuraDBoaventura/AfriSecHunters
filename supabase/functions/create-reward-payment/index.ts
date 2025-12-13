import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-REWARD-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Client for user authentication
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Admin client for database operations (bypasses RLS)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { reportId, rewardAmount } = await req.json();
    if (!reportId || !rewardAmount) {
      throw new Error("Missing reportId or rewardAmount");
    }
    logStep("Request data parsed", { reportId, rewardAmount });

    // Fetch report details using admin client (bypasses RLS)
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        program:programs!reports_program_id_fkey(
          *,
          company:profiles!programs_company_id_fkey(*)
        ),
        pentester:profiles!reports_pentester_id_fkey(*)
      `)
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }
    logStep("Report fetched", { reportId: report.id, status: report.status });

    // Verify the user is the company owner
    if (report.program.company_id !== user.id) {
      throw new Error("Not authorized to pay this report");
    }
    logStep("Company ownership verified");

    // Calculate amounts - 10% platform commission
    const platformCommissionRate = 0.10;
    const rewardAmountCents = Math.round(rewardAmount * 100); // Convert MZN to cents
    const platformFee = Math.round(rewardAmountCents * platformCommissionRate);
    const totalAmount = rewardAmountCents + platformFee;
    
    logStep("Payment amounts calculated", {
      rewardAmount,
      rewardAmountCents,
      platformFee,
      totalAmount,
      platformCommissionRate: `${platformCommissionRate * 100}%`
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if company already has a Stripe customer record
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    // Create checkout session for the payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mzn',
            product_data: {
              name: `Recompensa: ${report.title}`,
              description: `Pagamento de recompensa para ${report.pentester?.display_name || 'Hunter'}`,
            },
            unit_amount: rewardAmountCents,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'mzn',
            product_data: {
              name: 'Taxa de Plataforma (10%)',
              description: 'Comissão AfriSec Hunters',
            },
            unit_amount: platformFee,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/company-dashboard?payment=success&report=${reportId}`,
      cancel_url: `${req.headers.get("origin")}/company-dashboard?payment=cancelled`,
      metadata: {
        report_id: reportId,
        reward_amount: rewardAmount.toString(),
        pentester_id: report.pentester_id,
        company_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
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
