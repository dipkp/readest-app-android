import { convertToEpub } from '@/services/send/conversion/convertToEpub';

type ConvertibleDocumentKind = 'docx' | 'xlsx';

const getConvertibleKind = (name: string): ConvertibleDocumentKind | null => {
  const extension = name.split('.').pop()?.toLowerCase();
  return extension === 'docx' || extension === 'xlsx' ? extension : null;
};

export const isConvertibleDocumentName = (name: string): boolean =>
  getConvertibleKind(name) !== null;

/** Convert office documents into the EPUB representation used by the reader. */
export const convertImportableDocument = async (file: File): Promise<File> => {
  const kind = getConvertibleKind(file.name);
  if (!kind) return file;

  const converted = await convertToEpub({
    kind,
    bytes: await file.arrayBuffer(),
    fileName: file.name,
  });
  return converted.file;
};
