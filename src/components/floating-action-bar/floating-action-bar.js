/**
 * S.Center SelectionActionBar Component
 * Displays bulk actions for filtered events
 */
function renderFloatingBar() {
    const root = document.getElementById('floating-bar-root');
    if (!root) return;

    const isFiltered = window.toolbarState && window.toolbarState.mode === 'filtered';
    
    // Calculate current count (total minus excluded)
    // Pulling from live DOM elements updated in app.js
    const topCount = parseInt(document.getElementById('top-events-count')?.textContent || '0');
    const otherCount = parseInt(document.getElementById('other-events-count')?.textContent || '0');
    const activeCount = topCount + otherCount;

    if (!isFiltered) {
        root.classList.remove('active');
        return;
    }

    root.classList.add('active');
    root.innerHTML = `
        <div class="selection-action-bar">
            <div class="fab-indication">
                <span>Результат:</span>
                <span class="fab-badge-oval">${activeCount}</span>
            </div>
            
            <div class="fab-btn-wrap">
                <button class="fbtn-outline" onclick="alert('Задачи созданы для всех выбранных событий (${activeCount})')">
                    <i data-lucide="plus"></i>
                    Создать задачу
                </button>
            </div>

            <div class="fab-exit-wrap">
                <button class="fbtn-close" onclick="window.exitSelectionMode()" title="Закрыть фильтры и выйти">
                    <i data-lucide="x"></i>
                </button>
            </div>
        </div>
    `;

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Full exit from the filtered/selection mode
 * Resets ALL systems: manual exclusions, drawer settings, and toolbar state.
 */
window.exitSelectionMode = function() {
    // 1. Reset manual exclusions (the 'crossed out' events)
    if (window.undoExclusions) {
        window.undoExclusions();
    }
    
    // 2. Reset Filter Drawer state (sources, priorities, metrics)
    if (window.resetAllFilters) {
        window.resetAllFilters();
    }

    // 3. Revert Toolbar and global filter state to default
    if (window.resetToolbarMode) {
        window.resetToolbarMode();
    }

    // 4. Update the Bar visibility itself (will hide it as mode is no longer 'filtered')
    renderFloatingBar();
};

// Global hook for app.js and toolbar.js updates
window.updateFloatingBar = renderFloatingBar;

document.addEventListener('DOMContentLoaded', () => {
    if (window.toolbarState) {
        renderFloatingBar();
    }
});
