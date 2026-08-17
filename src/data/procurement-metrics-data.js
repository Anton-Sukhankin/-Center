/**
 * Demonstration data for the procurement section of MetricsDashboard.
 * Metric names and calculation meanings follow the source workbook contract.
 * Values, norms, TOP-3 details and risk rows belong to the agreed prototype dataset.
 */
const SCenterProcurementMetricsData = (function () {
    const SOURCE_PROJECT_ID = 'proj-novy-kvartal';

    const risks = [
        { id: 'T-15234', subject: 'Минеральная вата', type: 'Материалы', cost: '14,2 млн ₽', costMillions: 14.2, required: '18.08.2024', forecast: '25.08.2024', reserve: -7, status: 'Критично', owner: 'Анна Белова' },
        { id: 'T-15411', subject: 'Лифтовое оборудование', type: 'Материалы', cost: '48,7 млн ₽', costMillions: 48.7, required: '12.09.2024', forecast: '10.09.2024', reserve: 2, status: 'Внимание', owner: 'Илья Орлов' },
        { id: 'T-15562', subject: 'Бетон и смеси', type: 'Материалы', cost: '32,1 млн ₽', costMillions: 32.1, required: '05.09.2024', forecast: '28.08.2024', reserve: 8, status: 'Контроль', owner: 'Антон Сергеев' },
        { id: 'T-15603', subject: 'Фасадные панели', type: 'Работы', cost: '26,5 млн ₽', costMillions: 26.5, required: '20.08.2024', forecast: '22.08.2024', reserve: -2, status: 'Внимание', owner: 'Мария Соколова' },
        { id: 'T-15677', subject: 'Электрощитовое оборудование', type: 'Материалы', cost: '19,8 млн ₽', costMillions: 19.8, required: '03.09.2024', forecast: '05.09.2024', reserve: -2, status: 'Внимание', owner: 'Павел Елисеев' },
        { id: 'T-15702', subject: 'Окна ПВХ', type: 'Работы', cost: '12,4 млн ₽', costMillions: 12.4, required: '15.08.2024', forecast: '19.08.2024', reserve: -4, status: 'Критично', owner: 'Ольга Васина' },
        { id: 'T-15745', subject: 'Инженерные трубы', type: 'Материалы', cost: '9,5 млн ₽', costMillions: 9.5, required: '25.09.2024', forecast: '26.09.2024', reserve: 1, status: 'Контроль', owner: 'Денис Юдин' }
    ];

    const riskTotalMillions = Math.round(
        risks.reduce((total, risk) => total + risk.costMillions, 0) * 10
    ) / 10;
    const riskTotalLabel = `${String(riskTotalMillions).replace('.', ',')} млн ₽`;

    const dataset = {
        status: 'ready',
        dataStatus: 'demo',
        dataStatusLabel: 'Демо-данные',
        updatedAt: '2025-06-08T09:15:00+03:00',
        sourceProjectId: SOURCE_PROJECT_ID,
        sourceProjectLabel: 'Новый квартал',
        summary: [
            {
                id: 'total-budget',
                label: 'Бюджет закупок',
                sourceLabel: 'Общий бюджет закупок',
                value: '24,0 млрд ₽',
                note: 'Работы 14,1 млрд ₽ · Материалы 9,9 млрд ₽',
                icon: 'wallet-cards',
                tone: 'neutral'
            },
            {
                id: 'contracted-budget',
                label: 'Законтрактовано',
                sourceLabel: 'Законтрактовано бюджета; доля законтрактованного бюджета',
                value: '17,3 млрд ₽',
                note: '72% общего бюджета закупок',
                icon: 'briefcase-business',
                tone: 'neutral'
            },
            {
                id: 'contract-deviation',
                label: 'Отклонение договоров',
                sourceLabel: 'Отклонение стоимости договоров от бюджета; сумма превышения / экономии бюджета',
                value: '+4,8%',
                note: 'К бюджетным основаниям · +1,15 млрд ₽',
                icon: 'trending-up',
                tone: 'danger'
            },
            {
                id: 'tender-duration',
                label: 'Срок проведения тендера',
                sourceLabel: 'Средний срок проведения тендера',
                value: '18 дней',
                note: 'Норма · 14 дней',
                icon: 'calendar-days',
                tone: 'danger'
            },
            {
                id: 'participants-per-lot',
                label: 'Участников на лот',
                sourceLabel: 'Среднее количество участников на лот',
                value: '4,2',
                note: 'Среднее · Норма 3,1',
                icon: 'users-round',
                tone: 'success'
            },
            {
                id: 'procurement-risk',
                label: 'Закупки под риском',
                sourceLabel: 'Закупки под риском',
                value: `${risks.length} тендеров`,
                note: `Оценка видимых процедур · ${riskTotalLabel}`,
                icon: 'shield-alert',
                tone: 'danger'
            }
        ],
        contracting: {
            totalBudgetLabel: 'Общий бюджет закупок',
            totalBudget: '24,0 млрд ₽',
            worksBudgetLabel: 'Бюджет работ',
            worksBudget: '14,1 млрд ₽',
            materialsBudgetLabel: 'Бюджет материалов',
            materialsBudget: '9,9 млрд ₽',
            contractedBudgetLabel: 'Законтрактовано бюджета',
            contractedBudget: '17,3 млрд ₽',
            contractedShareLabel: 'Доля законтрактованного бюджета',
            contractedShare: 72,
            openTendersLabel: 'Стоимость открытых тендеров',
            openTenders: '3,9 млрд ₽',
            openTendersShare: 16,
            remainingBudgetLabel: 'Остаток бюджета',
            remainingBudget: '2,8 млрд ₽',
            remainingShare: 12,
            works: {
                label: 'Законтрактовано работ',
                shareLabel: 'Доля законтрактованных работ',
                value: '10,2 млрд ₽',
                budget: '14,1 млрд ₽',
                share: 72,
                accent: 'blue'
            },
            materials: {
                label: 'Законтрактовано материалов',
                shareLabel: 'Доля законтрактованных материалов',
                value: '7,1 млрд ₽',
                budget: '9,9 млрд ₽',
                share: 72,
                accent: 'violet'
            }
        },
        financialEffect: {
            deviationLabel: 'Отклонение стоимости договоров от бюджета',
            deviationPercent: '+4,8%',
            absoluteEffectLabel: 'Сумма превышения / экономии бюджета',
            absoluteEffect: '+1,15 млрд ₽',
            worksLabel: 'ТОП-3 работ с превышением бюджета',
            materialsLabel: 'ТОП-3 материалов с превышением бюджета',
            works: [
                { name: 'Монолитные работы', budget: 4200, contract: 4460, delta: '+260 млн ₽', percent: '+6,2%' },
                { name: 'Отделочные работы', budget: 1850, contract: 2020, delta: '+170 млн ₽', percent: '+9,2%' },
                { name: 'Фасадные работы', budget: 1100, contract: 1190, delta: '+90 млн ₽', percent: '+8,2%' }
            ],
            materials: [
                { name: 'Фасадные материалы', budget: 820, contract: 1040, delta: '+220 млн ₽', percent: '+26,8%' },
                { name: 'Лифтовое оборудование', budget: 580, contract: 700, delta: '+120 млн ₽', percent: '+20,7%' },
                { name: 'Кабельно-проводниковая продукция', budget: 330, contract: 400, delta: '+70 млн ₽', percent: '+21,2%' }
            ]
        },
        efficiency: [
            {
                id: 'average-tender-duration',
                label: 'Средний срок проведения тендера',
                value: '18 дней',
                norm: '14 дней',
                delta: '+4 дня',
                status: 'Выше нормы',
                icon: 'calendar-days',
                positive: false
            },
            {
                id: 'average-participants',
                label: 'Среднее количество участников на лот',
                value: '4,2',
                norm: '3,1',
                delta: '+1,1',
                status: 'Достаточная конкуренция',
                icon: 'users-round',
                positive: true
            },
            {
                id: 'average-lots',
                label: 'Среднее количество лотов на тендер',
                value: '4,8',
                norm: '3,0',
                delta: '+1,8',
                status: 'Выше нормы',
                icon: 'layers-3',
                positive: false
            },
            {
                id: 'single-participant-share',
                label: 'Доля лотов с одним участником',
                value: '18%',
                norm: '10%',
                delta: '+8 п.п.',
                status: 'Выше нормы',
                icon: 'user-round-x',
                positive: false
            }
        ],
        riskSummary: {
            sourceLabel: 'Закупки под риском',
            count: risks.length,
            totalCost: riskTotalLabel,
            selectionStatus: 'static-demo',
            thresholdStatus: 'not-approved'
        },
        risks
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getForContext(context) {
        const result = clone(dataset);
        result.contextKey = context && context.type && context.id
            ? `${context.type}:${context.id}`
            : 'unsupported';
        result.projectId = context && context.type === 'queue'
            ? context.projectId
            : (context ? context.id : null);
        result.isSourceProject = result.projectId === SOURCE_PROJECT_ID;
        return result;
    }

    return { getForContext };
})();
