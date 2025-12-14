import jsPDF from 'jspdf';

interface CertificateData {
  pentesterName: string;
  rankTitle: string;
  points: number;
  issuedAt: string;
  certificateCode: string;
  verificationUrl: string;
}

const RANK_DESCRIPTIONS: Record<string, string> = {
  'Apprentice': 'Iniciou sua jornada como cacador de bugs, demonstrando compromisso e habilidade inicial.',
  'Hunter': 'Cacador experiente com historico comprovado de identificacao de vulnerabilidades.',
  'Senior Hunter': 'Profissional senior reconhecido por sua expertise em seguranca ofensiva.',
  'Expert Hunter': 'Especialista de elite com contribuicoes significativas para a seguranca cibernetica.',
  'Master Hunter': 'Mestre na arte da caca de bugs, referencia na comunidade de seguranca.',
  'Elite Hunter': 'Lenda viva do bug hunting, entre os melhores cacadores da plataforma.',
};

export function generateCertificatePdf(data: CertificateData) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background - dark gradient simulation
  doc.setFillColor(8, 10, 14);
  doc.rect(0, 0, width, height, 'F');

  // Outer decorative frame
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(2);
  doc.roundedRect(10, 10, width - 20, height - 20, 3, 3, 'S');

  // Inner frame
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 15, width - 30, height - 30, 2, 2, 'S');

  // Corner accents - top left
  doc.setLineWidth(2);
  doc.line(10, 30, 30, 30);
  doc.line(30, 10, 30, 30);
  
  // Corner accents - top right
  doc.line(width - 10, 30, width - 30, 30);
  doc.line(width - 30, 10, width - 30, 30);
  
  // Corner accents - bottom left
  doc.line(10, height - 30, 30, height - 30);
  doc.line(30, height - 10, 30, height - 30);
  
  // Corner accents - bottom right
  doc.line(width - 10, height - 30, width - 30, height - 30);
  doc.line(width - 30, height - 10, width - 30, height - 30);

  // Header line
  doc.setLineWidth(0.5);
  doc.line(50, 35, width - 50, 35);

  // Platform name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 65);
  doc.text('AFRISEC HUNTERS', width / 2, 28, { align: 'center' });

  // Subtitle
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('PLATAFORMA DE BUG BOUNTY - MOZAMBIQUE', width / 2, 40, { align: 'center' });

  // Main title
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('CERTIFICADO DE RANKING', width / 2, 55, { align: 'center' });

  // Decorative line under title
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(1);
  doc.line(width / 2 - 60, 60, width / 2 + 60, 60);

  // Certification text
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Este documento certifica oficialmente que', width / 2, 72, { align: 'center' });

  // Pentester name
  doc.setFontSize(32);
  doc.setTextColor(0, 255, 65);
  doc.text(data.pentesterName.toUpperCase(), width / 2, 88, { align: 'center' });

  // Achievement text
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('alcancou com merito o nivel de', width / 2, 100, { align: 'center' });

  // Rank box
  const rankBoxWidth = 120;
  const rankBoxHeight = 20;
  const rankBoxX = (width - rankBoxWidth) / 2;
  const rankBoxY = 106;
  
  // Box background
  doc.setFillColor(15, 20, 25);
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(1.5);
  doc.roundedRect(rankBoxX, rankBoxY, rankBoxWidth, rankBoxHeight, 2, 2, 'FD');

  // Rank title
  doc.setFontSize(20);
  doc.setTextColor(0, 255, 65);
  doc.text(data.rankTitle.toUpperCase(), width / 2, 120, { align: 'center' });

  // Points with trophy icon simulation
  doc.setFontSize(12);
  doc.setTextColor(255, 200, 50);
  doc.text(`Pontuacao: ${data.points.toLocaleString()} pontos`, width / 2, 138, { align: 'center' });

  // Description
  const description = RANK_DESCRIPTIONS[data.rankTitle] || '';
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  const descLines = doc.splitTextToSize(`"${description}"`, 160);
  doc.text(descLines, width / 2, 150, { align: 'center' });

  // Divider line
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(0.3);
  doc.line(40, 165, width - 40, 165);

  // Details boxes
  doc.setFont('helvetica', 'normal');
  const boxY = 170;
  const boxHeight = 18;
  const boxWidth = 70;
  const gap = 10;
  const startX = (width - (boxWidth * 3 + gap * 2)) / 2;

  // Date box
  doc.setFillColor(15, 20, 25);
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(0.5);
  doc.roundedRect(startX, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text('DATA DE EMISSAO', startX + boxWidth / 2, boxY + 5, { align: 'center' });
  
  const formattedDate = new Date(data.issuedAt).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(formattedDate, startX + boxWidth / 2, boxY + 12, { align: 'center' });

  // Code box
  const codeBoxX = startX + boxWidth + gap;
  doc.roundedRect(codeBoxX, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text('CODIGO DE VERIFICACAO', codeBoxX + boxWidth / 2, boxY + 5, { align: 'center' });
  
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 255, 65);
  doc.text(data.certificateCode, codeBoxX + boxWidth / 2, boxY + 12, { align: 'center' });

  // Status box
  const statusBoxX = codeBoxX + boxWidth + gap;
  doc.setFont('helvetica', 'normal');
  doc.roundedRect(statusBoxX, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text('STATUS', statusBoxX + boxWidth / 2, boxY + 5, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setTextColor(50, 205, 50);
  doc.text('VALIDO', statusBoxX + boxWidth / 2, boxY + 12, { align: 'center' });

  // Seal/stamp
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(1.5);
  doc.circle(width - 40, height - 40, 12, 'S');
  doc.setLineWidth(0.5);
  doc.circle(width - 40, height - 40, 9, 'S');
  
  doc.setFontSize(5);
  doc.setTextColor(0, 255, 65);
  doc.text('AFRISEC', width - 40, height - 42, { align: 'center' });
  doc.setFontSize(6);
  doc.text('VALIDO', width - 40, height - 38, { align: 'center' });

  // Footer line
  doc.setDrawColor(0, 255, 65);
  doc.setLineWidth(0.3);
  doc.line(50, height - 25, width - 50, height - 25);

  // Footer text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(70, 70, 70);
  doc.text('Este certificado e emitido automaticamente pela plataforma AfriSec Hunters.', width / 2, height - 20, { align: 'center' });
  doc.text('A autenticidade pode ser verificada atraves do codigo unico acima em qualquer momento.', width / 2, height - 16, { align: 'center' });

  // Download
  doc.save(`certificado_${data.certificateCode}.pdf`);
}
