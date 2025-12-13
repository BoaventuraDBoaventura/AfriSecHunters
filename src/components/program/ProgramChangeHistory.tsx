import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { History, ChevronDown, ChevronUp, FileEdit, Archive, ArchiveRestore, PlusCircle, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChangeHistoryEntry {
  id: string;
  program_id: string;
  changed_by: string;
  change_type: string;
  changes: Record<string, { old: any; new: any } | string> | null;
  created_at: string;
}

interface ProgramChangeHistoryProps {
  programId: string;
}

const CHANGE_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  created: { label: 'Criado', icon: <PlusCircle className="h-4 w-4" />, color: 'text-success' },
  updated: { label: 'Atualizado', icon: <FileEdit className="h-4 w-4" />, color: 'text-secondary' },
  archived: { label: 'Arquivado', icon: <Archive className="h-4 w-4" />, color: 'text-warning' },
  restored: { label: 'Restaurado', icon: <ArchiveRestore className="h-4 w-4" />, color: 'text-primary' },
};

const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  description: 'Descrição',
  is_active: 'Status Ativo',
  is_archived: 'Arquivado',
  reward_low: 'Recompensa Baixa',
  reward_medium: 'Recompensa Média',
  reward_high: 'Recompensa Alta',
  reward_critical: 'Recompensa Crítica',
  scope: 'Escopo',
  out_of_scope: 'Fora do Escopo',
  rules: 'Regras',
};

export function ProgramChangeHistory({ programId }: ProgramChangeHistoryProps) {
  const [history, setHistory] = useState<ChangeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHistory();
  }, [programId]);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('program_change_history')
      .select('*')
      .eq('program_id', programId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setHistory(data as ChangeHistoryEntry[]);
    }
    setLoading(false);
  };

  const toggleItemExpanded = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedItems(newSet);
  };

  const renderChangeValue = (key: string, value: any): string => {
    if (key === 'is_active' || key === 'is_archived') {
      return value ? 'Sim' : 'Não';
    }
    if (Array.isArray(value)) {
      return value.join(', ') || '(vazio)';
    }
    if (typeof value === 'number') {
      return `MZN ${value.toLocaleString('pt-MZ')}`;
    }
    if (value === null || value === undefined || value === '') {
      return '(vazio)';
    }
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="animate-pulse h-20 bg-muted/30 rounded-lg" />
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="h-5 w-5" />
          <span className="font-medium">Histórico de Alterações</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
            {history.length} {history.length === 1 ? 'alteração' : 'alterações'}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {history.map((entry) => {
            const typeInfo = CHANGE_TYPE_LABELS[entry.change_type] || { 
              label: entry.change_type, 
              icon: <FileEdit className="h-4 w-4" />, 
              color: 'text-muted-foreground' 
            };
            const isItemExpanded = expandedItems.has(entry.id);
            const hasDetails = entry.changes && Object.keys(entry.changes).length > 0;

            return (
              <div 
                key={entry.id} 
                className="border border-border/50 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => hasDetails && toggleItemExpanded(entry.id)}
                  className={`w-full flex items-center justify-between p-3 ${hasDetails ? 'hover:bg-muted/30 cursor-pointer' : 'cursor-default'} transition-colors`}
                  disabled={!hasDetails}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${typeInfo.color}`}>
                      {typeInfo.icon}
                    </div>
                    <div className="text-left">
                      <span className={`font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  {hasDetails && (
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isItemExpanded ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {isItemExpanded && entry.changes && (
                  <div className="px-3 pb-3 pt-0 border-t border-border/30">
                    <div className="mt-2 space-y-2">
                      {Object.entries(entry.changes).map(([field, change]) => {
                        const fieldLabel = FIELD_LABELS[field] || field;
                        
                        if (typeof change === 'string') {
                          return (
                            <div key={field} className="text-xs">
                              <span className="text-muted-foreground">{fieldLabel}:</span>{' '}
                              <span className="text-foreground">{change}</span>
                            </div>
                          );
                        }
                        
                        const typedChange = change as { old: any; new: any };
                        return (
                          <div key={field} className="text-xs space-y-1">
                            <span className="text-muted-foreground font-medium">{fieldLabel}</span>
                            <div className="flex items-center gap-2 pl-2">
                              <span className="text-destructive/70 line-through">
                                {renderChangeValue(field, typedChange.old)}
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-success">
                                {renderChangeValue(field, typedChange.new)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
