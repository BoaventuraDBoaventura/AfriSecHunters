import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

export function useRealtimeNotifications() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!user || !profile || isSubscribed.current) return;

    isSubscribed.current = true;
    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Listen for new messages on user's reports
    const messagesChannel = supabase
      .channel('realtime-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMessage = payload.new as { 
            id: string; 
            report_id: string; 
            sender_id: string; 
            content: string;
          };

          // Don't notify for own messages
          if (newMessage.sender_id === user.id) return;

          // Check if this message is relevant to the user
          // For pentesters: messages on their reports
          // For companies: messages on reports for their programs
          const { data: report } = await supabase
            .from('reports')
            .select(`
              id,
              title,
              pentester_id,
              program:programs!reports_program_id_fkey(company_id)
            `)
            .eq('id', newMessage.report_id)
            .single();

          if (!report) return;

          const isRelevant = 
            (profile.role === 'pentester' && report.pentester_id === user.id) ||
            (profile.role === 'company' && report.program?.company_id === user.id);

          if (!isRelevant) return;

          // Don't show notification if user is on the report page
          if (location.pathname === `/reports/${report.id}`) return;

          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', newMessage.sender_id)
            .single();

          toast({
            title: '💬 Nova mensagem',
            description: `${sender?.display_name || 'Alguém'}: "${newMessage.content.slice(0, 50)}${newMessage.content.length > 50 ? '...' : ''}"`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    channels.push(messagesChannel);

    // Listen for new reports (for companies only)
    if (profile.role === 'company') {
      const reportsChannel = supabase
        .channel('realtime-reports-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reports'
          },
          async (payload) => {
            const newReport = payload.new as {
              id: string;
              title: string;
              severity: string;
              program_id: string;
            };

            // Check if this report is for company's program
            const { data: program } = await supabase
              .from('programs')
              .select('company_id, title')
              .eq('id', newReport.program_id)
              .single();

            if (!program || program.company_id !== user.id) return;

            const severityEmoji = {
              critical: '🔴',
              high: '🟠',
              medium: '🟡',
              low: '🟢'
            }[newReport.severity] || '⚪';

            toast({
              title: `${severityEmoji} Novo relatório recebido!`,
              description: `"${newReport.title}" em ${program.title}`,
              duration: 8000,
            });
          }
        )
        .subscribe();

      channels.push(reportsChannel);
    }

    // Listen for report status updates (for pentesters)
    if (profile.role === 'pentester') {
      const statusChannel = supabase
        .channel('realtime-status-notifications')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'reports'
          },
          async (payload) => {
            const updatedReport = payload.new as {
              id: string;
              title: string;
              status: string;
              pentester_id: string;
              reward_amount: number | null;
            };
            const oldReport = payload.old as { status: string };

            // Only notify if it's user's report and status changed
            if (updatedReport.pentester_id !== user.id) return;
            if (updatedReport.status === oldReport.status) return;

            const statusMessages: Record<string, { emoji: string; text: string }> = {
              in_review: { emoji: '👀', text: 'está em análise' },
              accepted: { emoji: '✅', text: 'foi aceito!' },
              rejected: { emoji: '❌', text: 'foi rejeitado' },
              paid: { emoji: '💰', text: `foi pago! R$ ${updatedReport.reward_amount?.toLocaleString() || '0'}` }
            };

            const status = statusMessages[updatedReport.status];
            if (!status) return;

            toast({
              title: `${status.emoji} Atualização de relatório`,
              description: `"${updatedReport.title}" ${status.text}`,
              duration: 8000,
            });
          }
        )
        .subscribe();

      channels.push(statusChannel);
    }

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
      isSubscribed.current = false;
    };
  }, [user, profile, toast, location.pathname]);
}