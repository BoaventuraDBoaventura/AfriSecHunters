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

export function generateCertificatePdf(data: CertificateData) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(10, 10, 15);
  doc.rect(0, 0, width, height, 'F');

  // Border
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(2);
  doc.rect(10, 10, width - 20, height - 20, 'S');

  // Inner border
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(0.5);
  doc.rect(15, 15, width - 30, height - 30, 'S');

  // Header decoration
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(0.3);
  doc.line(30, 35, width - 30, 35);

  // Platform name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 65);
  doc.text('AFRISEC HUNTERS', width / 2, 28, { align: 'center' });

  // Certificate title
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('CERTIFICADO DE RANKING', width / 2, 50, { align: 'center' });

  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(150, 150, 150);
  doc.text('Este certificado atesta que', width / 2, 65, { align: 'center' });

  // Pentester name
  doc.setFontSize(32);
  doc.setTextColor(0, 255, 65);
  doc.text(data.pentesterName.toUpperCase(), width / 2, 85, { align: 'center' });

  // Achievement text
  doc.setFontSize(12);
  doc.setTextColor(150, 150, 150);
  doc.text('atingiu o nível de', width / 2, 100, { align: 'center' });

  // Rank title with icon
  const rankIcon = RANK_ICONS[data.rankTitle] || '★';
  doc.setFontSize(36);
  doc.setTextColor(0, 255, 65);
  doc.text(`${rankIcon} ${data.rankTitle.toUpperCase()} ${rankIcon}`, width / 2, 120, { align: 'center' });

  // Points
  doc.setFontSize(14);
  doc.setTextColor(200, 200, 200);
  doc.text(`com ${data.points.toLocaleString()} pontos`, width / 2, 135, { align: 'center' });

  // Divider
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(0.3);
  doc.line(80, 145, width - 80, 145);

  // Issue date
  const formattedDate = new Date(data.issuedAt).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.setFontSize(11);
  doc.setTextColor(150, 150, 150);
  doc.text(`Emitido em: ${formattedDate}`, width / 2, 158, { align: 'center' });

  // Certificate code
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 255, 65);
  doc.text(`Código: ${data.certificateCode}`, width / 2, 168, { align: 'center' });

  // Verification URL
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Verificar em: ${data.verificationUrl}`, width / 2, 178, { align: 'center' });

  // Footer decoration
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(0.3);
  doc.line(30, height - 35, width - 30, height - 35);

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('Este certificado é emitido automaticamente pela plataforma AfriSec Hunters', width / 2, height - 25, { align: 'center' });
  doc.text('e pode ser verificado através do código único acima.', width / 2, height - 20, { align: 'center' });

  // Download
  doc.save(`certificado_${data.certificateCode}.pdf`);
}
