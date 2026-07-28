// Детерминированный demo-data слой проектной «Сводки» цифровой шахматки.
// Подключается после construction-objects-data.js и objects-data.js.
(function (window) {
    'use strict';

    const STATUS = Object.freeze({
        READY: 'ready',
        EMPTY: 'empty',
        PARTIAL_ERROR: 'partial-error',
        UNSUPPORTED_CONTEXT: 'unsupported-context'
    });
    const STATUS_VALUES = new Set(Object.values(STATUS));
    const RISK_TONES = new Set(['none', 'warning', 'critical']);
    const ATTENTION_TONES = new Set(['warning', 'critical']);

    if (!window.constructionObjectsData || !window.objectsData) {
        throw new Error('Digital chessboard summary requires constructionObjectsData and objectsData.');
    }

    const BASE_WEEKLY_INSIGHTS = Object.freeze([
        'За неделю строительная готовность проекта выросла на 4%.',
        'Наибольший вклад внес Дом 1 (+4%).',
        'Завершены работы по монолиту секции 2 и кровле секции 1.',
        'Фасадные работы отстают от планового темпа на 8 календарных дней.',
        'По текущему темпу отделочные работы в Доме 3 могут выйти за срок на 6 дней.',
        'Ожидается начало монтажа лифтового оборудования в Доме 2.',
        'Начат монтаж внутренних инженерных сетей в Доме 1.',
        'Подрядчик передал исполнительную документацию по паркингу.',
        'Согласованы лимиты финансирования работ на следующую неделю.',
        'На площадку Детского сада поставлены оконные конструкции.',
        'Недельный план по кровельным работам выполнен на 96%.'
    ]);

    const ATTENTION_DEFINITIONS = Object.freeze([
        ['no-contractor', 'Работы без подрядчика', 'critical'],
        ['stale', 'Работы без обновления более 14 дней', 'warning'],
        ['delay', 'Работы с риском превышения срока', 'critical'],
        ['plan', 'Не подтвержден план на текущую неделю', 'warning'],
        ['approval', 'Факт от подрядчика ожидает согласования ЗДС', 'warning'],
        ['network', 'Работы без привязки к сетевому объекту', 'warning'],
        ['weight', 'Вес работ не нормализован до 100%', 'critical'],
        ['documentation', 'Просрочено предоставление исполнительной документации', 'warning'],
        ['owner', 'Не назначен ответственный за выполнение работ', 'warning'],
        ['supervision', 'Критические замечания строительного контроля', 'critical'],
        ['supply', 'Не согласован график поставки оборудования', 'warning'],
        ['milestone', 'Отклонение готовности от контрольной точки', 'critical']
    ].map(Object.freeze));

    const cache = new Map();

    function clone(value) {
        return typeof window.structuredClone === 'function'
            ? window.structuredClone(value)
            : JSON.parse(JSON.stringify(value));
    }

    function hash(value) {
        return [...String(value || '')].reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 3), 0);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function resolveProject(context) {
        if (!context || ['bu', 'business-unit', 'businessUnit'].includes(context.type)) return null;
        if (context.type === 'project') {
            return {
                id: context.id || context.projectId,
                name: context.entity?.name || context.id || 'Проект',
                subtitle: [context.entity?.headerAttributes?.region, context.entity?.headerAttributes?.cluster].filter(Boolean).join(' · ')
            };
        }
        if (context.type === 'queue' && context.projectId) {
            return {
                id: context.projectId,
                name: context.parentProject?.name || context.projectId,
                subtitle: [context.parentProject?.headerAttributes?.region, context.entity?.name].filter(Boolean).join(' · ')
            };
        }
        if (context.projectId) {
            return { id: context.projectId, name: context.parentProject?.name || context.projectId, subtitle: '' };
        }
        return null;
    }

    function riskFor(seed, index) {
        if (index === 1 && seed % 3 === 0) return { count: 0, tone: 'none', flagged: false };
        const values = [2, 0, 5, 1, 2];
        const count = index === 1 ? 0 : clamp(values[index] + ((seed + index) % 3) - 1, 0, 7);
        const tone = count === 0 ? 'none' : count >= 3 || index === 0 ? 'critical' : 'warning';
        return { count, tone, flagged: index === 0 && count > 0 };
    }

    function buildObjects(projectId, context) {
        const objectsModel = window.objectsData.getForContext(context);
        if (!objectsModel || objectsModel.status !== 'ready') return [];
        const seed = hash(projectId);
        const baseDeltas = [4, 1, -1, 3, 2];
        const updateMinutes = [15, 10, 5, 8, 2];
        return objectsModel.objects.map((object, index) => ({
            id: object.id,
            name: object.name,
            type: object.type,
            typeLabel: object.typeLabel,
            icon: object.icon,
            readinessPercent: clamp(object.actualProgressPercent + ((seed + index * 5) % 5) - 2, 0, 100),
            weeklyDeltaPercent: clamp(baseDeltas[index] + ((seed + index) % 3) - 1, -5, 8),
            risk: riskFor(seed, index),
            lastUpdatedAt: `08.06.2025 09:${String(updateMinutes[index]).padStart(2, '0')}`,
            detail: object.cardStructureLabel || 'Демонстрационная карточка объекта.',
            expandable: true
        }));
    }

    function buildAttention(projectId, objects) {
        const seed = hash(projectId);
        return ATTENTION_DEFINITIONS.map(([key, title, tone], index) => ({
            id: `${projectId}-${key}`,
            objectId: objects[index % Math.max(1, objects.length)]?.id || null,
            title,
            count: 1 + ((seed + index * 7) % 4),
            tone
        }));
    }

    function buildModel(project, context) {
        const seed = hash(project.id);
        const objects = buildObjects(project.id, context);
        const readiness = objects.length
            ? Math.round(objects.reduce((sum, object) => sum + object.readinessPercent, 0) / objects.length)
            : 0;
        const weeklyDelta = clamp(1 + (seed % 4), -4, 5);
        const attentionItems = buildAttention(project.id, objects);
        const riskyObjects = objects.filter((object) => object.risk.count > 0).length;

        return {
            status: objects.length ? STATUS.READY : STATUS.EMPTY,
            contextKey: `${context?.type || 'unknown'}:${context?.id || project.id}`,
            project,
            period: { from: '02.06.2025', to: '08.06.2025', label: '02.06 – 08.06' },
            kpis: [
                { id: 'objects', label: 'Объектов в проекте', value: String(objects.length || 0), icon: 'building-2', tone: 'blue' },
                { id: 'readiness', label: 'Строительная готовность', value: `${readiness}%`, delta: weeklyDelta, icon: 'hard-hat', tone: 'green' },
                { id: 'risk-objects', label: 'Объектов с рисками', value: String(riskyObjects), icon: 'triangle-alert', tone: 'red' },
                { id: 'no-data', label: 'Работ без данных', value: String(4 + (seed % 6)), icon: 'folder', tone: 'yellow' },
                { id: 'no-contractor', label: 'Работ без подрядчика', value: String(9 + (seed % 11)), icon: 'user-round', tone: 'neutral' },
                { id: 'deadline-risk', label: 'Работ с риском срыва срока', value: String(5 + (seed % 7)), icon: 'calendar-clock', tone: 'red' }
            ],
            weeklySummary: {
                delta: weeklyDelta,
                from: clamp(readiness - weeklyDelta, 0, 100),
                to: readiness,
                insights: BASE_WEEKLY_INSIGHTS.map((insight, index) => index === 0
                    ? `За неделю строительная готовность проекта ${weeklyDelta >= 0 ? 'выросла' : 'снизилась'} на ${Math.abs(weeklyDelta)}%.`
                    : insight)
            },
            attentionItems,
            objects,
            archive: [
                { id: `${project.id}-archive-1`, title: 'Сводка на 01.06.2025', period: '26.05 – 01.06' },
                { id: `${project.id}-archive-2`, title: 'Сводка на 25.05.2025', period: '19.05 – 25.05' },
                { id: `${project.id}-archive-3`, title: 'Сводка на 18.05.2025', period: '12.05 – 18.05' }
            ]
        };
    }

    function getForContext(context) {
        const project = resolveProject(context);
        if (!project?.id) {
            return {
                status: STATUS.UNSUPPORTED_CONTEXT,
                contextKey: `${context?.type || 'unknown'}:${context?.id || 'none'}`,
                project: null,
                period: null,
                kpis: [],
                weeklySummary: null,
                attentionItems: [],
                objects: [],
                archive: [],
                message: 'Сводка доступна для проекта или очереди внутри проекта. Выберите проект в карточке сверху.'
            };
        }
        if (!cache.has(project.id)) cache.set(project.id, buildModel(project, context));
        const model = clone(cache.get(project.id));
        model.contextKey = `${context?.type || 'project'}:${context?.id || project.id}`;
        model.project = project;
        return model;
    }

    function validate(model) {
        const errors = [];
        if (!model || !STATUS_VALUES.has(model.status)) return ['Неизвестный status модели сводки.'];
        if (model.status === STATUS.UNSUPPORTED_CONTEXT) {
            if (model.objects?.length || model.kpis?.length) errors.push('Unsupported-state не должен содержать project data.');
            return errors;
        }
        if (!model.project?.id) errors.push('У проектной модели отсутствует project.id.');
        if (!Array.isArray(model.kpis) || model.kpis.length !== 6) errors.push('Сводка должна содержать 6 KPI.');
        if (!Array.isArray(model.objects) || model.objects.length !== 5) errors.push('Сводка должна содержать 5 объектов.');
        const objectIds = new Set();
        (model.objects || []).forEach((object) => {
            if (objectIds.has(object.id)) errors.push(`${object.id}: повторяющийся object id.`);
            objectIds.add(object.id);
            if (!Number.isFinite(object.readinessPercent) || object.readinessPercent < 0 || object.readinessPercent > 100) errors.push(`${object.id}: readiness вне диапазона.`);
            if (!RISK_TONES.has(object.risk?.tone) || !Number.isInteger(object.risk?.count) || object.risk.count < 0) errors.push(`${object.id}: некорректный risk.`);
        });
        const attentionIds = new Set();
        (model.attentionItems || []).forEach((item) => {
            if (attentionIds.has(item.id)) errors.push(`${item.id}: повторяющийся attention id.`);
            attentionIds.add(item.id);
            if (!ATTENTION_TONES.has(item.tone) || !Number.isInteger(item.count) || item.count < 1) errors.push(`${item.id}: некорректная проблема.`);
        });
        const archiveIds = new Set((model.archive || []).map((item) => item.id));
        if (archiveIds.size !== (model.archive || []).length) errors.push('Archive ids должны быть уникальны.');
        return errors;
    }

    window.digitalChessboardSummaryData = Object.freeze({ STATUS, getForContext, validate });
})(window);
