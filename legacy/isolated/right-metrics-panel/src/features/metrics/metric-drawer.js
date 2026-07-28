/**
 * MetricStructureDrawer — High-Fidelity Tree Navigation
 * Uses global window.metricsData and window.activeMetricId from app.js
 */

function initMetricDrawer() {
    console.log("DEBUG: Metric Drawer v2 Loaded - No Bells, Buttons Enabled");
    if (document.getElementById('metric-drawer-overlay')) return;

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'metric-drawer-overlay';
    overlay.className = 'metric-drawer-overlay';
    overlay.onclick = closeMetricDrawer;

    // Panel
    const drawer = document.createElement('div');
    drawer.id = 'metric-drawer';
    drawer.className = 'metric-drawer';
    
    drawer.innerHTML = `
        <header class="md-header">
            <div class="md-header-left">
                <div class="md-header-icon">
                    <i data-lucide="network"></i>
                </div>
                <div class="md-title-box">
                    <h2>Структура метрик</h2>
                    <div class="md-subtitle">Событий: <span>3 321</span></div>
                </div>
            </div>
            <button class="md-close" onclick="closeMetricDrawer()">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </header>

        <section class="md-content" id="md-tree-container">
            <!-- Tree rendered here -->
        </section>

        <div class="md-footer-divider"></div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
}

/**
 * Recursive Tree Rendering
 */
function renderMetricTree() {
    const container = document.getElementById('md-tree-container');
    if (!container) return;

    const metrics = window.metricsData;
    if (!metrics) {
        container.innerHTML = '<div style="padding:20px; color:#6C717C;">Данные не загружены</div>';
        return;
    }

    container.innerHTML = `<ul class="md-tree-root">${renderMdNode(metrics, 0, true)}</ul>`;
    if (window.lucide) window.lucide.createIcons();
}

function renderMdNode(node, level, isLast = false) {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = window.activeMetricId === node.id;
    
    // UI Logic for trends and notifications (mocked for visual fidelity)
    const hasTrend = node.deltaPrevMonth !== undefined || level < 3;
    const isUp = (node.deltaPrevMonth !== undefined) ? node.deltaPrevMonth >= 0 : level % 2 === 0;
    const trendType = isUp ? 'up' : 'down';

    return `
        <li class="md-tree-item ${isLast ? 'is-last' : ''}" data-level="${level}">
            <div class="md-node-row ${isSelected ? 'active-selection' : ''}" onclick="selectAndCloseMetric('${node.id}')">
                <div class="md-node-content">
                    <div class="md-node-prefix">
                        ${hasChildren ? `
                            <i data-lucide="${isSelected || level < 2 ? 'folder-open' : 'folder'}" class="md-folder-icon"></i>
                        ` : `
                            <i data-lucide="file-text" class="md-file-icon"></i>
                        `}
                    </div>
                    <span class="md-node-label">${node.name}</span>
                </div>
                <div class="md-node-actions">
                    ${hasTrend ? `
                        <button class="md-trend ${trendType}" onclick="openChartFromStructure(event, '${node.id}')">
                            <i data-lucide="trending-${trendType}"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            ${hasChildren ? `
                <ul class="md-tree-children">
                    ${node.children.map((child, idx) => renderMdNode(child, level + 1, idx === node.children.length - 1)).join('')}
                </ul>
            ` : ''}
        </li>
    `;
}

window.openTreeDrawer = function() {
    initMetricDrawer();
    renderMetricTree(); 
    
    setTimeout(() => {
        const overlay = document.getElementById('metric-drawer-overlay');
        const drawer = document.getElementById('metric-drawer');
        if (overlay) overlay.classList.add('active');
        if (drawer) drawer.classList.add('active');
    }, 10);
};

window.closeMetricDrawer = function() {
    const overlay = document.getElementById('metric-drawer-overlay');
    const drawer = document.getElementById('metric-drawer');
    
    if (overlay) overlay.classList.remove('active');
    if (drawer) drawer.classList.remove('active');
    
    // Also close the new BI-modal v2
    if (window.closeBIModal) {
        window.closeBIModal();
    }
};

/**
 * Original selection logic — just highlights and updates state.
 * No longer opens the chart automatically.
 */
window.selectMetricInStructure = function(id) {
    if (window.setActiveMetricId) {
        window.setActiveMetricId(id);
    }
    renderMetricTree();
};

/**
 * Click on name: Highlight and close drawer.
 */
window.selectAndCloseMetric = function(id) {
    selectMetricInStructure(id);
    closeMetricDrawer();
};

/**
 * Click on button: Open chart modal side-by-side.
 */
window.openChartFromStructure = function(event, id) {
    if (event) event.stopPropagation();
    
    // Highlight the metric being charted
    selectMetricInStructure(id);

    // Open the chart UI on the left
    const chartOverlay = document.getElementById('chart-modal-overlay');
    if (chartOverlay) {
        chartOverlay.classList.add('side-left');
    }
    
    if (window.openChartWidget) {
        window.openChartWidget(id, true);
    }
};
