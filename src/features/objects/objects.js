(function (window, document) {
    'use strict';

    const EMPTY_FILTERS = Object.freeze({ status: 'all', contractor: 'all', search: '' });
    const FALLBACK_STATUS = Object.freeze({
        'not-started': { label: 'Не начато', tone: 'neutral' },
        'in-progress': { label: 'В работе', tone: 'positive' },
        'on-schedule': { label: 'По графику', tone: 'info' },
        completed: { label: 'Завершено', tone: 'neutral' },
        delayed: { label: 'Отстаёт', tone: 'warning' }
    });

    let root = null;
    let context = null;
    let model = null;
    let projectId = null;
    let mounted = false;
    let activeObjectId = null;
    let expandedGroups = new Set();
    let quickStatus = 'all';
    let appliedFilters = { ...EMPTY_FILTERS };
    let draftFilters = { ...EMPTY_FILTERS };
    let filterOpen = false;
    let filterReturnFocus = null;
    let pendingFocus = null;
    let announcement = '';
    let announcementTimer = null;
    let scrollObserver = null;
    let scrollCleanup = null;
    let stopScrollDrag = null;
    let tableScroll = { top: 0, left: 0 };
    let scrollResetPending = true;

    function esc(value) {
        return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
    }

    function icon(name, size = 18) {
        const paths = {
            building: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M9 7h2M9 11h2M9 15h2M3 21h18M15 9h3a2 2 0 0 1 2 2v10"/>',
            parking: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
            school: '<path d="m3 10 9-5 9 5-9 5-9-5Z"/><path d="M7 12v5c3 2 7 2 10 0v-5M21 10v6"/>',
            check: '<path d="m5 12 4 4L19 6"/>',
            down: '<path d="m6 9 6 6 6-6"/>',
            right: '<path d="m9 18 6-6-6-6"/>',
            folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
            file: '<path d="M6 2h9l3 3v17H6z"/><path d="M14 2v5h4M9 12h6M9 16h6"/>',
            filter: '<path d="M4 5h16l-6 7v5l-4 2v-7Z"/>',
            download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/>',
            search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
            reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
            close: '<path d="m6 6 12 12M18 6 6 18"/>',
            more: '<circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>',
            info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
        };
        return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.info}</svg>`;
    }

    function cloneFilters(value) { return { status: value.status, contractor: value.contractor, search: value.search }; }
    function formatDate(value) {
        if (!value) return '—';
        const date = new Date(`${value}T00:00:00`);
        return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('ru-RU').format(date);
    }
    function formatArea(value) { return Number.isFinite(Number(value)) ? new Intl.NumberFormat('ru-RU').format(Number(value)) : '—'; }
    function statusMap() {
        const explicit = window.objectsData?.STATUS_META;
        if (explicit && Object.values(explicit).every((item) => item && typeof item === 'object')) return explicit;
        const values = window.objectsData?.STATUS ? Object.values(window.objectsData.STATUS) : Object.keys(FALLBACK_STATUS);
        return values.reduce((result, value) => {
            result[value] = FALLBACK_STATUS[value] || { label: value, tone: 'neutral' };
            return result;
        }, {});
    }
    function statusMeta(status) { return statusMap()[status] || FALLBACK_STATUS['not-started']; }
    function activeFilterCount(filters) { return Number(filters.status !== 'all') + Number(filters.contractor !== 'all') + Number(Boolean(filters.search.trim())); }

    function objects() { return Array.isArray(model?.objects) ? model.objects : Array.isArray(model?.items) ? model.items : []; }
    function activeObject() { return objects().find((item) => item.id === activeObjectId) || objects()[0] || null; }
    function rowsFor(object) {
        if (!object) return [];
        if (Array.isArray(object.workRows)) return object.workRows;
        if (Array.isArray(object.rows)) return object.rows;
        if (Array.isArray(model?.workRowsByObject?.[object.id])) return model.workRowsByObject[object.id];
        return [];
    }
    function objectValue(object, names, fallback = '') {
        for (const name of names) if (object?.[name] !== undefined && object[name] !== null) return object[name];
        return fallback;
    }
    function isReady() { return model && (model.status === undefined || model.status === 'ready'); }
    function firstGroupId(object) { return rowsFor(object).find((row) => row.depth === 0 || row.kind === 'work-group')?.id || null; }

    function resetForModel() {
        activeObjectId = objects()[0]?.id || null;
        scrollResetPending = true;
        resetObjectState();
    }
    function resetObjectState() {
        expandedGroups = new Set();
        const first = firstGroupId(activeObject());
        if (first) expandedGroups.add(first);
        quickStatus = 'all';
        appliedFilters = { ...EMPTY_FILTERS };
        draftFilters = { ...EMPTY_FILTERS };
        closeFilter(false);
        stopScrollDrag?.();
    }

    function rowMatches(row, filters, selectedStatus) {
        const query = filters.search.trim().toLocaleLowerCase('ru');
        const searchable = `${row.code || ''} ${row.name || ''} ${row.contractorName || ''}`.toLocaleLowerCase('ru');
        return (selectedStatus === 'all' || row.status === selectedStatus)
            && (filters.status === 'all' || row.status === filters.status)
            && (filters.contractor === 'all' || row.contractorName === filters.contractor)
            && (!query || searchable.includes(query));
    }

    function filteredRows(forExport = false) {
        const rows = rowsFor(activeObject());
        const groups = rows.filter((row) => row.depth === 0 || row.kind === 'work-group');
        const children = rows.filter((row) => row.depth === 1 || row.kind !== 'work-group');
        return groups.flatMap((group) => {
            const matches = children.filter((child) => child.parentId === group.id && rowMatches(child, appliedFilters, quickStatus));
            if (!rowMatches(group, appliedFilters, quickStatus) && !matches.length) return [];
            return forExport || expandedGroups.has(group.id) ? [group, ...matches] : [group];
        });
    }

    function renderFallbackCards(items) {
        return `<div class="obj-object-card-list" role="tablist" aria-label="Объекты строительства">${items.map((item) => {
            const selected = item.id === activeObjectId;
            const actual = Number(objectValue(item, ['actualProgressPercent', 'progressPercent'], 0));
            const plan = Number(objectValue(item, ['cardPlanProgressPercent', 'planProgressPercent'], actual));
            const deviation = actual - plan;
            const iconName = item.icon === 'school' ? 'school' : item.icon === 'square-parking' || item.icon === 'parking' ? 'parking' : 'building';
            const description = objectValue(item, ['cardStructureLabel', 'structureLabel', 'typeLabel', 'type'], 'Объект');
            return `<button class="obj-object-card${selected ? ' is-selected' : ''}" type="button" role="tab" aria-selected="${selected}" tabindex="${selected ? '0' : '-1'}" data-action="select-object" data-object-id="${esc(item.id)}"><span class="obj-object-card-head"><span class="obj-object-icon">${icon(iconName, 24)}</span><span class="obj-object-title"><strong title="${esc(item.name)}">${esc(item.name)}</strong><small title="${esc(description)}">${esc(description)}</small></span>${selected ? `<span class="obj-object-check">${icon('check', 15)}</span>` : ''}</span><span class="obj-object-card-readiness"><span class="obj-object-card-progress"><span class="obj-object-card-ring" style="--obj-object-progress:${actual}%"></span><strong>${actual}%</strong></span><span class="obj-object-card-deviation${deviation < 0 ? ' is-behind' : ' is-on-plan'}">${deviation === 0 ? 'По плану' : `${deviation > 0 ? '+' : ''}${deviation} п.п. к плану`}</span></span></button>`;
        }).join('')}</div>`;
    }

    function renderCards() {
        const items = objects();
        const renderer = window.SCenterComponents?.renderConstructionObjectSelector;
        if (typeof renderer === 'function') {
            try {
                const cards = items.map((item) => {
                    const progress = Number(objectValue(item, ['actualProgressPercent', 'progressPercent'], 0));
                    const plan = Number(objectValue(item, ['cardPlanProgressPercent', 'planProgressPercent'], progress));
                    const deviation = progress - plan;
                    return {
                        id: item.id,
                        name: item.name,
                        typeLabel: objectValue(item, ['typeLabel', 'type'], 'Объект'),
                        descriptionLabel: objectValue(item, ['cardStructureLabel', 'structureLabel'], ''),
                        icon: item.icon,
                        progressPercent: progress,
                        deviationLabel: deviation === 0 ? 'По плану' : `${deviation > 0 ? '+' : ''}${deviation} п.п. к плану`,
                        deviationTone: deviation < 0 ? 'behind' : 'on-plan',
                        metaLabel: objectValue(item, ['cardStructureLabel', 'structureLabel'], '')
                    };
                });
                const html = renderer(cards, { activeId: activeObjectId, ariaLabel: 'Объекты строительства', className: 'obj-shared-object-list' });
                if (typeof html === 'string' && html.trim()) return html;
            } catch (error) {
                console.warn('SCenterObjects: selector fallback is used.', error);
            }
        }
        return renderFallbackCards(items);
    }

    function renderParameters(object) {
        const primaryLabel = objectValue(object, ['floorLabel', 'primaryStructureLabel'], 'Этажность');
        const primaryValue = objectValue(object, ['floorCount', 'primaryStructureValue'], '—');
        const secondaryLabel = objectValue(object, ['sectionLabel', 'secondaryStructureLabel'], 'Секции');
        const secondaryValue = objectValue(object, ['sectionCount', 'secondaryStructureValue'], '—');
        return `<section class="obj-object-summary" aria-label="Параметры и инструменты объекта ${esc(object.name)}"><dl class="obj-object-parameters"><div class="obj-parameter-item is-primary-structure"><dt>${esc(primaryLabel)}</dt><dd>${esc(primaryValue)}</dd></div><div class="obj-parameter-item is-secondary-structure"><dt>${esc(secondaryLabel)}</dt><dd>${esc(secondaryValue)}</dd></div><div class="obj-parameter-item is-area"><dt>Площадь здания</dt><dd>${formatArea(objectValue(object, ['areaSquareMeters', 'area'], null))} м²</dd></div><div class="obj-parameter-item is-start"><dt>Начало работ</dt><dd>${formatDate(objectValue(object, ['workStart', 'plannedStart'], ''))}</dd></div><div class="obj-parameter-item is-completion"><dt>Плановая сдача</dt><dd>${formatDate(objectValue(object, ['plannedCompletion', 'plannedEnd'], ''))}</dd></div></dl>${renderTools()}</section>`;
    }

    function renderWorkSectionHeader() {
        return `<header class="obj-section-header" aria-labelledby="obj-work-section-title"><h2 id="obj-work-section-title">Группы и виды работ</h2></header>`;
    }

    function renderTools() {
        const statuses = statusMap();
        const count = activeFilterCount(appliedFilters);
        return `<div class="obj-summary-actions" aria-label="Инструменты таблицы"><label class="obj-quick-filter"><span>Показывать:</span><select data-action="quick-status" aria-label="Быстрый фильтр по статусу"><option value="all">Все работы</option>${Object.entries(statuses).map(([id, meta]) => `<option value="${esc(id)}"${quickStatus === id ? ' selected' : ''}>${esc(meta.label)}</option>`).join('')}</select>${icon('down', 16)}</label><button class="obj-toolbar-button${count ? ' has-badge' : ''}" type="button" data-action="open-filter" data-focus-key="filter-trigger" aria-haspopup="dialog" aria-expanded="${filterOpen}">${icon('filter')}<span>Фильтры</span>${count ? `<b aria-label="Применено фильтров: ${count}">${count}</b>` : ''}</button><button class="obj-toolbar-button is-icon-only" type="button" data-action="download-csv" aria-label="Скачать CSV" title="Скачать CSV">${icon('download', 19)}</button></div>`;
    }

    function progress(row) {
        const value = Math.max(0, Math.min(100, Number(row.actualProgressPercent || 0)));
        return `<div class="obj-progress"><span class="obj-progress-value">${value}%</span><span class="obj-progress-track" role="progressbar" aria-label="Фактическая готовность: ${esc(row.code)}. ${esc(row.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><span class="obj-progress-fill" style="width:${value}%"></span></span></div>`;
    }

    function rowHtml(row) {
        const isGroup = row.depth === 0 || row.kind === 'work-group';
        const expanded = expandedGroups.has(row.id);
        const meta = statusMeta(row.status);
        const title = `${row.code}. ${row.name}`;
        return `<tr class="${isGroup ? 'obj-group-row' : 'obj-child-row'}"><td class="obj-disclosure-cell obj-sticky-disclosure">${isGroup && row.hasChildren !== false ? `<button type="button" class="obj-disclosure-button" data-action="toggle-group" data-group-id="${esc(row.id)}" aria-expanded="${expanded}" aria-label="${expanded ? 'Свернуть' : 'Развернуть'} группу ${esc(row.name)}">${icon(expanded ? 'down' : 'right', 16)}</button>` : ''}</td><th scope="row" class="obj-name-cell obj-sticky-name"><div class="obj-name-content obj-depth-${isGroup ? 0 : 1}"><span class="obj-row-kind-icon">${icon(isGroup ? 'folder' : 'file', isGroup ? 19 : 17)}</span><span class="obj-row-name-text" title="${esc(title)}"><b>${esc(row.code)}.</b> ${esc(row.name)}</span></div></th><td>${isGroup ? 'Группа работ' : 'Вид работ'}</td><td>${Number(row.weightPercent || 0).toFixed(2).replace('.', ',')}</td><td>${formatDate(row.plannedStart)}</td><td>${formatDate(row.plannedEnd)}</td><td class="obj-contractor-cell"><span class="obj-cell-ellipsis" title="${esc(row.contractorName)}">${esc(row.contractorName)}</span></td><td>${progress(row)}</td><td><span class="obj-status-chip is-${esc(meta.tone)}">${esc(meta.label)}</span></td><td class="obj-row-actions-cell"><button type="button" class="obj-row-actions-button" data-action="row-actions" data-row-title="${esc(title)}" aria-label="Действия: ${esc(title)}" title="Действия">${icon('more')}</button></td></tr>`;
    }

    function renderTable(object) {
        const rows = filteredRows(false);
        const body = rows.length ? rows.map(rowHtml).join('') : `<tr><td colspan="10" class="obj-no-results"><div>${icon('search', 24)}<strong>Работы не найдены</strong><span>Измените условия или сбросьте фильтры.</span><button type="button" data-action="reset-filters">${icon('reset', 16)}Сбросить фильтры</button></div></td></tr>`;
        return `<section class="obj-works-panel" aria-labelledby="obj-works-panel-title"><div class="obj-table-shell sct-shell"><div class="obj-table-scroll sct-scroll" role="region" aria-labelledby="obj-works-panel-title" tabindex="0"><table class="obj-works-table sct-table"><caption class="obj-sr-only" id="obj-works-panel-title">Работы по объекту ${esc(object.name)}</caption><colgroup><col class="obj-col-disclosure"><col class="obj-col-name"><col class="obj-col-type"><col class="obj-col-weight"><col class="obj-col-date"><col class="obj-col-date"><col class="obj-col-contractor"><col class="obj-col-progress"><col class="obj-col-status"><col class="obj-col-actions"></colgroup><thead><tr><th rowspan="2" scope="col" class="obj-disclosure-cell obj-sticky-disclosure"><span class="obj-sr-only">Раскрытие группы</span></th><th rowspan="2" scope="col" class="obj-sticky-name obj-name-header">Наименование</th><th rowspan="2" scope="col">Тип</th><th rowspan="2" scope="col">Вес, %</th><th colspan="2" scope="colgroup">Плановый срок</th><th rowspan="2" scope="col" class="obj-contractor-header">Подрядчик / поставщик</th><th rowspan="2" scope="col">Степень готовности</th><th rowspan="2" scope="col">Статус</th><th rowspan="2" scope="col"><span class="obj-sr-only">Действия</span></th></tr><tr><th scope="col"><span aria-label="Плановая дата начала">С</span></th><th scope="col"><span aria-label="Плановая дата окончания">По</span></th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="10" aria-hidden="true"></td></tr></tfoot></table></div><i class="obj-table-scroll-indicator sct-indicator is-vertical" aria-hidden="true"><b data-scroll-axis="vertical"></b></i><i class="obj-table-scroll-indicator sct-indicator is-horizontal" aria-hidden="true"><b data-scroll-axis="horizontal"></b></i></div></section>`;
    }

    function contractors() {
        return [...new Set(rowsFor(activeObject()).filter((row) => row.depth === 1 || row.kind !== 'work-group').map((row) => row.contractorName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
    }

    function renderFilter() {
        if (!filterOpen) return '';
        return `<div class="obj-filter-backdrop" data-action="filter-backdrop"><section class="obj-filter-dialog" role="dialog" aria-modal="true" aria-labelledby="obj-filter-title"><header><div><span class="obj-dialog-icon">${icon('filter', 20)}</span><div><h2 id="obj-filter-title">Фильтры работ</h2><p>Настройте выборку и примените изменения</p></div></div><button type="button" class="obj-dialog-close" data-action="close-filter" aria-label="Закрыть фильтры">${icon('close', 20)}</button></header><div class="obj-filter-body"><label><span>Поиск</span><div class="obj-input-with-icon">${icon('search', 17)}<input data-action="filter-search" type="search" value="${esc(draftFilters.search)}" placeholder="Название, код или подрядчик"></div></label><label><span>Статус</span><select data-action="filter-status"><option value="all">Все статусы</option>${Object.entries(statusMap()).map(([id, meta]) => `<option value="${esc(id)}"${draftFilters.status === id ? ' selected' : ''}>${esc(meta.label)}</option>`).join('')}</select></label><label><span>Подрядчик / поставщик</span><select data-action="filter-contractor"><option value="all">Все подрядчики</option>${contractors().map((name) => `<option value="${esc(name)}"${draftFilters.contractor === name ? ' selected' : ''}>${esc(name)}</option>`).join('')}</select></label></div><footer><button type="button" class="obj-secondary-button" data-action="reset-draft">${icon('reset', 16)}Сбросить</button><div><button type="button" class="obj-secondary-button" data-action="close-filter">Отмена</button><button type="button" class="obj-primary-button" data-action="apply-filter">Применить</button></div></footer></section></div>`;
    }

    function renderUnsupported() {
        const message = model?.message || (model?.status === 'empty' ? 'Для выбранного проекта нет объектов.' : 'Раздел «Объекты» доступен в контексте проекта или очереди проекта.');
        return `<main class="obj-workspace is-unsupported"><header class="obj-view-header"><h1 class="obj-view-title">Объекты</h1></header><section class="obj-unsupported">${icon('info', 28)}<h2>Объекты недоступны</h2><p>${esc(message)}</p></section></main>`;
    }

    function render() {
        if (!root || !mounted) return;
        const previousScroller = root.querySelector?.('.obj-table-scroll');
        if (!scrollResetPending && previousScroller) tableScroll = { top: previousScroller.scrollTop, left: previousScroller.scrollLeft };
        if (scrollResetPending) {
            tableScroll = { top: 0, left: 0 };
            scrollResetPending = false;
        }
        stopScrollDrag?.();
        scrollCleanup?.();
        if (!isReady() || !activeObject()) {
            root.innerHTML = renderUnsupported();
            return;
        }
        const object = activeObject();
        root.innerHTML = `<main class="obj-workspace"><header class="obj-view-header"><h1 class="obj-view-title">Объекты</h1></header><section class="obj-object-selector" aria-label="Выбор объекта строительства">${renderCards()}</section><section class="obj-work-section" aria-labelledby="obj-work-section-title">${renderWorkSectionHeader()}<div class="obj-work-body">${renderParameters(object)}${renderTable(object)}</div></section>${renderFilter()}<div class="obj-toast${announcement ? ' is-visible' : ''}" role="status" aria-live="polite">${announcement ? `${icon('check', 18)}<span>${esc(announcement)}</span>` : ''}</div></main>`;
        const nextScroller = root.querySelector?.('.obj-table-scroll');
        if (nextScroller) {
            nextScroller.scrollTop = tableScroll.top;
            nextScroller.scrollLeft = tableScroll.left;
        }
        bindScroll();
        if (filterOpen) requestAnimationFrame(() => root?.querySelector('[data-action="filter-search"]')?.focus());
        if (pendingFocus) {
            const key = pendingFocus;
            pendingFocus = null;
            requestAnimationFrame(() => root?.querySelector(`[data-focus-key="${key}"]`)?.focus());
        }
    }

    function announce(message) {
        announcement = message;
        window.clearTimeout(announcementTimer);
        announcementTimer = window.setTimeout(() => { announcement = ''; render(); }, 2800);
    }

    function selectObject(id, restoreFocus = false) {
        if (!objects().some((item) => item.id === id)) return;
        activeObjectId = id;
        scrollResetPending = true;
        resetObjectState();
        render();
        if (restoreFocus) requestAnimationFrame(() => root?.querySelector(`[data-object-id="${CSS.escape(id)}"], [data-construction-object-id="${CSS.escape(id)}"]`)?.focus());
    }

    function openFilter(trigger) {
        draftFilters = cloneFilters(appliedFilters);
        filterReturnFocus = trigger || document.activeElement;
        filterOpen = true;
        render();
    }

    function closeFilter(restoreFocus = true) {
        filterOpen = false;
        filterReturnFocus = null;
        if (restoreFocus) pendingFocus = 'filter-trigger';
    }

    function resetFilters() {
        draftFilters = { ...EMPTY_FILTERS };
        appliedFilters = { ...EMPTY_FILTERS };
        quickStatus = 'all';
        announce('Фильтры сброшены');
        render();
    }

    function downloadCsv() {
        const object = activeObject();
        const header = ['Наименование', 'Тип', 'Вес, %', 'Плановый срок с', 'Плановый срок по', 'Подрядчик / поставщик', 'Степень готовности, факт', 'Статус'];
        const values = filteredRows(true).map((row) => [`${row.code}. ${row.name}`, row.kind === 'work-group' || row.depth === 0 ? 'Группа работ' : 'Вид работ', row.weightPercent, formatDate(row.plannedStart), formatDate(row.plannedEnd), row.contractorName, row.actualProgressPercent, statusMeta(row.status).label]);
        const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
        const csv = `\ufeff${[header, ...values].map((line) => line.map(quote).join(';')).join('\r\n')}`;
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `objects-${object.id}-works.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
        announce(`CSV сформирован: ${values.length} строк`);
        render();
    }

    function handleClick(event) {
        const target = event.target.closest('[data-action]');
        if (!target || !root?.contains(target)) return;
        const action = target.dataset.action;
        if (action === 'select-object') selectObject(target.dataset.objectId || target.dataset.constructionObjectId);
        else if (action === 'toggle-group') {
            const id = target.dataset.groupId;
            if (expandedGroups.has(id)) expandedGroups.delete(id); else expandedGroups.add(id);
            render();
        } else if (action === 'open-filter') openFilter(target);
        else if (action === 'close-filter') { closeFilter(); render(); }
        else if (action === 'filter-backdrop' && event.target === target) { closeFilter(); render(); }
        else if (action === 'reset-draft') { draftFilters = { ...EMPTY_FILTERS }; render(); }
        else if (action === 'apply-filter') {
            appliedFilters = { ...draftFilters, search: draftFilters.search.trim() };
            closeFilter(); announce('Фильтры применены'); render();
        } else if (action === 'reset-filters') resetFilters();
        else if (action === 'download-csv') downloadCsv();
        else if (action === 'row-actions') { announce(`Действия для «${target.dataset.rowTitle}» будут доступны после согласования сценария`); render(); }
    }

    function handleChange(event) {
        const action = event.target.dataset.action;
        if (action === 'quick-status') { quickStatus = event.target.value; render(); }
        else if (action === 'filter-status') { draftFilters.status = event.target.value; }
        else if (action === 'filter-contractor') { draftFilters.contractor = event.target.value; }
    }

    function handleInput(event) {
        if (event.target.dataset.action !== 'filter-search') return;
        draftFilters.search = event.target.value;
    }

    function handleKeyDown(event) {
        if (!root || root.hidden) return;
        const tab = event.target.closest?.('[role="tab"][data-object-id]');
        const sharedTab = event.target.closest?.('[role="tab"][data-construction-object-id]');
        if (sharedTab && typeof window.SCenterComponents?.handleConstructionObjectSelectorKeydown === 'function') {
            const cards = objects().map((item) => ({ id: item.id }));
            const handled = window.SCenterComponents.handleConstructionObjectSelectorKeydown(event, {
                cards,
                activeId: activeObjectId,
                onSelect: (id) => selectObject(id, true)
            });
            if (handled) return;
        }
        if (tab && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
            const cards = [...root.querySelectorAll('[role="tab"][data-object-id]')];
            let index = cards.indexOf(tab);
            if (event.key === 'Home') index = 0;
            else if (event.key === 'End') index = cards.length - 1;
            else index = (index + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + cards.length) % cards.length;
            event.preventDefault();
            selectObject(cards[index].dataset.objectId, true);
            return;
        }
        if (!filterOpen) return;
        if (event.key === 'Escape') { event.preventDefault(); closeFilter(); render(); return; }
        if (event.key !== 'Tab') return;
        const dialog = root.querySelector('.obj-filter-dialog');
        const focusable = dialog ? [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')].filter((element) => element.offsetParent !== null) : [];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    function updateScrollIndicators() {
        const scroller = root?.querySelector('.obj-table-scroll');
        const body = scroller?.querySelector('tbody');
        const header = scroller?.querySelector('thead th');
        const footer = scroller?.querySelector('tfoot td');
        if (!scroller || !body || !header || !footer) return;
        const shell = scroller.closest('.obj-table-shell');
        const vertical = shell.querySelector('.obj-table-scroll-indicator.is-vertical');
        const horizontal = shell.querySelector('.obj-table-scroll-indicator.is-horizontal');
        const vThumb = vertical.querySelector('b');
        const hThumb = horizontal.querySelector('b');
        const rect = scroller.getBoundingClientRect();
        const top = Math.max(0, header.getBoundingClientRect().bottom - rect.top + 4);
        const bottom = Math.max(0, rect.bottom - footer.getBoundingClientRect().top + 8);
        const trackHeight = Math.max(0, scroller.clientHeight - top - bottom);
        const vRange = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        const bodyHeight = body.getBoundingClientRect().height;
        vertical.style.top = `${top}px`;
        vertical.style.bottom = `${bottom}px`;
        vertical.classList.toggle('is-visible', vRange > 1 && bodyHeight > trackHeight);
        if (vRange > 1) {
            const thumbHeight = Math.max(22, trackHeight * Math.min(1, trackHeight / bodyHeight));
            vThumb.style.height = `${thumbHeight}px`;
            vThumb.style.top = `${(scroller.scrollTop / vRange) * Math.max(0, trackHeight - thumbHeight)}px`;
        }
        const hRange = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
        const trackWidth = Math.max(0, scroller.clientWidth - 12);
        horizontal.style.bottom = `${bottom}px`;
        horizontal.classList.toggle('is-visible', hRange > 1);
        if (hRange > 1) {
            const thumbWidth = Math.max(22, trackWidth * Math.min(1, scroller.clientWidth / scroller.scrollWidth));
            hThumb.style.width = `${thumbWidth}px`;
            hThumb.style.left = `${(scroller.scrollLeft / hRange) * Math.max(0, trackWidth - thumbWidth)}px`;
        }
    }

    function bindScroll() {
        const scroller = root?.querySelector('.obj-table-scroll');
        if (!scroller) return;
        if (window.SCenterConstructionTable?.bind) {
            const controller = window.SCenterConstructionTable.bind(root, {
                scrollSelector: '.obj-table-scroll',
                shellSelector: '.obj-table-shell',
                verticalSelector: '.obj-table-scroll-indicator.is-vertical',
                horizontalSelector: '.obj-table-scroll-indicator.is-horizontal'
            });
            scrollCleanup = () => {
                controller.destroy();
                scrollCleanup = null;
            };
            return;
        }
        const onScroll = () => updateScrollIndicators();
        scroller.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        if (window.ResizeObserver) {
            scrollObserver = new window.ResizeObserver(onScroll);
            scrollObserver.observe(scroller);
            const table = scroller.querySelector('table');
            if (table) scrollObserver.observe(table);
        }
        const frame = requestAnimationFrame(onScroll);
        scrollCleanup = () => {
            cancelAnimationFrame(frame);
            scroller.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            scrollObserver?.disconnect();
            scrollObserver = null;
            scrollCleanup = null;
        };
    }

    function handlePointerDown(event) {
        if (window.SCenterConstructionTable?.bind) return;
        const thumb = event.target.closest?.('[data-scroll-axis]');
        if (!thumb || !root?.contains(thumb)) return;
        const axis = thumb.dataset.scrollAxis;
        const track = thumb.parentElement;
        const scroller = root.querySelector('.obj-table-scroll');
        if (!track || !scroller) return;
        event.preventDefault();
        const startPointer = axis === 'vertical' ? event.clientY : event.clientX;
        const startScroll = axis === 'vertical' ? scroller.scrollTop : scroller.scrollLeft;
        const range = axis === 'vertical' ? scroller.scrollHeight - scroller.clientHeight : scroller.scrollWidth - scroller.clientWidth;
        const travel = axis === 'vertical' ? Math.max(1, track.clientHeight - thumb.offsetHeight) : Math.max(1, track.clientWidth - thumb.offsetWidth);
        thumb.setPointerCapture?.(event.pointerId);
        thumb.classList.add('is-dragging');
        const move = (moveEvent) => {
            const pointer = axis === 'vertical' ? moveEvent.clientY : moveEvent.clientX;
            const next = startScroll + (pointer - startPointer) * range / travel;
            if (axis === 'vertical') scroller.scrollTop = next; else scroller.scrollLeft = next;
        };
        const stop = () => {
            thumb.classList.remove('is-dragging');
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', stop);
            stopScrollDrag = null;
        };
        stopScrollDrag?.();
        stopScrollDrag = stop;
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', stop, { once: true });
    }

    function mount(nextRoot, options = {}) {
        if (!nextRoot) throw new Error('SCenterObjects.mount: root is required.');
        if (mounted && root !== nextRoot) destroy();
        if (!mounted) {
            root = nextRoot;
            root.addEventListener('click', handleClick);
            root.addEventListener('change', handleChange);
            root.addEventListener('input', handleInput);
            root.addEventListener('pointerdown', handlePointerDown);
            document.addEventListener('keydown', handleKeyDown);
            mounted = true;
        }
        setContext(options.context || window.activeContext || null);
    }

    function setContext(nextContext) {
        context = nextContext;
        const nextModel = window.objectsData?.getForContext?.(context);
        if (!nextModel) throw new Error('SCenterObjects: objects data layer is not loaded.');
        const nextProjectId = nextModel.projectId || null;
        model = nextModel;
        if (nextProjectId !== projectId) {
            projectId = nextProjectId;
            resetForModel();
        } else if (!objects().some((item) => item.id === activeObjectId) && objects().length) {
            activeObjectId = objects()[0].id;
            scrollResetPending = true;
            resetObjectState();
        }
        render();
    }

    function show() { if (root) { root.hidden = false; render(); } }
    function closeOverlays() { if (filterOpen) { closeFilter(false); render(); } stopScrollDrag?.(); }
    function hide() {
        closeFilter(false);
        stopScrollDrag?.();
        scrollCleanup?.();
        window.clearTimeout(announcementTimer);
        announcement = '';
        if (root) root.hidden = true;
    }
    function destroy() {
        if (!root) return;
        closeFilter(false);
        stopScrollDrag?.();
        scrollCleanup?.();
        window.clearTimeout(announcementTimer);
        root.removeEventListener('click', handleClick);
        root.removeEventListener('change', handleChange);
        root.removeEventListener('input', handleInput);
        root.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('keydown', handleKeyDown);
        root.innerHTML = '';
        root = null;
        mounted = false;
        model = null;
        context = null;
        projectId = null;
        tableScroll = { top: 0, left: 0 };
        scrollResetPending = true;
    }

    window.SCenterObjects = Object.freeze({ mount, setContext, show, hide, closeOverlays, destroy });
})(window, document);
