import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import Icon from './ConstructionIcon.jsx';
import ConstructionTable from './ConstructionTable.jsx';

const columns = ['disclosure', 'object', 'type', 'readiness', 'delta', 'risk', 'update', 'actions'];

function Risk({ risk }) {
    const label = risk.count ? `${risk.count} ${risk.count === 1 ? 'риск' : 'рисков'}` : 'Рисков нет';
    return (
        <span className={`dcs-risk is-${risk.tone}`} aria-label={label}>
            <span className="dcs-risk-indicator">{risk.count ? '!' : <Icon name="check" size={10} />}</span>
            <b>{risk.count}</b>
            {risk.flagged && <span className="dcs-risk-star"><Icon name="star" size={17} /></span>}
        </span>
    );
}

function TableState({ state, onRetry }) {
    if (state === 'loading') return (
        <><Icon name="loader-circle" size={23} className="dcs-spin" /><strong>Загружаем объекты</strong><span>Обновляем показатели выбранного проекта.</span></>
    );
    if (state === 'error') return (
        <><Icon name="triangle-alert" size={23} /><strong>Таблица временно недоступна</strong>
            <span>Повторите загрузку, данные других блоков сохранены.</span><button type="button" onClick={onRetry}>Повторить</button></>
    );
    return <><Icon name="building-2" size={23} /><strong>Объекты не найдены</strong><span>Для выбранного проекта пока нет подключенных объектов.</span></>;
}

function ObjectActions({ object, menuOpen, setMenu, onOpen, onCopy }) {
    const trigger = useRef(null);
    const menuItem = useRef(null);
    useLayoutEffect(() => { if (menuOpen) menuItem.current?.focus({ preventScroll: true }); }, [menuOpen]);

    function closeMenu() {
        setMenu(null);
        trigger.current.focus({ preventScroll: true });
    }

    return (
        <span className="dcs-actions-layout">
            <button className="dcs-open-button" type="button" onClick={onOpen}>Открыть</button>
            <span className="dcs-row-menu-wrap">
                <button className="dcs-menu-button" type="button" aria-haspopup="menu" aria-expanded={menuOpen} ref={trigger}
                    aria-label={`Меню: ${object.name}`} onClick={() => setMenu(menuOpen ? null : object.id)}>
                    <Icon name="ellipsis-vertical" size={19} />
                </button>
                {menuOpen && <span className="dcs-row-menu" role="menu" onKeyDown={event => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        closeMenu();
                    }
                }}>
                    <button type="button" role="menuitem" ref={menuItem} onClick={() => { closeMenu(); onCopy(); }}>
                        <Icon name="copy" size={16} />Скопировать ссылку
                    </button>
                </span>}
            </span>
        </span>
    );
}

export default function SummaryTable({ model, active, loading, error, archive, menuId, setMenu, onObject, onCopy, onRetry }) {
    const [expandedIds, setExpandedIds] = useState(() => new Set());
    const objects = model.objects || [];
    const state = loading ? 'loading' : error ? 'error' : objects.length ? 'ready' : 'empty';

    function toggle(id) {
        setExpandedIds(current => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    return (
        <section className="dcs-table-card" aria-labelledby="dcs-table-title">
            <div className="dcs-table-title">
                <div><h2 id="dcs-table-title">Объекты строительства</h2><span>{objects.length} объектов</span></div>
                {archive && <span className="dcs-readonly-chip"><Icon name="lock" size={15} />Архивный снимок</span>}
            </div>
            <ConstructionTable prefix="dcs" labelId="dcs-table-title" active={active}>
                <table className="dcs-objects-table sct-table">
                    <caption className="dcs-sr-only">Сводные показатели объектов проекта {model.project?.name}</caption>
                    <colgroup>{columns.map(column => <col className={`dcs-col-${column}`} key={column} />)}</colgroup>
                    <thead><tr>
                        <th scope="col" className="dcs-sticky-disclosure"><span className="dcs-sr-only">Раскрытие</span></th>
                        <th scope="col" className="dcs-sticky-name">Объект</th><th scope="col">Тип</th>
                        <th scope="col">Строительная готовность</th><th scope="col">Динамика за неделю</th>
                        <th scope="col">Риски</th><th scope="col">Последнее обновление</th><th scope="col">Действия</th>
                    </tr></thead>
                    <tbody>
                        {state !== 'ready' ? (
                            <tr><td colSpan={8} className="dcs-table-state"><div><TableState state={state} onRetry={onRetry} /></div></td></tr>
                        ) : objects.map(object => {
                            const expanded = expandedIds.has(object.id);
                            const delta = object.weeklyDeltaPercent;
                            return (
                                <Fragment key={object.id}>
                                    <tr className="dcs-object-row">
                                        <td className="dcs-sticky-disclosure">
                                            <button type="button" className="dcs-disclosure-button" aria-expanded={expanded}
                                                aria-label={`${expanded ? 'Свернуть' : 'Развернуть'} ${object.name}`} onClick={() => toggle(object.id)}>
                                                <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={16} />
                                            </button>
                                        </td>
                                        <th scope="row" className="dcs-sticky-name">
                                            <span className="dcs-object-name-icon"><Icon name={object.icon || 'building-2'} size={19} /></span><span>{object.name}</span>
                                        </th>
                                        <td>{object.typeLabel}</td>
                                        <td>
                                            <span className="dcs-progress">
                                                <b>{object.readinessPercent}%</b>
                                                <span role="progressbar" aria-label={`Строительная готовность: ${object.name}`}
                                                    aria-valuemin={0} aria-valuemax={100} aria-valuenow={object.readinessPercent}>
                                                    <i style={{ width: `${object.readinessPercent}%` }} />
                                                </span>
                                            </span>
                                        </td>
                                        <td><span className={`dcs-delta is-${delta < 0 ? 'negative' : delta > 0 ? 'positive' : 'neutral'}`}>
                                            <Icon name={delta < 0 ? 'arrow-down' : delta > 0 ? 'arrow-up' : 'minus'} size={17} /><b>{delta > 0 ? '+' : ''}{delta}%</b>
                                        </span></td>
                                        <td><Risk risk={object.risk} /></td>
                                        <td>{object.lastUpdatedAt}</td>
                                        <td className="dcs-actions-cell">
                                            <ObjectActions object={object} menuOpen={menuId === object.id} setMenu={setMenu}
                                                onOpen={() => onObject(object)} onCopy={() => onCopy(object.name)} />
                                        </td>
                                    </tr>
                                    {expanded && <tr className="dcs-expanded-row"><td /><td colSpan={7}><div><strong>{object.name}</strong><span>{object.detail}</span></div></td></tr>}
                                </Fragment>
                            );
                        })}
                    </tbody>
                    <tfoot><tr><td colSpan={8} aria-hidden="true" /></tr></tfoot>
                </table>
            </ConstructionTable>
        </section>
    );
}
