import jsPDF from 'jspdf';

interface CertificateData {
  pentesterName: string;
  rankTitle: string;
  points: number;
  issuedAt: string;
  certificateCode: string;
  verificationUrl: string;
}

export function generateCertificatePdf(data: CertificateData) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, 'F');

  // Decorative corner - top left (dark gray triangle)
  doc.setFillColor(40, 40, 40);
  doc.triangle(0, 0, 50, 0, 0, 35, 'F');

  // Decorative corner - bottom right (green triangle)
  doc.setFillColor(0, 200, 80);
  doc.triangle(width, height, width - 60, height, width, height - 40, 'F');

  // Secondary triangle - bottom right (dark)
  doc.setFillColor(40, 40, 40);
  doc.triangle(width - 60, height, width - 30, height, width - 45, height - 20, 'F');

  // Thin border frame
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.rect(8, 8, width - 16, height - 16, 'S');

  // ===== LEFT SIDE CONTENT =====

  // Main title "CERTIFICADO"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(42);
  doc.setTextColor(40, 40, 40);
  doc.text('CERTIFICADO', 25, 45);

  // Green underline for title
  doc.setDrawColor(0, 200, 80);
  doc.setLineWidth(2);
  doc.line(25, 50, 130, 50);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('A AfriSec Hunters certifica que o hunter', 25, 62);

  // Pentester name - large italic style
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(38);
  doc.setTextColor(30, 50, 80);
  doc.text(data.pentesterName, 25, 90);

  // Decorative line under name
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(25, 95, 180, 95);

  // Achievement text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Alcancou com ${data.points} pontos o nivel de`, 25, 110);

  // Rank title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text(data.rankTitle.toUpperCase(), 25, 125);

  // ===== RIGHT SIDE - BADGE =====

  const badgeX = width - 65;
  const badgeY = 55;

  // Badge outer shape (shield-like)
  doc.setFillColor(45, 50, 55);
  doc.roundedRect(badgeX - 25, badgeY - 15, 50, 55, 3, 3, 'F');
  
  // Badge point at bottom
  doc.setFillColor(45, 50, 55);
  doc.triangle(badgeX - 25, badgeY + 40, badgeX + 25, badgeY + 40, badgeX, badgeY + 55, 'F');

  // Stars at top
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('* * *', badgeX, badgeY - 5, { align: 'center' });

  // "AFRISEC" text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('AFRISEC HUNTERS', badgeX, badgeY + 5, { align: 'center' });

  // Green ribbon/banner
  doc.setFillColor(0, 200, 80);
  doc.rect(badgeX - 30, badgeY + 10, 60, 14, 'F');
  
  // Ribbon text
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(data.rankTitle.toUpperCase(), badgeX, badgeY + 19, { align: 'center' });

  // Shield icon area
  doc.setFillColor(60, 65, 70);
  doc.roundedRect(badgeX - 12, badgeY + 28, 24, 18, 2, 2, 'F');
  
  // Shield symbol
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('BUG', badgeX, badgeY + 40, { align: 'center' });

  // ===== FOOTER =====

  // Signature line
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(25, height - 35, 85, height - 35);

  // Signature text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('AfriSec Hunters', 25, height - 30);
  doc.text('Plataforma de Bug Bounty', 25, height - 26);

  // Date section
  const formattedDate = new Date(data.issuedAt).toLocaleDateString('pt-BR');
  doc.setDrawColor(150, 150, 150);
  doc.line(100, height - 35, 150, height - 35);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(formattedDate, 125, height - 38, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Data', 125, height - 30, { align: 'center' });

  // Certificate code
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Codigo: ${data.certificateCode}`, width - 25, height - 30, { align: 'right' });
  doc.text(`Verificar em: afrisechunters.com/certificate`, width - 25, height - 25, { align: 'right' });

  // Download
  doc.save(`certificado_${data.certificateCode}.pdf`);
}
