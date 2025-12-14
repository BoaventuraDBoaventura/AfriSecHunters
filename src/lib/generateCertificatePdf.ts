import jsPDF from 'jspdf';

interface CertificateData {
  pentesterName: string;
  rankTitle: string;
  points: number;
  issuedAt: string;
  certificateCode: string;
  verificationUrl: string;
}

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

  // ===== CLEAN WHITE BACKGROUND =====
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, 'F');

  // ===== ELEGANT BORDER =====
  // Outer gold/green border
  doc.setDrawColor(0, 180, 90);
  doc.setLineWidth(3);
  doc.rect(8, 8, width - 16, height - 16, 'S');

  // Inner thin border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, width - 24, height - 24, 'S');

  // ===== CORNER DECORATIONS =====
  const cornerSize = 15;
  doc.setFillColor(0, 180, 90);
  
  // Top left corner accent
  doc.rect(8, 8, cornerSize, 3, 'F');
  doc.rect(8, 8, 3, cornerSize, 'F');
  
  // Top right corner accent
  doc.rect(width - 8 - cornerSize, 8, cornerSize, 3, 'F');
  doc.rect(width - 11, 8, 3, cornerSize, 'F');
  
  // Bottom left corner accent
  doc.rect(8, height - 11, cornerSize, 3, 'F');
  doc.rect(8, height - 8 - cornerSize, 3, cornerSize, 'F');
  
  // Bottom right corner accent
  doc.rect(width - 8 - cornerSize, height - 11, cornerSize, 3, 'F');
  doc.rect(width - 11, height - 8 - cornerSize, 3, cornerSize, 'F');

  // ===== HEADER SECTION =====
  // Logo centered at top
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', width / 2 - 40, 18, 80, 28);
  } else {
    // Fallback text if no logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 180, 90);
    doc.text('AFRISEC HUNTERS', width / 2, 35, { align: 'center' });
  }

  // Decorative line under logo
  doc.setDrawColor(0, 180, 90);
  doc.setLineWidth(1);
  doc.line(width / 2 - 50, 50, width / 2 + 50, 50);

  // Small decorative elements
  doc.setFillColor(0, 180, 90);
  doc.circle(width / 2 - 55, 50, 2, 'F');
  doc.circle(width / 2 + 55, 50, 2, 'F');

  // ===== CERTIFICATE TITLE =====
  doc.setFont('times', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(50, 50, 50);
  doc.text('CERTIFICADO DE RANKING', width / 2, 68, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(120, 120, 120);
  doc.text('Este documento certifica que', width / 2, 80, { align: 'center' });

  // ===== RECIPIENT NAME =====
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(42);
  doc.setTextColor(0, 100, 60);
  doc.text(data.pentesterName, width / 2, 100, { align: 'center' });

  // Elegant underline for name
  const nameWidth = doc.getTextWidth(data.pentesterName);
  doc.setDrawColor(0, 180, 90);
  doc.setLineWidth(0.8);
  doc.line(width / 2 - nameWidth / 2 - 5, 104, width / 2 + nameWidth / 2 + 5, 104);

  // ===== ACHIEVEMENT =====
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(100, 100, 100);
  doc.text(`alcancou com excelencia o nivel de`, width / 2, 118, { align: 'center' });

  // Rank box
  const rankBoxWidth = 100;
  const rankBoxX = (width - rankBoxWidth) / 2;
  doc.setFillColor(0, 180, 90);
  doc.roundedRect(rankBoxX, 124, rankBoxWidth, 18, 3, 3, 'F');

  // Rank title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(data.rankTitle.toUpperCase(), width / 2, 136, { align: 'center' });

  // Points
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`com ${data.points.toLocaleString()} pontos conquistados`, width / 2, 152, { align: 'center' });

  // ===== FOOTER SECTION =====
  const footerY = height - 35;

  // Decorative line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(30, footerY - 10, width - 30, footerY - 10);

  // Signature section (left)
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(40, footerY + 5, 100, footerY + 5);
  
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('AfriSec Hunters', 70, footerY + 2, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text('Plataforma de Bug Bounty', 70, footerY + 12, { align: 'center' });

  // Date section (center)
  const formattedDate = new Date(data.issuedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  doc.setDrawColor(150, 150, 150);
  doc.line(width / 2 - 30, footerY + 5, width / 2 + 30, footerY + 5);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(formattedDate, width / 2, footerY + 2, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text('Data de Emissao', width / 2, footerY + 12, { align: 'center' });

  // Verification section (right)
  doc.setDrawColor(150, 150, 150);
  doc.line(width - 100, footerY + 5, width - 40, footerY + 5);
  
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 180, 90);
  doc.text(data.certificateCode, width - 70, footerY + 2, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text('Codigo de Verificacao', width - 70, footerY + 12, { align: 'center' });

  // Bottom verification URL
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text('Verifique a autenticidade em: afrisechunters.com/certificate/' + data.certificateCode, width / 2, height - 12, { align: 'center' });

  // Download
  doc.save(`certificado_${data.certificateCode}.pdf`);
}
