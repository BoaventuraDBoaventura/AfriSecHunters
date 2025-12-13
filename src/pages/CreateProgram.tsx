import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Shield, 
  Plus, 
  X, 
  DollarSign, 
  Target, 
  Ban, 
  FileText, 
  Sparkles,
  Eye,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

const RULES_TEMPLATE = `## Política de Divulgação Responsável

1. **Prazo de Correção**: A empresa terá 90 dias para corrigir vulnerabilidades reportadas antes de qualquer divulgação pública.

2. **Comunicação**: Toda comunicação deve ser feita através da plataforma AfriSec Hunters.

3. **Testes Permitidos**:
   - Testes não destrutivos apenas
   - Não acesse, modifique ou exclua dados de outros usuários
   - Não execute ataques de negação de serviço (DoS/DDoS)
   - Não envie spam ou phishing

4. **Documentação Obrigatória**:
   - Passos claros para reproduzir a vulnerabilidade
   - Prova de conceito (PoC) sempre que possível
   - Impacto potencial da vulnerabilidade
   - Recomendações de correção

5. **Elegibilidade**:
   - Primeiro a reportar recebe a recompensa
   - Vulnerabilidades duplicadas não são elegíveis
   - Apenas vulnerabilidades no escopo definido

6. **Pagamento**:
   - Recompensas são pagas após validação e correção
   - O valor é determinado pela severidade da vulnerabilidade`;

interface DuplicateState {
  duplicate?: boolean;
  programData?: {
    title: string;
    description: string;
    rules: string;
    scope: string[];
    outOfScope: string[];
    rewardLow: string;
    rewardMedium: string;
    rewardHigh: string;
    rewardCritical: string;
  };
}

