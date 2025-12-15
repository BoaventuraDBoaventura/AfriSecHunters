import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Report, Program, Profile, ReportStatus } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Bug, 
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  TrendingUp,
  Shield,
  Loader2,
  Pencil,
  Archive,
  Smartphone
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

type ReportWithDetails = Report & { 
  program: Program; 
  pentester: Profile;
};

export default function CompanyDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportWithDetails | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: 'accept' | 'reject' | 'view' | 'pay'; report: ReportWithDetails } | null>(null);
  const [paymentMethodDialog, setPaymentMethodDialog] = useState<ReportWithDetails | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [mobileWalletType, setMobileWalletType] = useState<'mpesa' | 'emola'>('mpesa');
  const [rewardAmount, setRewardAmount] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [platformFee, setPlatformFee] = useState(10); // Default 10%
  const [pentesterDeduction, setPentesterDeduction] = useState(20); // Default 20%

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'company') {
      fetchData();
      fetchPlatformSettings();
    }
  }, [user, profile]);

  const fetchPlatformSettings = async () => {
    try {
      const { data: feeData } = await supabase.rpc('get_platform_fee');
      if (feeData) {
        setPlatformFee(parseFloat(String(feeData)));
      }
      const { data: deductionData } = await supabase.rpc('get_pentester_deduction');
      if (deductionData) {
        setPentesterDeduction(parseFloat(String(deductionData)));
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error);
    }
  };

  const fetchData = async () => {
    // Fetch programs
    const { data: programsData } = await supabase
      .from('programs')
      .select('*')
      .eq('company_id', user?.id)
      .order('created_at', { ascending: false });

    if (programsData) {
      setPrograms(programsData as Program[]);
      
      // Fetch reports for all company programs
      const programIds = programsData.map(p => p.id);
      if (programIds.length > 0) {
        const { data: reportsData } = await supabase
          .from('reports')
          .select(`
            *,
            program:programs!reports_program_id_fkey(*),
            pentester:profiles!reports_pentester_id_fkey(*)
          `)
          .in('program_id', programIds)
          .order('created_at', { ascending: false });

        if (reportsData) {
          setReports(reportsData as ReportWithDetails[]);
        }
      }
    }
    setLoading(false);
  };

  const handleAcceptReport = async () => {
    if (!actionDialog?.report || !rewardAmount) return;
    setProcessing(true);

    const { error } = await supabase
      .from('reports')
      .update({ 
        status: 'accepted' as ReportStatus, 
        reward_amount: parseFloat(rewardAmount) 
      })
      .eq('id', actionDialog.report.id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Relatório aceito!', description: `Recompensa de MZN ${rewardAmount} definida.` });
      
      // Send notification email to pentester
      supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'report_accepted',
          reportId: actionDialog.report.id,
          pentesterId: actionDialog.report.pentester_id,
          reportTitle: actionDialog.report.title,
          programTitle: actionDialog.report.program?.title || '',
          severity: actionDialog.report.severity,
          rewardAmount: parseFloat(rewardAmount)
        }
      }).catch(err => console.error('Error sending notification:', err));
      
      fetchData();
    }
    setProcessing(false);
    setActionDialog(null);
    setRewardAmount('');
  };

  const handleRejectReport = async () => {
    if (!actionDialog?.report) return;
    setProcessing(true);

    const { error } = await supabase
      .from('reports')
      .update({ status: 'rejected' as ReportStatus })
      .eq('id', actionDialog.report.id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Relatório rejeitado' });
      fetchData();
    }
    setProcessing(false);
    setActionDialog(null);
    setRejectionReason('');
  };


  const [platformMpesaNumber, setPlatformMpesaNumber] = useState('');
  const [depositSubmitted, setDepositSubmitted] = useState(false);
  const [companyPhoneNumber, setCompanyPhoneNumber] = useState('');

  useEffect(() => {
    const fetchPlatformNumber = async () => {
      const { data } = await supabase.rpc('get_platform_mpesa_number');
      if (data) {
        setPlatformMpesaNumber(data);
      }
    };
    fetchPlatformNumber();
  }, []);

  const handleSubmitDepositRequest = async (report: ReportWithDetails) => {
    const amount = parseFloat(paymentAmount) || report.reward_amount;
    if (!amount || amount <= 0) {
      toast({ title: 'Erro', description: 'Defina o valor da recompensa primeiro.', variant: 'destructive' });
      return;
    }

    if (!companyPhoneNumber) {
      toast({ title: 'Erro', description: 'Insira o número de telefone para receber o USSD.', variant: 'destructive' });
      return;
    }

    setPaymentProcessing(true);
    try {
      if (amount !== report.reward_amount) {
        await supabase.from('reports').update({ reward_amount: amount }).eq('id', report.id);
      }

      const grossAmount = amount + (amount * platformFee / 100);
      const pentesterReceives = amount - (amount * pentesterDeduction / 100);

      // Call the GibaPay payment request edge function to send USSD
      const { data, error } = await supabase.functions.invoke('request-gibrapay-payment', {
        body: {
          phoneNumber: companyPhoneNumber,
          amount: grossAmount,
          reportId: report.id,
          companyId: user?.id,
          pentesterId: report.pentester_id,
          grossAmount: grossAmount,
          platformFee: amount * platformFee / 100,
          netAmount: pentesterReceives,
        }
      });

      if (error) throw error;

      if (data?.success) {
        setDepositSubmitted(true);
        toast({ 
          title: 'USSD Enviado!', 
          description: 'Confirme o pagamento no seu telefone para completar a transação.'
        });
      } else {
        throw new Error(data?.error || 'Falha ao enviar USSD');
      }
    } catch (error: any) {
      console.error('Error creating payment request:', error);
      toast({ title: 'Erro', description: error.message || 'Erro ao enviar pedido de pagamento.', variant: 'destructive' });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const closePaymentDialog = () => {
    setPaymentMethodDialog(null);
    setDepositSubmitted(false);
    setPaymentAmount('');
    setCompanyPhoneNumber('');
    fetchData();
  };

  const openPaymentDialog = (report: ReportWithDetails) => {
    setPaymentMethodDialog(report);
    setPaymentAmount(report.reward_amount?.toString() || '');
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="grid md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || profile?.role !== 'company') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Acesso restrito a empresas.</p>
        </div>
      </Layout>
    );
  }

  // Stats
  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const acceptedReports = reports.filter(r => r.status === 'accepted' || r.status === 'paid').length;
  const totalPaid = reports
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + (r.reward_amount || 0), 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-secondary">{profile?.company_name || 'Empresa'}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Dashboard de Segurança
            </p>
          </div>
          <Link to="/programs/create">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Programa
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <CyberCard>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-secondary/20 border border-secondary/50 flex items-center justify-center">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-foreground">{programs.filter(p => !p.is_archived).length}</div>
                <div className="text-sm text-muted-foreground">Programas Ativos</div>
              </div>
            </div>
          </CyberCard>

          <CyberCard>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-warning/20 border border-warning/50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-foreground">{pendingReports}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
            </div>
          </CyberCard>

          <CyberCard>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/20 border border-success/50 flex items-center justify-center">
                <Bug className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-foreground">{acceptedReports}</div>
                <div className="text-sm text-muted-foreground">Vulnerabilidades Corrigidas</div>
              </div>
            </div>
          </CyberCard>

          <CyberCard glow>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-primary">MZN {totalPaid.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Investido</div>
              </div>
            </div>
          </CyberCard>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Reports List */}
          <div className="lg:col-span-2">
            <CyberCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-secondary" />
                  Relatórios Recebidos
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {totalReports} total
                  </span>
                </div>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">Nenhum relatório recebido ainda.</p>
                  <p className="text-sm text-muted-foreground">
                    Crie um programa para começar a receber relatórios de vulnerabilidades.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div 
                      key={report.id}
                      className="p-4 rounded-lg border border-border hover:border-secondary/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {report.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            por <span className="text-primary">{report.pentester?.display_name || 'Hunter'}</span>
                            {' • '}
                            {report.program?.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <SeverityBadge severity={report.severity} className="text-[10px] py-0.5 px-2" />
                          <StatusBadge status={report.status} className="text-[10px] py-0.5 px-2" />
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {report.description}
                      </p>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(report.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link to={`/reports/${report.id}`}>
                            <Button 
                              size="sm" 
                              variant="ghost"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </Link>
                          {report.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-success hover:text-success hover:bg-success/10"
                                onClick={() => setActionDialog({ type: 'accept', report })}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aceitar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setActionDialog({ type: 'reject', report })}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                          {report.status === 'accepted' && (
                            <Button 
                              size="sm"
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() => openPaymentDialog(report)}
                              disabled={paymentProcessing}
                            >
                              {paymentProcessing ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Smartphone className="h-4 w-4 mr-1" />
                              )}
                              Pagar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CyberCard>
          </div>

          {/* Sidebar - Programs */}
          <div className="space-y-6">
            <CyberCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-secondary" />
                  Meus Programas
                </h3>
                <Link to="/programs/create">
                  <Button size="sm" variant="ghost" className="text-secondary hover:bg-secondary/10">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {programs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">Nenhum programa criado.</p>
                  <Link to="/programs/create">
                    <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      Criar Programa
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {programs.filter(p => !p.is_archived).map((program) => {
                    const programReports = reports.filter(r => r.program_id === program.id);
                    return (
                      <div key={program.id} className="p-3 rounded-lg border border-border hover:border-secondary/50 transition-all">
                        <div className="flex items-center justify-between">
                          <Link to={`/programs/${program.id}`} className="flex-1">
                            <span className="font-medium text-foreground truncate hover:text-secondary transition-colors">{program.title}</span>
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${program.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {program.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                            <Link to={`/programs/${program.id}/edit`}>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{programReports.length} relatórios</span>
                          <span>MZN {program.reward_low?.toLocaleString()} - MZN {program.reward_critical?.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Archived Programs Section */}
                  {programs.filter(p => p.is_archived).length > 0 && (
                    <div className="pt-4 mt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                        <Archive className="h-4 w-4" />
                        <span className="text-xs font-medium">Arquivados ({programs.filter(p => p.is_archived).length})</span>
                      </div>
                      {programs.filter(p => p.is_archived).map((program) => {
                        const programReports = reports.filter(r => r.program_id === program.id);
                        return (
                          <div key={program.id} className="p-3 rounded-lg border border-border/50 bg-muted/20 opacity-60 hover:opacity-100 transition-all mb-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-muted-foreground truncate">{program.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                  Arquivado
                                </span>
                                <Link to={`/programs/${program.id}/edit`}>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{programReports.length} relatórios</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CyberCard>

            {/* Quick Stats */}
            <CyberCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Resumo por Severidade
              </h3>
              <div className="space-y-3">
                {(['critical', 'high', 'medium', 'low'] as const).map(severity => {
                  const count = reports.filter(r => r.severity === severity).length;
                  return (
                    <div key={severity} className="flex items-center justify-between">
                      <SeverityBadge severity={severity} />
                      <span className="font-mono text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CyberCard>
          </div>
        </div>
      </div>

      {/* View Report Dialog */}
      <Dialog open={actionDialog?.type === 'view'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{actionDialog?.report?.title}</DialogTitle>
            <DialogDescription>
              Relatório de {actionDialog?.report?.pentester?.display_name}
            </DialogDescription>
          </DialogHeader>
          {actionDialog?.report && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={actionDialog.report.severity} />
                <StatusBadge status={actionDialog.report.status} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Descrição</h4>
                <p className="text-foreground whitespace-pre-wrap">{actionDialog.report.description}</p>
              </div>
              {actionDialog.report.steps_to_reproduce && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Passos para Reproduzir</h4>
                  <pre className="text-foreground whitespace-pre-wrap font-mono text-sm bg-muted p-3 rounded-lg">
                    {actionDialog.report.steps_to_reproduce}
                  </pre>
                </div>
              )}
              {actionDialog.report.impact && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Impacto</h4>
                  <p className="text-foreground whitespace-pre-wrap">{actionDialog.report.impact}</p>
                </div>
              )}
              {actionDialog.report.recommendation && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Recomendação</h4>
                  <p className="text-foreground whitespace-pre-wrap">{actionDialog.report.recommendation}</p>
                </div>
              )}
              {actionDialog.report.proof_of_concept && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Proof of Concept</h4>
                  <pre className="text-foreground whitespace-pre-wrap font-mono text-sm bg-muted p-3 rounded-lg overflow-x-auto">
                    {actionDialog.report.proof_of_concept}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Report Dialog */}
      <Dialog open={actionDialog?.type === 'accept'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Aceitar Relatório</DialogTitle>
            <DialogDescription>
              Defina o valor da recompensa para este relatório.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Valor da Recompensa (MZN)</label>
              <Input
                type="number"
                placeholder="1000"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                className="mt-1 bg-input border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sugerido para {actionDialog?.report?.severity}: MZN {
                  actionDialog?.report?.severity === 'critical' ? actionDialog?.report?.program?.reward_critical?.toLocaleString() :
                  actionDialog?.report?.severity === 'high' ? actionDialog?.report?.program?.reward_high?.toLocaleString() :
                  actionDialog?.report?.severity === 'medium' ? actionDialog?.report?.program?.reward_medium?.toLocaleString() :
                  actionDialog?.report?.program?.reward_low?.toLocaleString()
                }
              </p>
              <p className="text-xs text-primary mt-2">
                💳 Taxa de plataforma: {platformFee}% será adicionada ao valor total
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionDialog(null)}>Cancelar</Button>
            <Button 
              className="bg-success text-success-foreground hover:bg-success/90"
              onClick={handleAcceptReport}
              disabled={processing || !rewardAmount}
            >
              {processing ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Report Dialog */}
      <Dialog open={actionDialog?.type === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rejeitar Relatório</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja rejeitar este relatório?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionDialog(null)}>Cancelar</Button>
            <Button 
              variant="destructive"
              onClick={handleRejectReport}
              disabled={processing}
            >
              {processing ? 'Processando...' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment / Deposit Dialog */}
      <Dialog open={!!paymentMethodDialog} onOpenChange={closePaymentDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {depositSubmitted ? '✅ Pedido Registado' : 'Pagar Recompensa via GibaPay'}
            </DialogTitle>
            <DialogDescription>
              {depositSubmitted 
                ? 'Siga as instruções abaixo para completar o pagamento.'
                : `Pagamento para ${paymentMethodDialog?.pentester?.display_name || 'o pentester'}.`
              }
            </DialogDescription>
          </DialogHeader>
          
          {depositSubmitted ? (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-success/10 border-2 border-success rounded-lg space-y-3">
                <h4 className="font-bold text-success flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  USSD Enviado com Sucesso!
                </h4>
                
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    Um popup USSD foi enviado para o número <span className="font-mono font-bold text-primary">{companyPhoneNumber}</span>
                  </p>
                  
                  <div className="p-3 bg-background rounded border border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Valor a confirmar:</span>
                      <span className="font-mono font-bold text-lg text-primary">
                        MZN {((parseFloat(paymentAmount) || 0) + (parseFloat(paymentAmount) * platformFee / 100 || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1 mt-3">
                    <p>📱 Verifique o popup USSD no seu telefone</p>
                    <p>✅ Confirme o pagamento inserindo o PIN</p>
                    <p>⏳ O admin verificará a transação</p>
                    <p>💸 O pentester receberá <span className="text-success font-medium">MZN {((parseFloat(paymentAmount) || 0) - (parseFloat(paymentAmount) * pentesterDeduction / 100 || 0)).toLocaleString()}</span></p>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={closePaymentDialog}
              >
                Entendido, Já Confirmei
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium text-foreground">Recompensa para o Pentester (MZN)</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="mt-1 bg-input border-border"
                  min="50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sugerido para {paymentMethodDialog?.severity}: MZN {
                    paymentMethodDialog?.severity === 'critical' ? paymentMethodDialog?.program?.reward_critical?.toLocaleString() :
                    paymentMethodDialog?.severity === 'high' ? paymentMethodDialog?.program?.reward_high?.toLocaleString() :
                    paymentMethodDialog?.severity === 'medium' ? paymentMethodDialog?.program?.reward_medium?.toLocaleString() :
                    paymentMethodDialog?.program?.reward_low?.toLocaleString()
                  }
                </p>
                
                <div className="mt-3 p-4 bg-primary/10 rounded-lg border-2 border-primary space-y-2">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Valor a Depositar</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">Recompensa:</span>
                    <span className="text-foreground">MZN {(parseFloat(paymentAmount) || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">Taxa plataforma ({platformFee}%):</span>
                    <span className="text-foreground">+ MZN {(parseFloat(paymentAmount) * platformFee / 100 || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-primary/30 pt-2 mt-2">
                    <span className="text-primary">TOTAL:</span>
                    <span className="text-primary">MZN {((parseFloat(paymentAmount) || 0) + (parseFloat(paymentAmount) * platformFee / 100 || 0)).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-2 p-2 bg-muted/30 rounded border border-border text-xs text-muted-foreground">
                  <p>ℹ️ O pentester receberá <span className="text-success font-medium">MZN {((parseFloat(paymentAmount) || 0) - (parseFloat(paymentAmount) * pentesterDeduction / 100 || 0)).toLocaleString()}</span> após dedução de {pentesterDeduction}% para taxas.</p>
                </div>
              </div>

              {/* Company Phone Number Field */}
              <div>
                <label className="text-sm font-medium text-foreground">Número para Receber USSD</label>
                <Input
                  type="tel"
                  placeholder="84XXXXXXX"
                  value={companyPhoneNumber}
                  onChange={(e) => setCompanyPhoneNumber(e.target.value)}
                  className="mt-1 bg-input border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este número receberá um popup USSD do GibaPay para confirmar o pagamento.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tipo de Carteira do Pentester</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={mobileWalletType === 'mpesa' ? 'default' : 'outline'}
                    onClick={() => setMobileWalletType('mpesa')}
                    className={mobileWalletType === 'mpesa' ? 'bg-secondary text-secondary-foreground' : ''}
                  >
                    M-Pesa
                  </Button>
                  <Button
                    size="sm"
                    variant={mobileWalletType === 'emola' ? 'default' : 'outline'}
                    onClick={() => setMobileWalletType('emola')}
                    className={mobileWalletType === 'emola' ? 'bg-secondary text-secondary-foreground' : ''}
                  >
                    E-Mola
                  </Button>
                </div>
              </div>
              
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => paymentMethodDialog && handleSubmitDepositRequest(paymentMethodDialog)}
                disabled={paymentProcessing || !paymentAmount || parseFloat(paymentAmount) < 50 || !companyPhoneNumber}
              >
                {paymentProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Smartphone className="h-4 w-4 mr-2" />
                )}
                {paymentProcessing ? 'Enviando USSD...' : 'Enviar USSD de Pagamento'}
              </Button>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="ghost" onClick={closePaymentDialog}>
              {depositSubmitted ? 'Fechar' : 'Cancelar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
