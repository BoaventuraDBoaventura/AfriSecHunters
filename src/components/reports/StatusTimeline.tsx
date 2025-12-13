import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReportStatusHistory, STATUS_LABELS, ReportStatus } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, 
  Search, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  ArrowRight,
  FileText
} from 'lucide-react';

interface StatusTimelineProps {
  reportId: string;
  currentStatus: ReportStatus;
  createdAt: string;
}

const STATUS_ICONS: Record<ReportStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  in_review: <Search className="h-4 w-4" />,
  accepted: <CheckCircle className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
  paid: <DollarSign className="h-4 w-4" />,
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'text-muted-foreground border-muted-foreground/50 bg-muted/20',
  in_review: 'text-secondary border-secondary/50 bg-secondary/20',
  accepted: 'text-success border-success/50 bg-success/20',
  rejected: 'text-destructive border-destructive/50 bg-destructive/20',
  paid: 'text-primary border-primary/50 bg-primary/20',
};

export function StatusTimeline({ reportId, currentStatus, createdAt }: StatusTimelineProps) {
  const [history, setHistory] = useState<ReportStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [reportId]);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('report_status_history')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setHistory(data as ReportStatusHistory[]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-muted/30 rounded" />
        ))}
      </div>
    );
  }

  // Build timeline including creation
  const timeline: {
    id: string;
    status: ReportStatus;
    oldStatus?: ReportStatus | null;
    label: string;
    date: string;
    notes?: string | null;
    isCreation: boolean;
  }[] = [
    {
      id: 'created',
      status: 'pending' as ReportStatus,
      label: 'Relatório Criado',
      date: createdAt,
      isCreation: true,
    },
    ...history.map(h => ({
      id: h.id,
      status: h.new_status,
      oldStatus: h.old_status,
      label: STATUS_LABELS[h.new_status],
      date: h.created_at,
      notes: h.notes,
      isCreation: false,
    })),
  ];

  return (
    <div className="space-y-1">
      {timeline.map((item, index) => (
        <div key={item.id} className="relative">
          {/* Connector line */}
          {index < timeline.length - 1 && (
            <div className="absolute left-5 top-10 w-0.5 h-full bg-border" />
          )}
          
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors">
            {/* Icon */}
            <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${STATUS_COLORS[item.status]}`}>
              {item.isCreation ? <FileText className="h-4 w-4" /> : STATUS_ICONS[item.status]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {!item.isCreation && item.oldStatus && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {STATUS_LABELS[item.oldStatus]}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </>
                )}
                <span className={`text-sm font-medium ${item.status === currentStatus ? 'text-primary' : 'text-foreground'}`}>
                  {item.label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(new Date(item.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </div>
              {item.notes && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  "{item.notes}"
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}