import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('./construction-object-selector.js', import.meta.url), 'utf8');
const browserWindow = {};
browserWindow.window = browserWindow;
vm.runInContext(source, vm.createContext(browserWindow), { filename: 'construction-object-selector.js' });

const api = browserWindow.SCenterComponents;
const cards = [
    { id: 'house-1', name: 'Дом 1', typeLabel: 'Жилой дом', icon: 'building-2', progressPercent: 45, deviationLabel: '-7 п.п. к плану', deviationTone: 'behind', metaLabel: '25 этажей · 3 секции' },
    { id: 'house-2', name: 'Дом 2', typeLabel: 'Жилой дом', icon: 'building-2', progressPercent: 37, deviationLabel: 'По плану', deviationTone: 'on-plan', metaLabel: '27 этажей · 4 секции' },
    { id: 'parking', name: 'Паркинг', typeLabel: 'Паркинг', icon: 'square-parking', progressPercent: 64, deviationLabel: '-2 п.п. к плану', deviationTone: 'behind', metaLabel: '5 уровней · 3 зоны' }
];

const html = api.renderConstructionObjectSelector(cards, { activeId: 'house-2', ariaLabel: 'Объекты' });
assert.match(html, /role="tablist" aria-label="Объекты"/);
assert.match(html, /data-construction-object-id="house-2" data-focus-key="construction-object-house-2" aria-selected="true" tabindex="0"/);
assert.equal((html.match(/role="tab"/g) || []).length, 3);
assert.equal((html.match(/class="cos-card-icon-svg"/g) || []).length, 4);
assert.doesNotMatch(html, /data-lucide=/);
assert.match(html, /<small title="25 этажей · 3 секции">25 этажей · 3 секции<\/small>/);
assert.match(html, /class="cos-card-progress"/);
assert.doesNotMatch(html, /<small title="Жилой дом">Жилой дом<\/small>/);
assert.doesNotMatch(html, /cos-card-meta/);
assert.match(html, /<rect width="18" height="18" x="3" y="3" rx="2"\/>/);
assert.equal(api.getConstructionObjectSelectorNextId(cards, 'house-2', 'ArrowRight'), 'parking');
assert.equal(api.getConstructionObjectSelectorNextId(cards, 'parking', 'ArrowRight'), 'house-1');
assert.equal(api.getConstructionObjectSelectorNextId(cards, 'house-1', 'ArrowLeft'), 'parking');
assert.equal(api.getConstructionObjectSelectorNextId(cards, 'house-2', 'Home'), 'house-1');
assert.equal(api.getConstructionObjectSelectorNextId(cards, 'house-2', 'End'), 'parking');
assert.equal(api.getConstructionObjectSelectorNextId(cards, 'house-2', 'Escape'), null);

let prevented = false;
let selected = null;
const handled = api.handleConstructionObjectSelectorKeydown(
    { key: 'ArrowDown', preventDefault() { prevented = true; } },
    { cards, activeId: 'house-1', onSelect(id, detail) { selected = { id, focus: detail.focus }; } }
);
assert.equal(handled, true);
assert.equal(prevented, true);
assert.deepEqual(selected, { id: 'house-2', focus: true });

const escaped = api.renderConstructionObjectSelector([
    { ...cards[0], id: 'unsafe"id', name: '<Дом>', metaLabel: 'A & B' }
], { activeId: 'unsafe"id' });
assert.match(escaped, /data-construction-object-id="unsafe&quot;id"/);
assert.match(escaped, /&lt;Дом&gt;/);
assert.match(escaped, /A &amp; B/);

console.log('construction-object-selector: OK — renderer, escaping и roving keyboard helper проверены.');
