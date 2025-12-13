import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReportChat } from '@/components/chat/ReportChat';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Report, Program, Profile, VULNERABILITY_LABELS } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, 
  Bug, 
  Calendar, 
  Building2, 
  User, 
  MessageCircle,
  FileText,
  AlertTriangle,
  Shield,
  Lightbulb,
  Code,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportWithRelations extends Report {
  program: Program & { company: Profile };
  pentester: Profile;
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [report, setReport] = useState<ReportWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) fetchReport();
  }, [id, user]);

  const fetchReport = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        program:programs!reports_program_id_fkey(
          *,
          company:profiles!programs_company_id_fkey(*)
        ),
        pentester:profiles!reports_pentester_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (!error && data) {
      setReport(data as ReportWithRelations);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <CyberCard className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </CyberCard>
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Relatório não encontrado ou acesso negado.</p>
          <Link to="/dashboard">
            <Button variant="ghost" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isCompany = profile?.role === 'company';
  const backLink = isCompany ? '/company-dashboard' : '/dashboard';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link to={backLink}>
          <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <CyberCard glow>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
                    <Bug className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{report.title}</h1>
                    <p className="text-sm text-muted-foreground">
                      {VULNERABILITY_LABELS[report.vulnerability_type]}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <SeverityBadge severity={report.severity} />
                  <StatusBadge status={report.status} />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(report.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
                {report.reward_amount && (
                  <div className="flex items-center gap-1 text-primary">
                    <DollarSign className="h-4 w-4" />
                    R$ {report.reward_amount.toLocaleString('pt-BR')}
                  </div>
                )}
              </div>
            </CyberCard>

            {/* Tabs for Report Details and Chat */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-border/50">
                <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="h-4 w-4 mr-2" />
                  Detalhes
                </TabsTrigger>
                <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6 space-y-6">
                {/* Description */}
                <CyberCard>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Descrição</h2>
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                    {report.description}
                  </div>
                </CyberCard>

                {/* Steps to Reproduce */}
                {report.steps_to_reproduce && (
                  <CyberCard>
                    <div className="flex items-center gap-2 mb-4">
                      <Code className="h-5 w-5 text-secondary" />
                      <h2 className="text-lg font-semibold text-foreground">Passos para Reproduzir</h2>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none text-muted-foreground whitespace-pre-wrap font-mono text-sm bg-muted/30 p-4 rounded-lg">
                      {report.steps_to_reproduce}
                    </div>
                  </CyberCard>
                )}

                {/* Impact */}
                {report.impact && (
                  <CyberCard>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <h2 className="text-lg font-semibold text-foreground">Impacto</h2>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                      {report.impact}
                    </div>
                  </CyberCard>
                )}

                {/* Recommendation */}
                {report.recommendation && (
                  <CyberCard>
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">Recomendação</h2>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                      {report.recommendation}
                    </div>
                  </CyberCard>
                )}

                {/* Proof of Concept */}
                {report.proof_of_concept && (
                  <CyberCard>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-5 w-5 text-severity-critical" />
                      <h2 className="text-lg font-semibold text-foreground">Prova de Conceito (PoC)</h2>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none text-muted-foreground whitespace-pre-wrap font-mono text-sm bg-muted/30 p-4 rounded-lg overflow-x-auto">
                      {report.proof_of_concept}
                    </div>
                  </CyberCard>
                )}
              </TabsContent>

              <TabsContent value="chat" className="mt-6">
                <CyberCard>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Discussão</h2>
                  </div>
                  <ReportChat reportId={report.id} />
                </CyberCard>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Program Info */}
            <CyberCard>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Programa</h3>
              </div>
              <Link 
                to={`/programs/${report.program.id}`}
                className="block p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/50 transition-colors"
              >
                <p className="font-medium text-foreground">{report.program.title}</p>
                <p className="text-sm text-muted-foreground">
                  {report.program.company?.company_name || 'Empresa'}
                </p>
              </Link>
            </CyberCard>

            {/* Reporter Info (for company view) */}
            {isCompany && report.pentester && (
              <CyberCard>
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-secondary" />
                  <h3 className="font-semibold text-foreground">Reportado por</h3>
                </div>
                <Link 
                  to={`/hunters/${report.pentester.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary font-bold">
                    {report.pentester.display_name?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{report.pentester.display_name || 'Pentester'}</p>
                    <p className="text-sm text-muted-foreground">{report.pentester.rank_title}</p>
                  </div>
                </Link>
              </CyberCard>
            )}

            {/* Timeline */}
            <CyberCard>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Timeline</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado</span>
                  <span className="text-foreground">
                    {format(new Date(report.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atualizado</span>
                  <span className="text-foreground">
                    {format(new Date(report.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </CyberCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}