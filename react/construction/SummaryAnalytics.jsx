import Icon from './ConstructionIcon.jsx';

const KPI_TONES = ['blue', 'green', 'red', 'violet', 'orange', 'yellow'];
const ALL_OBJECTS = { id: 'all', name: 'Все объекты' };

export function SummaryKpis({ kpis, loading }) {
    return (
        <section className="dcs-kpi-grid" aria-label={loading ? 'Загрузка сводных показателей' : 'Сводная статистика'}>
            {loading ? KPI_TONES.map(tone => (
                <div key={tone} className="dcs-kpi-card is-skeleton">
                    <div className="dcs-kpi-header"><span /><b /></div><span className="dcs-kpi-skeleton-label" />
                </div>
            )) : kpis?.map((kpi, index) => (
                <article className="dcs-kpi-card" key={kpi.id || kpi.label}>
                    <div className="dcs-kpi-header">
                        <span className={`dcs-kpi-icon is-${kpi.tone || KPI_TONES[index]}`}><Icon name={kpi.icon || 'building-2'} size={25} /></span>
                        <div className="dcs-kpi-value"><strong>{kpi.value}</strong>
                            {Number.isFinite(kpi.delta) && kpi.delta !== 0 && <span className={kpi.delta > 0 ? 'is-positive' : 'is-negative'}>
                                <Icon name={kpi.delta > 0 ? 'arrow-up' : 'arrow-down'} size={18} />{kpi.delta > 0 ? '+' : ''}{kpi.delta}%
                            </span>}
                        </div>
                    </div>
                    <span className="dcs-kpi-label">{kpi.label}</span>
                </article>
            ))}
        </section>
    );
}

function SkeletonRows() {
    return Array.from({ length: 7 }, (_, index) => <li key={index} className="dcs-list-skeleton"><span /></li>);
}

export function WeeklySummary({ weekly, period, loading, openReport }) {
    const delta = weekly?.delta;
    const tone = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
    const tooltip = weekly
        ? `Строительная готовность проекта ${delta >= 0 ? 'выросла' : 'снизилась'} с ${weekly.from}% до ${weekly.to}% за период ${period?.label || ''}.`
        : '';
    return (
        <article className="dcs-analytics-card" aria-labelledby="dcs-weekly-title">
            <header>
                <span className="dcs-card-title-icon"><Icon name="calendar-days" size={20} /></span><h2 id="dcs-weekly-title">Динамика за неделю</h2>
                {weekly && <span className="dcs-weekly-delta-wrap">
                    <button type="button" className={`dcs-weekly-delta-tag is-${tone}`} aria-describedby="dcs-weekly-tooltip">
                        <span className="dcs-weekly-tag-icon"><Icon name="info" size={10} /></span><strong>{delta > 0 ? '+' : ''}{delta}%</strong>
                    </button>
                    <span className="dcs-weekly-delta-tooltip" id="dcs-weekly-tooltip" role="tooltip">{tooltip}</span>
                </span>}
            </header>
            <div className="dcs-card-scroll" tabIndex={0}><ul className="dcs-weekly-list">
                {loading ? <SkeletonRows /> : weekly?.insights?.length ? weekly.insights.map(insight => (
                    <li className="dcs-weekly-item" key={insight} title={insight}><span aria-hidden="true" /><p>{insight}</p></li>
                )) : <li className="dcs-list-empty">Нет событий за выбранный период</li>}
            </ul></div>
            <footer><button type="button" className="dcs-link-button" onClick={openReport}>Подробнее в отчете<Icon name="arrow-right" size={16} /></button></footer>
        </article>
    );
}

function AttentionRows({ items, loading, error, onRetry, openIssue }) {
    if (loading) return <SkeletonRows />;
    if (error) return (
        <li className="dcs-inline-state"><span><Icon name="wifi-off" size={20} /></span>
            <div><strong>Не удалось загрузить проблемы</strong><button type="button" onClick={onRetry}>Повторить</button></div>
        </li>
    );
    if (!items.length) return (
        <li className="dcs-inline-state is-success"><span><Icon name="circle-check" size={21} /></span>
            <div><strong>Проблем не найдено</strong><small>Для выбранного объекта нет активных сигналов.</small></div>
        </li>
    );
    return items.map(item => (
        <li key={item.id}>
            <button type="button" className="dcs-attention-item" onClick={() => openIssue(item)}>
                <Icon name="circle-alert" size={20} className={`dcs-attention-status is-${item.tone === 'critical' ? 'critical' : 'warning'}`} />
                <span title={item.title}>{item.title}</span><b>{item.count}</b><Icon name="chevron-right" size={17} />
            </button>
        </li>
    ));
}

export function SummaryAttention({ objects, items, selectedObject, onSelectObject, loading, error, onRetry, openIssue, openAllIssues }) {
    const objectOptions = [ALL_OBJECTS, ...objects];
    const selected = objectOptions.find(item => item.id === selectedObject) || ALL_OBJECTS;
    const filtered = selected.id === 'all' ? items : items.filter(item => item.objectId === selected.id);
    const count = filtered.reduce((sum, item) => sum + item.count, 0);
    return (
        <article className="dcs-analytics-card" aria-labelledby="dcs-attention-title">
            <header>
                <span className="dcs-card-title-icon"><Icon name="circle-alert" size={20} /></span><h2 id="dcs-attention-title">Требуют внимания</h2>
                <label className="dcs-object-filter">
                    <Icon name="building-2" size={17} />
                    <select aria-label="Фильтр проблем по объекту" value={selected.id} onChange={event => onSelectObject(event.target.value)}>
                        {objectOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <Icon name="chevron-down" size={15} />
                </label>
            </header>
            <div className="dcs-card-scroll" tabIndex={0}>
                <ul className="dcs-attention-list"><AttentionRows items={filtered} loading={loading} error={error} onRetry={onRetry} openIssue={openIssue} /></ul>
            </div>
            <footer><button type="button" className="dcs-link-button" onClick={() => openAllIssues(selected, count)}>
                Все проблемы по {selected.id === 'all' ? 'проекту' : selected.name} ({count})<Icon name="arrow-right" size={16} />
            </button></footer>
        </article>
    );
}
