import { useState } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, FileText, Download, Percent, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportToCsv } from '@/lib/exportCsv';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminPendingPayouts } from './AdminPendingPayouts';

interface Transaction {
  id: string;
  report_id: string;
  company_id: string;
  pentester_id: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface AdminFinanceProps {
  dateFrom?: Date;
  dateTo?: Date;
}

export function AdminFinance({ dateFrom, dateTo }: AdminFinanceProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, [dateFrom, dateTo]);

  const fetchTransactions = async () => {
    setLoading(true);
    let query = supabase
      .from('platform_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (dateFrom) {
      query = query.gte('created_at', dateFrom.toISOString());
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endOfDay.toISOString());
    }

    const { data, error } = await query;

    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const totalGross = transactions.reduce((sum, t) => sum + Number(t.gross_amount), 0);
  const totalFees = transactions.reduce((sum, t) => sum + Number(t.platform_fee), 0);
  const totalNet = transactions.reduce((sum, t) => sum + Number(t.net_amount), 0);

  // Prepare chart data
  const chartData = transactions
    .slice()
    .reverse()
    .reduce((acc: { date: string; fees: number }[], t) => {
      const date = format(new Date(t.created_at), 'dd/MM', { locale: ptBR });
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing.fees += Number(t.platform_fee);
      } else {
        acc.push({ date, fees: Number(t.platform_fee) });
      }
      return acc;
    }, []);

  const handleExport = () => {
    exportToCsv(transactions, 'transacoes', [
      { key: 'id', label: 'ID' },
      { key: 'report_id', label: 'Report ID' },
      { key: 'gross_amount', label: 'Valor Bruto (MZN)' },
      { key: 'platform_fee', label: 'Comissão (MZN)' },
      { key: 'net_amount', label: 'Valor Líquido (MZN)' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Data' },
    ]);
    toast({ title: 'Exportado!', description: 'CSV de transações baixado.' });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Visão Geral
        </TabsTrigger>
        <TabsTrigger value="payouts" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Pagamentos a Hunters
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <CyberCard className="text-center">
            <FileText className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold font-mono text-primary">{transactions.length}</div>
            <div className="text-sm text-muted-foreground">Total Transações</div>
          </CyberCard>

          <CyberCard className="text-center">
            <DollarSign className="h-6 w-6 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold font-mono text-secondary">
              MZN {totalGross.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Volume Total</div>
          </CyberCard>

          <CyberCard glow className="text-center">
            <Percent className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold font-mono text-primary">
              MZN {totalFees.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Comissões da Plataforma</div>
          </CyberCard>

          <CyberCard className="text-center">
            <TrendingUp className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold font-mono text-yellow-500">
              MZN {totalNet.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Pago aos Hunters</div>
          </CyberCard>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <CyberCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Comissões ao Longo do Tempo
              </h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`MZN ${value.toLocaleString()}`, 'Comissão']}
                  />
                  <Line
                    type="monotone"
                    dataKey="fees"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CyberCard>
        )}

        {/* Transactions Table */}
        <CyberCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Histórico de Transações
            </h3>
            <Button variant="outline" size="sm" onClick={handleExport} className="border-primary text-primary hover:bg-primary/10">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Report ID</th>
                    <th className="py-3 px-4">Valor Bruto</th>
                    <th className="py-3 px-4">Comissão (10%)</th>
                    <th className="py-3 px-4">Valor Líquido</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-primary/5">
                      <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                        {format(new Date(t.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                        {t.report_id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground">
                        MZN {Number(t.gross_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-primary font-semibold">
                        MZN {Number(t.platform_fee).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-secondary">
                        MZN {Number(t.net_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          t.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'
                        }`}>
                          {t.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CyberCard>
      </TabsContent>

      <TabsContent value="payouts">
        <AdminPendingPayouts dateFrom={dateFrom} dateTo={dateTo} />
      </TabsContent>
    </Tabs>
  );
}