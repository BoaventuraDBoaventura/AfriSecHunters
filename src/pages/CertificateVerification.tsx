import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { generateCertificatePdf } from '@/lib/generateCertificatePdf';
import { 
  Award, 
  Download, 
  CheckCircle, 
  User, 
  Calendar, 
  Hash, 
  Trophy,
  ExternalLink,
  Shield,
  Copy,
  Check
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Certificate {
  id: string;
  pentester_id: string;
  rank_title: string;
  points_at_issue: number;
  issued_at: string;
  certificate_code: string;
  pentester?: {
    display_name: string;
    avatar_url: string | null;
  };
}

const RANK_COLORS: Record<string, string> = {
  'Apprentice': 'from-emerald-500/20 to-emerald-700/20 border-emerald-500/50',
  'Hunter': 'from-blue-500/20 to-blue-700/20 border-blue-500/50',
  'Senior Hunter': 'from-purple-500/20 to-purple-700/20 border-purple-500/50',
  'Expert Hunter': 'from-amber-500/20 to-amber-700/20 border-amber-500/50',
  'Master Hunter': 'from-rose-500/20 to-rose-700/20 border-rose-500/50',
  'Elite Hunter': 'from-primary/20 to-primary/40 border-primary/50',
};

const RANK_ICONS: Record<string, string> = {
  'Apprentice': '🌱',
  'Hunter': '🎯',
  'Senior Hunter': '⚔️',
  'Expert Hunter': '🏆',
  'Master Hunter': '👑',
  'Elite Hunter': '💎',
};

export default function CertificateVerification() {
  const { code } = useParams<{ code: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (code) {
      fetchCertificate();
    }
  }, [code]);

  const fetchCertificate = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rank_certificates')
      .select(`
        *,
        pentester:profiles!rank_certificates_pentester_id_fkey(
          display_name,
          avatar_url
        )
      `)
      .eq('certificate_code', code)
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setCertificate(data as Certificate);
    }
    setLoading(false);
  };

  const handleDownloadPdf = () => {
    if (!certificate) return;
    
    generateCertificatePdf({
      pentesterName: certificate.pentester?.display_name || 'Hunter',
      rankTitle: certificate.rank_title,
      points: certificate.points_at_issue,
      issuedAt: certificate.issued_at,
      certificateCode: certificate.certificate_code,
      verificationUrl: window.location.href,
    });

    toast({
      title: 'PDF gerado!',
      description: 'O certificado foi baixado com sucesso.',
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({
      title: 'Link copiado!',
      description: 'O link de verificação foi copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/2 mx-auto" />
              <div className="h-96 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (notFound) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <CyberCard className="py-12">
              <Shield className="h-16 w-16 text-destructive mx-auto mb-4 opacity-50" />
              <h1 className="text-2xl font-bold mb-2">Certificado Não Encontrado</h1>
              <p className="text-muted-foreground mb-6">
                O código de certificado "{code}" não foi encontrado no sistema.
              </p>
              <Link to="/">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  Voltar ao Início
                </Button>
              </Link>
            </CyberCard>
          </div>
        </div>
      </Layout>
    );
  }

  if (!certificate) return null;

  const rankColor = RANK_COLORS[certificate.rank_title] || RANK_COLORS['Hunter'];
  const rankIcon = RANK_ICONS[certificate.rank_title] || '★';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Verification Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="text-success font-semibold">Certificado Verificado</span>
          </div>

          {/* Certificate Card */}
          <CyberCard glow className={`bg-gradient-to-br ${rankColor} relative overflow-hidden`}>
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

            <div className="text-center py-8 px-4">
              {/* Platform name */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm font-mono text-primary tracking-widest">AFRISEC HUNTERS</span>
                <Award className="h-5 w-5 text-primary" />
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold mb-6">CERTIFICADO DE RANKING</h1>

              {/* Subtitle */}
              <p className="text-muted-foreground mb-4">Este certificado atesta que</p>

              {/* Pentester Name */}
              <div className="flex items-center justify-center gap-3 mb-4">
                {certificate.pentester?.avatar_url ? (
                  <img 
                    src={certificate.pentester.avatar_url} 
                    alt="" 
                    className="h-12 w-12 rounded-full border-2 border-primary"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                )}
                <h2 className="text-2xl sm:text-4xl font-bold text-primary text-glow">
                  {certificate.pentester?.display_name || 'Hunter'}
                </h2>
              </div>

              {/* Achievement text */}
              <p className="text-muted-foreground mb-4">atingiu o nível de</p>

              {/* Rank */}
              <div className="inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-background/50 border border-primary/30 mb-6">
                <span className="text-4xl">{rankIcon}</span>
                <span className="text-2xl sm:text-3xl font-bold text-primary text-glow">
                  {certificate.rank_title.toUpperCase()}
                </span>
                <span className="text-4xl">{rankIcon}</span>
              </div>

              {/* Points */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="text-lg font-mono">
                  com <span className="text-primary font-bold">{certificate.points_at_issue.toLocaleString()}</span> pontos
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-border/50 my-6" />

              {/* Details */}
              <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Emitido em: {new Date(certificate.issued_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span className="font-mono">{certificate.certificate_code}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button 
                  onClick={handleDownloadPdf}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Link
                    </>
                  )}
                </Button>
                <Link to={`/hunters/${certificate.pentester_id}`}>
                  <Button variant="ghost" className="text-primary hover:bg-primary/10">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Perfil
                  </Button>
                </Link>
              </div>
            </div>
          </CyberCard>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Este certificado é emitido automaticamente pela plataforma AfriSec Hunters
            e pode ser verificado através do código único acima.
          </p>
        </div>
      </div>
    </Layout>
  );
}
