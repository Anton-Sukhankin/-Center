import Icon from '../ui/Icon.jsx';

export default function MetricsKpiCard({ title, icon, status, value, unit, comparison, sourceLabel }) {
    const accessibleLabel = sourceLabel ? [`${sourceLabel}: ${value}`, unit, comparison].filter(Boolean).join(' ') : undefined;

    return (
        <article className="metrics-kpi-card"
            data-status={status} aria-label={accessibleLabel} title={sourceLabel}>
            <div className="metrics-kpi-card-primary">
                <div className="metrics-kpi-card-main">
                    <span className="metrics-icon-box"><Icon name={icon} /></span>
                    <div>
                        <div className="metrics-card-title">{title}</div>
                        <div className={`metrics-value-row${status ? ' is-status-value' : ''}`}>
                            <strong>{value}</strong>{(unit || comparison) && <> <span className={comparison ? 'metrics-unit-with-comparison' : undefined}>
                                {unit}{comparison && <>{unit && ' '}<span className="metrics-value-comparison">{comparison}</span></>}
                            </span></>}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
