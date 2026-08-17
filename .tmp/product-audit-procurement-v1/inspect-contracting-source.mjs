import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const source = await FileBlob.load('C:/Users/armad/OneDrive/Документы/Vstrecha/LK_PK/Метрики Закупка.xlsx');
const workbook = await SpreadsheetFile.importXlsx(source);
const result = await workbook.inspect({
  kind: 'table',
  sheetId: 'Лист1',
  range: 'A5:F10',
  include: 'values,formulas',
  tableMaxRows: 10,
  tableMaxCols: 6,
  maxChars: 12000,
});
console.log(result.ndjson);
