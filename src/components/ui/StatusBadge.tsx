import { cn } from '@/lib/utils';
import { ReportStatus, STATUS_LABELS } from '@/types/database';

interface StatusBadgeProps {
  status: ReportStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider";
  
  const statusClasses: Record<ReportStatus, string> = {
    pending: "bg-muted text-muted-foreground border border-border",
    in_review: "bg-secondary/20 text-secondary border border-secondary/50",
    accepted: "bg-success/20 text-success border border-success/50",
    rejected: "bg-destructive/20 text-destructive border border-destructive/50",
    paid: "bg-primary/20 text-primary border border-primary/50",
  };

  return (
    <span className={cn(baseClasses, statusClasses[status], className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}
