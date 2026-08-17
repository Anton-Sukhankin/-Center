import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
import fs from 'node:fs/promises';

const workbookPath = 'C:/Users/armad/OneDrive/Документы/Vstrecha/LK_PK/Метрики Закупка.xlsx';
const blob = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(blob);

const result = await workbook.inspect({
  kind: 'workbook,sheet,table',
  maxChars: 30000,
  tableMaxRows: 80,
  tableMaxCols: 24,
  tableMaxCellChars: 200,
  include: 'values,formulas'
});

console.log(result.ndjson);

const preview = await workbook.render({
  sheetName: 'Лист1',
  range: 'A1:F20',
  autoCrop: 'all',
  scale: 1.5,
  format: 'png'
});
await fs.writeFile('./procurement-metrics.png', new Uint8Array(await preview.arrayBuffer()));
