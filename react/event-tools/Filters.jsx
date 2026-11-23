import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../ui/Icon.jsx';
import { CloseButton } from '../ui/LightlineButton.jsx';
import { useAnimatedDialog } from '../ui/useAnimatedDialog.js';
import './event-tools.css';

const priorities = [
    ['all', 'Все'],
    ['high', 'Высокий приоритет'],
    ['low', 'Остальные события'],
];
const periods = [
    ['', 'Все время'],
    ['today', 'Сегодня'],
    ['week', 'Неделя'],
    ['month', 'Месяц'],
    ['custom', 'Дата / Период'],
];
const defaults = { sources: [], priority: 'all', period: '', metrics: [] };
const groups = [
    ['source', 'Источники', 'layers'], ['priority', 'Приоритет', 'circle-alert'],
    ['time', 'Период', 'calendar'], ['metric', 'Метрики', 'network'],
];
const normalize = (value) => value.trim().toLocaleLowerCase('ru-RU');

function FilterSection({ name, title, count, onReset, children }) {
    return (
        <section className="fd-filter-block" aria-labelledby={`fd-label-${name}`}>
            <div className="fd-block-header">
                <div className="fd-acc-left" id={`fd-label-${name}`}>{title}</div>
                <div className="fd-acc-right">
                    <span className={`fd-badge ${count ? 'visible' : ''}`} aria-hidden="true">{count}</span>
                    <button type="button" className={`fd-reset-btn ${count ? 'visible' : ''}`}
                        onClick={onReset} disabled={!count} aria-label={`Сбросить: ${title}`}>
                        Сбросить
                    </button>
                </div>
            </div>
            <div className="fd-block-body">
                <div className="fd-inner">{children}</div>
            </div>
        </section>
    );
}

function FilterSearch({ label, query, onChange }) {
    return (
        <div className="fd-search-box">
            <Icon name="search" />
            <input type="search" placeholder={label} aria-label={label}
                value={query} onChange={(event) => onChange(event.target.value)} />
        </div>
    );
}

function RadioOptions({ name, options, value, onChange }) {
    return (
        <div className="fd-item-list">
            {options.map(([id, label]) => (
                <label className="fd-radio-label" key={id}>
                    <input type="radio" name={name} value={id} checked={value === id}
                        onChange={() => onChange(id)} />
                    <span>{label}</span>
                </label>
            ))}
        </div>
    );
}

function filterBranch(node, query) {
    if (!node) return null;
    const ownMatch = normalize(node.name).includes(query);
    const children = (node.children ?? [])
        .map((child) => filterBranch(child, ownMatch ? '' : query))
        .filter(Boolean);
    return ownMatch || children.length ? { node, children } : null;
}

function collectBranchIds(node) {
    return [node.id, ...(node.children ?? []).flatMap(collectBranchIds)];
}

