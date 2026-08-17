/**
 * Native procurement section for MetricsDashboard.
 * Owns only local filtering and the risk detail dialog.
 */
const SCenterProcurementMetricsSection = (function () {
    const ui = window.SCenterUI;
    const state = {
        container: null,
        data: null,
        contextKey: '',
        selectedRiskId: null,
        returnFocusRiskId: null
    };

    function toneClass(tone) {
        return tone === 'danger' ? 'is-danger' : (tone === 'success' ? 'is-success' : 'is-neutral');
    }

    function renderSectionTitle(title, note, tone = 'neutral') {
        return `
            <div class="procurement-section-title ${toneClass(tone)}">
                <div>
                    <h2>${ui.escapeHtml(title)}</h2>
                    <p>${ui.escapeHtml(note)}</p>
                </div>
            </div>
        `;
    }

    function renderSummaryCard(item) {
        return `
            <article
                class="procurement-summary-card ${toneClass(item.tone)}"
                aria-label="${ui.escapeAttr(`${item.sourceLabel}: ${item.value}`)}"
                title="${ui.escapeAttr(item.sourceLabel)}">
                <div class="procurement-summary-card-main">
                    <span class="procurement-summary-icon" aria-hidden="true">${ui.icon(item.icon)}</span>
                    <div class="procurement-summary-copy">
                        <p>${ui.escapeHtml(item.label)}</p>
                        <strong>${ui.escapeHtml(item.value)}</strong>
                    </div>
                </div>
                <div class="procurement-summary-card-note" title="${ui.escapeAttr(item.note)}">${ui.escapeHtml(item.note)}</div>
            </article>
        `;
    }

    function renderSummary(data) {
        return `
            <section class="procurement-summary-grid" aria-label="Ключевые показатели закупок">
                ${data.summary.map(renderSummaryCard).join('')}
            </section>
        `;
    }

    function renderBudgetStructure(contracting) {
        const aria = `${contracting.contractedShareLabel}: ${contracting.contractedShare}%; ${contracting.openTendersLabel}: ${contracting.openTenders}, ${contracting.openTendersShare}%; ${contracting.remainingBudgetLabel}: ${contracting.remainingBudget}, ${contracting.remainingShare}%`;
        return `
            <article class="procurement-budget-structure">
                <canvas
                    class="procurement-donut"
                    width="116"
                    height="116"
                    role="img"
                    aria-label="${ui.escapeAttr(aria)}"
                    data-procurement-donut
                    data-contracted-share="${contracting.contractedShare}"
                    data-open-share="${contracting.openTendersShare}"
                    data-remaining-share="${contracting.remainingShare}"></canvas>
                <div class="procurement-budget-legend">
                    <h3>Состояние бюджета</h3>
                    <dl>
                        <div><dt aria-label="${ui.escapeAttr(contracting.contractedBudgetLabel)}" title="${ui.escapeAttr(contracting.contractedBudgetLabel)}"><i class="is-blue"></i>Договоры</dt><dd>${contracting.contractedBudget}</dd></div>
                        <div><dt aria-label="${ui.escapeAttr(contracting.openTendersLabel)}" title="${ui.escapeAttr(contracting.openTendersLabel)}"><i class="is-violet"></i>Тендеры</dt><dd>${contracting.openTenders}</dd></div>
                        <div><dt aria-label="${ui.escapeAttr(contracting.remainingBudgetLabel)}" title="${ui.escapeAttr(contracting.remainingBudgetLabel)}"><i class="is-gray"></i>Остаток</dt><dd>${contracting.remainingBudget}</dd></div>
                    </dl>
                </div>
            </article>
        `;
    }

    function renderLinearMetric(item) {
        return `
            <article class="procurement-linear-card is-${ui.escapeAttr(item.accent)}">
                <div class="procurement-linear-card-heading">
                    <div>
                        <p>${ui.escapeHtml(item.label)}</p>
                        <strong>${ui.escapeHtml(item.value)}</strong>
                    </div>
                    <span aria-label="${ui.escapeAttr(`${item.shareLabel}: ${item.share}%`)}" title="${ui.escapeAttr(item.shareLabel)}">${item.share}%</span>
                </div>
                <div class="procurement-progress" role="img" aria-label="${ui.escapeAttr(`${item.shareLabel}: ${item.share}%`)}">
                    <i style="width:${item.share}%"></i>
                </div>
                <small>из бюджета ${ui.escapeHtml(item.budget)}</small>
            </article>
        `;
    }

    function renderContracting(data) {
        const contracting = data.contracting;
        return `
            <section class="procurement-panel procurement-contracting" aria-labelledby="procurement-contracting-title">
                <div id="procurement-contracting-title">
                    ${renderSectionTitle('Контрактация бюджета', 'Бюджет закупок и покрытие действующими договорами')}
                </div>
                <div class="procurement-contracting-matrix">
                    <div class="procurement-total-budget" role="group" aria-label="${ui.escapeAttr(contracting.totalBudgetLabel)}">
                        <article class="procurement-total-budget-summary">
                            <p class="procurement-eyebrow">Общий бюджет закупок</p>
                            <strong>${contracting.totalBudget}</strong>
                        </article>
                        <div class="procurement-budget-part" aria-label="${ui.escapeAttr(`${contracting.worksBudgetLabel}: ${contracting.worksBudget}`)}">
                            <span>Работы</span>
                            <strong>${contracting.worksBudget}</strong>
                        </div>
                        <div class="procurement-budget-part" aria-label="${ui.escapeAttr(`${contracting.materialsBudgetLabel}: ${contracting.materialsBudget}`)}">
                            <span>Материалы</span>
                            <strong>${contracting.materialsBudget}</strong>
                        </div>
                    </div>
                    ${renderBudgetStructure(contracting)}
                    ${renderLinearMetric(contracting.works)}
                    ${renderLinearMetric(contracting.materials)}
                </div>
            </section>
        `;
    }

    function renderDriverComparison(title, sourceTitle, items) {
        const max = Math.max(...items.flatMap(item => [item.budget, item.contract]));
        return `
            <article class="procurement-driver-card">
                <div class="procurement-driver-heading">
                    <h3 aria-label="${ui.escapeAttr(sourceTitle)}" title="${ui.escapeAttr(sourceTitle)}">${ui.escapeHtml(title)}</h3>
                </div>
                <div class="procurement-driver-chart">
                    ${items.map(item => {
                        const overrun = item.contract > item.budget;
                        const budgetHeight = Math.max(36, Math.round((item.budget / max) * 130));
                        const contractHeight = Math.max(36, Math.round((item.contract / max) * 130));
                        const aria = `${item.name}: бюджет ${item.budget} млн рублей, договор ${item.contract} млн рублей, отклонение ${item.delta}`;
                        return `
                            <div class="procurement-driver-item" role="img" aria-label="${ui.escapeAttr(aria)}">
                                <div class="procurement-driver-bars">
                                    <i class="is-budget" style="height:${budgetHeight}px"></i>
                                    <i class="is-contract ${overrun ? 'is-overrun' : 'is-saving'}" style="height:${contractHeight}px"></i>
                                </div>
                                <span title="${ui.escapeAttr(item.name)}">${ui.escapeHtml(item.name)}</span>
                                <strong class="${overrun ? 'is-overrun' : 'is-saving'}">${ui.escapeHtml(item.delta)}</strong>
                                <small>${ui.escapeHtml(item.percent)}</small>
                            </div>
                        `;
                    }).join('')}
                </div>
            </article>
        `;
    }

    function renderFinancialEffect(data) {
        const effect = data.financialEffect;
        return `
            <section class="procurement-panel procurement-financial" aria-labelledby="procurement-financial-title">
                <div class="procurement-financial-heading">
                    <div id="procurement-financial-title">
                        ${renderSectionTitle('Финансовый эффект закупок', effect.deviationLabel, 'danger')}
                    </div>
                    <div class="procurement-financial-summary">
                        <div
                            class="procurement-financial-value"
                            aria-label="${ui.escapeAttr(`${effect.absoluteEffectLabel}: ${effect.absoluteEffect}; ${effect.deviationLabel}: ${effect.deviationPercent}`)}"
                            title="${ui.escapeAttr(effect.absoluteEffectLabel)}">
                            <strong>${ui.escapeHtml(effect.absoluteEffect)} <small>↑ ${ui.escapeHtml(effect.deviationPercent)}</small></strong>
                        </div>
                        <div class="procurement-financial-legend" aria-label="Легенда графиков">
                            <span><i class="is-budget" aria-hidden="true"></i>Бюджет</span>
                            <span><i class="is-contract" aria-hidden="true"></i>Договор</span>
                        </div>
                    </div>
                </div>
                <div class="procurement-driver-matrix">
                    ${renderDriverComparison('Наибольшие превышения · работы', effect.worksLabel, effect.works)}
                    ${renderDriverComparison('Наибольшие превышения · материалы', effect.materialsLabel, effect.materials)}
                </div>
            </section>
        `;
    }

    function renderEfficiency(data) {
        return `
            <section class="procurement-panel procurement-efficiency" aria-labelledby="procurement-efficiency-title">
                <div id="procurement-efficiency-title">
                    ${renderSectionTitle('Эффективность закупочного процесса', 'Фактические показатели относительно демонстрационных норм')}
                </div>
                <div class="procurement-efficiency-matrix">
                    ${data.efficiency.map(item => `
                        <article class="procurement-efficiency-cell ${item.positive ? 'is-positive' : 'is-negative'}">
                            <div class="procurement-efficiency-main">
                                <div class="procurement-efficiency-heading">
                                    <p>${ui.escapeHtml(item.label)}</p>
                                </div>
                                <strong>${ui.escapeHtml(item.value)}</strong>
                            </div>
                            <div class="procurement-efficiency-note">
                                <span>Норма ${ui.escapeHtml(item.norm)} · ${ui.escapeHtml(item.delta)}</span>
                                <em>${ui.escapeHtml(item.status)}</em>
                            </div>
                        </article>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderStatus(status) {
        const icon = status === 'Контроль' ? 'circle-check' : 'triangle-alert';
        const statusId = status === 'Критично' ? 'critical' : (status === 'Внимание' ? 'attention' : 'control');
        return `<span class="procurement-risk-status is-${statusId}">${ui.icon(icon)}${ui.escapeHtml(status)}</span>`;
    }

    function renderRiskTable(data) {
        const risks = data.risks;
        const riskSummary = data.riskSummary;
        return `
            <section class="procurement-risk-panel" aria-labelledby="procurement-risk-title">
                <div class="procurement-risk-heading">
                    <div id="procurement-risk-title">
                        ${renderSectionTitle('Закупки под риском', `${riskSummary.count} тендеров · оценка ${riskSummary.totalCost}`, 'danger')}
                    </div>
                    <span>${ui.icon('triangle-alert')}Выберите строку для подробностей</span>
                </div>
                <div class="procurement-risk-table-wrap">
                    <table class="procurement-risk-table">
                        <thead><tr>
                            <th>Тендер</th><th>Предмет / тип</th><th>Стоимость</th><th>Требуется</th><th>Прогноз</th><th>Запас</th><th>Статус</th><th>Действие</th>
                        </tr></thead>
                        <tbody>
                            ${risks.length ? risks.map(risk => `
                                <tr data-procurement-risk="${ui.escapeAttr(risk.id)}">
                                    <td><strong>${ui.escapeHtml(risk.id)}</strong></td>
                                    <td><b>${ui.escapeHtml(risk.subject)}</b><small>${ui.escapeHtml(risk.type)}</small></td>
                                    <td>${ui.escapeHtml(risk.cost)}</td>
                                    <td>${ui.escapeHtml(risk.required)}</td>
                                    <td>${ui.escapeHtml(risk.forecast)}</td>
                                    <td class="${risk.reserve < 0 ? 'is-negative' : 'is-positive'}">${risk.reserve > 0 ? '+' : ''}${risk.reserve}</td>
                                    <td>${renderStatus(risk.status)}</td>
                                    <td><button type="button" class="procurement-risk-action" aria-label="Подробнее о тендере ${ui.escapeAttr(risk.id)}">Подробнее${ui.icon('chevron-right')}</button></td>
                                </tr>
                            `).join('') : `
                                <tr class="procurement-risk-empty"><td colspan="8">Закупок под риском нет.</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <footer class="procurement-risk-footer">
                    <span>Показано ${risks.length} из ${riskSummary.count} процедур</span>
                    <span>Сумма видимых строк: ${ui.escapeHtml(riskSummary.totalCost)}</span>
                </footer>
            </section>
        `;
    }

    function renderRiskDialog(data) {
        const risk = data.risks.find(item => item.id === state.selectedRiskId);
        if (!risk) return '';
        return `
            <div class="procurement-dialog-overlay" data-procurement-action="close-dialog">
                <aside class="procurement-risk-dialog" role="dialog" aria-modal="true" aria-labelledby="procurement-risk-dialog-title">
                    <div class="procurement-dialog-top">
                        ${renderStatus(risk.status)}
                        <button type="button" data-procurement-close aria-label="Закрыть подробности">${ui.icon('x')}</button>
                    </div>
                    <p class="procurement-dialog-id">${ui.escapeHtml(risk.id)}</p>
                    <h2 id="procurement-risk-dialog-title">${ui.escapeHtml(risk.subject)}</h2>
                    <p class="procurement-dialog-meta">${ui.escapeHtml(risk.type)} · ${ui.escapeHtml(risk.owner)}</p>
                    <dl class="procurement-dialog-grid">
                        <div><dt>Стоимость</dt><dd>${ui.escapeHtml(risk.cost)}</dd></div>
                        <div><dt>Запас</dt><dd>${risk.reserve > 0 ? '+' : ''}${risk.reserve} дней</dd></div>
                        <div><dt>Требуемая дата</dt><dd>${ui.escapeHtml(risk.required)}</dd></div>
                        <div><dt>Прогноз</dt><dd>${ui.escapeHtml(risk.forecast)}</dd></div>
                    </dl>
                    <div class="procurement-dialog-next-step">
                        <strong>Следующее действие</strong>
                        <p>Проверить срок поставки и зафиксировать план восстановления даты.</p>
                    </div>
                    <button type="button" class="procurement-dialog-primary" data-procurement-action="demo-tender">
                        <span>Открыть карточку тендера</span>${ui.icon('arrow-up-right')}
                    </button>
                </aside>
            </div>
        `;
    }

    function render(data) {
        return `
            <div class="procurement-metrics" data-context-key="${ui.escapeAttr(data.contextKey)}">
                ${renderSummary(data)}
                <div class="procurement-primary-grid">
                    ${renderContracting(data)}
                    ${renderFinancialEffect(data)}
                </div>
                ${renderEfficiency(data)}
                ${renderRiskTable(data)}
                ${renderRiskDialog(data)}
                <div class="sr-only" aria-live="polite" data-procurement-live></div>
            </div>
        `;
    }

    function announce(message) {
        const liveRegion = state.container ? state.container.querySelector('[data-procurement-live]') : null;
        if (liveRegion) liveRegion.textContent = message;
    }

    function rerender(options = {}) {
        if (!state.container || !state.data) return;
        const focusRiskId = options.focusRiskId || null;
        state.container.innerHTML = render(state.data);
        refreshIcons();
        drawDonutCharts();
        bindRenderedControls();

        if (state.selectedRiskId) {
            const closeButton = state.container.querySelector('[data-procurement-close]');
            if (closeButton) closeButton.focus();
        } else if (focusRiskId) {
            const action = state.container.querySelector(`[data-procurement-risk="${CSS.escape(focusRiskId)}"] .procurement-risk-action`);
            if (action) action.focus();
        }
    }

    function openRisk(riskId) {
        state.selectedRiskId = riskId;
        state.returnFocusRiskId = riskId;
        rerender();
    }

    function closeRisk() {
        const focusRiskId = state.returnFocusRiskId;
        state.selectedRiskId = null;
        state.returnFocusRiskId = null;
        rerender({ focusRiskId });
    }

    function onCloseControlClick(event) {
        event.preventDefault();
        event.stopPropagation();
        closeRisk();
    }

    function bindRenderedControls() {
        if (!state.container) return;
        const closeControl = state.container.querySelector('[data-procurement-close]');
        if (closeControl) {
            closeControl.onclick = onCloseControlClick;
        }
    }

    function onClick(event) {
        const closeControl = event.target.closest('[data-procurement-close]');
        if (closeControl) {
            event.preventDefault();
            event.stopPropagation();
            closeRisk();
            return;
        }

        const riskRow = event.target.closest('[data-procurement-risk]');
        if (riskRow) {
            openRisk(riskRow.dataset.procurementRisk);
            return;
        }

        const action = event.target.closest('[data-procurement-action]');
        if (!action) return;

        if (action.dataset.procurementAction === 'demo-tender') announce('Карточка тендера находится вне рамок текущего прототипа');
        if (action.dataset.procurementAction === 'close-dialog') {
            const overlay = action.classList.contains('procurement-dialog-overlay');
            if (!overlay || event.target === action) closeRisk();
        }
    }

    function trapDialogFocus(event) {
        const dialog = state.container.querySelector('.procurement-risk-dialog');
        if (!dialog || event.key !== 'Tab') return;
        const focusable = Array.from(dialog.querySelectorAll('button, [href], select, textarea, [tabindex]:not([tabindex="-1"])'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function onKeydown(event) {
        const riskAction = event.target.closest('.procurement-risk-action');
        if (riskAction && (event.key === 'Enter' || event.key === ' ')) {
            const riskRow = riskAction.closest('[data-procurement-risk]');
            if (riskRow) {
                event.preventDefault();
                openRisk(riskRow.dataset.procurementRisk);
                return;
            }
        }
        if (state.selectedRiskId && event.key === 'Escape') {
            event.preventDefault();
            closeRisk();
            return;
        }
        trapDialogFocus(event);
    }

    function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function drawDonutCharts() {
        if (!state.container) return;
        state.container.querySelectorAll('[data-procurement-donut]').forEach(canvas => {
            const size = 116;
            const ratio = Math.max(1, window.devicePixelRatio || 1);
            const values = [
                Number(canvas.dataset.contractedShare) || 0,
                Number(canvas.dataset.openShare) || 0,
                Number(canvas.dataset.remainingShare) || 0
            ];
            const colors = ['#1677ff', '#7c3aed', '#d8dee7'];
            const context = canvas.getContext('2d');
            if (!context) return;

            canvas.width = Math.round(size * ratio);
            canvas.height = Math.round(size * ratio);
            canvas.style.width = `${size}px`;
            canvas.style.height = `${size}px`;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            context.clearRect(0, 0, size, size);

            const center = size / 2;
            const radius = 47;
            let start = -Math.PI / 2;
            values.forEach((value, index) => {
                const end = start + (Math.PI * 2 * value / 100);
                context.beginPath();
                context.arc(center, center, radius, start, end);
                context.strokeStyle = colors[index];
                context.lineWidth = 13;
                context.lineCap = 'butt';
                context.stroke();
                start = end;
            });

            context.fillStyle = '#111827';
            context.font = '500 22px Inter, Arial, sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(`${values[0]}%`, center, center + 1);
        });
    }

    function mount(container, data) {
        if (!container || !data) return;
        const isNewContext = state.contextKey !== data.contextKey;
        unmount();
        state.container = container;
        state.data = data;
        state.contextKey = data.contextKey;
        if (isNewContext) {
            state.selectedRiskId = null;
            state.returnFocusRiskId = null;
        }
        container.innerHTML = render(data);
        container.addEventListener('click', onClick);
        container.addEventListener('keydown', onKeydown);
        refreshIcons();
        drawDonutCharts();
        bindRenderedControls();
    }

    function unmount() {
        if (!state.container) return;
        state.container.removeEventListener('click', onClick);
        state.container.removeEventListener('keydown', onKeydown);
        state.container = null;
        state.selectedRiskId = null;
        state.returnFocusRiskId = null;
    }

    return { mount, unmount };
})();
