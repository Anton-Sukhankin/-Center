import { useMemo, useRef, useState } from 'react';
import Icon from './ConstructionIcon.jsx';
import { CloseButton } from '../ui/LightlineButton.jsx';
import { useAnimatedDialog } from '../ui/useAnimatedDialog.js';
import ConstructionObjectSelector from './ConstructionObjectSelector.jsx';
import ConstructionTable from './ConstructionTable.jsx';
import useAnnouncement from './useAnnouncement.js';

const EMPTY_FILTERS = { status: 'all', contractor: 'all', search: '' };
const STATUSES = {
    'not-started': { label: 'Не начато', tone: 'neutral' },
    'in-progress': { label: 'В работе', tone: 'positive' },
    'on-schedule': { label: 'По графику', tone: 'info' },
    completed: { label: 'Завершено', tone: 'neutral' },
    delayed: { label: 'Отстаёт', tone: 'warning' }
};
const dateFormat = new Intl.DateTimeFormat('ru-RU');
const numberFormat = new Intl.NumberFormat('ru-RU');
const COLUMNS = ['disclosure', 'name', 'type', 'weight', 'date', 'date', 'contractor', 'progress', 'status', 'actions'];
const CSV_HEADER = ['Наименование', 'Тип', 'Вес, %', 'Плановый срок с', 'Плановый срок по',
    'Подрядчик / поставщик', 'Степень готовности, факт', 'Статус'];

function isGroup(row) {
    return row.depth === 0;
}

function statusMeta(row) {
    return STATUSES[row.status] || STATUSES['not-started'];
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
}

function toCard(object) {
    const progress = object.actualProgressPercent;
    const deviation = progress - object.cardPlanProgressPercent;
    return {
        ...object,
        descriptionLabel: object.cardStructureLabel || object.structureLabel,
        progressPercent: progress,
        deviationTone: deviation < 0 ? 'behind' : 'on-plan',
        deviationLabel: deviation === 0 ? 'По плану' : `${deviation > 0 ? '+' : ''}${deviation} п.п. к плану`
    };
}

function groupRows(rows) {
    const childrenByGroup = new Map();
    const groups = [];
    for (const row of rows) {
        if (isGroup(row)) groups.push(row);
        else {
            if (!childrenByGroup.has(row.parentId)) childrenByGroup.set(row.parentId, []);
            childrenByGroup.get(row.parentId).push(row);
        }
    }
    return groups.map(group => ({ group, children: childrenByGroup.get(group.id) || [] }));
}

function filterGroups(groups, filters, quickStatus) {
    const query = filters.search.trim().toLocaleLowerCase('ru');
    const matches = row =>
        (quickStatus === 'all' || row.status === quickStatus)
        && (filters.status === 'all' || row.status === filters.status)
        && (filters.contractor === 'all' || row.contractorName === filters.contractor)
        && (!query || `${row.code} ${row.name} ${row.contractorName ?? ''}`.toLocaleLowerCase('ru').includes(query));
    return groups.flatMap(({ group, children }) => {
        const matchingChildren = children.filter(matches);
        return matches(group) || matchingChildren.length ? [{ group, children: matchingChildren }] : [];
    });
}

function StatusOptions({ allLabel }) {
    return (
        <>
            <option value="all">{allLabel}</option>
            {Object.entries(STATUSES).map(([id, { label }]) => <option key={id} value={id}>{label}</option>)}
        </>
    );
}

