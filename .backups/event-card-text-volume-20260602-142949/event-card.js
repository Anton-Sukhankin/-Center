/**
 * Event card component.
 * Renders the compact event representation used in the central feed.
 */
(function (window) {
    const ui = window.SCenterUI;

    function renderEventListCard(event) {
        const isPinned = event.pinned ? 'pinned' : '';
        const priorityClass = event.priority ? `priority-${ui.escapeAttr(event.priority)}` : '';
        const hasMetric = Boolean(event.metricName || event.impact);
        const sourceIcon = event.sourceIcon || 'activity';
        const pinTitle = event.pinned ? 'Открепить' : 'Закрепить';
        const pinIcon = event.pinned ? 'pin-off' : 'pin';

        return `
            <article class="event-card ${priorityClass} ${isPinned} ${hasMetric ? 'has-metric-link' : ''}"
                     id="card-${ui.escapeAttr(event.id)}"
                     data-event-id="${ui.escapeAttr(event.id)}"
                     onclick="openEventDrawer('${ui.escapeAttr(event.id)}')">

                <div class="selection-toggle-btn"
                     onclick="toggleExclude('${ui.escapeAttr(event.id)}', event)"
                     title="Исключить из выдачи">
                    ${ui.icon('x')}
                </div>

                <div class="event-card-main-block">
                    <div class="event-source-icon source-neutral is-hidden-source-icon" aria-hidden="true">
                        ${ui.icon(sourceIcon)}
                    </div>

                    <div class="event-card-meta-line">
                        <div class="event-card-attributes-row">
                            <span class="event-source-text">${ui.escapeHtml(event.sourceName || 'S.Center')}</span>
                            <span class="event-attributes-dot">•</span>
                            <span class="event-timestamp-text">${ui.escapeHtml(event.dateText || '')}</span>
                        </div>
                        <button class="event-action-btn pin-toggle ${event.pinned ? 'active' : ''}"
                                onclick="togglePin('${ui.escapeAttr(event.id)}', event)"
                                title="${ui.escapeAttr(pinTitle)}">
                            ${ui.icon(pinIcon, '', 'width:18px; height:18px;')}
                        </button>
                    </div>

                    <h3 class="event-card-title">${ui.escapeHtml(event.title)}</h3>

                    <div class="event-card-desc">${ui.escapeHtml(event.text)}</div>
                </div>

                <div class="event-card-metric-block ${hasMetric ? '' : 'is-empty'}">
                    <div class="event-card-metric-main">
                        ${ui.icon('bar-chart-3')}
                        <span>${ui.escapeHtml(event.metricName || 'Без влияния на метрики')}</span>
                    </div>
                    ${event.impact ? `<span class="event-card-metric-impact">${ui.escapeHtml(event.impact)}</span>` : ''}
                </div>
            </article>
        `;
    }

    class EventCardManager {
        constructor() {
            this.init();
        }

        init() {
            window.addEventListener('click', () => this.closeAllMenus());
        }

        toggleMenu(event, menuId) {
            event.stopPropagation();
            const menu = document.getElementById(menuId);
            if (!menu) return;
            const isOpen = menu.classList.contains('active');

            this.closeAllMenus();

            if (!isOpen) {
                menu.classList.add('active');
            }
        }

        closeAllMenus() {
            document.querySelectorAll('.ec-dropdown-menu').forEach(menu => {
                menu.classList.remove('active');
            });
        }

        deactivateCard(event, cardId) {
            event.stopPropagation();
            const card = document.getElementById(cardId);
            if (card) {
                card.classList.toggle('is-deactivated');
            }
        }

        setSelectionMode(active) {
            if (active) {
                document.body.classList.add('selection-mode-active');
            } else {
                document.body.classList.remove('selection-mode-active');
            }
        }
    }

    window.SCenterComponents = window.SCenterComponents || {};
    window.SCenterComponents.renderEventListCard = renderEventListCard;
    window.eventCardManager = new EventCardManager();
})(window);
