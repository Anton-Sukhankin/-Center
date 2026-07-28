// Детерминированный demo-data слой раздела «Объекты».
// Подключается обычным <script> после construction-objects-data.js.
(function (window) {
    'use strict';

    const STATUS = Object.freeze({
        NOT_STARTED: 'not-started',
        IN_PROGRESS: 'in-progress',
        ON_SCHEDULE: 'on-schedule',
        COMPLETED: 'completed',
        DELAYED: 'delayed'
    });
    const STATUS_VALUES = new Set(Object.values(STATUS));

    const PASSPORTS = Object.freeze({
        'house-1': Object.freeze({
            floorLabel: 'Этажность', floorCount: 25, sectionLabel: 'Секции', sectionCount: 3,
            areaSquareMeters: 28560, workStart: '2024-02-12', plannedCompletion: '2026-09-30',
            actualProgressPercent: 45, cardPlanProgressPercent: 52, status: STATUS.IN_PROGRESS
        }),
        'house-2': Object.freeze({
            floorLabel: 'Этажность', floorCount: 27, sectionLabel: 'Секции', sectionCount: 4,
            areaSquareMeters: 32240, workStart: '2024-03-04', plannedCompletion: '2027-03-31',
            actualProgressPercent: 37, cardPlanProgressPercent: 37, status: STATUS.IN_PROGRESS
        }),
        'house-3': Object.freeze({
            floorLabel: 'Этажность', floorCount: 24, sectionLabel: 'Секции', sectionCount: 3,
            areaSquareMeters: 26880, workStart: '2023-11-20', plannedCompletion: '2026-06-30',
            actualProgressPercent: 54, cardPlanProgressPercent: 55, status: STATUS.ON_SCHEDULE
        }),
        parking: Object.freeze({
            floorLabel: 'Уровни', floorCount: 5, sectionLabel: 'Зоны', sectionCount: 3,
            areaSquareMeters: 18200, workStart: '2024-05-15', plannedCompletion: '2026-12-20',
            actualProgressPercent: 64, cardPlanProgressPercent: 66, status: STATUS.ON_SCHEDULE
        }),
        kindergarten: Object.freeze({
            floorLabel: 'Этажность', floorCount: 3, sectionLabel: 'Корпуса', sectionCount: 2,
            areaSquareMeters: 9600, workStart: '2024-01-22', plannedCompletion: '2026-08-31',
            actualProgressPercent: 82, cardPlanProgressPercent: 82, status: STATUS.ON_SCHEDULE
        })
    });

    const GROUP_DEFINITIONS = Object.freeze([
        ['general-construction', 'Общестроительные работы'],
        ['facade', 'Фасадные работы'],
        ['engineering', 'Инженерные системы'],
        ['finishing', 'Отделочные работы'],
        ['landscaping', 'Благоустройство'],
        ['excavation', 'Разработка котлована'],
        ['piling', 'Свайные работы'],
        ['foundations', 'Фундаменты'],
        ['monolith', 'Монолитный каркас'],
        ['masonry', 'Каменная кладка'],
        ['roofing', 'Кровельные работы'],
        ['windows', 'Окна и витражи'],
        ['partitions', 'Внутренние перегородки'],
        ['waterproofing', 'Гидроизоляция'],
        ['water-supply', 'Внутреннее водоснабжение'],
        ['sewerage', 'Внутренняя канализация'],
        ['heating', 'Отопление'],
        ['ventilation', 'Вентиляция'],
        ['electrical', 'Электроснабжение'],
        ['low-current', 'Слаботочные системы'],
        ['automation', 'Автоматизация здания'],
        ['elevators', 'Лифтовое оборудование'],
        ['fire-safety', 'Пожарная безопасность'],
        ['external-water', 'Наружное водоснабжение'],
        ['external-sewerage', 'Наружная канализация'],
        ['heat-networks', 'Тепловые сети'],
        ['power-networks', 'Наружные электрические сети'],
        ['roads', 'Дорожные покрытия'],
        ['landscaping-elements', 'Малые архитектурные формы'],
        ['planting', 'Озеленение'],
        ['commissioning', 'Пусконаладочные работы'],
        ['handover', 'Передача и ввод в эксплуатацию']
    ].map(Object.freeze));

    const WORK_STAGE_NAMES = Object.freeze([
        'Разработка ППР',
        'Согласование рабочей документации',
        'Мобилизация участка',
        'Геодезическая разбивка',
        'Подготовка фронта работ',
        'Входной контроль материалов',
        'Поставка основных материалов',
        'Поставка комплектующих',
        'Устройство первой захватки',
        'Устройство второй захватки',
        'Устройство третьей захватки',
        'Монтаж в секции 1',
        'Монтаж в секции 2',
        'Монтаж в секции 3',
        'Монтаж в секции 4',
        'Контроль качества монтажа',
        'Исполнительная съёмка',
        'Промежуточные испытания',
        'Устранение замечаний',
        'Восстановление отделки',
        'Комплексные испытания',
        'Подготовка исполнительной документации',
        'Передача документации технадзору',
        'Приёмка скрытых работ',
        'Приёмка законченного этапа',
        'Демобилизация участка',
        'Закрытие комплекта работ'
    ]);

    const CONTRACTORS = Object.freeze([
        'ООО «Вектор»',
        'ООО «СМУ-1»',
        'ООО «Фасадные технологии»',
        'ООО «ЭнергоМонтаж»',
        'ООО «МонолитПроект»',
        'ООО «Инженерные сети столицы»',
        'ООО «Проектно-строительная компания Северо-Запад»',
        'ООО «Специализированное управление монолитного строительства»',
        'ООО «Комплексные инженерные системы и автоматизация зданий»',
        'ООО «Городская инфраструктура и благоустройство территорий»'
    ]);

    const PROGRESS_PROFILES = Object.freeze({
        'house-1': Object.freeze({ groups: [52, 20, 40, 10, 0], children: [100, 100, 90, 35, 42, 28, 18, 8, 62, 55, 48, 44, 33, 24, 12, 5, 0, 0, 0] }),
        'house-2': Object.freeze({ groups: [45, 16, 31, 8, 0], children: [100, 84, 66, 28, 34, 21, 12, 4, 50, 43, 36, 31, 24, 18, 8, 2, 0, 0, 0] }),
        'house-3': Object.freeze({ groups: [70, 35, 49, 28, 5], children: [100, 100, 96, 58, 62, 45, 32, 18, 74, 66, 57, 51, 42, 48, 31, 16, 24, 10, 0] }),
        parking: Object.freeze({ groups: [82, 60, 55, 34, 20], children: [100, 100, 100, 72, 86, 70, 52, 35, 78, 68, 61, 54, 43, 58, 39, 22, 45, 25, 8] }),
        kindergarten: Object.freeze({ groups: [95, 88, 79, 65, 40], children: [100, 100, 100, 90, 100, 94, 86, 72, 96, 88, 82, 75, 63, 84, 71, 52, 68, 43, 20] })
    });

    const projectCache = new Map();

    function clone(value) {
        return typeof window.structuredClone === 'function'
            ? window.structuredClone(value)
            : JSON.parse(JSON.stringify(value));
    }

    function addDays(dateString, days) {
        const date = new Date(`${dateString}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() + days);
        return date.toISOString().slice(0, 10);
    }

    function distributeWeight(groupWeight, childCount, childIndex) {
        const totalBasisPoints = Math.round(groupWeight * 100);
        const baseWeight = Math.floor(totalBasisPoints / childCount);
        const remainder = totalBasisPoints % childCount;
        return (baseWeight + (childIndex < remainder ? 1 : 0)) / 100;
    }

    function pluralizeRu(value, forms) {
        const absoluteValue = Math.abs(value) % 100;
        const lastDigit = absoluteValue % 10;
        if (absoluteValue > 10 && absoluteValue < 20) return forms[2];
        if (lastDigit === 1) return forms[0];
        if (lastDigit > 1 && lastDigit < 5) return forms[1];
        return forms[2];
    }

    function structureForms(label) {
        if (label === 'Уровни') return ['уровень', 'уровня', 'уровней'];
        if (label === 'Зоны') return ['зона', 'зоны', 'зон'];
        if (label === 'Корпуса') return ['корпус', 'корпуса', 'корпусов'];
        if (label === 'Секции') return ['секция', 'секции', 'секций'];
        return ['этаж', 'этажа', 'этажей'];
    }

    function createStructureLabel(passport) {
        const floorUnit = pluralizeRu(passport.floorCount, structureForms(passport.floorLabel));
        const sectionUnit = pluralizeRu(passport.sectionCount, structureForms(passport.sectionLabel));
        return `${passport.floorCount} ${floorUnit} · ${passport.sectionCount} ${sectionUnit}`;
    }

    function clampProgress(value) {
        return Math.max(0, Math.min(100, Math.round(value / 5) * 5));
    }

    function statusForProgress(progressPercent, index) {
        if (progressPercent === 0) return STATUS.NOT_STARTED;
        if (progressPercent === 100) return STATUS.COMPLETED;
        if (index % 7 === 0 && progressPercent < 50) return STATUS.DELAYED;
        return index % 3 === 0 ? STATUS.ON_SCHEDULE : STATUS.IN_PROGRESS;
    }

    function progressForGroup(profile, groupIndex) {
        if (groupIndex < profile.groups.length) return profile.groups[groupIndex];
        const baseProgress = profile.groups[0] + 24 - groupIndex * 2.4;
        const variance = ((groupIndex * 7) % 17) - 8;
        return clampProgress(baseProgress + variance);
    }

    function progressForChild(profile, groupProgress, groupIndex, childIndex) {
        const seedProgress = profile.children[(groupIndex + childIndex) % profile.children.length];
        const variance = ((childIndex * 5 + groupIndex * 3) % 13) - 6;
        return clampProgress(groupProgress * 0.65 + seedProgress * 0.35 + variance);
    }

    function createWorkRows(objectId) {
        const profile = PROGRESS_PROFILES[objectId];
        let absoluteChildIndex = 0;

        return GROUP_DEFINITIONS.flatMap(([groupId, groupName], groupIndex) => {
            const childCount = 15 + (groupIndex % 13);
            const weightPercent = groupIndex < 4 ? 4 : 3;
            const plannedStart = addDays('2024-02-12', groupIndex * 18);
            const durationDays = 300 + (groupIndex % 6) * 45;
            const plannedEnd = addDays(plannedStart, durationDays);
            const groupProgress = progressForGroup(profile, groupIndex);
            const groupRowId = `${objectId}:group:${groupId}`;
            const groupRow = {
                id: groupRowId,
                parentId: null,
                depth: 0,
                kind: 'work-group',
                code: String(groupIndex + 1),
                name: groupName,
                weightPercent,
                plannedStart,
                plannedEnd,
                contractorName: CONTRACTORS[groupIndex % CONTRACTORS.length],
                actualProgressPercent: groupProgress,
                status: statusForProgress(groupProgress, groupIndex),
                hasChildren: true
            };
            const children = Array.from({ length: childCount }, (_, childIndex) => {
                const childStartOffset = Math.floor((childIndex * durationDays) / (childCount + 3));
                const childDuration = Math.min(90 + (childIndex % 5) * 25, durationDays - childStartOffset);
                const stageNumber = childIndex + 1;
                const actualProgressPercent = progressForChild(profile, groupProgress, groupIndex, absoluteChildIndex);
                const row = {
                    id: `${objectId}:work-type:${groupId}-stage-${stageNumber}`,
                    parentId: groupRowId,
                    depth: 1,
                    kind: 'work-type',
                    code: `${groupIndex + 1}.${stageNumber}`,
                    name: `${groupName}: ${WORK_STAGE_NAMES[childIndex]}`,
                    weightPercent: distributeWeight(weightPercent, childCount, childIndex),
                    plannedStart: addDays(plannedStart, childStartOffset),
                    plannedEnd: addDays(plannedStart, childStartOffset + childDuration),
                    contractorName: CONTRACTORS[(groupIndex + childIndex) % CONTRACTORS.length],
                    actualProgressPercent,
                    status: statusForProgress(actualProgressPercent, absoluteChildIndex + groupIndex),
                    hasChildren: false
                };
                absoluteChildIndex += 1;
                return row;
            });

            return [groupRow, ...children];
        });
    }

    function createProjectModel(projectId) {
        if (!window.constructionObjectsData || typeof window.constructionObjectsData.getAll !== 'function') {
            throw new Error('objects-data.js требует предварительного подключения construction-objects-data.js.');
        }

        return {
            status: 'ready',
            projectId,
            contextId: projectId,
            objects: window.constructionObjectsData.getAll().map((identity) => {
                const passport = PASSPORTS[identity.id];
                return {
                    ...identity,
                    ...passport,
                    projectId,
                    cardStructureLabel: createStructureLabel(passport),
                    workRows: createWorkRows(identity.id)
                };
            })
        };
    }

    function resolveProjectId(context) {
        if (!context || context.type === 'bu' || context.type === 'business-unit' || context.type === 'businessUnit') return null;
        if (context.type === 'project') return context.id || context.projectId || null;
        if (context.type === 'queue') return context.projectId || null;
        return context.projectId || null;
    }

    function getForContext(context) {
        const projectId = resolveProjectId(context);
        if (!projectId) {
            return {
                status: 'unsupported-context',
                projectId: null,
                contextId: context?.id || null,
                title: 'Выберите проект',
                description: 'Раздел «Объекты» доступен для проекта или очереди внутри проекта.',
                objects: []
            };
        }

        if (!projectCache.has(projectId)) projectCache.set(projectId, createProjectModel(projectId));
        const model = clone(projectCache.get(projectId));
        model.contextId = context?.id || projectId;
        return model;
    }

    function validate(model) {
        const errors = [];
        if (!model || model.status !== 'ready') return errors;
        if (!model.projectId) errors.push('У ready-модели отсутствует projectId.');
        if (!Array.isArray(model.objects) || model.objects.length !== 5) {
            errors.push(`Ожидалось 5 объектов, получено ${model?.objects?.length ?? 0}.`);
            return errors;
        }

        const identities = window.constructionObjectsData.getAll();
        const identityById = new Map(identities.map((object) => [object.id, object]));
        const objectIds = new Set();

        model.objects.forEach((object) => {
            if (objectIds.has(object.id)) errors.push(`${object.id}: идентификатор объекта повторяется.`);
            objectIds.add(object.id);

            const identity = identityById.get(object.id);
            if (!identity) {
                errors.push(`${object.id}: объект отсутствует в общем identity catalog.`);
            } else if (['name', 'type', 'typeLabel', 'icon'].some((field) => object[field] !== identity[field])) {
                errors.push(`${object.id}: стабильная идентичность расходится с общим catalog.`);
            }
            if (!object.cardStructureLabel) errors.push(`${object.id}: отсутствует cardStructureLabel.`);
            if (!STATUS_VALUES.has(object.status)) errors.push(`${object.id}: неизвестный статус ${object.status}.`);
            if (!Number.isFinite(object.cardPlanProgressPercent) || object.cardPlanProgressPercent < 0 || object.cardPlanProgressPercent > 100) {
                errors.push(`${object.id}: cardPlanProgressPercent должен быть в диапазоне 0–100.`);
            }

            const rows = Array.isArray(object.workRows) ? object.workRows : [];
            const groups = rows.filter((row) => row.depth === 0);
            const children = rows.filter((row) => row.depth === 1);
            if (rows.some((row) => row.depth !== 0 && row.depth !== 1)) {
                errors.push(`${object.id}: таблица должна содержать только два уровня depth=0 и depth=1.`);
            }
            if (groups.length !== 32) errors.push(`${object.id}: ожидалось 32 группы работ, получено ${groups.length}.`);

            const groupWeight = groups.reduce((sum, group) => sum + group.weightPercent, 0);
            if (Math.abs(groupWeight - 100) > 0.001) {
                errors.push(`${object.id}: сумма весов групп равна ${groupWeight}, ожидалось 100.`);
            }

            const rowIds = new Set(rows.map((row) => row.id));
            if (rowIds.size !== rows.length) errors.push(`${object.id}: идентификаторы строк должны быть уникальными.`);

            rows.forEach((row) => {
                if (!STATUS_VALUES.has(row.status)) errors.push(`${row.id}: неизвестный статус ${row.status}.`);
                if (row.actualProgressPercent < 0 || row.actualProgressPercent > 100) {
                    errors.push(`${row.id}: готовность должна находиться в диапазоне 0–100.`);
                }
                if (!/^ООО\s/.test(row.contractorName)) {
                    errors.push(`${row.id}: наименование подрядчика должно начинаться с ООО.`);
                }
            });

            const contractorLengths = [...new Set(rows.map((row) => row.contractorName))].map((name) => name.length);
            if (!contractorLengths.length || Math.max(...contractorLengths) < 50 || Math.max(...contractorLengths) - Math.min(...contractorLengths) < 30) {
                errors.push(`${object.id}: fixture должен содержать короткие и длинные наименования подрядчиков.`);
            }

            groups.forEach((group) => {
                const groupChildren = children.filter((child) => child.parentId === group.id);
                const childNames = new Set(groupChildren.map((child) => child.name));
                const childrenWeight = groupChildren.reduce((sum, child) => sum + child.weightPercent, 0);
                if (!group.hasChildren || groupChildren.length < 15 || groupChildren.length > 27) {
                    errors.push(`${group.id}: ожидается от 15 до 27 дочерних работ.`);
                }
                if (childNames.size !== groupChildren.length) {
                    errors.push(`${group.id}: наименования дочерних работ должны быть уникальными внутри группы.`);
                }
                if (Math.abs(childrenWeight - group.weightPercent) > 0.001) {
                    errors.push(`${group.id}: сумма дочерних весов ${childrenWeight}, вес группы ${group.weightPercent}.`);
                }
                groupChildren.forEach((child) => {
                    if (child.kind !== 'work-type' || child.hasChildren) {
                        errors.push(`${child.id}: строка второго уровня должна быть конечным work-type.`);
                    }
                    if (child.plannedStart < group.plannedStart || child.plannedEnd > group.plannedEnd) {
                        errors.push(`${child.id}: плановый срок не входит в срок родительской группы.`);
                    }
                });
            });

            children.forEach((child) => {
                if (!rowIds.has(child.parentId)) errors.push(`${child.id}: родительская группа ${child.parentId} не найдена.`);
            });
        });

        return errors;
    }

    window.objectsData = Object.freeze({ STATUS, getForContext, validate });
})(window);
