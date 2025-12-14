import jsPDF from 'jspdf';

interface CertificateData {
  pentesterName: string;
  rankTitle: string;
  points: number;
  issuedAt: string;
  certificateCode: string;
  verificationUrl: string;
}

// Function to load image as base64
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateCertificatePdf(data: CertificateData) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Load logo
  let logoBase64: string | null = null;
  try {
    logoBase64 = await loadImageAsBase64('/images/afrisec-logo.png');
  } catch (e) {
    console.warn('Could not load logo:', e);
  }

  // ===== BACKGROUND =====
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, 'F');

  // Subtle wave pattern on left side
  doc.setDrawColor(245, 245, 245);
  doc.setLineWidth(1);
  for (let i = 0; i < 6; i++) {
    const startY = 50 + i * 18;
    doc.line(0, startY, 90 - i * 12, startY + 35);
  }

  // ===== DECORATIVE CORNERS =====
  // Top left - dark triangle
  doc.setFillColor(35, 35, 35);
  doc.triangle(0, 0, 60, 0, 0, 45, 'F');

  // Bottom right - green triangle (main)
  doc.setFillColor(0, 200, 80);
  doc.triangle(width, height, width - 80, height, width, height - 55, 'F');

  // Bottom right - dark triangle accent
  doc.setFillColor(35, 35, 35);
  doc.triangle(width - 80, height, width - 40, height, width - 60, height - 30, 'F');

  // ===== LOGO - Top Right =====
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', width - 85, 12, 70, 25);
  }

  // ===== MAIN TITLE =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(52);
  doc.setTextColor(45, 45, 45);
  doc.text('CERTIFICADO', 20, 55);

  // Green accent line under title
  doc.setFillColor(0, 200, 80);
  doc.rect(20, 60, 105, 3.5, 'F');

  // ===== SUBTITLE =====
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('A AfriSec Hunters certifica que o hunter', 20, 78);

  // ===== NAME - Script style =====
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(48);
  doc.setTextColor(40, 50, 70);
  doc.text(data.pentesterName, 20, 108);

  // ===== ACHIEVEMENT TEXT =====
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(100, 100, 100);
  doc.text(`Alcancou com ${data.points.toLocaleString()} pontos o nivel de`, 20, 130);

  // ===== RANK TITLE =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(30, 30, 30);
  doc.text(data.rankTitle.toUpperCase(), 20, 150);

  // ===== RIGHT SIDE BADGE =====
  const badgeCenterX = width - 55;
  const badgeCenterY = 95;

  // Badge shield background
  doc.setFillColor(40, 45, 50);
  doc.roundedRect(badgeCenterX - 30, badgeCenterY - 20, 60, 55, 5, 5, 'F');
  
  // Pointed bottom
  doc.triangle(
    badgeCenterX - 30, badgeCenterY + 35,
    badgeCenterX + 30, badgeCenterY + 35,
    badgeCenterX, badgeCenterY + 55,
    'F'
  );

  // Stars at top
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('*  *  *', badgeCenterX, badgeCenterY - 8, { align: 'center' });

  // Platform name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text('AFRISEC HUNTERS', badgeCenterX, badgeCenterY + 2, { align: 'center' });

  // Green ribbon
  doc.setFillColor(0, 200, 80);
  doc.rect(badgeCenterX - 38, badgeCenterY + 8, 76, 18, 'F');
  
  // Ribbon folds
  doc.setFillColor(0, 150, 60);
  doc.triangle(badgeCenterX - 38, badgeCenterY + 8, badgeCenterX - 38, badgeCenterY + 26, badgeCenterX - 44, badgeCenterY + 17, 'F');
  doc.triangle(badgeCenterX + 38, badgeCenterY + 8, badgeCenterX + 38, badgeCenterY + 26, badgeCenterX + 44, badgeCenterY + 17, 'F');

  // Ribbon text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(data.rankTitle.toUpperCase(), badgeCenterX, badgeCenterY + 20, { align: 'center' });

  // Inner shield
  doc.setFillColor(50, 55, 60);
  doc.roundedRect(badgeCenterX - 16, badgeCenterY + 30, 32, 20, 3, 3, 'F');

  // Bug text
  doc.setFontSize(9);
  doc.setTextColor(0, 200, 80);
  doc.text('< BUG >', badgeCenterX, badgeCenterY + 43, { align: 'center' });

  // Decorative stars
  doc.setFontSize(14);
  doc.setTextColor(255, 200, 50);
  doc.text('*', badgeCenterX - 22, badgeCenterY + 52);
  doc.text('*', badgeCenterX + 22, badgeCenterY + 52);

  // ===== FOOTER =====
  const footerY = height - 28;

  // Signature line
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(20, footerY, 85, footerY);

  // Signature
  doc.setFont('times', 'italic');
  doc.setFontSize(16);
  doc.setTextColor(70, 70, 70);
  doc.text('AfriSec Hunters', 35, footerY - 4);

  // Signature label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text('AfriSec Hunters | Plataforma', 20, footerY + 7);

  // Date section
  doc.setDrawColor(180, 180, 180);
  doc.line(105, footerY, 165, footerY);

  const formattedDate = new Date(data.issuedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(45, 45, 45);
  doc.text(formattedDate, 135, footerY - 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text('Data', 135, footerY + 7, { align: 'center' });

  // Certificate code
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Codigo: ${data.certificateCode}`, width - 15, footerY, { align: 'right' });
  doc.text('Verificar: afrisechunters.com/certificate', width - 15, footerY + 6, { align: 'right' });

  // Download
  doc.save(`certificado_${data.certificateCode}.pdf`);
}
