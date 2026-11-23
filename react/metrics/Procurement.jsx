import { useEffect, useId, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { CloseButton } from '../ui/LightlineButton.jsx';
import { SegmentedButton, SegmentedControl } from '../ui/SegmentedControl.jsx';
import { useAnimatedDialog } from '../ui/useAnimatedDialog.js';
import MetricsKpiCard from './MetricsKpiCard.jsx';
import '../../src/features/metrics-dashboard/sections/procurement/procurement-metrics.css';

const summaryStatus = { danger: 'unfavorable', success: 'favorable' };

const summaryTitles = {
    'tender-duration': 'Средний срок тендера',
    'participants-per-lot': 'Участников на лот в среднем'
};

function RiskSummaryHint({ label, description, children }) {
    const hintId = useId();
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (!open) return;
        function dismiss(event) {
            if (event.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', dismiss);
        return () => document.removeEventListener('keydown', dismiss);
    }, [open]);

    return (
        <div className="procurement-summary-risk" role="group" tabIndex={0}
            aria-label={label} aria-describedby={hintId}
            onPointerEnter={event => { if (event.pointerType !== 'touch') setOpen(true); }}
            onPointerLeave={event => { if (!event.currentTarget.matches(':focus-visible')) setOpen(false); }}
            onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
            {children}
            <span className="procurement-summary-risk-hint" role="tooltip" id={hintId} hidden={!open}>
                {description}
            </span>
        </div>
    );
}

const summaryGroups = [
    ['Бюджет и договоры', ['total-budget', 'contracted-budget']],
    ['Отклонения и риски', ['contract-deviation', 'procurement-risk']],
    ['Сроки и конкуренция', ['tender-duration', 'participants-per-lot']]
];

function Summary({ items, risks, riskTotal, durationNorm }) {
    const critical = risks.filter(risk => risk.status === 'Критично').length;
    return (
        <section className="procurement-summary-grid" aria-label="Ключевые показатели закупок">
            {summaryGroups.map(([label, ids]) => (
                <section className="procurement-summary-group" key={label} aria-label={label}>
                    {items.filter(item => ids.includes(item.id)).map(item => {
                        const [, value = item.value, unit] = item.value.match(/^(.*?)(?:\s+(\p{L}.*))?$/u) ?? [];
                        const comparison = item.id === 'tender-duration' && durationNorm ? `при норме ${durationNorm}` : undefined;
                        const isRisk = item.id === 'procurement-risk';
                        const card = <MetricsKpiCard key={item.id} title={summaryTitles[item.id] ?? item.label}
                            sourceLabel={isRisk ? undefined : item.sourceLabel} icon={item.icon}
                            status={summaryStatus[item.tone]} value={value} unit={unit} comparison={comparison} />;
                        return isRisk
                            ? <RiskSummaryHint key={item.id} label={`${item.label}: ${item.value}`}
                                description={`Критичных: ${critical} · Стоимость процедур: ${riskTotal}`}>{card}</RiskSummaryHint>
                            : card;
                    })}
                </section>
            ))}
        </section>
    );
}

function ProcurementTable({ titleId, tableId, className, columns, children }) {
    return (
        <div className="procurement-table-wrap" role="region" aria-labelledby={titleId} tabIndex={0}>
            <table id={tableId} className={`procurement-detail-table ${className}`} aria-labelledby={titleId}>
                <colgroup>{columns.map(column => <col key={column} />)}</colgroup>
                <thead><tr>{columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
                {children}
            </table>
        </div>
    );
}

const budgetColumns = ['Направление', 'Бюджет, млрд ₽', 'Договоры, млрд ₽', 'Доля, %'];
const shareFormatter = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const signedNumberFormatter = new Intl.NumberFormat('ru-RU', { signDisplay: 'exceptZero' });

function signedNumber(value) {
    return signedNumberFormatter.format(value).replace('-', '−');
}

function BudgetAmount({ value, label }) {
    const [, amount = value, unit] = /^(.*?)\s+(млрд\s*₽)$/u.exec(value) ?? [];
    return <strong className="procurement-main-amount" title={label}>{amount}{unit && <> <span className="procurement-amount-unit">{unit}</span></>}</strong>;
}

function BudgetMap({ segments }) {
    // В демо-контракте суммы заданы в млрд ₽, проценты округлены для подписи.
    const weighted = segments.map(segment => {
        const amount = /^([\d\s]+(?:,\d+)?)\s+млрд\s*₽$/u.exec(segment.value ?? '');
        return { ...segment, weight: amount ? Number(amount[1].replace(/\s/g, '').replace(',', '.')) : NaN };
    });
    if (weighted.some(item => !Number.isFinite(item.weight))) {
        return <p className="procurement-map-empty">Нет данных о распределении бюджета</p>;
    }
    const visible = weighted.filter(item => item.weight > 0).sort((a, b) => b.weight - a.weight);
    if (!visible.length) return <p className="procurement-map-empty">Нет сумм для распределения</p>;
    const total = visible.reduce((sum, item) => sum + item.weight, 0);
    const stacked = visible.length === 3 && visible[0].weight >= total * 0.45;
    const track = weight => `minmax(0, ${weight}fr)`;
    const layout = stacked ? {
        gridTemplateColumns: [visible[0].weight, visible[1].weight + visible[2].weight].map(track).join(' '),
        gridTemplateRows: visible.slice(1).map(item => track(item.weight)).join(' ')
    } : { gridTemplateColumns: visible.map(item => track(item.weight)).join(' ') };
    return (
        <div className="procurement-budget-map" style={layout} aria-hidden="true">
            {visible.map(({ label, value, share, style }, index) => (
                <div key={style} className={`procurement-map-tile ${style}`}
                    style={stacked && index === 0 ? { gridRow: 'span 2' } : undefined}>
                    <div className="procurement-map-label">
                        <span>{label}</span>
                        <div className="procurement-map-figures">
                            <strong>{share != null ? `${share}%` : '—'}</strong><small>{value}</small>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function BudgetStructure({ data }) {
    const segments = [
        { label: 'Договоры', value: data.contractedBudget, share: data.contractedShare, style: 'is-contracted' },
        { label: 'Открытые тендеры', value: data.openTenders, share: data.openTendersShare, style: 'is-open' },
        { label: 'Остаток', value: data.remainingBudget, share: data.remainingShare, style: 'is-remaining' }
    ];
    return (
        <div className="procurement-budget-distribution">
            <ul className="procurement-budget-legend" aria-label="Распределение бюджета закупок">
                {segments.map(({ label, value, share, style }) => (
                    <li key={style}><i className={style} aria-hidden="true" />{label} <span>{value ?? 'Нет данных'}{share != null && ` (${share}%)`}</span></li>
                ))}
            </ul>
            <BudgetMap segments={segments} />
        </div>
    );
}

function BudgetRow({ name, budget, contract, share }) {
    return (
        <tr>
            <th scope="row">{name}</th>
            <td>{budget.replace(/\s+млрд\s*₽$/u, '')}</td>
            <td>{contract.replace(/\s+млрд\s*₽$/u, '')}</td>
            <td>{shareFormatter.format(share)}%</td>
        </tr>
    );
}

function Contracting({ data }) {
    return (
        <section className="procurement-detail-section" aria-labelledby="procurement-contracting-title">
            <h2 id="procurement-contracting-title">Контрактация бюджета</h2>
            <div className="procurement-budget-summary">
                <BudgetAmount value={data.totalBudget} label={data.totalBudgetLabel} />
                <BudgetStructure data={data} />
            </div>
            <ProcurementTable titleId="procurement-contracting-title" className="procurement-contracting-table" columns={budgetColumns}>
                <tbody>
                    <BudgetRow name="Работы" budget={data.works.budget} contract={data.works.value} share={data.works.share} />
                    <BudgetRow name="Материалы" budget={data.materials.budget} contract={data.materials.value} share={data.materials.share} />
                </tbody>
                <tfoot>
                    <BudgetRow name="Итого" budget={data.totalBudget} contract={data.contractedBudget} share={data.contractedShare} />
                </tfoot>
            </ProcurementTable>
        </section>
    );
}

const procurementDirections = [
    { id: 'works', label: 'Работы', column: 'Статья (работы)' },
    { id: 'materials', label: 'Материалы', column: 'Статья (материалы)' }
];

const amountFormatter = new Intl.NumberFormat('ru-RU');

function contractPercent(item) {
    return item.budget > 0 && Number.isFinite(item.contract) ? 100 * item.contract / item.budget : null;
}

function ThresholdCard({ item, scale }) {
    const percent = contractPercent(item);
    return (
        <li className="procurement-threshold-card">
            <h3>{item.name}</h3>
            <strong className={percent > 100 ? 'is-negative' : undefined}>{percent == null ? 'Нет базы сравнения' : item.percent}</strong>
            {percent != null && <div className="procurement-threshold-plot" aria-hidden="true"
                style={{ '--limit': `${10000 / scale}%`, '--base': `${Math.max(0, Math.min(100, percent)) / scale * 100}%`,
                    '--excess': `${Math.max(0, percent - 100) / scale * 100}%` }}>
                <div className="procurement-threshold-bar"><i /><b /></div>
                <div className="procurement-threshold-labels"><span>0</span><b>100%</b><span>{scale}%</span></div>
            </div>}
        </li>
    );
}

function FinancialEffect({ effect }) {
    const [direction, setDirection] = useState(procurementDirections[0]);
    const savings = /^[−-]/u.test(effect.absoluteEffect);
    const title = `${savings ? 'Экономия' : 'Превышение'} по всем закупкам`;
    const rows = effect[direction.id];
    const columns = [direction.column, 'Бюджет, млн ₽', 'Договоры, млн ₽', 'Превышение, млн ₽', 'К бюджету, %'];
    const scale = Math.ceil(Math.max(110, ...[...effect.works, ...effect.materials].map(item => contractPercent(item) ?? 0)) / 10) * 10;

    return (
        <section className="procurement-detail-section" aria-labelledby="procurement-financial-title">
            <h2 id="procurement-financial-title">{title}</h2>
            <div className="procurement-overrun-summary">
                <div className={`procurement-overrun-amount ${savings ? 'is-positive' : 'is-negative'}`} title={effect.absoluteEffectLabel}>
                    <BudgetAmount value={effect.absoluteEffect} label={effect.absoluteEffectLabel} />
                    <span className="procurement-overrun-percent" title={effect.deviationLabel}>{effect.deviationPercent}</span>
                </div>
                <SegmentedControl className="procurement-direction-switch" aria-label="Вид закупки">
                    {procurementDirections.map(item => (
                        <SegmentedButton key={item.id} active={direction.id === item.id}
                            aria-controls="procurement-threshold-cards procurement-overrun-table" onClick={() => setDirection(item)}>
                            {item.label}
                        </SegmentedButton>
                    ))}
                </SegmentedControl>
            </div>
            <ul className="procurement-budget-legend procurement-threshold-legend" aria-label="Обозначения шкал">
                <li><i aria-hidden="true" />В пределах бюджета статьи</li>
                <li><i aria-hidden="true" />Превышение бюджета</li>
                <li><i aria-hidden="true" />Порог — 100% бюджета статьи</li>
            </ul>
            <ul className="procurement-threshold-cards" id="procurement-threshold-cards" aria-label={direction.label}>
                {rows.map(item => <ThresholdCard key={item.name} item={item} scale={scale} />)}
            </ul>
            <ProcurementTable titleId="procurement-financial-title" tableId="procurement-overrun-table"
                className="procurement-overrun-table" columns={columns}>
                <tbody>{rows.map(item => (
                    <tr key={item.name}>
                        <th scope="row">{item.name}</th>
                        <td>{amountFormatter.format(item.budget)}</td>
                        <td>{amountFormatter.format(item.contract)}</td>
                        <td>{signedNumber(item.contract - item.budget)}</td>
                        <td>{item.percent}</td>
                    </tr>
                ))}</tbody>
            </ProcurementTable>
        </section>
    );
}

const efficiencyColumns = ['Показатель', 'Факт', 'Норма', 'Δ (к норме)'];

function Efficiency({ items }) {
    return (
        <section className="procurement-detail-section" aria-labelledby="procurement-efficiency-title">
            <h2 id="procurement-efficiency-title">Эффективность закупок</h2>
            <ProcurementTable titleId="procurement-efficiency-title" className="procurement-efficiency-table" columns={efficiencyColumns}>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id}>
                            <th scope="row">{item.label}</th>
                            <td>{item.value}</td>
                            <td>{item.norm}</td>
                            <td>
                                <div className="procurement-efficiency-delta">
                                    <span className={`procurement-tag is-${item.positive ? 'control' : 'attention'}`}>{item.status}</span>
                                    <strong className={item.positive ? 'is-positive' : 'is-negative'}>{item.delta}</strong>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </ProcurementTable>
        </section>
    );
}

function RiskStatus({ status, showIcon = true }) {
    const code = status === 'Критично' ? 'critical' : status === 'Внимание' ? 'attention' : 'control';
    return (
        <span className={`procurement-tag is-${code}`}>
            {showIcon ? <Icon name={code === 'control' ? 'circle-check' : 'triangle-alert'} /> : null}{status}
        </span>
    );
}

function RiskRow({ risk, onSelect }) {
    function openRisk(event) {
        const trigger = event.currentTarget.querySelector('.procurement-risk-action');
        trigger?.focus({ preventScroll: true });
        onSelect(risk.id, trigger);
    }
    return (
        <tr data-procurement-risk={risk.id} onClick={openRisk}>
            <th scope="row">
                <button type="button" className="procurement-risk-action" aria-label={`Подробнее о тендере ${risk.id}`}>
                    {risk.id}
                </button>
            </th>
            <td>{risk.subject}{risk.reserve < 0 && <small className="procurement-risk-timing">Прогноз позже на {Math.abs(risk.reserve)} дн.</small>}</td>
            <td>{risk.type}</td>
            <td>{risk.cost}</td>
            <td><RiskStatus status={risk.status} showIcon={false} /></td>
            <td>{risk.required}</td>
            <td>{risk.forecast}</td>
            <td className={risk.reserve < 0 ? 'is-negative' : undefined}>{signedNumber(risk.reserve)}</td>
        </tr>
    );
}

const riskColumns = ['№ тендера', 'Предмет закупки', 'Направление', 'Стоимость', 'Статус', 'Требуется', 'Прогноз', 'Запас, дн.'];
const riskStatusOrder = { Критично: 0, Внимание: 1, Контроль: 2 };

function RiskTable({ risks, onSelect }) {
    const orderedRisks = risks.toSorted((first, second) => (
        (riskStatusOrder[first.status] ?? 3) - (riskStatusOrder[second.status] ?? 3)
        || first.reserve - second.reserve
        || first.id.localeCompare(second.id)
    ));
    return (
        <section className="procurement-detail-section" aria-labelledby="procurement-risk-title">
            <h2 id="procurement-risk-title">Закупки под риском</h2>
            <ProcurementTable titleId="procurement-risk-title" className="procurement-risk-table" columns={riskColumns}>
                <tbody>
                    {orderedRisks.length ? orderedRisks.map(risk => <RiskRow key={risk.id} risk={risk} onSelect={onSelect} />)
                        : <tr className="procurement-risk-empty"><td colSpan={riskColumns.length}>Закупок под риском нет.</td></tr>}
                </tbody>
            </ProcurementTable>
        </section>
    );
}

function RiskDialog({ risk, onClose, onOpenProcedure, source }) {
    const [message, setMessage] = useState('');
    const { dialogRef, backdropRef, dismiss } = useAnimatedDialog({ onClose, source, overlayContainsSurface: true });

    function openProcedure() {
        if (onOpenProcedure) onOpenProcedure(risk);
        else setMessage('Карточка тендера находится вне рамок текущего прототипа');
    }

    return (
        <div className="procurement-dialog-overlay" data-procurement-action="close-dialog" ref={backdropRef} data-dialog-motion
            onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
            <aside className="procurement-risk-dialog" role="dialog" aria-modal="true" data-dialog-motion
                aria-labelledby="procurement-risk-dialog-title" ref={dialogRef} tabIndex={-1}>
                <div className="procurement-dialog-top">
                    <RiskStatus status={risk.status} />
                    <CloseButton data-procurement-close="" onClick={() => dismiss()} />
                </div>
                <p className="procurement-dialog-id">{risk.id}</p>
                <h2 data-dialog-title id="procurement-risk-dialog-title">{risk.subject}</h2>
                <p className="procurement-dialog-meta">{risk.type} · {risk.owner}</p>
                <dl className="procurement-dialog-grid">
                    <div><dt>Стоимость</dt><dd>{risk.cost}</dd></div>
                    <div><dt>Запас</dt><dd>{risk.reserve > 0 ? '+' : ''}{risk.reserve} дней</dd></div>
                    <div><dt>Требуемая дата</dt><dd>{risk.required}</dd></div>
                    <div><dt>Прогноз</dt><dd>{risk.forecast}</dd></div>
                </dl>
                <div className="procurement-dialog-next-step">
                    <strong>Следующее действие</strong>
                    <p>Проверить срок поставки и зафиксировать план восстановления даты.</p>
                </div>
                <button type="button" className="procurement-dialog-primary" data-procurement-action="demo-tender" onClick={openProcedure}>
                    <span>Открыть карточку тендера</span><Icon name="arrow-up-right" />
                </button>
                <div className="sr-only" aria-live="polite" data-procurement-live="">{message}</div>
            </aside>
        </div>
    );
}

export default function Procurement({ data, onOpenProcedure }) {
    const [selectedRiskId, setSelectedRiskId] = useState(null);
    const riskSource = useRef(null);
    const risk = data.risks.find(item => item.id === selectedRiskId);

    return (
        <div className="procurement-metrics" data-context-key={data.contextKey}>
            <Summary items={data.summary} risks={data.risks} riskTotal={data.riskSummary.totalCost}
                durationNorm={data.efficiency.find(item => item.id === 'average-tender-duration')?.norm} />
            <Contracting data={data.contracting} />
            <FinancialEffect effect={data.financialEffect} />
            <RiskTable risks={data.risks} onSelect={(id, source) => { riskSource.current = source; setSelectedRiskId(id); }} />
            <Efficiency items={data.efficiency} />
            {risk ? (
                <RiskDialog key={risk.id} risk={risk} source={riskSource.current}
                    onClose={() => setSelectedRiskId(null)} onOpenProcedure={onOpenProcedure} />
            ) : null}
        </div>
    );
}
