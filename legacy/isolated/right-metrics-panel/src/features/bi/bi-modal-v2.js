/**
 * BI-Modal v2.0 Interactive Logic
 * Lead Frontend Engineer: Antigravity
 */

/**
 * Global state for the active chart data
 */
let biActiveData = [];

/**
 * Global state for the forecast toggle to persist across metric switches
 */
let biForecastActive = false;

/**
 * Generates unique, stochastic data for a specific metric node.
 * Ensures that positive and negative trends are visually distinct.
 */
function generateMetricChartData(node) {
    const months = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
    const currentMonthIdx = 7; // Current = AUG (0-indexed)
    
    // Seed randomization by node ID to keep chart consistent for same metric
    let seed = 0;
    if (node && node.id) {
        for (let i = 0; i < node.id.length; i++) seed += node.id.charCodeAt(i);
    }
    const seededRandom = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };

    // Determine base trend (is it improving or declining?)
    // If deltaPrevMonth is not specified, use index-based parity for mock variety
    const trendImproving = node && node.deltaPrevMonth !== undefined ? node.deltaPrevMonth >= 0 : seededRandom() > 0.5;
    
    // Starting baseline
    let val = trendImproving ? -50 : 50;
    let plan = 0;

    return months.map((m, i) => {
        const isForecast = i > currentMonthIdx;
        
        // Plan grows slightly linearly
        plan += (seededRandom() * 10 + 5);

        // Stochastic drift following the trend
        const drift = trendImproving ? (seededRandom() * 30 - 5) : (seededRandom() * 30 - 25);
        val += drift;

        return {
            m,
            v: Math.round(val),
            p: Math.round(plan),
            f: isForecast
        };
    });
}

function openBIModalV2(node, sideBySide = false) {
    const overlay = document.getElementById('bi-modal-overlay');
    const container = document.getElementById('bi-modal-v2-container');
    if (!overlay || !container) return;

    overlay.style.display = 'flex';
    overlay.classList.add('bi-modal-v2-overlay');
    
    // Toggle side-by-side mode (no backdrop, shifted positioning)
    if (sideBySide) {
        overlay.classList.add('side-by-side');
        overlay.classList.toggle('event-drawer-side-by-side', !!document.querySelector('#event-drawer.open'));
    } else {
        overlay.classList.remove('side-by-side');
        overlay.classList.remove('event-drawer-side-by-side');
    }
    
    overlay.classList.add('active');
    
    renderBIContent(container, node);
    setupBIInteractivity();
}

function closeBIModal() {
    const overlay = document.getElementById('bi-modal-overlay');
    const container = document.getElementById('bi-modal-v2-container');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('active');
        overlay.classList.remove('side-by-side');
        overlay.classList.remove('event-drawer-side-by-side');
    }
    if (container) container.innerHTML = '';
}

function renderBIContent(container, node) {
    const title = node ? node.name : 'Сроки реализации';
    
    // Generate fresh data for this node
    biActiveData = generateMetricChartData(node);

    container.innerHTML = `
        <div class="bi-modal-v2">
            <header class="bi-modal-header">
                <div class="bi-title-zone">
                    <div class="bi-title-row">
                        <h2>Динамика: ${title}</h2>
                    </div>
                    <div class="bi-legend">
                        <div class="bi-leg-item"><span class="bi-leg-dot bi-leg-plan"></span>План</div>
                        <div class="bi-leg-item"><span class="bi-leg-dot bi-leg-fact"></span>Факт</div>
                        <div class="bi-leg-item"><span class="bi-leg-dot bi-leg-forecast"></span>Прогноз</div>
                        <div class="bi-leg-item"><span class="bi-leg-box bi-leg-ahead"></span>Опережение</div>
                        <div class="bi-leg-item"><span class="bi-leg-box bi-leg-delay"></span>Отставание</div>
                    </div>
                </div>
                <div class="bi-header-actions">
                    <div class="bi-switch-wrap" id="bi-forecast-toggle">
                        <span>Прогноз</span>
                        <div class="bi-switch ${biForecastActive ? 'active' : ''}" id="bi-switch-ui"></div>
                    </div>
                    <button class="md-close" onclick="closeBIModal()">
                        <i data-lucide="x" style="width: 24px; height: 24px;"></i>
                    </button>
                </div>
            </header>

            <div class="bi-chart-stage" id="bi-chart-root">
                <div class="bi-column-highlight" id="bi-highlight"></div>
                <div class="bi-guideline" id="bi-guideline"></div>
                <div class="bi-point-marker" id="bi-marker"></div>
                <svg class="bi-svg-layer" viewBox="0 0 1000 500" preserveAspectRatio="none" id="bi-svg"></svg>
            </div>

            <div class="bi-table-zone"></div>
        </div>
    `;

    renderBITable();
    drawBISVG();
    if (window.lucide) window.lucide.createIcons();
}

function renderBITable() {
    const tableZone = document.querySelector('.bi-table-zone');
    if (!tableZone) return;
    
    const visibleData = biForecastActive ? biActiveData : biActiveData.filter(d => !d.f);
    const numCols = visibleData.length;

    tableZone.innerHTML = `
        <div class="bi-grid-row" style="display: grid; grid-template-columns: repeat(${numCols}, 1fr);">
            ${visibleData.map(d => `<div class="bi-cell bi-month-label">${d.m}</div>`).join('')}
        </div>
        <div class="bi-grid-row" style="display: grid; grid-template-columns: repeat(${numCols}, 1fr); border-top: 1px solid rgba(0,0,0,0.03);">
            ${visibleData.map(d => `<div class="bi-cell ${d.v >= 0 ? 'positive' : 'negative'}">${d.v > 0 ? '+' : ''}${d.v}</div>`).join('')}
        </div>
    `;
}

