/**
 * S.Center FilterDrawer Component — High-Fidelity Refinement
 * Phase: Pixel Perfect Accordions & Hierarchical Selectors
 */

const filterDrawerState = {
    sources: [], // List of selected IDs
    priority: 'all', // all | high | low
    time: '', // '' | today | week | month | custom
    selectedMetrics: [], // List of IDs
    totalCount: 0
};

// Selector data is resolved from the shared data layer.
function getFilterSources() {
    if (window.appData && window.appData.getEventSources) {
        return window.appData.getEventSources();
    }
    return [];
}

function getFilterMetrics() {
    if (window.appData && window.appData.getMetricSelectorTree) {
        return window.appData.getMetricSelectorTree(window.metricsData);
    }
    return window.metricsData || null;
}

function initFilterDrawer() {
    if (document.getElementById('filter-drawer-overlay')) return;

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'filter-drawer-overlay';
    overlay.className = 'filter-drawer-overlay';
    overlay.onclick = closeFilterDrawer;

    // Panel
    const drawer = document.createElement('div');
    drawer.id = 'filter-drawer';
    drawer.className = 'filter-drawer';
    
    drawer.innerHTML = `
        <header class="fd-header">
            <div class="fd-header-left">
                <div class="fd-header-icon">
                    <i data-lucide="sliders-horizontal"></i>
                </div>
                <div class="fd-title-box">
                    <h2>Фильтры</h2>
                    <div class="fd-subtitle">Выполнено настроек: <span id="fd-total-count">0</span></div>
                </div>
            </div>
            <button class="fd-close" onclick="closeFilterDrawer()">
                <i data-lucide="x" style="width: 24px; height: 24px;"></i>
            </button>
        </header>

        <section class="fd-content" id="fd-accordions-container">
            <!-- Accordions rendered here -->
        </section>

        <footer class="fd-footer">
            <button class="btn-fd-ghost" onclick="resetAllFilters()">Сбросить все</button>
            <div class="fd-footer-right">
                <button class="btn-fd-ghost" style="color:var(--fd-text-muted);" onclick="closeFilterDrawer()">Отмена</button>
                <button class="btn-fd-apply" onclick="applyFiltersAndSync()">Применить</button>
            </div>
        </footer>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    
    renderAccordions();
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Рендеринг всех блоков
 */
function renderAccordions() {
    const container = document.getElementById('fd-accordions-container');
    if (!container) return;

    container.innerHTML = `
        ${renderFilterBlock('source', 'Источник события', renderSourceContent())}
        ${renderFilterBlock('priority', 'Приоритет', renderPriorityContent())}
        ${renderFilterBlock('time', 'Время', renderTimeContent())}
        ${renderFilterBlock('metric', 'Метрика', renderMetricContent())}
    `;

    updateTotalCount();
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Шаблон блока-аккордеона
 */
function renderFilterBlock(id, title, content) {
    const hasSelection = isBlockChanged(id);
    const count = getBlockSelectionCount(id);

    return `
        <div class="fd-filter-block" id="block-${id}" data-block-id="${id}">
            <div class="fd-block-header">
                <div class="fd-acc-left">
                    <span>${title}</span>
                </div>
                <div class="fd-acc-right">
                    <span class="fd-badge ${count > 0 ? 'visible' : ''}" id="badge-${id}">${count}</span>
                    <button class="fd-reset-btn ${hasSelection ? 'visible' : ''}" 
                            id="reset-${id}" 
                            onclick="event.stopPropagation(); resetBlock('${id}')">Сбросить</button>
                </div>
            </div>
            <div class="fd-block-body">
                <div class="fd-inner">
                    ${content}
                </div>
            </div>
        </div>
    `;
}

/**
 * Контент: Источник
 */
function renderSourceContent() {
    return `
        <div class="fd-search-box">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Укажите источник" oninput="filterList('source', this.value)">
        </div>
        <div class="fd-item-list" id="list-source">
            ${getFilterSources().map(s => `
                <label class="fd-checkbox-label" data-search="${s.name.toLowerCase()}">
                    <input type="checkbox" name="fd-source" value="${s.id}" 
                           ${filterDrawerState.sources.includes(s.id) ? 'checked' : ''}
                           onchange="onSourceChange()">
                    <span>${s.name}</span>
                </label>
            `).join('')}
        </div>
    `;
}

/**
 * Контент: Приоритет
 */
function renderPriorityContent() {
    const options = [
        { id: 'all', name: 'Все' },
        { id: 'high', name: 'Высокий приоритет' },
        { id: 'low', name: 'Остальные события' }
    ];
    return `
        <div class="fd-item-list">
            ${options.map(o => `
                <label class="fd-radio-label">
                    <input type="radio" name="fd-priority" value="${o.id}" 
                           ${filterDrawerState.priority === o.id ? 'checked' : ''}
                           onchange="onPriorityChange(this.value)">
                    <span>${o.name}</span>
                </label>
            `).join('')}
        </div>
    `;
}

/**
 * Контент: Время
 */
function renderTimeContent() {
    const periodOptions = [
        { id: '', name: 'Все время' },
        { id: 'today', name: 'Сегодня' },
        { id: 'week', name: 'Неделя' },
        { id: 'month', name: 'Месяц' },
        { id: 'custom', name: 'Дата / Период' }
    ];
    return `
        <div class="fd-item-list">
            ${periodOptions.map(o => `
                <label class="fd-radio-label">
                    <input type="radio" name="fd-time" value="${o.id}" 
                           ${filterDrawerState.time === o.id ? 'checked' : ''}
                           onchange="onTimeChange(this.value)">
                    <span>${o.name}</span>
                </label>
            `).join('')}
        </div>
    `;
}

/**
 * Контент: Метрика
 */
function renderMetricContent() {
    return `
        <div class="fd-search-box">
            <i data-lucide="search"></i>
            <input type="text" placeholder="Укажите метрику" oninput="filterMetricTree(this.value)">
        </div>
        <div class="fd-tree-container">
            <ul class="fd-tree">
                ${getFilterMetrics() ? renderMetricNode(getFilterMetrics()) : ''}
            </ul>
        </div>
    `;
}

function renderMetricNode(node) {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = filterDrawerState.selectedMetrics.includes(node.id);
    
    return `
        <li class="fd-tree-item" data-id="${node.id}" data-name="${node.name.toLowerCase()}">
            <div class="fd-tree-node">
                <input type="checkbox" value="${node.id}" name="fd-metric" 
                       ${isSelected ? 'checked' : ''}
                       onchange="onMetricNodeChange('${node.id}', this.checked)">
                <div class="fd-tree-toggle" onclick="toggleMetricExpand(this)">
                    <i data-lucide="${hasChildren ? 'folder' : 'file-text'}" class="fd-tree-icon"></i>
                </div>
                <span class="fd-tree-label">${node.name}</span>
            </div>
            ${hasChildren ? `
                <div class="fd-tree-children">
                    <ul class="fd-tree">
                        ${node.children.map(child => renderMetricNode(child)).join('')}
                    </ul>
                </div>
            ` : ''}
        </li>
    `;
}

// ======================================
// INTERACTIONS
// ======================================

window.onSourceChange = function() {
    const checked = Array.from(document.querySelectorAll('input[name="fd-source"]:checked')).map(i => i.value);
    filterDrawerState.sources = checked;
    updateBlockUI('source');
    updateTotalCount();
};

window.onPriorityChange = function(val) {
    filterDrawerState.priority = val;
    updateBlockUI('priority');
    updateTotalCount();
};

window.onTimeChange = function(val) {
    filterDrawerState.time = val;
    updateBlockUI('time');
    updateTotalCount();
};

window.onMetricNodeChange = function(id, isChecked) {
    const node = findMetricNodeById(getFilterMetrics(), id);
    if (!node) return;

    // Select/Deselect children
    const childIds = getAllChildIds(node);
    if (isChecked) {
        filterDrawerState.selectedMetrics = [...new Set([...filterDrawerState.selectedMetrics, id, ...childIds])];
    } else {
        filterDrawerState.selectedMetrics = filterDrawerState.selectedMetrics.filter(mid => mid !== id && !childIds.includes(mid));
    }

    // Update parent logic if needed (optional for this task, but requested "и наоборот")
    // Simplified: we just update the checkboxes in the UI
    syncMetricCheckboxes();
    updateBlockUI('metric');
    updateTotalCount();
};

function getAllChildIds(node) {
    let ids = [];
    if (node.children) {
        node.children.forEach(child => {
            ids.push(child.id);
            ids = [...ids, ...getAllChildIds(child)];
        });
    }
    return ids;
}

function findMetricNodeById(root, id) {
    if (!root) return null;
    if (root.id === id) return root;
    if (root.children) {
        for (let child of root.children) {
            const found = findMetricNodeById(child, id);
            if (found) return found;
        }
    }
    return null;
}

function syncMetricCheckboxes() {
    const checkboxes = document.querySelectorAll('input[name="fd-metric"]');
    checkboxes.forEach(cb => {
        cb.checked = filterDrawerState.selectedMetrics.includes(cb.value);
    });
}

function updateBlockUI(id) {
    const resetBtn = document.getElementById(`reset-${id}`);
    const badge = document.getElementById(`badge-${id}`);
    const count = getBlockSelectionCount(id);
    const isChanged = isBlockChanged(id);

    if (resetBtn) resetBtn.classList.toggle('visible', isChanged);
    if (badge) {
        badge.textContent = count;
        badge.classList.toggle('visible', count > 0);
    }
}

function isBlockChanged(id) {
    if (id === 'source') return filterDrawerState.sources.length > 0;
    if (id === 'priority') return filterDrawerState.priority !== 'all';
    if (id === 'time') return filterDrawerState.time !== '';
    if (id === 'metric') return filterDrawerState.selectedMetrics.length > 0;
    return false;
}

function getBlockSelectionCount(id) {
    if (id === 'source') return filterDrawerState.sources.length;
    if (id === 'priority') return filterDrawerState.priority !== 'all' ? 1 : 0;
    if (id === 'time') return filterDrawerState.time !== '' ? 1 : 0;
    if (id === 'metric') return filterDrawerState.selectedMetrics.length;
    return 0;
}

function updateTotalCount() {
    let total = 0;
    total += filterDrawerState.sources.length;
    if (filterDrawerState.priority !== 'all') total++;
    if (filterDrawerState.time !== 'today') total++;
    total += filterDrawerState.selectedMetrics.length;
    
    filterDrawerState.totalCount = total;
    const countNode = document.getElementById('fd-total-count');
    if (countNode) countNode.textContent = total;
}

window.resetBlock = function(id) {
    if (id === 'source') {
        filterDrawerState.sources = [];
        document.querySelectorAll('input[name="fd-source"]').forEach(i => i.checked = false);
    } else if (id === 'priority') {
        filterDrawerState.priority = 'all';
        const d = document.querySelector('input[name="fd-priority"][value="all"]');
        if (d) d.checked = true;
    } else if (id === 'time') {
        filterDrawerState.time = '';
        const d = document.querySelector('input[name="fd-time"][value=""]');
        if (d) d.checked = true;
    } else if (id === 'metric') {
        filterDrawerState.selectedMetrics = [];
        document.querySelectorAll('input[name="fd-metric"]').forEach(i => i.checked = false);
    }
    updateBlockUI(id);
    updateTotalCount();
};

window.resetAllFilters = function() {
    ['source', 'priority', 'time', 'metric'].forEach(resetBlock);
};

window.filterList = function(id, val) {
    const q = val.toLowerCase().trim();
    const items = document.querySelectorAll(`#list-${id} .fd-checkbox-label`);
    items.forEach(item => {
        const text = item.getAttribute('data-search');
        item.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
    });
};

