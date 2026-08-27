import { describe, expect, test, vi } from 'vitest';

vi.mock('@/services/send/conversion/convertToEpub', () => ({
  convertToEpub: vi.fn(async ({ kind }: { kind: string }) => ({
    file: new File([kind], `${kind}.epub`, { type: 'application/epub+zip' }),
    title: kind,
    author: '',
  })),
}));

import { convertImportableDocument, isConvertibleDocumentName } from '@/services/importConversion';
import { convertToEpub } from '@/services/send/conversion/convertToEpub';

describe('isConvertibleDocumentName', () => {
  test('recognizes DOCX and XLSX case-insensitively', () => {
    expect(isConvertibleDocumentName('notes.docx')).toBe(true);
    expect(isConvertibleDocumentName('REPORT.DOCX')).toBe(true);
    expect(isConvertibleDocumentName('budget.xlsx')).toBe(true);
    expect(isConvertibleDocumentName('book.epub')).toBe(false);
  });
});

describe('convertImportableDocument', () => {
  test('converts DOCX through the existing EPUB conversion pipeline', async () => {
    const input = new File(['docx'], 'notes.docx');
    const output = await convertImportableDocument(input);

    expect(convertToEpub).toHaveBeenCalledWith({
      kind: 'docx',
      bytes: expect.any(ArrayBuffer),
      fileName: 'notes.docx',
    });
    expect(output.name).toBe('docx.epub');
  });

  test('converts XLSX through the EPUB conversion pipeline', async () => {
    const input = new File(['xlsx'], 'budget.xlsx');
    const output = await convertImportableDocument(input);

    expect(convertToEpub).toHaveBeenCalledWith({
      kind: 'xlsx',
      bytes: expect.any(ArrayBuffer),
      fileName: 'budget.xlsx',
    });
    expect(output.name).toBe('xlsx.epub');
  });

  test('returns native reader formats unchanged', async () => {
    const input = new File(['epub'], 'book.epub');
    await expect(convertImportableDocument(input)).resolves.toBe(input);
  });
});
