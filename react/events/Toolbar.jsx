import Icon from '../ui/Icon.jsx';
import { FilterButton } from '../ui/LightlineButton.jsx';
import { SegmentedButton, SegmentedControl } from '../ui/SegmentedControl.jsx';

const tabs = [['today', 'Сегодня'], ['all', 'Все события'], ['pinned', 'Закреплённые'], ['metrics', 'Метрики']];
const priorities = [['high', 'Высокий приоритет'], ['low', 'Низкий приоритет']];
const metricSections = [['overview', 'Общие'], ['procurement', 'Закупки']];

function ContextSegments({ metrics, value, onChange, feed, disabled }) {
    const items = metrics ? metricSections : priorities;
    const prefix = metrics ? 'metrics-section-tab' : 'priority-tab';
    const panelId = metrics ? 'metrics-dashboard-section-panel' : 'priority-events-panel';

    function handleKeyDown(event) {
        if (disabled || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : value === items[0][0] ? 1 : 0;
        const [next] = items[nextIndex];
        onChange(next);
        event.currentTarget.querySelector(`#${prefix}-${next}`)?.focus();
    }

    return <SegmentedControl className="toolbar-context-segments" role="tablist"
        aria-label={metrics ? 'Разделы метрик' : 'Приоритет событий'}
        aria-describedby={disabled ? 'metrics-project-required' : undefined} onKeyDown={handleKeyDown}>
        {items.map(([id, label]) => {
            const selected = !disabled && value === id;
            return <SegmentedButton key={id} active={selected}
                id={`${prefix}-${id}`} role="tab" tabIndex={selected ? 0 : -1}
                aria-controls={disabled ? undefined : panelId} disabled={disabled} onClick={() => onChange(id)}>
                {label}
                {!metrics ? <span className="tab-badge priority-tab-badge">{feed[id]}</span> : null}
            </SegmentedButton>;
        })}
    </SegmentedControl>;
}

export function Toolbar({ filters, feed, filtered, filterOpen, treeOpen, metricsAvailable, metricsSection,
    onTab, onPriority, onMetricsSection, onLayer }) {
    const metrics = filters.activeTab === 'metrics';
    const showFilter = filters.activeTab === 'today' || filters.activeTab === 'all';
    return <div id="event-toolbar-root"><div className={`event-toolbar ${filtered ? 'is-filtered' : ''}`}>
        <div className="toolbar-left">
            <SegmentedControl className="toolbar-mode-segments" aria-label="Режим ленты">
                {tabs.map(([id, label]) => <SegmentedButton key={id} active={filters.activeTab === id} onClick={() => onTab(id)}>
                    {label}
                    {id !== 'metrics' ? <span className={id === 'all' ? 'tab-badge-oval' : 'tab-badge'} id={`badge-${id}`}>{feed.counts[id]}</span> : null}
                </SegmentedButton>)}
            </SegmentedControl>
            <ContextSegments key={metrics ? 'metrics' : 'events'} metrics={metrics} feed={feed}
                disabled={metrics && !metricsAvailable}
                value={metrics ? metricsSection : filters.priorityView}
                onChange={metrics ? onMetricsSection : onPriority} />
        </div>
        <div className="toolbar-right">
            {!metrics ? <button type="button" className="footer-btn btn-analytics" aria-haspopup="dialog" onClick={event => onLayer('analytics', event.currentTarget)}>
                <Icon name="file-search" size={16} />Аналитика
            </button> : null}
            {showFilter ? <FilterButton open={filterOpen} filtered={filtered} onClick={source => onLayer('filters', source)} /> : null}
            <button type="button" className="lightline-button lightline-filter" id="open-metric-tree"
                title="Структура метрик" aria-haspopup="dialog"
                aria-label="Открыть структуру метрик" aria-controls="metric-drawer" aria-expanded={treeOpen} onClick={event => onLayer('tree', event.currentTarget)}>
                <Icon name="list-tree" size={18} />
            </button>
        </div>
    </div></div>;
}


