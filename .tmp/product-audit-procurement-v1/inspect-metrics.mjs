import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const workbookPath = 'C:/Users/armad/OneDrive/Документы/Vstrecha/LK_PK/Метрики Закупка.xlsx';
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const sheets = await workbook.inspect({ kind: 'sheet', include: 'id,name', maxChars: 4000 });
console.log('SHEETS');
console.log(sheets.ndjson);

for (const term of ['лот', 'участник', 'срок', 'превыш', 'законтракт', 'бюджет']) {
  const result = await workbook.inspect({
    kind: 'match',
    searchTerm: term,
    options: { useRegex: false, maxResults: 50 },
    maxChars: 10000,
  });
  console.log(`MATCH:${term}`);
  console.log(result.ndjson);
}
