import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../../', import.meta.url);
const [indexHtml, appSource, featureSource, objectsSource] = await Promise.all([
    readFile(new URL('index.html', root), 'utf8'),
    readFile(new URL('src/app/app.js', root), 'utf8'),
    readFile(new URL('src/features/digital-chessboard-summary/digital-chessboard-summary.js', root), 'utf8'),
    readFile(new URL('src/features/objects/objects.js', root), 'utf8')
]);

assert.match(indexHtml, /data-main-view="digital-chessboard-summary"/);
assert.match(indexHtml, /id="digital-chessboard-summary-view"/);
assert.match(indexHtml, /src\/data\/digital-chessboard-summary-data\.js/);
assert.match(indexHtml, /src\/components\/construction-table\/construction-table\.js/);
assert.match(indexHtml, /src\/features\/digital-chessboard-summary\/digital-chessboard-summary\.js/);
assert.doesNotMatch(indexHtml, /data-main-view="digital-chessboard"/);
assert.doesNotMatch(indexHtml, /src\/data\/digital-chessboard-data\.js/);
assert.doesNotMatch(indexHtml, /src\/features\/digital-chessboard\/digital-chessboard\.js/);

assert.match(appSource, /window\.SCenterDigitalChessboardSummary/);
assert.match(appSource, /'dashboard', 'digital-chessboard-summary', 'objects'/);
assert.doesNotMatch(appSource, /window\.SCenterDigitalChessboard\b/);
assert.doesNotMatch(appSource, /window\.digitalChessboardData\b/);
assert.match(appSource, /digitalChessboardSummaryFeature\.mount/);
assert.match(appSource, /digitalChessboardSummaryFeature\.setContext/);

for (const lifecycleMethod of ['mount', 'setContext', 'show', 'hide', 'closeOverlays', 'destroy']) {
    assert.match(featureSource, new RegExp(`\\b${lifecycleMethod}\\b`));
}
assert.match(featureSource, /SCenterConstructionTable\?\.bind/);
assert.match(objectsSource, /SCenterConstructionTable\.bind/);

console.log('digitalChessboardSummary feature integration: OK — retired chessboard route отсутствует, three-view controller, lifecycle и shared table contract проверены.');
