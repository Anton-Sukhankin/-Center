import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../ui/Icon.jsx';
import { CloseButton } from '../ui/LightlineButton.jsx';
import { SegmentedButton, SegmentedControl } from '../ui/SegmentedControl.jsx';
import { formatMetricValue } from '../bi/chartModel.js';
import { closeAnimatedSurface, useAnimatedDialog } from '../ui/useAnimatedDialog.js';
import { useStructureWidth } from './useStructureWidth.js';
import '../../src/features/metrics/metric-drawer.css';

function MetricNode({ metric, level, collapsed, onToggle, onOpenMetric, selectedMetricId }) {
    const { id, name = 'Метрика', budgetImpact } = metric;
    const children = Array.isArray(metric.children) ? metric.children : [];
    const hasChildren = children.length > 0;
    const expanded = hasChildren && !collapsed.has(id);
    const selected = id === selectedMetricId;
    const negative = budgetImpact === '-';
    const impactLabel = negative ? 'отрицательное' : 'положительное';
    const branchId = `metric-tree-branch-${id}`;

    return (
        <li className="metric-tree-item" data-level={level} role="treeitem"
            aria-level={level + 1} aria-expanded={hasChildren ? expanded : undefined}
            aria-selected={selected} aria-label={name}>
            <div className={`metric-tree-row${selected ? ' is-selected' : ''}`}>
                {hasChildren ? (
                    <button className="metric-tree-toggle" type="button" data-metric-action="toggle"
                        data-metric-id={id} aria-label={`${expanded ? 'Свернуть' : 'Развернуть'}: ${name}`}
                        aria-controls={branchId} aria-expanded={expanded} onClick={() => onToggle(id)}>
                        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} />
                    </button>
                ) : <span className="metric-tree-toggle-placeholder" aria-hidden="true" />}
                <span className="metric-tree-branch-icon" aria-hidden="true">
                    <Icon name={hasChildren ? (expanded ? 'folder-open' : 'folder') : 'file-chart-column'} />
                </span>
                <button className="metric-tree-select" id={`metric-tree-select-${id}`} type="button"
                    data-metric-action="chart" data-metric-id={id}
                    aria-label={`Открыть график: ${name}`}
                    aria-description={level > 0 ? `Влияние ${impactLabel}` : undefined}
                    title="Открыть график" onClick={() => onOpenMetric(id)}>
                    <span className="metric-tree-select-content">
                        {level > 0 ? (
                            <span className={`metric-tree-impact is-${negative ? 'negative' : 'positive'}`} aria-hidden="true">
                                {negative ? '−' : '+'}
                            </span>
                        ) : null}
                        <span className="metric-tree-label">{name}</span>
                    </span>
                </button>
            </div>
            {hasChildren ? (
                <div className={`metric-tree-branch${expanded ? ' is-expanded' : ''}`}
                    id={branchId} data-metric-branch={id} aria-hidden={!expanded} inert={!expanded}>
                    <div className="metric-tree-branch-inner">
                        <ul className="metric-tree-children" role="group">
                            {children.map(child => (
                                <MetricNode key={child.id} metric={child} level={level + 1}
                                    collapsed={collapsed} onToggle={onToggle} onOpenMetric={onOpenMetric}
                                    selectedMetricId={selectedMetricId} />
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}
        </li>
    );
}

function collectRows(metric, parentName, rows) {
    if (!metric) return rows;
    rows.push({ metric, parentName });
    metric.children?.forEach(child => collectRows(child, metric.name, rows));
    return rows;
}
const normalize = text => text.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');

export default function MetricTree({ open = true, ...props }) {
    const [requestedWidth, setRequestedWidth] = useState(null);
    return open ? <MetricModule {...props} requestedWidth={requestedWidth} onWidthChange={setRequestedWidth} /> : null;
}

function MetricModule({ metrics, onClose, onOpenMetric, selectedMetricId, onCloseChart, children: chart, source, requestedWidth, onWidthChange }) {
    const [collapsed, setCollapsed] = useState(() => new Set());
    const [mode, setMode] = useState('tree');
    const [query, setQuery] = useState('');
    const rows = useMemo(() => collectRows(metrics, '', []), [metrics]);
    const term = normalize(query);
    const matches = mode === 'register' ? rows.filter(({ metric }) => normalize(metric.name).includes(term)) : [];
    const rootCollapsed = collapsed.has(metrics?.id);
    const paired = Boolean(chart);
    const { dialogRef, backdropRef, dismiss } = useAnimatedDialog({
        onClose, source, onEscape: closeTop, surfaceSelector: '#metric-drawer', companionSelector: '.metric-bi-dialog'
    });
    const sizing = useStructureWidth(dialogRef, paired, requestedWidth, onWidthChange);
    function selectMetric(id) {
        if (!paired) sizing.preparePair();
        onOpenMetric(id);
    }
    function closeTop() {
        if (paired) closeAnimatedSurface(dialogRef.current?.querySelector('.metric-bi-dialog'), onCloseChart);
        else dismiss();
    }
    const viewport = useRef(null), thumb = useRef(null);
    const wasPaired = useRef(false);
    useLayoutEffect(() => {
        if (wasPaired.current && !paired && !dialogRef.current.contains(document.activeElement)) {
            const selected = viewport.current.querySelector('[aria-current="true"], [aria-selected="true"] > .metric-tree-row .metric-tree-select');
            const target = selected && !selected.closest('[inert]') ? selected : dialogRef.current.querySelector('.metric-module-tools button');
            target?.focus({ preventScroll: true });
        }
        wasPaired.current = paired;
    }, [paired, dialogRef]);

    useLayoutEffect(() => {
        const view = viewport.current, marker = thumb.current;
        view.scrollTop = 0;
        let timer;
        function sync() {
            const { clientHeight: height, scrollHeight: total, scrollTop } = view;
            const size = Math.min(height, Math.max(24, height * height / total));
            marker.style.height = size + 'px';
            marker.style.transform = 'translateY(' + (scrollTop / Math.max(1, total - height) * (height - size)) + 'px)';
        }
        function onWheel(e) {
            if (e.ctrlKey || !e.deltaY || view.scrollHeight <= view.clientHeight ||
                (e.deltaY < 0 ? view.scrollTop <= 0 : view.scrollTop + view.clientHeight >= view.scrollHeight - 1)) return;
            sync();
            marker.classList.add('is-visible');
            clearTimeout(timer);
            timer = setTimeout(() => marker.classList.remove('is-visible'), 650);
        }
        view.addEventListener('wheel', onWheel, { passive: true });
        view.addEventListener('scroll', sync, { passive: true });
        return () => {
            clearTimeout(timer);
            marker.classList.remove('is-visible');
            view.removeEventListener('wheel', onWheel);
            view.removeEventListener('scroll', sync);
        };
    }, [mode, query]);

    useLayoutEffect(() => {
        document.body.classList.add('metric-tree-open');
        return () => document.body.classList.remove('metric-tree-open');
    }, []);

    function toggleBranch(id) {
        setCollapsed(previous => {
            const next = new Set(previous);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function moveBetweenRows(event) {
        const directions = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (!directions.includes(event.key)) return;
        const current = event.target.closest('.metric-tree-row')?.querySelector('.metric-tree-select');
        if (!current) return;
        const rows = [...event.currentTarget.querySelectorAll('.metric-tree-select')].filter(row => !row.closest('[inert]'));
        const currentIndex = rows.indexOf(current);
        const nextIndex = event.key === 'Home' ? 0
            : event.key === 'End' ? rows.length - 1
            : currentIndex + (event.key === 'ArrowUp' ? -1 : 1);
        event.preventDefault();
        rows[Math.max(0, Math.min(nextIndex, rows.length - 1))]?.focus();
    }

    return createPortal(
        <>
            <div id="metric-drawer-overlay" className="metric-drawer-overlay is-open" ref={backdropRef} data-dialog-motion
                aria-hidden="true" onClick={closeTop} />
            <div className={`metric-workspace${paired ? ' is-paired' : ''}`} ref={dialogRef}
                style={sizing.style} data-resizing={sizing.dragging || undefined}
                role="dialog" aria-modal="true" aria-labelledby="metric-drawer-title" tabIndex={-1}>
            <section id="metric-drawer" ref={sizing.drawer} className="navigator-modal active metric-module" aria-labelledby="metric-drawer-title" data-dialog-motion>
                <header className="fd-header">
                    <div className="fd-heading">
                        <h2 data-dialog-title id="metric-drawer-title">Структура метрик</h2>
                    </div>
                    <CloseButton data-metric-drawer-action="close" onClick={() => dismiss()} />
                </header>
                <div className="metric-module-tools">
                    <SegmentedControl aria-label="Представление метрик">
                        <SegmentedButton active={mode === 'tree'} onClick={() => setMode('tree')}>Дерево</SegmentedButton>
                        <SegmentedButton active={mode === 'register'} onClick={() => setMode('register')}>Реестр</SegmentedButton>
                    </SegmentedControl>
                    {mode === 'tree' && metrics?.children?.length > 0 && <button type="button" className="btn-fd-ghost"
                        onClick={() => setCollapsed(new Set(rootCollapsed ? [] : rows.filter(({ metric }) => metric.children?.length).map(({ metric }) => metric.id)))}>
                        {rootCollapsed ? 'Развернуть всё' : 'Свернуть всё'}
                    </button>}
                </div>
                {mode === 'register' && <label className="fd-search-box metric-module-search">
                    <Icon name="search" /><input type="search" aria-label="Поиск по названию метрики" placeholder="Поиск по названию метрики"
                        value={query} onChange={e => setQuery(e.target.value)} />
                </label>}
                <div className="metric-module-body"><div className="metric-module-viewport" ref={viewport}>
                    {mode === 'tree' ? <ul className="metric-tree" id="metric-tree-root" role="tree"
                        aria-label="Дерево финансовых метрик" onKeyDown={moveBetweenRows}>
                        {metrics ? (
                            <MetricNode metric={metrics} level={0} collapsed={collapsed} onToggle={toggleBranch}
                                onOpenMetric={selectMetric} selectedMetricId={selectedMetricId ?? metrics.id} />
                        ) : <li className="metric-tree-empty">Данные метрик недоступны</li>}
                    </ul> : <>
                        <table className="metric-register"><thead><tr><th scope="col">Показатель</th><th scope="col">План</th><th scope="col">Факт</th></tr></thead>
                            <tbody>{matches.map(({ metric, parentName }) => <tr key={metric.id} className={metric.id === selectedMetricId ? 'is-selected' : undefined} onClick={e => {
                                if (e.target.closest('button')) return;
                                const button = e.currentTarget.querySelector('button'); button.focus(); button.click();
                            }}>
                                <td><button type="button" aria-current={metric.id === selectedMetricId || undefined} aria-label={`Открыть график: ${metric.name}`} onClick={() => selectMetric(metric.id)}>
                                    {parentName && <span className={`metric-tree-impact is-${metric.budgetImpact === '-' ? 'negative' : 'positive'}`}>{metric.budgetImpact === '-' ? '−' : '+'}</span>}
                                    {metric.name}</button><small>{parentName || 'Итог проекта'}</small></td>
                                <td>{formatMetricValue(metric.plan)}</td><td>{formatMetricValue(metric.fact)}</td>
                            </tr>)}</tbody>
                        </table>
                        {!matches.length && <p className="metric-tree-empty" role="status">{rows.length ? 'Метрики не найдены. Попробуйте другое название.' : 'Данные метрик недоступны'}</p>}
                    </>}
                </div>
                <span className="metric-scroll-thumb" ref={thumb} aria-hidden="true" /></div>
                <div className="metric-structure-resize" role="separator" aria-orientation="vertical"
                    aria-label="Ширина структуры метрик" aria-controls="metric-drawer" title="Потяните, чтобы изменить ширину"
                    tabIndex={0} {...sizing.handle} />
            </section>
            {chart}
            </div>
        </>, document.body
    );
}
