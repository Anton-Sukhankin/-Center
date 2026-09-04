(function (window) {
    'use strict';

    const collapsedMetricIds = new Set();
    let returnFocusTarget = null;

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function initMetricDrawer() {
        if (document.getElementById('metric-drawer')) return true;

        const overlay = document.createElement('div');
        overlay.id = 'metric-drawer-overlay';
        overlay.className = 'metric-drawer-overlay';
        overlay.setAttribute('aria-hidden', 'true');

        const drawer = document.createElement('aside');
        drawer.id = 'metric-drawer';
        drawer.className = 'metric-drawer';
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-labelledby', 'metric-drawer-title');
        drawer.setAttribute('aria-describedby', 'metric-drawer-description');
        drawer.setAttribute('aria-hidden', 'true');
        drawer.innerHTML = `
            <header class="metric-drawer-header">
                <div class="metric-drawer-heading">
                    <span class="metric-drawer-heading-icon" aria-hidden="true">
                        <i data-lucide="network"></i>
                    </span>
                    <div>
                        <h2 id="metric-drawer-title">Структура метрик</h2>
                        <p id="metric-drawer-description">Финансовые показатели выбранного контекста</p>
                    </div>
                </div>
                <button class="metric-drawer-close" type="button" data-metric-drawer-action="close" aria-label="Закрыть структуру метрик">
                    <i data-lucide="x"></i>
                </button>
            </header>
            <div class="metric-drawer-content">
                <ul class="metric-tree" id="metric-tree-root" role="tree" aria-label="Дерево финансовых метрик"></ul>
            </div>
        `;

        overlay.addEventListener('click', closeMetricDrawer);
        drawer.addEventListener('click', handleDrawerClick);
        document.body.appendChild(overlay);
        document.body.appendChild(drawer);
        refreshIcons();
        return true;
    }

    function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function renderMetricNode(node, level) {
        const children = Array.isArray(node.children) ? node.children : [];
        const hasChildren = children.length > 0;
        const isExpanded = hasChildren && !collapsedMetricIds.has(node.id);
        const isSelected = window.activeMetricId === node.id;
        const metricId = escapeHtml(node.id);
        const metricName = escapeHtml(node.name || 'Метрика');
        const impact = level === 0 ? '' : node.budgetImpact === '-' ? '−' : '+';
        return `
            <li class="metric-tree-item" data-level="${level}">
                <div class="metric-tree-row ${isSelected ? 'is-selected' : ''}" role="treeitem" aria-level="${level + 1}" aria-selected="${isSelected}" ${hasChildren ? `aria-expanded="${isExpanded}"` : ''}>
                    ${hasChildren ? `
                        <button class="metric-tree-toggle" type="button" data-metric-action="toggle" data-metric-id="${metricId}" aria-label="${isExpanded ? 'Свернуть' : 'Развернуть'}: ${metricName}" aria-expanded="${isExpanded}">
                            <i data-lucide="chevron-${isExpanded ? 'down' : 'right'}"></i>
                        </button>
                    ` : '<span class="metric-tree-toggle-placeholder" aria-hidden="true"></span>'}
                    <span class="metric-tree-branch-icon" aria-hidden="true">
                        <i data-lucide="${hasChildren ? (isExpanded ? 'folder-open' : 'folder') : 'file-chart-column'}"></i>
                    </span>
                    <button class="metric-tree-select" id="metric-tree-select-${metricId}" type="button" data-metric-action="chart" data-metric-id="${metricId}" aria-label="Открыть график: ${metricName}" title="Открыть график">
                        <span class="metric-tree-select-content">
                            ${impact ? `<span class="metric-tree-impact is-${node.budgetImpact === '-' ? 'negative' : 'positive'}" aria-label="Влияние ${node.budgetImpact === '-' ? 'отрицательное' : 'положительное'}">${impact}</span>` : ''}
                            <span class="metric-tree-label">${metricName}</span>
                        </span>
                    </button>
                </div>
                ${hasChildren ? `
                    <div class="metric-tree-branch ${isExpanded ? 'is-expanded' : ''}" data-metric-branch="${metricId}" aria-hidden="${!isExpanded}" ${isExpanded ? '' : 'inert'}>
                        <div class="metric-tree-branch-inner">
                            <ul class="metric-tree-children" role="group">
                                ${children.map(child => renderMetricNode(child, level + 1)).join('')}
                            </ul>
                        </div>
                    </div>
                ` : ''}
            </li>
        `;
    }

    function renderMetricTree(options = {}) {
        const container = document.getElementById('metric-tree-root');
        if (!container) return false;

        if (!window.metricsData) {
            container.innerHTML = '<li class="metric-tree-empty">Данные метрик недоступны</li>';
            return false;
        }

        container.innerHTML = renderMetricNode(window.metricsData, 0);
        refreshIcons();

        if (options.focusMetricId) {
            document.getElementById(`metric-tree-select-${options.focusMetricId}`)?.focus();
        }
        if (options.focusToggleId) {
            container.querySelector(`[data-metric-action="toggle"][data-metric-id="${options.focusToggleId}"]`)?.focus();
        }
        return true;
    }

    function syncSelection(metricId) {
        document.querySelectorAll('.metric-tree-row').forEach(row => {
            const select = row.querySelector('.metric-tree-select');
            const isSelected = select?.dataset.metricId === metricId;
            row.classList.toggle('is-selected', isSelected);
            row.setAttribute('aria-selected', String(isSelected));
        });
    }

    function selectMetric(metricId, options = {}) {
        if (typeof window.setActiveMetricId !== 'function' || !window.setActiveMetricId(metricId)) return false;
        syncSelection(metricId);
        if (options.focus) document.getElementById(`metric-tree-select-${metricId}`)?.focus();
        return true;
    }

    function toggleMetric(metricId, control) {
        const treeItem = control?.closest('.metric-tree-item');
        const branch = treeItem?.querySelector(':scope > .metric-tree-branch');
        const row = treeItem?.querySelector(':scope > .metric-tree-row');
        if (!treeItem || !branch || !row) return false;

        const isExpanded = collapsedMetricIds.has(metricId);
        if (isExpanded) collapsedMetricIds.delete(metricId);
        else collapsedMetricIds.add(metricId);

        control.setAttribute('aria-expanded', String(isExpanded));
        control.setAttribute('aria-label', `${isExpanded ? 'Свернуть' : 'Развернуть'}: ${row.querySelector('.metric-tree-label')?.textContent || 'Метрика'}`);
        control.innerHTML = `<i data-lucide="chevron-${isExpanded ? 'down' : 'right'}"></i>`;
        row.setAttribute('aria-expanded', String(isExpanded));

        const branchIcon = row.querySelector('.metric-tree-branch-icon');
        if (branchIcon) branchIcon.innerHTML = `<i data-lucide="${isExpanded ? 'folder-open' : 'folder'}"></i>`;

        branch.classList.toggle('is-expanded', isExpanded);
        branch.setAttribute('aria-hidden', String(!isExpanded));
        if (isExpanded) branch.removeAttribute('inert');
        else branch.setAttribute('inert', '');

        refreshIcons();
        return true;
    }

    function openMetricChart(metricId) {
        if (!selectMetric(metricId)) return false;
        if (typeof window.openChartWidget !== 'function') return false;
        return window.openChartWidget(metricId, true);
    }

    function handleDrawerClick(event) {
        const control = event.target.closest('[data-metric-drawer-action], [data-metric-action]');
        if (!control) return;

        if (control.dataset.metricDrawerAction === 'close') {
            closeMetricDrawer();
            return;
        }

        const metricId = control.dataset.metricId;
        if (!metricId) return;
        if (control.dataset.metricAction === 'toggle') toggleMetric(metricId, control);
        if (control.dataset.metricAction === 'chart') openMetricChart(metricId);
    }

    function setTriggerState(isExpanded) {
        const trigger = document.getElementById('open-metric-tree');
        if (trigger) trigger.setAttribute('aria-expanded', String(isExpanded));
    }

    function isOpen() {
        return Boolean(document.getElementById('metric-drawer')?.classList.contains('is-open'));
    }

    function openTreeDrawer() {
        if (!window.metricsData || !initMetricDrawer()) return false;
        if (isOpen()) return true;

        if (typeof window.closeBIModal === 'function') window.closeBIModal({ skipFocusRestore: true });
        window.scenterChat?.close?.();
        if (typeof window.closeFilterDrawer === 'function') window.closeFilterDrawer();

        returnFocusTarget = document.activeElement;
        renderMetricTree();

        const overlay = document.getElementById('metric-drawer-overlay');
        const drawer = document.getElementById('metric-drawer');
        overlay?.classList.add('is-open');
        overlay?.setAttribute('aria-hidden', 'false');
        drawer?.classList.add('is-open');
        drawer?.setAttribute('aria-hidden', 'false');
        document.body.classList.add('metric-tree-open');
        setTriggerState(true);
        window.requestAnimationFrame(() => drawer?.querySelector('.metric-drawer-close')?.focus());
        return true;
    }

    function closeMetricDrawer(options = {}) {
        const overlay = document.getElementById('metric-drawer-overlay');
        const drawer = document.getElementById('metric-drawer');
        if (!drawer || !drawer.classList.contains('is-open')) return false;

        if (typeof window.closeBIModal === 'function') window.closeBIModal({ skipFocusRestore: true });
        overlay?.classList.remove('is-open');
        overlay?.setAttribute('aria-hidden', 'true');
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('metric-tree-open');
        setTriggerState(false);

        if (!options.skipFocusRestore && returnFocusTarget && document.contains(returnFocusTarget)) {
            returnFocusTarget.focus();
        }
        returnFocusTarget = null;
        return true;
    }

    function handleKeydown(event) {
        if (!isOpen() || window.SCenterBI?.isOpen?.()) return;
        const drawer = document.getElementById('metric-drawer');

        if (event.key === 'Escape') {
            event.preventDefault();
            closeMetricDrawer();
            return;
        }

        if (event.key !== 'Tab' || !drawer) return;
        const focusable = Array.from(drawer.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
            .filter(element => !element.closest('[hidden]'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    document.addEventListener('DOMContentLoaded', initMetricDrawer);
    document.addEventListener('keydown', handleKeydown, true);

    window.openTreeDrawer = openTreeDrawer;
    window.closeMetricDrawer = closeMetricDrawer;
    window.selectMetricInStructure = metricId => selectMetric(metricId, { focus: true });
    window.openChartFromStructure = function (event, metricId) {
        event?.stopPropagation?.();
        return openMetricChart(metricId);
    };
    window.AIShtabMetricTree = {
        open: openTreeDrawer,
        close: closeMetricDrawer,
        refresh: renderMetricTree,
        isOpen,
        openChart: openMetricChart
    };
})(window);
