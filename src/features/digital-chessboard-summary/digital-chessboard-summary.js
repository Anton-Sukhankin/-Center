// Нативный feature «Сводка» цифровой шахматки.
(function (window, document) {
    'use strict';

    let root = null;
    let context = null;
    let model = null;
    let mounted = false;
    let getSelectableProjects = () => [];
    let onProjectSelect = () => false;
    let tableController = null;
    let projectTimer = 0;
    let tableTimer = 0;
    let toastTimer = 0;
    let pendingFocus = null;
    let tableScroll = { top: 0, left: 0 };

    const queryScenario = new URLSearchParams(window.location.search).get('summaryScenario') || 'default';
    const allowedScenarios = new Set(['default', 'loading', 'empty', 'table-error', 'attention-error', 'archive-empty', 'archive-error']);
    const scenario = allowedScenarios.has(queryScenario) ? queryScenario : 'default';
    const kpiTones = ['blue', 'green', 'red', 'violet', 'orange', 'yellow'];
    const state = {
        projectOpen: false,
        loading: scenario === 'loading',
        tableLoading: false,
        tableError: scenario === 'table-error',
        attentionError: scenario === 'attention-error',
        selectedObject: 'all',
        expandedIds: new Set(),
        rowMenuId: null,
        archiveSnapshot: null,
        overlay: null,
        toast: ''
    };

    function esc(value) {
        return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
    }

    function icon(name, size = 20, className = '') {
        return `<i data-lucide="${esc(name)}"${className ? ` class="${esc(className)}"` : ''} style="width:${size}px;height:${size}px" aria-hidden="true"></i>`;
    }

    function refreshIcons() {
        window.lucide?.createIcons?.({ attrs: { 'stroke-width': 1.9 } });
    }

    function selectableProjects() {
        const result = getSelectableProjects(context);
        return Array.isArray(result) ? result.filter((project) => project?.id && project?.name) : [];
    }

    function activeProject() {
        return model?.project || null;
    }

    function objectById(objectId) {
        return (model?.objects || []).find((object) => object.id === objectId) || null;
    }

    function issueById(issueId) {
        return (model?.attentionItems || []).find((item) => item.id === issueId) || null;
    }

    function summaryProjectSubtitle(value) {
        return String(value || '')
            .split('·')
            .map((part) => part.trim())
            .filter((part) => part && !['Москва', 'Премиум'].includes(part))
            .join(' · ');
    }

    function projectToolbarTemplate() {
        const project = activeProject();
        const projects = selectableProjects();
        const projectLabel = project?.name || 'Выберите проект';
        const projectSubtitle = summaryProjectSubtitle(project?.subtitle);
        const options = projects.map((item) => {
            const selected = item.id === project?.id;
            const optionSubtitle = summaryProjectSubtitle(item.subtitle);
            return `<button type="button" role="option" aria-selected="${selected}" data-action="select-project" data-project-id="${esc(item.id)}"><span><span class="dcs-project-option-icon">${icon('drafting-compass', 18)}</span><span><strong title="${esc(item.name)}">${esc(item.name)}</strong>${optionSubtitle ? `<small>${esc(optionSubtitle)}</small>` : ''}</span></span>${selected ? icon('check', 17) : ''}</button>`;
        }).join('');
        return `<section class="dcs-project-toolbar" aria-label="Проект и действия"><div class="dcs-project-selector"><button id="dcs-project-trigger" data-focus-key="project-trigger" class="dcs-project-trigger" type="button" data-action="toggle-projects" aria-haspopup="listbox" aria-expanded="${state.projectOpen}" aria-controls="dcs-project-options"><span class="dcs-project-icon">${icon('drafting-compass', 25)}</span><span class="dcs-project-copy"><small>Проект</small><strong title="${esc(projectLabel)}">${esc(projectLabel)}</strong>${projectSubtitle ? `<span>${esc(projectSubtitle)}</span>` : ''}</span>${icon('chevron-down', 20, state.projectOpen ? 'is-rotated' : '')}</button>${state.projectOpen ? `<div class="dcs-project-popover" id="dcs-project-options" role="listbox" aria-label="Выбор проекта">${options || '<p>Проекты недоступны</p>'}</div>` : ''}</div><div class="dcs-toolbar-actions"><button id="dcs-archive-trigger" data-focus-key="archive-trigger" type="button" data-action="open-archive">${icon('archive', 19)}Архив</button><button id="dcs-print-trigger" data-focus-key="print-trigger" type="button" data-action="open-print">${icon('printer', 19)}Печать</button></div></section>`;
    }

    function archiveBannerTemplate() {
        if (!state.archiveSnapshot) return '';
        return `<div class="dcs-archive-banner" role="status">${icon('archive', 18)}<span><strong>${esc(state.archiveSnapshot.title)}</strong><small>${esc(state.archiveSnapshot.period)}</small></span><button type="button" data-action="exit-archive">Вернуться к актуальной сводке</button></div>`;
    }

    function kpiTemplate() {
        if (state.loading) {
            return `<section class="dcs-kpi-grid" aria-label="Загрузка сводных показателей">${Array.from({ length: 6 }, () => '<div class="dcs-kpi-card is-skeleton"><div class="dcs-kpi-header"><span></span><b></b></div><span class="dcs-kpi-skeleton-label"></span></div>').join('')}</section>`;
        }
        return `<section class="dcs-kpi-grid" aria-label="Сводная статистика">${(model?.kpis || []).map((kpi, index) => `<article class="dcs-kpi-card"><div class="dcs-kpi-header"><span class="dcs-kpi-icon is-${esc(kpi.tone || kpiTones[index])}">${icon(kpi.icon || 'building-2', 25)}</span><div class="dcs-kpi-value"><strong>${esc(kpi.value)}</strong>${Number.isFinite(kpi.delta) && kpi.delta !== 0 ? `<span class="is-${kpi.delta > 0 ? 'positive' : 'negative'}">${icon(kpi.delta > 0 ? 'arrow-up' : 'arrow-down', 18)}${kpi.delta > 0 ? '+' : ''}${kpi.delta}%</span>` : ''}</div></div><span class="dcs-kpi-label">${esc(kpi.label)}</span></article>`).join('')}</section>`;
    }

    function weeklyTemplate() {
        const weekly = model?.weeklySummary;
        const tone = weekly?.delta > 0 ? 'positive' : weekly?.delta < 0 ? 'negative' : 'neutral';
        const delta = weekly ? `${weekly.delta > 0 ? '+' : ''}${weekly.delta}%` : '—';
        const tooltip = weekly ? `Строительная готовность проекта ${weekly.delta >= 0 ? 'выросла' : 'снизилась'} с ${weekly.from}% до ${weekly.to}% за период ${model.period?.label || ''}.` : 'Нет данных за выбранный период.';
        const rows = state.loading
            ? Array.from({ length: 7 }, () => '<li class="dcs-list-skeleton"><span></span></li>').join('')
            : (weekly?.insights || []).map((insight) => `<li class="dcs-weekly-item" title="${esc(insight)}"><span aria-hidden="true"></span><p>${esc(insight)}</p></li>`).join('') || '<li class="dcs-list-empty">Нет событий за выбранный период</li>';
        return `<article class="dcs-analytics-card" aria-labelledby="dcs-weekly-title"><header><span class="dcs-card-title-icon">${icon('calendar-days', 20)}</span><h2 id="dcs-weekly-title">Динамика за неделю</h2>${weekly ? `<span class="dcs-weekly-delta-wrap"><button type="button" class="dcs-weekly-delta-tag is-${tone}" aria-describedby="dcs-weekly-tooltip"><span class="dcs-weekly-tag-icon">${icon('info', 10)}</span><strong>${esc(delta)}</strong></button><span class="dcs-weekly-delta-tooltip" id="dcs-weekly-tooltip" role="tooltip">${esc(tooltip)}</span></span>` : ''}</header><div class="dcs-card-scroll" tabindex="0"><ul class="dcs-weekly-list">${rows}</ul></div><footer><button type="button" data-focus-key="weekly-report" class="dcs-link-button" data-action="open-report">Подробнее в отчете${icon('arrow-right', 16)}</button></footer></article>`;
    }

    function severityIcon(tone) {
        return icon('circle-alert', 20, tone === 'critical' ? 'dcs-attention-status is-critical' : 'dcs-attention-status is-warning');
    }

    function attentionTemplate() {
        const objectOptions = [{ id: 'all', name: 'Все объекты' }, ...(model?.objects || [])];
        const items = state.selectedObject === 'all'
            ? (model?.attentionItems || [])
            : (model?.attentionItems || []).filter((item) => item.objectId === state.selectedObject);
        const selectedName = objectOptions.find((item) => item.id === state.selectedObject)?.name || 'Все объекты';
        let content = '';
        if (state.loading) content = Array.from({ length: 7 }, () => '<li class="dcs-list-skeleton"><span></span></li>').join('');
        else if (state.attentionError) content = `<li class="dcs-inline-state"><span>${icon('wifi-off', 20)}</span><div><strong>Не удалось загрузить проблемы</strong><button type="button" data-action="retry-attention">Повторить</button></div></li>`;
        else if (!items.length) content = `<li class="dcs-inline-state is-success"><span>${icon('circle-check', 21)}</span><div><strong>Проблем не найдено</strong><small>Для выбранного объекта нет активных сигналов.</small></div></li>`;
        else content = items.map((item) => `<li><button type="button" class="dcs-attention-item" data-focus-key="issue-${esc(item.id)}" data-action="open-issue" data-issue-id="${esc(item.id)}">${severityIcon(item.tone)}<span title="${esc(item.title)}">${esc(item.title)}</span><b>${item.count}</b>${icon('chevron-right', 17)}</button></li>`).join('');
        const total = items.reduce((sum, item) => sum + item.count, 0);
        return `<article class="dcs-analytics-card" aria-labelledby="dcs-attention-title"><header><span class="dcs-card-title-icon">${icon('circle-alert', 20)}</span><h2 id="dcs-attention-title">Требуют внимания</h2><label class="dcs-object-filter"><span class="dcs-sr-only">Фильтр по объекту</span>${icon('building-2', 17)}<select data-action="filter-attention" aria-label="Фильтр проблем по объекту">${objectOptions.map((item) => `<option value="${esc(item.id)}"${item.id === state.selectedObject ? ' selected' : ''}>${esc(item.name)}</option>`).join('')}</select>${icon('chevron-down', 15)}<span class="dcs-sr-only">Выбрано: ${esc(selectedName)}</span></label></header><div class="dcs-card-scroll" tabindex="0"><ul class="dcs-attention-list">${content}</ul></div><footer><button type="button" data-focus-key="all-issues" class="dcs-link-button" data-action="open-all-issues">Все проблемы по ${state.selectedObject === 'all' ? 'проекту' : esc(selectedName)} (${total})${icon('arrow-right', 16)}</button></footer></article>`;
    }

    function riskTemplate(risk) {
        const label = risk.count ? `${risk.count} ${risk.count === 1 ? 'риск' : 'рисков'}` : 'Рисков нет';
        return `<span class="dcs-risk is-${esc(risk.tone)}" aria-label="${esc(label)}"><span class="dcs-risk-indicator">${risk.count ? '!' : icon('check', 10)}</span><b>${risk.count}</b>${risk.flagged ? `<span class="dcs-risk-star">${icon('star', 17)}</span>` : ''}</span>`;
    }

    function tableStateRow(type) {
        const content = type === 'loading'
            ? `${icon('loader-circle', 23, 'dcs-spin')}<strong>Загружаем объекты</strong><span>Обновляем показатели выбранного проекта.</span>`
            : type === 'error'
                ? `${icon('triangle-alert', 23)}<strong>Таблица временно недоступна</strong><span>Повторите загрузку, данные других блоков сохранены.</span><button type="button" data-action="retry-table">Повторить</button>`
                : `${icon('building-2', 23)}<strong>Объекты не найдены</strong><span>Для выбранного проекта пока нет подключенных объектов.</span>`;
        return `<tr><td colspan="8" class="dcs-table-state"><div>${content}</div></td></tr>`;
    }

    function tableTemplate() {
        const objects = scenario === 'empty' ? [] : (model?.objects || []);
        const tableState = state.loading || state.tableLoading ? 'loading' : state.tableError ? 'error' : objects.length ? 'ready' : 'empty';
        const rows = tableState === 'ready' ? objects.map((object) => {
            const expanded = state.expandedIds.has(object.id);
            const delta = object.weeklyDeltaPercent;
            const rowMenu = state.rowMenuId === object.id ? `<span class="dcs-row-menu" role="menu"><button role="menuitem" type="button" data-action="row-menu-action" data-row-action="open" data-row-id="${esc(object.id)}">${icon('external-link', 16)}Открыть в шахматке</button><button role="menuitem" type="button" data-action="row-menu-action" data-row-action="copy" data-row-id="${esc(object.id)}">${icon('copy', 16)}Скопировать ссылку</button></span>` : '';
            return `<tr class="dcs-object-row"><td class="dcs-sticky-disclosure"><button id="dcs-expand-${esc(object.id)}" type="button" class="dcs-disclosure-button" data-action="toggle-row" data-row-id="${esc(object.id)}" aria-expanded="${expanded}" aria-label="${expanded ? 'Свернуть' : 'Развернуть'} ${esc(object.name)}">${icon(expanded ? 'chevron-down' : 'chevron-right', 16)}</button></td><th scope="row" class="dcs-sticky-name"><span class="dcs-object-name-icon">${icon(object.icon || 'building-2', 19)}</span><span>${esc(object.name)}</span></th><td>${esc(object.typeLabel)}</td><td><span class="dcs-progress"><b>${object.readinessPercent}%</b><span role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${object.readinessPercent}"><i style="width:${object.readinessPercent}%"></i></span></span></td><td><span class="dcs-delta is-${delta < 0 ? 'negative' : delta > 0 ? 'positive' : 'neutral'}">${icon(delta < 0 ? 'arrow-down' : delta > 0 ? 'arrow-up' : 'minus', 17)}<b>${delta > 0 ? '+' : ''}${delta}%</b></span></td><td>${riskTemplate(object.risk)}</td><td>${esc(object.lastUpdatedAt)}</td><td class="dcs-actions-cell"><span class="dcs-actions-layout"><button data-focus-key="open-${esc(object.id)}" class="dcs-open-button" type="button" data-action="open-object" data-row-id="${esc(object.id)}">Открыть</button><span class="dcs-row-menu-wrap"><button id="dcs-menu-${esc(object.id)}" class="dcs-menu-button" type="button" data-action="toggle-row-menu" data-row-id="${esc(object.id)}" aria-haspopup="menu" aria-expanded="${state.rowMenuId === object.id}" aria-label="Меню: ${esc(object.name)}">${icon('ellipsis-vertical', 19)}</button>${rowMenu}</span></span></td></tr>${expanded ? `<tr class="dcs-expanded-row"><td></td><td colspan="7"><div><strong>${esc(object.name)}</strong><span>${esc(object.detail)}</span></div></td></tr>` : ''}`;
        }).join('') : tableStateRow(tableState);
        return `<section class="dcs-table-card" aria-labelledby="dcs-table-title"><div class="dcs-table-title"><div><h2 id="dcs-table-title">Объекты строительства</h2><span>${objects.length} объектов</span></div>${state.archiveSnapshot ? `<span class="dcs-readonly-chip">${icon('lock', 15)}Архивный снимок</span>` : ''}</div><div class="dcs-table-shell sct-shell"><div class="dcs-table-scroll sct-scroll" tabindex="0" role="region" aria-labelledby="dcs-table-title"><table class="dcs-objects-table sct-table"><caption class="dcs-sr-only">Сводные показатели объектов проекта ${esc(activeProject()?.name || '')}</caption><colgroup><col class="dcs-col-disclosure"><col class="dcs-col-object"><col class="dcs-col-type"><col class="dcs-col-readiness"><col class="dcs-col-delta"><col class="dcs-col-risk"><col class="dcs-col-update"><col class="dcs-col-actions"></colgroup><thead><tr><th class="dcs-sticky-disclosure"><span class="dcs-sr-only">Раскрытие</span></th><th class="dcs-sticky-name">Объект</th><th>Тип</th><th>Строительная готовность</th><th>Динамика за неделю</th><th>Риски</th><th>Последнее обновление</th><th>Действия</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="8" aria-hidden="true"></td></tr></tfoot></table></div><i class="dcs-table-scroll-indicator sct-indicator is-vertical" aria-hidden="true"><b data-scroll-axis="vertical"></b></i><i class="dcs-table-scroll-indicator sct-indicator is-horizontal" aria-hidden="true"><b data-scroll-axis="horizontal"></b></i></div></section>`;
    }

    function unsupportedTemplate() {
        return `<section class="dcs-unsupported"><span>${icon('info', 28)}</span><h2>Выберите проект</h2><p>${esc(model?.message || 'Сводка доступна в контексте проекта или очереди.')}</p></section>`;
    }

    function drawerShell(title, subtitle, iconName, body, focusKey) {
        return `<div class="dcs-overlay" data-overlay-backdrop><section class="dcs-drawer" role="dialog" aria-modal="true" aria-labelledby="dcs-overlay-title"><header><div><span>${icon(iconName, 21)}</span><div><h2 id="dcs-overlay-title">${esc(title)}</h2><p>${esc(subtitle)}</p></div></div><button type="button" data-action="close-overlay" data-overlay-close aria-label="Закрыть">${icon('x', 20)}</button></header><div class="dcs-drawer-body">${body}</div>${focusKey ? `<footer><button type="button" class="dcs-secondary-button" data-action="copy-detail">${icon('copy', 16)}Скопировать ссылку</button><button type="button" class="dcs-primary-button" data-action="future-open">${icon('external-link', 16)}Открыть</button></footer>` : ''}</section></div>`;
    }

    function archiveOverlayTemplate() {
        const status = state.overlay?.status;
        let body = '';
        if (status === 'error') body = `<div class="dcs-overlay-state">${icon('triangle-alert', 24)}<strong>Архив временно недоступен</strong><button type="button" data-action="retry-archive">Повторить</button></div>`;
        else if (status === 'empty' || !(model?.archive || []).length) body = `<div class="dcs-overlay-state">${icon('archive', 24)}<strong>Архивных снимков пока нет</strong><span>Первый снимок появится после закрытия отчетного периода.</span></div>`;
        else body = `<div class="dcs-archive-list">${model.archive.map((snapshot) => `<button type="button" data-action="select-archive" data-snapshot-id="${esc(snapshot.id)}"><span>${icon('file-clock', 19)}<span><strong>${esc(snapshot.title)}</strong><small>${esc(snapshot.period)}</small></span></span>${icon('chevron-right', 18)}</button>`).join('')}</div>`;
        return drawerShell('Архив сводок', activeProject()?.name || '', 'history', body, false);
    }

    function detailOverlayTemplate() {
        const item = state.overlay?.item || {};
        const isIssue = item.kind === 'issue';
        const isReport = item.kind === 'report';
        const title = isIssue ? 'Проблема проекта' : isReport ? 'Недельный отчет' : 'Карточка объекта';
        const name = item.title || item.name || 'Детали';
        const body = `<span class="dcs-detail-status is-${esc(item.tone || 'info')}">${isIssue ? severityIcon(item.tone) : icon(isReport ? 'file-text' : 'building-2', 17)}${esc(isIssue ? `${item.count || 0} сигналов` : isReport ? model.period?.label || '' : `${item.readinessPercent || 0}% готовности`)}</span><h3>${esc(name)}</h3><p>${esc(item.detail || (isReport ? 'Сводный отчет объединяет недельные изменения по объектам, рискам и полноте данных.' : 'Демонстрационная детализация выбранного элемента сводки.'))}</p><dl><div><dt>Проект</dt><dd>${esc(activeProject()?.name || '—')}</dd></div><div><dt>Период</dt><dd>${esc(model.period?.label || '—')}</dd></div></dl>`;
        return drawerShell(title, activeProject()?.name || '', isIssue ? 'triangle-alert' : isReport ? 'file-text' : 'building-2', body, true);
    }

    function printOverlayTemplate() {
        const objects = model?.objects || [];
        return `<div class="dcs-overlay dcs-modal-overlay" data-overlay-backdrop><section class="dcs-print-modal" role="dialog" aria-modal="true" aria-labelledby="dcs-print-title"><header><div><span>${icon('printer', 21)}</span><div><h2 id="dcs-print-title">Печать сводки</h2><p>${esc(activeProject()?.name || '')}</p></div></div><button type="button" data-action="close-overlay" data-overlay-close aria-label="Закрыть">${icon('x', 20)}</button></header><div class="dcs-print-sheet"><div class="dcs-print-heading"><div><small>Проектная сводка</small><h3>${esc(activeProject()?.name || '')}</h3><p>${esc(model.period?.label || '')}</p></div>${icon('drafting-compass', 30)}</div><div class="dcs-print-kpis">${(model?.kpis || []).slice(0, 4).map((kpi) => `<div><span>${esc(kpi.label)}</span><strong>${esc(kpi.value)}</strong></div>`).join('')}</div><table><thead><tr><th>Объект</th><th>Готовность</th><th>Динамика</th><th>Риски</th></tr></thead><tbody>${objects.map((object) => `<tr><td>${esc(object.name)}</td><td>${object.readinessPercent}%</td><td>${object.weeklyDeltaPercent > 0 ? '+' : ''}${object.weeklyDeltaPercent}%</td><td>${object.risk.count}</td></tr>`).join('')}</tbody></table></div><footer><button class="dcs-secondary-button" type="button" data-action="close-overlay">Отмена</button><button class="dcs-primary-button" type="button" data-action="print">${icon('printer', 17)}Печать</button></footer></section></div>`;
    }

    function overlayTemplate() {
        if (!state.overlay) return '';
        if (state.overlay.kind === 'archive') return archiveOverlayTemplate();
        if (state.overlay.kind === 'print') return printOverlayTemplate();
        return detailOverlayTemplate();
    }

    function bindConstructionTable() {
        tableController?.destroy?.();
        tableController = window.SCenterConstructionTable?.bind?.(root, {
            scrollSelector: '.dcs-table-scroll',
            shellSelector: '.dcs-table-shell',
            verticalSelector: '.dcs-table-scroll-indicator.is-vertical',
            horizontalSelector: '.dcs-table-scroll-indicator.is-horizontal'
        }) || null;
    }

    function render(focusSelector = null) {
        if (!root || !mounted) return;
        const previousScroller = root.querySelector('.dcs-table-scroll');
        if (previousScroller) tableScroll = { top: previousScroller.scrollTop, left: previousScroller.scrollLeft };
        tableController?.destroy?.();
        pendingFocus = focusSelector || pendingFocus;
        const content = model?.status === 'unsupported-context'
            ? `<div class="dcs-sticky-summary-shell">${projectToolbarTemplate()}</div>${unsupportedTemplate()}`
            : `<div class="dcs-sticky-summary-shell">${archiveBannerTemplate()}${projectToolbarTemplate()}${kpiTemplate()}</div><div class="dcs-analytics-grid">${weeklyTemplate()}${attentionTemplate()}</div>${tableTemplate()}`;
        root.innerHTML = `<main class="dcs-workspace"><header class="dcs-view-header"><h1 class="dcs-view-title">Сводка</h1></header>${content}<div class="dcs-toast${state.toast ? ' is-visible' : ''}" role="status" aria-live="polite">${icon('circle-check', 18)}<span>${esc(state.toast)}</span></div>${overlayTemplate()}</main>`;
        const nextScroller = root.querySelector('.dcs-table-scroll');
        if (nextScroller) {
            nextScroller.scrollTop = tableScroll.top;
            nextScroller.scrollLeft = tableScroll.left;
        }
        bindConstructionTable();
        refreshIcons();
        if (pendingFocus) {
            const selector = pendingFocus;
            pendingFocus = null;
            window.requestAnimationFrame(() => root?.querySelector(selector)?.focus());
        }
    }

    function announce(message) {
        state.toast = message;
        window.clearTimeout(toastTimer);
        render();
        toastTimer = window.setTimeout(() => { state.toast = ''; render(); }, 2400);
    }

    function openOverlay(overlay, trigger) {
        state.projectOpen = false;
        state.rowMenuId = null;
        state.overlay = { ...overlay, returnFocusKey: trigger?.dataset.focusKey || '' };
        render('[data-overlay-close]');
    }

    function closeOverlay() {
        const returnFocusKey = state.overlay?.returnFocusKey || '';
        state.overlay = null;
        render(returnFocusKey ? `[data-focus-key="${CSS.escape(returnFocusKey)}"]` : null);
    }

    function switchProject(projectId) {
        if (!projectId || projectId === activeProject()?.id) {
            state.projectOpen = false;
            render('[data-focus-key="project-trigger"]');
            return;
        }
        state.projectOpen = false;
        state.loading = true;
        state.selectedObject = 'all';
        state.expandedIds = new Set();
        state.rowMenuId = null;
        state.archiveSnapshot = null;
        tableScroll = { top: 0, left: 0 };
        render('[data-focus-key="project-trigger"]');
        window.clearTimeout(projectTimer);
        projectTimer = window.setTimeout(() => {
            state.loading = false;
            const changed = onProjectSelect(projectId);
            if (changed === false) announce('Не удалось переключить проект');
        }, 360);
    }

    function handleClick(event) {
        const actionTarget = event.target.closest('[data-action]');
        if (!actionTarget) {
            let changed = false;
            if (state.projectOpen && !event.target.closest('.dcs-project-selector')) { state.projectOpen = false; changed = true; }
            if (state.rowMenuId && !event.target.closest('.dcs-row-menu-wrap')) { state.rowMenuId = null; changed = true; }
            if (event.target.matches('[data-overlay-backdrop]')) { closeOverlay(); return; }
            if (changed) render();
            return;
        }
        const action = actionTarget.dataset.action;
        if (action === 'toggle-projects') { state.projectOpen = !state.projectOpen; state.rowMenuId = null; render(state.projectOpen ? '.dcs-project-popover [aria-selected="true"], .dcs-project-popover [role="option"]' : '[data-focus-key="project-trigger"]'); }
        else if (action === 'select-project') switchProject(actionTarget.dataset.projectId);
        else if (action === 'open-archive') openOverlay({ kind: 'archive', status: scenario === 'archive-error' ? 'error' : scenario === 'archive-empty' ? 'empty' : 'ready' }, actionTarget);
        else if (action === 'open-print') openOverlay({ kind: 'print' }, actionTarget);
        else if (action === 'open-report') openOverlay({ kind: 'detail', item: { kind: 'report', title: 'Недельный отчет', tone: 'info' } }, actionTarget);
        else if (action === 'open-all-issues') openOverlay({ kind: 'detail', item: { kind: 'issue', title: 'Все проблемы по проекту', tone: 'warning', count: (model?.attentionItems || []).reduce((sum, item) => sum + item.count, 0) } }, actionTarget);
        else if (action === 'open-issue') { const issue = issueById(actionTarget.dataset.issueId); if (issue) openOverlay({ kind: 'detail', item: { ...issue, kind: 'issue' } }, actionTarget); }
        else if (action === 'retry-attention') { state.attentionError = false; render(); }
        else if (action === 'toggle-row') { const id = actionTarget.dataset.rowId; state.expandedIds.has(id) ? state.expandedIds.delete(id) : state.expandedIds.add(id); render(`#dcs-expand-${CSS.escape(id)}`); }
        else if (action === 'open-object') { const object = objectById(actionTarget.dataset.rowId); if (object) openOverlay({ kind: 'detail', item: object }, actionTarget); }
        else if (action === 'toggle-row-menu') { const id = actionTarget.dataset.rowId; state.rowMenuId = state.rowMenuId === id ? null : id; state.projectOpen = false; render(state.rowMenuId ? '.dcs-row-menu [role="menuitem"]' : `#dcs-menu-${CSS.escape(id)}`); }
        else if (action === 'row-menu-action') { const object = objectById(actionTarget.dataset.rowId); state.rowMenuId = null; if (actionTarget.dataset.rowAction === 'copy') window.navigator.clipboard?.writeText(`${activeProject()?.name}: ${object?.name}`); announce(actionTarget.dataset.rowAction === 'copy' ? `Ссылка на ${object?.name || 'объект'} скопирована` : 'Переход в шахматку требует отдельного согласования'); }
        else if (action === 'retry-table') { state.tableError = false; state.tableLoading = true; render(); window.clearTimeout(tableTimer); tableTimer = window.setTimeout(() => { state.tableLoading = false; render(); }, 500); }
        else if (action === 'retry-archive') { state.overlay.status = 'ready'; render('[data-overlay-close]'); }
        else if (action === 'select-archive') { const snapshot = (model?.archive || []).find((item) => item.id === actionTarget.dataset.snapshotId); if (snapshot) { state.archiveSnapshot = snapshot; state.overlay = null; render('[data-focus-key="print-trigger"]'); } }
        else if (action === 'exit-archive') { state.archiveSnapshot = null; render('[data-focus-key="project-trigger"]'); }
        else if (action === 'close-overlay') closeOverlay();
        else if (action === 'copy-detail') { window.navigator.clipboard?.writeText(`${activeProject()?.name}: ${state.overlay?.item?.title || state.overlay?.item?.name || 'детали'}`); announce('Ссылка скопирована'); }
        else if (action === 'future-open') announce('Переход подготовлен для следующего интеграционного этапа');
        else if (action === 'print') window.print();
    }

    function handleChange(event) {
        const select = event.target.closest('select[data-action="filter-attention"]');
        if (!select) return;
        state.selectedObject = select.value;
        render('.dcs-object-filter select');
    }

    function focusWithinOverlay(event) {
        const dialog = root?.querySelector('.dcs-overlay [role="dialog"]');
        if (!dialog || event.key !== 'Tab') return;
        const focusable = [...dialog.querySelectorAll('button:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')].filter((element) => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    function handleKeyDown(event) {
        if (!root || root.hidden) return;
        if (state.overlay) {
            if (event.key === 'Escape') { event.preventDefault(); closeOverlay(); return; }
            focusWithinOverlay(event);
            return;
        }
        if (event.key === 'Escape' && state.projectOpen) { event.preventDefault(); state.projectOpen = false; render('[data-focus-key="project-trigger"]'); return; }
        if (event.key === 'Escape' && state.rowMenuId) { event.preventDefault(); const id = state.rowMenuId; state.rowMenuId = null; render(`#dcs-menu-${CSS.escape(id)}`); return; }
        const option = event.target.closest('.dcs-project-popover [role="option"]');
        if (option) {
            const options = [...root.querySelectorAll('.dcs-project-popover [role="option"]')];
            let index = Math.max(0, options.indexOf(option));
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) event.preventDefault();
            if (event.key === 'ArrowDown') index = (index + 1) % options.length;
            if (event.key === 'ArrowUp') index = (index - 1 + options.length) % options.length;
            if (event.key === 'Home') index = 0;
            if (event.key === 'End') index = options.length - 1;
            options[index]?.focus();
        }
        const menuItem = event.target.closest('.dcs-row-menu [role="menuitem"]');
        if (menuItem) {
            const items = [...root.querySelectorAll('.dcs-row-menu [role="menuitem"]')];
            let index = Math.max(0, items.indexOf(menuItem));
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) event.preventDefault();
            if (event.key === 'ArrowDown') index = (index + 1) % items.length;
            if (event.key === 'ArrowUp') index = (index - 1 + items.length) % items.length;
            if (event.key === 'Home') index = 0;
            if (event.key === 'End') index = items.length - 1;
            items[index]?.focus();
        }
    }

    function resetForProject() {
        state.projectOpen = false;
        state.loading = false;
        state.tableLoading = false;
        state.tableError = scenario === 'table-error';
        state.attentionError = scenario === 'attention-error';
        state.selectedObject = 'all';
        state.expandedIds = new Set();
        state.rowMenuId = null;
        state.archiveSnapshot = null;
        state.overlay = null;
        tableScroll = { top: 0, left: 0 };
    }

    function mount(nextRoot, options = {}) {
        if (!nextRoot) throw new Error('SCenterDigitalChessboardSummary.mount: root is required.');
        if (mounted && root !== nextRoot) destroy();
        getSelectableProjects = typeof options.getSelectableProjects === 'function' ? options.getSelectableProjects : () => [];
        onProjectSelect = typeof options.onProjectSelect === 'function' ? options.onProjectSelect : () => false;
        if (!mounted) {
            root = nextRoot;
            root.addEventListener('click', handleClick);
            root.addEventListener('change', handleChange);
            document.addEventListener('keydown', handleKeyDown);
            mounted = true;
        }
        setContext(options.context || window.activeContext || null);
        if (scenario === 'loading') {
            state.loading = true;
            render();
            window.clearTimeout(projectTimer);
            projectTimer = window.setTimeout(() => { state.loading = false; render(); }, 1600);
        }
    }

    function setContext(nextContext) {
        const previousProjectId = model?.project?.id || null;
        context = nextContext;
        const nextModel = window.digitalChessboardSummaryData?.getForContext?.(context);
        if (!nextModel) throw new Error('SCenterDigitalChessboardSummary: data layer is not loaded.');
        model = scenario === 'empty' && nextModel.status === 'ready' ? { ...nextModel, status: 'empty', objects: [], attentionItems: [], weeklySummary: null, kpis: nextModel.kpis.map((kpi) => ({ ...kpi, value: '0' })) } : nextModel;
        if ((model?.project?.id || null) !== previousProjectId) resetForProject();
        render();
    }

    function show() { if (root) { root.hidden = false; render(); } }

    function closeOverlays() {
        state.projectOpen = false;
        state.rowMenuId = null;
        state.overlay = null;
        tableController?.destroy?.();
        tableController = null;
    }

    function hide() {
        closeOverlays();
        window.clearTimeout(toastTimer);
        state.toast = '';
        if (root) root.hidden = true;
    }

    function destroy() {
        if (!root) return;
        hide();
        window.clearTimeout(projectTimer);
        window.clearTimeout(tableTimer);
        root.removeEventListener('click', handleClick);
        root.removeEventListener('change', handleChange);
        document.removeEventListener('keydown', handleKeyDown);
        root.innerHTML = '';
        root = null;
        context = null;
        model = null;
        mounted = false;
        getSelectableProjects = () => [];
        onProjectSelect = () => false;
    }

    window.SCenterDigitalChessboardSummary = Object.freeze({ mount, setContext, show, hide, closeOverlays, destroy });
})(window, document);
