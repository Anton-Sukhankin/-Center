document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // ======================================
    // DATA
    // ======================================

    const appData = window.appData;
    if (!appData) {
        throw new Error('Data layer is not loaded. Check src/data/app-data.js before src/app/app.js.');
    }

    const projectStructureData = window.projectStructureData;
    if (!projectStructureData) {
        throw new Error('Project structure layer is not loaded. Check src/data/project-structure.js before src/app/app.js.');
    }

    let businessUnits = projectStructureData.getProjectStructure();
    let activeContext = projectStructureData.getContextScope('project', 'proj-nova', businessUnits);
    let activeEntity = {
        type: activeContext.type,
        id: activeContext.id,
        data: projectStructureData.findProjectEntityById(activeContext.id, businessUnits),
        projectId: activeContext.projectId
    };
    window.activeContext = activeContext;

    let mockEventsTemplate = appData.getEventsForContext(activeContext);
    let mockEvents = appData.clone(mockEventsTemplate);
    window.metricsData = appData.getMetricsForContext(activeContext, mockEvents);
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value * 1000000);
    };

    const formatCurrencyShort = (value) => {
        let abs = Math.abs(value);
        let sign = value < 0 ? '-' : '';
        if (abs >= 1000) return sign + (abs / 1000).toFixed(1) + ' млрд ₽';
        return sign + abs + ' млн ₽';
    };

    // ======================================
    // LEFT SIDEBAR (Recursive Tree)
    // ======================================
    function refreshMetricsForCurrentContext() {
        window.metricsData = appData.getMetricsForContext(activeContext, mockEvents);
        if (!findMetricById(window.metricsData, window.activeMetricId)) {
            window.activeMetricId = window.metricsData.id;
        }
    }

    function resetFiltersForContextSwitch() {
        if (!window.filterState) return;
        filterState.period = '';
        filterState.sources = [];
        filterState.priority = 'all';
        filterState.priorityOnly = false;
        filterState.metric = '';
        filterState.metrics = [];
        filterState.searchQuery = '';
        mockEvents.forEach(e => e.excluded = false);
        if (window.toolbarState) {
            window.toolbarState.excludedCount = 0;
            window.toolbarState.isSelectionMode = false;
        }
        draftFilters = { ...filterState };
        if (typeof syncDraftUI === 'function') syncDraftUI();
    }

    function randomizeDataForContext() {
        mockEventsTemplate = appData.getEventsForContext(activeContext);
        mockEvents = appData.clone(mockEventsTemplate);
        refreshMetricsForCurrentContext();
    }

    window.setActiveEntity = function (type, id, projectId, entityData) {
        const nextContext = projectStructureData.getContextScope(type, id, businessUnits);
        if (!nextContext) return;

        activeContext = nextContext;
        window.activeContext = activeContext;
        activeEntity.type = activeContext.type;
        activeEntity.id = activeContext.id;
        activeEntity.projectId = projectId || activeContext.projectId;
        activeEntity.data = entityData || findEntityById(id, businessUnits);
        
        randomizeDataForContext();
        resetFiltersForContextSwitch();
        renderLeftSidebar();
        renderProjectHeader();
        renderEventFeed();
        renderFinancialTree();
    };

    function findEntityById(id, nodes) {
        for (const node of nodes || businessUnits) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findEntityById(id, node.children);
                if (found) return found;
            }
        }
        return null;
    }

    window.toggleTreeNode = function (nodeId, e) {
        if (e) e.stopPropagation();
        const node = findEntityById(nodeId, businessUnits);
        if (node) {
            node.isExpanded = !node.isExpanded;
            renderLeftSidebar();
        }
    };

    function renderLeftSidebar(query = '') {
        const container = document.getElementById('project-tree-root');
        if (!container) return;

        function nodeMatchesQuery(node, q) {
            if (node.name.toLowerCase().includes(q)) return true;
            if (node.children) {
                return node.children.some(child => nodeMatchesQuery(child, q));
            }
            return false;
        }

        function renderNode(node, level = 0, parentProjectId = null) {
            if (query && !nodeMatchesQuery(node, query)) return '';

            const hasChildren = node.children && node.children.length > 0;
            // If searching, force expand if children match
            const isExpanded = query ? true : !!node.isExpanded;
            const isSelected = activeEntity.id === node.id;
            const currentProjectId = node.type === 'project' ? node.id : parentProjectId;

            let html = window.SCenterComponents.renderNavigationTreeItem({
                level,
                type: node.type,
                id: node.id,
                title: node.name,
                isSelected,
                hasChildren,
                isExpanded,
                currentProjectId
            });

            if (hasChildren && isExpanded) {
                html += `<div class="tree-children">`;
                node.children.forEach(child => {
                    html += renderNode(child, level + 1, currentProjectId);
                });
                html += `</div>`;
            }

            html += window.SCenterComponents.renderNavigationTreeItemClose();
            return html;
        }

        let fullHtml = '';
        businessUnits.forEach(bu => {
            fullHtml += renderNode(bu, 0);
        });

        container.innerHTML = fullHtml;
        lucide.createIcons();
    }

    const treeSearchInput = document.querySelector('.left-search-box input');
    if (treeSearchInput) {
        treeSearchInput.addEventListener('input', (e) => {
            renderLeftSidebar(e.target.value.toLowerCase());
        });
    }

    // ======================================
    // PROJECT HEADER (compact)
    // ======================================
    function renderProjectHeader() {
        const container = document.getElementById('project-header-container');
        if (!container) return;

        let contextName = '';
        let attrs = null;

        if (activeEntity.type === 'bu') {
            contextName = activeEntity.data.name;
            attrs = { stage: "Многофункциональный", businessUnit: activeEntity.data.name, cluster: "N/A", region: "N/A", manager: "Центральный офис" };
        } else if (activeEntity.type === 'project') {
            contextName = activeEntity.data.name;
            attrs = activeEntity.data.headerAttributes;
        } else if (activeEntity.type === 'queue') {
            const project = findEntityById(activeEntity.projectId, businessUnits);
            contextName = `${project ? project.name : ''} / ${activeEntity.data.name}`;
            attrs = project ? project.headerAttributes : null;
        }

        if (!attrs) return;

        container.innerHTML = `
            <div class="project-summary-header">
                <img src="assets/images/building.jpg" alt="Фото ЖК" class="project-summary-image" onerror="this.style.display='none'">
                <div class="project-summary-content">
                    <div class="project-summary-title">${contextName}</div>
                    <div class="project-summary-meta">
                        <span><b class="project-summary-label">Стадия:</b> ${attrs.stage}</span>
                        <span><b class="project-summary-label">БЮ:</b> ${attrs.businessUnit}</span>
                        <span><b class="project-summary-label">Кластер:</b> ${attrs.cluster} / ${attrs.region}</span>
                        <span><b class="project-summary-label">РП:</b> ${attrs.manager}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Sidebar toggle functionality
    const collapseBtn = document.querySelector('.left-panel-collapse-btn');
    const leftPanel = document.getElementById('left-sidebar');
    if (collapseBtn && leftPanel) {
        collapseBtn.addEventListener('click', () => {
            leftPanel.classList.toggle('collapsed');
            const icon = collapseBtn.querySelector('i');
            if (leftPanel.classList.contains('collapsed')) {
                icon.setAttribute('data-lucide', 'chevron-right');
            } else {
                icon.setAttribute('data-lucide', 'chevron-left');
            }
            lucide.createIcons();
        });
    }

    // ======================================
    // EVENT FEED FILTER LOGIC & RENDER
    // ======================================
    let filterState = {
        activeTab: 'today',
        searchQuery: '',
        period: '',
        sources: [],
        priority: 'all',
        priorityOnly: false,
        metric: '',
        metrics: [],
        pinnedCount: 0
    };
    window.filterState = filterState; // Expose for Toolbar

    let draftFilters = { ...filterState };

    function hasActiveEventFilters() {
        const selectedMetricFilters = filterState.metrics && filterState.metrics.length > 0
            ? filterState.metrics
            : (filterState.metric ? [filterState.metric] : []);
        const activePriorityFilter = filterState.priority || (filterState.priorityOnly ? 'high' : 'all');
        return filterState.period !== ''
            || filterState.sources.length > 0
            || activePriorityFilter !== 'all'
            || selectedMetricFilters.length > 0
            || filterState.searchQuery !== '';
    }

    function syncDraftUI() {
        document.querySelectorAll('#inline-filter-block .f-chip[data-type="period"]').forEach(c => {
            if (c.getAttribute('data-val') === draftFilters.period) c.classList.add('active');
            else c.classList.remove('active');
        });
        document.querySelectorAll('#inline-filter-block .f-chip[data-type="source"]').forEach(c => {
            if (draftFilters.sources.includes(c.getAttribute('data-val'))) c.classList.add('active');
            else c.classList.remove('active');
        });
        const pToggle = document.getElementById('inline-filter-priority-toggle');
        if (pToggle) pToggle.checked = draftFilters.priority === 'high' || draftFilters.priorityOnly;
        
        const mSelect = document.getElementById('inline-filter-metric-select');
        if (mSelect) mSelect.value = draftFilters.metric;
    }

    function attachFilterListeners() {
        const tabToday = document.getElementById('tab-today');
        const tabAll = document.getElementById('tab-all');
        const searchInput = document.getElementById('event-search-input'); // This might be null now
        const toggleBtn = document.getElementById('filter-toggle-btn');
        
        const inlineFilterBlock = document.getElementById('inline-filter-block');
        const closeInlineFilterBtn = document.getElementById('close-inline-filter-btn');
        const applyBtn = document.getElementById('inline-btn-apply-filters');
        const resetBtn = document.getElementById('inline-btn-reset-filters');
        const cancelBtn = document.getElementById('inline-btn-cancel-filters');
        
        // Null checks for all elements to prevent crash when toolbar is active
        if (tabToday) {
            tabToday.addEventListener('click', () => {
                filterState.activeTab = 'today';
                tabToday.classList.add('active');
                if (tabAll) tabAll.classList.remove('active');
                if (toggleBtn) toggleBtn.style.display = 'none';
                renderEventFeed();
            });
        }

        if (tabAll) {
            tabAll.addEventListener('click', () => {
                filterState.activeTab = 'all';
                tabAll.classList.add('active');
                if (tabToday) tabToday.classList.remove('active');
                if (toggleBtn) toggleBtn.style.display = 'flex';
                renderEventFeed();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterState.searchQuery = e.target.value.toLowerCase();
                renderEventFeed();
            });
        }

        function openDrawer() {
            draftFilters = { ...filterState };
            syncDraftUI();
            if (inlineFilterBlock) inlineFilterBlock.classList.add('open');
        }

        function closeDrawer() {
            if (inlineFilterBlock) inlineFilterBlock.classList.remove('open');
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                if (inlineFilterBlock && inlineFilterBlock.classList.contains('open')) {
                    closeDrawer();
                } else {
                    openDrawer();
                }
            });
        }

        if (closeInlineFilterBtn) closeInlineFilterBtn.addEventListener('click', closeDrawer);
        if (cancelBtn) cancelBtn.addEventListener('click', closeDrawer);

        // Chip logic updates DRAFT only
        document.querySelectorAll('#inline-filter-block .f-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const type = chip.getAttribute('data-type');
                const val = chip.getAttribute('data-val');
                if (!type) return;

                if (type === 'period') {
                    if (draftFilters.period === val) draftFilters.period = '';
                    else draftFilters.period = val;
                } else if (type === 'source') {
                    if (draftFilters.sources.includes(val)) {
                        draftFilters.sources = draftFilters.sources.filter(s => s !== val);
                    } else {
                        draftFilters.sources.push(val);
                    }
                }
                syncDraftUI();
            });
        });

        const priorityToggle = document.getElementById('inline-filter-priority-toggle');
        if (priorityToggle) {
            priorityToggle.addEventListener('change', (e) => {
                draftFilters.priorityOnly = e.target.checked;
                draftFilters.priority = e.target.checked ? 'high' : 'all';
            });
        }

        const metricSelect = document.getElementById('inline-filter-metric-select');
        if (metricSelect) {
            metricSelect.addEventListener('change', (e) => {
                draftFilters.metric = e.target.value;
                draftFilters.metrics = e.target.value ? [e.target.value] : [];
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                filterState = { ...draftFilters, activeTab: filterState.activeTab, searchQuery: filterState.searchQuery };
                window.filterState = filterState; // Keep in sync
                renderEventFeed();
                closeDrawer();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                draftFilters.period = '';
                draftFilters.sources = [];
                draftFilters.priority = 'all';
                draftFilters.priorityOnly = false;
                draftFilters.metric = '';
                draftFilters.metrics = [];
                syncDraftUI();
            });
        }

        window.resetAppFilters = function() {
            filterState.period = '';
            filterState.sources = [];
            filterState.priority = 'all';
            filterState.priorityOnly = false;
            filterState.metric = '';
            filterState.metrics = [];
            filterState.searchQuery = '';
            filterState.activeTab = 'all'; // Чтобы показать ВСЕ события
            mockEvents.forEach(e => e.excluded = false);
            if (window.toolbarState) {
                window.toolbarState.excludedCount = 0;
            }
            refreshMetricsForCurrentContext();
            renderFinancialTree();
            
            if (typeof draftFilters !== 'undefined') draftFilters = { ...filterState };
            renderEventFeed();
            if (typeof syncDraftUI === 'function') syncDraftUI();
        };
    }

    // Call once to attach listeners
    attachFilterListeners();

    function renderEventFeed() {
        // Expose to window for toolbar
        window.renderEventFeed = renderEventFeed;
        const selectedMetricFilters = filterState.metrics && filterState.metrics.length > 0
            ? filterState.metrics
            : (filterState.metric ? [filterState.metric] : []);
        
        const filteredBase = mockEvents.filter(e => {
            // Поиск
            if (filterState.searchQuery) {
                const q = filterState.searchQuery;
                const matchText = (e.title && e.title.toLowerCase().includes(q)) || 
                                  (e.text && e.text.toLowerCase().includes(q)) ||
                                  (e.sourceName && e.sourceName.toLowerCase().includes(q)) ||
                                  (e.sourceId && e.sourceId.toLowerCase().includes(q));
                if (!matchText) return false;
            }

            // Приоритет
            const priorityFilter = filterState.priority || (filterState.priorityOnly ? 'high' : 'all');
            if (priorityFilter === 'high' && (e.priority !== 'high' && e.priority !== 'critical')) return false;
            if (priorityFilter === 'low' && e.priority !== 'low') return false;

            // Источники
            const eventSourceId = e.sourceId || e.sourceName;
            if (filterState.sources.length > 0 && !filterState.sources.includes(eventSourceId)) return false;

            // Метрика
            if (selectedMetricFilters.length > 0 && !selectedMetricFilters.includes(e.metricId)) return false;

            // NEW: Time Period Filter
            const todayStr = new Date().toISOString().split('T')[0];
            if (filterState.period === 'today') {
                const dt = e.dateText.toLowerCase();
                if (!dt.includes('сегодня') && !dt.startsWith(todayStr)) return false;
            } else if (filterState.period === 'week') {
                const text = e.dateText.toLowerCase();
                // Simple check for prototype: starts with today's month/year prefix
                const isRecent = text.includes('сегодня') || text.includes('вчера') || text.startsWith(todayStr.slice(0, 7)); 
                if (!isRecent) return false;
            }
            
            return true;
        });

        const todayStr = new Date().toISOString().split('T')[0];
        const todayFiltered = filteredBase.filter(e => {
            const dt = e.dateText.toLowerCase();
            return (dt.includes('сегодня') || dt.startsWith(todayStr)) && !e.excluded;
        });
        const allFiltered = filteredBase;
        const allVisibleFiltered = allFiltered.filter(e => !e.excluded);
        const pinnedFiltered = allFiltered.filter(e => e.pinned && !e.excluded);

        // Store counts for Toolbar access (excluding pinned for dynamic tabs)
        filterState.todayCount = todayFiltered.length;
        filterState.allCount = allVisibleFiltered.length;
        filterState.pinnedCount = pinnedFiltered.length;

        const hasFilters = hasActiveEventFilters();
        
        // Sync TopToolbar Mode (This triggers renderToolbar internally)
        if (window.setToolbarMode) {
            if (hasFilters) {
                window.setToolbarMode('filtered', allFiltered.length);
            } else {
                window.setToolbarMode('default');
            }
        } else if (typeof renderToolbar === 'function') {
            renderToolbar();
        }

        const badgeToday = document.getElementById('badge-today');
        const badgeAll = document.getElementById('badge-all');
        const badgePinned = document.getElementById('badge-pinned');
        const indicator = document.getElementById('filter-indicator');

        if (indicator) {
            indicator.style.display = hasFilters ? 'block' : 'none';
        }

        if (badgeToday) badgeToday.textContent = filterState.todayCount;
        if (badgeAll) badgeAll.textContent = filterState.allCount;
        if (badgePinned) badgePinned.textContent = filterState.pinnedCount;

        let displayEvents = [];
        if (filterState.activeTab === 'today') {
            displayEvents = todayFiltered;
        } else if (filterState.activeTab === 'all') {
            displayEvents = allVisibleFiltered;
        } else if (filterState.activeTab === 'pinned') {
            displayEvents = pinnedFiltered;
        }

        // Handle Empty State / Content rendering
        const resultsContainer = document.getElementById('event-feed-sections');
        if (!resultsContainer) return;

        if (filterState.activeTab === 'pinned' && displayEvents.length === 0) {
            resultsContainer.innerHTML = `
                <div class="pinned-empty-state">
                    <div class="empty-icon-circle">
                        <i data-lucide="pin"></i>
                    </div>
                    <div class="empty-title">Нет закреплённых событий</div>
                    <div class="empty-subtitle">Вы можете закрепить важные события через меню карточки, чтобы они всегда были под рукой.</div>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        // Restore accordion structure if missing (e.g. after empty state)
        if (!document.getElementById('top-events-container')) {
            resultsContainer.innerHTML = `
                <div class="accordion-section" id="top-events-section">
                    <button class="accordion-header" id="top-events-toggle" aria-expanded="true">
                        <div class="accordion-header-left" style="display:flex; align-items:center; gap:12px;">
                            <h3 class="accordion-title">Высокий приоритет</h3>
                            <span class="accordion-badge primary" id="top-events-count">0</span>
                        </div>
                        <i data-lucide="chevron-down" class="accordion-chevron open" id="top-chevron" style="color:#6B7280;"></i>
                    </button>
                    <div class="accordion-body open" id="top-events-body">
                        <div class="accordion-body-inner">
                            <div class="events-grid" id="top-events-container"></div>
                        </div>
                    </div>
                </div>
                <div class="accordion-section" id="other-events-section">
                    <button class="accordion-header" id="other-events-toggle" aria-expanded="false">
                        <div class="accordion-header-left" style="display:flex; align-items:center; gap:12px;">
                            <h3 class="accordion-title">Низкий приоритет</h3>
                            <span class="accordion-badge secondary" id="other-events-count">0</span>
                        </div>
                        <i data-lucide="chevron-down" class="accordion-chevron" id="other-chevron" style="color:#6B7280;"></i>
                    </button>
                    <div class="accordion-body" id="other-events-body">
                        <div class="accordion-body-inner">
                            <div class="events-grid" id="other-events-container"></div>
                        </div>
                    </div>
                </div>
            `;
            // Re-init accordions
            updateTopAccordion = initAccordion('top-events-toggle', 'top-events-body', 'top-chevron', true);
            updateOtherAccordion = initAccordion('other-events-toggle', 'other-events-body', 'other-chevron', true);
        }

        // NEW: Cards truly disappear from the DOM when excluded
        const visibleEvents = displayEvents.filter(evt => !evt.excluded); 
        const activeCount = visibleEvents.length;

        const highPriorityEvents = visibleEvents.filter(e => e.priority === 'high' || e.priority === 'critical');
        const lowPriorityEvents = visibleEvents.filter(e => e.priority !== 'high' && e.priority !== 'critical');

        // Toggle Filtered Mode Body Class
        if (window.toolbarState && window.toolbarState.mode === 'filtered') {
            document.body.classList.add('is-filtered');
        } else {
            document.body.classList.remove('is-filtered');
        }

        // Update counts
        document.getElementById('top-events-count').textContent = highPriorityEvents.length;
        document.getElementById('other-events-count').textContent = lowPriorityEvents.length;

        // Sync Toolbar Mode
        if (window.setToolbarMode) {
            window.setToolbarMode(hasFilters ? 'filtered' : 'default', activeCount);
        }

        // Update toolbarState with total excluded count for ActionBar
        if (window.toolbarState) {
            window.toolbarState.excludedCount = mockEvents.filter(e => e.excluded).length;
        }

        // Render sections
        const topContainer = document.getElementById('top-events-container');
        topContainer.innerHTML = highPriorityEvents.map(evt => renderEventCard(evt)).join('');

        const otherContainer = document.getElementById('other-events-container');
        otherContainer.innerHTML = lowPriorityEvents.map(evt => renderEventCard(evt)).join('');

        lucide.createIcons();
        attachEventCardListeners();

        // Recalculate accordion heights
        requestAnimationFrame(() => {
            if (typeof updateTopAccordion === 'function') updateTopAccordion();
            if (typeof updateOtherAccordion === 'function') updateOtherAccordion();
        });

        // Update Floating Action Bar
        if (window.updateFloatingBar) window.updateFloatingBar();
    }

    function renderEventCard(evt) {
        evt = appData.getEventListViewModel(evt, window.metricsData);
        return window.SCenterComponents.renderEventListCard(evt);
    }

    /**
     * Collects all currently active events for AI analysis.
     */
    window.getActiveEvents = function() {
        return mockEvents.filter(e => !e.excluded && e.visible !== false).map(e => ({
            id: e.id,
            title: e.title,
            text: e.text
        }));
    }

    window.togglePin = function(id, event) {
        if (event) event.stopPropagation();
        const evt = mockEvents.find(e => e.id === id);
        if (evt) {
            evt.pinned = !evt.pinned;
            if (window.filterState) {
                window.filterState.pinnedCount = mockEvents.filter(e => e.pinned && !e.excluded).length;
            }
            renderEventFeed();
        }
    }
    window.pinEvent = window.togglePin;

    window.toggleExclude = function(id, event) {
        if (event) event.stopPropagation();
        if (!hasActiveEventFilters()) return;
        const evt = mockEvents.find(e => e.id === id);
        if (evt) {
            evt.excluded = !evt.excluded;
            refreshMetricsForCurrentContext();
            renderFinancialTree();

            // Update global excludedCount
            if (window.toolbarState) {
                const count = mockEvents.filter(e => e.excluded).length;
                window.toolbarState.excludedCount = count;
            }
            
            // Re-render feed and toolbar to sync state
            if (window.renderToolbar) window.renderToolbar();
            renderEventFeed();
        }
    }

    // Сброс всех исключений при сбросе фильтров
    window.resetAppExclusions = function() {
        mockEvents.forEach(e => e.excluded = false);
        refreshMetricsForCurrentContext();
        
        // Сброс самих фильтров до базовых (Показать всё)
        if (window.resetAppFilters) window.resetAppFilters();
        
        if (window.toolbarState) {
            window.toolbarState.excludedCount = 0;
            window.toolbarState.isSelectionMode = false;
        }
        
        if (window.renderToolbar) window.renderToolbar();
        renderEventFeed();
    }

    // Восстановить все исключенные карточки БЕЗ сброса фильтров
    window.undoExclusions = function() {
        mockEvents.forEach(e => e.excluded = false);
        refreshMetricsForCurrentContext();
        if (window.toolbarState) {
            window.toolbarState.excludedCount = 0;
        }
        if (window.renderToolbar) window.renderToolbar();
        renderFinancialTree();
        renderEventFeed();
    }

    function attachEventCardListeners() {
        const allCards = document.querySelectorAll('.event-card');
        const alertDialogOverlay = document.getElementById('alert-dialog-overlay');
        const alertCancelBtn = document.getElementById('alert-cancel-btn');
        const alertConfirmBtn = document.getElementById('alert-confirm-btn');
        let currentDeleteId = null;

        // Click to open drawer
        allCards.forEach(card => {
            card.addEventListener('click', () => {
                const evtId = card.getAttribute('data-event-id');
                openEventDrawer(evtId);
            });
        });

        // Pin buttons
        document.querySelectorAll('.pin-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-event-id');
                const evt = mockEvents.find(ev => ev.id === id);
                if (evt) {
                    evt.pinned = !evt.pinned;
                    renderEventFeed();
                }
            });
        });

        // Trash buttons
        document.querySelectorAll('.trash-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentDeleteId = btn.getAttribute('data-event-id');
                if (alertDialogOverlay) alertDialogOverlay.classList.add('active');
            });
        });

        if (alertCancelBtn) {
            alertCancelBtn.onclick = function () {
                alertDialogOverlay.classList.remove('active');
                currentDeleteId = null;
            };
        }
        if (alertConfirmBtn) {
            alertConfirmBtn.onclick = function () {
                if (currentDeleteId) {
                    mockEvents = mockEvents.filter(e => e.id !== currentDeleteId);
                    renderEventFeed();
                }
                alertDialogOverlay.classList.remove('active');
                currentDeleteId = null;
            };
        }
    }

    // ======================================
    // ACCORDION CONTROLLER (both sections)
    // ======================================
    function initAccordion(toggleId, bodyId, chevronId, startOpen) {
        const toggle = document.getElementById(toggleId);
        const body = document.getElementById(bodyId);
        const chevron = document.getElementById(chevronId);
        if (!toggle || !body || !chevron) return;

        let isOpen = startOpen;

        // Set initial state
        function applyState(animate) {
            if (isOpen) {
                chevron.classList.add('open');
                body.classList.add('open');
                toggle.setAttribute('aria-expanded', 'true');
                // Need to measure the real scroll height after content renders
                requestAnimationFrame(() => {
                    body.style.maxHeight = body.scrollHeight + 'px';
                });
            } else {
                chevron.classList.remove('open');
                body.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                if (animate) {
                    // First set explicit max-height, then collapse
                    body.style.maxHeight = body.scrollHeight + 'px';
                    requestAnimationFrame(() => {
                        body.style.maxHeight = '0px';
                    });
                } else {
                    body.style.maxHeight = '0px';
                }
            }
        }

        applyState(false);

        toggle.addEventListener('click', () => {
            isOpen = !isOpen;
            applyState(true);
        });

        // Return an updater so we can recalculate after content changes
        return function updateHeight() {
            if (isOpen) {
                // Reset to auto to measure, then set explicit value
                body.style.maxHeight = 'none';
                requestAnimationFrame(() => {
                    const h = body.scrollHeight;
                    body.style.maxHeight = h + 'px';
                });
            }
        };
    }

    // Initialize both accordions (Moving up to ensure availability for renderEventFeed)
    var updateTopAccordion = initAccordion('top-events-toggle', 'top-events-body', 'top-chevron', true);
    var updateOtherAccordion = initAccordion('other-events-toggle', 'other-events-body', 'other-chevron', true);

    // ======================================
    // Task 5: EVENT DRAWER (Detail View)
    // ======================================
    // ======================================
    // Task 5: EVENT DRAWER (Detail View)
    // ======================================
    function renderEventDrawer(evt) {
        evt = appData.getEventDetailViewModel(evt, window.metricsData);
        const overlay = document.getElementById('event-drawer-overlay');
        const drawer = document.getElementById('event-drawer');
        const titleNode = document.getElementById('event-drawer-title');
        const drawerBody = document.getElementById('event-drawer-body');
        const drawerFooter = document.getElementById('event-drawer-footer');

        if (!evt || !drawer) return;

        // Update Header
        const priorityLabel = evt.priorityName || (evt.priority === 'high' ? 'Высокий' : 'Низкий');
        const priorityClass = evt.priority === 'high' || evt.priority === 'critical' ? 'high' : 'low';
        titleNode.innerHTML = `
            <div class="event-detail-hero">
                <img src="assets/images/event-detail-header.png" alt="" class="event-detail-hero-image">
                <div class="event-detail-priority-tag ${priorityClass}">
                    <i data-lucide="${priorityClass === 'high' ? 'arrow-up' : 'minus'}"></i>
                    <span>${priorityLabel}</span>
                </div>
            </div>
            <div class="event-detail-heading">
                <div class="drawer-header-title">${evt.listTitle || evt.title}</div>
                <div class="drawer-header-subtitle event-detail-source-line">
                    <span class="event-detail-meta-item">
                        <span class="drawer-header-project-label">Проект:</span>
                        <span class="drawer-header-project-value">${evt.projectName || 'Nova'}</span>
                    </span>
                    <span class="event-detail-meta-dot"></span>
                    <span class="event-detail-meta-item">
                        <span class="drawer-header-project-label">Источник:</span>
                        <span class="drawer-header-project-value">${evt.sourceName || 'S.Center'}</span>
                    </span>
                </div>
            </div>
        `;

        drawerBody.innerHTML = `
            <div class="drawer-section drawer-section-flush">
                <div class="drawer-grid-params">
                    <div class="param-row">
                        <div class="param-card">
                            <div class="param-card-info">
                                <div class="param-card-label">Время</div>
                                <div class="param-card-value">${evt.dateText || '10.12.2025  20:10'}</div>
                            </div>
                            <div class="param-card-icon"><i data-lucide="calendar"></i></div>
                        </div>
                        <div class="param-card">
                            <div class="param-card-info">
                                <div class="param-card-label">Очередь</div>
                                <div class="param-card-value">${evt.queue || '2 очередь'}</div>
                            </div>
                            <div class="param-card-icon"><i data-lucide="list-checks"></i></div>
                        </div>
                    </div>
                    <div class="param-row">
                        <div class="param-card">
                            <div class="param-card-info">
                                <div class="param-card-label">Тип объекта</div>
                                <div class="param-card-value">${evt.objectType || 'корпус'}</div>
                            </div>
                            <div class="param-card-icon"><i data-lucide="building"></i></div>
                        </div>
                        <div class="param-card">
                            <div class="param-card-info">
                                <div class="param-card-label">Объект</div>
                                <div class="param-card-value">${evt.objectName || 'АЛХ_1 оч_1 ж.д.'}</div>
                            </div>
                            <div class="param-card-icon"><i data-lucide="construction"></i></div>
                        </div>
                    </div>
                </div>
            </div>



            ${(evt.impactType === 'positive' || evt.impactType === 'negative') ? `
            <div class="card-content ${evt.impactType === 'negative' ? 'negative' : ''}" onclick="onMetricClick('${evt.metricId || 'NP_SAMOLET'}', '${evt.impactType}')">
                <div class="impact-card-top">
                    <div class="impact-card-icon-box">
                        <i data-lucide="bar-chart-3" style="width:24px;height:24px;"></i>
                    </div>
                    <div class="impact-card-info">
                        <div class="impact-card-title">${evt.metricName || 'Чистая прибыль Самолет'}</div>
                        <div class="impact-card-trend ${evt.impactType === 'negative' ? 'neg' : 'pos'}">
                            <i data-lucide="${evt.impactType === 'negative' ? 'trending-down' : 'trending-up'}" style="width:18px; height:18px;"></i>
                            <span>${evt.impact || '-15 000 000 ₽'}</span>
                        </div>
                    </div>
                </div>
                

                <div class="impact-card-expand">
                    <i data-lucide="maximize-2" style="width:16px;height:16px;"></i>
                </div>
            </div>
            ` : ''}

            <!-- Description Section -->
            <div class="drawer-card">
                <div class="drawer-card-title">Описание события</div>
                <div class="drawer-card-desc">
                    ${evt.text}
                    ${(() => {
                        const title = (evt.title || "").toLowerCase();
                        if (title.includes('затрат') || title.includes('бюджет') || title.includes('экономия') || title.includes('выручк')) {
                            return 'Мониторинг динамики затрат проводится в режиме реального времени. Система автоматически обновит прогноз финансового результата после подтверждения данных.';
                        } else if (title.includes('задержк') || title.includes('срок') || title.includes('этап') || title.includes('график')) {
                            return 'Процесс выполнения работ находится под контролем авторского надзора. Зафиксированные изменения будут отражены в актуализированном графике ГПР.';
                        } else if (title.includes('проверк') || title.includes('безопасн') || title.includes('контрол') || title.includes('compliance')) {
                            return 'Все протоколы безопасности были соблюдены в полном объеме. Данный инцидент не несет критических рисков для общего срока завершения этапа.';
                        } else {
                            return 'Аналитическое подразделение приступило к верификации предоставленной информации. Дополнительные детали будут доступны в следующем ежедневном отчете.';
                        }
                    })()}
                </div>
            </div>

            <!-- Action Rows -->
            <div class="action-row" onclick="event.stopPropagation()">
                <div class="action-row-left">
                    <div class="action-icon-box">
                        <i data-lucide="plus-circle"></i>
                    </div>
                    <span class="action-label">Создать задачу</span>
                </div>
                <i data-lucide="chevron-right" style="color:#ADB5BD; width:18px;height:18px;"></i>
            </div>

            <div class="action-row" onclick="event.stopPropagation()">
                <div class="action-row-left">
                    <div class="action-icon-box">
                        <i data-lucide="message-square"></i>
                    </div>
                    <span class="action-label">Запросить обоснование</span>
                </div>
                <i data-lucide="chevron-right" style="color:#ADB5BD; width:18px;height:18px;"></i>
            </div>
        `;

        // Footer Toolbar
        drawerFooter.innerHTML = `
            <button class="footer-btn" onclick="event.stopPropagation()">
                <i data-lucide="layers" style="width:16px;height:16px;"></i>
                Изменить приоритет
            </button>
            <button class="footer-btn ${evt.pinned ? 'active' : ''}" onclick="togglePin('${evt.id}', event)">
                <i data-lucide="pin" style="width:16px;height:16px;"></i>
                ${evt.pinned ? 'Открепить' : 'Закрепить'}
            </button>
            <button class="footer-btn delete" onclick="deleteFromDrawer('${evt.id}')">
                <i data-lucide="trash-2" style="width:18px;height:18px;"></i>
            </button>
        `;

        lucide.createIcons();
        if (overlay) overlay.classList.add('active');
        drawer.classList.add('open');
    }

    /**
     * Helper for Drawer Sparkline SVG
     */
    function renderDrawerSparkline(isNegative = true) {
        const color = isNegative ? '#F04B69' : '#37B24D';
        const gradId = `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`;
        
        // High-Fidelity Detailed Bezier Path with organic smoothing
        const buildPath = (points) => {
            let d = `M ${points[0].x} ${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
                const p1 = points[i - 1];
                const p2 = points[i];
                // Tighter control points (0.4 and 0.6) for non-periodic, broken but smooth curves
                const cpX1 = p1.x + (p2.x - p1.x) * 0.4;
                const cpX2 = p1.x + (p2.x - p1.x) * 0.6;
                d += ` C ${cpX1} ${p1.y}, ${cpX2} ${p2.y}, ${p2.x} ${p2.y}`;
            }
            return d;
        };

        // Stochastic Generator: Combines Base Trend, Flowing Volatility (Momentum), and Micro-Noise
        const generateStochasticPoints = (isNeg) => {
            const n = 22; // High density for complex micro-movements
            const pts = [];
            const startY = isNeg ? 30 : 160; 
            const targetY = isNeg ? 160 : 30; // Force end to show the trend direction
            
            let momentum = 0; // Medium frequency swing memory
            
            for (let i = 0; i < n; i++) {
                const t = i / (n - 1);
                const x = t * 500;
                
                // Base linear trend
                const idealY = startY + (targetY - startY) * t;
                
                if (i === 0) {
                    pts.push({ x, y: startY });
                    continue;
                }
                if (i === n - 1) {
                    pts.push({ x, y: targetY });
                    continue;
                }
                
                // Medium-frequency volatility (Brownian-like moving average)
                momentum = momentum * 0.6 + (Math.random() - 0.5) * 45;
                
                // High-frequency micro noise (jitter)
                const microNoise = (Math.random() - 0.5) * 12;
                
                // Envelope keeps edges anchored to the general trend
                const envelope = Math.sin(t * Math.PI);
                
                let y = idealY + (momentum + microNoise) * envelope;
                
                // Keep strictly inside bounds to prevent clipping
                y = Math.max(10, Math.min(170, y));
                pts.push({ x, y });
            }
            return pts;
        };

        const pathData = buildPath(generateStochasticPoints(isNegative));
            
        return `
            <svg viewBox="0 0 500 180" class="sparkline-svg" preserveAspectRatio="none" style="display: block; width: 100%; height: 100%;">
                <defs>
                    <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${color}" stop-opacity="0.3" />
                        <stop offset="100%" stop-color="${color}" stop-opacity="0" />
                    </linearGradient>
                </defs>
                <path d="${pathData} L 500 180 L 0 180 Z" fill="url(#${gradId})" />
                <path class="sparkline-path" d="${pathData}" stroke="${color}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `;
    }

    // Map old openEventDrawer to the new renderEventDrawer for internal calls
    function openEventDrawer(evtId) {
        const evt = mockEvents.find(e => e.id === evtId);
        if (evt) renderEventDrawer(evt);
    }

    const eventDrawerOverlay = document.getElementById('event-drawer-overlay');
    const closeEventDrawerBtn = document.getElementById('close-event-drawer-btn');

    function closeEventDrawer() {
        const overlay = document.getElementById('event-drawer-overlay');
        const drawer = document.getElementById('event-drawer');
        if (overlay) overlay.classList.remove('active');
        if (drawer) drawer.classList.remove('open');
        
        // Synchronized closing of the new BI-modal v2
        if (window.closeBIModal) {
            window.closeBIModal();
        }
    }

    if (closeEventDrawerBtn) closeEventDrawerBtn.addEventListener('click', closeEventDrawer);
    if (eventDrawerOverlay) eventDrawerOverlay.addEventListener('click', closeEventDrawer);

    window.deleteFromDrawer = function(id) {
        closeEventDrawer();
        const alertDialogOverlay = document.getElementById('alert-dialog-overlay');
        if (alertDialogOverlay) {
            alertDialogOverlay.classList.add('active');
            const confirmBtn = document.getElementById('alert-confirm-btn');
            confirmBtn.onclick = () => {
                toggleExclude(id);
                alertDialogOverlay.classList.remove('active');
            };
        }
    };


    // ======================================
    // RIGHT PANEL — Stage 4 High Fidelity
    // ======================================
    window.activeMetricId = 'NP_SAMOLET';

    // SVG Sparkline Generator
    function generateSparkline(data, color = '#3b82f6') {
        const width = 60;
        const height = 24;
        const padding = 2;
        const max = Math.max(...data, 1);
        const min = Math.min(...data, 0);
        const range = max - min || 1;
        
        const points = data.map((v, i) => {
            const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
            const y = height - ((v - min) / range) * (height - 2 * padding) - padding;
            return `${x},${y}`;
        }).join(' ');
        
        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
                <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `;
    }

    // Reactive Update: updateMetrics
    window.updateMetrics = function(impactValue, metricId) {
        refreshMetricsForCurrentContext();
        renderFinancialTree();
    };

    function getStatusInfo(node) {
        if (!node.plan || node.plan === 0) return { label: 'Нет данных', cls: 'neutral', icon: 'info' };
        const val = node.fact - node.plan;
        const pct = (val / Math.abs(node.plan) * 100).toFixed(1);
        const isExpense = node.budgetImpact === '-';
        const isGood = isExpense ? val <= 0 : val >= 0;
        const severity = Math.abs(pct);

        if (severity > 15 && !isGood) return { label: 'Критический риск', cls: 'danger', icon: 'alert-triangle' };
        if (severity > 5 && !isGood) return { label: 'Отклонение', cls: 'warning', icon: 'zap' };
        if (isGood) return { label: 'В норме', cls: 'success', icon: 'check-circle' };
        return { label: 'В допуске', cls: 'neutral', icon: 'circle' };
    }

    function findMetricWithParent(node, id, parent) {
        if (node.id === id) return { node, parent };
        if (node.children) {
            for (let child of node.children) {
                let found = findMetricWithParent(child, id, node);
                if (found) return found;
            }
        }
        return null;
    }

    function renderProjectStats() {
        const container = document.querySelector('.metrics-static-block');
        if (!container) return;
        const { renderConstructionMetricCard } = window.SCenterComponents;
        const durationChart = `
            <svg width="100%" height="100%" viewBox="0 0 60 80" fill="none" preserveAspectRatio="xMidYMid meet">
                <rect x="4" y="24" width="22" height="52" rx="4" fill="#E0EBFF" />
                <rect x="34" y="24" width="22" height="52" rx="4" fill="#6B96FF" />
                <rect x="34" y="8" width="22" height="14" rx="4" fill="#FF814A" />
            </svg>
        `;
        const volumeChart = `
            <svg width="100%" height="100%" viewBox="0 0 80 88" preserveAspectRatio="xMidYMid meet">
                <circle cx="40" cy="44" r="32" fill="none" stroke="#F1E3FF" stroke-width="10" />
                <path d="M 40,12 A 32,32 0 1,1 15,64" fill="none" stroke="#A855F7" stroke-width="10" stroke-linecap="round" />
            </svg>
        `;
        
        container.innerHTML = `
            <div class="fa-accordion-container open" id="construction-accordion">
                <button class="fa-accordion-header" onclick="toggleConstructionAccordion()">
                    <h3 class="fa-accordion-title">Строительные показатели</h3>
                    <i data-lucide="chevron-down" class="fa-accordion-chevron"></i>
                </button>
                <div class="fa-accordion-body">
                    <div class="fa-accordion-content">
                        ${renderConstructionMetricCard({
                            iconName: 'calendar',
                            title: 'Длительность проекта',
                            chartHtml: durationChart,
                            leftValue: '720',
                            leftLabel: 'ПЛАН (ДНЕЙ)',
                            leftColor: '#E0EBFF',
                            rightValueHtml: '742 <span class="fa-badge-deviation" style="background:#FF814A;">+22</span>',
                            rightLabel: 'ПРОГНОЗ',
                            rightColor: '#6B96FF'
                        })}
                        ${renderConstructionMetricCard({
                            iconName: 'package',
                            title: 'Объём проекта',
                            chartHtml: volumeChart,
                            leftValue: '5 000',
                            leftLabel: 'дней',
                            leftColor: '#F1E3FF',
                            rightValueHtml: '32 000 <span style="font-size: 14px; margin-left: 2px; color: #94A3B8; font-weight: 500;">м²</span>',
                            rightLabel: 'ОПП',
                            rightColor: '#A855F7'
                        })}
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    window.toggleConstructionAccordion = function() {
        const accordion = document.getElementById('construction-accordion');
        if (accordion) {
            accordion.classList.toggle('open');
        }
    };

    // Helper for large numbers
    function formatFullCurrency(value) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }

    function renderFinancialTree() {
        const container = document.querySelector('.metrics-financial-block');
        if (!container) return;

        const result = findMetricWithParent(window.metricsData, window.activeMetricId, null);
        if (!result) return;
        const active = result.node;
        const parent = result.parent;

        // Mocking much larger numbers to match the Figma visual "wow" factor
        const multiplier = 1000000;
        const displayFact = active.fact * multiplier;
        const displayDeltaBudget = (active.fact - active.plan) * multiplier;
        const deltaPrevMonthPct = active.deltaPrevMonth || 0;
        const isUp = active.fact >= active.plan;
        const { renderFinancialMetricSummaryCard, renderFinancialMetricChildCard } = window.SCenterComponents;

        // Navigation & Layout Wrapper
        container.innerHTML = `
            <div class="fa-pn-block">
                <div class="fa-section-wrapper">
                    <div class="fa-section-header-top" style="margin-left: 0; padding-left: 4px;">Финансовые показатели</div>
                    <div class="fa-nav-container">
                        <button class="fa-back-square" onclick="setActiveMetricId('${parent ? parent.id : metricsData.id}')" ${!parent || active.id === metricsData.id ? 'disabled style="opacity:0.3; cursor:default;"' : ''}>
                            <i data-lucide="chevron-left"></i>
                        </button>
                        <button class="fa-nav-title-btn" onclick="openTreeDrawer()">
                            <i data-lucide="network"></i>
                            <span>Структура метрик</span>
                        </button>
                    </div>

                    ${renderFinancialMetricSummaryCard({
                        metric: active,
                        displayFact,
                        displayDeltaBudget,
                        deltaPrevMonthPct,
                        isUp,
                        formatCurrency: formatFullCurrency
                    })}

                    <!-- Children List -->
                    <div id="fin-children-list">
                        ${active.children && active.children.length > 0 ? `
                            <div class="fa-child-list">
                                ${active.children.map((child, idx) => {
                                    const hasChildren = child.children && child.children.length > 0;
                                    const cIsUp = child.fact >= child.plan;
                                    const cDisplayFact = child.fact * multiplier;
                                    return renderFinancialMetricChildCard({
                                        metric: child,
                                        index: idx,
                                        displayFact: cDisplayFact,
                                        isUp: cIsUp,
                                        hasChildren,
                                        formatCurrency: formatFullCurrency
                                    });
                                }).join('')}
                            </div>
                        ` : `
                            <div class="fa-empty-state" style="padding: 20px 0;">
                                <i data-lucide="database" style="color:#CBD5E1; width:32px; height:32px; margin-bottom:8px;"></i>
                                <div style="color: #94A3B8; font-weight: 500;">Нижний уровень декомпозиции</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();
    }

    renderProjectStats();
    renderFinancialTree();
    
    window.setActiveMetricId = function(id) {
        window.activeMetricId = id;
        renderFinancialTree();
    };


    // openChartWidget — opens the chart modal for a specific metric
    // Bridge to new BI Modal v2.0
    window.openChartWidget = function(metricId, forceSideBySide = false) {
        const targetNode = findMetricById(metricsData, metricId);
        if (targetNode && window.openBIModalV2) {
            const isDrawerOpen = forceSideBySide || !!(document.querySelector('#metric-drawer.active') || document.querySelector('#event-drawer.open'));
            window.openBIModalV2(targetNode, isDrawerOpen);
        }
    };

    // Global metric click (used from Drawer inline button or other metric triggers)
    window.onMetricClick = function (metricId, forceSideBySide = false) {
        const targetNode = findMetricById(metricsData, metricId);
        if (targetNode && window.openBIModalV2) {
            const isDrawerOpen = forceSideBySide || !!(document.querySelector('#metric-drawer.active') || document.querySelector('#event-drawer.open'));
            window.openBIModalV2(targetNode, isDrawerOpen);
        }
    };

    // ======================================
    // RIGHT SIDEBAR — Drag to Resize
    // ======================================
    const rightSidebar = document.getElementById('right-sidebar');
    const resizer = document.getElementById('right-resizer');
    if (rightSidebar && resizer) {
        let isResizing = false;
        resizer.addEventListener('mousedown', () => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            resizer.classList.add('resizing');
        });
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = document.body.clientWidth - e.clientX;
            if (newWidth >= 300 && newWidth <= window.innerWidth * 0.45) {
                rightSidebar.style.width = newWidth + 'px';
            }
        });
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                resizer.classList.remove('resizing');
            }
        });
    }

    // ======================================
    // UTILITY: Find metric by ID
    // ======================================
    function findMetricById(node, id) {
        if (node.id === id) return node;
        if (node.children) {
            for (let child of node.children) {
                let found = findMetricById(child, id);
                if (found) return found;
            }
        }
        return null;
    }

    renderLeftSidebar();
    renderProjectHeader();
    renderEventFeed();
    renderProjectStats();
    renderFinancialTree();
});

