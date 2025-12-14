import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { generateCertificatePdf } from '@/lib/generateCertificatePdf';
import afrisecLogo from '@/assets/afrisec-logo.png';
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
  Check,
  Star,
  Zap
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

const RANK_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  'Apprentice': { bg: 'from-emerald-500/20 to-emerald-700/20', border: 'border-emerald-500/50', glow: 'shadow-emerald-500/20' },
  'Hunter': { bg: 'from-blue-500/20 to-blue-700/20', border: 'border-blue-500/50', glow: 'shadow-blue-500/20' },
  'Senior Hunter': { bg: 'from-purple-500/20 to-purple-700/20', border: 'border-purple-500/50', glow: 'shadow-purple-500/20' },
  'Expert Hunter': { bg: 'from-amber-500/20 to-amber-700/20', border: 'border-amber-500/50', glow: 'shadow-amber-500/20' },
  'Master Hunter': { bg: 'from-rose-500/20 to-rose-700/20', border: 'border-rose-500/50', glow: 'shadow-rose-500/20' },
  'Elite Hunter': { bg: 'from-primary/20 to-primary/40', border: 'border-primary/50', glow: 'shadow-primary/20' },
};

const RANK_ICONS: Record<string, string> = {
  'Apprentice': '🌱',
  'Hunter': '🎯',
  'Senior Hunter': '⚔️',
  'Expert Hunter': '🏆',
  'Master Hunter': '👑',
  'Elite Hunter': '💎',
};

const RANK_DESCRIPTIONS: Record<string, string> = {
  'Apprentice': 'Iniciou sua jornada como caçador de bugs, demonstrando compromisso e habilidade inicial.',
  'Hunter': 'Caçador experiente com histórico comprovado de identificação de vulnerabilidades.',
  'Senior Hunter': 'Profissional sênior reconhecido por sua expertise em segurança ofensiva.',
  'Expert Hunter': 'Especialista de elite com contribuições significativas para a segurança cibernética.',
  'Master Hunter': 'Mestre na arte da caça de bugs, referência na comunidade de segurança.',
  'Elite Hunter': 'Lenda viva do bug hunting, entre os melhores caçadores da plataforma.',
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

  const handleDownloadPdf = async () => {
    if (!certificate) return;
    
    await generateCertificatePdf({
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
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/2 mx-auto" />
              <div className="h-[500px] bg-muted rounded-lg" />
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

  const rankStyle = RANK_COLORS[certificate.rank_title] || RANK_COLORS['Hunter'];
  const rankIcon = RANK_ICONS[certificate.rank_title] || '★';
  const rankDescription = RANK_DESCRIPTIONS[certificate.rank_title] || '';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Verification Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-success font-semibold">Certificado Verificado e Autêntico</span>
            </div>
          </div>

          {/* Certificate Card */}
          <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${rankStyle.bg} ${rankStyle.border} border-2 shadow-2xl ${rankStyle.glow}`}>
            {/* Decorative corner elements */}
            <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-primary/30 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-primary/30 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-primary/30 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-primary/30 rounded-br-2xl" />

            {/* Top gradient line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            
            {/* Bottom gradient line */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, currentColor 35px, currentColor 36px)`,
              }} />
            </div>

            <div className="relative z-10 p-6 md:p-10">
              {/* Header with Logo */}
              <div className="flex flex-col items-center mb-8">
                <img 
                  src={afrisecLogo} 
                  alt="AfriSec Hunters" 
                  className="h-20 md:h-28 w-auto mb-4"
                />
                <div className="flex items-center gap-3">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary" />
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono text-muted-foreground tracking-[0.3em] uppercase">
                    Plataforma de Bug Bounty
                  </span>
                  <Star className="h-4 w-4 text-primary" />
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary" />
                </div>
              </div>

              {/* Certificate Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold tracking-wide mb-2">
                  CERTIFICADO DE RANKING
                </h1>
                <p className="text-muted-foreground">
                  Este documento certifica oficialmente que
                </p>
              </div>

              {/* Pentester Info */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                  {certificate.pentester?.avatar_url ? (
                    <img 
                      src={certificate.pentester.avatar_url} 
                      alt="" 
                      className="h-24 w-24 rounded-full border-4 border-primary shadow-lg shadow-primary/20"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full border-4 border-primary bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/20">
                      <User className="h-12 w-12 text-primary" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                    <Shield className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-primary text-glow tracking-wide">
                  {certificate.pentester?.display_name || 'Hunter'}
                </h2>
              </div>

              {/* Achievement */}
              <div className="text-center mb-8">
                <p className="text-muted-foreground mb-4">alcançou com mérito o nível de</p>
                
                {/* Rank Badge */}
                <div className="inline-flex flex-col items-center gap-4 px-8 py-6 rounded-xl bg-background/50 border-2 border-primary/30 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <Zap className="h-8 w-8 text-primary" />
                    <span className="text-5xl">{rankIcon}</span>
                    <span className="text-3xl md:text-4xl font-bold text-primary text-glow">
                      {certificate.rank_title.toUpperCase()}
                    </span>
                    <span className="text-5xl">{rankIcon}</span>
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  
                  {/* Points */}
                  <div className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5 text-warning" />
                    <span className="font-mono">
                      Pontuação: <span className="text-primary font-bold text-xl">{certificate.points_at_issue.toLocaleString()}</span> pontos
                    </span>
                  </div>
                </div>

                {/* Rank Description */}
                <p className="mt-6 text-muted-foreground max-w-xl mx-auto italic">
                  "{rankDescription}"
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <Award className="h-6 w-6 text-primary" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-background/30 border border-border/50 text-center">
                  <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
                  <div className="text-xs text-muted-foreground mb-1">Data de Emissão</div>
                  <div className="font-semibold">
                    {new Date(certificate.issued_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-background/30 border border-border/50 text-center">
                  <Hash className="h-5 w-5 text-primary mx-auto mb-2" />
                  <div className="text-xs text-muted-foreground mb-1">Código de Verificação</div>
                  <div className="font-mono font-bold text-primary">{certificate.certificate_code}</div>
                </div>
                <div className="p-4 rounded-lg bg-background/30 border border-border/50 text-center">
                  <Shield className="h-5 w-5 text-success mx-auto mb-2" />
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <div className="font-semibold text-success flex items-center justify-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Válido
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button 
                  onClick={handleDownloadPdf}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Baixar Certificado PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Link Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-5 w-5" />
                      Copiar Link de Verificação
                    </>
                  )}
                </Button>
                <Link to={`/hunters/${certificate.pentester_id}`}>
                  <Button variant="ghost" size="lg" className="text-primary hover:bg-primary/10">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Ver Perfil Completo
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center mt-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              Este certificado é emitido automaticamente pela plataforma <span className="text-primary font-semibold">AfriSec Hunters</span>
            </p>
            <p className="text-xs text-muted-foreground">
              A autenticidade pode ser verificada através do código único acima em qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