export default function CreateProgram() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const duplicateState = location.state as DuplicateState | null;

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [scope, setScope] = useState<string[]>(['']);
  const [outOfScope, setOutOfScope] = useState<string[]>(['']);
  const [rewardLow, setRewardLow] = useState('5000');
  const [rewardMedium, setRewardMedium] = useState('25000');
  const [rewardHigh, setRewardHigh] = useState('100000');
  const [rewardCritical, setRewardCritical] = useState('250000');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    if (duplicateState?.duplicate && duplicateState.programData) {
      const data = duplicateState.programData;
      setTitle(data.title);
      setDescription(data.description);
      setRules(data.rules);
      setScope(data.scope.length ? data.scope : ['']);
      setOutOfScope(data.outOfScope.length ? data.outOfScope : ['']);
      setRewardLow(data.rewardLow);
      setRewardMedium(data.rewardMedium);
      setRewardHigh(data.rewardHigh);
      setRewardCritical(data.rewardCritical);
      setIsDuplicate(true);
      toast({ title: 'Programa duplicado', description: 'Edite os dados e salve o novo programa.' });
    }
  }, []);

  const addScopeItem = () => setScope([...scope, '']);
  const removeScopeItem = (index: number) => setScope(scope.filter((_, i) => i !== index));
  const updateScopeItem = (index: number, value: string) => {
    const newScope = [...scope];
    newScope[index] = value;
    setScope(newScope);
    if (errors.scope) {
      setErrors(prev => ({ ...prev, scope: '' }));
    }
  };

  const addOutOfScopeItem = () => setOutOfScope([...outOfScope, '']);
  const removeOutOfScopeItem = (index: number) => setOutOfScope(outOfScope.filter((_, i) => i !== index));
  const updateOutOfScopeItem = (index: number, value: string) => {
    const newOutOfScope = [...outOfScope];
    newOutOfScope[index] = value;
    setOutOfScope(newOutOfScope);
  };

  const applyRulesTemplate = () => {
    setRules(RULES_TEMPLATE);
    toast({ title: 'Template aplicado!', description: 'Regras padrão foram preenchidas. Personalize conforme necessário.' });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'O título é obrigatório';
    }

    const validScope = scope.filter(s => s.trim());
    if (validScope.length === 0) {
      newErrors.scope = 'Adicione pelo menos um item no escopo';
    }

    const rewards = [
      { name: 'Baixa', value: parseFloat(rewardLow) },
      { name: 'Média', value: parseFloat(rewardMedium) },
      { name: 'Alta', value: parseFloat(rewardHigh) },
      { name: 'Crítica', value: parseFloat(rewardCritical) },
    ];

    for (const reward of rewards) {
      if (isNaN(reward.value) || reward.value <= 0) {
        newErrors.rewards = `Recompensa ${reward.name} deve ser maior que zero`;
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Você precisa estar logado.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('programs').insert({
      company_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      rules: rules.trim() || null,
      scope: scope.filter(s => s.trim()),
      out_of_scope: outOfScope.filter(s => s.trim()),
      reward_low: parseFloat(rewardLow) || 5000,
      reward_medium: parseFloat(rewardMedium) || 25000,
      reward_high: parseFloat(rewardHigh) || 100000,
      reward_critical: parseFloat(rewardCritical) || 250000,
      is_active: isActive,
    });

    setLoading(false);
    setShowPreview(false);

    if (error) {
      toast({ title: 'Erro ao criar programa', description: error.message, variant: 'destructive' });
    } else {
      toast({ 
        title: 'Programa criado!', 
        description: isActive 
          ? 'Seu programa está ativo e disponível para hunters.' 
          : 'Seu programa foi salvo como rascunho (inativo).'
      });
      navigate('/dashboard');
    }
  };

  if (!user || profile?.role !== 'company') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Apenas empresas podem criar programas.</p>
          <Link to="/auth?mode=signup&role=company">
            <Button className="mt-4">Cadastrar Empresa</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const validScopeItems = scope.filter(s => s.trim());
  const validOutOfScopeItems = outOfScope.filter(s => s.trim());

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>

        <CyberCard glow>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-lg bg-secondary/20 border border-secondary/50 flex items-center justify-center">
              <Shield className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Criar Programa</h1>
              <p className="text-muted-foreground">Configure seu programa de Bug Bounty</p>
            </div>
          </div>

          <form onSubmit={handlePreview} className="space-y-8">
            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="active" className="text-base font-medium">Programa Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Programas inativos não aparecem para hunters (rascunho)
                </p>
              </div>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <Separator />

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-1">
                Nome do Programa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ex: Programa de Bug Bounty - Web App"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                }}
                className={`bg-input border-border focus:border-secondary ${errors.title ? 'border-destructive' : ''}`}
              />
              {errors.title && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva seu programa, o que os hunters devem saber..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-input border-border focus:border-secondary min-h-[100px]"
              />
            </div>

            <Separator />

            {/* Scope */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <Label className="text-base font-medium">
                  Escopo (In Scope) <span className="text-destructive">*</span>
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">Domínios, URLs, IPs ou apps que fazem parte do programa.</p>
              {scope.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Ex: *.exemplo.com.mz"
                    value={item}
                    onChange={(e) => updateScopeItem(index, e.target.value)}
                    className={`bg-input border-border focus:border-secondary font-mono ${errors.scope && !item.trim() ? 'border-destructive' : ''}`}
                  />
                  {scope.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeScopeItem(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={addScopeItem} className="text-primary">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
              {errors.scope && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.scope}
                </p>
              )}
            </div>

            {/* Out of Scope */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive" />
                <Label className="text-base font-medium">Fora do Escopo (Out of Scope)</Label>
              </div>
              <p className="text-sm text-muted-foreground">O que NÃO deve ser testado.</p>
              {outOfScope.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Ex: Ataques de DoS/DDoS"
                    value={item}
                    onChange={(e) => updateOutOfScopeItem(index, e.target.value)}
                    className="bg-input border-border focus:border-secondary"
                  />
                  {outOfScope.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOutOfScopeItem(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={addOutOfScopeItem} className="text-primary">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <Separator />

            {/* Rules */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-secondary" />
                  <Label htmlFor="rules" className="text-base font-medium">Regras do Programa</Label>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={applyRulesTemplate}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Usar Template
                </Button>
              </div>
              <Textarea
                id="rules"
                placeholder="Regras de participação, política de disclosure, etc..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="bg-input border-border focus:border-secondary min-h-[150px] font-mono text-sm"
              />
            </div>

            <Separator />

            {/* Rewards */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <Label className="text-base font-medium">
                  Tabela de Recompensas (MZN) <span className="text-destructive">*</span>
                </Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-severity-low">Baixa</Label>
                  <Input
                    type="number"
                    min="1"
                    value={rewardLow}
                    onChange={(e) => {
                      setRewardLow(e.target.value);
                      if (errors.rewards) setErrors(prev => ({ ...prev, rewards: '' }));
                    }}
                    className={`bg-input border-severity-low/50 focus:border-severity-low ${errors.rewards ? 'border-destructive' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-severity-medium">Média</Label>
                  <Input
                    type="number"
                    min="1"
                    value={rewardMedium}
                    onChange={(e) => {
                      setRewardMedium(e.target.value);
                      if (errors.rewards) setErrors(prev => ({ ...prev, rewards: '' }));
                    }}
                    className={`bg-input border-severity-medium/50 focus:border-severity-medium ${errors.rewards ? 'border-destructive' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-severity-high">Alta</Label>
                  <Input
                    type="number"
                    min="1"
                    value={rewardHigh}
                    onChange={(e) => {
                      setRewardHigh(e.target.value);
                      if (errors.rewards) setErrors(prev => ({ ...prev, rewards: '' }));
                    }}
                    className={`bg-input border-severity-high/50 focus:border-severity-high ${errors.rewards ? 'border-destructive' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-severity-critical">Crítica</Label>
                  <Input
                    type="number"
                    min="1"
                    value={rewardCritical}
                    onChange={(e) => {
                      setRewardCritical(e.target.value);
                      if (errors.rewards) setErrors(prev => ({ ...prev, rewards: '' }));
                    }}
                    className={`bg-input border-severity-critical/50 focus:border-severity-critical ${errors.rewards ? 'border-destructive' : ''}`}
                  />
                </div>
              </div>
              {errors.rewards && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.rewards}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button 
                type="submit" 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                <Eye className="mr-2 h-4 w-4" />
                Pré-visualizar e Criar
              </Button>
            </div>
          </form>
        </CyberCard>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-secondary" />
              Confirmar Criação do Programa
            </DialogTitle>
            <DialogDescription>
              Revise os dados antes de criar o programa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {isActive ? 'Ativo' : 'Rascunho (Inativo)'}
              </span>
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="font-semibold text-lg text-foreground">{title}</h3>
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>

            <Separator />

            {/* Scope */}
            <div>
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                Escopo ({validScopeItems.length} itens)
              </h4>
              <ul className="space-y-1">
                {validScopeItems.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground font-mono flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Out of Scope */}
            {validOutOfScopeItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                  <Ban className="h-4 w-4 text-destructive" />
                  Fora do Escopo ({validOutOfScopeItems.length} itens)
                </h4>
                <ul className="space-y-1">
                  {validOutOfScopeItems.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <X className="h-3 w-3 text-destructive" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Rewards */}
            <div>
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-primary" />
                Recompensas
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded bg-severity-low/10 border border-severity-low/30">
                  <p className="text-xs text-severity-low mb-1">Baixa</p>
                  <p className="font-mono font-medium text-foreground">{Number(rewardLow).toLocaleString('pt-MZ')} MZN</p>
                </div>
                <div className="p-2 rounded bg-severity-medium/10 border border-severity-medium/30">
                  <p className="text-xs text-severity-medium mb-1">Média</p>
                  <p className="font-mono font-medium text-foreground">{Number(rewardMedium).toLocaleString('pt-MZ')} MZN</p>
                </div>
                <div className="p-2 rounded bg-severity-high/10 border border-severity-high/30">
                  <p className="text-xs text-severity-high mb-1">Alta</p>
                  <p className="font-mono font-medium text-foreground">{Number(rewardHigh).toLocaleString('pt-MZ')} MZN</p>
                </div>
                <div className="p-2 rounded bg-severity-critical/10 border border-severity-critical/30">
                  <p className="text-xs text-severity-critical mb-1">Crítica</p>
                  <p className="font-mono font-medium text-foreground">{Number(rewardCritical).toLocaleString('pt-MZ')} MZN</p>
                </div>
              </div>
            </div>

            {/* Rules Preview */}
            {rules && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-secondary" />
                    Regras Definidas
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {rules.length} caracteres de regras configuradas
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Voltar e Editar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Confirmar e Criar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
