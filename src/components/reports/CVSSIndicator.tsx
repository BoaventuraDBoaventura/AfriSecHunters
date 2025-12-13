import { SeverityLevel, CVSS_RANGES } from '@/types/database';
import { Shield } from 'lucide-react';

interface CVSSIndicatorProps {
  severity: SeverityLevel;
  className?: string;
}

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  low: 'text-severity-low',
  medium: 'text-severity-medium',
  high: 'text-severity-high',
  critical: 'text-severity-critical',
};

const SEVERITY_BG: Record<SeverityLevel, string> = {
  low: 'bg-severity-low/20 border-severity-low/50',
  medium: 'bg-severity-medium/20 border-severity-medium/50',
  high: 'bg-severity-high/20 border-severity-high/50',
  critical: 'bg-severity-critical/20 border-severity-critical/50',
};

export function CVSSIndicator({ severity, className }: CVSSIndicatorProps) {
  const range = CVSS_RANGES[severity];
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${SEVERITY_BG[severity]} ${className}`}>
      <div className={`h-10 w-10 rounded-full ${SEVERITY_BG[severity]} flex items-center justify-center`}>
        <Shield className={`h-5 w-5 ${SEVERITY_COLORS[severity]}`} />
      </div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">CVSS Estimado</div>
        <div className={`text-lg font-mono font-bold ${SEVERITY_COLORS[severity]}`}>
          {range.label}
        </div>
      </div>
    </div>
  );
}