function ObjectParameters({ object, children }) {
    const parameters = [
        ['primary-structure', object.floorLabel || object.primaryStructureLabel || 'Этажность', object.floorCount ?? object.primaryStructureValue ?? '—'],
        ['secondary-structure', object.sectionLabel || object.secondaryStructureLabel || 'Секции', object.sectionCount ?? object.secondaryStructureValue ?? '—'],
        ['area', 'Площадь здания', `${numberFormat.format(object.areaSquareMeters ?? object.area)} м²`],
        ['start', 'Начало работ', formatDate(object.workStart || object.plannedStart)],
        ['completion', 'Плановая сдача', formatDate(object.plannedCompletion || object.plannedEnd)]
    ];
    return (
        <section className="obj-object-summary" aria-label={`Параметры и инструменты объекта ${object.name}`}>
            <dl className="obj-object-parameters">
                {parameters.map(([id, label, value]) => <div key={id} className={`obj-parameter-item is-${id}`}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            {children}
        </section>
    );
}

function WorksRow({ row, expanded, onToggle, onActions }) {
    const group = isGroup(row);
    const title = `${row.code}. ${row.name}`;
    const status = statusMeta(row);
    const progress = Math.max(0, Math.min(100, Number(row.actualProgressPercent) || 0));
    return (
        <tr className={group ? 'obj-group-row' : 'obj-child-row'}>
            <td className="obj-disclosure-cell obj-sticky-disclosure">
                {group && row.hasChildren !== false && (
                    <button type="button" className="obj-disclosure-button" aria-expanded={expanded}
                        aria-label={`${expanded ? 'Свернуть' : 'Развернуть'} группу ${row.name}`} onClick={onToggle}>
                        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={16} />
                    </button>
                )}
            </td>
            <th scope="row" className="obj-name-cell obj-sticky-name">
                <div className={`obj-name-content obj-depth-${group ? 0 : 1}`}>
                    <span className="obj-row-kind-icon"><Icon name={group ? 'folder' : 'file-text'} size={group ? 19 : 17} /></span>
                    <span className="obj-row-name-text" title={title}><b>{row.code}.</b> {row.name}</span>
                </div>
            </th>
            <td>{group ? 'Группа работ' : 'Вид работ'}</td>
            <td>{Number(row.weightPercent || 0).toFixed(2).replace('.', ',')}</td>
            <td>{formatDate(row.plannedStart)}</td>
            <td>{formatDate(row.plannedEnd)}</td>
            <td className="obj-contractor-cell"><span className="obj-cell-ellipsis" title={row.contractorName}>{row.contractorName}</span></td>
            <td>
                <div className="obj-progress">
                    <span className="obj-progress-value">{progress}%</span>
                    <span className="obj-progress-track" role="progressbar" aria-label={`Фактическая готовность: ${title}`}
                        aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                        <span className="obj-progress-fill" style={{ width: `${progress}%` }} />
                    </span>
                </div>
            </td>
            <td><span className={`obj-status-chip is-${status.tone}`}>{status.label}</span></td>
            <td className="obj-row-actions-cell">
                <button type="button" className="obj-row-actions-button" aria-label={`Действия: ${title}`} title="Действия" onClick={() => onActions(title)}>
                    <Icon name="ellipsis-vertical" size={18} />
                </button>
            </td>
        </tr>
    );
}

function WorksTable({ object, groups, expanded, active, toggleGroup, onActions, onReset }) {
    const rows = groups.flatMap(({ group, children }) => expanded.has(group.id) ? [group, ...children] : [group]);
    return (
        <section className="obj-works-panel" aria-labelledby="obj-works-panel-title">
            <ConstructionTable prefix="obj" labelId="obj-works-panel-title" active={active}>
                <table className="obj-works-table sct-table">
                    <caption className="obj-sr-only" id="obj-works-panel-title">Работы по объекту {object.name}</caption>
                    <colgroup>{COLUMNS.map((name, index) => <col className={`obj-col-${name}`} key={`${name}-${index}`} />)}</colgroup>
                    <thead>
                        <tr>
                            <th rowSpan={2} scope="col" className="obj-disclosure-cell obj-sticky-disclosure"><span className="obj-sr-only">Раскрытие группы</span></th>
                            <th rowSpan={2} scope="col" className="obj-sticky-name obj-name-header">Наименование</th>
                            <th rowSpan={2} scope="col">Тип</th>
                            <th rowSpan={2} scope="col">Вес, %</th>
                            <th colSpan={2} scope="colgroup">Плановый срок</th>
                            <th rowSpan={2} scope="col" className="obj-contractor-header">Подрядчик / поставщик</th>
                            <th rowSpan={2} scope="col">Степень готовности</th>
                            <th rowSpan={2} scope="col">Статус</th>
                            <th rowSpan={2} scope="col"><span className="obj-sr-only">Действия</span></th>
                        </tr>
                        <tr><th scope="col"><span aria-label="Плановая дата начала">С</span></th><th scope="col"><span aria-label="Плановая дата окончания">По</span></th></tr>
                    </thead>
                    <tbody>
                        {rows.map(row => <WorksRow key={row.id} row={row} expanded={expanded.has(row.id)} onToggle={() => toggleGroup(row.id)} onActions={onActions} />)}
                        {!rows.length && <tr><td colSpan={10} className="obj-no-results">
                            <div><Icon name="search" size={24} /><strong>Работы не найдены</strong><span>Измените условия или сбросьте фильтры.</span>
                                <button type="button" onClick={onReset}><Icon name="rotate-ccw" size={16} />Сбросить фильтры</button>
                            </div>
                        </td></tr>}
                    </tbody>
                    <tfoot><tr><td colSpan={10} aria-hidden="true" /></tr></tfoot>
                </table>
            </ConstructionTable>
        </section>
    );
}

function FilterDialog({ applied, contractors, onClose, onApply, source }) {
    const [draft, setDraft] = useState(applied);
    const { dialogRef: dialog, backdropRef, dismiss } = useAnimatedDialog({ onClose, source, overlayContainsSurface: true });
    const close = () => dismiss();
    const setField = (name, value) => setDraft(current => ({ ...current, [name]: value }));
    return (
        <div className="obj-filter-backdrop" ref={backdropRef} data-dialog-motion onClick={event => { if (event.target === event.currentTarget) close(); }}>
            <section className="obj-filter-dialog" role="dialog" aria-modal="true" aria-labelledby="obj-filter-title" ref={dialog} tabIndex={-1} data-dialog-motion>
                <header>
                    <div><span className="obj-dialog-icon"><Icon name="filter" size={20} /></span><div>
                        <h2 data-dialog-title id="obj-filter-title">Фильтры работ</h2><p>Настройте выборку и примените изменения</p>
                    </div></div>
                    <CloseButton onClick={close} />
                </header>
                <div className="obj-filter-body">
                    <label><span>Поиск</span><span className="obj-input-with-icon"><Icon name="search" size={17} />
                        <input data-initial-focus type="search" placeholder="Название, код или подрядчик"
                            value={draft.search} onChange={event => setField('search', event.target.value)} />
                    </span></label>
                    <label><span>Статус</span><select value={draft.status} onChange={event => setField('status', event.target.value)}><StatusOptions allLabel="Все статусы" /></select></label>
                    <label><span>Подрядчик / поставщик</span><select value={draft.contractor} onChange={event => setField('contractor', event.target.value)}>
                        <option value="all">Все подрядчики</option>{contractors.map(name => <option key={name} value={name}>{name}</option>)}
                    </select></label>
                </div>
                <footer>
                    <button type="button" className="obj-secondary-button" onClick={() => setDraft(EMPTY_FILTERS)}><Icon name="rotate-ccw" size={16} />Сбросить</button>
                    <div>
                        <button type="button" className="obj-secondary-button" onClick={close}>Отмена</button>
                        <button type="button" className="obj-primary-button" onClick={() => dismiss(onClose, () => onApply({ ...draft, search: draft.search.trim() }))}>Применить</button>
                    </div>
                </footer>
            </section>
        </div>
    );
}

function downloadCsv(object, groups) {
    const rows = groups.flatMap(({ group, children }) => [group, ...children]).map(row => [
        `${row.code}. ${row.name}`, isGroup(row) ? 'Группа работ' : 'Вид работ', row.weightPercent,
        formatDate(row.plannedStart), formatDate(row.plannedEnd), row.contractorName, row.actualProgressPercent, statusMeta(row).label
    ]);
    const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = `\ufeff${[CSV_HEADER, ...rows].map(line => line.map(quote).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `objects-${object.id}-works.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return rows.length;
}

function ObjectWorks({ object, active }) {
    const [quickStatus, setQuickStatus] = useState('all');
    const [applied, setApplied] = useState(EMPTY_FILTERS);
    const [expanded, setExpanded] = useState(() => new Set(object.workRows.filter(isGroup).slice(0, 1).map(row => row.id)));
    const [filterOpen, setFilterOpen] = useState(false);
    const filterSource = useRef(null);
    const [announcement, announce] = useAnnouncement(active, 2800);
    const groups = useMemo(() => groupRows(object.workRows), [object.workRows]);
    const filtered = useMemo(() => filterGroups(groups, applied, quickStatus), [groups, applied, quickStatus]);
    const contractors = useMemo(() => [...new Set(object.workRows.filter(row => !isGroup(row))
        .map(row => row.contractorName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [object.workRows]);
    const count = Number(applied.status !== 'all') + Number(applied.contractor !== 'all') + Number(Boolean(applied.search));

    // Закрываем временный слой при уходе с экрана, сохраняя выбранные фильтры и раскрытие.
    if (!active && filterOpen) setFilterOpen(false);

    function toggleGroup(id) {
        setExpanded(current => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    return (
        <>
            <section className="obj-work-section" id="obj-work-panel" role="tabpanel" aria-labelledby={`obj-object-tab-${object.id}`}>
                <header className="obj-section-header"><h2 id="obj-work-section-title">Группы и виды работ</h2></header>
                <div className="obj-work-body">
                    <ObjectParameters object={object}>
                        <div className="obj-summary-actions" aria-label="Инструменты таблицы">
                            <label className="obj-quick-filter"><span>Показывать:</span>
                                <select aria-label="Быстрый фильтр по статусу" value={quickStatus} onChange={event => setQuickStatus(event.target.value)}>
                                    <StatusOptions allLabel="Все работы" />
                                </select>
                                <Icon name="chevron-down" size={16} />
                            </label>
                            <button className={`obj-toolbar-button${count ? ' has-badge' : ''}`} type="button"
                                aria-haspopup="dialog" aria-expanded={filterOpen}
                                onClick={event => { filterSource.current = event.currentTarget; setFilterOpen(true); }}>
                                <Icon name="filter" size={18} /><span>Фильтры</span>
                                {count > 0 && <b aria-label={`Применено фильтров: ${count}`}>{count}</b>}
                            </button>
                            <button className="obj-toolbar-button is-icon-only" type="button" aria-label="Скачать CSV" title="Скачать CSV"
                                onClick={() => announce(`CSV сформирован: ${downloadCsv(object, filtered)} строк`)}>
                                <Icon name="download" size={19} />
                            </button>
                        </div>
                    </ObjectParameters>
                    <WorksTable object={object} groups={filtered} expanded={expanded} active={active} toggleGroup={toggleGroup}
                        onActions={title => announce(`Действия для «${title}» будут доступны после согласования сценария`)}
                        onReset={() => { setApplied(EMPTY_FILTERS); setQuickStatus('all'); announce('Фильтры сброшены'); }} />
                </div>
            </section>
            {active && filterOpen && <FilterDialog applied={applied} contractors={contractors}
                source={filterSource.current} onClose={() => setFilterOpen(false)}
                onApply={next => { setApplied(next); announce('Фильтры применены'); }} />}
            <div className={`obj-toast${announcement ? ' is-visible' : ''}`} role="status">
                {announcement && <><Icon name="check" size={18} /><span>{announcement}</span></>}
            </div>
        </>
    );
}

function ProjectObjects({ objects, active }) {
    const [selectedId, setSelectedId] = useState(() => objects[0].id);
    const object = objects.find(item => item.id === selectedId) || objects[0];
    const cards = useMemo(() => objects.map(toCard), [objects]);
    return (
        <>
            <section className="obj-object-selector" aria-label="Выбор объекта строительства">
                <ConstructionObjectSelector cards={cards} activeId={object.id} onSelect={setSelectedId} />
            </section>
            <ObjectWorks key={object.id} object={object} active={active} />
        </>
    );
}

export default function Objects({ context, active = true, data }) {
    const model = useMemo(() => data.objectsData.getForContext(context), [data.objectsData, context]);
    const ready = model.status === 'ready' && model.objects.length > 0;
    return (
        <div id="objects-root" hidden={!active}>
            <main className={`obj-workspace${ready ? '' : ' is-unsupported'}`}>
                <header className="obj-view-header"><h1 className="obj-view-title">Объекты</h1></header>
                {ready ? <ProjectObjects key={model.projectId} objects={model.objects} active={active} /> : (
                    <section className="obj-unsupported">
                        <Icon name="info" size={28} /><h2>Объекты недоступны</h2>
                        <p>{model.message || (model.status === 'empty' ? 'Для выбранного проекта нет объектов.' : 'Раздел «Объекты» доступен в контексте проекта или очереди проекта.')}</p>
                    </section>
                )}
            </main>
        </div>
    );
}
