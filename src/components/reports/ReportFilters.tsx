import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SeverityLevel, ReportStatus, SEVERITY_LABELS, STATUS_LABELS } from '@/types/database';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface ReportFiltersProps {
  onSearchChange: (search: string) => void;
  onSeverityChange: (severity: SeverityLevel | 'all') => void;
  onStatusChange: (status: ReportStatus | 'all') => void;
  onSortChange: (sort: 'date_desc' | 'date_asc' | 'severity') => void;
  search: string;
  severity: SeverityLevel | 'all';
  status: ReportStatus | 'all';
  sort: 'date_desc' | 'date_asc' | 'severity';
}

export function ReportFilters({
  onSearchChange,
  onSeverityChange,
  onStatusChange,
  onSortChange,
  search,
  severity,
  status,
  sort,
}: ReportFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = severity !== 'all' || status !== 'all' || search.length > 0;

  const clearFilters = () => {
    onSearchChange('');
    onSeverityChange('all');
    onStatusChange('all');
    onSortChange('date_desc');
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-input border-border focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-border ${showFilters || hasActiveFilters ? 'border-primary text-primary' : ''}`}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {(severity !== 'all' ? 1 : 0) + (status !== 'all' ? 1 : 0) + (search.length > 0 ? 1 : 0)}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Severidade</label>
            <Select value={severity} onValueChange={(v) => onSeverityChange(v as SeverityLevel | 'all')}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Status</label>
            <Select value={status} onValueChange={(v) => onStatusChange(v as ReportStatus | 'all')}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Ordenar por</label>
            <Select value={sort} onValueChange={(v) => onSortChange(v as 'date_desc' | 'date_asc' | 'severity')}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Mais recentes</SelectItem>
                <SelectItem value="date_asc">Mais antigos</SelectItem>
                <SelectItem value="severity">Severidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}