import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { VulnerabilityType, SeverityLevel, VULNERABILITY_LABELS, SEVERITY_LABELS } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bug, Send, AlertCircle } from 'lucide-react';

const TEMPLATES: Record<VulnerabilityType, { steps: string; impact: string; recommendation: string }> = {
  xss: {
    steps: `1. Acesse a URL: [URL]
2. Insira o payload: <script>alert('XSS')</script>
3. Observe a execução do script no navegador`,
    impact: 'Um atacante pode executar scripts maliciosos no contexto do usuário, roubar cookies de sessão, redirecionar para sites maliciosos ou modificar o conteúdo da página.',
    recommendation: 'Sanitize todas as entradas de usuário e use Content Security Policy (CSP). Implemente encoding de output adequado.',
  },
  sql_injection: {
    steps: `1. Acesse o endpoint: [URL/endpoint]
2. Insira no parâmetro [param]: ' OR '1'='1
3. Observe a resposta modificada do banco de dados`,
    impact: 'Um atacante pode acessar, modificar ou deletar dados do banco de dados, potencialmente comprometendo toda a aplicação.',
    recommendation: 'Use prepared statements/parametrized queries. Nunca concatene inputs de usuário diretamente em queries SQL.',
  },
  idor: {
    steps: `1. Autentique-se como usuário A
2. Acesse o recurso: [URL com ID]
3. Modifique o ID para acessar recurso de outro usuário`,
    impact: 'Um atacante pode acessar dados de outros usuários sem autorização, violando a privacidade e potencialmente expondo informações sensíveis.',
    recommendation: 'Implemente verificação de autorização server-side para todos os recursos. Verifique se o usuário tem permissão para acessar o recurso solicitado.',
  },
  ssrf: {
    steps: `1. Identifique o parâmetro que aceita URLs: [param]
2. Insira uma URL interna: http://localhost:8080/admin
3. Observe a resposta do servidor interno`,
    impact: 'Um atacante pode acessar serviços internos, fazer port scanning, ou acessar metadados de cloud providers.',
    recommendation: 'Valide e sanitize todas as URLs fornecidas pelo usuário. Use allowlists para domínios permitidos.',
  },
  auth_bypass: {
    steps: `1. Acesse a funcionalidade protegida: [URL]
2. [Descreva o bypass específico]
3. Observe o acesso não autorizado`,
    impact: 'Um atacante pode acessar funcionalidades ou dados sem autenticação adequada, comprometendo a segurança da aplicação.',
    recommendation: 'Revise toda a lógica de autenticação. Implemente verificações de autenticação em todas as rotas protegidas.',
  },
  rce: {
    steps: `1. Acesse o endpoint vulnerável: [URL]
2. Injete o comando: [payload]
3. Observe a execução do comando no servidor`,
    impact: 'CRÍTICO: Um atacante pode executar comandos arbitrários no servidor, potencialmente comprometendo todo o sistema.',
    recommendation: 'URGENTE: Remova qualquer funcionalidade que execute comandos do sistema. Use sandboxing e principle of least privilege.',
  },
  other: {
    steps: `1. [Descreva o primeiro passo]
2. [Descreva o segundo passo]
3. [Descreva o resultado observado]`,
    impact: '[Descreva o impacto potencial desta vulnerabilidade]',
    recommendation: '[Descreva a recomendação de correção]',
  },
};

export default function SubmitReport() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [vulnerabilityType, setVulnerabilityType] = useState<VulnerabilityType>('other');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [impact, setImpact] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [proofOfConcept, setProofOfConcept] = useState('');

  const handleTypeChange = (type: VulnerabilityType) => {
    setVulnerabilityType(type);
    const template = TEMPLATES[type];
    setStepsToReproduce(template.steps);
    setImpact(template.impact);
    setRecommendation(template.recommendation);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !programId) {
      toast({ title: 'Erro', description: 'Você precisa estar logado.', variant: 'destructive' });
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast({ title: 'Erro', description: 'Título e descrição são obrigatórios.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('reports').insert({
      program_id: programId,
      pentester_id: user.id,
      title: title.trim(),
      vulnerability_type: vulnerabilityType,
      severity,
      description: description.trim(),
      steps_to_reproduce: stepsToReproduce.trim() || null,
      impact: impact.trim() || null,
      recommendation: recommendation.trim() || null,
      proof_of_concept: proofOfConcept.trim() || null,
    });

    setLoading(false);

    if (error) {
      toast({ title: 'Erro ao enviar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Relatório enviado!', description: 'Seu relatório foi enviado para análise.' });
      navigate('/dashboard');
    }
  };

  if (!user || profile?.role !== 'pentester') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Apenas pentesters podem enviar relatórios.</p>
          <Link to="/auth">
            <Button className="mt-4">Fazer Login</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to={`/programs/${programId}`}>
          <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Programa
          </Button>
        </Link>

        <CyberCard glow>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
              <Bug className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Enviar Relatório</h1>
              <p className="text-muted-foreground">Descreva a vulnerabilidade encontrada</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: XSS Refletido no campo de busca"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-input border-border focus:border-primary"
                required
              />
            </div>

            {/* Type and Severity */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Vulnerabilidade *</Label>
                <Select value={vulnerabilityType} onValueChange={(v) => handleTypeChange(v as VulnerabilityType)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(VULNERABILITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severidade *</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as SeverityLevel)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                placeholder="Descreva a vulnerabilidade em detalhes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-input border-border focus:border-primary min-h-[120px] font-mono text-sm"
                required
              />
            </div>

            {/* Steps to Reproduce */}
            <div className="space-y-2">
              <Label htmlFor="steps">Passos para Reproduzir</Label>
              <Textarea
                id="steps"
                placeholder="1. Acesse a URL...
2. Insira o payload...
3. Observe..."
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                className="bg-input border-border focus:border-primary min-h-[120px] font-mono text-sm"
              />
            </div>

            {/* Impact */}
            <div className="space-y-2">
              <Label htmlFor="impact">Impacto</Label>
              <Textarea
                id="impact"
                placeholder="Descreva o impacto potencial..."
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                className="bg-input border-border focus:border-primary min-h-[100px]"
              />
            </div>

            {/* Recommendation */}
            <div className="space-y-2">
              <Label htmlFor="recommendation">Recomendação de Correção</Label>
              <Textarea
                id="recommendation"
                placeholder="Sugira como corrigir..."
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                className="bg-input border-border focus:border-primary min-h-[100px]"
              />
            </div>

            {/* POC */}
            <div className="space-y-2">
              <Label htmlFor="poc">Proof of Concept (opcional)</Label>
              <Textarea
                id="poc"
                placeholder="Cole código, URLs ou evidências aqui..."
                value={proofOfConcept}
                onChange={(e) => setProofOfConcept(e.target.value)}
                className="bg-input border-border focus:border-primary min-h-[100px] font-mono text-sm"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Relatórios são confidenciais e enviados diretamente à empresa.
              </div>
              <Button 
                type="submit" 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Relatório
                  </>
                )}
              </Button>
            </div>
          </form>
        </CyberCard>
      </div>
    </Layout>
  );
}
