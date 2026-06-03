/**
 * ConstructionMetricCard renders one static construction metric card.
 * Naming intent: ConstructionMetric -> Card.
 */
(function (window) {
    const ui = window.SCenterUI;

    function renderConstructionMetricCard(params) {
        const { iconName, title, chartHtml, leftValue, leftLabel, leftColor, rightValueHtml, rightLabel, rightColor } = params;

        return `
            <div class="fa-metric-card">
                <div class="fa-metric-chart">
                    ${chartHtml}
                </div>
                <div class="fa-metric-info">
                    <div class="fa-metric-header">
                        ${ui.icon(iconName)}
                        <span>${ui.escapeHtml(title)}</span>
                    </div>
                    <div class="fa-metric-main">
                        <div class="fa-metric-col">
                            <div class="fa-metric-value">${ui.escapeHtml(leftValue)}</div>
                            <div class="fa-metric-label">
                                <span class="fa-dot" style="background:${ui.escapeAttr(leftColor)};"></span> ${ui.escapeHtml(leftLabel)}
                            </div>
                        </div>
                        <div class="fa-metric-divider"></div>
                        <div class="fa-metric-col">
                            <div class="fa-metric-value">${rightValueHtml}</div>
                            <div class="fa-metric-label">
                                <span class="fa-dot" style="background:${ui.escapeAttr(rightColor)};"></span> ${ui.escapeHtml(rightLabel)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    window.SCenterComponents = window.SCenterComponents || {};
    window.SCenterComponents.renderConstructionMetricCard = renderConstructionMetricCard;
})(window);
