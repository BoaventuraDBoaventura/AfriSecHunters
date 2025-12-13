import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CyberCard } from '@/components/ui/CyberCard';
import { Layout } from '@/components/layout/Layout';
import { Bug, Shield, DollarSign, Trophy, Target, Zap, ArrowRight, Terminal } from 'lucide-react';

export default function Landing() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center gradient-hero overflow-hidden">
        <div className="absolute inset-0 scanlines opacity-30" />
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 opacity-20 animate-pulse">
          <Terminal className="h-16 w-16 text-primary" />
        </div>
        <div className="absolute bottom-40 right-20 opacity-20 animate-pulse delay-500">
          <Shield className="h-24 w-24 text-secondary" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8 animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-mono">Platform Online</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="text-foreground">Find Bugs.</span>
            <br />
            <span className="text-primary text-glow">Get Paid.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in">
            A plataforma que conecta hackers éticos às empresas que precisam de segurança. 
            Encontre vulnerabilidades, reporte com responsabilidade, receba recompensas.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link to="/auth?mode=signup&role=pentester">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 group">
                <Bug className="mr-2 h-5 w-5" />
                Iniciar como Hunter
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/auth?mode=signup&role=company">
              <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 text-lg px-8 py-6">
                <Shield className="mr-2 h-5 w-5" />
                Cadastrar Empresa
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary font-mono text-glow-sm">MZN 160M+</div>
              <div className="text-sm text-muted-foreground mt-1">Pagos em recompensas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary font-mono text-glow-sm">15K+</div>
              <div className="text-sm text-muted-foreground mt-1">Vulnerabilidades reportadas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary font-mono text-glow-sm">500+</div>
              <div className="text-sm text-muted-foreground mt-1">Empresas protegidas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como <span className="text-primary text-glow-sm">Funciona</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Uma plataforma completa para gestão de programas de Bug Bounty
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
      <section className="py-24 bg-card/50 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
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

            <div className="relative">
              <CyberCard glow className="p-8">
                <div className="font-mono text-sm text-muted-foreground mb-4">
                  // Exemplo de recompensas
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-severity-low/10 border border-severity-low/30">
                    <span className="font-semibold text-severity-low">Low</span>
                    <span className="font-mono text-severity-low">MZN 5.000 - MZN 25.000</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-severity-medium/10 border border-severity-medium/30">
                    <span className="font-semibold text-severity-medium">Medium</span>
                    <span className="font-mono text-severity-medium">MZN 25.000 - MZN 100.000</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-severity-high/10 border border-severity-high/30">
                    <span className="font-semibold text-severity-high">High</span>
                    <span className="font-mono text-severity-high">MZN 100.000 - MZN 250.000</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-severity-critical/10 border border-severity-critical/30 animate-pulse">
                    <span className="font-semibold text-severity-critical">Critical</span>
                    <span className="font-mono text-severity-critical">MZN 250.000+</span>
                  </div>
                </div>
              </CyberCard>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para começar a <span className="text-primary text-glow-sm">caçar bugs</span>?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Junte-se a milhares de pesquisadores de segurança e comece a ganhar recompensas hoje mesmo.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 animate-glow">
              Criar Conta Gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Bug className="h-6 w-6 text-primary" />
              <span className="font-bold text-primary font-mono">AfriSec Hunters</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 AfriSec Hunters. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
