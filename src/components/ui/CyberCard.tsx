import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CyberCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
}

export function CyberCard({ children, className, glow = false, hover = true }: CyberCardProps) {
  return (
    <div 
      className={cn(
        "relative bg-card border border-border rounded-lg p-6",
        "before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:pointer-events-none",
        glow && "box-glow",
        hover && "transition-all duration-300 hover:border-primary/50 hover:box-glow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
