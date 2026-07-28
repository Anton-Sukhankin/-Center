import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const window = { structuredClone };
const context = vm.createContext({ window, console });
for (const file of ['construction-objects-data.js', 'objects-data.js', 'digital-chessboard-summary-data.js']) {
    vm.runInContext(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), context, { filename: file });
}

const project = {
    type: 'project', id: 'proj-nova', projectId: 'proj-nova',
    entity: { name: 'Nova', headerAttributes: { region: 'Москва', cluster: 'Премиум' } }
};
const queue = {
    type: 'queue', id: 'q-n-1', projectId: 'proj-nova',
    entity: { name: 'Очередь 1' }, parentProject: { name: 'Nova' }
};
const businessUnit = { type: 'bu', id: 'bu-2', entity: { name: 'БИЗНЕС-ЮНИТ МОСКВА' } };

const projectModel = window.digitalChessboardSummaryData.getForContext(project);
assert.equal(projectModel.project.id, 'proj-nova');
assert.equal(projectModel.kpis.length, 6);
assert.equal(projectModel.objects.length, 5);
assert.equal(projectModel.attentionItems.length, 12);
assert.equal(window.digitalChessboardSummaryData.validate(projectModel).length, 0);

const queueModel = window.digitalChessboardSummaryData.getForContext(queue);
assert.equal(queueModel.project.id, 'proj-nova');
assert.equal(queueModel.contextKey, 'queue:q-n-1');
assert.equal(window.digitalChessboardSummaryData.validate(queueModel).length, 0);

projectModel.objects[0].name = 'mutated';
assert.notEqual(window.digitalChessboardSummaryData.getForContext(project).objects[0].name, 'mutated');

const unsupported = window.digitalChessboardSummaryData.getForContext(businessUnit);
assert.equal(unsupported.status, 'unsupported-context');
assert.equal(unsupported.objects.length, 0);
assert.equal(window.digitalChessboardSummaryData.validate(unsupported).length, 0);

console.log('digitalChessboardSummaryData: OK — project/queue/BU, 6 KPI, 5 объектов и clone semantics проверены.');
