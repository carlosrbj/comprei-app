import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ExportsService {
  constructor(
    private prisma: PrismaService,
    private pdf: PdfGeneratorService,
    private excel: ExcelGeneratorService,
  ) {}

  async exportPdf(userId: string, startDate: Date, endDate: Date): Promise<Buffer> {
    const data = await this.buildPdfData(userId, startDate, endDate);
    return this.pdf.generateReport(data);
  }

  async exportExcel(userId: string, startDate: Date, endDate: Date): Promise<Buffer> {
    const data = await this.buildExcelData(userId, startDate, endDate);
    return this.excel.generateExcel(data);
  }

  async exportCsv(userId: string, startDate: Date, endDate: Date): Promise<string> {
    const data = await this.buildExcelData(userId, startDate, endDate);
    return this.excel.generateCsv(data);
  }

  // ---------- Private ----------

  private toNum(v: Decimal | number | null | undefined): number {
    if (v == null) return 0;
    return typeof v === 'number' ? v : Number(v.toString());
  }

  private async buildPdfData(userId: string, startDate: Date, endDate: Date) {
    const [user, invoices] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
      this.prisma.invoice.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        include: {
          items: {
            include: { product: { include: { category: true } } },
          },
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    const totalSpent = invoices.reduce((s, inv) => s + this.toNum(inv.totalValue), 0);
    const invoiceCount = invoices.length;
    const avgTicket = invoiceCount > 0 ? totalSpent / invoiceCount : 0;

    // Category breakdown
    const catMap = new Map<string, { name: string; emoji: string; total: number }>();
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const cat = item.product?.category;
        if (!cat) return;
        const prev = catMap.get(cat.id) ?? { name: cat.name, emoji: cat.emoji, total: 0 };
        prev.total += this.toNum(item.totalPrice);
        catMap.set(cat.id, prev);
      });
    });

    const categoryBreakdown = [...catMap.values()]
      .sort((a, b) => b.total - a.total)
      .map((c) => ({
        ...c,
        percentage: totalSpent > 0 ? Math.round((c.total / totalSpent) * 100) : 0,
      }));

    // Store breakdown
    const storeMap = new Map<string, number>();
    invoices.forEach((inv) => {
      const name = inv.establishmentName || 'Outros';
      storeMap.set(name, (storeMap.get(name) ?? 0) + this.toNum(inv.totalValue));
    });

    const storeBreakdown = [...storeMap.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    const period = `${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`;

    return {
      period,
      user: { name: user?.name ?? 'Usuário', email: user?.email ?? '' },
      summary: {
        totalSpent,
        invoiceCount,
        avgTicket,
        topCategory: categoryBreakdown[0]?.name ?? 'N/A',
      },
      categoryBreakdown,
      storeBreakdown,
      invoices: invoices.map((inv) => ({
        date: inv.date.toLocaleDateString('pt-BR'),
        storeName: inv.establishmentName ?? 'Estabelecimento',
        total: this.toNum(inv.totalValue),
        itemCount: inv.items.length,
      })),
    };
  }

  private async buildExcelData(userId: string, startDate: Date, endDate: Date) {
    const invoices = await this.prisma.invoice.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
      },
      orderBy: { date: 'desc' },
    });

    return {
      invoices: invoices.map((inv) => ({
        id: inv.id,
        date: inv.date.toLocaleDateString('pt-BR'),
        storeName: inv.establishmentName ?? 'Estabelecimento',
        storeCnpj: '',
        total: this.toNum(inv.totalValue),
        items: inv.items.map((item) => ({
          name: item.product?.description ?? 'Produto',
          category: item.product?.category?.name ?? 'Outros',
          quantity: this.toNum(item.quantity),
          unitPrice: this.toNum(item.unitPrice),
          totalPrice: this.toNum(item.totalPrice),
        })),
      })),
    };
  }
}
