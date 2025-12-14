import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPdf<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; label: string }[],
  title?: string
) {
  if (data.length === 0) {
    return;
  }

  const doc = new jsPDF();
  
  // Add title
  if (title) {
    doc.setFontSize(18);
    doc.setTextColor(0, 255, 65); // Primary green color
    doc.text(title, 14, 22);
  }

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, title ? 30 : 14);

  // Prepare headers and data
  const headers = columns.map(col => col.label);
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    });
  });

  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? 35 : 20,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [0, 80, 40],
      textColor: [0, 255, 65],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [20, 20, 20],
    },
    bodyStyles: {
      textColor: [200, 200, 200],
    },
    theme: 'grid',
  });

  // Download
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}