function MetricFilterNode({ level = 0, branch, selected, collapsed, onSelect, onToggle }) {
    const { node, children } = branch;
    const hasChildren = children.length > 0;
    const expanded = hasChildren && !collapsed.has(node.id);
    const descendantsId = `fd-metric-children-${node.id}`;
    const checkboxId = `fd-metric-${node.id}`;

    const memberIds = collectBranchIds(node);
    const checked = memberIds.every(id => selected.has(id));
    const mixed = !checked && memberIds.some(id => selected.has(id));
    return (
        <li className="fd-tree-item">
            <div className={`metric-tree-row fd-select-row${checked ? ' is-selected' : ''}`}>
                {hasChildren ? <button className="metric-tree-toggle" type="button" aria-expanded={expanded}
                    aria-controls={descendantsId} aria-label={`${expanded ? 'Свернуть' : 'Развернуть'}: ${node.name}`}
                    onClick={() => onToggle(node.id)}><Icon name={expanded ? 'chevron-down' : 'chevron-right'} /></button>
                    : <span className="metric-tree-toggle-placeholder" />}
                <span className="metric-tree-branch-icon"><Icon name={node.children?.length ? (expanded ? 'folder-open' : 'folder') : 'file-chart-column'} /></span>
                <label className="fd-node-label" htmlFor={checkboxId}>
                    {level > 0 && <span aria-hidden="true" className={`metric-tree-impact is-${node.budgetImpact === '-' ? 'negative' : 'positive'}`}>{node.budgetImpact === '-' ? '−' : '+'}</span>}
                    {node.name}
                </label>
                <input type="checkbox" id={checkboxId} name="fd-metric" value={node.id}
                    ref={el => { if (el) el.indeterminate = mixed; }} checked={checked}
                    onChange={() => onSelect(node, !checked)} />
            </div>
            {hasChildren && (
                <div className={`metric-tree-branch${expanded ? ' is-expanded' : ''}`}
                    id={descendantsId} aria-hidden={!expanded} inert={!expanded}>
                    <div className="metric-tree-branch-inner fd-tree-children">
                        <ul className="fd-tree">
                            {children.map((child) => (
                                <MetricFilterNode level={level + 1} key={child.node.id} branch={child} selected={selected}
                                    collapsed={collapsed} onSelect={onSelect} onToggle={onToggle} />
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </li>
    );
}

export default function Filters({ filters, metrics, sources, onApply, onClose, source }) {
    const [draft, setDraft] = useState(() => ({
        sources: filters.sources ?? defaults.sources,
        priority: filters.priority ?? defaults.priority,
        period: filters.period ?? defaults.period,
        metrics: filters.metrics ?? defaults.metrics,
    }));
    const [active, setActive] = useState('source');
    const [sourceQuery, setSourceQuery] = useState('');
    const [metricQuery, setMetricQuery] = useState('');
    const [collapsed, setCollapsed] = useState(() => new Set());
    const { dialogRef: panelRef, backdropRef, dismiss } = useAnimatedDialog({ onClose, source });
    const close = () => dismiss();
    const normalizedSource = normalize(sourceQuery);
    const normalizedMetric = normalize(metricQuery);
    const visibleSources = sources.filter((source) => normalize(source.name).includes(normalizedSource));
    const branch = useMemo(() => filterBranch(metrics, normalizedMetric), [metrics, normalizedMetric]);
    const selectedMetrics = useMemo(() => new Set(draft.metrics), [draft.metrics]);
    const priorityCount = Number(draft.priority !== defaults.priority);
    const periodCount = Number(draft.period !== defaults.period);
    const totalCount = draft.sources.length + priorityCount + periodCount + draft.metrics.length;

    const counts = { source: draft.sources.length, priority: priorityCount, time: periodCount, metric: draft.metrics.length };
    const appliedCount = filters.sources.length + filters.metrics.length + Number(filters.priority !== defaults.priority) + Number(Boolean(filters.period));

    function updateDraft(name, value) {
        setDraft((previous) => ({ ...previous, [name]: value }));
    }

    function toggleSource(id, checked) {
        setDraft((previous) => ({
            ...previous,
            sources: checked ? [...previous.sources, id] : previous.sources.filter((value) => value !== id),
        }));
    }

    function toggleMetric(node, checked) {
        const ids = new Set(collectBranchIds(node));
        setDraft((previous) => ({
            ...previous,
            metrics: checked
                ? [...new Set([...previous.metrics, ...ids])]
                : previous.metrics.filter((id) => !ids.has(id)),
        }));
    }

    function toggleBranch(id) {
        setCollapsed((previous) => {
            const next = new Set(previous);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    return createPortal(
        <>
            <div id="filter-drawer-overlay" className="filter-drawer-overlay active" ref={backdropRef} data-dialog-motion
                aria-hidden="true" onClick={close} />
            <div id="filter-drawer" className="filter-drawer active react-filter-drawer" ref={panelRef} data-dialog-motion
                role="dialog" aria-modal="true" aria-labelledby="fd-title" tabIndex={-1}>
                <header className="fd-header">
                    <div className="fd-heading"><h2 data-dialog-title id="fd-title">Фильтры</h2>
                        <span id="fd-total-count" aria-label={`Применено условий: ${appliedCount}`}>{appliedCount}</span>
                    </div>
                    <CloseButton onClick={close} />
                </header>
                <div className="fd-workspace">
                    <nav className="fd-nav" aria-label="Разделы фильтра">{groups.map(([id, title, icon]) =>
                        <button key={id} type="button" aria-current={active === id ? 'true' : undefined}
                            onClick={() => setActive(id)}><Icon name={icon} />{title}{counts[id] > 0 && <b>{counts[id]}</b>}</button>)}</nav>
                    <div key={active} className="fd-content" id="fd-accordions-container">
                    {active === 'source' && <FilterSection name="source" title="Источник события" count={draft.sources.length}
                        onReset={() => updateDraft('sources', defaults.sources)}>
                        <FilterSearch label="Укажите источник" query={sourceQuery} onChange={setSourceQuery} />
                        <div className="fd-item-list" id="list-source">
                            {visibleSources.map((source) => (
                                <label className="fd-checkbox-label" key={source.id}>
                                    <input type="checkbox" name="fd-source" value={source.id}
                                        checked={draft.sources.includes(source.id)}
                                        onChange={(event) => toggleSource(source.id, event.target.checked)} />
                                    <span>{source.name}</span>
                                </label>
                            ))}
                            {!visibleSources.length && <p className="fd-empty">Источники не найдены</p>}
                        </div>
                    </FilterSection>}
                    {active === 'priority' && <FilterSection name="priority" title="Приоритет" count={priorityCount}
                        onReset={() => updateDraft('priority', defaults.priority)}>
                        <RadioOptions name="fd-priority" options={priorities} value={draft.priority}
                            onChange={(value) => updateDraft('priority', value)} />
                    </FilterSection>}
                    {active === 'time' && <FilterSection name="time" title="Время" count={periodCount}
                        onReset={() => updateDraft('period', defaults.period)}>
                        <RadioOptions name="fd-time" options={periods} value={draft.period}
                            onChange={(value) => updateDraft('period', value)} />
                    </FilterSection>}
                    {active === 'metric' && <FilterSection name="metric" title="Метрика" count={draft.metrics.length}
                        onReset={() => updateDraft('metrics', defaults.metrics)}>
                        <FilterSearch label="Укажите метрику" query={metricQuery} onChange={(value) => {
                            setMetricQuery(value);
                            setCollapsed(new Set());
                        }} />
                        <div className="fd-tree-container">
                            {branch ? (
                                <ul className="fd-tree">
                                    <MetricFilterNode branch={branch} selected={selectedMetrics} collapsed={collapsed}
                                        onSelect={toggleMetric} onToggle={toggleBranch} />
                                </ul>
                            ) : <p className="fd-empty">Метрики не найдены</p>}
                        </div>
                    </FilterSection>}
                </div>
                </div>
                <footer className="fd-footer">
                    <button type="button" className="btn-fd-ghost" disabled={!totalCount} onClick={() => setDraft(defaults)}>Сбросить всё</button>
                    <div className="fd-footer-right">
                        <button type="button" className="ai-btn-secondary" onClick={close}>Отмена</button>
                        <button type="button" className="btn-fd-apply" onClick={() => dismiss(onClose, () => onApply(draft))}>Применить</button>
                    </div>
                </footer>
            </div>
        </>,
        document.body
    );
}
