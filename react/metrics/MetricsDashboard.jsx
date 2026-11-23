import { useEffect, useId, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import MetricsKpiCard from './MetricsKpiCard.jsx';
import Milestones from './Milestones.jsx';
import Procurement from './Procurement.jsx';
import '../../src/features/metrics-dashboard/metrics-dashboard.css';

const numberFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC' });
const moneyFormatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    notation: 'compact',
    maximumFractionDigits: 1
});
const deviationIcons = { favorable: 'trending-down', unfavorable: 'trending-up', neutral: 'minus' };
const budgetCards = [
    { key: 'targetCost', icon: 'wallet-cards' },
    { key: 'contractedCost', icon: 'file-check-2' },
    { key: 'acceptedWorks', icon: 'clipboard-check' }
];

function formatDate(value) {
    if (!value) return 'Нет данных';
    const [year, month, day] = String(value).split('-').map(Number);
    const timestamp = Date.UTC(year, month - 1, day);
    return Number.isFinite(timestamp) ? dateFormatter.format(timestamp) : 'Нет данных';
}

function signedNumber(value, suffix = '') {
    const number = Number(value || 0);
    const sign = number > 0 ? '+' : number < 0 ? '−' : '';
    return `${sign}${numberFormatter.format(Math.abs(number))}${suffix}`;
}

function pluralDays(value) {
    const absolute = Math.abs(Math.round(Number(value || 0)));
    const mod10 = absolute % 10;
    const mod100 = absolute % 100;
    if (mod10 === 1 && mod100 !== 11) return 'день';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
    return 'дней';
}

function Schedule({ schedule }) {
    const { plannedDurationDays, forecastDurationDays, startDate, plannedFinishDate, forecastFinishDate,
        deviationDays, deviationPercent } = schedule;
    const status = deviationDays > 0 ? 'unfavorable' : deviationDays < 0 ? 'favorable' : 'neutral';

    return (
        <section className="metrics-kpi-grid" aria-label="Сводка сроков">
            <section className="metrics-summary-pair" aria-label="Длительность проекта">
                <MetricsKpiCard title="Плановая длительность" icon="calendar-days"
                    value={numberFormatter.format(plannedDurationDays)} unit={pluralDays(plannedDurationDays)}
                    comparison={`старт ${formatDate(startDate)}`} />
                <MetricsKpiCard title="Прогнозная длительность" icon="clock-3"
                    value={numberFormatter.format(forecastDurationDays)} unit={pluralDays(forecastDurationDays)} />
            </section>
            <section className="metrics-summary-pair" aria-label="Отклонение и завершение">
                <MetricsKpiCard title="Отклонение срока" icon={deviationIcons[status]} status={status}
                    value={signedNumber(deviationDays)} unit={pluralDays(deviationDays)}
                    comparison={`${signedNumber(deviationPercent, '%')} к плану`} />
                <MetricsKpiCard title="Прогнозное завершение" icon="calendar-check-2"
                    value={formatDate(forecastFinishDate)} comparison={`по плану ${formatDate(plannedFinishDate)}`} />
            </section>
        </section>
    );
}


function BudgetHelp({ code, description }) {
    const tooltipId = useId();
    const [open, setOpen] = useState(false);
    const [pinned, setPinned] = useState(false);
    const triggerRef = useRef(null);

    function close() {
        setOpen(false);
        setPinned(false);
    }

    useEffect(() => {
        if (!open) return;
        const dismiss = event => {
            if (event.key === 'Escape') close();
        };
        document.addEventListener('keydown', dismiss);
        return () => document.removeEventListener('keydown', dismiss);
    }, [open]);

    return (
        <span className="metrics-budget-help-wrap" onPointerEnter={event => {
            if (event.pointerType === 'mouse') setOpen(true);
        }} onPointerLeave={() => {
            if (!pinned && !triggerRef.current?.matches(':focus-visible')) close();
        }}>
            <button ref={triggerRef} className="metrics-budget-help" type="button"
                aria-label={`Пояснение: бюджет по ${code}`} aria-describedby={tooltipId}
                aria-expanded={open} onFocus={event => {
                    if (event.currentTarget.matches(':focus-visible')) setOpen(true);
                }} onBlur={close} onClick={() => {
                    if (pinned) close();
                    else {
                        setOpen(true);
                        setPinned(true);
                    }
                }}>
                <Icon name="circle-help" size={16} strokeWidth={1.8} />
            </button>
            <span className="metrics-budget-tooltip" id={tooltipId} role="tooltip" hidden={!open}>{description}</span>
        </span>
    );
}

