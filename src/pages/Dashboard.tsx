import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Report, Program, Profile } from '@/types/database';
import { EarningsSection } from '@/components/pentester/EarningsSection';
import { 
  Bug, 
  DollarSign, 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  FileText,
  ArrowRight
} from 'lucide-react';

type ReportWithProgram = Report & { program: Program & { company: Profile } };

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportWithProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'company') {
        navigate('/company-dashboard');
      } else if (profile.role === 'pentester') {
        fetchReports();
      }
    }
    setLoading(false);
  }, [user, profile, navigate]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        program:programs!reports_program_id_fkey(
          *,
          company:profiles!programs_company_id_fkey(*)
        )
      `)
      .eq('pentester_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReports(data as ReportWithProgram[]);
    }
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

  if (!user) return null;

  // Stats calculations
  const totalReports = reports.length;
  const acceptedReports = reports.filter(r => r.status === 'accepted' || r.status === 'paid').length;
  const pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'in_review').length;
  const totalEarnings = reports
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + (r.reward_amount || 0), 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Olá, <span className="text-primary text-glow-sm">{profile?.display_name || 'Hunter'}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {profile?.rank_title} • {profile?.total_points || 0} pontos
            </p>
          </div>
          <Link to="/programs">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Target className="mr-2 h-4 w-4" />
              Explorar Programas
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <CyberCard>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
                <Bug className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-foreground">{totalReports}</div>
                <div className="text-sm text-muted-foreground">Relatórios Enviados</div>
              </div>
            </div>
          </CyberCard>

          <CyberCard>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/20 border border-success/50 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-foreground">{acceptedReports}</div>
                <div className="text-sm text-muted-foreground">Aceitos</div>
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

          <CyberCard glow>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-primary">MZN {totalEarnings.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Ganho</div>
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
                  <FileText className="h-5 w-5 text-primary" />
                  Meus Relatórios
                </h2>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">Você ainda não enviou nenhum relatório.</p>
                  <Link to="/programs">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                      Encontrar Programas
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.slice(0, 10).map((report) => (
                    <Link 
                      key={report.id} 
                      to={`/reports/${report.id}`}
                      className="block"
                    >
                      <div className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all hover:bg-primary/5 group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {report.title}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {report.program?.company?.company_name || 'Programa'} • {report.program?.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <SeverityBadge severity={report.severity} className="text-[10px] py-0.5 px-2" />
                            <StatusBadge status={report.status} className="text-[10px] py-0.5 px-2" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span className="font-mono">
                            {new Date(report.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          {report.reward_amount && report.status === 'paid' && (
                            <span className="text-primary font-mono font-semibold">
                              +MZN {report.reward_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CyberCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Earnings Section */}
            <EarningsSection />

            {/* Rank Card */}
            <CyberCard glow>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Seu Ranking</h3>
              </div>
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-primary font-mono text-glow mb-2">
                  {profile?.rank_title || 'Novato'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {profile?.total_points || 0} pontos
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold font-mono text-foreground">
                        {profile?.vulnerabilities_found || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Bugs Encontrados</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold font-mono text-primary">
                        MZN {(profile?.total_earnings || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Ganho</div>
                    </div>
                  </div>
                </div>
              </div>
              <Link to="/leaderboard">
                <Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/10">
                  Ver Leaderboard
                  <TrendingUp className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CyberCard>

            {/* Quick Actions */}
            <CyberCard>
              <h3 className="font-semibold mb-4">Ações Rápidas</h3>
              <div className="space-y-2">
                <Link to="/programs" className="block">
                  <Button variant="outline" className="w-full justify-start border-border hover:border-primary hover:bg-primary/10">
                    <Target className="mr-2 h-4 w-4" />
                    Explorar Programas
                  </Button>
                </Link>
                <Link to="/profile" className="block">
                  <Button variant="outline" className="w-full justify-start border-border hover:border-primary hover:bg-primary/10">
                    <Trophy className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Button>
                </Link>
              </div>
            </CyberCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
