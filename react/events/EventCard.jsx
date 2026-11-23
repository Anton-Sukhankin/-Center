import { memo, useId } from 'react';
import Icon from '../ui/Icon.jsx';
import InlineText from '../ui/InlineText.jsx';

const plural = new Intl.PluralRules('ru');
const sourcesLabel = count => `${count} ${{ one: 'источник', few: 'источника', many: 'источников', other: 'источника' }[plural.select(count)]}`;
const signalPrefix = /^\s*(?:\*\*Сигнал:\*\*|Сигнал:)[ \t]*/iu;
const nextPreviewSection = /(?:^|\r?\n)[ \t]*\*\*(?:Данные|Влияние|Действие|AI-вывод):\*\*/iu;

function compactPreview(text) {
    const prefix = text.match(signalPrefix);
    if (!prefix) return text;
    const [signal] = text.slice(prefix[0].length).split(nextPreviewSection, 1);
    return signal.trim().replace(/^([^\p{L}\p{N}]*)(\p{Ll})/u,
        (_, opening, letter) => opening + letter.toLocaleUpperCase('ru-RU'));
}

function themeStyle(theme = {}) {
    return {
        '--source-chip-bg': theme.chipBg,
        '--source-chip-bg-end': theme.chipBgEnd,
        '--source-icon-bg': theme.iconBg,
        '--source-icon-color': theme.iconColor,
        '--source-text-color': theme.textColor
    };
}

function SourceIndicator({ event }) {
    const sources = event.sources || [];
    const count = event.sourceCount || sources.length;
    if (!event.isSourceAggregator || count < 2) {
        return <span className="event-source-product-chip" style={themeStyle(event.sourceTheme)}>
            <span className="event-source-chip-icon"><Icon name={event.sourceIcon || 'activity'} /></span>
            <span className="event-source-text">{event.sourceName || 'AIShtab'}</span>
        </span>;
    }
    return <span className="event-source-aggregator" role="group" tabIndex={0} aria-label={sourcesLabel(count)}
        onClick={event => event.stopPropagation()}>
        <span className="event-source-aggregator-chip">
            <span className="event-source-aggregator-icon"><Icon name="git-fork" /></span>
            <span className="event-source-text">{sourcesLabel(count)}</span>
        </span>
        <span className="event-source-aggregator-menu" role="list">
            {sources.map(source => <span key={source.id || source.name} role="listitem"
                className="event-source-aggregator-item" style={themeStyle(source.theme)}>
                <span className="event-source-chip-icon"><Icon name={source.icon || 'activity'} /></span>
                <span className="event-source-text">{source.name}</span>
            </span>)}
        </span>
    </span>;
}

const EventCard = memo(function EventCard({ event, taskCount, canExclude, onOpen, onOpenMetric, onPin, onExclude }) {
    const listId = useId();
    const extra = event.additionalMetricNames || [];
    const title = event.listTitle || event.title;
    const hasMetric = Boolean(event.metricName || event.impact);
    const metricLabel = event.metricName || 'Без влияния на метрики';
    const metricTag = <><Icon name="gauge" strokeWidth={2.75} /><span>{metricLabel}</span></>;
    const pinText = event.pinned ? 'Открепить' : 'Закрепить';
    const preview = compactPreview(event.listText || event.text || '');
    return <article className={`event-card priority-${event.priority} ${event.pinned ? 'pinned' : ''} ${hasMetric ? 'has-metric-link' : ''}`}
        id={`card-${event.id}`} data-event-id={event.id} tabIndex={0} aria-label={title}
        onClick={click => onOpen(event.id, click.currentTarget)} onKeyDown={key => {
            if (key.target === key.currentTarget && (key.key === 'Enter' || key.key === ' ')) {
                key.preventDefault();
                onOpen(event.id, key.currentTarget);
            }
        }}>
        <div className="event-card-main-block">
            <div className="event-card-meta-line">
                <div className="event-card-source-date">
                    <SourceIndicator event={event} />
                    {event.dateText ? <span className="event-timestamp-text">{event.dateText}</span> : null}
                </div>
                <div className="event-card-meta-actions">
                    {taskCount > 0 ? <span className="event-task-presence" role="img" aria-label="По событию создана задача" title="По событию создана задача">
                        <Icon name="clipboard-check" size={18} />
                    </span> : null}
                    {canExclude ? <button type="button" className="event-action-btn selection-toggle-btn"
                        aria-label="Исключить из выдачи" title="Исключить из выдачи"
                        onClick={click => { click.stopPropagation(); onExclude(event.id); }}>
                        <Icon name="x" size={14} />
                    </button> : null}
                    <button type="button" className={`event-action-btn pin-toggle ${event.pinned ? 'active' : ''}`}
                        aria-label={`${pinText} событие`} title={pinText} aria-pressed={Boolean(event.pinned)}
                        onClick={click => { click.stopPropagation(); onPin(event.id); }}>
                        <Icon name="bookmark" size={18} />
                    </button>
                </div>
            </div>
            <h3 className="event-card-title">{title}</h3>
            {preview ? <div className="event-card-desc"><InlineText value={preview} /></div> : null}
        </div>
        <div className={`event-card-metric-block ${hasMetric ? '' : 'is-empty'}`}>
            {event.chartMetricId ? <button type="button" className="event-card-metric-main event-card-metric-trigger"
                aria-haspopup="dialog" aria-label={`Открыть график: ${metricLabel}`} title={`Открыть график: ${metricLabel}`}
                onClick={click => {
                    click.stopPropagation();
                    click.currentTarget.focus({ preventScroll: true });
                    onOpenMetric(event.chartMetricId, click.currentTarget);
                }}>{metricTag}</button> : <div className="event-card-metric-main">{metricTag}</div>}
            {event.metricName && extra.length > 0 && <>
                <button type="button" className="event-metrics-more" popoverTarget={listId}
                    aria-controls={listId} aria-label={`Показать дополнительные метрики: ${extra.length}`}
                    onClick={e => e.stopPropagation()}>Ещё {extra.length}</button>
                <section id={listId} popover="auto" className="event-metrics-popover"
                    aria-label="Связанные метрики" onClick={e => e.stopPropagation()}>
                    <ul>{extra.map(name => <li key={name}>{name}</li>)}</ul>
                </section>
            </>}
        </div>
    </article>;
});
export default EventCard;
