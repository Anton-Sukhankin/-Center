document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // ======================================
    // DATA
    // ======================================

    const appData = window.appData;
    const ui = window.SCenterUI;
    if (!appData) {
        throw new Error('Data layer is not loaded. Check src/data/app-data.js before src/app/app.js.');
    }
    if (!ui) {
        throw new Error('UI helper layer is not loaded. Check src/ui/ui-core.js before src/app/app.js.');
    }

    const projectStructureData = window.projectStructureData;
    if (!projectStructureData) {
        throw new Error('Project structure layer is not loaded. Check src/data/project-structure.js before src/app/app.js.');
    }

    const taskData = window.taskData;
    const taskFeature = window.SCenterTasks;
    if (!taskData || !taskFeature || typeof taskFeature.createController !== 'function') {
        throw new Error('Task feature is not loaded. Check src/data/task-data.js and src/features/tasks/task-drawer.js before src/app/app.js.');
    }

    const metricsDashboardData = window.metricsDashboardData;
    const metricsDashboardFeature = window.SCenterMetricsDashboard;
    if (!metricsDashboardData || !metricsDashboardFeature) {
        throw new Error('Metrics dashboard is not loaded. Check metrics-dashboard data and feature before src/app/app.js.');
    }

    const digitalChessboardFeature = window.SCenterDigitalChessboard;
    if (!window.digitalChessboardData || !digitalChessboardFeature) {
        throw new Error('Digital chessboard is not loaded. Check its data and feature scripts before src/app/app.js.');
    }

    const digitalChessboardSummaryFeature = window.SCenterDigitalChessboardSummary;
    if (!window.digitalChessboardSummaryData || !digitalChessboardSummaryFeature) {
        throw new Error('Digital chessboard summary is not loaded. Check its data and feature scripts before src/app/app.js.');
    }

    const objectsFeature = window.SCenterObjects;
    if (!window.objectsData || !objectsFeature) {
        throw new Error('Objects feature is not loaded. Check its data and feature scripts before src/app/app.js.');
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
    window.metricsDashboardViewModel = metricsDashboardData.getDashboardForContext(activeContext, mockEvents);
    window.activeMetricId = window.metricsData.id;

    function getEventById(eventId) {
        return mockEvents.find(event => event.id === eventId) || null;
    }

    function closeTaskConflictingPanels() {
        ['closeBIModal', 'closeMetricDrawer', 'closeFilterDrawer', 'closeAIDrawer'].forEach(methodName => {
            if (typeof window[methodName] === 'function') window[methodName]();
        });
        if (window.aiInsights && typeof window.aiInsights.closeModal === 'function') {
            window.aiInsights.closeModal();
        }
    }

    const taskController = taskFeature.createController({
        taskData,
        getEventById,
        renderEventDrawer,
        renderEventFeed,
        closeConflictingPanels: closeTaskConflictingPanels,
        refreshIcons: () => {
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    });
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

    function refreshMetricsDashboardForCurrentContext() {
        window.metricsDashboardViewModel = metricsDashboardData.getDashboardForContext(activeContext, mockEvents);
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
    }

    function randomizeDataForContext() {
        mockEventsTemplate = appData.getEventsForContext(activeContext);
        mockEvents = appData.clone(mockEventsTemplate);
        refreshMetricsForCurrentContext();
        refreshMetricsDashboardForCurrentContext();
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
        digitalChessboardSummaryFeature.setContext(activeContext);
        digitalChessboardFeature.setContext(activeContext);
        objectsFeature.setContext(activeContext);
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
        const setCollapseButtonIcon = (isCollapsed) => {
            const iconName = isCollapsed ? 'chevron-right' : 'chevron-left';
            collapseBtn.innerHTML = `<i data-lucide="${iconName}"></i>`;
            collapseBtn.setAttribute('aria-label', isCollapsed ? 'Развернуть левую панель' : 'Свернуть левую панель');
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        };

        setCollapseButtonIcon(leftPanel.classList.contains('collapsed'));

        collapseBtn.addEventListener('click', () => {
            leftPanel.classList.toggle('collapsed');
            setCollapseButtonIcon(leftPanel.classList.contains('collapsed'));
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
        priorityView: 'high',
        metric: '',
        metrics: [],
        pinnedCount: 0
    };
    window.filterState = filterState; // Expose for Toolbar

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

    window.resetAppFilters = function() {
        filterState.period = '';
        filterState.sources = [];
        filterState.priority = 'all';
        filterState.priorityOnly = false;
        filterState.metric = '';
        filterState.metrics = [];
        filterState.searchQuery = '';
        filterState.activeTab = 'all';
        mockEvents.forEach(e => e.excluded = false);
        if (window.toolbarState) {
            window.toolbarState.excludedCount = 0;
        }
        refreshMetricsForCurrentContext();
        renderEventFeed();
    };

    window.setEventPriorityView = function(priorityView) {
        if (priorityView !== 'high' && priorityView !== 'low') return;
        filterState.priorityView = priorityView;
        renderEventFeed();
    };

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
        const priorityContainer = document.getElementById('priority-events-container');
        const priorityTabsBar = document.querySelector('.priority-tabs-bar');
        if (!resultsContainer || !priorityContainer) return;

        const isMetricsTab = filterState.activeTab === 'metrics';

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

        const activePriorityView = filterState.priorityView === 'low' ? 'low' : 'high';
        const activePriorityEvents = activePriorityView === 'high' ? highPriorityEvents : lowPriorityEvents;

        // Update counts and tab state
        const topEventsCount = document.getElementById('top-events-count');
        const otherEventsCount = document.getElementById('other-events-count');
        if (topEventsCount) topEventsCount.textContent = highPriorityEvents.length;
        if (otherEventsCount) otherEventsCount.textContent = lowPriorityEvents.length;

        const highTab = document.getElementById('priority-tab-high');
        const lowTab = document.getElementById('priority-tab-low');
        if (highTab) {
            highTab.classList.toggle('active', activePriorityView === 'high');
            highTab.setAttribute('aria-selected', activePriorityView === 'high' ? 'true' : 'false');
        }
        if (lowTab) {
            lowTab.classList.toggle('active', activePriorityView === 'low');
            lowTab.setAttribute('aria-selected', activePriorityView === 'low' ? 'true' : 'false');
        }

        if (priorityTabsBar) {
            priorityTabsBar.classList.toggle('is-hidden', isMetricsTab);
        }

        // Sync Toolbar Mode
        if (window.setToolbarMode) {
            window.setToolbarMode(hasFilters ? 'filtered' : 'default', activeCount);
        }

        // Update toolbarState with total excluded count for ActionBar
        if (window.toolbarState) {
            window.toolbarState.excludedCount = mockEvents.filter(e => e.excluded).length;
        }

        // Render active priority tab
        const isPinnedEmptyState = filterState.activeTab === 'pinned' && displayEvents.length === 0;
        priorityContainer.classList.toggle('is-empty-state', isPinnedEmptyState || isMetricsTab);

        if (isMetricsTab) {
            priorityContainer.classList.add('is-metrics-dashboard');
            metricsDashboardFeature.render(priorityContainer, {
                context: activeContext,
                viewModel: window.metricsDashboardViewModel
            });
        } else if (isPinnedEmptyState) {
            priorityContainer.classList.remove('is-metrics-dashboard');
            priorityContainer.innerHTML = `
                <div class="pinned-empty-state">
                    <div class="empty-icon-circle">
                        <i data-lucide="pin"></i>
                    </div>
                    <div class="empty-title">Нет закреплённых событий</div>
                    <div class="empty-subtitle">Вы можете закрепить важные события через меню карточки, чтобы они всегда были под рукой.</div>
                </div>
            `;
        } else {
            priorityContainer.classList.remove('is-metrics-dashboard');
            priorityContainer.innerHTML = activePriorityEvents.length > 0
                ? activePriorityEvents.map(evt => renderEventCard(evt)).join('')
                : `<div class="priority-empty-state">В выбранном приоритете нет событий.</div>`;
        }

        lucide.createIcons();
        // Update Floating Action Bar
        if (window.updateFloatingBar) window.updateFloatingBar();
    }

    function renderEventCard(evt) {
        evt = appData.getEventListViewModel(evt, window.metricsData);
        return window.SCenterComponents.renderEventListCard({
            ...evt,
            linkedTaskCount: taskController.getTaskCountForEvent(evt.id)
        });
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
        renderEventFeed();
    }

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
        const eventDescriptionHtml = ui.renderInlineText(evt.detailText || evt.text || '', { preserveLineBreaks: true });
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
            <button class="card-content metric-impact-trigger ${evt.impactType === 'negative' ? 'negative' : ''}"
                    type="button"
                    onclick="onMetricClick('${evt.metricId || 'NP_SAMOLET'}')"
                    aria-label="Открыть график связанной метрики">
                <div class="impact-card-top">
                    <div class="impact-card-icon-box">
                        <i data-lucide="bar-chart-3" style="width:24px;height:24px;"></i>
                    </div>
                    <div class="impact-card-info">
                        <div class="impact-card-title">${evt.metricName || 'Чистая прибыль Самолет'}</div>
                        <div class="impact-card-description">Влияние на метрику</div>
                    </div>
                </div>
                

                <div class="impact-card-expand">
                    <i data-lucide="maximize-2" style="width:16px;height:16px;"></i>
                </div>
            </button>
            ` : ''}

            <!-- Description Section -->
            <div class="drawer-card event-description-card">
                <div class="drawer-card-title">Описание события</div>
                <div class="drawer-card-desc event-description-content" id="event-description-content">
                    ${eventDescriptionHtml}
                </div>
                <button class="event-description-toggle"
                        id="event-description-toggle"
                        type="button"
                        onclick="toggleEventDescription(event)"
                        aria-expanded="false"
                        aria-controls="event-description-content">
                    <span>Дополнительно</span>
                    <span class="event-description-toggle-icon" aria-hidden="true">
                        <i data-lucide="chevron-down" style="width:16px;height:16px;"></i>
                    </span>
                </button>
            </div>

            ${taskController.renderLinkedTaskCards(evt)}

        `;

        // Footer Toolbar
        drawerFooter.innerHTML = `
            <button class="footer-btn footer-btn-icon ${evt.pinned ? 'active' : ''}"
                    onclick="togglePin('${evt.id}', event)"
                    title="${evt.pinned ? 'Открепить' : 'Закрепить'}"
                    aria-label="${evt.pinned ? 'Открепить событие' : 'Закрепить событие'}">
                <i data-lucide="pin" style="width:16px;height:16px;"></i>
            </button>
            <button class="footer-btn footer-btn-priority" onclick="event.stopPropagation()">
                <i data-lucide="layers" style="width:16px;height:16px;"></i>
                Изменить приоритет
            </button>
            <span class="drawer-footer-spacer" aria-hidden="true"></span>
            <button class="footer-btn footer-btn-primary" type="button" data-task-action="create-task" data-task-create-entry="footer">
                <i data-lucide="clipboard-plus" style="width:16px;height:16px;"></i>
                Создать задачу
            </button>
            <button class="footer-btn delete" onclick="deleteFromDrawer('${evt.id}')">
                <i data-lucide="trash-2" style="width:18px;height:18px;"></i>
            </button>
        `;

        if (overlay) overlay.classList.add('active');
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        taskController.enterEventDetail(evt);
        syncEventDescriptionToggle();
        lucide.createIcons();
    }

    function setEventDescriptionToggleIcon(toggle, iconName) {
        const iconSlot = toggle?.querySelector('.event-description-toggle-icon');
        if (!iconSlot) return;
        iconSlot.innerHTML = `<i data-lucide="${iconName}" style="width:16px;height:16px;"></i>`;
    }

    function syncEventDescriptionToggle() {
        const card = document.querySelector('.event-description-card');
        const content = document.getElementById('event-description-content');
        const toggle = document.getElementById('event-description-toggle');
        if (!card || !content || !toggle) return;

        card.classList.remove('is-collapsible', 'is-expanded');
        toggle.setAttribute('aria-expanded', 'false');
        setEventDescriptionToggleIcon(toggle, 'chevron-down');

        if (card.scrollHeight > 350) {
            card.classList.add('is-collapsible');
        }
    }

    window.toggleEventDescription = function(event) {
        if (event) event.stopPropagation();
        const card = document.querySelector('.event-description-card');
        const toggle = document.getElementById('event-description-toggle');
        if (!card || !toggle) return;

        const isExpanded = card.classList.toggle('is-expanded');
        toggle.setAttribute('aria-expanded', String(isExpanded));
        setEventDescriptionToggleIcon(toggle, isExpanded ? 'chevron-up' : 'chevron-down');
        lucide.createIcons();
    };

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

    // Compact event cards use this documented global integration point.
    window.openEventDrawer = openEventDrawer;

    const eventDrawerOverlay = document.getElementById('event-drawer-overlay');
    const closeEventDrawerBtn = document.getElementById('close-event-drawer-btn');

    function closeEventDrawer(options = {}) {
        if (!options.force && taskController.handleCloseRequest()) return;

        if (typeof window.closeBIModal === 'function') {
            window.closeBIModal({ skipFocusRestore: true });
        }
        const overlay = document.getElementById('event-drawer-overlay');
        const drawer = document.getElementById('event-drawer');
        if (overlay) overlay.classList.remove('active');
        if (drawer) {
            drawer.classList.remove('open');
            drawer.setAttribute('aria-hidden', 'true');
        }
        taskController.reset();
    }

    if (closeEventDrawerBtn) closeEventDrawerBtn.addEventListener('click', closeEventDrawer);
    if (eventDrawerOverlay) eventDrawerOverlay.addEventListener('click', closeEventDrawer);
    const alertCancelBtn = document.getElementById('alert-cancel-btn');
    if (alertCancelBtn) {
        alertCancelBtn.addEventListener('click', () => {
            document.getElementById('alert-dialog-overlay')?.classList.remove('active');
        });
    }
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        const drawer = document.getElementById('event-drawer');
        if (!drawer?.classList.contains('open')) return;
        event.preventDefault();
        closeEventDrawer();
    });

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
    // METRICS INTEGRATION — active BI bridge and isolated-panel shims
    // ======================================
    // The right metrics panel and metric tree remain isolated. The BI graph is
    // active again as an independent feature opened from an event detail card.
    window.updateMetrics = function() {
        refreshMetricsForCurrentContext();
    };

    window.setActiveMetricId = function(id) {
        if (findMetricById(window.metricsData, id)) {
            window.activeMetricId = id;
            return true;
        }
        return false;
    };

    window.openTreeDrawer = function() {
        return false;
    };

    window.openChartWidget = function(metricId, forceSideBySide = false) {
        const targetNode = findMetricById(window.metricsData, metricId);
        if (!targetNode || typeof window.openBIModalV2 !== 'function') return false;

        window.setActiveMetricId(metricId);
        const isEventDrawerOpen = Boolean(document.querySelector('#event-drawer.open'));
        return window.openBIModalV2(targetNode, forceSideBySide || isEventDrawerOpen);
    };

    window.onMetricClick = function(metricId, forceSideBySide = true) {
        return window.openChartWidget(metricId, forceSideBySide);
    };

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

    const dashboardView = document.getElementById('dashboard-view') || document.querySelector('.content-area');
    const digitalChessboardSummaryView = document.getElementById('digital-chessboard-summary-view');
    const digitalChessboardSummaryRoot = document.getElementById('digital-chessboard-summary-root');
    const digitalChessboardView = document.getElementById('digital-chessboard-view');
    const digitalChessboardRoot = document.getElementById('digital-chessboard-root');
    const objectsView = document.getElementById('objects-view');
    const objectsRoot = document.getElementById('objects-root');
    const dashboardNav = document.getElementById('nav-dashboard');
    const digitalChessboardNav = document.getElementById('nav-digital-chessboard');
    const digitalViewSwitcher = document.getElementById('digital-view-switcher');
    const digitalSectionMenu = document.getElementById('digital-section-menu');
    const digitalSectionItems = Array.from(digitalSectionMenu?.querySelectorAll('[data-main-view]') || []);
    const mainViews = new Set(['dashboard', 'digital-chessboard-summary', 'digital-chessboard', 'objects']);
    let activeMainView = 'dashboard';

    function collectProjectOptions(nodes) {
        const projects = [];
        (nodes || []).forEach((node) => {
            if (node.type === 'project') {
                projects.push({
                    id: node.id,
                    name: node.name,
                    subtitle: [node.headerAttributes?.region, node.headerAttributes?.cluster].filter(Boolean).join(' · ')
                });
            }
            if (Array.isArray(node.children)) projects.push(...collectProjectOptions(node.children));
        });
        return projects;
    }

    function getSummarySelectableProjects(summaryContext) {
        if (summaryContext?.type === 'bu') {
            const businessUnit = findEntityById(summaryContext.id, businessUnits);
            return collectProjectOptions(businessUnit ? [businessUnit] : []);
        }
        return collectProjectOptions(businessUnits);
    }

    function selectSummaryProject(projectId) {
        const project = findEntityById(projectId, businessUnits);
        if (!project || project.type !== 'project') return false;
        window.setActiveEntity('project', project.id, project.id, project);
        return true;
    }

    function setDigitalSectionMenuOpen(isOpen, options = {}) {
        if (!digitalSectionMenu || !digitalChessboardNav) return;
        digitalSectionMenu.hidden = !isOpen;
        digitalChessboardNav.setAttribute('aria-expanded', String(isOpen));

        if (isOpen && options.focus) {
            const activeItem = digitalSectionItems.find((item) => item.dataset.mainView === activeMainView);
            const target = options.focus === 'last'
                ? digitalSectionItems[digitalSectionItems.length - 1]
                : activeItem || digitalSectionItems[0];
            target?.focus();
        } else if (!isOpen && options.restoreFocus) {
            digitalChessboardNav.focus();
        }
    }

    function syncMainViewNavigation() {
        const dashboardIsActive = activeMainView === 'dashboard';
        const digitalSectionIsActive = !dashboardIsActive;
        dashboardNav?.classList.toggle('active', dashboardIsActive);
        digitalChessboardNav?.classList.toggle('active', digitalSectionIsActive);
        dashboardNav?.setAttribute('aria-current', dashboardIsActive ? 'page' : 'false');
        digitalChessboardNav?.setAttribute('aria-current', digitalSectionIsActive ? 'page' : 'false');
        digitalSectionItems.forEach((item) => {
            const isActive = item.dataset.mainView === activeMainView;
            item.classList.toggle('is-active', isActive);
            item.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }

    function setMainView(nextView) {
        if (!mainViews.has(nextView)) return false;
        activeMainView = nextView;
        const dashboardIsActive = activeMainView === 'dashboard';
        const summaryIsActive = activeMainView === 'digital-chessboard-summary';
        const chessboardIsActive = activeMainView === 'digital-chessboard';
        const objectsIsActive = activeMainView === 'objects';

        if (dashboardView) dashboardView.hidden = !dashboardIsActive;
        if (digitalChessboardSummaryView) digitalChessboardSummaryView.hidden = !summaryIsActive;
        if (digitalChessboardView) digitalChessboardView.hidden = !chessboardIsActive;
        if (objectsView) objectsView.hidden = !objectsIsActive;
        syncMainViewNavigation();
        setDigitalSectionMenuOpen(false);

        if (summaryIsActive || chessboardIsActive || objectsIsActive) {
            closeTaskConflictingPanels();
            closeEventDrawer({ force: true });
        }

        if (summaryIsActive) {
            digitalChessboardSummaryFeature.setContext(activeContext);
            digitalChessboardSummaryFeature.show();
        } else {
            digitalChessboardSummaryFeature.hide();
        }

        if (chessboardIsActive) {
            digitalChessboardFeature.setContext(activeContext);
            digitalChessboardFeature.show();
        } else {
            digitalChessboardFeature.hide();
        }

        if (objectsIsActive) {
            objectsFeature.setContext(activeContext);
            objectsFeature.show();
        } else {
            objectsFeature.hide();
        }

        return true;
    }

    dashboardNav?.addEventListener('click', (event) => {
        event.preventDefault();
        setMainView('dashboard');
    });
    digitalChessboardNav?.addEventListener('click', (event) => {
        event.preventDefault();
        const shouldOpen = digitalSectionMenu?.hidden !== false;
        if (shouldOpen) {
            closeTaskConflictingPanels();
            closeEventDrawer({ force: true });
        }
        setDigitalSectionMenuOpen(shouldOpen);
    });
    digitalChessboardNav?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && digitalSectionMenu?.hidden === false) {
            event.preventDefault();
            setDigitalSectionMenuOpen(false, { restoreFocus: true });
            return;
        }
        if (event.key === 'Tab' && digitalSectionMenu?.hidden === false) {
            setDigitalSectionMenuOpen(false);
            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        closeTaskConflictingPanels();
        closeEventDrawer({ force: true });
        setDigitalSectionMenuOpen(true, { focus: event.key === 'ArrowUp' ? 'last' : 'active' });
    });
    digitalSectionItems.forEach((item) => {
        item.addEventListener('click', () => {
            if (setMainView(item.dataset.mainView)) digitalChessboardNav?.focus();
        });
    });
    digitalSectionMenu?.addEventListener('keydown', (event) => {
        const currentIndex = digitalSectionItems.indexOf(document.activeElement);
        let targetIndex = null;
        if (event.key === 'ArrowDown') targetIndex = (Math.max(currentIndex, -1) + 1) % digitalSectionItems.length;
        if (event.key === 'ArrowUp') targetIndex = (currentIndex <= 0 ? digitalSectionItems.length : currentIndex) - 1;
        if (event.key === 'Home') targetIndex = 0;
        if (event.key === 'End') targetIndex = digitalSectionItems.length - 1;
        if (targetIndex !== null && digitalSectionItems.length) {
            event.preventDefault();
            digitalSectionItems[targetIndex]?.focus();
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            setDigitalSectionMenuOpen(false, { restoreFocus: true });
        }
        if (event.key === 'Tab') setDigitalSectionMenuOpen(false);
    });
    document.addEventListener('click', (event) => {
        if (!digitalViewSwitcher?.contains(event.target)) setDigitalSectionMenuOpen(false);
    });

    digitalChessboardSummaryFeature.mount(digitalChessboardSummaryRoot, {
        context: activeContext,
        getSelectableProjects: getSummarySelectableProjects,
        onProjectSelect: selectSummaryProject
    });
    digitalChessboardSummaryFeature.hide();
    digitalChessboardFeature.mount(digitalChessboardRoot, { context: activeContext });
    digitalChessboardFeature.hide();
    objectsFeature.mount(objectsRoot, { context: activeContext });
    objectsFeature.hide();
    syncMainViewNavigation();

    renderLeftSidebar();
    renderProjectHeader();
    renderEventFeed();
});

