import { describe, expect, test } from 'vitest';
import { Workbook } from 'exceljs';
import { spreadsheetToHtml } from '@/services/send/conversion/convertToEpub';

describe('spreadsheetToHtml', () => {
  test('renders each worksheet and uses formula results', async () => {
    const workbook = new Workbook();
    const summary = workbook.addWorksheet('Summary');
    summary.addRow(['Item', 'Total']);
    summary.addRow(['Books', { formula: '1+2', result: 3 }]);
    const notes = workbook.addWorksheet('Notes');
    notes.addRow(['Ready']);
    const buffer = await workbook.xlsx.writeBuffer();
    const bytes = new Uint8Array(buffer).slice().buffer;

    const html = await spreadsheetToHtml(bytes);

    expect(html).toContain('<h1>Summary</h1>');
    expect(html).toContain('<th>Item</th>');
    expect(html).toContain('<td>Books</td><td>3</td>');
    expect(html).toContain('<h1>Notes</h1>');
  });
});
