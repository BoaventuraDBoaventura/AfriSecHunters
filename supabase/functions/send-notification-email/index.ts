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

interface NotificationRequest {
  type: "report_accepted" | "new_report_received";
  reportId: string;
  pentesterId?: string;
  companyId?: string;
  reportTitle: string;
  programTitle: string;
  severity?: string;
  rewardAmount?: number;
}

const logStep = (step: string, details?: any) => {
  console.log(`[NOTIFICATION EMAIL] ${step}`, details ? JSON.stringify(details) : '');
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

const getSeverityLabel = (severity: string): string => {
  const labels: Record<string, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica"
  };
  return labels[severity] || severity;
};

const getReportAcceptedEmail = (pentesterName: string, reportTitle: string, programTitle: string, severity: string, rewardAmount?: number): { subject: string; html: string } => {
  return {
    subject: `🎉 Seu relatório foi aceito - ${programTitle}`,
    html: `
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
          .reward-box { background: linear-gradient(135deg, #00FF41 0%, #00cc33 100%); color: #0a0a0a; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .reward-amount { font-size: 32px; font-weight: bold; }
          .reward-label { font-size: 14px; opacity: 0.8; }
          .footer { text-align: center; color: #525252; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🛡️ AfriSec Hunters</div>
          </div>
          <div class="card">
            <h1 class="title">Parabéns, ${pentesterName}! 🎉</h1>
            <p class="text">
              Seu relatório de vulnerabilidade foi <span class="highlight">aceito</span> pela empresa!
            </p>
            <p class="text">
              <strong>Relatório:</strong> ${reportTitle}<br>
              <strong>Programa:</strong> ${programTitle}<br>
              ${severity ? `<strong>Severidade:</strong> ${getSeverityLabel(severity)}<br>` : ''}
            </p>
            ${rewardAmount ? `
              <div class="reward-box">
                <div class="reward-label">Recompensa</div>
                <div class="reward-amount">MZN ${rewardAmount.toLocaleString('pt-BR')}</div>
              </div>
              <p class="text">
                O pagamento será processado em breve. Você pode acompanhar o status no seu dashboard.
              </p>
            ` : ''}
          </div>
          <div class="footer">
            <p>AfriSec Hunters - Plataforma de Bug Bounty</p>
            <p>Este email foi enviado automaticamente, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

const getNewReportReceivedEmail = (companyName: string, reportTitle: string, programTitle: string, severity: string): { subject: string; html: string } => {
  return {
    subject: `🔔 Novo relatório recebido - ${programTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #e5e5e5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { color: #00FF41; font-size: 24px; font-weight: bold; }
          .card { background-color: #1a1a1a; border: 1px solid #3b82f6; border-radius: 8px; padding: 30px; margin-bottom: 20px; }
          .title { color: #3b82f6; font-size: 20px; margin-bottom: 15px; }
          .text { color: #a3a3a3; line-height: 1.6; margin-bottom: 15px; }
          .highlight { color: #3b82f6; font-weight: bold; }
          .severity-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .severity-low { background-color: #22c55e; color: white; }
          .severity-medium { background-color: #f59e0b; color: white; }
          .severity-high { background-color: #f97316; color: white; }
          .severity-critical { background-color: #ef4444; color: white; }
          .footer { text-align: center; color: #525252; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🛡️ AfriSec Hunters</div>
          </div>
          <div class="card">
            <h1 class="title">Novo Relatório de Vulnerabilidade 🔔</h1>
            <p class="text">
              Olá ${companyName}, um novo relatório foi submetido ao seu programa.
            </p>
            <p class="text">
              <strong>Relatório:</strong> ${reportTitle}<br>
              <strong>Programa:</strong> ${programTitle}<br>
              ${severity ? `<strong>Severidade:</strong> <span class="severity-badge severity-${severity}">${getSeverityLabel(severity)}</span><br>` : ''}
            </p>
            <p class="text">
              Acesse o dashboard da empresa para revisar os detalhes do relatório e tomar as ações necessárias.
            </p>
          </div>
          <div class="footer">
            <p>AfriSec Hunters - Plataforma de Bug Bounty</p>
            <p>Este email foi enviado automaticamente, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();
    logStep("Received notification request", { type: data.type, reportId: data.reportId });

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let emailContent: { subject: string; html: string };
    let recipientEmail: string;

    if (data.type === "report_accepted" && data.pentesterId) {
      // Get pentester email and name
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(data.pentesterId);
      if (authError || !authUser?.user?.email) {
        logStep("Could not get pentester email", { error: authError });
        throw new Error("Could not get pentester email");
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', data.pentesterId)
        .single();

      recipientEmail = authUser.user.email;
      const pentesterName = profile?.display_name || 'Hunter';
      emailContent = getReportAcceptedEmail(pentesterName, data.reportTitle, data.programTitle, data.severity || '', data.rewardAmount);
      
    } else if (data.type === "new_report_received" && data.companyId) {
      // Get company email and name
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(data.companyId);
      if (authError || !authUser?.user?.email) {
        logStep("Could not get company email", { error: authError });
        throw new Error("Could not get company email");
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, display_name')
        .eq('id', data.companyId)
        .single();

      recipientEmail = authUser.user.email;
      const companyName = profile?.company_name || profile?.display_name || 'Empresa';
      emailContent = getNewReportReceivedEmail(companyName, data.reportTitle, data.programTitle, data.severity || '');
      
    } else {
      throw new Error(`Invalid notification type or missing user ID: ${data.type}`);
    }

    logStep("Sending email", { to: recipientEmail, subject: emailContent.subject });

    const emailResponse = await sendEmail(
      recipientEmail,
      emailContent.subject,
      emailContent.html
    );

    logStep("Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
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
