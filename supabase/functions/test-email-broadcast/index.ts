import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AfriSec Hunters <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  return response.json();
};

const getTestEmailHtml = (userName: string, userRole: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #e5e5e5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { color: #00FF41; font-size: 24px; font-weight: bold; }
    .card { background-color: #1a1a1a; border: 1px solid #00FF41; border-radius: 8px; padding: 30px; margin-bottom: 20px; }
    .title { color: #00FF41; font-size: 20px; margin-bottom: 15px; }
    .text { color: #a3a3a3; line-height: 1.6; margin-bottom: 15px; }
    .highlight { color: #00FF41; font-weight: bold; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; background-color: #00FF41; color: #0a0a0a; }
    .footer { text-align: center; color: #525252; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️ AfriSec Hunters</div>
    </div>
    <div class="card">
      <h1 class="title">Email de Teste ✅</h1>
      <p class="text">
        Olá <span class="highlight">${userName}</span>!
      </p>
      <p class="text">
        Este é um email de teste do sistema de notificações da AfriSec Hunters.
      </p>
      <p class="text">
        <strong>Seu perfil:</strong> <span class="badge">${userRole === 'company' ? 'Empresa' : 'Pentester'}</span>
      </p>
      <p class="text">
        Se você recebeu este email, significa que as notificações estão funcionando corretamente! 🎉
      </p>
    </div>
    <div class="footer">
      <p>AfriSec Hunters - Plataforma de Bug Bounty</p>
      <p>Este email foi enviado automaticamente para teste.</p>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[TEST EMAIL] Starting test email broadcast");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, company_name, role');

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    console.log(`[TEST EMAIL] Found ${profiles?.length || 0} users`);

    const results: any[] = [];

    for (const profile of profiles || []) {
      try {
        // Get user email from auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
        
        if (authError || !authUser?.user?.email) {
          console.log(`[TEST EMAIL] Could not get email for user ${profile.id}:`, authError);
          results.push({ userId: profile.id, name: profile.display_name, success: false, error: 'No email found' });
          continue;
        }

        const userName = profile.company_name || profile.display_name || 'Usuário';
        const email = authUser.user.email;

        console.log(`[TEST EMAIL] Sending to ${email} (${userName})`);

        const emailResponse = await sendEmail(
          email,
          "🧪 Teste de Notificação - AfriSec Hunters",
          getTestEmailHtml(userName, profile.role)
        );

        console.log(`[TEST EMAIL] Response for ${email}:`, emailResponse);

        results.push({
          userId: profile.id,
          name: userName,
          email: email,
          role: profile.role,
          success: !emailResponse.error,
          response: emailResponse
        });
      } catch (error: any) {
        console.error(`[TEST EMAIL] Error for user ${profile.id}:`, error);
        results.push({
          userId: profile.id,
          name: profile.display_name,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[TEST EMAIL] Completed: ${successCount}/${results.length} emails sent successfully`);

    return new Response(JSON.stringify({ 
      success: true, 
      totalUsers: results.length,
      successfulSends: successCount,
      results 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[TEST EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
