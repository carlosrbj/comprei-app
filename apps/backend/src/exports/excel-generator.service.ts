import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';

export interface ExcelExportData {
  invoices: Array<{
    id: string;
    date: string;
    storeName: string;
    storeCnpj: string;
    total: number;
    items: Array<{
      name: string;
      category: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  }>;
}

const HEADER_COLOR = '4CAF7D';
const ALT_ROW_COLOR = 'F9FAFB';

@Injectable()
export class ExcelGeneratorService {
  async generateExcel(data: ExcelExportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Comprei App';
    workbook.created = new Date();

    this.buildInvoicesSheet(workbook, data);
    this.buildItemsSheet(workbook, data);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateCsv(data: ExcelExportData): Promise<string> {
    const rows: string[][] = [
      ['Data', 'Estabelecimento', 'CNPJ', 'Produto', 'Categoria', 'Quantidade', 'Preço Unit.', 'Total'],
    ];

    data.invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        rows.push([
          inv.date,
          this.escapeCsv(inv.storeName),
          inv.storeCnpj,
          this.escapeCsv(item.name),
          this.escapeCsv(item.category),
          item.quantity.toString(),
          item.unitPrice.toFixed(2),
          item.totalPrice.toFixed(2),
        ]);
      });
    });

    return rows.map((row) => row.join(',')).join('\n');
  }

  // ---------- Private ----------

  private buildInvoicesSheet(wb: ExcelJS.Workbook, data: ExcelExportData) {
    const ws = wb.addWorksheet('Notas Fiscais', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    ws.columns = [
      { header: 'Data', key: 'date', width: 13 },
      { header: 'Estabelecimento', key: 'storeName', width: 32 },
      { header: 'CNPJ', key: 'storeCnpj', width: 20 },
      { header: 'Qtd Itens', key: 'itemCount', width: 10 },
      { header: 'Total (R$)', key: 'total', width: 14 },
    ];

    this.styleHeader(ws, 5);

    data.invoices.forEach((inv, i) => {
      const row = ws.addRow({
        date: inv.date,
        storeName: inv.storeName,
        storeCnpj: inv.storeCnpj,
        itemCount: inv.items.length,
        total: inv.total,
      });

      if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALT_ROW_COLOR } };
      }

      // Bold total
      row.getCell('total').font = { bold: true };
    });

    ws.getColumn('total').numFmt = 'R$ #,##0.00';
    ws.getColumn('itemCount').alignment = { horizontal: 'center' };
  }

  private buildItemsSheet(wb: ExcelJS.Workbook, data: ExcelExportData) {
    const ws = wb.addWorksheet('Produtos', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    ws.columns = [
      { header: 'Data', key: 'date', width: 13 },
      { header: 'Estabelecimento', key: 'store', width: 28 },
      { header: 'Produto', key: 'product', width: 38 },
      { header: 'Categoria', key: 'category', width: 22 },
      { header: 'Qtd', key: 'quantity', width: 8 },
      { header: 'Preço Unit. (R$)', key: 'unitPrice', width: 16 },
      { header: 'Total (R$)', key: 'total', width: 14 },
    ];

    this.styleHeader(ws, 7);

    let rowIdx = 0;
    data.invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const row = ws.addRow({
          date: inv.date,
          store: inv.storeName,
          product: item.name,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.totalPrice,
        });

        if (rowIdx % 2 === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALT_ROW_COLOR } };
        }
        rowIdx++;
      });
    });

    ws.getColumn('unitPrice').numFmt = 'R$ #,##0.00';
    ws.getColumn('total').numFmt = 'R$ #,##0.00';
    ws.getColumn('quantity').numFmt = '#,##0.000';
    ws.getColumn('quantity').alignment = { horizontal: 'center' };
  }

  private styleHeader(ws: ExcelJS.Worksheet, colCount: number) {
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
    header.alignment = { horizontal: 'center', vertical: 'middle' };
    header.height = 22;

    // Thin borders for all header cells
    for (let c = 1; c <= colCount; c++) {
      header.getCell(c).border = {
        bottom: { style: 'thin', color: { argb: 'FF3A9A6A' } },
      };
    }
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