const amountParts = new Set(['integer', 'group', 'decimal', 'fraction', 'minusSign']);
const codeLabel = code => code === 'КС2' ? 'КС-2' : code;

function Budgets({ budgets }) {
    return (
        <section className="metrics-budget-section" aria-label="Бюджет проекта">
            <div className="metrics-budget-grid">
                {budgetCards.map(({ key, icon }) => {
                    const budget = budgets[key];
                    const parts = moneyFormatter.formatToParts(budget.value);
                    return (
                        <article className="metrics-budget-card" key={key}>
                            <div className="metrics-budget-card-primary metrics-kpi-card-main">
                                <span className="metrics-icon-box" aria-hidden="true"><Icon name={icon} /></span>
                                <div className="metrics-budget-headline">
                                    <div className="metrics-budget-heading">
                                        <div className="metrics-budget-title">Бюджет по {codeLabel(budget.code)}</div>
                                        <BudgetHelp code={codeLabel(budget.code)} description={budget.name} />
                                    </div>
                                    <div className="metrics-value-row">
                                        <strong>{parts.filter(part => amountParts.has(part.type)).map(part => part.value).join('')}</strong>
                                        {' '}<span>{parts.filter(part => !amountParts.has(part.type)).map(part => part.value).join('').trim()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="metrics-budget-card-secondary">
                                {budget.comparisons?.map(comparison => (
                                    <div className="metrics-budget-comparison" data-status={comparison.status} key={comparison.baseCode}>
                                        <span>К {codeLabel(comparison.baseCode)}</span>
                                        <div className="metrics-budget-difference">
                                            <strong>{signedNumber(comparison.percent, '%')}</strong>
                                            <small>{signedNumber(comparison.delta / 1_000_000_000, ' млрд ₽')}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

export default function MetricsDashboard({ context, viewModel, sectionId, onSelectSection, active = true, onOpenProcedure, onOpenProject }) {
    if (!active) return null;

    if (viewModel?.status !== 'ready') {
        const projectId = viewModel?.projectId || context?.projectId;
        const canOpenProject = (viewModel?.contextType || context?.type) === 'queue' && projectId && onOpenProject;
        return (
            <section className="metrics-dashboard metrics-dashboard--unsupported" role="status">
                <span className="metrics-section-empty-icon"><Icon name="bar-chart-3" /></span>
                <h2>Выберите проект</h2>
                <p id="metrics-project-required">{viewModel?.message || 'Данные проекта пока недоступны.'}</p>
                {canOpenProject ? (
                    <button type="button" className="metrics-primary-button" onClick={() => onOpenProject(projectId)}>Открыть проект</button>
                ) : null}
            </section>
        );
    }

    const { schedule, milestones, budgets, procurement, contextKey, contextType, projectId } = viewModel;
    const overview = sectionId === 'overview';
    const scopeKey = contextKey || projectId;

    return (
        <section className="metrics-dashboard"
            data-context-key={scopeKey} data-context-type={contextType || 'project'} data-project-id={projectId}>
            <div className={`metrics-dashboard-content${overview ? ' is-overview' : ''}`} id="metrics-dashboard-section-panel"
                role="tabpanel" aria-labelledby={`metrics-section-tab-${sectionId}`}>
                {overview ? (
                    <>
                        <Schedule schedule={schedule} />
                        <Milestones key={`milestones:${scopeKey}`} milestones={milestones} contextLabel={viewModel.title} />
                        <Budgets key={`budgets:${scopeKey}`} budgets={budgets} />
                    </>
                ) : procurement ? (
                    <Procurement key={scopeKey} data={procurement} onOpenProcedure={onOpenProcedure} />
                ) : (
                    <section className="metrics-section-empty" role="status">
                        <span className="metrics-section-empty-icon"><Icon name="panels-top-left" /></span>
                        <h2>Данные закупок пока недоступны</h2>
                        <button type="button" className="metrics-primary-button" onClick={() => {
                            onSelectSection('overview');
                            document.getElementById('metrics-section-tab-overview')?.focus();
                        }}>Вернуться к общим</button>
                    </section>
                )}
            </div>
        </section>
    );
}
