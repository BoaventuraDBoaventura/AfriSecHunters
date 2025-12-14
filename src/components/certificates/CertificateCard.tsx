import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { generateCertificatePdf } from '@/lib/generateCertificatePdf';
import { Award, Download, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface CertificateCardProps {
  id: string;
  pentesterName: string;
  rankTitle: string;
  points: number;
  issuedAt: string;
  certificateCode: string;
  compact?: boolean;
}

const RANK_COLORS: Record<string, string> = {
  'Apprentice': 'border-emerald-500/50 bg-emerald-500/10',
  'Hunter': 'border-blue-500/50 bg-blue-500/10',
  'Senior Hunter': 'border-purple-500/50 bg-purple-500/10',
  'Expert Hunter': 'border-amber-500/50 bg-amber-500/10',
  'Master Hunter': 'border-rose-500/50 bg-rose-500/10',
  'Elite Hunter': 'border-primary/50 bg-primary/10',
};

const RANK_ICONS: Record<string, string> = {
  'Apprentice': '🌱',
  'Hunter': '🎯',
  'Senior Hunter': '⚔️',
  'Expert Hunter': '🏆',
  'Master Hunter': '👑',
  'Elite Hunter': '💎',
};

export function CertificateCard({
  id,
  pentesterName,
  rankTitle,
  points,
  issuedAt,
  certificateCode,
  compact = false,
}: CertificateCardProps) {
  const [copied, setCopied] = useState(false);
  const verificationUrl = `${window.location.origin}/certificate/${certificateCode}`;
  const rankColor = RANK_COLORS[rankTitle] || RANK_COLORS['Hunter'];
  const rankIcon = RANK_ICONS[rankTitle] || '★';

  const handleDownload = () => {
    generateCertificatePdf({
      pentesterName,
      rankTitle,
      points,
      issuedAt,
      certificateCode,
      verificationUrl,
    });
    toast({
      title: 'PDF gerado!',
      description: 'O certificado foi baixado com sucesso.',
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    toast({
      title: 'Link copiado!',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div className={`p-3 rounded-lg border ${rankColor} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-shrink-0">{rankIcon}</span>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{rankTitle}</div>
            <div className="text-xs text-muted-foreground font-mono">{certificateCode}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link to={`/certificate/${certificateCode}`}>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${rankColor}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{rankIcon}</div>
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-semibold">{rankTitle}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {points.toLocaleString()} pontos • {new Date(issuedAt).toLocaleDateString('pt-BR')}
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-1">
              {certificateCode}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Link to={`/certificate/${certificateCode}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full border-primary/50 text-primary hover:bg-primary/10">
            <ExternalLink className="mr-2 h-3 w-3" />
            Ver
          </Button>
        </Link>
        <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10" onClick={handleCopyLink}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
        <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10" onClick={handleDownload}>
          <Download className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
