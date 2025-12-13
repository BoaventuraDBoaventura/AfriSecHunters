import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Program } from '@/types/database';
import { ProgramChangeHistory } from '@/components/program/ProgramChangeHistory';
import { 
  ArrowLeft, 
  Shield, 
  Plus, 
  X, 
  DollarSign, 
  Trash2, 
  Loader2, 
  Target, 
  Ban, 
  FileText, 
  Sparkles,
  AlertCircle,
  Copy,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

export default function EditProgram() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchProgram();
    }
  }, [id, user]);

  const fetchProgram = async () => {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .eq('company_id', user?.id)
      .single();

    if (error || !data) {
      toast({ title: 'Erro', description: 'Programa não encontrado.', variant: 'destructive' });
      navigate('/dashboard');
      return;
    }

    const programData = data as Program;
    setProgram(programData);
    setTitle(programData.title);
    setDescription(programData.description || '');
    setRules(programData.rules || '');
    setScope(programData.scope?.length ? programData.scope : ['']);
    setOutOfScope(programData.out_of_scope?.length ? programData.out_of_scope : ['']);
    setRewardLow(String(programData.reward_low || 5000));
    setRewardMedium(String(programData.reward_medium || 25000));
    setRewardHigh(String(programData.reward_high || 100000));
    setRewardCritical(String(programData.reward_critical || 250000));
    setIsActive(programData.is_active ?? true);
    setIsArchived(programData.is_archived ?? false);
    setLoading(false);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !id) return;

    if (!validateForm()) return;

    setSaving(true);

    const { error } = await supabase
      .from('programs')
      .update({
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
      })
      .eq('id', id)
      .eq('company_id', user.id);

    setSaving(false);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Programa atualizado!', description: 'As alterações foram salvas.' });
      navigate('/dashboard');
    }
  };

  const handleDelete = async () => {
    if (!user || !id) return;

    setDeleting(true);

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id)
      .eq('company_id', user.id);

    setDeleting(false);

    if (error) {
      toast({ title: 'Erro ao eliminar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Programa eliminado', description: 'O programa foi removido com sucesso.' });
      navigate('/dashboard');
    }
  };

  const handleArchive = async () => {
    if (!user || !id) return;

    setArchiving(true);

    const newArchivedState = !isArchived;
    const { error } = await supabase
      .from('programs')
      .update({ is_archived: newArchivedState, is_active: newArchivedState ? false : isActive })
      .eq('id', id)
      .eq('company_id', user.id);

    setArchiving(false);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setIsArchived(newArchivedState);
      if (newArchivedState) {
        setIsActive(false);
      }
      toast({ 
        title: newArchivedState ? 'Programa arquivado' : 'Programa restaurado', 
        description: newArchivedState 
          ? 'O programa foi arquivado e não aparece mais para hunters.' 
          : 'O programa foi restaurado e pode ser ativado novamente.'
      });
    }
  };

  if (!user || profile?.role !== 'company') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Acesso restrito a empresas.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-secondary/20 border border-secondary/50 flex items-center justify-center">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Editar Programa</h1>
                <p className="text-muted-foreground">Atualize as configurações do seu programa</p>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/programs/create', { 
                  state: { 
                    duplicate: true,
                    programData: {
                      title: `${title} (Cópia)`,
                      description,
                      rules,
                      scope: scope.filter(s => s.trim()),
                      outOfScope: outOfScope.filter(s => s.trim()),
                      rewardLow,
                      rewardMedium,
                      rewardHigh,
                      rewardCritical,
                    }
                  }
                })}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={handleArchive}
                disabled={archiving}
                className={isArchived ? 'text-primary hover:text-primary' : 'text-warning hover:text-warning'}
              >
                {archiving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isArchived ? (
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                ) : (
                  <Archive className="h-4 w-4 mr-2" />
                )}
                {isArchived ? 'Restaurar' : 'Arquivar'}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar Programa</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja eliminar este programa? Esta ação não pode ser desfeita.
                      Todos os relatórios associados também serão afetados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleting}
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Change History */}
          {id && <ProgramChangeHistory programId={id} />}

          <form onSubmit={handleSubmit} className="space-y-8">
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
            <div className="flex justify-end gap-4 pt-4 border-t border-border">
              <Link to="/dashboard">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button 
                type="submit" 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Salvar Alterações
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
