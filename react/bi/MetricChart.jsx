import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SegmentedButton, SegmentedControl } from '../ui/SegmentedControl.jsx';
import { CloseButton } from '../ui/LightlineButton.jsx';
import Icon from '../ui/Icon.jsx';
import { useAnimatedDialog } from '../ui/useAnimatedDialog.js';
import { createMetricSeries, makeChart, formatMetricValue } from './chartModel.js';

const legend = [['plan', 'План'], ['fact', 'Факт'], ['forecast', 'Прогноз'], ['ahead', 'Выше плана'], ['delay', 'Ниже плана']];
const hoverDelay = 120;

export default function MetricChart({ metric, onClose, onCreateTask, source: trigger, paired = false, sideBySide = false }) {
    const [forecast, setForecast] = useState(false);
    const [view, setView] = useState('range');
    const [hoverIndex, setHoverIndex] = useState(null);
    const [source, setSource] = useState(null);
    const timer = useRef(null);
    const bodyRef = useRef(null);
    const { dialogRef: dialog, backdropRef, dismiss } = useAnimatedDialog({
        onClose, active: !paired, source: trigger, overlayContainsSurface: true,
        relatedControl: onCreateTask ? '#event-create-task[data-linked-chart]' : undefined
    });
    const series = useMemo(() => createMetricSeries(metric), [metric]);
    const points = useMemo(() => forecast ? series : series.filter(point => !point.isForecast), [series, forecast]);
    const forecastStart = points.findIndex(point => point.isForecast);
    const chart = useMemo(() => makeChart(points, series), [points, series]);
    const hovered = source === 'plot' ? points[hoverIndex] : null;
    const center = hovered ? (hoverIndex + 0.5) * 100 / points.length : 0;
    const grid = { gridTemplateColumns: `var(--bi-gutter) repeat(${points.length}, minmax(0, 1fr))` };
    const fact = series.findLast(point => !point.isForecast);
    const last = points.at(-1);
    const delta = (last.actual > last.plan ? '+' : '') + formatMetricValue(last.actual - last.plan);

    useLayoutEffect(() => {
        if (!forecast && !paired) return;
        const body = bodyRef.current;
        const plot = body.querySelector('.metric-bi-chart');
        const table = body.querySelector('.metric-bi-table');
        const forecastRow = table.querySelector('[data-forecast-row]');
        const baseHeight = plot.offsetHeight;
        function fitPlot() {
            // Отдаём новой строке место даже тогда, когда под графиком есть запас.
            const preferred = baseHeight - (forecastRow?.offsetHeight || 0);
            plot.style.height = `${preferred}px`;
            const overflow = body.scrollHeight - body.clientHeight;
            // На очень низком экране сохраняем читаемость оси и доступ к таблице.
            const height = Math.max(paired ? 100 : 120, preferred - overflow);
            if (height !== preferred) plot.style.height = `${height}px`;
        }
        fitPlot();
        const observer = new ResizeObserver(fitPlot);
        [body, table, body.querySelector('.bi-toolbar'), ...body.querySelectorAll('.bi-summary-label')]
            .forEach(element => observer.observe(element));
        return () => {
            observer.disconnect();
            plot.style.removeProperty('height');
        };
    }, [forecast, paired]);

    useEffect(() => {
        setHoverIndex(null);
        setSource(null);
        return () => { window.clearTimeout(timer.current); timer.current = null; };
    }, [metric.id]);

    function cancelClear() {
        window.clearTimeout(timer.current);
        timer.current = null;
    }

    function scheduleClear() {
        if (timer.current !== null) return;
        timer.current = window.setTimeout(() => {
            timer.current = null;
            setSource(null);
        }, hoverDelay);
    }

    function onPointerMove(event) {
        if (event.pointerType === 'touch') return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (!rect.width) return;
        cancelClear();
        setSource('plot');
        const index = Math.floor((event.clientX - rect.left) * points.length / rect.width);
        setHoverIndex(Math.max(0, Math.min(index, points.length - 1)));
    }

    function selectPeriod(withForecast) {
        cancelClear();
        setSource(null);
        setHoverIndex(null);
        setForecast(withForecast);
    }

    return <div id="bi-modal-overlay" className={`metric-bi-overlay is-active${paired ? ' is-paired' : sideBySide ? ' is-side-by-side' : ''}`}
        ref={backdropRef} data-dialog-motion onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
        <section ref={dialog} className="metric-bi-dialog" role={paired ? 'region' : 'dialog'} aria-modal={paired ? undefined : true} data-dialog-motion
            aria-labelledby="metric-bi-title" aria-owns={onCreateTask ? 'event-create-task' : undefined} tabIndex={-1} onPointerLeave={scheduleClear}>
            <header className="metric-bi-header">
                <h2 data-dialog-title id="metric-bi-title">{metric.name || 'Метрика'}</h2>
                <CloseButton data-initial-focus={!paired || undefined} aria-label="Закрыть график" onClick={() => dismiss()} />
                {onCreateTask ? <button type="button" className="footer-btn footer-btn-primary metric-bi-task-action" onClick={onCreateTask}>
                    <Icon name="clipboard-plus" size={16} />Создать задачу
                </button> : null}
            </header>
            <div className="metric-bi-body" ref={bodyRef}>
                <div className="bi-summary" aria-live="polite">
                    <div><div className="bi-summary-label"><span>Последний факт · {fact.month}</span><span>План: {formatMetricValue(fact.plan)}</span></div>
                        <strong>{formatMetricValue(fact.actual)}</strong></div>
                    <div><div className="bi-summary-label"><span className="bi-summary-period">
                        {forecast && <i aria-hidden="true" className="metric-bi-legend-mark is-forecast" />}
                        {forecast ? 'Прогноз' : 'Отклонение от плана'} · {last.month}</span>
                        {forecast && <span>{delta} к плану ({formatMetricValue(last.plan)})</span>}</div>
                        <strong>{forecast ? formatMetricValue(last.actual) : delta}</strong></div>
                </div>
                <div className="bi-toolbar">
                    <div className="metric-bi-controls">
                    <SegmentedControl aria-label="Вид графика">
                        {[['range', 'Диапазоны'], ['line', 'Траектория']].map(([id, name]) =>
                            <SegmentedButton key={id} active={view === id} onClick={() => {
                                cancelClear(); setSource(null); setHoverIndex(null); setView(id);
                            }}>{name}</SegmentedButton>)}
                    </SegmentedControl>
                    <SegmentedControl aria-label="Период графика">
                        <SegmentedButton active={!forecast} onClick={() => selectPeriod(false)}>По факту</SegmentedButton>
                        <SegmentedButton active={forecast} onClick={() => selectPeriod(true)}>С прогнозом</SegmentedButton>
                    </SegmentedControl>
                    </div>
                    <div className={`metric-bi-legend is-${view}`} aria-label="Легенда графика">
                        {legend.filter(([id]) => id !== 'forecast' || forecast).map(([modifier, title]) => <span key={modifier}>
                            <i className={`metric-bi-legend-mark is-${modifier}`} />{title}
                        </span>)}
                    </div>
                </div>
            <div className="bi-data-scroll" onScroll={() => { cancelClear(); setSource(null); }}>
            <div className="bi-data-sheet" style={paired ? undefined : { minWidth: `calc(var(--bi-gutter) + ${points.length * 62}px)` }}>
            <div className="bi-plot-row">
            <div className="bi-axis" aria-hidden="true">{chart.grid.map(t => <span key={t.y}>{formatMetricValue(t.value)}</span>)}</div>
            <div className="metric-bi-chart" id="metric-bi-chart"
                onPointerMove={onPointerMove} onPointerLeave={scheduleClear} onPointerCancel={scheduleClear}>
                {forecastStart >= 0 && <div className="bi-forecast-period" style={{left: `${forecastStart * 100 / points.length}%`}}>
                    <span className="bi-forecast-bracket"><span>Прогноз</span></span>
                </div>}
                {hovered ? <>
                    <div className="metric-bi-tooltip" style={{ left: `clamp(8px, calc(${center}% - 82px), max(8px, calc(100% - 172px)))` }}>
                        <strong>{hovered.month}</strong>
                        <span>План: {formatMetricValue(hovered.plan)}</span>
                        <span>{hovered.isForecast ? 'Прогноз' : 'Факт'}: {formatMetricValue(hovered.actual)}</span>
                    </div>
                </> : null}
                <svg key={view + forecast} className="metric-bi-svg" viewBox="0 22 1000 376" preserveAspectRatio="none" role="img" aria-label="График динамики метрики">
                    {chart.grid.map(t => <line key={t.y} x1="0" y1={t.y} x2="1000" y2={t.y}
                        stroke="var(--ui-data-divider, #e6ebf0)" vectorEffect="non-scaling-stroke" />)}
                    {view === 'range' ? chart.markers.map(({ x, planY, actualY }, i) => {
                        const p = points[i];
                        return <g key={p.month}>
                            <line x1={x} x2={x} y1={planY} y2={actualY} stroke={p.actual >= p.plan ? '#287967' : '#b65447'}
                                strokeWidth="4" strokeDasharray={p.isForecast ? '5 3' : undefined}/>
                            <circle cx={x} cy={planY} r="6" fill="white" stroke="#687c90" strokeWidth="2"/>
                            <circle cx={x} cy={actualY} r="3.5" fill={p.isForecast ? 'white' : '#0b6bff'} stroke="#0b6bff" strokeWidth="2"/>
                        </g>;
                    }) : <>
                    {chart.markers.map(({ x, planY, actualY }, i) => <g key={points[i].month}>
                        <line x1={x} x2={x} y1={planY} y2={actualY} vectorEffect="non-scaling-stroke"
                            stroke={points[i].actual < points[i].plan ? 'var(--interval-below)' : 'var(--interval-above)'}
                            strokeWidth="2" strokeDasharray={points[i].actual < points[i].plan ? '3 2' : undefined}/>
                        <circle cx={x} cy={actualY} r="3" fill="#0b6bff"/>
                    </g>)}
                    <path d={chart.plan} fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="7 6" strokeLinecap="round" />
                    <path d={chart.fact} fill="none" stroke="#0b6bff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    {chart.forecast ? <path d={chart.forecast} fill="none" stroke="#0b6bff" strokeWidth="4"
                        strokeDasharray="10 8" strokeLinecap="round" strokeLinejoin="round" /> : null}
                    </>}
                </svg>
            </div>
            </div>
            <div className="metric-bi-table" role="table" aria-label="Данные по месяцам"
                onPointerLeave={scheduleClear} onPointerMove={event => {
                    if (event.pointerType === 'touch') return;
                    const cell = event.target.closest('[data-month]');
                    if (!cell) { scheduleClear(); return; }
                    cancelClear(); setHoverIndex(Number(cell.dataset.month)); setSource('table');
                }}>
                <div className="metric-bi-table-row metric-bi-month-row" role="row" style={grid}>
                    <div className="metric-bi-cell" role="cell">Месяц</div>
                    {points.map((point, index) => <div className="metric-bi-cell" data-forecast={point.isForecast || undefined} data-month={index}
                        role="columnheader" key={point.month}>{point.month}</div>)}
                </div>
                {['План', 'Факт', ...(forecast ? ['Прогноз'] : []), 'Отклонение'].map(label =>
                    <div className="metric-bi-table-row" role="row" style={grid} key={label} data-forecast-row={label === 'Прогноз' || undefined}>
                        <div role="rowheader" className="metric-bi-cell">{label}</div>
                        {points.map((p, i) => {
                            const delta = p.actual - p.plan;
                            const value = label === 'План' ? p.plan : label === 'Отклонение' ? delta
                                : (label === 'Прогноз') === p.isForecast ? p.actual : null;
                            return <div role="cell" key={p.month} data-month={i} className="metric-bi-cell">
                                {value === null ? '—' : (label === 'Отклонение' && delta > 0 ? '+' : '') + formatMetricValue(value)}
                            </div>;
                        })}
                    </div>)}
            </div>
            <div className="bi-selection-track" aria-hidden="true">
                <div className="metric-bi-highlight" style={{opacity: source && hoverIndex !== null ? 1 : 0,
                    left: `${(hoverIndex ?? 0) * 100 / points.length}%`, width: `${100 / points.length}%`}} />
            </div></div></div></div>
        </section>
    </div>;
}
