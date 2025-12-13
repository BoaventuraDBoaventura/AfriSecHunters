import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface AdminFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onExport: (type: 'users' | 'programs' | 'reports' | 'all') => void;
  quickFilter: string;
  onQuickFilterChange: (filter: string) => void;
}

export function AdminFilters({
  dateRange,
  onDateRangeChange,
  onExport,
  quickFilter,
  onQuickFilterChange,
}: AdminFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleQuickFilter = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onDateRangeChange({ from, to });
    onQuickFilterChange(`${days}d`);
  };

  const clearFilters = () => {
    onDateRangeChange({ from: undefined, to: undefined });
    onQuickFilterChange('all');
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card/50 rounded-lg border border-border mb-6">
      {/* Quick Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={quickFilter} onValueChange={(value) => {
          if (value === 'all') {
            clearFilters();
          } else if (value === '7d') {
            handleQuickFilter(7);
          } else if (value === '30d') {
            handleQuickFilter(30);
          } else if (value === '90d') {
            handleQuickFilter(90);
          }
        }}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Picker */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecionar datas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              onDateRangeChange({ from: range?.from, to: range?.to });
              onQuickFilterChange('custom');
              if (range?.to) {
                setIsCalendarOpen(false);
              }
            }}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {(dateRange.from || dateRange.to) && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export Buttons */}
      <div className="flex items-center gap-2">
        <Select onValueChange={(value) => onExport(value as any)}>
          <SelectTrigger className="w-[160px] h-9">
            <Download className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Exportar CSV" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="users">Exportar Usuários</SelectItem>
            <SelectItem value="programs">Exportar Programas</SelectItem>
            <SelectItem value="reports">Exportar Relatórios</SelectItem>
            <SelectItem value="all">Exportar Tudo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
