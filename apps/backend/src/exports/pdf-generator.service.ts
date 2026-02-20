import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface PdfReportData {
  period: string;
  user: { name: string; email: string };
  summary: {
    totalSpent: number;
    invoiceCount: number;
    avgTicket: number;
    topCategory: string;
  };
  categoryBreakdown: Array<{
    name: string;
    emoji: string;
    total: number;
    percentage: number;
  }>;
  storeBreakdown: Array<{ name: string; total: number }>;
  invoices: Array<{
    date: string;
    storeName: string;
    total: number;
    itemCount: number;
  }>;
}

// Brand colors
const GREEN = '#4CAF7D';
const DARK = '#1C1C1E';
const MUTED = '#6B7280';
const BORDER = '#EBEBEB';
const LIGHT_BG = '#F9FAFB';
const ACCENT = '#1B4F72';

@Injectable()
export class PdfGeneratorService {
  async generateReport(data: PdfReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
          info: {
            Title: `Relatório Comprei — ${data.period}`,
            Author: 'Comprei App',
            Creator: 'Comprei App',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.buildPage1(doc, data);
        this.buildPage2(doc, data);
        this.addPageNumbers(doc);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // ---------- PAGE 1 ----------

  private buildPage1(doc: PDFKit.PDFDocument, data: PdfReportData) {
    this.addHeader(doc, data);
    this.addSummaryStats(doc, data);
    this.addCategorySection(doc, data);
    this.addStoreSection(doc, data);
  }

  private addHeader(doc: PDFKit.PDFDocument, data: PdfReportData) {
    // Green accent bar
    doc.rect(0, 0, 595, 8).fill(GREEN);

    // Title block
    doc.fontSize(26).fillColor(GREEN).font('Helvetica-Bold').text('Comprei', 50, 30);
    doc.fontSize(13).fillColor(DARK).font('Helvetica').text('Relatório de Gastos', 50, 62);
    doc.fontSize(10).fillColor(MUTED).text(data.period, 50, 80);

    // User info (right)
    doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold').text(data.user.name, 310, 40, { width: 235, align: 'right' });
    doc.fontSize(9).fillColor(MUTED).font('Helvetica').text(data.user.email, 310, 56, { width: 235, align: 'right' });

    // Divider
    doc.moveTo(50, 100).lineTo(545, 100).strokeColor(BORDER).lineWidth(1).stroke();
    doc.y = 120;
  }

  private addSummaryStats(doc: PDFKit.PDFDocument, data: PdfReportData) {
    const stats = [
      { label: 'TOTAL GASTO', value: `R$ ${data.summary.totalSpent.toFixed(2)}` },
      { label: 'TICKET MÉDIO', value: `R$ ${data.summary.avgTicket.toFixed(2)}` },
      { label: 'COMPRAS', value: String(data.summary.invoiceCount) },
      { label: 'CATEGORIA TOP', value: data.summary.topCategory },
    ];

    const y = 130;
    const cardW = 117;
    const gap = 9;

    stats.forEach((stat, i) => {
      const x = 50 + i * (cardW + gap);

      // Card bg
      doc.roundedRect(x, y, cardW, 64, 8).fillAndStroke(LIGHT_BG, BORDER);

      // Label
      doc.fontSize(7).fillColor(MUTED).font('Helvetica-Bold')
        .text(stat.label, x + 8, y + 10, { width: cardW - 16 });

      // Value
      doc.fontSize(13).fillColor(DARK).font('Helvetica-Bold')
        .text(stat.value, x + 8, y + 27, { width: cardW - 16, ellipsis: true });

      doc.font('Helvetica');
    });

    doc.y = y + 80;
  }

  private addCategorySection(doc: PDFKit.PDFDocument, data: PdfReportData) {
    if (data.categoryBreakdown.length === 0) return;

    this.sectionTitle(doc, '📊  Gastos por Categoria');

    const CHART_COLORS = [GREEN, '#F5A623', ACCENT, '#E74C3C', '#7C3AED', '#3498DB', '#E5E7EB'];

    data.categoryBreakdown.slice(0, 7).forEach((cat, i) => {
      const y = doc.y;
      const barMaxW = 300;
      const barH = 14;
      const barW = Math.max(4, barMaxW * (cat.percentage / 100));
      const color = CHART_COLORS[i % CHART_COLORS.length];

      // Emoji + name
      doc.fontSize(10).fillColor(DARK).font('Helvetica')
        .text(`${cat.emoji} ${cat.name}`, 50, y + 2, { width: 180 });

      // Bar background
      doc.roundedRect(240, y, barMaxW, barH, 4).fillColor('#EBEBEB').fill();

      // Bar fill
      doc.roundedRect(240, y, barW, barH, 4).fillColor(color).fill();

      // Percentage + value
      doc.fontSize(9).fillColor(MUTED).font('Helvetica')
        .text(`${cat.percentage}%  R$ ${cat.total.toFixed(2)}`, 548, y + 2, { align: 'right', width: 100 });

      doc.y = y + 22;
    });

    doc.y += 8;
  }

  private addStoreSection(doc: PDFKit.PDFDocument, data: PdfReportData) {
    if (data.storeBreakdown.length === 0) return;

    this.sectionTitle(doc, '🏬  Top Estabelecimentos');

    // Table header
    const hY = doc.y;
    doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold')
      .text('ESTABELECIMENTO', 50, hY)
      .text('TOTAL', 450, hY, { width: 95, align: 'right' });

    doc.moveTo(50, hY + 14).lineTo(545, hY + 14).strokeColor(BORDER).lineWidth(0.5).stroke();
    doc.y = hY + 20;

    data.storeBreakdown.slice(0, 7).forEach((store, i) => {
      const rowY = doc.y;

      if (i % 2 === 0) {
        doc.rect(50, rowY - 2, 495, 18).fillColor(LIGHT_BG).fill();
      }

      doc.fontSize(10).fillColor(DARK).font('Helvetica')
        .text(store.name, 54, rowY, { width: 350, ellipsis: true });

      doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold')
        .text(`R$ ${store.total.toFixed(2)}`, 450, rowY, { width: 95, align: 'right' });

      doc.font('Helvetica');
      doc.y = rowY + 18;
    });
  }

  // ---------- PAGE 2: Invoice list ----------

  private buildPage2(doc: PDFKit.PDFDocument, data: PdfReportData) {
    if (data.invoices.length === 0) return;

    doc.addPage();
    this.sectionTitle(doc, '🧾  Lista de Compras', 50);

    // Table header
    const hY = doc.y;
    doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold')
      .text('DATA', 50, hY)
      .text('ESTABELECIMENTO', 110, hY)
      .text('ITENS', 380, hY)
      .text('TOTAL', 450, hY, { width: 95, align: 'right' });

    doc.moveTo(50, hY + 14).lineTo(545, hY + 14).strokeColor(BORDER).lineWidth(0.5).stroke();
    doc.y = hY + 20;

    data.invoices.forEach((inv, i) => {
      if (doc.y > 740) {
        doc.addPage();
        doc.y = 50;
      }

      const rowY = doc.y;

      if (i % 2 === 0) {
        doc.rect(50, rowY - 2, 495, 18).fillColor(LIGHT_BG).fill();
      }

      doc.fontSize(9).fillColor(DARK).font('Helvetica')
        .text(inv.date, 50, rowY, { width: 55 })
        .text(inv.storeName, 110, rowY, { width: 260, ellipsis: true })
        .text(String(inv.itemCount), 380, rowY, { width: 60 });

      doc.font('Helvetica-Bold')
        .text(`R$ ${inv.total.toFixed(2)}`, 450, rowY, { width: 95, align: 'right' });

      doc.font('Helvetica');
      doc.y = rowY + 18;
    });
  }

  // ---------- Helpers ----------

  private sectionTitle(doc: PDFKit.PDFDocument, title: string, marginTop = 16) {
    doc.y += marginTop;
    doc.fontSize(13).fillColor(DARK).font('Helvetica-Bold').text(title, 50, doc.y);
    doc.y += 16;
  }

  private addPageNumbers(doc: PDFKit.PDFDocument) {
    const range = doc.bufferedPageRange();
    const now = new Date().toLocaleDateString('pt-BR');

    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);

      doc.fontSize(8).fillColor(MUTED).font('Helvetica')
        .text(
          `Gerado em ${now} via Comprei App  •  Página ${i + 1} de ${range.count}`,
          50,
          doc.page.height - 40,
          { align: 'center', width: 495 },
        );
    }
  }
}