window.filterMetricTree = function(val) {
    const q = val.toLowerCase().trim();
    const nodes = document.querySelectorAll('.fd-tree-item');
    nodes.forEach(node => {
        const text = node.getAttribute('data-name');
        if (!q) {
            node.style.display = 'block';
        } else {
            node.style.display = text.includes(q) ? 'block' : 'none';
        }
    });
};

window.toggleMetricExpand = function(el) {
    const node = el.closest('.fd-tree-item');
    const childrenBlock = node.querySelector('.fd-tree-children');
    if (childrenBlock) {
        const isHidden = childrenBlock.style.display === 'none';
        childrenBlock.style.display = isHidden ? 'block' : 'none';
        el.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
    }
};

// ======================================
// OPEN / CLOSE
// ======================================

window.openFilterDrawer = function() {
    initFilterDrawer();
    renderAccordions(); // CRITICAL: Refresh content and state every time it opens
    setTimeout(() => {
        const overlay = document.getElementById('filter-drawer-overlay');
        const drawer = document.getElementById('filter-drawer');
        if (overlay) overlay.classList.add('active');
        if (drawer) drawer.classList.add('active');
    }, 10);
};

window.closeFilterDrawer = function() {
    const overlay = document.getElementById('filter-drawer-overlay');
    const drawer = document.getElementById('filter-drawer');
    if (overlay) overlay.classList.remove('active');
    if (drawer) drawer.classList.remove('active');
};

window.applyFiltersAndSync = function() {
    // Collect final state
    const sources = filterDrawerState.sources;
    const priority = filterDrawerState.priority;
    const time = filterDrawerState.time;
    const metrics = filterDrawerState.selectedMetrics;

    // Sync with global filterState from app.js
    if (window.filterState) {
        window.filterState.sources = sources;
        window.filterState.priority = priority;
        window.filterState.priorityOnly = (priority === 'high');
        window.filterState.period = time;
        window.filterState.metrics = metrics;
        // REMOVED: window.filterState.activeTab = (time === 'today') ? 'today' : 'all';
        
        // We use the first selected metric for simulation if multiple are selected
        window.filterState.metric = metrics.length > 0 ? metrics[0] : '';
    }

    // Refresh app UI
    if (window.renderEventFeed) window.renderEventFeed();
    if (window.renderToolbar) window.renderToolbar();
    
    closeFilterDrawer();
};

function attachAccordionListeners() {
    // Lucide check
    if (window.lucide) window.lucide.createIcons();
}
