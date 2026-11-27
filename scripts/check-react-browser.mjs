import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.AISHTAB_PLAYWRIGHT_MODULE || 'playwright');
const buildRoot = process.env.AISHTAB_BUILD_ROOT ? resolve(process.env.AISHTAB_BUILD_ROOT) : null;
const appUrl = process.env.AISHTAB_REACT_URL || (buildRoot ? 'https://aishtab.test/' : 'http://127.0.0.1:5173/');
const baselineUrl = process.env.AISHTAB_BASELINE_URL;
const browser = await chromium.launch({
    ...(process.env.AISHTAB_CHROMIUM ? { executablePath: process.env.AISHTAB_CHROMIUM } : {})
});
const page = await browser.newPage({ viewport: { width: 1680, height: 960 }, acceptDownloads: true });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) errors.push(message.text());
});
page.on('response', response => {
    if (response.status() >= 400 && new URL(response.url()).origin === new URL(appUrl).origin) errors.push(`${response.status()} ${response.url()}`);
});
await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
if (buildRoot) {
    // Serve only files of the local build through Chromium, without a network listener.
    await page.route(`${new URL(appUrl).origin}/**`, async route => {
        const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
        const file = resolve(buildRoot, `.${pathname === '/' ? '/index.html' : pathname}`);
        const location = relative(buildRoot, file);
        if (!location || isAbsolute(location) || location === '..' || location.startsWith(`..${sep}`)) {
            return route.fulfill({ status: 404, body: 'Not found' });
        }
        await route.fulfill({ path: file });
    });
}

async function click(selector) {
    await page.locator(selector).click();
}

async function shown(locator) {
    await locator.waitFor({ state: 'visible' });
}

async function gone(locator) {
    await locator.waitFor({ state: 'hidden' });
}

async function printCheck(name, check) {
    await check();
    console.log(`PASS ${name}`);
}

async function checkChart() {
    const dialog = page.locator('.metric-bi-dialog');
    await shown(dialog);
    assert.equal(await dialog.locator('[role=columnheader]').count(), 8);
    const ranges = dialog.getByRole('button', { name: 'Диапазоны', exact: true });
    assert.equal(await ranges.getAttribute('aria-pressed'), 'true');
    assert.equal(await dialog.locator('.metric-bi-svg circle').count(), 16);
    const actual = dialog.getByRole('button', { name: 'По факту', exact: true });
    const future = dialog.getByRole('button', { name: 'С прогнозом', exact: true });
    assert.equal(await actual.getAttribute('aria-pressed'), 'true');
    await future.click();
    await future.click();
    assert.equal(await dialog.locator('[role=columnheader]').count(), 12);
    const table = dialog.getByRole('table');
    const before = await table.innerText();
    await dialog.getByRole('button', { name: 'Траектория', exact: true }).click();
    assert.equal(await dialog.locator('.metric-bi-svg circle').count(), 0);
    assert.equal(await table.innerText(), before);
    await actual.click();
    assert.equal(await dialog.locator('[role=columnheader]').count(), 8);
    assert.equal(await dialog.getByRole('button', { name: 'Траектория' }).getAttribute('aria-pressed'), 'true');
    await future.click();
    await ranges.click();
    assert.equal(await dialog.locator('.metric-bi-svg circle').count(), 24);
    await dialog.locator('.metric-bi-chart').hover();
    await shown(dialog.locator('.metric-bi-tooltip'));
    await dialog.locator('.metric-bi-header').hover();
    await gone(dialog.locator('.metric-bi-tooltip'));
    await page.keyboard.press('Escape');
    await gone(dialog);
}

