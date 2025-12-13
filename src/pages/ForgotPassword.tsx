import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CyberCard } from '@/components/ui/CyberCard';
import { Bug, Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  const verifyTurnstile = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-turnstile', {
        body: { token }
      });
      
      if (error) {
        console.error('Turnstile verification error:', error);
        return false;
      }
      
      return data?.success === true;
    } catch (err) {
      console.error('Error calling verify-turnstile:', err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Verify Turnstile token if configured
    if (TURNSTILE_SITE_KEY) {
      if (!turnstileToken) {
        setError('Por favor, complete a verificação de segurança');
        setLoading(false);
        return;
      }

      const isValid = await verifyTurnstile(turnstileToken);
      if (!isValid) {
        setError('Verificação de segurança falhou. Tente novamente.');
        setTurnstileToken(null);
        setTurnstileKey(prev => prev + 1);
        setLoading(false);
        return;
      }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
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
                Recuperar Senha
              </h1>
              <p className="text-muted-foreground mt-2">
                Digite seu email para receber um link de recuperação
              </p>
            </div>

            {success ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/50 text-primary">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Email enviado!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                    </p>
                  </div>
                </div>
                <Link to="/auth">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-input border-border focus:border-primary"
                      required
                    />
                  </div>
                </div>

                {/* Turnstile Widget */}
                {TURNSTILE_SITE_KEY && (
                  <div className="flex justify-center">
                    <Turnstile
                      key={turnstileKey}
                      siteKey={TURNSTILE_SITE_KEY}
                      onSuccess={setTurnstileToken}
                      onError={() => setTurnstileToken(null)}
                      onExpire={() => setTurnstileToken(null)}
                      options={{
                        theme: 'dark',
                      }}
                    />
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={loading || (TURNSTILE_SITE_KEY && !turnstileToken)}
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Enviar Link de Recuperação'
                  )}
                </Button>

                <Link to="/auth">
                  <Button variant="ghost" className="w-full mt-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para login
                  </Button>
                </Link>
              </form>
            )}
          </CyberCard>
        </div>
      </div>
    </Layout>
  );
}
