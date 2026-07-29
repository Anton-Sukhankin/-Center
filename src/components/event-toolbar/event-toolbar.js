/**
 * S.Center EventToolbar Component
 * Native JS Implementation (ES6+)
 * Integrated with app.js state
 */

const toolbarState = {
    mode: 'default', // 'default' | 'filtered'
    filterCount: 0,
    isSelectionMode: false, // Legacy for internal logic if needed
    excludedCount: 0,
};
window.toolbarState = toolbarState;

/**
 * Switches the toolbar between 'default' and 'filtered' modes.
 * @param {string} mode - 'default' or 'filtered'
 * @param {number} count - Number of found events (required for 'filtered')
 */
function setToolbarMode(mode, count = 0) {
    toolbarState.mode = mode;
    toolbarState.filterCount = count;
    renderToolbar();
}
window.setToolbarMode = setToolbarMode;

function renderToolbar() {
    const container = document.getElementById('event-toolbar-root');
    if (!container) return;

    // Save focus and selection
    const searchInput = document.getElementById('toolbar-search-input');
    const isSearchFocused = searchInput === document.activeElement;
    const selectionStart = searchInput ? searchInput.selectionStart : 0;
    const selectionEnd = searchInput ? searchInput.selectionEnd : 0;

    const isFiltered = toolbarState.mode === 'filtered';
    const currentTab = (window.filterState && window.filterState.activeTab) || 'today';
    const isMetricsTab = currentTab === 'metrics';
    const searchQuery = (window.filterState && window.filterState.searchQuery) || '';

    container.innerHTML = `
        <div class="event-toolbar ${isFiltered ? 'is-filtered' : ''}">
            <!-- LEFT AREA: Segment Control (Always visible) -->
            <div class="toolbar-left">
                <div class="toolbar-segmented fade-in">
                    <button class="seg-tab ${currentTab === 'today' ? 'active' : ''}" onclick="updateAppTab('today')">
                        Сегодня 
                        <span class="tab-badge" id="badge-today">${window.filterState?.todayCount || 0}</span>
                    </button>
                    <button class="seg-tab ${currentTab === 'all' ? 'active' : ''}" onclick="updateAppTab('all')">
                        Все события 
                        <span class="tab-badge-oval" id="badge-all">${window.filterState?.allCount || 0}</span>
                    </button>
                    <button class="seg-tab ${currentTab === 'pinned' ? 'active' : ''}" onclick="updateAppTab('pinned')">
                        Закреплённые 
                        <span class="tab-badge" id="badge-pinned">${window.filterState?.pinnedCount || 0}</span>
                    </button>
                    <button class="seg-tab ${currentTab === 'metrics' ? 'active' : ''}" onclick="updateAppTab('metrics')">
                        Метрики
                    </button>
                </div>
            </div>

            <!-- CENTER AREA: Adaptive Search -->
            <div class="toolbar-center">
                ${!isMetricsTab ? `
                    <div class="toolbar-search">
                        <i data-lucide="search"></i>
                        <input type="text"
                               id="toolbar-search-input"
                               placeholder="Введите запрос"
                               value="${searchQuery}"
                               oninput="updateAppSearch(this.value)">
                    </div>
                ` : ''}
            </div>

            <!-- RIGHT AREA: Actions -->
            <div class="toolbar-right">
                ${!isMetricsTab ? `
                    <button class="btn-analytics" onclick="window.openGlobalAnalytics()">
                        <i data-lucide="sparkles"></i>
                        Аналитика
                    </button>
                ` : ''}
                
                ${currentTab === 'all' && !isMetricsTab ? `
                    <button class="btn-filter ${isFiltered ? 'active' : ''}" onclick="window.toggleAppFilter()">
                        <i data-lucide="sliders-horizontal"></i>
                        Фильтр
                        ${isFiltered ? '<span class="filter-indicator" id="filter-indicator"></span>' : ''}
                    </button>
                ` : ''}

                <button class="btn-ai-chat" id="open-scenter-ai-chat" onclick="window.scenterChat?.toggle?.()" aria-label="Открыть ассистента">
                    <i data-lucide="message-circle"></i>
                    Задать вопрос
                </button>
            </div>
        </div>
    `;

    // Restore focus
    if (isSearchFocused) {
        const newSearchInput = document.getElementById('toolbar-search-input');
        if (newSearchInput) {
            newSearchInput.focus();
            newSearchInput.setSelectionRange(selectionStart, selectionEnd);
        }
    }

    // Refresh Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Global functions for integration with app.js
 */
window.updateAppTab = function(tab) {
    if (window.filterState) {
        window.filterState.activeTab = tab;
        if (window.renderEventFeed) window.renderEventFeed();
    }
    renderToolbar();
}

window.updateAppSearch = function(val) {
    if (window.filterState) {
        window.filterState.searchQuery = val.toLowerCase();
        if (window.renderEventFeed) window.renderEventFeed();
    }
    // No full re-render here to keep focus smooth via oninput
}

window.toggleAppFilter = function() {
    if (window.openFilterDrawer) {
        window.openFilterDrawer();
    }
}

window.resetToolbarMode = function() {
    setToolbarMode('default');
    if (window.resetAppFilters) {
        window.resetAppFilters();
    }
}

window.openGlobalAnalytics = function() {
    if (window.triggerAIAnalysis) {
        window.triggerAIAnalysis();
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    window.renderToolbar = renderToolbar;
    renderToolbar();
});
