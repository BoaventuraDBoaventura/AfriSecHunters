import { cn } from '@/lib/utils';
import { SeverityLevel, SEVERITY_LABELS } from '@/types/database';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider";
  
  const severityClasses: Record<SeverityLevel, string> = {
    low: "bg-severity-low/20 text-severity-low border border-severity-low/50",
    medium: "bg-severity-medium/20 text-severity-medium border border-severity-medium/50",
    high: "bg-severity-high/20 text-severity-high border border-severity-high/50",
    critical: "bg-severity-critical/20 text-severity-critical border border-severity-critical/50 animate-pulse",
  };

  return (
    <span className={cn(baseClasses, severityClasses[severity], className)}>
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
