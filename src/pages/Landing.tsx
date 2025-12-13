import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CyberCard } from '@/components/ui/CyberCard';
import { Layout } from '@/components/layout/Layout';
import { Bug, Shield, DollarSign, Trophy, Target, Zap, ArrowRight, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Landing() {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalReports: 0,
    totalCompanies: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Usar função segura que bypassa RLS para contar estatísticas
      const { data, error } = await supabase.rpc('get_platform_stats');
      
      if (!error && data) {
        const statsData = data as { total_earnings: number; total_reports: number; total_companies: number };
        setStats({
          totalEarnings: statsData.total_earnings || 0,
          totalReports: statsData.total_reports || 0,
          totalCompanies: statsData.total_companies || 0,
        });
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `MZN ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `MZN ${(value / 1000).toFixed(0)}K`;
    }
    return `MZN ${value.toLocaleString()}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center gradient-hero overflow-hidden pt-16">
        <div className="absolute inset-0 scanlines opacity-30" />
        
        {/* Floating elements - hidden on mobile */}
        <div className="absolute top-20 left-10 opacity-20 animate-pulse hidden sm:block">
          <Terminal className="h-12 w-12 md:h-16 md:w-16 text-primary" />
        </div>
        <div className="absolute bottom-40 right-10 md:right-20 opacity-20 animate-pulse delay-500 hidden sm:block">
          <Shield className="h-16 w-16 md:h-24 md:w-24 text-secondary" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6 sm:mb-8 animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm text-primary font-mono">Platform Online</span>
          </div>
          
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 animate-fade-in leading-tight">
            <span className="text-foreground">Encontre Bugs.</span>
            <br />
            <span className="text-primary text-glow">Seja Pago.</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 animate-fade-in px-2">
            A plataforma que conecta hackers éticos às empresas que precisam de segurança. 
            Encontre vulnerabilidades, reporte com responsabilidade, receba recompensas.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-in px-4">
            <Link to="/auth?mode=signup&role=pentester" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 group">
                <Bug className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Iniciar como Hunter
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/auth?mode=signup&role=company" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-secondary text-secondary hover:bg-secondary/10 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                <Shield className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Cadastrar Empresa
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto mt-12 sm:mt-16 px-4">
            <div className="text-center p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50 sm:bg-transparent sm:border-0 sm:p-0">
              <div className="text-2xl sm:text-4xl font-bold text-primary font-mono text-glow-sm">
                {formatCurrency(stats.totalEarnings)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Pagos em recompensas</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50 sm:bg-transparent sm:border-0 sm:p-0">
              <div className="text-2xl sm:text-4xl font-bold text-primary font-mono text-glow-sm">
                {formatNumber(stats.totalReports)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Vulnerabilidades reportadas</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50 sm:bg-transparent sm:border-0 sm:p-0">
              <div className="text-2xl sm:text-4xl font-bold text-primary font-mono text-glow-sm">
                {formatNumber(stats.totalCompanies)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Empresas protegidas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Como <span className="text-primary text-glow-sm">Funciona</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Uma plataforma completa para gestão de programas de Bug Bounty
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <CyberCard>
              <div className="h-12 w-12 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Escolha um Programa</h3>
              <p className="text-muted-foreground">
                Navegue pelos programas disponíveis, analise o escopo e as recompensas oferecidas por cada empresa.
              </p>
            </CyberCard>

            <CyberCard>
              <div className="h-12 w-12 rounded-lg bg-secondary/20 border border-secondary/50 flex items-center justify-center mb-4">
                <Bug className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Reporte Vulnerabilidades</h3>
              <p className="text-muted-foreground">
                Encontrou um bug? Use nossos templates para criar relatórios detalhados e profissionais.
              </p>
            </CyberCard>

            <CyberCard>
              <div className="h-12 w-12 rounded-lg bg-accent/20 border border-accent/50 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Receba Recompensas</h3>
              <p className="text-muted-foreground">
                Relatórios aceitos são recompensados. Receba pagamentos seguros e acumule pontos no ranking.
              </p>
            </CyberCard>
          </div>
        </div>
      </section>

      {/* For Companies Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-card/50 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Para <span className="text-secondary">Empresas</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Aproveite a expertise de milhares de pesquisadores de segurança para encontrar vulnerabilidades 
                antes que atacantes mal-intencionados o façam.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                    <Zap className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Testes Contínuos</div>
                    <div className="text-sm text-muted-foreground">
                      Hunters testando sua aplicação 24/7, não apenas durante auditorias pontuais.
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                    <Shield className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Pague por Resultados</div>
                    <div className="text-sm text-muted-foreground">
                      Só pague quando vulnerabilidades reais forem encontradas e validadas.
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                    <Trophy className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Hunters Verificados</div>
                    <div className="text-sm text-muted-foreground">
                      Acesso a perfis completos, histórico e reputação de cada pesquisador.
                    </div>
                  </div>
                </li>
              </ul>

              <Link to="/auth?mode=signup&role=company" className="inline-block mt-8">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Criar Programa de Bug Bounty
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="relative order-first md:order-last">
              <CyberCard glow className="p-4 sm:p-6 md:p-8">
                <div className="font-mono text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  // Exemplo de recompensas
                </div>
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-lg bg-severity-low/10 border border-severity-low/30">
                    <span className="font-semibold text-sm sm:text-base text-severity-low">Low</span>
                    <span className="font-mono text-xs sm:text-sm text-severity-low">MZN 5K - 25K</span>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-lg bg-severity-medium/10 border border-severity-medium/30">
                    <span className="font-semibold text-sm sm:text-base text-severity-medium">Medium</span>
                    <span className="font-mono text-xs sm:text-sm text-severity-medium">MZN 25K - 100K</span>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-lg bg-severity-high/10 border border-severity-high/30">
                    <span className="font-semibold text-sm sm:text-base text-severity-high">High</span>
                    <span className="font-mono text-xs sm:text-sm text-severity-high">MZN 100K - 250K</span>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-lg bg-severity-critical/10 border border-severity-critical/30 animate-pulse">
                    <span className="font-semibold text-sm sm:text-base text-severity-critical">Critical</span>
                    <span className="font-mono text-xs sm:text-sm text-severity-critical">MZN 250K+</span>
                  </div>
                </div>
              </CyberCard>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-24 relative">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Pronto para começar a <span className="text-primary text-glow-sm">caçar bugs</span>?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-6 sm:mb-8">
            Junte-se a milhares de pesquisadores de segurança e comece a ganhar recompensas hoje mesmo.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 animate-glow text-base sm:text-lg px-6 sm:px-8">
              Criar Conta Gratuita
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="font-bold text-primary font-mono text-sm sm:text-base">AfriSec Hunters</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              © 2024 AfriSec Hunters. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
