/**
 * Demo data and derived view model for the central metrics dashboard.
 * The file is loaded before src/app/app.js and does not render UI.
 */
(function (window) {
    const DEMO_TODAY = '2026-07-24';
    const DEMO_UPDATED_AT = '2026-07-24T10:30:00+03:00';

    const phaseSections = [
        { id: 'overview', label: 'Общие', available: true },
        { id: 'procurement', label: 'Закупки', available: true },
        { id: 'design', label: 'Проектирование', available: false },
        { id: 'contracts', label: 'Тендеры и контрактация', available: false },
        { id: 'sales', label: 'Продажи', available: false },
        { id: 'construction', label: 'СМР', available: false },
        { id: 'acceptance', label: 'Приемка и заселение', available: false }
    ];

    const milestoneBlueprint = [
        { id: 'master-plan', phaseId: 'design', name: 'Мастерплан v.1 (ГП)', ratio: 0 },
        { id: 'permit-phase-1', phaseId: 'design', name: 'РНС 1 очереди', ratio: 0.16 },
        { id: 'works-phase-1', phaseId: 'contracts', name: 'РиВ 1 очереди', ratio: 0.27 },
        { id: 'permit-phase-2', phaseId: 'design', name: 'РНС 2 очереди', ratio: 0.43 },
        { id: 'occupancy-phase-1-start', phaseId: 'acceptance', name: 'Начало заселения 1 очереди', ratio: 0.55 },
        { id: 'occupancy-phase-1-end', phaseId: 'acceptance', name: 'Окончание заселения 1 очереди', ratio: 0.7 },
        { id: 'works-phase-2', phaseId: 'construction', name: 'РиВ 2 очереди', ratio: 0.78 },
        { id: 'occupancy-phase-2-start', phaseId: 'acceptance', name: 'Начало заселения 2 очереди', ratio: 0.86 },
        { id: 'occupancy-phase-2-end', phaseId: 'acceptance', name: 'Окончание заселения 2 очереди', ratio: 1 }
    ];

    const queueMilestoneBlueprint = [
        { id: 'queue-design-start', phaseId: 'design', name: 'Старт проектирования очереди', ratio: 0 },
        { id: 'queue-permit', phaseId: 'design', name: 'Получение РНС очереди', ratio: 0.16 },
        { id: 'queue-works-start', phaseId: 'construction', name: 'Старт СМР очереди', ratio: 0.27 },
        { id: 'queue-monolith', phaseId: 'construction', name: 'Завершение монолита', ratio: 0.43 },
        { id: 'queue-facade', phaseId: 'construction', name: 'Закрытие фасада', ratio: 0.55 },
        { id: 'queue-works-end', phaseId: 'construction', name: 'Завершение СМР очереди', ratio: 0.7 },
        { id: 'queue-zos', phaseId: 'acceptance', name: 'Получение ЗОС', ratio: 0.78 },
        { id: 'queue-commissioning', phaseId: 'acceptance', name: 'Получение РВЭ', ratio: 0.86 },
        { id: 'queue-occupancy-end', phaseId: 'acceptance', name: 'Окончание заселения очереди', ratio: 1 }
    ];

    const novaMilestoneDates = [
        '2025-01-15',
        '2025-08-30',
        '2025-12-15',
        '2026-07-01',
        '2026-10-01',
        '2027-06-30',
        '2027-12-01',
        '2028-03-01',
        '2028-11-30'
    ];

    const projectBudgetScale = {
        'proj-education-campus': 0.58,
        'proj-nova': 1,
        'proj-alkhimovo': 0.84,
        'proj-malzhenninovo': 0.69,
        'proj-novy-kvartal': 0.76,
        'proj-kolskie-ogni': 0.52,
        'proj-dmitrov-dom': 0.64,
        'proj-tsvetochny': 0.47,
        'proj-putilkovo': 1.18,
        'proj-bank-platform': 0.42,
        'proj-plus-services': 0.34,
        'proj-hospitality-hub': 0.73
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function stableHash(value) {
        const text = String(value || '');
        let hash = 0;
        for (let index = 0; index < text.length; index += 1) {
            hash = ((hash << 5) - hash) + text.charCodeAt(index);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function toUtcDate(value) {
        const [year, month, day] = String(value).split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    }

    function toIsoDate(date) {
        return date.toISOString().slice(0, 10);
    }

    function addDays(value, days) {
        const date = toUtcDate(value);
        date.setUTCDate(date.getUTCDate() + Number(days || 0));
        return toIsoDate(date);
    }

    function differenceInDays(startDate, endDate) {
        const duration = toUtcDate(endDate).getTime() - toUtcDate(startDate).getTime();
        return Math.round(duration / 86400000);
    }

    function round(value, digits = 1) {
        const factor = 10 ** digits;
        return Math.round(Number(value || 0) * factor) / factor;
    }

    function buildComparison(value, baseValue, baseCode) {
        const delta = Number(value || 0) - Number(baseValue || 0);
        const percent = baseValue ? (delta / Math.abs(baseValue)) * 100 : 0;
        return {
            baseCode,
            delta,
            percent: round(percent, 1),
            status: delta > 0 ? 'unfavorable' : (delta < 0 ? 'favorable' : 'neutral')
        };
    }

    function buildGenericSchedule(projectId) {
        const seed = stableHash(projectId);
        const startDate = addDays('2024-03-01', seed % 560);
        const plannedDurationDays = 960 + (seed % 390);
        const deviationDays = (seed % 49) - 10;
        const plannedFinishDate = addDays(startDate, plannedDurationDays);
        const forecastFinishDate = addDays(plannedFinishDate, deviationDays);

        return {
            startDate,
            plannedFinishDate,
            forecastFinishDate,
            actualFinishDate: null,
            plannedDurationDays,
            forecastDurationDays: plannedDurationDays + deviationDays,
            deviationDays,
            deviationPercent: round((deviationDays / plannedDurationDays) * 100, 1),
            durationBasis: 'calendar_days'
        };
    }

    function buildSchedule(projectId) {
        if (projectId !== 'proj-nova') return buildGenericSchedule(projectId);

        const startDate = '2025-01-15';
        const plannedFinishDate = '2028-11-30';
        const forecastFinishDate = '2028-12-18';
        const plannedDurationDays = differenceInDays(startDate, plannedFinishDate);
        const forecastDurationDays = differenceInDays(startDate, forecastFinishDate);
        const deviationDays = forecastDurationDays - plannedDurationDays;

        return {
            startDate,
            plannedFinishDate,
            forecastFinishDate,
            actualFinishDate: null,
            plannedDurationDays,
            forecastDurationDays,
            deviationDays,
            deviationPercent: round((deviationDays / plannedDurationDays) * 100, 1),
            durationBasis: 'calendar_days'
        };
    }

    function buildQueueSchedule(projectId, queueId) {
        const projectSchedule = buildSchedule(projectId);
        const seed = stableHash(`${projectId}:${queueId}:schedule`);
        const numericQueueIndex = Math.max(0, (Number(String(queueId).match(/(\d+)$/)?.[1]) || 1) - 1);
        const startOffset = 52 + numericQueueIndex * 145 + (seed % 42);
        const plannedDurationDays = 430 + (seed % 230);
        const deviationDays = (seed % 41) - 12;
        const startDate = addDays(projectSchedule.startDate, startOffset);
        const plannedFinishDate = addDays(startDate, plannedDurationDays);
        const forecastFinishDate = addDays(plannedFinishDate, deviationDays);

        return {
            startDate,
            plannedFinishDate,
            forecastFinishDate,
            actualFinishDate: null,
            plannedDurationDays,
            forecastDurationDays: plannedDurationDays + deviationDays,
            deviationDays,
            deviationPercent: round((deviationDays / plannedDurationDays) * 100, 1),
            durationBasis: 'calendar_days'
        };
    }

    function buildMilestones(contextKey, schedule, contextType) {
        const blueprint = contextType === 'queue' ? queueMilestoneBlueprint : milestoneBlueprint;
        const seed = stableHash(`${contextKey}:milestones`);
        const totalDuration = differenceInDays(schedule.startDate, schedule.plannedFinishDate);
        const dates = contextKey === 'project:proj-nova'
            ? novaMilestoneDates
            : blueprint.map(item => addDays(schedule.startDate, Math.round(totalDuration * item.ratio)));

        let currentIndex = dates.findIndex(date => date >= DEMO_TODAY);
        if (currentIndex < 0) currentIndex = dates.length - 1;

        return blueprint.map((item, index) => {
            const plannedDate = dates[index];
            const completed = index < currentIndex;
            const current = index === currentIndex;
            const variation = contextKey === 'project:proj-nova' ? 0 : ((seed + index * 7) % 9) - 3;
            const forecastShift = current || index > currentIndex
                ? Math.round(schedule.deviationDays * Math.max(item.ratio, 0.35))
                : 0;

            return {
                id: item.id,
                phaseId: item.phaseId,
                name: item.name,
                plannedDate,
                forecastDate: completed ? null : addDays(plannedDate, forecastShift),
                actualDate: completed ? addDays(plannedDate, variation) : null,
                status: completed ? 'completed' : (current ? 'current' : 'planned')
            };
        });
    }

    function buildBudgetSet(target, contracted, accepted, scopeLabel = 'проекта') {
        return {
            targetCost: {
                code: 'ЦП',
                name: `Целевая стоимость ${scopeLabel}\nпо сметной документации`,
                value: target,
                comparisons: [
                    buildComparison(target, contracted, 'ДУ'),
                    buildComparison(target, accepted, 'КС2')
                ]
            },
            contractedCost: {
                code: 'ДУ',
                name: 'Объемы действующих договоров\nи дополнительные соглашения',
                value: contracted,
                comparisons: [
                    buildComparison(contracted, target, 'ЦП'),
                    buildComparison(contracted, accepted, 'КС2')
                ]
            },
            acceptedWorks: {
                code: 'КС2',
                name: 'Фактически принятый объем работ\nпо актам КС2',
                value: accepted,
                comparisons: [
                    buildComparison(accepted, target, 'ЦП'),
                    buildComparison(accepted, contracted, 'ДУ')
                ]
            }
        };
    }

    function buildBudgets(projectId) {
        if (projectId === 'proj-nova') {
            const target = 18_600_000_000;
            const contracted = 19_400_000_000;
            const accepted = 22_300_000_000;
            return buildBudgetSet(target, contracted, accepted);
        }

        const seed = stableHash(`${projectId}:budget`);
        const scale = projectBudgetScale[projectId] || (0.46 + (seed % 63) / 100);
        const target = Math.round(18_600_000_000 * scale / 10_000_000) * 10_000_000;
        const contractRatio = 0.96 + (seed % 15) / 100;
        const acceptedRatio = 0.58 + (seed % 36) / 100;
        const contracted = Math.round(target * contractRatio / 10_000_000) * 10_000_000;
        const accepted = Math.round(contracted * acceptedRatio / 10_000_000) * 10_000_000;

        return buildBudgetSet(target, contracted, accepted);
    }

    function buildQueueBudgets(projectId, queueId) {
        const seed = stableHash(`${projectId}:${queueId}:budget`);
        const projectBudgets = buildBudgets(projectId);
        const share = 0.14 + (seed % 16) / 100;
        const target = Math.round(projectBudgets.targetCost.value * share / 5_000_000) * 5_000_000;
        const contractRatio = 0.92 + (seed % 20) / 100;
        const acceptedRatio = 0.48 + (seed % 44) / 100;
        const contracted = Math.round(target * contractRatio / 5_000_000) * 5_000_000;
        const accepted = Math.round(contracted * acceptedRatio / 5_000_000) * 5_000_000;

        return buildBudgetSet(target, contracted, accepted, 'очереди');
    }

    function countMetricEvents(events, matcher) {
        return (events || []).filter(event => !event.excluded && matcher(event)).length;
    }

    function getDashboardForContext(context, events) {
        if (!context || (context.type !== 'project' && context.type !== 'queue')) {
            return {
                status: 'unsupported-context',
                contextType: context ? context.type : null,
                projectId: context ? context.projectId : null,
                title: context && context.entity ? context.entity.name : '',
                message: 'Выберите проект или очередь в левом дереве, чтобы открыть метрики.'
            };
        }

        const isQueue = context.type === 'queue';
        const projectId = isQueue ? context.projectId : context.id;
        const contextId = context.id;
        const contextKey = `${context.type}:${contextId}`;
        const schedule = isQueue ? buildQueueSchedule(projectId, contextId) : buildSchedule(projectId);
        const entity = context.entity || {};
        const parentProject = context.parentProject || {};
        const headerSource = isQueue ? parentProject : entity;
        const businessUnit = headerSource.headerAttributes ? headerSource.headerAttributes.businessUnit : '';
        const title = isQueue
            ? `${parentProject.name || projectId} / ${entity.name || contextId}`
            : (entity.name || projectId);
        const scheduleEventCount = countMetricEvents(events, event => event.metricId === 'GANTT_DATES');
        const budgetEventCount = countMetricEvents(events, event => event.metricId && event.metricId !== 'GANTT_DATES');

        return {
            status: 'ready',
            contextType: context.type,
            contextId,
            contextKey,
            projectId,
            queueId: isQueue ? contextId : null,
            businessUnitId: context.businessUnitIds ? context.businessUnitIds[0] : null,
            title,
            businessUnit,
            updatedAt: DEMO_UPDATED_AT,
            dataStatus: 'demo',
            dataStatusLabel: 'Демо-данные',
            currency: 'RUB',
            phaseSections: clone(phaseSections),
            procurement: typeof SCenterProcurementMetricsData !== 'undefined'
                ? SCenterProcurementMetricsData.getForContext(context)
                : null,
            schedule,
            milestones: buildMilestones(contextKey, schedule, context.type),
            budgets: isQueue ? buildQueueBudgets(projectId, contextId) : buildBudgets(projectId),
            signals: {
                scheduleEventCount,
                budgetEventCount
            }
        };
    }

    window.metricsDashboardData = {
        getDashboardForContext,
        differenceInDays,
        buildComparison
    };
})(window);
