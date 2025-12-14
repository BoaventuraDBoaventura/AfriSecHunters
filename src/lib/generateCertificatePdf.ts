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

  // ===== BACKGROUND =====
  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, 'F');

  // Subtle wave pattern on left side (light gray curves)
  doc.setDrawColor(240, 240, 240);
  doc.setLineWidth(0.8);
  for (let i = 0; i < 5; i++) {
    const startY = 60 + i * 15;
    doc.line(0, startY, 80 - i * 10, startY + 30);
  }

  // ===== DECORATIVE CORNERS =====
  // Top left - dark triangle
  doc.setFillColor(35, 35, 35);
  doc.triangle(0, 0, 55, 0, 0, 40, 'F');

  // Bottom right - green triangle (main)
  doc.setFillColor(0, 180, 80);
  doc.triangle(width, height, width - 70, height, width, height - 50, 'F');

  // Bottom right - dark triangle accent
  doc.setFillColor(35, 35, 35);
  doc.triangle(width - 70, height, width - 35, height, width - 52, height - 25, 'F');

  // ===== MAIN TITLE =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  doc.setTextColor(50, 50, 50);
  doc.text('CERTIFICADO', 20, 50);

  // Green accent line under title
  doc.setFillColor(0, 180, 80);
  doc.rect(20, 54, 95, 3, 'F');

  // ===== SUBTITLE =====
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(100, 100, 100);
  doc.text('A AfriSec Hunters certifica que o hunter', 20, 70);

  // ===== NAME - Script style =====
  // Using Times Italic for elegant script-like appearance
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(44);
  doc.setTextColor(45, 55, 72);
  doc.text(data.pentesterName, 20, 100);

  // ===== ACHIEVEMENT TEXT =====
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Alcancou com ${data.points.toLocaleString()} pontos o nivel de`, 20, 125);

  // ===== RANK TITLE =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(35, 35, 35);
  doc.text(data.rankTitle.toUpperCase(), 20, 142);

  // ===== RIGHT SIDE BADGE =====
  const badgeCenterX = width - 55;
  const badgeCenterY = 70;

  // Badge shield background - outer
  doc.setFillColor(45, 50, 55);
  
  // Shield shape using path (top rounded, pointed bottom)
  // Main body
  doc.roundedRect(badgeCenterX - 28, badgeCenterY - 25, 56, 50, 4, 4, 'F');
  
  // Pointed bottom
  doc.triangle(
    badgeCenterX - 28, badgeCenterY + 25,
    badgeCenterX + 28, badgeCenterY + 25,
    badgeCenterX, badgeCenterY + 50,
    'F'
  );

  // Three stars at top
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('*  *  *', badgeCenterX, badgeCenterY - 15, { align: 'center' });

  // "AFRISEC HUNTERS" text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(200, 200, 200);
  doc.text('AFRISEC HUNTERS', badgeCenterX, badgeCenterY - 5, { align: 'center' });

  // Green ribbon/banner
  doc.setFillColor(0, 180, 80);
  // Main ribbon
  doc.rect(badgeCenterX - 35, badgeCenterY, 70, 16, 'F');
  // Ribbon ends (folded effect)
  doc.setFillColor(0, 140, 60);
  doc.triangle(badgeCenterX - 35, badgeCenterY, badgeCenterX - 35, badgeCenterY + 16, badgeCenterX - 40, badgeCenterY + 8, 'F');
  doc.triangle(badgeCenterX + 35, badgeCenterY, badgeCenterX + 35, badgeCenterY + 16, badgeCenterX + 40, badgeCenterY + 8, 'F');

  // Ribbon text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(data.rankTitle.toUpperCase(), badgeCenterX, badgeCenterY + 10, { align: 'center' });

  // Inner shield icon
  doc.setFillColor(55, 60, 65);
  doc.roundedRect(badgeCenterX - 15, badgeCenterY + 22, 30, 22, 3, 3, 'F');

  // Bug icon representation (simple)
  doc.setFontSize(10);
  doc.setTextColor(0, 180, 80);
  doc.text('< BUG >', badgeCenterX, badgeCenterY + 35, { align: 'center' });

  // Star decoration below
  doc.setFontSize(12);
  doc.setTextColor(255, 200, 50);
  doc.text('*', badgeCenterX - 18, badgeCenterY + 48);
  doc.text('*', badgeCenterX + 18, badgeCenterY + 48);

  // ===== FOOTER =====
  const footerY = height - 30;

  // Signature section
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(20, footerY, 80, footerY);

  // Signature script
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  doc.text('AfriSec Hunters', 30, footerY - 3);

  // Signature label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text('AfriSec Hunters | Plataforma', 20, footerY + 6);

  // Date section
  doc.setDrawColor(180, 180, 180);
  doc.line(100, footerY, 155, footerY);

  const formattedDate = new Date(data.issuedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text(formattedDate, 127, footerY - 3, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text('Data', 127, footerY + 6, { align: 'center' });

  // Certificate code (bottom right)
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(`Codigo: ${data.certificateCode}`, width - 15, footerY + 3, { align: 'right' });
  doc.text('Verificar: afrisechunters.com/certificate', width - 15, footerY + 8, { align: 'right' });

  // Download
  doc.save(`certificado_${data.certificateCode}.pdf`);
}
