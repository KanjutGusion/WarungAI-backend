import { Injectable, Logger } from '@nestjs/common';
import { Workbook } from 'exceljs';
import PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';
import { Readable } from 'stream';

export interface SalesExportData {
  id: string;
  created_at: Date;
  item_count: number;
  total_amount: number;
  profit: number;
  items: Array<{
    name: string;
    qty: number;
    subtotal: number;
  }>;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  /**
   * Export sales data to CSV
   */
  exportToCSV(data: SalesExportData[]): Buffer {
    const records = data.flatMap((sale) =>
      sale.items.map((item) => ({
        transaction_id: sale.id,
        date: sale.created_at.toISOString(),
        item_name: item.name,
        quantity: item.qty,
        subtotal: item.subtotal,
        total_amount: sale.total_amount,
        profit: sale.profit,
      })),
    );

    const csv = stringify(records, {
      header: true,
      columns: [
        'transaction_id',
        'date',
        'item_name',
        'quantity',
        'subtotal',
        'total_amount',
        'profit',
      ],
    });

    return Buffer.from(csv);
  }

  /**
   * Export sales data to Excel
   */
  async exportToExcel(
    data: SalesExportData[],
    summary?: {
      total_sales: number;
      total_profit: number;
      avg_profit_margin: number;
      transaction_count: number;
    },
  ): Promise<Buffer> {
    const workbook = new Workbook();

    // Summary sheet
    if (summary) {
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 },
      ];

      summarySheet.addRows([
        {
          metric: 'Total Sales',
          value: `Rp ${summary.total_sales.toLocaleString('id-ID')}`,
        },
        {
          metric: 'Total Profit',
          value: `Rp ${summary.total_profit.toLocaleString('id-ID')}`,
        },
        {
          metric: 'Average Profit Margin',
          value: `${summary.avg_profit_margin}%`,
        },
        { metric: 'Transaction Count', value: summary.transaction_count },
      ]);

      // Style header
      summarySheet.getRow(1).font = { bold: true };
      summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
    }

    // Transactions sheet
    const transactionsSheet = workbook.addWorksheet('Transactions');
    transactionsSheet.columns = [
      { header: 'Transaction ID', key: 'id', width: 36 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Item Count', key: 'item_count', width: 12 },
      { header: 'Total Amount', key: 'total_amount', width: 15 },
      { header: 'Profit', key: 'profit', width: 15 },
    ];

    data.forEach((sale) => {
      transactionsSheet.addRow({
        id: sale.id,
        date: sale.created_at.toLocaleString('id-ID'),
        item_count: sale.item_count,
        total_amount: sale.total_amount,
        profit: sale.profit,
      });
    });

    // Style header
    transactionsSheet.getRow(1).font = { bold: true };
    transactionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    // Items detail sheet
    const itemsSheet = workbook.addWorksheet('Items Detail');
    itemsSheet.columns = [
      { header: 'Transaction ID', key: 'transaction_id', width: 36 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Item Name', key: 'item_name', width: 30 },
      { header: 'Quantity', key: 'qty', width: 10 },
      { header: 'Subtotal', key: 'subtotal', width: 15 },
    ];

    data.forEach((sale) => {
      sale.items.forEach((item) => {
        itemsSheet.addRow({
          transaction_id: sale.id,
          date: sale.created_at.toLocaleString('id-ID'),
          item_name: item.name,
          qty: item.qty,
          subtotal: item.subtotal,
        });
      });
    });

    // Style header
    itemsSheet.getRow(1).font = { bold: true };
    itemsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export sales report to PDF
   */
  async exportToPDF(
    data: SalesExportData[],
    summary: {
      total_sales: number;
      total_profit: number;
      avg_profit_margin: number;
      transaction_count: number;
    },
    businessName: string = 'WarungSense',
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(businessName, { align: 'center' });
      doc
        .fontSize(14)
        .font('Helvetica')
        .text('Sales Report', { align: 'center' });
      doc.moveDown();
      doc
        .fontSize(10)
        .text(`Generated: ${new Date().toLocaleString('id-ID')}`, {
          align: 'center',
        });
      doc.moveDown(2);

      // Summary Section
      doc.fontSize(14).font('Helvetica-Bold').text('Summary');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');

      const summaryData = [
        ['Total Sales', `Rp ${summary.total_sales.toLocaleString('id-ID')}`],
        ['Total Profit', `Rp ${summary.total_profit.toLocaleString('id-ID')}`],
        ['Average Profit Margin', `${summary.avg_profit_margin.toFixed(2)}%`],
        ['Transaction Count', summary.transaction_count.toString()],
      ];

      summaryData.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`);
      });

      doc.moveDown(2);

      // Transactions Section
      doc.fontSize(14).font('Helvetica-Bold').text('Recent Transactions');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');

      // Table header
      const tableTop = doc.y;
      const colWidths = [150, 80, 80, 80];
      const headers = ['Date', 'Items', 'Total', 'Profit'];

      let xPos = 50;
      headers.forEach((header, i) => {
        doc.font('Helvetica-Bold').text(header, xPos, tableTop, {
          width: colWidths[i],
          align: 'left',
        });
        xPos += colWidths[i];
      });

      doc.moveDown(0.5);
      doc.font('Helvetica');

      // Table rows
      data.slice(0, 20).forEach((sale) => {
        const y = doc.y;
        xPos = 50;

        const rowData = [
          sale.created_at.toLocaleDateString('id-ID'),
          `${sale.item_count} items`,
          `Rp ${sale.total_amount.toLocaleString('id-ID')}`,
          `Rp ${sale.profit.toLocaleString('id-ID')}`,
        ];

        rowData.forEach((text, i) => {
          doc.text(text, xPos, y, {
            width: colWidths[i],
            align: 'left',
          });
          xPos += colWidths[i];
        });

        doc.moveDown(0.3);

        // Add new page if needed
        if (doc.y > 700) {
          doc.addPage();
        }
      });

      // Footer
      doc
        .fontSize(8)
        .text(
          `Page ${doc.bufferedPageRange().count}`,
          50,
          doc.page.height - 50,
          { align: 'center' },
        );

      doc.end();
    });
  }

  /**
   * Create a readable stream from buffer
   */
  createReadableStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }
}
