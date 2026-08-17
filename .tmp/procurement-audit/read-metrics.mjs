import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const path = 'C:/Users/armad/OneDrive/Документы/Vstrecha/LK_PK/Метрики Закупка.xlsx';
const input = await FileBlob.load(path);
const workbook = await SpreadsheetFile.importXlsx(input);
const result = await workbook.inspect({
  kind: 'table',
  sheetId: 'Лист1',
  range: 'A1:F20',
  include: 'values,formulas',
  tableMaxRows: 24,
  tableMaxCols: 8,
  tableMaxCellChars: 240,
  maxChars: 18000,
});
console.log(result.ndjson);
