(function (window) {
    'use strict';

    const MONTHS = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
    const LAST_FACT_INDEX = 7;

    let activeMetric = null;
    let activeData = [];
    let forecastActive = false;
    let returnFocusTarget = null;
    let closeSideBySideTimer = null;

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function seededGenerator(seedValue) {
        let seed = 0;
        const value = String(seedValue || 'metric');
        for (let index = 0; index < value.length; index += 1) {
            seed = (seed + value.charCodeAt(index) * (index + 1)) % 233280;
        }
        return function next() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    function interpolate(start, end, progress) {
        return start + (end - start) * progress;
    }

    function generateMetricChartData(metric) {
        const random = seededGenerator(metric && metric.id);
        const planTarget = Number(metric && metric.plan) || 0;
        const factTarget = Number(metric && metric.fact) || 0;
        const forecastTarget = Number(metric && metric.forecast);
        const resolvedForecastTarget = Number.isFinite(forecastTarget) ? forecastTarget : factTarget;
        const magnitude = Math.max(Math.abs(planTarget), Math.abs(factTarget), Math.abs(resolvedForecastTarget), 1);
        const startValue = planTarget - magnitude * (0.18 + random() * 0.08);

        return MONTHS.map((month, index) => {
            const progress = index / (MONTHS.length - 1);
            const factProgress = Math.min(index / LAST_FACT_INDEX, 1);
            const forecastProgress = index <= LAST_FACT_INDEX
                ? factProgress
                : (index - LAST_FACT_INDEX) / (MONTHS.length - 1 - LAST_FACT_INDEX);
            const noise = (random() - 0.5) * magnitude * 0.08 * Math.sin(progress * Math.PI);
            const plan = interpolate(startValue, planTarget, progress);
            const fact = interpolate(startValue, factTarget, factProgress) + (index < LAST_FACT_INDEX ? noise : 0);
            const forecast = index <= LAST_FACT_INDEX
                ? fact
                : interpolate(factTarget, resolvedForecastTarget, forecastProgress) + noise * 0.45;

            return {
                month,
                plan,
                fact,
                forecast,
                isForecast: index > LAST_FACT_INDEX
            };
        });
    }

    function formatValue(value) {
        const numericValue = Number(value) || 0;
        const absolute = Math.abs(numericValue);
        const maximumFractionDigits = absolute < 10 ? 1 : 0;
        return new Intl.NumberFormat('ru-RU', {
            maximumFractionDigits,
            minimumFractionDigits: 0
        }).format(numericValue);
    }

    function getVisibleData() {
        return forecastActive ? activeData : activeData.filter(item => !item.isForecast);
    }

    function buildPath(points, xForIndex, yForValue) {
        return points.map((point, index) => {
            const command = index === 0 ? 'M' : 'L';
            return `${command} ${xForIndex(index)} ${yForValue(point)}`;
        }).join(' ');
    }

    function renderChart() {
        const svg = document.getElementById('metric-bi-svg');
        const table = document.getElementById('metric-bi-table');
        if (!svg || !table) return;

        const visibleData = getVisibleData();
        const width = 1000;
        const height = 420;
        const horizontalPadding = 28;
        const verticalPadding = 34;
        const values = visibleData.flatMap(item => [item.plan, item.isForecast ? item.forecast : item.fact]);
        let minimum = Math.min(...values);
        let maximum = Math.max(...values);
        if (minimum === maximum) {
            minimum -= 1;
            maximum += 1;
        }
        const rangePadding = (maximum - minimum) * 0.16;
        minimum -= rangePadding;
        maximum += rangePadding;

        const columnWidth = (width - horizontalPadding * 2) / visibleData.length;
        const xForIndex = index => horizontalPadding + columnWidth * (index + 0.5);
        const yForValue = value => verticalPadding + ((maximum - value) / (maximum - minimum)) * (height - verticalPadding * 2);
        const planPath = buildPath(visibleData.map(item => item.plan), xForIndex, yForValue);
        const factData = visibleData.filter(item => !item.isForecast);
        const factPath = buildPath(factData.map(item => item.fact), xForIndex, yForValue);

        let forecastPath = '';
        if (forecastActive && visibleData.length > factData.length) {
            const forecastPoints = [factData[factData.length - 1].fact]
                .concat(visibleData.filter(item => item.isForecast).map(item => item.forecast));
            const startIndex = factData.length - 1;
            forecastPath = buildPath(
                forecastPoints,
                index => xForIndex(startIndex + index),
                yForValue
            );
        }

        const comparisonBars = visibleData.map((item, index) => {
            const currentValue = item.isForecast ? item.forecast : item.fact;
            const planY = yForValue(item.plan);
            const currentY = yForValue(currentValue);
            const isAhead = currentValue >= item.plan;
            return `<rect x="${xForIndex(index) - columnWidth * 0.24}" y="${Math.min(planY, currentY)}" width="${columnWidth * 0.48}" height="${Math.max(1, Math.abs(currentY - planY))}" rx="5" fill="${isAhead ? 'rgba(16,185,129,.14)' : 'rgba(239,68,68,.14)'}"></rect>`;
        }).join('');

        const horizontalGrid = [0.2, 0.4, 0.6, 0.8].map(position => {
            const y = verticalPadding + (height - verticalPadding * 2) * position;
            return `<line x1="${horizontalPadding}" y1="${y}" x2="${width - horizontalPadding}" y2="${y}" stroke="#eef2f6" stroke-width="1"></line>`;
        }).join('');

        svg.innerHTML = `
            ${horizontalGrid}
            ${comparisonBars}
            <path d="${planPath}" fill="none" stroke="#9ca3af" stroke-width="2" stroke-dasharray="7 6" stroke-linecap="round"></path>
            <path d="${factPath}" fill="none" stroke="#0b6bff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
            ${forecastPath ? `<path d="${forecastPath}" fill="none" stroke="#0b6bff" stroke-width="4" stroke-dasharray="10 8" stroke-linecap="round" stroke-linejoin="round"></path>` : ''}
        `;

        table.innerHTML = `
            <div class="metric-bi-table-row metric-bi-month-row" style="grid-template-columns: repeat(${visibleData.length}, minmax(62px, 1fr));">
                ${visibleData.map(item => `<div class="metric-bi-cell">${item.month}</div>`).join('')}
            </div>
            <div class="metric-bi-table-row" style="grid-template-columns: repeat(${visibleData.length}, minmax(62px, 1fr));">
                ${visibleData.map(item => {
                    const value = item.isForecast ? item.forecast : item.fact;
                    const status = value >= item.plan ? 'is-ahead' : 'is-delay';
                    return `<div class="metric-bi-cell ${status}">${formatValue(value)}</div>`;
                }).join('')}
            </div>
        `;

        updateHoverGeometry();
    }

    function updateHoverGeometry() {
        const stage = document.getElementById('metric-bi-chart');
        if (!stage) return;

        stage.onmousemove = event => {
            const visibleData = getVisibleData();
            const rect = stage.getBoundingClientRect();
            const relativeX = Math.max(0, Math.min(rect.width - 1, event.clientX - rect.left));
            const columnWidth = rect.width / visibleData.length;
            const index = Math.min(visibleData.length - 1, Math.floor(relativeX / columnWidth));
            const item = visibleData[index];
            const highlight = document.getElementById('metric-bi-highlight');
            const tooltip = document.getElementById('metric-bi-tooltip');
            if (!highlight || !tooltip || !item) return;

            highlight.hidden = false;
            highlight.style.left = `${index * columnWidth}px`;
            highlight.style.width = `${columnWidth}px`;
            tooltip.hidden = false;
            tooltip.style.left = `${Math.min(rect.width - 172, Math.max(8, index * columnWidth + columnWidth / 2 - 82))}px`;
            tooltip.innerHTML = `
                <strong>${item.month}</strong>
                <span>План: ${formatValue(item.plan)}</span>
                <span>${item.isForecast ? 'Прогноз' : 'Факт'}: ${formatValue(item.isForecast ? item.forecast : item.fact)}</span>
            `;
            document.querySelectorAll('.metric-bi-cell.is-hovered').forEach(cell => cell.classList.remove('is-hovered'));
            document.querySelectorAll('.metric-bi-table-row').forEach(row => {
                if (row.children[index]) row.children[index].classList.add('is-hovered');
            });
        };

        stage.onmouseleave = clearHoverState;
    }

    function clearHoverState() {
        const highlight = document.getElementById('metric-bi-highlight');
        const tooltip = document.getElementById('metric-bi-tooltip');
        if (highlight) highlight.hidden = true;
        if (tooltip) tooltip.hidden = true;
        document.querySelectorAll('.metric-bi-cell.is-hovered').forEach(cell => cell.classList.remove('is-hovered'));
    }

    function renderModal(metric) {
        const container = document.getElementById('bi-modal-v2-container');
        if (!container) return false;

        container.innerHTML = `
            <section class="metric-bi-dialog" role="dialog" aria-modal="true" aria-labelledby="metric-bi-title" tabindex="-1">
                <header class="metric-bi-header">
                    <div class="metric-bi-title-zone">
                        <div>
                            <div class="metric-bi-eyebrow">Динамика показателя</div>
                            <h2 id="metric-bi-title">${escapeHtml(metric.name || 'Метрика')}</h2>
                        </div>
                        <div class="metric-bi-legend" aria-label="Легенда графика">
                            <span><i class="metric-bi-legend-mark is-plan"></i>План</span>
                            <span><i class="metric-bi-legend-mark is-fact"></i>Факт</span>
                            <span><i class="metric-bi-legend-mark is-forecast"></i>Прогноз</span>
                            <span><i class="metric-bi-legend-mark is-ahead"></i>Опережение</span>
                            <span><i class="metric-bi-legend-mark is-delay"></i>Отставание</span>
                        </div>
                    </div>
                    <div class="metric-bi-actions">
                        <button class="metric-bi-forecast-toggle" id="metric-bi-forecast-toggle" type="button" role="switch" aria-checked="${forecastActive}" aria-label="Показать прогноз">
                            <span>Прогноз</span>
                            <i class="metric-bi-switch" aria-hidden="true"></i>
                        </button>
                        <button class="metric-bi-close" id="metric-bi-close" type="button" aria-label="Закрыть график">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                </header>
                <div class="metric-bi-chart" id="metric-bi-chart">
                    <div class="metric-bi-highlight" id="metric-bi-highlight" hidden></div>
                    <div class="metric-bi-tooltip" id="metric-bi-tooltip" hidden></div>
                    <svg class="metric-bi-svg" id="metric-bi-svg" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-label="График динамики метрики"></svg>
                </div>
                <div class="metric-bi-table" id="metric-bi-table"></div>
                <footer class="metric-bi-footer">
                    Данные графика демонстрационные и относятся к выбранной метрике текущего проекта.
                </footer>
            </section>
        `;

        const toggle = document.getElementById('metric-bi-forecast-toggle');
        const closeButton = document.getElementById('metric-bi-close');
        toggle.addEventListener('click', () => {
            forecastActive = !forecastActive;
            toggle.setAttribute('aria-checked', String(forecastActive));
            renderChart();
        });
        closeButton.addEventListener('click', closeBIModal);
        renderChart();
        if (window.lucide) window.lucide.createIcons();
        closeButton.focus();
        return true;
    }

    function openBIModalV2(metric, sideBySide) {
        const overlay = document.getElementById('bi-modal-overlay');
        if (!overlay || !metric) return false;

        if (closeSideBySideTimer) {
            window.clearTimeout(closeSideBySideTimer);
            closeSideBySideTimer = null;
        }
        returnFocusTarget = document.activeElement;
        activeMetric = metric;
        activeData = generateMetricChartData(metric);
        overlay.classList.toggle('is-side-by-side', Boolean(sideBySide));
        overlay.classList.add('is-active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('metric-bi-open');
        return renderModal(metric);
    }

    function closeBIModal(options = {}) {
        const overlay = document.getElementById('bi-modal-overlay');
        const container = document.getElementById('bi-modal-v2-container');
        if (!overlay || !overlay.classList.contains('is-active')) return false;

        const wasSideBySide = overlay.classList.contains('is-side-by-side');
        overlay.classList.remove('is-active');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('metric-bi-open');
        if (container) container.innerHTML = '';
        activeMetric = null;
        activeData = [];
        if (!options.skipFocusRestore && returnFocusTarget && document.contains(returnFocusTarget)) returnFocusTarget.focus();
        returnFocusTarget = null;
        if (wasSideBySide) {
            closeSideBySideTimer = window.setTimeout(() => {
                overlay.classList.remove('is-side-by-side');
                closeSideBySideTimer = null;
            }, 220);
        } else {
            overlay.classList.remove('is-side-by-side');
        }
        return true;
    }

    function handleOverlayClick(event) {
        if (event.target.id === 'bi-modal-overlay') closeBIModal();
    }

    function handleKeydown(event) {
        const overlay = document.getElementById('bi-modal-overlay');
        if (event.key !== 'Escape' || !overlay || !overlay.classList.contains('is-active')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        closeBIModal();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const overlay = document.getElementById('bi-modal-overlay');
        if (overlay) overlay.addEventListener('click', handleOverlayClick);
    });
    document.addEventListener('keydown', handleKeydown, true);

    window.openBIModalV2 = openBIModalV2;
    window.closeBIModal = closeBIModal;
    window.SCenterBI = {
        open: openBIModalV2,
        close: closeBIModal,
        isOpen: () => Boolean(document.getElementById('bi-modal-overlay')?.classList.contains('is-active')),
        getActiveMetric: () => activeMetric
    };
})(window);
