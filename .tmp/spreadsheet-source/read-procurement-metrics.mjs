import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const workbookPath = 'C:/Users/armad/OneDrive/Документы/Vstrecha/LK_PK/Метрики Закупка.xlsx';
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const overview = await workbook.inspect({
  kind: 'workbook,sheet,table',
  maxChars: 16000,
  tableMaxRows: 40,
  tableMaxCols: 12,
  tableMaxCellChars: 160,
});

console.log(overview.ndjson);