function drawBISVG() {
    const svg = document.getElementById('bi-svg');
    const visibleData = biForecastActive ? biActiveData : biActiveData.filter(d => !d.f);
    
    const width = 1000;
    const height = 500;
    const numCols = visibleData.length;
    const colWidth = width / numCols;

    const scaleY = (v) => height / 2 - (v * 1.5);

    let factPath = "";
    let forecastPath = "";
    let planPath = "";
    let barsHtml = "";

    // To connect paths, we need the last fact point
    let lastFactPoint = null;

    visibleData.forEach((d, i) => {
        const x = (i + 0.5) * colWidth;
        const fy = scaleY(d.v);
        const py = scaleY(d.p);

        // Plan Line (always dashed)
        if (i === 0) {
            planPath += `M ${x} ${py}`;
        } else {
            planPath += ` L ${x} ${py}`;
        }

        // Fact/Forecast Lines
        if (d.f) {
            if (!forecastPath && lastFactPoint) {
                // Start forecast from the last fact point
                forecastPath = `M ${lastFactPoint.x} ${lastFactPoint.y} L ${x} ${fy}`;
            } else if (forecastPath) {
                forecastPath += ` L ${x} ${fy}`;
            }
        } else {
            if (i === 0) {
                factPath = `M ${x} ${fy}`;
            } else {
                factPath += ` L ${x} ${fy}`;
            }
            lastFactPoint = { x, y: fy };
        }

        const isDelay = d.v < d.p;
        const barY = Math.min(fy, py);
        const barH = Math.max(0.1, Math.abs(fy - py));
        const colorBg = isDelay ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
        
        barsHtml += `<rect x="${x - colWidth * 0.25}" y="${barY}" width="${colWidth * 0.5}" height="${barH}" fill="${colorBg}" rx="4"/>`;
    });

    svg.innerHTML = `
        <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="#CBD5E1" stroke-width="1" />
        <path d="${planPath}" fill="none" stroke="#9CA3AF" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.5"/>
        ${barsHtml}
        <path d="${factPath}" fill="none" stroke="#007BFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        ${forecastPath ? `<path d="${forecastPath}" fill="none" stroke="#007BFF" stroke-width="3" stroke-dasharray="8 6" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    `;
}

function setupBIInteractivity() {
    const stage = document.getElementById('bi-chart-root');
    const guideline = document.getElementById('bi-guideline');
    const marker = document.getElementById('bi-marker');
    const switchUi = document.getElementById('bi-switch-ui');
    const toggle = document.getElementById('bi-forecast-toggle');
    const highlight = document.getElementById('bi-highlight');

    toggle.onclick = () => {
        biForecastActive = !biForecastActive;
        switchUi.classList.toggle('active', biForecastActive);
        renderBITable();
        drawBISVG();
        if (window.lucide) window.lucide.createIcons();
    };

    stage.onmousemove = (e) => {
        const rect = stage.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const totalWidth = rect.width;
        
        if (x < 0 || x > totalWidth) {
            guideline.style.display = 'none';
            marker.style.display = 'none';
            highlight.style.display = 'none';
            return;
        }

        // Dynamic columns based on visible data
        const visibleData = biForecastActive ? biActiveData : biActiveData.filter(d => !d.f);
        const numCols = visibleData.length;
        const colWidthReal = totalWidth / numCols;
        const monthIndex = Math.floor(x / colWidthReal);
        const data = visibleData[monthIndex];

        // Clear previous cell highlights
        document.querySelectorAll('.bi-cell.hovered').forEach(el => el.classList.remove('hovered'));

        if (data) {
            // Highlight table cells (skipping the label column at index 0)
            document.querySelectorAll('.bi-grid-row').forEach(row => {
                const cell = row.children[monthIndex];
                if (cell) cell.classList.add('hovered');
            });

            // Highlight position
            const colLeft = monthIndex * colWidthReal;
            highlight.style.display = 'block';
            highlight.style.left = colLeft + 'px';
            highlight.style.width = colWidthReal + 'px';

            // Align guideline with column center
            const centerX = (monthIndex + 0.5) * colWidthReal;
            guideline.style.display = 'block';
            guideline.style.left = centerX + 'px';
            
            const color = data.v >= 0 ? '#10B981' : '#EF4444';
            guideline.style.background = color;

            // Marker position sync
            marker.style.display = 'block';
            marker.style.left = centerX + 'px';
            
            // Map the value using the same logic as SVG (height 500, scale * 1.5)
            // But scale it to the real container height (rect.height)
            const h = rect.height;
            const yPos = (500 / 2 - (data.v * 1.5)) * (h / 500);
            marker.style.top = yPos + 'px'; 
            
            marker.style.background = color;
            marker.style.boxShadow = `0 0 15px ${color}`;
        }
    };

    stage.onmouseleave = () => {
        guideline.style.display = 'none';
        marker.style.display = 'none';
        highlight.style.display = 'none';
        document.querySelectorAll('.bi-cell.hovered').forEach(el => el.classList.remove('hovered'));
    };
}

window.openBIModalV2 = openBIModalV2;
window.closeBIModal = closeBIModal;
