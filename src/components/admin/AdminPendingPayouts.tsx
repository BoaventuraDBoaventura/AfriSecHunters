import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CyberCard } from '@/components/ui/CyberCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  Download, 
  User,
  Building2,
  CreditCard,
  Phone,
  Mail,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportToCsv } from '@/lib/exportCsv';
import { exportToPdf } from '@/lib/exportPdf';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface PendingPayout {
  id: string;
  report_id: string;
  pentester_id: string;
  company_id: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  created_at: string;
  pentester_paid: boolean;
  payout_type?: string;
  gibrapay_status?: string;
  gibrapay_pentester_tx_id?: string;
  gibrapay_error?: string;
  deposit_status?: string;
  wallet_type?: string;
  phone_number?: string;
  pentester?: {
    display_name: string | null;
    payout_method: string | null;
    payout_details: {
      bank_name?: string;
      account_number?: string;
      nib?: string;
      phone_number?: string;
      paypal_email?: string;
    } | null;
  };
  company?: {
    display_name: string | null;
    company_name: string | null;
  };
  report?: {
    title: string;
  };
}

interface AdminPendingPayoutsProps {
  dateFrom?: Date;
  dateTo?: Date;
}

export function AdminPendingPayouts({ dateFrom, dateTo }: AdminPendingPayoutsProps) {
  const [pendingDeposits, setPendingDeposits] = useState<PendingPayout[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [completedPayouts, setCompletedPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PendingPayout | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDepositConfirmOpen, setIsDepositConfirmOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayouts();
  }, [dateFrom, dateTo]);

  const fetchPayouts = async () => {
    setLoading(true);
    
    // Fetch pending deposits (company submitted, waiting admin confirmation)
    let depositsQuery = supabase
      .from('platform_transactions')
      .select(`
        id,
        report_id,
        pentester_id,
        company_id,
        gross_amount,
        platform_fee,
        net_amount,
        created_at,
        pentester_paid,
        payout_type,
        gibrapay_status,
        deposit_status,
        wallet_type,
        phone_number,
        pentester:profiles!platform_transactions_pentester_id_fkey (
          display_name,
          payout_method,
          payout_details
        ),
        report:reports!platform_transactions_report_id_fkey (
          title
        )
      `)
      .eq('deposit_status', 'pending')
      .order('created_at', { ascending: false });

    // Fetch pending payouts (deposit confirmed, but pentester not paid yet)
    let pendingQuery = supabase
      .from('platform_transactions')
      .select(`
        id,
        report_id,
        pentester_id,
        company_id,
        gross_amount,
        platform_fee,
        net_amount,
        created_at,
        pentester_paid,
        payout_type,
        gibrapay_status,
        gibrapay_pentester_tx_id,
        gibrapay_error,
        deposit_status,
        wallet_type,
        phone_number,
        pentester:profiles!platform_transactions_pentester_id_fkey (
          display_name,
          payout_method,
          payout_details
        ),
        report:reports!platform_transactions_report_id_fkey (
          title
        )
      `)
      .eq('pentester_paid', false)
      .eq('deposit_status', 'confirmed')
      .order('created_at', { ascending: false });

    // Fetch completed payouts
    let completedQuery = supabase
      .from('platform_transactions')
      .select(`
        id,
        report_id,
        pentester_id,
        net_amount,
        created_at,
        pentester_paid,
        pentester_paid_at,
        pentester_payment_reference,
        payout_type,
        gibrapay_pentester_tx_id,
        pentester:profiles!platform_transactions_pentester_id_fkey (
          display_name,
          payout_method,
          payout_details
        ),
        report:reports!platform_transactions_report_id_fkey (
          title
        )
      `)
      .eq('pentester_paid', true)
      .order('pentester_paid_at', { ascending: false })
      .limit(20);

    if (dateFrom) {
      depositsQuery = depositsQuery.gte('created_at', dateFrom.toISOString());
      pendingQuery = pendingQuery.gte('created_at', dateFrom.toISOString());
      completedQuery = completedQuery.gte('created_at', dateFrom.toISOString());
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      depositsQuery = depositsQuery.lte('created_at', endOfDay.toISOString());
      pendingQuery = pendingQuery.lte('created_at', endOfDay.toISOString());
      completedQuery = completedQuery.lte('created_at', endOfDay.toISOString());
    }

    const [depositsResult, pendingResult, completedResult] = await Promise.all([
      depositsQuery,
      pendingQuery,
      completedQuery
    ]);

    if (!depositsResult.error && depositsResult.data) {
      setPendingDeposits(depositsResult.data as unknown as PendingPayout[]);
    }
    if (!pendingResult.error && pendingResult.data) {
      setPendingPayouts(pendingResult.data as unknown as PendingPayout[]);
    }
    if (!completedResult.error && completedResult.data) {
      setCompletedPayouts(completedResult.data as unknown as PendingPayout[]);
    }
    
    setLoading(false);
  };

  const handleMarkAsPaid = (payout: PendingPayout) => {
    setSelectedPayout(payout);
    setPaymentReference('');
    setPaymentNotes('');
    setIsDialogOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedPayout) return;
    
    setIsProcessing(true);
    
    const { error } = await supabase
      .from('platform_transactions')
      .update({
        pentester_paid: true,
        pentester_paid_at: new Date().toISOString(),
        pentester_payment_reference: paymentReference || null,
        pentester_payment_notes: paymentNotes || null,
      })
      .eq('id', selectedPayout.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar como pago.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Pagamento Confirmado!',
        description: `Transferência para ${selectedPayout.pentester?.display_name || 'Hunter'} registrada.`,
      });
      fetchPayouts();
    }
    
    setIsProcessing(false);
    setIsDialogOpen(false);
    setSelectedPayout(null);
  };

  // Handle confirming a deposit and triggering payout to pentester
  const handleConfirmDeposit = (payout: PendingPayout) => {
    setSelectedPayout(payout);
    setIsDepositConfirmOpen(true);
  };

  const confirmDepositAndPay = async () => {
    if (!selectedPayout) return;
    
    setIsProcessing(true);
    
    try {
      // First, update deposit status to confirmed
      const { error: updateError } = await supabase
        .from('platform_transactions')
        .update({
          deposit_status: 'confirmed',
          deposit_confirmed_at: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', selectedPayout.id);

      if (updateError) throw updateError;

      // Trigger GibaPay transfer to pentester
      const pentesterPhone = selectedPayout.pentester?.payout_details?.phone_number || selectedPayout.phone_number;
      
      if (pentesterPhone && (selectedPayout.pentester?.payout_method === 'mpesa' || selectedPayout.pentester?.payout_method === 'emola')) {
        const { data, error } = await supabase.functions.invoke('process-gibrapay-payout', {
          body: { 
            reportId: selectedPayout.report_id,
            transactionId: selectedPayout.id,
            phoneNumber: pentesterPhone,
            walletType: selectedPayout.wallet_type || selectedPayout.pentester?.payout_method
          }
        });

        if (error) {
          console.error('GibaPay error:', error);
          toast({
            title: 'Depósito Confirmado',
            description: 'Depósito confirmado, mas houve erro na transferência automática. Tente novamente.',
            variant: 'destructive',
          });
        } else if (data?.success) {
          // Also update report status to paid
          await supabase.from('reports').update({ status: 'paid' }).eq('id', selectedPayout.report_id);
          
          toast({
            title: 'Sucesso!',
            description: `Depósito confirmado e pagamento de MZN ${Number(selectedPayout.net_amount).toLocaleString()} enviado ao pentester.`,
          });
        } else {
          toast({
            title: 'Depósito Confirmado',
            description: `Transferência automática falhou: ${data?.error}. Pode tentar novamente.`,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Depósito Confirmado',
          description: 'O pagamento ao pentester requer transferência manual (banco ou PayPal).',
        });
      }
      
      fetchPayouts();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar.',
        variant: 'destructive',
      });
    }
    
    setIsProcessing(false);
    setIsDepositConfirmOpen(false);
    setSelectedPayout(null);
  };

  const totalDeposits = pendingDeposits.reduce((sum, p) => sum + Number(p.gross_amount), 0);
  const totalPending = pendingPayouts.reduce((sum, p) => sum + Number(p.net_amount), 0);
  const totalCompleted = completedPayouts.reduce((sum, p) => sum + Number(p.net_amount), 0);

  const getPayoutMethodLabel = (method: string | null) => {
    switch (method) {
      case 'bank_transfer': return 'Transferência Bancária';
      case 'mpesa': return 'M-Pesa';
      case 'emola': return 'E-Mola';
      case 'paypal': return 'PayPal';
      default: return 'Não configurado';
    }
  };

  const getPayoutMethodIcon = (method: string | null) => {
    switch (method) {
      case 'bank_transfer': return <Building2 className="h-4 w-4" />;
      case 'mpesa': return <Phone className="h-4 w-4" />;
      case 'emola': return <Phone className="h-4 w-4" />;
      case 'paypal': return <Mail className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPayoutTypeLabel = (payout: PendingPayout) => {
    const type = payout.payout_type;
    const status = payout.gibrapay_status;
    
    if (type === 'automatic_mpesa' || type === 'automatic_emola') {
      if (status === 'complete') {
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
            <Zap className="h-3 w-3" />
            Automático
          </span>
        );
      } else if (status === 'failed') {
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
            <AlertCircle className="h-3 w-3" />
            Falhou
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning">
            <RefreshCw className="h-3 w-3" />
            Processando
          </span>
        );
      }
    }
    
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
        Manual
      </span>
    );
  };

  const handleRetryGibrapay = async (payout: PendingPayout) => {
    setIsProcessing(true);
    
    try {
      const { error } = await supabase.functions.invoke('process-gibrapay-payout', {
        body: { reportId: payout.report_id, transactionId: payout.id }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Processando...',
        description: 'Tentando novamente transferência automática.',
      });
      
      // Wait a bit then refresh
      setTimeout(() => fetchPayouts(), 2000);
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível reprocessar.',
        variant: 'destructive',
      });
    }
    
    setIsProcessing(false);
  };

  const renderPayoutDetails = (payout: PendingPayout) => {
    const details = payout.pentester?.payout_details;
    const method = payout.pentester?.payout_method;
    
    if (!details || !method) {
      return <span className="text-destructive text-xs">Dados não configurados</span>;
    }

    switch (method) {
      case 'bank_transfer':
        return (
          <div className="text-xs space-y-0.5">
            <div><span className="text-muted-foreground">Banco:</span> {details.bank_name || '-'}</div>
            <div><span className="text-muted-foreground">Conta:</span> {details.account_number || '-'}</div>
            <div><span className="text-muted-foreground">NIB:</span> {details.nib || '-'}</div>
          </div>
        );
      case 'mpesa':
      case 'emola':
        return (
          <div className="text-xs">
            <span className="text-muted-foreground">Telefone:</span> {details.phone_number || '-'}
            {payout.gibrapay_pentester_tx_id && (
              <div className="text-primary/70 mt-0.5">
                TX: {payout.gibrapay_pentester_tx_id}
              </div>
            )}
            {payout.gibrapay_error && (
              <div className="text-destructive mt-0.5">
                Erro: {payout.gibrapay_error}
              </div>
            )}
          </div>
        );
      case 'paypal':
        return (
          <div className="text-xs">
            <span className="text-muted-foreground">Email:</span> {details.paypal_email || '-'}
          </div>
        );
      default:
        return <span className="text-destructive text-xs">Método desconhecido</span>;
    }
  };

  const payoutColumns = [
    { key: 'hunter' as const, label: 'Hunter' },
    { key: 'valor' as const, label: 'Valor (MZN)' },
    { key: 'metodo' as const, label: 'Método' },
    { key: 'banco' as const, label: 'Banco' },
    { key: 'conta' as const, label: 'Conta' },
    { key: 'nib' as const, label: 'NIB' },
    { key: 'telefone' as const, label: 'Telefone (M-Pesa)' },
    { key: 'paypal' as const, label: 'PayPal Email' },
    { key: 'data' as const, label: 'Data Pagamento' },
    { key: 'report' as const, label: 'Report' },
  ];

  const getExportData = () => pendingPayouts.map(p => ({
    hunter: p.pentester?.display_name || 'N/A',
    valor: p.net_amount,
    metodo: getPayoutMethodLabel(p.pentester?.payout_method || null),
    banco: p.pentester?.payout_details?.bank_name || '',
    conta: p.pentester?.payout_details?.account_number || '',
    nib: p.pentester?.payout_details?.nib || '',
    telefone: p.pentester?.payout_details?.phone_number || '',
    paypal: p.pentester?.payout_details?.paypal_email || '',
    data: format(new Date(p.created_at), 'dd/MM/yyyy'),
    report: p.report?.title || p.report_id,
  }));

  const handleExportCsv = () => {
    exportToCsv(getExportData(), 'pagamentos_pendentes', payoutColumns);
    toast({ title: 'Exportado!', description: 'CSV de pagamentos pendentes baixado.' });
  };

  const handleExportPdf = () => {
    exportToPdf(getExportData(), 'pagamentos_pendentes', payoutColumns, 'Pagamentos Pendentes - AfriSec Hunters');
    toast({ title: 'Exportado!', description: 'PDF de pagamentos pendentes baixado.' });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <CyberCard glow className="text-center">
          <DollarSign className="h-6 w-6 text-secondary mx-auto mb-2" />
          <div className="text-2xl font-bold font-mono text-secondary">
            {pendingDeposits.length}
          </div>
          <div className="text-sm text-muted-foreground">Depósitos Aguardando</div>
        </CyberCard>

        <CyberCard className="text-center">
          <Clock className="h-6 w-6 text-warning mx-auto mb-2" />
          <div className="text-2xl font-bold font-mono text-warning">
            {pendingPayouts.length}
          </div>
          <div className="text-sm text-muted-foreground">Pagamentos Pendentes</div>
        </CyberCard>

        <CyberCard className="text-center">
          <DollarSign className="h-6 w-6 text-destructive mx-auto mb-2" />
          <div className="text-2xl font-bold font-mono text-destructive">
            MZN {totalDeposits.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">A Receber</div>
        </CyberCard>

        <CyberCard className="text-center">
          <CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold font-mono text-primary">
            MZN {totalCompleted.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Já Transferido</div>
        </CyberCard>
      </div>

      {/* Pending Deposits Section - NEW */}
      {pendingDeposits.length > 0 && (
        <CyberCard glow>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary" />
              Depósitos Aguardando Confirmação
            </h3>
            <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
              {pendingDeposits.length} pendente{pendingDeposits.length > 1 ? 's' : ''}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Empresas que submeteram pedidos de pagamento. Confirme quando receber o depósito no M-Pesa/E-Mola da plataforma.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="py-3 px-4">Report</th>
                  <th className="py-3 px-4">Hunter</th>
                  <th className="py-3 px-4">Valor Total</th>
                  <th className="py-3 px-4">Taxa Plataforma</th>
                  <th className="py-3 px-4">Para Hunter</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pendingDeposits.map(deposit => (
                  <tr key={deposit.id} className="border-b border-border/50 hover:bg-secondary/5">
                    <td className="py-3 px-4 text-sm max-w-48 truncate">
                      {deposit.report?.title || deposit.report_id.slice(0, 8) + '...'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">
                        {deposit.pentester?.display_name || 'Hunter'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-secondary">
                      MZN {Number(deposit.gross_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      MZN {Number(deposit.platform_fee).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-primary">
                      MZN {Number(deposit.net_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                      {format(new Date(deposit.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </td>
                    <td className="py-3 px-4">
                      <Button 
                        size="sm" 
                        onClick={() => handleConfirmDeposit(deposit)}
                        className="bg-secondary hover:bg-secondary/80"
                        disabled={isProcessing}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Confirmar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CyberCard>
      )}

      {/* Pending Payouts Table */}
      <CyberCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Pagamentos Pendentes aos Hunters
          </h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('https://dashboard.stripe.com/balance', '_blank')}
              className="border-secondary text-secondary hover:bg-secondary/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Stripe Dashboard
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCsv} 
              className="border-primary text-primary hover:bg-primary/10"
              disabled={pendingPayouts.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPdf} 
              className="border-secondary text-secondary hover:bg-secondary/10"
              disabled={pendingPayouts.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {pendingPayouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-primary/50" />
            Nenhum pagamento pendente! Todos os hunters foram pagos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="py-3 px-4">Hunter</th>
                  <th className="py-3 px-4">Report</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Dados de Pagamento</th>
                  <th className="py-3 px-4">Data Stripe</th>
                  <th className="py-3 px-4">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayouts.map(payout => (
                  <tr key={payout.id} className="border-b border-border/50 hover:bg-warning/5">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {payout.pentester?.display_name || 'Hunter'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground max-w-48 truncate">
                      {payout.report?.title || payout.report_id.slice(0, 8) + '...'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      MZN {Number(payout.net_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getPayoutMethodIcon(payout.pentester?.payout_method || null)}
                        <span className="text-sm">
                          {getPayoutMethodLabel(payout.pentester?.payout_method || null)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getPayoutTypeLabel(payout)}
                    </td>
                    <td className="py-3 px-4">
                      {renderPayoutDetails(payout)}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                      {format(new Date(payout.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {payout.gibrapay_status === 'failed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRetryGibrapay(payout)}
                            disabled={isProcessing}
                            className="border-warning text-warning hover:bg-warning/10"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkAsPaid(payout)}
                          className="bg-primary hover:bg-primary/80"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Transferido
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CyberCard>

      {/* Recent Completed Payouts */}
      {completedPayouts.length > 0 && (
        <CyberCard>
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Transferências Recentes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="py-3 px-4">Hunter</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Referência</th>
                  <th className="py-3 px-4">Data Transferência</th>
                </tr>
              </thead>
              <tbody>
                {completedPayouts.map((payout: any) => (
                  <tr key={payout.id} className="border-b border-border/50 hover:bg-primary/5">
                    <td className="py-3 px-4 font-medium">
                      {payout.pentester?.display_name || 'Hunter'}
                    </td>
                    <td className="py-3 px-4 font-mono text-primary">
                      MZN {Number(payout.net_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground font-mono">
                      {payout.pentester_payment_reference || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                      {payout.pentester_paid_at 
                        ? format(new Date(payout.pentester_paid_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CyberCard>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Transferência</DialogTitle>
            <DialogDescription>
              Confirme que a transferência foi realizada para{' '}
              <span className="font-semibold text-foreground">
                {selectedPayout?.pentester?.display_name || 'o hunter'}
              </span>
              {' '}no valor de{' '}
              <span className="font-mono font-bold text-primary">
                MZN {Number(selectedPayout?.net_amount || 0).toLocaleString()}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Referência da Transferência</Label>
              <Input
                id="reference"
                placeholder="Ex: TRF-123456 ou ID do comprovativo"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Observações sobre a transferência..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmPayment} disabled={isProcessing}>
              {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit Confirmation Dialog */}
      <Dialog open={isDepositConfirmOpen} onOpenChange={setIsDepositConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento de Depósito</DialogTitle>
            <DialogDescription>
              Confirme que recebeu o depósito da empresa no M-Pesa/E-Mola da plataforma.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Recebido:</span>
                <span className="font-mono font-bold text-secondary">
                  MZN {Number(selectedPayout?.gross_amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa Plataforma:</span>
                <span className="font-mono text-muted-foreground">
                  MZN {Number(selectedPayout?.platform_fee || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-muted-foreground">Para o Pentester:</span>
                <span className="font-mono font-bold text-primary">
                  MZN {Number(selectedPayout?.net_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="p-3 bg-muted/50 rounded text-sm">
              <p className="text-muted-foreground">
                Ao confirmar, o sistema enviará automaticamente <span className="text-primary font-semibold">MZN {Number(selectedPayout?.net_amount || 0).toLocaleString()}</span> para{' '}
                <span className="text-foreground font-semibold">{selectedPayout?.pentester?.display_name || 'o hunter'}</span> via GibaPay.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDepositConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmDepositAndPay} 
              disabled={isProcessing}
              className="bg-secondary hover:bg-secondary/80"
            >
              {isProcessing ? 'Processando...' : 'Confirmar e Pagar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