try {
    page.setDefaultTimeout(8000);
    await page.goto(appUrl, { waitUntil: 'domcontentloaded' });
    await shown(page.getByRole('heading', { level: 3 }).first());
    assert.equal(await page.title(), 'AIShtab');
    await printCheck('Навигация по проектам · индикатор только при прокрутке колесом', async () => {
        const sidebar = page.locator('#left-sidebar');
        const tree = sidebar.locator('#project-tree-root');
        const thumb = sidebar.locator('.project-tree-scroll-thumb');
        const visibleThumb = sidebar.locator('.project-tree-scroll-thumb.is-visible');
        const search = sidebar.getByRole('searchbox', { name: 'Поиск проекта' });
        const position = () => tree.evaluate(node => node.scrollTop);
        try {
            await page.setViewportSize({ width: 1440, height: 540 });
            assert.ok(await tree.evaluate(node => node.scrollHeight > node.clientHeight));
            assert.equal(await thumb.getAttribute('aria-hidden'), 'true');
            await tree.hover();
            assert.equal(await visibleThumb.count(), 0);

            await page.mouse.wheel(0, 140);
            await shown(visibleThumb);
            const down = await position();
            assert.ok(down > 0);
            await gone(visibleThumb);
            await page.mouse.wheel(0, -70);
            await shown(visibleThumb);
            assert.ok(await position() < down);
            await gone(visibleThumb);

            await tree.evaluate(node => { node.scrollTop = 0; });
            await sidebar.getByRole('button', { name: 'БИЗНЕС-ЮНИТ «САМОЛЕТ ОБРАЗОВАНИЕ»', exact: true }).focus();
            await page.keyboard.press('PageDown');
            await page.waitForFunction(() => document.getElementById('project-tree-root').scrollTop > 0);
            assert.equal(await visibleThumb.count(), 0);

            await search.fill('Алхимово');
            await shown(sidebar.getByRole('button', { name: 'Алхимово', exact: true }));
            assert.ok(await tree.evaluate(node => node.scrollHeight <= node.clientHeight));
            await tree.hover();
            await page.mouse.wheel(0, 140);
            assert.equal(await visibleThumb.count(), 0);
        } finally {
            await search.clear();
            await tree.evaluate(node => { node.scrollTop = 0; });
            await page.setViewportSize({ width: 1680, height: 960 });
        }
    });
    await printCheck('Хедер · логотип и ассистент в одну строку', async () => {
        try {
            for (const width of [1680, 741, 740, 390]) {
                await page.setViewportSize({ width, height: 960 });
                const layout = await page.locator('.top-navbar').evaluate(node => {
                    const header = node.getBoundingClientRect();
                    const brand = node.querySelector('.logo').getBoundingClientRect();
                    const trigger = node.querySelector('.assistant-trigger').getBoundingClientRect();
                    return {
                        singleRow: Math.abs(brand.top + brand.height / 2 - trigger.top - trigger.height / 2) < 1,
                        separated: brand.right <= trigger.left,
                        headerOnly: node.querySelectorAll('button').length === 1 && !node.querySelector('nav'),
                        contained: trigger.right <= header.right && trigger.bottom <= header.bottom
                    };
                });
                assert.deepEqual(layout, { singleRow: true, separated: true, headerOnly: true, contained: true }, `ширина ${width} px`);
            }
        } finally {
            await page.setViewportSize({ width: 1680, height: 960 });
        }
    });
    await printCheck('A01/A02 · начальная лента, счетчики, контекст и табы', async () => {
        const counters = await page.locator('#badge-today, #badge-all, #badge-pinned').allTextContents();
        assert.ok(Number(counters[0]) > 0 && Number(counters[1]) >= Number(counters[0]));
        assert.equal(counters[2], '0');
        if (baselineUrl) {
            const baseline = await browser.newPage({ viewport: { width: 1680, height: 960 } });
            try {
                if (process.env.AISHTAB_LUCIDE_SCRIPT) {
                    await baseline.route('https://unpkg.com/lucide@latest', route => route.fulfill({
                        path: process.env.AISHTAB_LUCIDE_SCRIPT, contentType: 'text/javascript'
                    }));
                }
                await baseline.goto(baselineUrl, { waitUntil: 'domcontentloaded' });
                await baseline.locator('.event-card-title').first().waitFor();
                assert.deepEqual(await baseline.locator('#badge-today, #badge-all, #badge-pinned').allTextContents(), counters);
                assert.equal(await baseline.locator('.event-card-title').first().textContent(), await page.locator('.event-card-title').first().textContent());
            } finally { await baseline.close(); }
        }
        const high = page.getByRole('tab', { name: /Высокий приоритет/ });
        await high.focus();
        await page.keyboard.press('ArrowRight');
        assert.equal(await page.getByRole('tab', { name: /Низкий приоритет/ }).getAttribute('aria-selected'), 'true');
        await high.click();
    });

    await printCheck('Детали события · закрепление и открепление', async () => {
        const today = page.getByRole('button', { name: /^Сегодня/ });
        const pinned = page.getByRole('button', { name: /^Закреплённые/ });
        const card = page.locator('#card-e1');
        const badge = page.locator('#badge-pinned');
        const dialog = page.getByRole('dialog', { name: 'Детальная карточка события' });
        const pin = dialog.locator('.event-detail-pin');
        const icon = pin.locator('.lucide-bookmark');
        const fill = () => icon.evaluate(node => getComputedStyle(node).fill);

        await card.getByRole('heading').click();
        await shown(pin);
        assert.equal(await pin.getAttribute('aria-pressed'), 'false');
        assert.equal(await fill(), 'none');
        await dialog.getByRole('button', { name: 'Закрепить событие', exact: true }).click();
        assert.equal(await pin.getAttribute('aria-pressed'), 'true');
        assert.equal(await fill(), await icon.evaluate(node => getComputedStyle(node).color));
        assert.equal(await badge.textContent(), '1');
        await page.keyboard.press('Escape');
        await gone(dialog);
        assert.equal(await card.getByRole('button', { name: 'Открепить событие' }).getAttribute('aria-pressed'), 'true');

        await pinned.click();
        await card.getByRole('heading').click();
        await dialog.getByRole('button', { name: 'Открепить событие', exact: true }).press('Space');
        assert.equal(await pin.getAttribute('aria-pressed'), 'false');
        assert.equal(await fill(), 'none');
        assert.equal(await badge.textContent(), '0');
        await page.keyboard.press('Escape');
        await gone(dialog);
        await shown(page.getByText('Нет закреплённых событий', { exact: true }));
        assert.equal(await pinned.evaluate(node => document.activeElement === node), true);
        await today.click();
        assert.equal(await card.getByRole('button', { name: 'Закрепить событие' }).getAttribute('aria-pressed'), 'false');
    });

    await printCheck('Сегменты · состояния переключателя ленты и счётчиков', async () => {
        const group = page.locator('.toolbar-mode-segments');
        const segments = group.locator('.seg-tab');
        const today = group.getByRole('button', { name: /^Сегодня/ });
        const all = group.getByRole('button', { name: /^Все события/ });
        const pinned = group.getByRole('button', { name: /^Закреплённые/ });
        const metrics = group.getByRole('button', { name: 'Метрики', exact: true });
        const paint = button => button.evaluate(node => ({
            surface: getComputedStyle(node).backgroundColor,
            label: getComputedStyle(node).color,
            badge: node.firstElementChild ? getComputedStyle(node.firstElementChild).backgroundColor : null
        }));
        const active = { surface: 'rgb(238, 241, 245)', label: 'rgb(23, 35, 52)', badge: 'rgb(37, 101, 184)' };
        const inactive = { surface: 'rgba(0, 0, 0, 0)', label: 'rgb(78, 96, 119)', badge: 'rgb(223, 229, 237)' };
        await page.emulateMedia({ reducedMotion: 'reduce' });
        try {
            await today.click();
            await page.mouse.move(0, 0);
            const before = await segments.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
            assert.deepEqual(await paint(today), active);
            assert.deepEqual(await paint(all), inactive);
            await all.hover();
            assert.deepEqual(await paint(all), { ...inactive, surface: active.surface, label: active.label });
            assert.equal(await all.getAttribute('aria-pressed'), 'false');

            await all.click();
            assert.deepEqual(await paint(all), active);
            await page.mouse.move(0, 0);
            assert.deepEqual(await paint(all), active);
            assert.deepEqual(await paint(today), inactive);
            assert.deepEqual(await segments.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width)), before);
            await pinned.click();
            await page.mouse.move(0, 0);
            assert.deepEqual(await paint(pinned), active);

            await metrics.focus();
            await page.keyboard.press('Enter');
            assert.deepEqual(await paint(metrics), { ...active, badge: null });
            assert.equal(await metrics.evaluate(node => node.matches(':focus-visible') && getComputedStyle(node).outlineWidth === '2px'), true);
            await shown(page.getByRole('tab', { name: 'Общие', exact: true }));

            for (const width of [768, 390]) {
                await page.setViewportSize({ width, height: 800 });
                assert.equal(await group.evaluate(node => {
                    const toolbar = node.closest('.event-toolbar').getBoundingClientRect();
                    return [...node.children].every(child => {
                        const box = child.getBoundingClientRect();
                        return box.left >= toolbar.left && box.right <= toolbar.right;
                    });
                }), true, `сегменты помещаются на ширине ${width} px`);
            }
            const narrowRows = await segments.evaluateAll(nodes => new Set(nodes.map(node => node.getBoundingClientRect().top)).size);
            assert.equal(narrowRows, 2);
        } finally {
            await page.setViewportSize({ width: 1680, height: 960 });
            await page.emulateMedia({ reducedMotion: 'no-preference' });
            await today.click();
            await page.mouse.move(0, 0);
        }
    });

    await printCheck('A02/A06 · событие → BI → подсказка → возврат фокуса', async () => {
        const card = page.locator('.event-card.has-metric-link').first();
        await card.focus();
        await page.keyboard.press('Enter');
        const eventDialog = page.getByRole('dialog', { name: 'Детальная карточка события' });
        const metric = eventDialog.getByRole('button', { name: 'Открыть график связанной метрики' });
        await metric.click();
        assert.equal(await page.locator('#metric-bi-title').evaluate(n => getComputedStyle(n).fontSize), '20px');
        await checkChart();
        await shown(eventDialog);
        assert.equal(await metric.evaluate(node => node === document.activeElement), true);
        const pin = eventDialog.getByRole('button', { name: 'Закрепить событие' });
        await pin.click();
        assert.equal(await page.locator('#badge-pinned').textContent(), '1');
        await page.keyboard.press('Escape');
        await gone(eventDialog);
        assert.equal(await card.evaluate(node => node === document.activeElement), true);
        await page.getByRole('button', { name: /^Закреплённые/ }).click();
        assert.equal(await page.locator('.event-card').count(), 1);
        await page.getByRole('button', { name: /^Все события/ }).click();
    });

    await printCheck('Детали события и BI · закрытие пары и возврат к событию', async () => {
        const card = page.locator('.event-card.has-metric-link').first();
        const details = page.locator('#event-drawer');
        const chart = page.locator('#bi-modal-overlay');
        const closeEvent = details.locator('#close-event-drawer-btn');
        const openPair = async () => {
            await card.click();
            await details.locator('.metric-impact-trigger').click();
            await shown(chart);
        };
        const checkClosed = async () => {
            await details.waitFor({ state: 'detached' });
            await chart.waitFor({ state: 'detached' });
            assert.equal(await card.evaluate(node => node === document.activeElement), true);
        };
        try {
            await openPair();
            await closeEvent.click();
            await checkClosed();

            await openPair();
            await page.keyboard.press('Shift+Tab'); // «Создать задачу» в карточке.
            await page.keyboard.press('Shift+Tab'); // Крестик карточки.
            assert.equal(await closeEvent.evaluate(node => node === document.activeElement), true);
            await page.keyboard.press('Enter');
            await checkClosed();

            await page.setViewportSize({ width: 390, height: 800 });
            await openPair();
            await chart.getByRole('button', { name: 'Закрыть оба окна', exact: true }).click();
            await checkClosed();
        } finally {
            await page.setViewportSize({ width: 1680, height: 960 });
        }
    });

    await printCheck('Детали события · хедер, реестр параметров и описание по высоте окна', async () => {
        const card = page.locator('.event-card').first();
        const dialog = page.getByRole('dialog', { name: 'Детальная карточка события' });
        const close = dialog.getByRole('button', { name: 'Закрыть', exact: true });
        const expand = dialog.getByRole('button', { name: 'Дополнительно', exact: true });
        const collapse = dialog.getByRole('button', { name: 'Свернуть', exact: true });
        const readLayout = () => dialog.evaluate(node => {
            const box = selector => node.querySelector(selector).getBoundingClientRect();
            const title = box('.event-heading-copy h2');
            const heading = getComputedStyle(node.querySelector('.event-heading-copy h2'));
            const source = node.querySelector('.event-detail-source-line');
            const register = [...node.querySelectorAll('.event-params-register > div')];
            const labels = register.map(row => row.querySelector('dt').textContent);
            const project = register.find(row => row.querySelector('dt').textContent === 'Проект');
            if (heading.fontSize !== '20px' || heading.fontWeight !== '500' ||
                Math.abs(source.getBoundingClientRect().top - title.bottom - 8) > 0.5 ||
                source.querySelectorAll('.event-detail-meta-item').length !== 1 || !source.textContent.startsWith('Источник:') ||
                labels.join('|') !== 'Статус|Время|Проект|Очередь|Тип объекта|Объект' ||
                register.some(row => getComputedStyle(row.querySelector('dd')).fontWeight !== '400') ||
                !project?.querySelector('dt .lucide-folder-open') || project.querySelector('dd').textContent !== 'Nova') {
                throw new Error('Не соблюдены отступ и типографика заголовка, состав подзаголовка или порядок параметров события');
            }
            const closeBox = box('#close-event-drawer-btn');
            const cross = box('#close-event-drawer-btn svg');
            const content = box('.event-description-content');
            const text = box('.event-description-text');
            const footer = box('#event-drawer-footer');
            const descriptionCard = box('.event-description-card');
            const body = node.querySelector('#event-drawer-body');
            return {
                imageCount: node.querySelectorAll('.drawer-header img').length,
                closeWidth: closeBox.width, closeHeight: closeBox.height,
                closeRadius: getComputedStyle(node.querySelector('#close-event-drawer-btn')).borderTopLeftRadius,
                crossCentered: closeBox.left + closeBox.right === cross.left + cross.right
                    && closeBox.top + closeBox.bottom === cross.top + cross.bottom,
                headerOrder: title.right <= closeBox.left,
                headerAlignment: Math.abs(title.top - closeBox.top) < 2,
                gutter: footer.top - descriptionCard.bottom + body.scrollHeight - body.clientHeight - body.scrollTop,
                roomyHeight: Math.ceil(text.height + descriptionCard.top - node.getBoundingClientRect().top + footer.height + 160),
                preview: content.height + 1 < text.height,
                footerVisible: footer.bottom <= innerHeight + 1
                    && [...node.querySelectorAll('#event-drawer-footer button')].every(button => {
                        const buttonBox = button.getBoundingClientRect();
                        return buttonBox.left >= footer.left && buttonBox.right <= footer.right
                            && buttonBox.top >= footer.top && buttonBox.bottom <= footer.bottom;
                    })
            };
        });
        try {
            await page.setViewportSize({ width: 1360, height: 720 });
            await card.click();
            await shown(expand);
            const compact = await readLayout();
            assert.equal(compact.imageCount, 0);
            assert.deepEqual([compact.closeWidth, compact.closeHeight, compact.closeRadius], [40, 40, '50%']);
            assert.ok(compact.crossCentered && compact.headerOrder && compact.headerAlignment);
            assert.ok(compact.preview && compact.footerVisible);
            assert.ok(Math.abs(compact.gutter - 16) < 1.5, `отступ ${compact.gutter} px`);

            await expand.focus();
            await page.keyboard.press('Enter');
            await shown(collapse);
            assert.equal(await collapse.getAttribute('aria-expanded'), 'true');
            const full = await readLayout();
            assert.equal(full.preview, false);
            assert.ok(full.footerVisible);
            await collapse.click();
            await shown(expand);
            assert.equal(await expand.getAttribute('aria-expanded'), 'false');
            assert.ok((await readLayout()).preview);

            await page.setViewportSize({ width: 1360, height: Math.max(1400, compact.roomyHeight) });
            await gone(expand);
            const roomy = await readLayout();
            assert.equal(roomy.preview, false);
            assert.ok(Math.abs(roomy.gutter - 16) < 1.5);

            await page.setViewportSize({ width: 390, height: 760 });
            await shown(expand);
            const narrow = await readLayout();
            assert.ok(narrow.headerOrder && narrow.headerAlignment && narrow.footerVisible);
            await close.click();
            await gone(dialog);
            assert.equal(await card.evaluate(node => node === document.activeElement), true);
        } finally {
            await page.setViewportSize({ width: 1680, height: 960 });
        }
    });

    await printCheck('Paper · геометрия ленты и обновлённой карточки', async () => {
        await page.getByRole('button', { name: /^Сегодня/ }).click();
        await page.mouse.move(0, 0);
        const cards = page.locator('.event-card');
        const card = cards.first();
        const layout = await card.evaluate(node => {
            const cardRect = node.getBoundingClientRect();
            const feedRect = node.closest('#event-feed-sections').getBoundingClientRect();
            const title = node.querySelector('.event-card-title').getBoundingClientRect();
            const source = node.querySelector('.event-card-source-date > :first-child').getBoundingClientRect();
            const date = node.querySelector('.event-timestamp-text').getBoundingClientRect();
            const pin = node.querySelector('.pin-toggle').getBoundingClientRect();
            const body = node.querySelector('.event-card-main-block').getBoundingClientRect();
            const footer = node.querySelector('.event-card-metric-block');
            const { paddingTop, paddingRight, paddingBottom, paddingLeft } = getComputedStyle(footer);
            const siblings = [...node.parentElement.querySelectorAll(':scope > .event-card')];
            const right = siblings[1].getBoundingClientRect();
            const below = siblings.find(item => item.getBoundingClientRect().top > cardRect.top + 1).getBoundingClientRect();
            const paint = getComputedStyle(node);
            return {
                left: cardRect.left - feedRect.left, top: cardRect.top - feedRect.top,
                column: right.left - cardRect.right, row: below.top - cardRect.bottom,
                radius: paint.borderTopLeftRadius, rightBorder: paint.borderRightWidth,
                dateGap: date.left - source.right, dateAlignment: (source.top + source.bottom - date.top - date.bottom) / 2,
                titleBelow: date.bottom <= title.top, pinRight: cardRect.right - pin.right,
                footerGap: footer.getBoundingClientRect().top - body.bottom,
                footerPadding: [paddingTop, paddingRight, paddingBottom, paddingLeft]
            };
        });
        assert.ok(Math.abs(layout.left - 8) < 0.6);
        assert.ok(Math.abs(layout.top - 16) < 0.6);
        for (const key of ['column', 'row']) assert.ok(Math.abs(layout[key] - 5) < 0.6, key);
        assert.equal(layout.radius, '4px');
        assert.equal(layout.rightBorder, '0px');
        assert.ok(Math.abs(layout.dateGap - 12) < 0.6);
        assert.ok(Math.abs(layout.dateAlignment) < 0.6);
        assert.ok(layout.titleBelow);
        assert.ok(Math.abs(layout.pinRight - 20) < 0.6);
        assert.ok(Math.abs(layout.footerGap) < 0.6);
        assert.deepEqual(layout.footerPadding, ['8px', '20px', '8px', '20px']);
        const titleLayouts = await cards.locator('.event-card-title').evaluateAll(titles => titles.map(title => {
            const { lineHeight, webkitLineClamp } = getComputedStyle(title);
            const range = document.createRange();
            range.selectNodeContents(title);
            const description = title.parentElement.querySelector('.event-card-desc');
            const bounds = title.getBoundingClientRect();
            return {
                height: bounds.height,
                lineHeight: parseFloat(lineHeight),
                clamp: webkitLineClamp,
                textLines: new Set(Array.from(range.getClientRects(), rect => rect.top)).size,
                descriptionGap: description ? description.getBoundingClientRect().top - bounds.bottom : null
            };
        }));
        assert.ok(titleLayouts.some(title => title.textLines === 1), 'есть однострочный заголовок');
        assert.ok(titleLayouts.every(title => title.height === title.lineHeight * 2 && title.clamp === '2'));
        assert.ok(titleLayouts.every(title => title.descriptionGap === null || Math.abs(title.descriptionGap - 8) < 0.6));
        assert.doesNotMatch(await card.locator('.event-card-desc').textContent(), /^\s*Сигнал:/i);
        assert.doesNotMatch(await card.locator('.event-card-desc').textContent(), /Данные:/);
        const pin = card.getByRole('button', { name: 'Открепить событие' });
        await shown(pin.locator('svg.lucide-bookmark'));
        assert.equal(await pin.getAttribute('aria-pressed'), 'true');

        const cardPaint = () => card.evaluate(node => ({
            background: getComputedStyle(node).backgroundColor,
            feedBackground: getComputedStyle(node.closest('#event-feed-sections')).backgroundColor,
            outline: getComputedStyle(node).boxShadow,
            border: getComputedStyle(node).borderTop,
            title: getComputedStyle(node.querySelector('.event-card-title')).color
        }));
        const finishPaintTransition = () => card.evaluate(async node => {
            // Flush styles so any newly started transition is included.
            getComputedStyle(node.querySelector('.event-card-title')).color;
            await Promise.allSettled(node.getAnimations({ subtree: true }).map(animation => animation.finished));
        });
        await finishPaintTransition();
        const restingPaint = await cardPaint();
        const restingBounds = await card.boundingBox();
        assert.notEqual(restingPaint.background, restingPaint.feedBackground);
        assert.equal(restingPaint.outline, 'none');
        assert.equal(restingPaint.border, '1px solid rgb(66, 69, 76)');
        const titleTransition = () => card.locator('.event-card-title').evaluate(node => getComputedStyle(node).transitionDuration);
        assert.equal(await titleTransition(), '0.14s');
        await card.hover();
        assert.equal(await titleTransition(), '0.18s');
        await finishPaintTransition();
        const hoveredPaint = await cardPaint();
        assert.equal(hoveredPaint.background, restingPaint.background);
        assert.match(hoveredPaint.outline, /0px 3px 12px/);
        assert.notEqual(hoveredPaint.background, hoveredPaint.feedBackground);
        assert.equal(hoveredPaint.border, '1px solid rgb(134, 184, 255)');
        assert.equal(hoveredPaint.title, 'rgb(134, 184, 255)');
        assert.deepEqual(await card.boundingBox(), restingBounds);
        await page.mouse.move(0, 0);
        await finishPaintTransition();
        assert.deepEqual(await cardPaint(), restingPaint);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await card.hover();
        assert.deepEqual(await cardPaint(), hoveredPaint);
        assert.equal(await titleTransition(), '0s');
        await page.mouse.move(0, 0);
        assert.deepEqual(await cardPaint(), restingPaint);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.getByRole('button', { name: /^Все события/ }).click();
    });

    async function applySourceFilter() {
        await page.getByRole('button', { name: 'Фильтры', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: 'Фильтры' });
        await dialog.getByRole('checkbox', { name: 'S.Pass', exact: true }).check();
        await dialog.getByRole('button', { name: 'Применить', exact: true }).click();
        await gone(dialog);
    }

    await printCheck('A03 · выдача, исключение, сброс и фильтры без поиска событий', async () => {
        const card = page.locator('.event-card').first();
        await gone(page.getByRole('searchbox', { name: 'Поиск событий' }));
        const unfiltered = await page.locator('.event-card').count();
        await applySourceFilter();
        await shown(card);
        const count = await page.locator('.event-card').count();
        assert.ok(count < unfiltered);
        await card.hover();
        await card.getByRole('button', { name: 'Исключить из выдачи' }).click();
        assert.equal(await page.locator('.event-card').count(), count - 1);
        await page.getByRole('button', { name: 'Закрыть фильтры и выйти' }).click();
        assert.equal(await page.locator('.event-card').count(), unfiltered);
        await page.getByRole('button', { name: 'Фильтры', exact: true }).click();
        await shown(page.getByRole('dialog', { name: /Фильтр/ }));
        await page.keyboard.press('Escape');
        await gone(page.getByRole('dialog', { name: /Фильтр/ }));
    });

    await printCheck('Тулбар · шесть комбинаций ленты и две вкладки метрик', async () => {
        const group = page.locator('.toolbar-mode-segments');
        const context = page.locator('.toolbar-context-segments');
        const today = group.getByRole('button', { name: /^Сегодня/ });
        const all = group.getByRole('button', { name: /^Все события/ });
        const pinned = group.getByRole('button', { name: /^Закреплённые/ });
        const metrics = group.getByRole('button', { name: 'Метрики', exact: true });
        const high = context.getByRole('tab', { name: /^Высокий приоритет/ });
        const low = context.getByRole('tab', { name: /^Низкий приоритет/ });
        const cards = page.locator('.event-card');
        await today.click();
        await low.click();
        const lowId = await cards.first().getAttribute('data-event-id');
        await cards.first().getByRole('button', { name: 'Закрепить событие' }).click();
        const daily = {};
        for (const [name, button] of [['today', today], ['all', all], ['pinned', pinned]]) {
            await button.click();
            for (const [id, segment] of [['high', high], ['low', low]]) {
                await segment.click();
                assert.equal(await segment.getAttribute('aria-selected'), 'true');
                assert.equal(await page.locator('#priority-events-panel').getAttribute('aria-labelledby'), `priority-tab-${id}`);
                assert.equal(await cards.count(), Number(await segment.locator('.priority-tab-badge').textContent()));
                const result = await cards.evaluateAll(nodes => nodes.map(node => ({
                    id: node.dataset.eventId, pinned: node.classList.contains('pinned'),
                    high: node.classList.contains('priority-high') || node.classList.contains('priority-critical')
                })));
                assert.ok(result.every(item => item.high === (id === 'high')));
                if (name === 'today') daily[id] = result.map(item => item.id);
                if (name === 'all') assert.ok(daily[id].every(eventId => result.some(item => item.id === eventId)));
                if (name === 'pinned') assert.ok(result.length > 0 && result.every(item => item.pinned));
            }
        }
        const lowCard = page.locator(`.event-card[data-event-id="${lowId}"]`);
        await lowCard.getByRole('button', { name: 'Открепить событие' }).click();
        await shown(page.getByText('В выбранном приоритете нет событий.'));

        await metrics.click();
        const overview = context.getByRole('tab', { name: 'Общие', exact: true });
        const procurement = context.getByRole('tab', { name: 'Закупки', exact: true });
        await overview.click();
        await shown(page.getByRole('heading', { name: 'Контрольные этапы' }));
        await overview.press('ArrowRight');
        await shown(page.getByRole('heading', { name: 'Контрактация бюджета' }));
        assert.equal(await procurement.evaluate(node => node === document.activeElement), true);
        assert.equal(await page.locator('#metrics-dashboard-section-panel').getAttribute('aria-labelledby'), 'metrics-section-tab-procurement');
        await all.click();
        assert.equal(await low.getAttribute('aria-selected'), 'true');
        await metrics.click();
        assert.equal(await procurement.getAttribute('aria-selected'), 'true');
        await procurement.press('Home');
        await shown(page.getByRole('heading', { name: 'Контрольные этапы' }));
        assert.equal(await page.locator('#event-toolbar-root [role=tablist]').count(), 1);
        assert.equal(await page.locator('#event-feed-sections [role=tablist]').count(), 0);
        await all.click();
        await high.click();
    });

    await printCheck('Фильтр · общий вход для «Сегодня» и «Все события»', async () => {
        const toolbar = page.locator('#event-toolbar-root');
        const today = toolbar.getByRole('button', { name: /^Сегодня/ });
        const all = toolbar.getByRole('button', { name: /^Все события/ });
        const button = toolbar.getByRole('button', { name: 'Фильтры', exact: true });
        const dialog = page.getByRole('dialog', { name: 'Фильтры', exact: true });
        const todayCount = () => toolbar.locator('#badge-today').textContent().then(Number);

        async function checkButton() {
            await shown(button.locator('svg[viewBox="0 0 16 16"]'));
            const geometry = await button.evaluate(node => {
                const rect = node.getBoundingClientRect();
                const icon = node.querySelector('svg').getBoundingClientRect();
                const group = node.parentElement.getBoundingClientRect();
                const segments = node.closest('.event-toolbar').querySelector('.toolbar-context-segments').getBoundingClientRect();
                return {
                    width: rect.width, height: rect.height, radius: getComputedStyle(node).borderRadius,
                    iconSize: [icon.width, icon.height], border: getComputedStyle(node).borderTopColor,
                    centered: Math.abs(rect.left + rect.right - icon.left - icon.right) < 1
                        && Math.abs(rect.top + rect.bottom - icon.top - icon.bottom) < 1,
                    right: Math.abs(rect.right - group.right) < 1,
                    separated: segments.right <= rect.left || segments.bottom <= rect.top
                };
            });
            assert.deepEqual(geometry, { width: 40, height: 40, radius: '50%', iconSize: [18, 18],
                border: 'rgb(226, 228, 234)', centered: true, right: true, separated: true });
        }

        await today.click();
        await checkButton();
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
        const unfiltered = await todayCount();
        await button.focus();
        await page.keyboard.press('Enter');
        await shown(dialog);
        assert.equal(await button.getAttribute('aria-expanded'), 'true');
        assert.equal(await button.getAttribute('aria-controls'), 'filter-drawer');
        assert.equal(await button.evaluate(node => getComputedStyle(node).borderTopColor), 'rgb(59, 130, 246)');
        const close = dialog.getByRole('button', { name: 'Закрыть', exact: true });
        const closeStyle = await close.evaluate(node => {
            const icon = node.querySelector('svg');
            const style = getComputedStyle(node);
            return [node.offsetWidth, node.offsetHeight, style.borderRadius, style.borderTopColor, style.color,
                icon.getAttribute('width'), icon.getAttribute('height'), icon.querySelector('path').getAttribute('d')];
        });
        assert.deepEqual(closeStyle, [40, 40, '50%', 'rgb(212, 214, 223)', 'rgb(87, 89, 114)', '16', '16', 'M5 5l6 6m0-6-6 6']);
        await close.click();
        await gone(dialog);
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
        await button.click();
        const source = dialog.getByRole('checkbox', { name: 'S.Pass', exact: true });
        await source.check();
        assert.equal(await todayCount(), unfiltered, 'черновик не меняет выдачу');
        await dialog.getByRole('button', { name: 'Применить', exact: true }).click();
        await gone(dialog);
        assert.equal(await button.evaluate(node => node === document.activeElement), true);
        assert.equal(await today.getAttribute('aria-pressed'), 'true');
        assert.ok(await todayCount() > 0 && await todayCount() < unfiltered);
        assert.equal(await button.getAttribute('data-filtered'), '');
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
        assert.equal(await button.getAttribute('aria-description'), 'Условия применены');

        await all.click();
        await checkButton();
        assert.equal(await button.getAttribute('data-filtered'), '');
        await button.click();
        await shown(source);
        assert.equal(await source.isChecked(), true);
        await page.keyboard.press('Escape');
        await gone(dialog);
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
        assert.equal(await button.getAttribute('data-filtered'), '');
        await today.click();
        await page.getByRole('button', { name: 'Закрыть фильтры и выйти' }).click();
        assert.equal(await today.getAttribute('aria-pressed'), 'true');
        assert.equal(await todayCount(), unfiltered);
        assert.equal(await button.getAttribute('data-filtered'), null);

        try {
            await page.setViewportSize({ width: 390, height: 800 });
            await checkButton();
        } finally {
            await page.setViewportSize({ width: 1680, height: 960 });
        }
        await toolbar.getByRole('button', { name: /^Закреплённые/ }).click();
        await gone(button);
        await toolbar.getByRole('button', { name: 'Метрики', exact: true }).click();
        await gone(button);
        await all.click();
    });

    await printCheck('A04 · создание, редактирование и удаление задачи из события', async () => {
        await page.locator('.event-card').first().click();
        await page.getByRole('button', { name: 'Создать задачу', exact: true }).click();
        const editor = page.getByRole('dialog', { name: 'Создание задачи' });
        await shown(editor);
        await editor.getByRole('button', { name: 'Создать', exact: true }).click();
        await shown(editor.getByText(/обязательн|заполните/i).first());
        await editor.locator('input').first().fill('Проверка переноса задач');
        await editor.locator('textarea').first().fill('Контроль связанного события');
        await editor.getByRole('combobox', { name: 'Ответственный' }).click();
        await page.getByRole('listbox').getByRole('option').first().click();
        await editor.getByRole('button', { name: 'Создать', exact: true }).click();
        const detail = page.getByRole('dialog', { name: 'Детальная карточка события' });
        await shown(detail.getByText('Проверка переноса задач', { exact: true }));
        await detail.getByRole('button', { name: /Редактировать задачу/ }).first().click();
        const edit = page.getByRole('dialog', { name: 'Карточка задачи' });
        await edit.locator('input').first().fill('Отредактированная проверка');
        await edit.getByRole('button', { name: 'Сохранить', exact: true }).click();
        await shown(detail.getByText('Отредактированная проверка', { exact: true }));
        await detail.getByRole('button', { name: /Удалить задачу/ }).first().click();
        await gone(detail.getByText('Отредактированная проверка', { exact: true }));
        await page.keyboard.press('Escape');
    });

    await printCheck('Paper · оформление и сценарии «Метрики / Общие»', async () => {
        await page.getByRole('button', { name: 'Метрики', exact: true }).click();
        const project = page.getByRole('button', { name: 'Nova', exact: true });
        await project.click();
        const overview = page.getByRole('tab', { name: 'Общие', exact: true });
        await overview.click();
        const panel = page.locator('#metrics-dashboard-section-panel');
        const stablePanel = await panel.elementHandle();
        const budgetHelp = page.getByRole('button', { name: 'Пояснение: бюджет по ЦП' });
        const tooltip = panel.locator('.metrics-budget-tooltip').first();
        const search = page.getByRole('searchbox', { name: 'Поиск проекта' });
        const collapse = page.locator('.left-panel-collapse-btn');
        const timeline = panel.locator('.metrics-timeline');
        try {
            await page.setViewportSize({ width: 1518, height: 1040 });
            const surface = await page.locator('#dashboard-view').evaluate(node => {
                return ['.left-panel', '.project-summary-header', '.event-toolbar', '#event-feed-sections']
                    .map(selector => getComputedStyle(node.querySelector(selector)).backgroundColor);
            });
            assert.deepEqual(surface, Array(4).fill('rgb(32, 33, 37)'));
            assert.equal(await collapse.evaluate(node => getComputedStyle(node).position), 'static');
            const collapseBox = await collapse.boundingBox();
            const searchBox = await page.locator('.left-search-box').boundingBox();
            assert.equal(collapseBox.width, 38);
            assert.equal(collapseBox.height, 38);
            assert.equal(searchBox.height, 40);
            assert.equal(collapseBox.x - (searchBox.x + searchBox.width), 8);
            await page.mouse.move(0, 0);
            const borders = await page.locator('.left-panel-header').evaluate(header =>
                ['.left-search-box', '.left-panel-collapse-btn'].map(selector => {
                    const style = getComputedStyle(header.querySelector(selector));
                    return [style.borderTop, style.borderRight, style.borderBottom, style.borderLeft];
                }));
            assert.deepEqual(borders[0], Array(4).fill('1px solid rgb(210, 211, 215)'));
            assert.deepEqual(borders[0], borders[1]);
            await collapse.click();
            await gone(search);
            assert.equal(await collapse.getAttribute('aria-expanded'), 'false');
            assert.equal(await collapse.evaluate(node => document.activeElement === node), true);
            await collapse.click();
            await shown(search);
            await search.fill('Nova');
            await shown(project);
            await gone(page.getByRole('button', { name: 'Новый квартал', exact: true }));
            await search.clear();

            const geometry = await panel.evaluate(node => {
                const rect = el => el.getBoundingClientRect();
                const style = el => getComputedStyle(el);
                const row = selector => [...node.querySelectorAll(selector)].map(el => rect(el).top);
                return {
                    kpi: row('.metrics-kpi-card'),
                    kpiDividers: row('.metrics-kpi-card-secondary'),
                    pairs: [...node.querySelectorAll('.metrics-summary-pair')].map(group =>
                        [...group.querySelectorAll('.metrics-card-title')].map(title => title.textContent)),
                    notes: [...node.querySelectorAll('.metrics-kpi-card .metrics-value-comparison')].map(el => el.textContent),
                    budgets: row('.metrics-budget-card'),
                    budgetDividers: row('.metrics-budget-card-secondary'),
                    dates: row('.metrics-milestone-date'),
                    tiles: [...node.querySelectorAll('.metrics-icon-box')].map(el => [
                        rect(el).width, rect(el).height, rect(el.firstElementChild).width, rect(el.firstElementChild).height
                    ]),
                    cards: [...node.querySelectorAll('.metrics-kpi-card, .metrics-milestones-panel, .metrics-budget-card')].map(el => [
                        style(el).backgroundColor, style(el).borderRadius, style(el).boxShadow
                    ]),
                    comparisonDividers: [...node.querySelectorAll('.metrics-budget-comparison + .metrics-budget-comparison')].map(el => [
                        style(el).borderTopWidth, rect(el).top >= rect(el.previousElementSibling).bottom
                    ]),
                    overdue: ['.metrics-kpi-card[data-status=unfavorable] strong', '.metrics-kpi-card[data-status=unfavorable] .metrics-icon-box']
                        .map(selector => style(node.querySelector(selector)).color)
                };
            });
            assert.equal(geometry.kpiDividers.length, 0);
            assert.deepEqual(geometry.pairs, [['Плановая длительность', 'Прогнозная длительность'], ['Отклонение срока', 'Прогнозное завершение']]);
            assert.equal(geometry.kpi.length, 4);
            assert.equal(new Set(geometry.kpi).size, 1, 'четыре карточки сроков выровнены в один ряд');
            assert.deepEqual(geometry.notes, ['старт 15.01.2025', '+1,3% к плану', 'по плану 30.11.2028']);
            assert.equal(await panel.locator('.metrics-kpi-card').last().locator('strong').innerText(), '18.12.2028');
            for (const [key, count] of [['budgets', 3], ['budgetDividers', 3], ['dates', 9]]) {
                assert.equal(geometry[key].length, count, key);
                assert.equal(new Set(geometry[key]).size, 1, key);
            }
            assert.deepEqual(geometry.tiles.slice(0, 4), Array(4).fill([40, 40, 20, 20]));
            assert.deepEqual(geometry.tiles.slice(4), Array(3).fill([40, 40, 20, 20]));
            assert.deepEqual(await panel.locator('.metrics-budget-title').allTextContents(),
                ['Бюджет по ЦП', 'Бюджет по ДУ', 'Бюджет по КС-2']);
            assert.deepEqual(await panel.locator('.metrics-budget-card .metrics-value-row strong').allTextContents(),
                ['18,6', '19,4', '22,3']);
            assert.equal(await panel.locator('.metrics-budget-comparison').count(), 6);
            for (const card of geometry.cards) assert.deepEqual(card, ['rgb(255, 255, 255)', '4px', 'none']);
            assert.deepEqual(geometry.comparisonDividers, Array(3).fill(['1px', true]));
            assert.deepEqual(geometry.overdue, Array(2).fill('rgb(197, 46, 36)'));
            const overflow = await timeline.evaluate(node => node.scrollWidth > node.clientWidth + 1);
            assert.equal(await panel.locator('.stage-line .jump').isVisible(), overflow);
            assert.equal(await timeline.locator('[aria-current=step]').count(), 1);
            assert.equal(await timeline.locator('.stamp time:first-child').count(), 9);
            await panel.getByRole('button', { name: 'Свернуть', exact: true }).click();
            assert.equal(await timeline.locator('.metrics-milestone').count(), 5);
            await panel.getByRole('button', { name: 'Все этапы', exact: true }).click();
            assert.equal(await timeline.locator('.metrics-milestone').count(), 9);

            await budgetHelp.hover();
            await shown(tooltip);
            assert.match(await tooltip.textContent(), /Целевая стоимость проекта/);
            await tooltip.hover();
            await shown(tooltip);
            await overview.hover();
            await gone(tooltip);
            await page.keyboard.press('Tab');
            await budgetHelp.focus();
            await shown(tooltip);
            await page.keyboard.press('Escape');
            await gone(tooltip);
            assert.equal(await budgetHelp.evaluate(node => node === document.activeElement), true);
            await budgetHelp.click();
            await shown(tooltip);
            await budgetHelp.click();
            await gone(tooltip);
            await overview.focus();
            await overview.press('ArrowRight');
            assert.equal(await page.getByRole('tab', { name: 'Закупки', exact: true }).getAttribute('aria-selected'), 'true');
            await page.getByRole('tab', { name: 'Закупки', exact: true }).press('ArrowLeft');
            assert.equal(await overview.getAttribute('aria-selected'), 'true');
            assert.equal(await stablePanel.evaluate(node => node.isConnected), true);

            const kpi = panel.locator('.metrics-value-row strong').first();
            const novaValue = await kpi.textContent();
            await page.getByRole('button', { name: 'Очередь 1', exact: true }).click();
            assert.notEqual(await kpi.textContent(), novaValue);
            assert.equal(await panel.locator('.metrics-budget-help[aria-expanded=true]').count(), 0);
            await project.click();
            assert.equal(await kpi.textContent(), novaValue);

            for (const width of [1024, 390]) {
                await page.setViewportSize({ width, height: 844 });
                const narrow = await panel.evaluate(node => {
                    const countColumns = selector => getComputedStyle(node.querySelector(selector)).gridTemplateColumns.split(' ').length;
                    const timeline = node.querySelector('.metrics-timeline');
                    const feed = node.closest('#event-feed-sections');
                    return [countColumns('.metrics-kpi-grid'), countColumns('.metrics-budget-grid'),
                        timeline.scrollWidth > timeline.clientWidth, feed.scrollWidth - feed.clientWidth];
                });
                assert.deepEqual(narrow.slice(0, 3), [width === 1024 ? 2 : 1, 1, true], `ширина ${width} px`);
                assert.ok(narrow[3] <= 1, `горизонтальное переполнение ${narrow[3]} px при ширине окна ${width} px`);
                await budgetHelp.hover();
                await shown(tooltip);
                const bounds = await tooltip.boundingBox();
                assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
                await page.keyboard.press('Escape');
                await gone(tooltip);
            }
        } finally {
            await page.setViewportSize({ width: 1680, height: 960 });
        }
    });

    await printCheck('Метрики · сводка закупок по Paper, норма и детализация риска', async () => {
        const general = page.getByRole('tab', { name: 'Общие', exact: true });
        const procurement = page.getByRole('tab', { name: 'Закупки', exact: true });
        const cards = page.locator('.procurement-summary-grid .metrics-kpi-card');
        try {
            await page.setViewportSize({ width: 1518, height: 1040 });
            await general.click();
            await procurement.click();
            await shown(cards.first());
            assert.equal(await cards.count(), 6);
            const blocks = await page.locator('.procurement-metrics > section').evaluateAll(nodes =>
                nodes.map(node => [node.clientWidth, node.getBoundingClientRect().height]));
            assert.equal(blocks.length, 5);
            const paperHeights = [285, null, null, 558, 366];
            assert.ok(blocks.every(([width, height], i) => Math.abs(width - 1181) <= 1
                && (paperHeights[i] == null || Math.abs(height - paperHeights[i]) <= 2)), JSON.stringify(blocks));
            assert.deepEqual(await cards.first().evaluate(card => {
                const style = selector => getComputedStyle(card.querySelector(selector));
                return [style('.metrics-icon-box').width, style('.metrics-icon-box').height,
                    style('.metrics-icon-box svg').width, style('.metrics-icon-box svg').height,
                    style('.metrics-kpi-card-main').flexDirection, style('.metrics-card-title').fontSize,
                    style('.metrics-value-row strong').fontSize, style('.metrics-value-row strong').fontWeight];
            }), ['40px', '40px', '20px', '20px', 'column', '12px', '24px', '500']);
            assert.deepEqual(await cards.locator('.metrics-card-title').allTextContents().then(values => values.slice(-2)),
                ['Средний срок тендера', 'Участников на лот в среднем']);
            assert.deepEqual(await cards.locator('.metrics-value-row').allTextContents(),
                ['24,0 млрд ₽', '17,3 млрд ₽', '+4,8%', '7 тендеров', '18 дней при норме 14 дней', '4,2']);
            assert.deepEqual(await cards.evaluateAll(nodes => nodes.map(card => [
                card.dataset.status,
                getComputedStyle(card.querySelector('strong')).color
            ])), [
                [undefined, 'rgb(70, 72, 78)'], [undefined, 'rgb(70, 72, 78)'],
                ['unfavorable', 'rgb(197, 46, 36)'], ['unfavorable', 'rgb(197, 46, 36)'],
                ['unfavorable', 'rgb(197, 46, 36)'], ['favorable', 'rgb(70, 72, 78)']
            ]);
            assert.equal(await cards.locator('.metrics-kpi-card-secondary').count(), 0);
            const comparison = cards.locator('.metrics-value-comparison');
            assert.deepEqual(await comparison.evaluate(el => {
                const dot = getComputedStyle(el, '::before');
                return [dot.width, dot.height, getComputedStyle(el.parentElement).columnGap,
                    el.closest('article').querySelector('.metrics-kpi-card-secondary') === null];
            }), ['3px', '3px', '4px', true]);
            const riskSummary = page.locator('.procurement-summary-risk');
            const riskHint = riskSummary.getByRole('tooltip', { includeHidden: true });
            await riskSummary.hover();
            await shown(riskHint);
            assert.match(await riskHint.innerText(), /Критичных: 2.*163,2/);
            await page.getByRole('heading', { name: 'Контрактация бюджета' }).hover();
            await gone(riskHint);
            await riskSummary.focus();
            await shown(riskHint);
            await page.keyboard.press('Escape');
            await gone(riskHint);
            assert.ok(await cards.evaluateAll(nodes => nodes.filter(n => n.dataset.status === 'unfavorable')
                .every(n => getComputedStyle(n.querySelector('.metrics-icon-box')).color === getComputedStyle(n.querySelector('.metrics-value-row strong')).color)));
            await shown(page.getByRole('heading', { name: 'Контрактация бюджета' }));
            for (const [width, columns] of [[1518, 3], [1024, 2], [390, 1]]) {
                await page.setViewportSize({ width, height: 1040 });
                const geometry = await cards.evaluateAll(nodes => {
                    const rect = element => element.getBoundingClientRect();
                    const grid = nodes[0].closest('.procurement-summary-grid');
                    const workspace = document.getElementById('dashboard-view');
                    return {
                        columns: nodes.filter(card => rect(card).top === rect(nodes[0]).top).length,
                        gap: getComputedStyle(grid).gap,
                        readable: nodes.every(card => {
                            const row = card.querySelector('.metrics-value-row');
                            return row.scrollWidth <= row.clientWidth + 1;
                        }),
                        contained: nodes.every(card => rect(card).right <= rect(grid).right + 1),
                        alignedWithToolbar: Math.abs(rect(grid).left - rect(workspace.querySelector('.toolbar-mode-segments')).left) <= 0.5,
                        rows: nodes.map(card => [rect(card).top, rect(card).bottom])
                    };
                });
                assert.equal(geometry.columns, columns, `ширина ${width} px`);
                assert.equal(geometry.gap, '8px');
                assert.ok(geometry.readable && geometry.contained && geometry.alignedWithToolbar, `ширина ${width} px`);
                for (let i = 0; i < geometry.rows.length; i++) {
                    const group = Math.floor(i / 2);
                    const reference = geometry.rows[(group - group % columns) * 2 + i % 2];
                    assert.deepEqual(geometry.rows[i], reference);
                }
            }
        } finally {
            await page.setViewportSize({ width: 1680, height: 960 });
            await general.click();
        }
    });

    await printCheck('A05/A06 · дашборд, закупки, дерево и BI', async () => {
        await page.getByRole('button', { name: 'Метрики', exact: true }).click();
        await shown(page.getByRole('tab', { name: 'Общие', exact: true }));
        const general = page.getByRole('tab', { name: 'Общие', exact: true });
        const anchor = await general.elementHandle();
        await page.getByRole('tab', { name: 'Закупки', exact: true }).click();
        await shown(page.getByText('Минеральная вата', { exact: false }).first());
        assert.equal(await anchor.evaluate(node => node.isConnected), true);
        const contracting = page.getByRole('table', { name: 'Контрактация бюджета', exact: true });
        assert.deepEqual(await contracting.locator('tfoot td').allTextContents(), ['24,0', '17,3', '72,0%']);
        const budgetPanel = page.locator('section[aria-labelledby="procurement-contracting-title"]');
        assert.deepEqual(await budgetPanel.locator('.procurement-map-label strong').allTextContents(), ['72%', '16%', '12%']);
        assert.deepEqual(await budgetPanel.locator('.procurement-budget-legend li span').allTextContents(),
            ['17,3 млрд ₽ (72%)', '3,9 млрд ₽ (16%)', '2,8 млрд ₽ (12%)']);
        assert.equal(await budgetPanel.locator('select').count(), 0);
        const areas = await budgetPanel.locator('.procurement-map-tile').evaluateAll(tiles => {
            const [a, b, c] = tiles.map(tile => tile.getBoundingClientRect());
            const width = a.width + b.width, height = b.height + c.height;
            if (Math.abs(b.left - a.right - 4) > 1 || Math.abs(c.top - b.bottom - 4) > 1) return [];
            return [a.width / width, b.width / width * b.height / height, c.width / width * c.height / height];
        });
        assert.equal(areas.length, 3);
        assert.ok(areas.every((area, i) => Math.abs(area - [17.3, 3.9, 2.8][i] / 24) < 0.001));
        const order = await budgetPanel.evaluate(panel =>
            ['.procurement-main-amount', '.procurement-budget-legend', '.procurement-budget-map', 'table']
                .map(s => panel.querySelector(s).getBoundingClientRect()).every((r, i, rects) => !i || r.top >= rects[i - 1].bottom));
        assert.ok(order, 'сумма → легенда → карта → таблица');
        const overrun = page.getByRole('table', { name: 'Превышение по всем закупкам', exact: true });
        const direction = page.getByRole('group', { name: 'Вид закупки' });
        const overall = page.locator('.procurement-overrun-amount');
        const totalBefore = await overall.textContent();
        assert.match(totalBefore, /1,15 млрд ₽/);
        const works = direction.getByRole('button', { name: 'Работы' });
        const materials = direction.getByRole('button', { name: 'Материалы' });
        const headings = page.locator('.procurement-detail-section > h2');
        assert.deepEqual(await headings.allTextContents(), [
            'Контрактация бюджета', 'Превышение по всем закупкам', 'Закупки под риском', 'Эффективность закупок'
        ]);
        assert.ok(await headings.evaluateAll(nodes => nodes.every(node => {
            const style = getComputedStyle(node);
            return style.fontSize === '16px' && style.fontWeight === '500';
        })));
        const segmentStyle = el => {
            const css = getComputedStyle(el);
            return [css.fontSize, css.fontWeight, css.lineHeight, css.padding, css.borderRadius,
                css.backgroundColor, css.color, css.minBlockSize, css.minInlineSize];
        };
        const activeTab = page.getByRole('tab', { name: 'Закупки', exact: true });
        await page.mouse.move(0, 0);
        await Promise.all([works, materials, activeTab, general].map(button => button.evaluate(async el => {
            getComputedStyle(el).backgroundColor;
            await Promise.all(el.getAnimations().map(animation => animation.finished));
        })));
        assert.deepEqual(await works.evaluate(segmentStyle), await activeTab.evaluate(segmentStyle));
        assert.deepEqual(await materials.evaluate(segmentStyle), await general.evaluate(segmentStyle));
        const amountRect = await overall.boundingBox(), switchRect = await direction.boundingBox();
        assert.ok(switchRect.x >= amountRect.x + amountRect.width);
        assert.ok(Math.abs(amountRect.y + amountRect.height / 2 - switchRect.y - switchRect.height / 2) <= 1);
        assert.equal(await works.getAttribute('aria-pressed'), 'true');
        assert.equal(await overrun.locator('tbody tr').count(), 3);
        const thresholdCards = page.locator('#procurement-threshold-cards');
        assert.equal(await thresholdCards.locator('li').count(), 3);
        assert.ok(await thresholdCards.evaluate(list => {
            const cells = Array.from(list.children, node => node.getBoundingClientRect());
            const table = list.nextElementSibling.getBoundingClientRect();
            return cells.every((cell, i) => cell.top === cells[0].top && (!i || Math.abs(cell.left - cells[i - 1].right) < 1))
                && Math.abs(list.getBoundingClientRect().top - list.previousElementSibling.getBoundingClientRect().bottom - 16) < 1
                && Math.abs(table.top - list.getBoundingClientRect().bottom - 20) < 1;
        }));
        const thresholds = () => thresholdCards.locator('.procurement-threshold-labels').allTextContents();
        const worksScale = await thresholds();
        assert.deepEqual(worksScale, Array(3).fill('0100%130%'));
        assert.deepEqual((await overrun.locator('tbody tr').first().locator('td').allTextContents()).map(s => s.replace(/\s/g, '')), ['4200', '4460', '+260', '+6,2%']);
        const financialPanel = page.locator('section[aria-labelledby="procurement-financial-title"]');
        assert.equal(await financialPanel.locator('details, summary').count(), 0);
        assert.equal(await financialPanel.getByText('Три статьи с наибольшим превышением', { exact: true }).count(), 0);
        await shown(overrun);
        assert.ok(await overrun.locator('tbody th, tbody td').evaluateAll(cells => cells.every(cell => {
            const css = getComputedStyle(cell);
            return css.padding === '12px' && css.borderBottomWidth === '1px' && css.borderBottomStyle === 'solid';
        })));
        await materials.press('Enter');
        assert.equal(await overall.textContent(), totalBefore);
        assert.equal(await materials.getAttribute('aria-pressed'), 'true');
        await shown(overrun.getByRole('columnheader', { name: 'Статья (материалы)' }));
        await shown(overrun.getByRole('rowheader', { name: /^Фасадные материалы/ }));
        assert.equal(await overrun.locator('tbody tr').count(), 3);
        assert.deepEqual(await thresholds(), worksScale);
        assert.match(await thresholdCards.innerText(), /Фасадные материалы/);
        assert.deepEqual((await overrun.locator('tbody tr').first().locator('td').allTextContents()).map(s => s.replace(/\s/g, '')), ['820', '1040', '+220', '+26,8%']);
        await works.click();
        await shown(overrun.getByRole('rowheader', { name: /^Монолитные работы/ }));
        const risks = page.getByRole('table', { name: 'Закупки под риском', exact: true });
        assert.deepEqual(await risks.getByRole('columnheader').allTextContents(), [
            '№ тендера', 'Предмет закупки', 'Направление', 'Стоимость', 'Статус', 'Требуется', 'Прогноз', 'Запас, дн.'
        ]);
        assert.deepEqual(await risks.locator('tbody th').allTextContents(), [
            'T-15234', 'T-15702', 'T-15603', 'T-15677', 'T-15411', 'T-15745', 'T-15562'
        ]);
        assert.equal(await risks.locator('tbody tr').first().getByText('Материалы', { exact: true }).count(), 1);
        const efficiency = page.getByRole('table', { name: 'Эффективность закупок', exact: true });
        assert.deepEqual(await efficiency.getByRole('columnheader').allTextContents(), ['Показатель', 'Факт', 'Норма', 'Δ (к норме)']);
        const participants = efficiency.getByRole('row', { name: /Среднее количество участников на лот/ });
        assert.deepEqual(await participants.getByRole('cell').allTextContents(), ['4,2', '3,1', 'Достаточная конкуренция+1,1']);
        for (const table of [contracting, overrun, risks, efficiency]) {
            assert.equal(await table.locator('th, td').evaluateAll(cells => cells.every(cell => {
                const style = getComputedStyle(cell);
                if (cell.closest('thead')) return style.borderBottomWidth === '0px' && style.backgroundColor === 'rgb(241, 243, 247)' && cell.closest('thead').getBoundingClientRect().height === 42;
                return cell.closest('.procurement-contracting-table tfoot') ? style.borderBottomWidth === '0px'
                    : style.borderBottomWidth === '1px' && style.borderBottomColor === 'rgb(201, 206, 213)';
            })), true);
        }
        try {
            for (const width of [1680, 390]) {
                await page.setViewportSize({ width, height: 960 });
                const edges = table => table.locator('thead th').evaluateAll(cells =>
                    cells.map(cell => cell.getBoundingClientRect().left));
                const riskEdges = await edges(risks);
                const efficiencyEdges = await edges(efficiency);
                assert.ok(efficiencyEdges.slice(1).every((x, i) => Math.abs(x - riskEdges[i + 2]) <= 1));
                const lanes = await risks.getByRole('columnheader').evaluateAll(cells =>
                    cells.slice(2).map(cell => cell.getBoundingClientRect().width));
                assert.ok(Math.max(...lanes) - Math.min(...lanes) <= 1);
                const gaps = await page.locator('.procurement-summary-grid, .procurement-detail-section').evaluateAll(nodes =>
                    nodes.slice(1).map((node, i) => node.getBoundingClientRect().top - nodes[i].getBoundingClientRect().bottom));
                assert.equal(gaps.length, 4);
                assert.ok(gaps.every(gap => Math.abs(gap - 16) <= 0.5));
                for (const table of [risks, efficiency]) {
                    const columns = await table.evaluate(node => {
                        const headers = Array.from(node.tHead.rows[0].cells, cell => cell.getBoundingClientRect());
                        const wrap = node.parentElement;
                        return {
                            aligned: Array.from(node.tBodies[0].rows).every(row => Array.from(row.cells).every((cell, index) => {
                                const bounds = cell.getBoundingClientRect();
                                return Math.abs(bounds.left - headers[index].left) <= 0.5
                                    && Math.abs(bounds.right - headers[index].right) <= 0.5;
                            })),
                            scrollsInside: wrap.scrollWidth > wrap.clientWidth && getComputedStyle(wrap).overflowX === 'auto'
                        };
                    });
                    assert.equal(columns.aligned, true, `колонки при ширине ${width} px`);
                    assert.equal(columns.scrollsInside, width === 390, `прокрутка при ширине ${width} px`);
                }
                const deltas = await efficiency.locator('.procurement-efficiency-delta strong')
                    .evaluateAll(values => values.map(value => value.getBoundingClientRect().right));
                assert.ok(deltas.every(edge => Math.abs(edge - deltas[0]) <= 0.5), `отклонения при ширине ${width} px`);
            }
        } finally {
            await page.setViewportSize({ width: 1680, height: 960 });
        }
        await risks.locator('tbody tr').first().click();
        await shown(page.getByRole('dialog', { name: 'Минеральная вата' }));
        await page.keyboard.press('Escape');
        await gone(page.getByRole('dialog', { name: 'Минеральная вата' }));
        const tender = risks.getByRole('button', { name: 'Подробнее о тендере T-15234' });
        assert.equal(await tender.evaluate(node => node === document.activeElement), true);
        await tender.press('Enter');
        await shown(page.getByRole('dialog', { name: 'Минеральная вата' }));
        await page.keyboard.press('Escape');
        await gone(page.getByRole('dialog', { name: 'Минеральная вата' }));
        await general.click();
        await page.getByRole('button', { name: 'Открыть структуру метрик' }).click();
        const drawer = page.getByRole('dialog', { name: 'Структура метрик' });
        await shown(drawer);
        assert.equal(await drawer.locator('.metric-tree-row').count(), 18);
        const trigger = drawer.locator('.metric-tree-select').first();
        await trigger.click();
        await checkChart();
        await shown(drawer);
        assert.equal(await trigger.evaluate(node => node === document.activeElement), true);
        await drawer.getByRole('button', { name: 'Реестр', exact: true }).click();
        const search = drawer.getByRole('searchbox', { name: 'Поиск по названию метрики' });
        await search.fill('  КВАРТИР  ');
        const result = drawer.getByRole('button', { name: 'Открыть график: Выручка от квартир' });
        await shown(result);
        assert.equal(await drawer.locator('tbody tr').count(), 1);
        await result.click();
        await shown(page.getByRole('dialog', { name: 'Выручка от квартир' }));
        await page.keyboard.press('Escape');
        await shown(drawer);
        assert.equal(await search.inputValue(), '  КВАРТИР  ');
        assert.equal(await result.evaluate(node => node === document.activeElement), true);
        await search.fill('несуществующий показатель');
        await shown(drawer.getByRole('status'));
        await search.fill('');
        assert.equal(await drawer.locator('tbody tr').count(), 18);
        await page.keyboard.press('Escape');
        await gone(drawer);
    });

    await printCheck('A08/A09 · дополнительные экраны не показаны на дашборде', async () => {
        await shown(page.locator('#dashboard-view'));
        for (const id of ['digital-chessboard-summary-view', 'objects-view']) {
            assert.equal(await page.locator('#' + id).count(), 1);
            await gone(page.locator('#' + id));
        }
        assert.equal(await page.getByRole('button', { name: 'Метрики', exact: true }).getAttribute('aria-pressed'), 'true');
    });

    await printCheck('A07 · аналитика и ассистент', async () => {
        await page.getByRole('button', { name: /^Сегодня/ }).click();
        await page.getByRole('button', { name: 'Аналитика', exact: true }).click();
        const analytics = page.getByRole('dialog', { name: 'Аналитика' });
        await shown(analytics.getByText('Общий вывод'));
        assert.match(await analytics.textContent(), /Событий: \d+/);
        await page.keyboard.press('Escape');
        await gone(analytics);
        const assistantTrigger = page.getByRole('button', { name: 'AI ассистент', exact: true });
        await assistantTrigger.click();
        const assistant = page.getByRole('dialog', { name: 'AI-ассистент' });
        await shown(assistant);
        await assistant.locator('textarea').fill('Какие метрики требуют внимания?');
        await assistant.locator('textarea').press('Enter');
        await shown(assistant.getByText('Какие метрики требуют внимания?', { exact: true }).last());
        await shown(assistant.getByText('Демо-ответ', { exact: true }).first());
        assert.equal(await assistant.locator('.ac-answer [role=alert]').count(), 0);
        await page.keyboard.press('Escape');
        await gone(assistant);
        assert.equal(await assistantTrigger.evaluate(node => node === document.activeElement), true);
        assert.equal(await assistantTrigger.count(), 1);
        assert.equal(await assistantTrigger.locator('svg.lucide-sparkle').count(), 1);
        assert.equal(await page.locator('#event-toolbar-root #open-scenter-ai-chat').count(), 0);

        await page.getByRole('button', { name: /^Все события/ }).click();
        await applySourceFilter();
        const reset = page.getByRole('button', { name: 'Закрыть фильтры и выйти' });
        await shown(reset);
        const [fabRect, resetRect] = await Promise.all([assistantTrigger.boundingBox(), reset.boundingBox()]);
        assert.ok(fabRect.x + fabRect.width <= resetRect.x || resetRect.x + resetRect.width <= fabRect.x ||
            fabRect.y + fabRect.height <= resetRect.y || resetRect.y + resetRect.height <= fabRect.y,
        'Плавающая кнопка не перекрывает сброс фильтров');
        await assistantTrigger.focus();
        await page.keyboard.press('Enter');
        await shown(assistant);
        await page.keyboard.press('Escape');
        await gone(assistant);
        await reset.click();

        await page.getByRole('button', { name: 'Метрики', exact: true }).click();
        await assistantTrigger.click();
        await shown(assistant);
        await page.keyboard.press('Escape');
        await gone(assistant);
        await page.getByRole('button', { name: /^Сегодня/ }).click();
    });

    await printCheck('A10 · график и детали на узком окне', async () => {
        await page.setViewportSize({ width: 1024, height: 800 });
        const tools = await page.getByRole('button', { name: 'AI ассистент' }).boundingBox();
        assert.ok(tools && tools.x >= 0 && tools.x + tools.width <= 1024 && tools.y + tools.height <= 800,
            'Плавающая кнопка ассистента внутри видимой области');
        await page.locator('.event-card.has-metric-link').first().click();
        const drawer = page.getByRole('dialog', { name: 'Детальная карточка события' });
        await shown(drawer);
        assert.ok((await drawer.boundingBox()).width <= 1024);
        await drawer.getByRole('button', { name: 'Открыть график связанной метрики' }).click();
        await checkChart();
        await page.keyboard.press('Escape');
        await gone(drawer);
    });

    await printCheck('A01 · проект → очередь → бизнес-юнит → проект', async () => {
        const title = page.locator('.project-summary-title');
        const queue = page.locator('.tree-node[data-level="2"] .tree-item-label').first();
        const project = page.getByRole('button', { name: 'Nova', exact: true });
        const paint = target => target.evaluate(async button => {
            const row = button.closest('.tree-item');
            const style = getComputedStyle(row);
            // Reading the background flushes any transition started by the last interaction.
            void style.backgroundColor;
            await Promise.allSettled(row.getAnimations().map(animation => animation.finished));
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const pixel = canvas.getContext('2d');
            pixel.fillStyle = style.backgroundColor;
            pixel.fillRect(0, 0, 1, 1);
            return { background: [...pixel.getImageData(0, 0, 1, 1).data], icon: getComputedStyle(row.querySelector('.tree-icon svg')).color };
        });
        const selectedPaint = { background: [228, 229, 231, 255], icon: 'rgb(37, 99, 235)' };
        await page.mouse.move(0, 0);
        assert.deepEqual(await paint(project), selectedPaint);
        assert.deepEqual((await paint(queue)).background, [0, 0, 0, 0]);
        await queue.hover();
        assert.deepEqual(await paint(queue), { ...selectedPaint, icon: 'rgb(100, 116, 139)' });
        assert.equal(await queue.getAttribute('aria-current'), null);
        await page.mouse.move(0, 0);
        assert.deepEqual((await paint(queue)).background, [0, 0, 0, 0]);
        await queue.click();
        await page.mouse.move(0, 0);
        assert.deepEqual(await paint(queue), selectedPaint);
        assert.equal(await queue.getAttribute('aria-current'), 'true');
        assert.deepEqual(await paint(project), { background: [0, 0, 0, 0], icon: 'rgb(52, 58, 74)' });
        assert.match(await title.textContent(), /Nova\s*\//);
        const parent = page.locator('.tree-node[data-level="0"]').filter({
            has: page.locator('.tree-item-label[aria-current="true"]')
        }).first().locator(':scope > .tree-item .tree-item-label');
        const name = await parent.textContent();
        await parent.click();
        await page.mouse.move(0, 0);
        assert.deepEqual(await paint(parent), selectedPaint);
        assert.equal(await title.textContent(), name);
        await page.getByRole('button', { name: 'Метрики', exact: true }).click();
        await shown(page.getByRole('heading', { name: 'Выберите проект' }));
        const unavailable = page.getByRole('tablist', { name: 'Разделы метрик' }).getByRole('tab');
        assert.equal(await unavailable.count(), 2);
        assert.ok((await unavailable.evaluateAll(nodes => nodes.map(node => node.disabled))).every(Boolean));
        await project.click();
        assert.equal(await title.textContent(), 'Nova');
        await shown(page.getByRole('heading', { name: 'Контрольные этапы' }));
        await page.getByRole('button', { name: /^Сегодня/ }).click();
    });

    await printCheck('Сводный дашборд · оболочка постоянна во всех четырёх сегментах', async () => {
        const sidebar = page.locator('#left-sidebar');
        const search = page.getByRole('searchbox', { name: 'Поиск проекта' });
        const collapse = sidebar.locator('.left-panel-collapse-btn');
        const segments = page.locator('.toolbar-mode-segments');
        const today = segments.getByRole('button', { name: /^Сегодня/ });
        const metrics = segments.getByRole('button', { name: 'Метрики', exact: true });
        const metricsTabs = page.getByRole('tablist', { name: 'Разделы метрик' });
        const priorityTabs = page.getByRole('tablist', { name: 'Приоритет событий' });
        const treeRoot = sidebar.locator('#project-tree-root');
        const sidebarHandle = await sidebar.elementHandle();
        const readShell = () => page.locator('#dashboard-view').evaluate(node => {
            const find = selector => node.querySelector(selector);
            const bounds = selector => {
                const { x, y, width, height } = find(selector).getBoundingClientRect();
                return [x, y, width, height];
            };
            const background = selector => getComputedStyle(find(selector)).backgroundColor;
            return {
                sidebar: bounds('.left-panel'),
                button: bounds('.left-panel-collapse-btn'),
                search: bounds('.left-search-box'),
                modeGroup: bounds('.toolbar-mode-segments'),
                toolbar: bounds('.event-toolbar'),
                tabs: bounds('.toolbar-context-segments'),
                actions: bounds('.toolbar-right'),
                contentLeft: (find('.event-card, .metrics-kpi-card') || find('#priority-events-container')).getBoundingClientRect().left,
                contentTop: (find('.event-card, .metrics-kpi-card') || find('#priority-events-container')).getBoundingClientRect().top,
                title: bounds('.project-summary-title'),
                description: bounds('.project-summary-meta'),
                descriptionFirstItem: bounds('.project-summary-meta > span')[0],
                headerBottom: document.querySelector('.top-navbar').getBoundingClientRect().bottom,
                backgrounds: ['.left-panel', '.project-summary-header', '.event-toolbar', '#event-feed-sections']
                    .map(background)
            };
        });

        await page.emulateMedia({ reducedMotion: 'reduce' });
        try {
            await search.fill('алхимово');
            await shown(sidebar.getByRole('button', { name: 'Алхимово', exact: true }));
            await search.clear();
            const branch = sidebar.getByRole('button', { name: /^(Свернуть|Развернуть): Nova$/ });
            if (await branch.getAttribute('aria-expanded') === 'true') await branch.click();
            for (const width of [1518, 390]) {
                await page.setViewportSize({ width, height: 960 });
                await today.click();
                await search.fill('Nova');
                const before = await readShell();
                assert.deepEqual(before.backgrounds, Array(4).fill('rgb(32, 33, 37)'));
                assert.deepEqual(before.button.slice(2), [38, 38]);
                assert.equal(before.button[0] - (before.search[0] + before.search[2]), 8);
                for (const mode of [metrics, segments.getByRole('button', { name: /^Все события/ }),
                    segments.getByRole('button', { name: /^Закреплённые/ }), today]) {
                    await mode.click();
                    const isMetrics = (await metrics.getAttribute('aria-pressed')) === 'true';
                    await shown(isMetrics ? metricsTabs : priorityTabs);
                    await gone(isMetrics ? priorityTabs : metricsTabs);
                    assert.equal(await (isMetrics ? metricsTabs : priorityTabs).getByRole('tab').count(), 2);
                    await page.locator('#event-feed-sections').evaluate(node => { node.scrollTop = 0; });
                    const after = await readShell();
                    for (const field of ['sidebar', 'button', 'search', 'backgrounds']) assert.deepEqual(after[field], before[field]);
                    const contentStart = after.sidebar[0] + after.sidebar[2] + 8;
                    const starts = [after.modeGroup[0], after.contentLeft, after.title[0], after.description[0], after.descriptionFirstItem];
                    assert.ok(starts.every(left => Math.abs(left - contentStart) <= 0.5),
                        `общая левая граница ${contentStart} px: ${starts.join(', ')}`);
                    assert.equal(after.search[1] - after.headerBottom, 16);
                    assert.equal(after.title[1] - after.headerBottom, 24);
                    assert.equal(after.description[1] - (after.title[1] + after.title[3]), 12);
                    assert.equal(after.modeGroup[1] - (after.description[1] + after.description[3]), 16);
                    assert.equal(after.contentTop - (after.toolbar[1] + after.toolbar[3]), 16);
                    if (width === 1518) {
                        assert.ok(Math.abs(after.tabs[0] - (after.modeGroup[0] + after.modeGroup[2]) - 8) <= 1);
                        assert.ok(Math.abs(after.tabs[1] - after.modeGroup[1]) <= 1);
                        const tabsBottom = after.tabs[1] + after.tabs[3];
                        if (after.actions[1] >= tabsBottom) {
                            assert.ok(after.actions[0] >= after.toolbar[0]);
                            assert.ok(after.actions[0] + after.actions[2] <= after.toolbar[0] + after.toolbar[2]);
                        } else {
                            assert.ok(after.actions[0] >= after.tabs[0] + after.tabs[2]);
                            assert.ok(after.actions[1] >= after.tabs[1]);
                            assert.equal(after.contentTop - tabsBottom, 16);
                        }
                    } else {
                        assert.ok(Math.abs(after.tabs[0] - after.modeGroup[0]) <= 1);
                        assert.ok(Math.abs(after.tabs[1] - (after.modeGroup[1] + after.modeGroup[3]) - 8) <= 1);
                        assert.ok(after.tabs[0] + after.tabs[2] <= width);
                    }
                    assert.equal(await search.inputValue(), 'Nova');
                    assert.equal(await sidebarHandle.evaluate(node => node.isConnected), true);
                }
                await search.clear();
                assert.equal(await branch.getAttribute('aria-expanded'), 'false');
            }

            await collapse.focus();
            await page.keyboard.press('Enter');
            await gone(search);
            await gone(treeRoot);
            const compact = await collapse.boundingBox();
            assert.equal((await page.locator('.project-summary-title').boundingBox()).y - compact.y, 8);
            await metrics.click();
            assert.deepEqual(await collapse.boundingBox(), compact);
            assert.equal(await collapse.getAttribute('aria-expanded'), 'false');
            await today.click();
            await collapse.focus();
            await page.keyboard.press('Enter');
            await shown(search);
            assert.equal(await collapse.getAttribute('aria-expanded'), 'true');
            await branch.click();
        } finally {
            await page.setViewportSize({ width: 1024, height: 800 });
            await page.emulateMedia({ reducedMotion: 'no-preference' });
        }
    });

    if (process.env.AISHTAB_SCREENSHOT) await page.screenshot({ path: process.env.AISHTAB_SCREENSHOT });
    await printCheck('A02 · смена приоритета и подтверждение скрытия', async () => {
        const entry = page.locator('.event-card').first();
        const id = await entry.getAttribute('data-event-id');
        const button = page.locator(`[data-event-id="${id}"]`);
        const countHigh = Number(await page.locator('#priority-tab-high .priority-tab-badge').textContent());
        await button.click();
        await page.getByRole('button', { name: 'Изменить приоритет' }).click();
        assert.equal(Number(await page.locator('#priority-tab-high .priority-tab-badge').textContent()), countHigh - 1);
        await page.keyboard.press('Escape');
        await page.getByRole('tab', { name: /Низкий приоритет/ }).click();
        await button.click();
        await page.getByRole('button', { name: 'Скрыть событие' }).click();
        const confirmation = page.getByRole('alertdialog', { name: 'Скрыть событие?' });
        await confirmation.getByRole('button', { name: 'Отмена' }).click();
        await gone(confirmation);
        await page.getByRole('button', { name: 'Скрыть событие' }).click();
        await confirmation.getByRole('button', { name: 'Скрыть', exact: true }).click();
        await gone(button);
    });

    assert.deepEqual(errors, []);
    console.log('PASS консоль и ресурсы приложения');
} finally {
    await browser.close();
}
