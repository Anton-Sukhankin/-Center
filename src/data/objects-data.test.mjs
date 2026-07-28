import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function runClassicScript(relativePath, context) {
    const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
    vm.runInContext(source, context, { filename: relativePath });
}

const browserWindow = { structuredClone };
browserWindow.window = browserWindow;
const context = vm.createContext(browserWindow);

await runClassicScript('./construction-objects-data.js', context);
await runClassicScript('./objects-data.js', context);

const identityApi = browserWindow.constructionObjectsData;
const objectsApi = browserWindow.objectsData;
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.equal(identityApi.validate().length, 0);
assert.equal(identityApi.getAll().length, 5);
assert.equal(identityApi.getById('house-1').name, 'Дом 1');
assert.equal(identityApi.getById('missing'), null);

const identityCopy = identityApi.getAll();
identityCopy[0].name = 'Изменено потребителем';
assert.equal(identityApi.getById('house-1').name, 'Дом 1', 'catalog не должен отдавать mutable reference');

const projectModel = objectsApi.getForContext({ type: 'project', id: 'proj-nova' });
assert.equal(projectModel.status, 'ready');
assert.equal(projectModel.projectId, 'proj-nova');
assert.equal(projectModel.contextId, 'proj-nova');
assert.equal(projectModel.objects.length, 5);
assert.equal(objectsApi.validate(projectModel).length, 0);

const queueModel = objectsApi.getForContext({ type: 'queue', id: 'q-n-2', projectId: 'proj-nova' });
assert.equal(queueModel.status, 'ready');
assert.equal(queueModel.projectId, 'proj-nova');
assert.equal(queueModel.contextId, 'q-n-2');
assert.deepEqual(plain(queueModel.objects), plain(projectModel.objects), 'очереди одного проекта используют одну project-модель');

const unsupportedModel = objectsApi.getForContext({ type: 'bu', id: 'bu-2', projectId: 'proj-nova' });
assert.equal(unsupportedModel.status, 'unsupported-context');
assert.equal(unsupportedModel.projectId, null);
assert.equal(unsupportedModel.objects.length, 0);

let totalRows = 0;
projectModel.objects.forEach((object) => {
    const catalogObject = identityApi.getById(object.id);
    assert.deepEqual(plain({ id: object.id, name: object.name, type: object.type, typeLabel: object.typeLabel, icon: object.icon }), plain(catalogObject));

    const groups = object.workRows.filter((row) => row.depth === 0);
    const children = object.workRows.filter((row) => row.depth === 1);
    assert.equal(groups.length, 32);
    assert.equal(groups.reduce((sum, group) => sum + group.weightPercent, 0), 100);
    groups.forEach((group) => {
        const groupChildren = children.filter((child) => child.parentId === group.id);
        assert.ok(groupChildren.length >= 15 && groupChildren.length <= 27);
        assert.equal(new Set(groupChildren.map((child) => child.name)).size, groupChildren.length);
    });
    totalRows += object.workRows.length;
});
assert.equal(totalRows, 3415);

projectModel.objects[0].name = 'Mutation';
projectModel.objects[0].workRows[0].name = 'Mutation';
const cleanModel = objectsApi.getForContext({ type: 'project', id: 'proj-nova' });
assert.equal(cleanModel.objects[0].name, 'Дом 1');
assert.notEqual(cleanModel.objects[0].workRows[0].name, 'Mutation');

const otherProjectModel = objectsApi.getForContext({ type: 'project', id: 'proj-alkhimovo' });
otherProjectModel.objects[0].workRows[0].name = 'Other mutation';
assert.notEqual(
    objectsApi.getForContext({ type: 'project', id: 'proj-alkhimovo' }).objects[0].workRows[0].name,
    'Other mutation',
    'кэш другого проекта также не должен протекать наружу'
);

console.log(`objectsData: OK — ${cleanModel.objects.length} объектов, ${totalRows} строк, project/queue/BU и clone semantics проверены.`);
