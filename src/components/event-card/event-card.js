/**
 * Event card component.
 * Renders the compact event representation used in the central feed.
 */
(function (window) {
    const ui = window.SCenterUI;

    function buildSourceThemeStyle(theme) {
        const sourceTheme = theme || {};
        const themeVars = [
            ['--source-chip-bg', sourceTheme.chipBg],
            ['--source-chip-bg-end', sourceTheme.chipBgEnd],
            ['--source-icon-bg', sourceTheme.iconBg],
            ['--source-icon-color', sourceTheme.iconColor],
            ['--source-text-color', sourceTheme.textColor]
        ];

        return themeVars
            .filter(([, value]) => Boolean(value))
            .map(([name, value]) => `${name}: ${value}`)
            .join('; ');
    }

    function getSourceCountLabel(count) {
        const value = Number(count) || 0;
        const mod10 = value % 10;
        const mod100 = value % 100;
        const word = mod10 === 1 && mod100 !== 11
            ? 'источник'
            : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
                ? 'источника'
                : 'источников';
        return `${value} ${word}`;
    }

    function renderSourceIndicator(event, sourceIcon, sourceThemeStyle) {
        const sources = Array.isArray(event.sources) ? event.sources : [];
        const sourceCount = event.sourceCount || sources.length;
        const isAggregator = Boolean(event.isSourceAggregator && sourceCount > 1);

        if (!isAggregator) {
            return `
                <span class="event-source-product-chip" style="${ui.escapeAttr(sourceThemeStyle)}">
                    <span class="event-source-chip-icon" aria-hidden="true">
                        ${ui.icon(sourceIcon)}
                    </span>
                    <span class="event-source-text">${ui.escapeHtml(event.sourceName || 'S.Center')}</span>
                </span>
            `;
        }

        const sourceItems = sources.map(source => `
            <span class="event-source-aggregator-item" style="${ui.escapeAttr(buildSourceThemeStyle(source.theme))}">
                <span class="event-source-chip-icon" aria-hidden="true">
                    ${ui.icon(source.icon || 'activity')}
                </span>
                <span class="event-source-text">${ui.escapeHtml(source.name)}</span>
            </span>
        `).join('');

        return `
            <span class="event-source-aggregator"
                  tabindex="0"
                  onclick="event.stopPropagation()"
                  onmouseleave="this.blur()"
                  aria-label="${ui.escapeAttr(getSourceCountLabel(sourceCount))}">
                <span class="event-source-aggregator-chip">
                    <span class="event-source-aggregator-icon" aria-hidden="true">
                        ${ui.icon('git-fork')}
                    </span>
                    <span class="event-source-text">${ui.escapeHtml(getSourceCountLabel(sourceCount))}</span>
                </span>
                <span class="event-source-aggregator-menu" role="list">
                    ${sourceItems}
                </span>
            </span>
        `;
    }

    function renderEventListCard(event) {
        const isPinned = event.pinned ? 'pinned' : '';
        const priorityClass = event.priority ? `priority-${ui.escapeAttr(event.priority)}` : '';
        const hasMetric = Boolean(event.metricName || event.impact);
        const sourceIcon = event.sourceIcon || 'activity';
        const sourceThemeStyle = buildSourceThemeStyle(event.sourceTheme);
        const pinTitle = event.pinned ? 'Открепить' : 'Закрепить';
        const pinIcon = event.pinned ? 'pin-off' : 'pin';
        const titleText = event.listTitle || event.title || '';
        const descriptionText = event.listText || event.text || '';
        const linkedTaskCount = Number(event.linkedTaskCount) || 0;
        const taskPresenceLabel = 'По событию создана задача';

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
                            ${renderSourceIndicator(event, sourceIcon, sourceThemeStyle)}
                            <span class="event-attributes-dot">•</span>
                            <span class="event-timestamp-text">${ui.escapeHtml(event.dateText || '')}</span>
                        </div>
                        <div class="event-card-meta-actions">
                            ${linkedTaskCount > 0 ? `
                                <span
                                    class="event-task-presence"
                                    role="img"
                                    aria-label="${ui.escapeAttr(taskPresenceLabel)}"
                                    title="${ui.escapeAttr(taskPresenceLabel)}">
                                    ${ui.icon('clipboard-check', '', 'width:18px; height:18px;')}
                                </span>
                            ` : ''}
                            <button class="event-action-btn pin-toggle ${event.pinned ? 'active' : ''}"
                                    onclick="togglePin('${ui.escapeAttr(event.id)}', event)"
                                    title="${ui.escapeAttr(pinTitle)}">
                                ${ui.icon(pinIcon, '', 'width:18px; height:18px;')}
                            </button>
                        </div>
                    </div>

                    <h3 class="event-card-title">${ui.escapeHtml(titleText)}</h3>

                    <div class="event-card-desc">${ui.renderInlineText(descriptionText, { preserveLineBreaks: true })}</div>
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
