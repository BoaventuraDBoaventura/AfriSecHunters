import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Shield, Plus, X, DollarSign } from 'lucide-react';

export default function CreateProgram() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [scope, setScope] = useState<string[]>(['']);
  const [outOfScope, setOutOfScope] = useState<string[]>(['']);
  const [rewardLow, setRewardLow] = useState('100');
  const [rewardMedium, setRewardMedium] = useState('500');
  const [rewardHigh, setRewardHigh] = useState('2000');
  const [rewardCritical, setRewardCritical] = useState('5000');

  const addScopeItem = () => setScope([...scope, '']);
  const removeScopeItem = (index: number) => setScope(scope.filter((_, i) => i !== index));
  const updateScopeItem = (index: number, value: string) => {
    const newScope = [...scope];
    newScope[index] = value;
    setScope(newScope);
  };

  const addOutOfScopeItem = () => setOutOfScope([...outOfScope, '']);
  const removeOutOfScopeItem = (index: number) => setOutOfScope(outOfScope.filter((_, i) => i !== index));
  const updateOutOfScopeItem = (index: number, value: string) => {
    const newOutOfScope = [...outOfScope];
    newOutOfScope[index] = value;
    setOutOfScope(newOutOfScope);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: 'Erro', description: 'Você precisa estar logado.', variant: 'destructive' });
      return;
    }

    if (!title.trim()) {
      toast({ title: 'Erro', description: 'O título é obrigatório.', variant: 'destructive' });
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
      reward_low: parseFloat(rewardLow) || 100,
      reward_medium: parseFloat(rewardMedium) || 500,
      reward_high: parseFloat(rewardHigh) || 2000,
      reward_critical: parseFloat(rewardCritical) || 5000,
    });

    setLoading(false);

    if (error) {
      toast({ title: 'Erro ao criar programa', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Programa criado!', description: 'Seu programa está ativo e disponível para hunters.' });
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Nome do Programa *</Label>
              <Input
                id="title"
                placeholder="Ex: Programa de Bug Bounty - Web App"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-input border-border focus:border-secondary"
                required
              />
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

            {/* Scope */}
            <div className="space-y-2">
              <Label>Escopo (In Scope)</Label>
              <p className="text-xs text-muted-foreground">Domínios, URLs, IPs ou apps que fazem parte do programa.</p>
              {scope.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Ex: *.exemplo.com.br"
                    value={item}
                    onChange={(e) => updateScopeItem(index, e.target.value)}
                    className="bg-input border-border focus:border-secondary font-mono"
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
            </div>

            {/* Out of Scope */}
            <div className="space-y-2">
              <Label>Fora do Escopo (Out of Scope)</Label>
              <p className="text-xs text-muted-foreground">O que NÃO deve ser testado.</p>
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

            {/* Rules */}
            <div className="space-y-2">
              <Label htmlFor="rules">Regras do Programa</Label>
              <Textarea
                id="rules"
                placeholder="Regras de participação, política de disclosure, etc..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="bg-input border-border focus:border-secondary min-h-[120px]"
              />
            </div>

            {/* Rewards */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <Label>Tabela de Recompensas (R$)</Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-severity-low">Low</Label>
                  <Input
                    type="number"
                    value={rewardLow}
                    onChange={(e) => setRewardLow(e.target.value)}
                    className="bg-input border-severity-low/50 focus:border-severity-low"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-severity-medium">Medium</Label>
                  <Input
                    type="number"
                    value={rewardMedium}
                    onChange={(e) => setRewardMedium(e.target.value)}
                    className="bg-input border-severity-medium/50 focus:border-severity-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-severity-high">High</Label>
                  <Input
                    type="number"
                    value={rewardHigh}
                    onChange={(e) => setRewardHigh(e.target.value)}
                    className="bg-input border-severity-high/50 focus:border-severity-high"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-severity-critical">Critical</Label>
                  <Input
                    type="number"
                    value={rewardCritical}
                    onChange={(e) => setRewardCritical(e.target.value)}
                    className="bg-input border-severity-critical/50 focus:border-severity-critical"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button 
                type="submit" 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Criar Programa
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
