import jsPDF from 'jspdf';

interface CertificateData {
  pentesterName: string;
  rankTitle: string;
  points: number;
  issuedAt: string;
  certificateCode: string;
  verificationUrl: string;
}

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

export function generateCertificatePdf(data: CertificateData) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background - dark theme
  doc.setFillColor(10, 12, 16);
  doc.rect(0, 0, width, height, 'F');

  // Outer border with glow effect
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(3);
  doc.roundedRect(8, 8, width - 16, height - 16, 5, 5, 'S');

  // Inner border
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(0.5);
  doc.roundedRect(12, 12, width - 24, height - 24, 3, 3, 'S');

  // Corner decorations
  const cornerSize = 20;
  doc.setLineWidth(2);
  // Top left
  doc.line(15, 25, 15, 25 + cornerSize);
  doc.line(15, 25, 15 + cornerSize, 25);
  // Top right
  doc.line(width - 15, 25, width - 15, 25 + cornerSize);
  doc.line(width - 15, 25, width - 15 - cornerSize, 25);
  // Bottom left
  doc.line(15, height - 25, 15, height - 25 - cornerSize);
  doc.line(15, height - 25, 15 + cornerSize, height - 25);
  // Bottom right
  doc.line(width - 15, height - 25, width - 15, height - 25 - cornerSize);
  doc.line(width - 15, height - 25, width - 15 - cornerSize, height - 25);

  // Header decoration line
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(0.5);
  doc.line(50, 38, width - 50, 38);

  // Platform name with decorations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 255, 65);
  doc.text('★ AFRISEC HUNTERS ★', width / 2, 32, { align: 'center' });

  // Subtitle
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('PLATAFORMA DE BUG BOUNTY', width / 2, 42, { align: 'center' });

  // Certificate title
  doc.setFontSize(32);
  doc.setTextColor(255, 255, 255);
  doc.text('CERTIFICADO DE RANKING', width / 2, 58, { align: 'center' });

  // Subtitle
  doc.setFontSize(11);
  doc.setTextColor(150, 150, 150);
  doc.text('Este documento certifica oficialmente que', width / 2, 70, { align: 'center' });

  // Pentester name with glow effect simulation
  doc.setFontSize(36);
  doc.setTextColor(0, 255, 65);
  doc.text(data.pentesterName.toUpperCase(), width / 2, 88, { align: 'center' });

  // Achievement text
  doc.setFontSize(11);
  doc.setTextColor(150, 150, 150);
  doc.text('alcançou com mérito o nível de', width / 2, 100, { align: 'center' });

  // Rank box
  const rankBoxWidth = 140;
  const rankBoxHeight = 30;
  const rankBoxX = (width - rankBoxWidth) / 2;
  const rankBoxY = 105;
  
  doc.setFillColor(20, 25, 30);
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(1);
  doc.roundedRect(rankBoxX, rankBoxY, rankBoxWidth, rankBoxHeight, 3, 3, 'FD');

  // Rank title with icon
  const rankIcon = RANK_ICONS[data.rankTitle] || '★';
  doc.setFontSize(28);
  doc.setTextColor(0, 255, 65);
  doc.text(`${rankIcon}  ${data.rankTitle.toUpperCase()}  ${rankIcon}`, width / 2, 124, { align: 'center' });

  // Points
  doc.setFontSize(14);
  doc.setTextColor(255, 215, 0); // Gold color
  doc.text(`Pontuação: ${data.points.toLocaleString()} pontos`, width / 2, 145, { align: 'center' });

  // Rank description
  const description = RANK_DESCRIPTIONS[data.rankTitle] || '';
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  const descLines = doc.splitTextToSize(`"${description}"`, 180);
  doc.text(descLines, width / 2, 155, { align: 'center' });

  // Divider
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(0.3);
  doc.line(60, 168, width - 60, 168);

  // Details section
  doc.setFont('helvetica', 'normal');
  const detailY = 178;
  
  // Date
  const formattedDate = new Date(data.issuedAt).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Data de Emissão:', width / 2 - 50, detailY, { align: 'right' });
  doc.setTextColor(200, 200, 200);
  doc.text(formattedDate, width / 2 - 45, detailY);

  // Certificate code
  doc.setTextColor(100, 100, 100);
  doc.text('Código:', width / 2 + 20, detailY, { align: 'right' });
  doc.setFont('courier', 'bold');
  doc.setTextColor(0, 255, 65);
  doc.text(data.certificateCode, width / 2 + 25, detailY);

  // Verification URL
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Verificar autenticidade em: ${data.verificationUrl}`, width / 2, 188, { align: 'center' });

  // Footer decoration
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(0.3);
  doc.line(50, height - 30, width - 50, height - 30);

  // Footer text
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.text('Este certificado é emitido automaticamente pela plataforma AfriSec Hunters.', width / 2, height - 22, { align: 'center' });
  doc.text('A autenticidade pode ser verificada através do código único acima em qualquer momento.', width / 2, height - 18, { align: 'center' });

  // Seal/stamp simulation
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(1.5);
  doc.circle(width - 45, height - 50, 15, 'S');
  doc.setFontSize(6);
  doc.setTextColor(0, 255, 65);
  doc.text('VÁLIDO', width - 45, height - 50, { align: 'center' });
  doc.setFontSize(5);
  doc.text('AFRISEC', width - 45, height - 46, { align: 'center' });

  // Download
  doc.save(`certificado_${data.certificateCode}.pdf`);
}
