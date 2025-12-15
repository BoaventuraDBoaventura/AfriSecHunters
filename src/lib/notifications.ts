import { supabase } from "@/integrations/supabase/client";

export const notifyReportAccepted = async (
  reportId: string,
  pentesterId: string,
  reportTitle: string,
  programTitle: string,
  severity: string,
  rewardAmount?: number
) => {
  try {
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'report_accepted',
        reportId,
        pentesterId,
        reportTitle,
        programTitle,
        severity,
        rewardAmount
      }
    });

    if (error) {
      console.error('Error sending report accepted notification:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error invoking notification function:', error);
    return false;
  }
};

export const notifyNewReport = async (
  reportId: string,
  companyId: string,
  reportTitle: string,
  programTitle: string,
  severity: string
) => {
  try {
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'new_report_received',
        reportId,
        companyId,
        reportTitle,
        programTitle,
        severity
      }
    });

    if (error) {
      console.error('Error sending new report notification:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error invoking notification function:', error);
    return false;
  }
};
