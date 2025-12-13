import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CyberCard } from '@/components/ui/CyberCard';
import { Bug, Building2, User, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [role, setRole] = useState<'pentester' | 'company'>(
    (searchParams.get('role') as 'pentester' | 'company') || 'pentester'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setError('Nome é obrigatório');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, displayName, role);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('Este email já está cadastrado. Tente fazer login.');
          } else {
            setError(error.message);
          }
        } else {
          toast({
            title: 'Conta criada com sucesso!',
            description: 'Verifique seu email para confirmar o cadastro.',
          });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Email ou senha incorretos');
          } else {
            setError(error.message);
          }
        }
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <CyberCard glow className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <Bug className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground">
                {mode === 'signin' ? 'Bem-vindo de volta' : 'Criar Conta'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {mode === 'signin' 
                  ? 'Entre para continuar sua jornada' 
                  : 'Junte-se à comunidade de hunters'}
              </p>
            </div>

            {/* Role Selection (only for signup) */}
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setRole('pentester')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    role === 'pentester'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <User className={`h-6 w-6 mx-auto mb-2 ${role === 'pentester' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className={`text-sm font-medium ${role === 'pentester' ? 'text-primary' : 'text-muted-foreground'}`}>
                    Hunter
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('company')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    role === 'company'
                      ? 'border-secondary bg-secondary/10'
                      : 'border-border hover:border-secondary/50'
                  }`}
                >
                  <Building2 className={`h-6 w-6 mx-auto mb-2 ${role === 'company' ? 'text-secondary' : 'text-muted-foreground'}`} />
                  <div className={`text-sm font-medium ${role === 'company' ? 'text-secondary' : 'text-muted-foreground'}`}>
                    Empresa
                  </div>
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">
                    {role === 'company' ? 'Nome da Empresa' : 'Nome de Hacker'}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder={role === 'company' ? 'Acme Corp' : 'l33t_h4ck3r'}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10 bg-input border-border focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="hunter@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-input border-border focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-input border-border focus:border-primary"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' ? 'Entrar' : 'Criar Conta'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Mode */}
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === 'signin' 
                  ? 'Não tem conta? Cadastre-se' 
                  : 'Já tem conta? Entre'}
              </button>
            </div>
          </CyberCard>
        </div>
      </div>
    </Layout>
  );
}
