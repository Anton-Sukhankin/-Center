/**
 * Central project metrics dashboard.
 * Receives a prepared view model and owns only local dashboard interaction.
 */
(function (window) {
    const ui = window.SCenterUI;
    if (!ui) throw new Error('SCenterUI must be loaded before metrics-dashboard.js.');

    const state = {
        activeSection: 'overview',
        showAllMilestones: true,
        container: null,
        viewModel: null,
        context: null,
        sectionSignature: ''
    };

    const formatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
    const compactMoneyFormatter = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        notation: 'compact',
        maximumFractionDigits: 1
    });

    function formatDate(value) {
        if (!value) return 'Нет данных';
        const [year, month, day] = String(value).split('-').map(Number);
        return new Intl.DateTimeFormat('ru-RU').format(new Date(Date.UTC(year, month - 1, day)));
    }

    function formatMoney(value) {
        return compactMoneyFormatter.format(Number(value || 0)).replace('млрд', 'млрд');
    }

    function signedNumber(value, suffix = '') {
        const number = Number(value || 0);
        const sign = number > 0 ? '+' : (number < 0 ? '−' : '');
        return `${sign}${formatter.format(Math.abs(number))}${suffix}`;
    }

    function pluralDays(value) {
        const absolute = Math.abs(Math.round(Number(value || 0)));
        const mod10 = absolute % 10;
        const mod100 = absolute % 100;
        if (mod10 === 1 && mod100 !== 11) return 'день';
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
        return 'дней';
    }

    function statusMeta(status) {
        const map = {
            favorable: { label: 'В пределах', icon: 'trending-down' },
            unfavorable: { label: 'Требует внимания', icon: 'trending-up' },
            neutral: { label: 'Без отклонения', icon: 'minus' }
        };
        return map[status] || map.neutral;
    }

    function renderSectionTabs(viewModel) {
        return `
            <div class="metrics-section-tabs" role="tablist" aria-label="Разделы метрик">
                ${viewModel.phaseSections.map(section => `
                    <button
                        type="button"
                        class="metrics-section-tab ${state.activeSection === section.id ? 'is-active' : ''}"
                        id="metrics-section-tab-${ui.escapeAttr(section.id)}"
                        data-metrics-section="${ui.escapeAttr(section.id)}"
                        role="tab"
                        aria-selected="${state.activeSection === section.id}"
                        aria-controls="metrics-dashboard-section-panel"
                        tabindex="${state.activeSection === section.id ? '0' : '-1'}"
                        onclick="window.SCenterMetricsDashboard.setSection('${ui.escapeAttr(section.id)}')">
                        ${ui.escapeHtml(section.label)}
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderScheduleCards(viewModel) {
        const schedule = viewModel.schedule;
        const status = schedule.deviationDays > 0 ? 'unfavorable' : (schedule.deviationDays < 0 ? 'favorable' : 'neutral');
        const meta = statusMeta(status);

        return `
            <section class="metrics-kpi-grid" aria-label="Сводка сроков">
                <article class="metrics-kpi-card">
                    <div class="metrics-kpi-card-primary">
                        <div class="metrics-kpi-card-main">
                            <span class="metrics-icon-box is-blue">${ui.icon('calendar-days')}</span>
                            <div>
                                <div class="metrics-card-title">Плановая длительность</div>
                                <div class="metrics-value-row">
                                    <strong>${formatter.format(schedule.plannedDurationDays)}</strong>
                                    <span>${pluralDays(schedule.plannedDurationDays)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="metrics-kpi-card-secondary">
                        <dl class="metrics-detail-list">
                            <div><dt>Дата старта</dt><dd>${formatDate(schedule.startDate)}</dd></div>
                            <div><dt>Завершение по плану</dt><dd>${formatDate(schedule.plannedFinishDate)}</dd></div>
                        </dl>
                    </div>
                </article>

                <article class="metrics-kpi-card">
                    <div class="metrics-kpi-card-primary">
                        <div class="metrics-kpi-card-main">
                            <span class="metrics-icon-box is-blue">${ui.icon('clock-3')}</span>
                            <div>
                                <div class="metrics-card-title">Прогнозная длительность</div>
                                <div class="metrics-value-row">
                                    <strong>${formatter.format(schedule.forecastDurationDays)}</strong>
                                    <span>${pluralDays(schedule.forecastDurationDays)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="metrics-kpi-card-secondary">
                        <dl class="metrics-detail-list">
                            <div><dt>Дата старта</dt><dd>${formatDate(schedule.startDate)}</dd></div>
                            <div><dt>Расчетное завершение</dt><dd>${formatDate(schedule.forecastFinishDate)}</dd></div>
                        </dl>
                    </div>
                </article>

                <article class="metrics-kpi-card is-status" data-status="${status}">
                    <div class="metrics-kpi-card-primary">
                        <div class="metrics-kpi-card-main">
                            <span class="metrics-icon-box is-status-icon">${ui.icon(meta.icon)}</span>
                            <div>
                                <div class="metrics-card-title">Отклонение срока</div>
                                <div class="metrics-value-row is-status-value">
                                    <strong>${signedNumber(schedule.deviationDays)}</strong>
                                    <span>${pluralDays(schedule.deviationDays)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="metrics-kpi-card-secondary">
                        <div class="metrics-percent-value">${signedNumber(schedule.deviationPercent, '%')}</div>
                        <div class="metrics-status-chip">${ui.icon(meta.icon)}<span>${ui.escapeHtml(meta.label)}</span></div>
                    </div>
                </article>

                <article class="metrics-kpi-card">
                    <div class="metrics-kpi-card-primary">
                        <div class="metrics-kpi-card-main">
                            <span class="metrics-icon-box is-violet">${ui.icon('calendar-check-2')}</span>
                            <div>
                                <div class="metrics-card-title">Прогнозное завершение</div>
                                <div class="metrics-date-value">${formatDate(schedule.forecastFinishDate)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="metrics-kpi-card-secondary">
                        <div class="metrics-date-caption">Дельта от планового завершения</div>
                        <div class="metrics-date-delta" data-status="${status}">${signedNumber(schedule.deviationDays)} ${pluralDays(schedule.deviationDays)}</div>
                    </div>
                </article>
            </section>
        `;
    }

    function selectVisibleMilestones(milestones) {
        if (state.showAllMilestones || milestones.length <= 5) return milestones;
        const currentIndex = Math.max(0, milestones.findIndex(item => item.status === 'current'));
        const start = Math.max(0, Math.min(currentIndex - 2, milestones.length - 5));
        return milestones.slice(start, start + 5);
    }

    function renderMilestoneMarker(milestone) {
        if (milestone.status === 'completed') return ui.icon('check');
        if (milestone.status === 'current') return '<span class="metrics-current-dot"></span>';
        return '<span class="metrics-planned-dot"></span>';
    }

    function renderMilestoneTimeline(viewModel) {
        const milestones = selectVisibleMilestones(viewModel.milestones);
        const expandedClass = state.showAllMilestones ? 'is-expanded' : '';
        return `
            <section class="metrics-panel metrics-milestones-panel" aria-labelledby="metrics-milestones-title">
                <div class="metrics-panel-header">
                    <div>
                        <h2 id="metrics-milestones-title">Контрольные этапы</h2>
                        <p>Текущий статус и ближайшие этапы проекта</p>
                    </div>
                    <button type="button" class="metrics-text-button" onclick="window.SCenterMetricsDashboard.toggleMilestones()" aria-expanded="${state.showAllMilestones}">
                        ${state.showAllMilestones ? 'Свернуть' : 'Все этапы'}
                        ${ui.icon(state.showAllMilestones ? 'chevron-up' : 'chevron-right')}
                    </button>
                </div>
                <div class="metrics-timeline ${expandedClass}">
                    ${milestones.map((milestone, index) => `
                        <div class="metrics-milestone" data-status="${ui.escapeAttr(milestone.status)}">
                            <div class="metrics-milestone-rail" aria-hidden="true">
                                <span class="metrics-rail-before ${index === 0 ? 'is-hidden' : ''}"></span>
                                <span class="metrics-milestone-marker">${renderMilestoneMarker(milestone)}</span>
                                <span class="metrics-rail-after ${index === milestones.length - 1 ? 'is-hidden' : ''}"></span>
                            </div>
                            <div class="metrics-milestone-status">${milestone.status === 'completed' ? 'Завершён' : (milestone.status === 'current' ? 'Текущий этап' : 'Запланирован')}</div>
                            <div class="metrics-milestone-name">${ui.escapeHtml(milestone.name)}</div>
                            <div class="metrics-milestone-date">${formatDate(milestone.actualDate || milestone.forecastDate || milestone.plannedDate)}</div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderBudgetComparison(comparison) {
        return `
            <div class="metrics-budget-comparison" data-status="${ui.escapeAttr(comparison.status)}">
                <span>Отклонение от ${ui.escapeHtml(comparison.baseCode)}</span>
                <strong>${signedNumber(comparison.percent, '%')}</strong>
                <small>${signedNumber(comparison.delta / 1_000_000_000, ' млрд ₽')}</small>
            </div>
        `;
    }

    function renderBudgetCards(viewModel) {
        const cards = [
            { key: 'targetCost', icon: 'wallet-cards', accent: 'blue' },
            { key: 'contractedCost', icon: 'file-check-2', accent: 'blue' },
            { key: 'acceptedWorks', icon: 'clipboard-check', accent: 'violet' }
        ];
        return `
            <section class="metrics-budget-section" aria-label="Бюджет проекта">
                <div class="metrics-budget-grid">
                    ${cards.map(card => {
                        const budget = viewModel.budgets[card.key];
                        return `
                            <article class="metrics-budget-card">
                                <div class="metrics-budget-card-primary">
                                    <div class="metrics-budget-card-main">
                                        <span class="metrics-icon-box is-${card.accent}">${ui.icon(card.icon)}</span>
                                        <div>
                                            <div class="metrics-budget-title">Бюджет по ${ui.escapeHtml(budget.code)}</div>
                                            <div class="metrics-budget-value">${ui.escapeHtml(formatMoney(budget.value))}</div>
                                            <div class="metrics-budget-description">${ui.escapeHtml(budget.name)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="metrics-budget-card-secondary">
                                    ${(budget.comparisons || []).map(renderBudgetComparison).join('')}
                                </div>
                            </article>
                        `;
                    }).join('')}
                </div>
            </section>
        `;
    }

    function renderOverview(viewModel) {
        return `
            ${renderScheduleCards(viewModel)}
            ${renderMilestoneTimeline(viewModel)}
            ${renderBudgetCards(viewModel)}
        `;
    }

    function renderUnavailableSection(viewModel) {
        const activeSection = viewModel.phaseSections.find(section => section.id === state.activeSection);
        return `
            <section class="metrics-section-empty" role="status">
                <span class="metrics-section-empty-icon">${ui.icon('panels-top-left')}</span>
                <h2>${ui.escapeHtml(activeSection ? activeSection.label : 'Раздел')}</h2>
                <p>Для этого этапа пока не согласован состав данных. Общая сводка проекта уже доступна во вкладке «Общие».</p>
                <button type="button" class="metrics-primary-button" onclick="window.SCenterMetricsDashboard.setSection('overview')">Вернуться к общим</button>
            </section>
        `;
    }

    function renderUnsupported(container, viewModel) {
        const canOpenProject = viewModel.contextType === 'queue' && viewModel.projectId;
        container.innerHTML = `
            <section class="metrics-dashboard metrics-dashboard--unsupported" role="status">
                <span class="metrics-section-empty-icon">${ui.icon('bar-chart-3')}</span>
                <h2>Выберите проект</h2>
                <p>${ui.escapeHtml(viewModel.message)}</p>
                ${canOpenProject ? `
                    <button type="button" class="metrics-primary-button" onclick="window.setActiveEntity('project', '${ui.escapeAttr(viewModel.projectId)}', '${ui.escapeAttr(viewModel.projectId)}')">
                        Открыть проект
                    </button>
                ` : ''}
            </section>
        `;
        refreshIcons();
    }

    function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function renderLoading(container) {
        state.container = container;
        container.innerHTML = `
            <section class="metrics-dashboard metrics-dashboard--loading" aria-busy="true" aria-label="Загрузка метрик проекта">
                <div class="metrics-skeleton metrics-skeleton--tabs"></div>
                <div class="metrics-skeleton metrics-skeleton--context"></div>
                <div class="metrics-skeleton-grid">
                    <div class="metrics-skeleton metrics-skeleton--card"></div>
                    <div class="metrics-skeleton metrics-skeleton--card"></div>
                    <div class="metrics-skeleton metrics-skeleton--card"></div>
                    <div class="metrics-skeleton metrics-skeleton--card"></div>
                </div>
                <div class="metrics-skeleton metrics-skeleton--timeline"></div>
            </section>
        `;
    }

    function getSectionSignature(viewModel) {
        return (viewModel.phaseSections || [])
            .map(section => `${section.id}:${section.label}`)
            .join('|');
    }

    function renderDashboardShell(container, viewModel) {
        state.sectionSignature = getSectionSignature(viewModel);
        container.innerHTML = `
            <section
                class="metrics-dashboard"
                data-context-key="${ui.escapeAttr(viewModel.contextKey || viewModel.projectId)}"
                data-context-type="${ui.escapeAttr(viewModel.contextType || 'project')}"
                data-project-id="${ui.escapeAttr(viewModel.projectId)}">
                ${renderSectionTabs(viewModel)}
                <div
                    class="metrics-dashboard-content"
                    id="metrics-dashboard-section-panel"
                    role="tabpanel"
                    aria-labelledby="metrics-section-tab-${ui.escapeAttr(state.activeSection)}">
                </div>
            </section>
        `;
    }

    function updateDashboardContent(viewModel) {
        const dashboard = state.container ? state.container.querySelector('.metrics-dashboard') : null;
        const content = dashboard ? dashboard.querySelector('.metrics-dashboard-content') : null;
        if (!dashboard || !content) return false;

        const nextSectionSignature = getSectionSignature(viewModel);
        if (state.sectionSignature !== nextSectionSignature) {
            const tabs = dashboard.querySelector('.metrics-section-tabs');
            if (tabs) tabs.outerHTML = renderSectionTabs(viewModel);
            state.sectionSignature = nextSectionSignature;
        }

        dashboard.dataset.contextKey = viewModel.contextKey || viewModel.projectId;
        dashboard.dataset.contextType = viewModel.contextType || 'project';
        dashboard.dataset.projectId = viewModel.projectId;
        dashboard.querySelectorAll('.metrics-section-tab').forEach(tab => {
            const isActive = tab.dataset.metricsSection === state.activeSection;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        content.setAttribute('aria-labelledby', `metrics-section-tab-${state.activeSection}`);
        content.innerHTML = renderActiveSection(viewModel);
        refreshIcons();
        return true;
    }

    function render(container, payload) {
        const previousContextKey = state.viewModel ? (state.viewModel.contextKey || state.viewModel.projectId) : null;
        const nextViewModel = payload ? payload.viewModel : null;
        const nextContextKey = nextViewModel ? (nextViewModel.contextKey || nextViewModel.projectId) : null;

        state.container = container;
        state.viewModel = nextViewModel;
        state.context = payload ? payload.context : null;
        if (previousContextKey !== nextContextKey) {
            state.showAllMilestones = true;
        }

        if (!state.viewModel || state.viewModel.status === 'unsupported-context') {
            renderUnsupported(container, state.viewModel || {
                contextType: null,
                message: 'Данные проекта пока недоступны.'
            });
            return;
        }

        const viewModel = state.viewModel;
        const hasStableShell = container.querySelector('.metrics-dashboard:not(.metrics-dashboard--loading):not(.metrics-dashboard--unsupported)');
        if (!hasStableShell) {
            renderDashboardShell(container, viewModel);
        }
        updateDashboardContent(viewModel);
    }

    function renderActiveSection(viewModel) {
        return state.activeSection === 'overview'
            ? renderOverview(viewModel)
            : renderUnavailableSection(viewModel);
    }

    function updateActiveSection() {
        if (!state.container || !state.viewModel) return;

        const dashboard = state.container.querySelector('.metrics-dashboard');
        const content = dashboard ? dashboard.querySelector('.metrics-dashboard-content') : null;
        if (!dashboard || !content) return;

        dashboard.querySelectorAll('.metrics-section-tab').forEach(tab => {
            const isActive = tab.dataset.metricsSection === state.activeSection;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        content.setAttribute('aria-labelledby', `metrics-section-tab-${state.activeSection}`);
        content.innerHTML = renderActiveSection(state.viewModel);
        refreshIcons();
    }

    function setSection(sectionId) {
        const sections = state.viewModel && Array.isArray(state.viewModel.phaseSections)
            ? state.viewModel.phaseSections
            : [];
        const nextSection = sections.some(section => section.id === sectionId)
            ? sectionId
            : 'overview';

        if (state.activeSection === nextSection) return;

        const content = state.container
            ? state.container.querySelector('.metrics-dashboard-content')
            : null;
        const shouldMoveFocusToTab = content && content.contains(document.activeElement);

        state.activeSection = nextSection;
        state.showAllMilestones = true;
        updateActiveSection();

        if (shouldMoveFocusToTab && state.container) {
            const activeTab = Array.from(state.container.querySelectorAll('.metrics-section-tab'))
                .find(tab => tab.dataset.metricsSection === state.activeSection);
            if (activeTab) activeTab.focus();
        }
    }

    function toggleMilestones() {
        state.showAllMilestones = !state.showAllMilestones;
        updateActiveSection();
    }

    function destroy() {
        state.container = null;
        state.viewModel = null;
        state.context = null;
        state.showAllMilestones = true;
        state.sectionSignature = '';
    }

    window.SCenterMetricsDashboard = {
        render,
        renderLoading,
        setSection,
        toggleMilestones,
        getCurrentViewModel: () => state.viewModel,
        destroy
    };
})(window);
