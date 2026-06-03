/**
 * Financial metric cards used in the right metrics panel.
 * Naming intent: FinancialMetric -> Summary/Child -> Card.
 */
(function (window) {
    const ui = window.SCenterUI;

    function renderFinancialMetricSummaryCard(params) {
        const {
            metric,
            displayFact,
            displayDeltaBudget,
            deltaPrevMonthPct,
            isUp,
            formatCurrency
        } = params;
        const deltaPrevMonthArc = Math.min((Math.abs(deltaPrevMonthPct) / 100) * 88, 88);

        return `
            <div class="fa-main-card fa-animate-card">
                <div class="fa-main-card-top">
                    <div class="fa-main-card-header">
                        <span class="fa-main-card-title">${ui.escapeHtml(metric.name)}</span>
                        <div class="fa-char-btn" onclick="event.stopPropagation(); window.openChartWidget('${ui.escapeAttr(metric.id)}')">
                            ${ui.icon('bar-chart-2')}
                        </div>
                    </div>
                    <div class="fa-main-val-row">
                        <div class="fa-trend-icon ${isUp ? 'up' : 'down'}">
                            ${ui.icon(isUp ? 'trending-up' : 'trending-down')}
                        </div>
                        <div class="fa-main-val-text">${ui.escapeHtml(formatCurrency(displayFact))}</div>
                    </div>
                </div>
                <div class="fa-split-section">
                    <div class="fa-split-col">
                        <span class="fa-split-label">Откл. от бюджета</span>
                        <span class="fa-split-val" style="color: #FF814A;">
                            ${displayDeltaBudget >= 0 ? '+' : ''}${ui.escapeHtml(formatCurrency(displayDeltaBudget))}
                        </span>
                    </div>
                    <div class="fa-split-divider"></div>
                    <div class="fa-split-col">
                        <div class="fa-split-right-wrapper">
                            <div class="fa-donut-mini">
                                <svg viewBox="0 0 36 36" width="100%" height="100%">
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" stroke-width="6"></circle>
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#FF814A" stroke-width="6"
                                        stroke-dasharray="${deltaPrevMonthArc} 88"
                                        transform="rotate(-90 18 18)" stroke-linecap="round"></circle>
                                </svg>
                            </div>
                            <div class="fa-split-info">
                                <span class="fa-split-label">От пред. месяца</span>
                                <span class="fa-split-val" style="color: #FF814A;">${deltaPrevMonthPct > 0 ? '+' : ''}${ui.escapeHtml(deltaPrevMonthPct)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderFinancialMetricChildCard(params) {
        const { metric, index, displayFact, isUp, hasChildren, formatCurrency } = params;

        return `
            <div class="fa-child-card fa-animate-card" style="animation-delay: ${index * 0.05}s" onclick="setActiveMetricId('${ui.escapeAttr(metric.id)}')">
                <div class="fa-folder-box">
                    ${ui.icon(hasChildren ? 'folder-plus' : 'folder')}
                </div>
                <div class="fa-child-body">
                    <span class="fa-child-label">${ui.escapeHtml(metric.name)}</span>
                    <div class="fa-child-val-row">
                        <div class="fa-trend-icon ${isUp ? 'up' : 'down'}" style="width:16px; height:16px;">
                            ${ui.icon(isUp ? 'trending-up' : 'trending-down', '', 'width:14px; height:14px;')}
                        </div>
                        <span class="fa-child-val-text">${ui.escapeHtml(formatCurrency(displayFact))}</span>
                    </div>
                </div>
                <div class="fa-char-btn" onclick="event.stopPropagation(); window.openChartWidget('${ui.escapeAttr(metric.id)}')">
                    ${ui.icon('bar-chart-2')}
                </div>
            </div>
        `;
    }

    window.SCenterComponents = window.SCenterComponents || {};
    window.SCenterComponents.renderFinancialMetricSummaryCard = renderFinancialMetricSummaryCard;
    window.SCenterComponents.renderFinancialMetricChildCard = renderFinancialMetricChildCard;
})(window);
