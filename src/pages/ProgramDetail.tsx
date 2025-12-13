import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Program, Profile } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { 
  Building2, 
  Globe, 
  Target, 
  AlertTriangle, 
  FileText, 
  DollarSign,
  ArrowLeft,
  Bug
} from 'lucide-react';

export default function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [program, setProgram] = useState<(Program & { company: Profile }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProgram();
  }, [id]);

  const fetchProgram = async () => {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        company:profiles!programs_company_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (!error && data) {
      setProgram(data as Program & { company: Profile });
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

  if (!program) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Programa não encontrado.</p>
          <Link to="/programs">
            <Button variant="ghost" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Programas
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link to="/programs">
          <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Programas
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <CyberCard glow>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center flex-shrink-0">
                  {program.company?.company_logo ? (
                    <img src={program.company.company_logo} alt="" className="h-12 w-12 rounded" />
                  ) : (
                    <Building2 className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{program.title}</h1>
                  <p className="text-muted-foreground">{program.company?.company_name || 'Empresa'}</p>
                  {program.company?.company_website && (
                    <a 
                      href={program.company.company_website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                    >
                      <Globe className="h-3 w-3" />
                      {program.company.company_website}
                    </a>
                  )}
                </div>
              </div>

              {program.description && (
                <p className="text-muted-foreground mt-6">{program.description}</p>
              )}
            </CyberCard>

            {/* Scope */}
            {program.scope && program.scope.length > 0 && (
              <CyberCard>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Escopo (In Scope)</h2>
                </div>
                <div className="space-y-2">
                  {program.scope.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 font-mono text-sm">
                      <span className="text-primary">✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </CyberCard>
            )}

            {/* Out of Scope */}
            {program.out_of_scope && program.out_of_scope.length > 0 && (
              <CyberCard>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h2 className="text-lg font-semibold text-foreground">Fora do Escopo (Out of Scope)</h2>
                </div>
                <div className="space-y-2">
                  {program.out_of_scope.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 font-mono text-sm">
                      <span className="text-destructive">✗</span>
                      {item}
                    </div>
                  ))}
                </div>
              </CyberCard>
            )}

            {/* Rules */}
            {program.rules && (
              <CyberCard>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-secondary" />
                  <h2 className="text-lg font-semibold text-foreground">Regras do Programa</h2>
                </div>
                <div className="prose prose-sm prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                  {program.rules}
                </div>
              </CyberCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submit Report CTA */}
            <CyberCard glow>
              <div className="flex items-center gap-2 mb-4">
                <Bug className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Encontrou um Bug?</h3>
              </div>
              {user && profile?.role === 'pentester' ? (
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => navigate(`/submit-report/${program.id}`)}
                >
                  Enviar Relatório
                </Button>
              ) : user ? (
                <p className="text-sm text-muted-foreground">
                  Apenas pentesters podem enviar relatórios.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Faça login para enviar relatórios.
                  </p>
                  <Link to="/auth">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Fazer Login
                    </Button>
                  </Link>
                </div>
              )}
            </CyberCard>

            {/* Rewards */}
            <CyberCard>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Recompensas</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-severity-low/10 border border-severity-low/30">
                  <SeverityBadge severity="low" />
                  <span className="font-mono font-semibold text-severity-low">MZN {program.reward_low?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-severity-medium/10 border border-severity-medium/30">
                  <SeverityBadge severity="medium" />
                  <span className="font-mono font-semibold text-severity-medium">MZN {program.reward_medium?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-severity-high/10 border border-severity-high/30">
                  <SeverityBadge severity="high" />
                  <span className="font-mono font-semibold text-severity-high">MZN {program.reward_high?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-severity-critical/10 border border-severity-critical/30">
                  <SeverityBadge severity="critical" />
                  <span className="font-mono font-semibold text-severity-critical">MZN {program.reward_critical?.toLocaleString()}</span>
                </div>
              </div>
            </CyberCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
