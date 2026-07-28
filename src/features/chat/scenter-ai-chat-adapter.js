(function configureSCenterAIChat(global) {
    'use strict';

    const CHAT_STORAGE_PREFIX = 'scenter.aiChat';
    const CHAT_RESPONSE_DELAY_MS = 1600;
    const QUICK_QUESTIONS = [
        'Какой сейчас статус проекта?',
        'Какие события требуют внимания?',
        'Что происходит с ключевыми метриками?',
        'Какие календарные этапы нужно проверить?'
    ];
    const FOLLOW_UP_QUESTIONS = [
        [
            'Какие события высокого приоритета влияют на этот статус?',
            'Какая очередь сейчас требует первоочередного внимания?',
            'Что проверить в проекте перед управленческим решением?'
        ],
        [
            'Какие физические параметры нужно добавить в справочник?',
            'Покажи строительные показатели по выбранной очереди',
            'Какие очереди формируют текущий объем проекта?'
        ],
        [
            'Какие события стоит исключить перед AI-анализом?',
            'Что закрепить для оперативного контроля?',
            'Сколько карточек высокого приоритета осталось проверить?'
        ],
        [
            'Какие события влияют на выбранную метрику?',
            'Почему фильтры не пересчитывают метрики?',
            'Какие дочерние показатели формируют эту метрику?'
        ],
        [
            'Какие ближайшие этапы проекта требуют контроля?',
            'Есть ли риск сдвига сроков по этой очереди?',
            'Какие события связаны с датой заселения?'
        ]
    ];
    const PNL_INCIDENT_FOLLOW_UP_QUESTIONS = [
        'Какие события еще влияют на чистую прибыль?',
        'Что указать в задаче по РНС?',
        'Какие метрики P&L проверить после этого инцидента?'
    ];
    let chatLabelObserver = null;
    let activeQuickQuestions = [...QUICK_QUESTIONS];
    let quickQuestionsHiddenUntilResponse = false;

    function cloneValue(value) {
        if (typeof structuredClone === 'function') return structuredClone(value);
        return JSON.parse(JSON.stringify(value));
    }

    function getActiveContextName(context) {
        const headerTitle = document.querySelector('#project-header-container h1, #project-header-container .project-title');
        if (headerTitle && headerTitle.textContent.trim()) return headerTitle.textContent.trim();
        return context?.name || context?.title || context?.id || 'Контекст не выбран';
    }

    function getActiveEventId() {
        const drawer = document.getElementById('event-drawer');
        if (!drawer || !drawer.classList.contains('open')) return null;
        const activeCard = document.querySelector('.event-card.is-active, .event-card.active');
        return activeCard?.getAttribute('data-event-id') || null;
    }

    function getVisibleEventIds() {
        return Array.from(document.querySelectorAll('#priority-events-container .event-card[data-event-id]'))
            .map(card => card.getAttribute('data-event-id'))
            .filter(Boolean);
    }

    function getActiveEventsPreview() {
        const events = typeof global.getActiveEvents === 'function' ? global.getActiveEvents() : [];
        const visibleIds = new Set(getVisibleEventIds());
        return events
            .filter(event => visibleIds.size === 0 || visibleIds.has(event.id))
            .slice(0, 30)
            .map(event => ({
                id: event.id,
                title: event.title,
                text: event.text,
                dateText: event.dateText,
                priority: event.priority,
                metricId: event.metricId,
                metricName: event.metricName,
                projectName: event.projectName,
                queue: event.queue,
                objectName: event.objectName
            }));
    }

    function getCurrentContextEvents(context) {
        if (global.activeContext && typeof global.appData?.getEventsForContext === 'function') {
            return global.appData.getEventsForContext(global.activeContext);
        }
        if (typeof global.getActiveEvents === 'function') return global.getActiveEvents();
        return context?.activeEventsPreview || [];
    }

    function getContextEntity(context) {
        if (!context?.contextId || typeof global.projectStructureData?.findProjectEntityById !== 'function') return null;
        return global.projectStructureData.findProjectEntityById(context.contextId);
    }

    function getContextConstructionMetrics() {
        if (typeof global.appData?.getConstructionMetricsForContext !== 'function') return null;
        return global.appData.getConstructionMetricsForContext(global.activeContext || {});
    }

    function formatNumber(value) {
        const number = Number(value);
        if (Number.isNaN(number)) return '0';
        return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(number);
    }

    function getExcludedEventIds() {
        return Array.from(document.querySelectorAll('.event-card.is-excluded[data-event-id], .event-card.excluded[data-event-id]'))
            .map(card => card.getAttribute('data-event-id'))
            .filter(Boolean);
    }

    function getPinnedEventIds() {
        return Array.from(document.querySelectorAll('.event-card.pinned[data-event-id]'))
            .map(card => card.getAttribute('data-event-id'))
            .filter(Boolean);
    }

    function getFilterSnapshot() {
        const filterState = global.filterState || {};
        return {
            period: filterState.period || '',
            sources: Array.isArray(filterState.sources) ? [...filterState.sources] : [],
            priority: filterState.priority || (filterState.priorityOnly ? 'high' : 'all'),
            metrics: Array.isArray(filterState.metrics)
                ? [...filterState.metrics]
                : (filterState.metric ? [filterState.metric] : [])
        };
    }

    function resolveMode() {
        if (document.getElementById('event-drawer')?.classList.contains('open')) return 'event-detail';
        if (global.toolbarState?.mode === 'filtered') return 'filtered-selection';
        return 'event-feed';
    }

    function getContext() {
        const activeContext = global.activeContext || {};
        const filterState = global.filterState || {};
        const contextName = getActiveContextName(activeContext);
        const visibleEventIds = getVisibleEventIds();

        return {
            mode: resolveMode(),
            projectTitle: contextName,
            contextType: activeContext.type || null,
            contextId: activeContext.id || null,
            contextName,
            projectIds: Array.isArray(activeContext.projectIds) ? [...activeContext.projectIds] : [],
            queueIds: Array.isArray(activeContext.queueIds) ? [...activeContext.queueIds] : [],
            activeTab: filterState.activeTab || 'today',
            priorityView: filterState.priorityView || 'high',
            searchQuery: filterState.searchQuery || '',
            filters: getFilterSnapshot(),
            visibleEventIds,
            activeEventsPreview: getActiveEventsPreview(),
            excludedEventIds: getExcludedEventIds(),
            pinnedEventIds: getPinnedEventIds(),
            activeMetricId: global.activeMetricId || null,
            activeEventId: getActiveEventId(),
            constructionMetrics: getContextConstructionMetrics()
        };
    }

    function getContextLabel(context) {
        const parts = ['Контекст'];
        if (context.contextName) parts.push(context.contextName);
        if (context.activeTab) parts.push(context.activeTab);
        if (context.priorityView) parts.push(context.priorityView === 'high' ? 'высокий приоритет' : 'низкий приоритет');
        if (context.visibleEventIds?.length) parts.push(`${context.visibleEventIds.length} событий на экране`);
        return parts.join(' · ');
    }

    function getSuggestedChatTitle(context) {
        if (context.activeEventId) return `Событие ${context.activeEventId}`;
        if (context.activeMetricId) return `Метрика ${context.activeMetricId}`;
        return context.contextName || 'Контекст S.Center';
    }

    function createInitialWorkspace() {
        const now = new Date().toISOString();
        const context = getContext();
        return {
            activeChatId: 'scenter_chat_current_context',
            chats: [
                {
                    id: 'scenter_chat_current_context',
                    title: 'Контекст S.Center',
                    description: context.contextName || 'Текущий контекст',
                    participantsLabel: 'Пользователь / Ассистент',
                    unreadCount: 0,
                    context,
                    createdAt: now,
                    updatedAt: now,
                    messages: []
                }
            ]
        };
    }

    function normalizeSingleChatWorkspace(workspace) {
        const fallback = createInitialWorkspace();
        const sourceChat = workspace?.chats?.find(chat => chat.id === workspace.activeChatId)
            || workspace?.chats?.[0]
            || fallback.chats[0];
        const normalizedChat = {
            ...fallback.chats[0],
            ...cloneValue(sourceChat),
            id: fallback.activeChatId,
            title: fallback.chats[0].title,
            description: fallback.chats[0].description,
            unreadCount: 0,
            context: getContext()
        };

        return {
            activeChatId: fallback.activeChatId,
            chats: [normalizedChat]
        };
    }

    function closeEventDrawer() {
        const drawer = document.getElementById('event-drawer');
        if (!drawer?.classList.contains('open')) return;
        const closeButton = document.getElementById('close-event-drawer-btn');
        if (closeButton) {
            closeButton.click();
            return;
        }
        document.getElementById('event-drawer-overlay')?.click();
    }

    function closeAnalyticsModal() {
        const modalOverlay = document.getElementById('ai-analytics-modal-overlay');
        if (!modalOverlay?.classList.contains('active')) return;
        if (global.aiInsights?.closeModal) {
            global.aiInsights.closeModal();
        }
    }

    function closeConflictingPanels() {
        closeEventDrawer();
        if (typeof global.closeMetricDrawer === 'function') global.closeMetricDrawer();
        if (typeof global.closeFilterDrawer === 'function') global.closeFilterDrawer();
        if (typeof global.closeBIModal === 'function') global.closeBIModal();
        closeAnalyticsModal();
        return true;
    }

    function loadWorkspace(key) {
        try {
            global.localStorage.removeItem(`${CHAT_STORAGE_PREFIX}.${key}`);
            return null;
        } catch (error) {
            console.warn('[SCenterChat] Не удалось загрузить историю чата.', error);
            return null;
        }
    }

    function saveWorkspace() {
        try {
            return true;
        } catch (error) {
            console.warn('[SCenterChat] Не удалось сохранить историю чата.', error);
            return false;
        }
    }

    function resetChatSession() {
        activeQuickQuestions = [...QUICK_QUESTIONS];
        quickQuestionsHiddenUntilResponse = false;
        if (global.SCostAIChat?.setState) {
            global.SCostAIChat.setState(createInitialWorkspace());
        }
        applySCenterChatLabels();
    }

    function applySCenterChatLabels() {
        const title = document.querySelector('#scenter-ai-chat-root .ai-header-title');
        if (title && title.textContent.trim() !== 'Ассистент AIShtab') {
            title.textContent = 'Ассистент AIShtab';
        }

        const description = document.querySelector('#scenter-ai-chat-root .ai-header-context');
        if (description && description.textContent.trim() !== 'Задайте вопрос по физическим параметрам, срокам или статусу') {
            description.textContent = 'Задайте вопрос по физическим параметрам, срокам или статусу';
        }

        document.querySelectorAll('#scenter-ai-chat-root .message-sender').forEach(sender => {
            const label = sender.textContent.trim();
            if (label && label !== 'Вы' && label !== 'Оператор' && label !== 'Ассистент') {
                sender.textContent = 'Ассистент';
            }
        });

        const typingText = document.querySelector('#scenter-ai-chat-root .typing-text');
        if (typingText && typingText.textContent.trim() !== 'Ассистент анализирует контекст...') {
            typingText.textContent = 'Ассистент анализирует контекст...';
        }

        const emptyStateText = document.querySelector('#scenter-ai-chat-root .chat-empty-state p');
        if (emptyStateText && emptyStateText.textContent.trim() !== 'Задайте вопрос по текущему проекту, событиям, метрикам или статусу работ.') {
            emptyStateText.textContent = 'Задайте вопрос по текущему проекту, событиям, метрикам или статусу работ.';
        }

        const textarea = document.getElementById('ai-chat-input');
        if (textarea) {
            textarea.setAttribute('placeholder', 'Задайте вопрос по проекту, событиям или метрикам...');
            textarea.setAttribute('aria-label', 'Вопрос ассистенту S.Center');
        }

        updateChatInputRadiusState();
        renderQuickQuestions();
    }

    function updateChatInputRadiusState() {
        const textarea = document.getElementById('ai-chat-input');
        const container = textarea?.closest('.input-container');
        if (!textarea || !container) return;

        const inlineHeight = parseFloat(textarea.style.height);
        const actualHeight = Number.isNaN(inlineHeight) ? textarea.scrollHeight : inlineHeight;
        const hasManualBreak = textarea.value.includes('\n');
        const isMultiline = hasManualBreak || actualHeight > 32;

        container.classList.toggle('is-multiline', isMultiline);
    }

    function renderQuickQuestions() {
        const list = document.getElementById('ai-drawer-messages-list');
        if (!list) return;

        const existing = list.querySelector('.scenter-chat-quick-questions');
        const questions = Array.isArray(activeQuickQuestions) ? activeQuickQuestions.filter(Boolean) : [];
        const signature = questions.join('|');

        if (quickQuestionsHiddenUntilResponse || questions.length === 0) {
            if (existing) existing.remove();
            return;
        }

        if (existing?.dataset.questionsSignature === signature) return;
        if (existing) existing.remove();

        const markup = `
            <div class="scenter-chat-quick-questions" aria-label="Быстрые вопросы" data-questions-signature="${escapeAttribute(signature)}">
                ${questions.map(question => `
                    <button class="scenter-chat-quick-question" type="button" data-question="${escapeAttribute(question)}">
                        ${escapeHtml(question)}
                    </button>
                `).join('')}
            </div>
        `;

        list.insertAdjacentHTML('beforeend', markup);
        list.scrollTop = list.scrollHeight;
    }

    function setQuickQuestionsHidden(isHidden) {
        quickQuestionsHiddenUntilResponse = Boolean(isHidden);
        renderQuickQuestions();
    }

    function setActiveQuickQuestions(questions) {
        activeQuickQuestions = Array.isArray(questions) && questions.length
            ? [...questions]
            : [...QUICK_QUESTIONS];
        quickQuestionsHiddenUntilResponse = false;
    }

    function submitQuickQuestion(question) {
        const textarea = document.getElementById('ai-chat-input');
        const sendButton = document.getElementById('btn-send-message-btn');
        if (!textarea || !sendButton) return;

        setQuickQuestionsHidden(true);
        textarea.value = question;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        sendButton.click();
    }

    function handleQuickQuestionClick(event) {
        const button = event.target.closest?.('.scenter-chat-quick-question');
        if (!button) return;
        submitQuickQuestion(button.dataset.question || button.textContent.trim());
    }

    function handleChatInputStateEvent(event) {
        const isInputEvent = event.target?.id === 'ai-chat-input';
        const isSendClick = event.target?.closest?.('#btn-send-message-btn');
        if (!isInputEvent && !isSendClick) return;

        global.setTimeout(updateChatInputRadiusState, 0);
    }

    function handleChatInputKeydown(event) {
        if (event.target?.id !== 'ai-chat-input') return;
        global.setTimeout(updateChatInputRadiusState, 0);
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#96;');
    }

    function startSCenterChatLabelObserver() {
        if (chatLabelObserver) return;
        const mount = document.getElementById('scenter-ai-chat-root');
        if (!mount || typeof MutationObserver !== 'function') return;
        chatLabelObserver = new MutationObserver(() => applySCenterChatLabels());
        chatLabelObserver.observe(mount, { childList: true, subtree: true });
        mount.addEventListener('click', handleQuickQuestionClick);
        mount.addEventListener('click', handleChatInputStateEvent);
        mount.addEventListener('input', handleChatInputStateEvent);
        mount.addEventListener('keydown', handleChatInputKeydown);
    }

    function wait(ms) {
        return new Promise(resolve => global.setTimeout(resolve, ms));
    }

    function getRandomDemoAnswerIndex(length) {
        return Math.floor(Math.random() * length);
    }

    function normalizeChatText(text) {
        return String(text || '')
            .toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/[«»"]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function isPnLIncidentQuestion(text) {
        const value = normalizeChatText(text);
        if (!value) return false;

        const hasRnsShift = value.includes('перенос рнс')
            || value.includes('сдвиг рнс')
            || value.includes('получения рнс');
        const hasSecondQueue = value.includes('2-й очеред')
            || value.includes('2 очеред')
            || value.includes('второй очеред');
        const hasPnL = value.includes('p&l')
            || value.includes('pnl')
            || value.includes('p l')
            || value.includes('пл-дерев')
            || value.includes('чистой прибыли')
            || value.includes('чистая прибыль');

        return hasRnsShift && hasSecondQueue && hasPnL;
    }

    function getPrioritySummary(events) {
        const eventList = Array.isArray(events) ? events : [];
        const highCount = eventList.filter(event => event.priority === 'high').length;
        const lowCount = eventList.filter(event => event.priority === 'low').length;
        const criticalCount = eventList.filter(event => event.priority === 'critical').length;

        return { highCount, lowCount, criticalCount, totalCount: eventList.length };
    }

    function formatMetricValue(value, suffix) {
        if (value === null || value === undefined || value === '') return 'нет данных';
        const number = Number(value);
        if (Number.isNaN(number)) return String(value);
        return `${formatNumber(number)}${suffix ? ` ${suffix}` : ''}`;
    }

    function getEventExamples(events, count) {
        return (Array.isArray(events) ? events : [])
            .slice(0, count)
            .map(event => `- ${event.title || 'Событие без названия'} (${event.dateText || 'дата не указана'}; ${event.metricName || event.metricId || 'метрика не указана'})`)
            .join('\n');
    }

    function buildPhysicalAnswer(context) {
        const entity = getContextEntity(context);
        const queueCount = context?.queueIds?.length || 0;
        const construction = context?.constructionMetrics || getContextConstructionMetrics();
        const entityName = context?.contextName || 'выбранного контекста';
        const stage = entity?.headerAttributes?.stage || 'стадия не указана';
        const volumeText = construction?.volume
            ? `${formatNumber(construction.volume.forecast)} м² прогнозного объема`
            : 'объем не рассчитан';
        const durationText = construction?.duration
            ? `${formatNumber(construction.duration.forecast)} дней прогнозно против ${formatNumber(construction.duration.plan)} дней плана`
            : 'длительность не рассчитана';

        return [
            '### Физические параметры контекста',
            `**Краткий вывод:** по контексту "${entityName}" доступны демонстрационные строительные показатели, но еще не подключен отдельный справочник физических характеристик объектов.`,
            `**Что видно сейчас:** в выбранном контуре учитывается ${queueCount || 'нет данных по'} очередей. Текущая стадия в шапке контекста: ${stage}. Расчетный показатель объема: ${volumeText}. По длительности: ${durationText}.`,
            [
                '**Как читать эти данные:**',
                '- показатель объема сейчас используется как агрегированный строительный ориентир выбранного бизнес-юнита, проекта или очереди;',
                '- на уровне проекта значение должно складываться из очередей, а на уровне бизнес-юнита — из всех дочерних проектов;',
                '- если пользователь спускается до очереди, ответ должен сужаться до этой фазы строительства без подмешивания данных соседних очередей.'
            ].join('\n'),
            [
                '**Чего пока не хватает для точного ответа:**',
                '- количество жилых домов, корпусов, секций и строений не хранится отдельным атрибутом в текущем слое данных;',
                '- нет промышленного справочника физических характеристик проекта;',
                '- нет связи с реальным календарным источником, где можно проверить статус каждого корпуса или этапа.'
            ].join('\n'),
            'Следующий практический шаг: если вопрос пользователя касается домов, корпусов или секций, ассистент должен явно отделять доступные расчетные показатели от отсутствующих справочных данных и предлагать добавить справочник физических параметров проекта.'
        ].join('\n\n');
    }

    function buildEventFocusAnswer(context) {
        const events = getCurrentContextEvents(context);
        const visibleCount = context?.visibleEventIds?.length || 0;
        const pinnedCount = context?.pinnedEventIds?.length || 0;
        const excludedCount = context?.excludedEventIds?.length || 0;
        const { highCount, lowCount, criticalCount } = getPrioritySummary(events);
        const examples = getEventExamples(events.filter(event => event.priority === 'high'), 3);

        return [
            '### Оперативный фокус событий',
            `**Краткий вывод:** в контексте "${context?.contextName || 'контекст не выбран'}" ассистент видит ${events.length} событий. Из них высокий приоритет: ${highCount}, низкий приоритет: ${lowCount}, критический приоритет: ${criticalCount}.`,
            `**Экранная выборка:** сейчас на экране отображается ${visibleCount} карточек. Закреплено: ${pinnedCount}. Исключено из текущей выборки: ${excludedCount}. Эти действия управляют фокусом пользователя, но не удаляют события из системы.`,
            examples
                ? ['**Примеры событий, которые стоит проверить первыми:**', examples].join('\n')
                : '**Примеры событий:** в текущей выборке нет карточек высокого приоритета, поэтому стоит проверить низкий приоритет или перейти на вкладку "Все события".',
            [
                '**Как действовать:**',
                '- сначала разобрать события высокого приоритета, потому что они ближе всего к управленческому решению;',
                '- затем применить фильтры по источнику, метрике или периоду, если нужно собрать выборку для AI-аналитики;',
                '- после применения фильтров исключить нерелевантные карточки, чтобы ассистент не учитывал лишний шум в массовом анализе;',
                '- закрепить события, которые нужно оставить в оперативном контроле после закрытия текущей выборки.'
            ].join('\n'),
            'Ограничение текущего прототипа: приоритеты и ответы являются демонстрационными. В промышленной версии приоритизация должна рассчитываться AI/ML-моделью на основании риска, влияния на метрики, сроков реакции и роли пользователя.'
        ].join('\n\n');
    }

    function buildStatusAnswer(context) {
        const entity = getContextEntity(context);
        const events = getCurrentContextEvents(context);
        const { highCount, lowCount, criticalCount } = getPrioritySummary(events);
        const construction = context?.constructionMetrics || getContextConstructionMetrics();
        const durationText = construction?.duration
            ? `${formatNumber(construction.duration.forecast)} дней прогнозно против ${formatNumber(construction.duration.plan)} дней плана`
            : 'сроки не рассчитаны';
        const stage = entity?.headerAttributes?.stage || 'стадия не указана';
        const examples = getEventExamples(events, 3);

        return [
            '### Текущий статус реализации',
            `**Краткий вывод:** выбранный контекст "${context?.contextName || 'выбранный контекст'}" находится в состоянии "${stage}". По строительному циклу сейчас отображается: ${durationText}.`,
            `**Операционная картина:** в контексте найдено ${events.length} событий. Высокий приоритет: ${highCount}; низкий приоритет: ${lowCount}; критический приоритет: ${criticalCount}. Это означает, что ежедневный фокус должен начинаться не с пассивного мониторинга метрик, а с разбора карточек, которые требуют реакции.`,
            examples
                ? ['**События, формирующие текущую картину:**', examples].join('\n')
                : '**События:** в текущем контексте нет демонстрационных карточек, поэтому статус можно оценить только по шапке и строительным показателям.',
            [
                '**Интерпретация для пользователя:**',
                '- если выбран бизнес-юнит, статус является агрегированным и собирает события дочерних проектов;',
                '- если выбран проект, статус показывает сводную картину по всем его очередям;',
                '- если выбрана очередь, статус должен отражать только эту фазу строительства;',
                '- карточки высокого приоритета показывают, где требуется управленческая реакция, а не просто информационное ознакомление.'
            ].join('\n'),
            [
                '**Что проверить перед решением:**',
                '- есть ли события, связанные со сроками, подрядчиками, штрафами или невыходом рабочих;',
                '- есть ли закрепленные события, которые уже были признаны важными;',
                '- не применены ли фильтры, которые скрывают часть картины;',
                '- совпадает ли уровень дерева слева с тем уровнем, по которому пользователь хочет получить ответ.'
            ].join('\n')
        ].join('\n\n');
    }

    function buildMetricAnswer(context) {
        const activeMetricId = context?.activeMetricId || global.activeMetricId;
        const metric = Array.isArray(global.metricsData)
            ? global.metricsData.find(item => item.id === activeMetricId) || global.metricsData[0]
            : null;
        const construction = context?.constructionMetrics || getContextConstructionMetrics();
        const durationText = construction?.duration
            ? `${formatNumber(construction.duration.forecast)} дней прогнозно`
            : 'длительность не рассчитана';
        const volumeText = construction?.volume
            ? `${formatNumber(construction.volume.forecast)} м² прогнозного объема`
            : 'объем не рассчитан';
        const metricSummary = metric
            ? [
                `- факт: ${formatMetricValue(metric.fact, metric.unit)}`,
                `- план: ${formatMetricValue(metric.plan, metric.unit)}`,
                `- прогноз: ${formatMetricValue(metric.forecast, metric.unit)}`,
                `- отклонение от бюджета: ${formatMetricValue(metric.delta, metric.unit)}`,
                `- отклонение от предыдущего месяца: ${formatMetricValue(metric.deltaPrevMonth, '%')}`
            ].join('\n')
            : '- фокусная метрика пока не выбрана или недоступна.';

        return [
            '### Метрики контекста',
            metric
                ? `**Краткий вывод:** фокусная финансовая метрика сейчас — "${metric.name || metric.title || metric.id}". Ее значения берутся из текущего расчетного дерева прототипа для выбранного структурного контекста.`
                : '**Краткий вывод:** фокусная финансовая метрика пока не выбрана или недоступна в текущем состоянии.',
            ['**Расчетные значения фокусной метрики:**', metricSummary].join('\n'),
            `**Строительные показатели:** ${durationText}; ${volumeText}. Эти показатели меняются при переключении бизнес-юнита, проекта или очереди по тому же принципу агрегации, что и финансовые метрики.`,
            [
                '**Правило агрегации:**',
                '- очередь считается по своим данным;',
                '- проект считается как сумма или сводное значение всех очередей;',
                '- бизнес-юнит считается как агрегация всех дочерних проектов;',
                '- родительская финансовая метрика должна складываться из дочерних, а не жить как независимое мок-значение.'
            ].join('\n'),
            [
                '**Важное ограничение:**',
                '- фильтры событий не пересчитывают финансовые или строительные метрики;',
                '- исключение карточки из выдачи не меняет числовые показатели;',
                '- фильтры и исключения нужны для подготовки очищенной выборки перед AI-анализом, а не для изменения расчетной модели.'
            ].join('\n')
        ].join('\n\n');
    }

    function buildDatesAnswer(context) {
        const events = getCurrentContextEvents(context);
        const scheduleEvents = events
            .filter(event => event.metricId === 'GANTT_DATES' || /(срок|дата|рнс|смр|засел|оконч)/i.test(`${event.title || ''} ${event.text || ''}`))
            .slice(0, 5);

        if (scheduleEvents.length === 0) {
            return [
                '### Контрольные этапы и сроки',
                `**Краткий вывод:** в текущем контексте "${context?.contextName || 'контекст не выбран'}" нет демонстрационных событий, которые явно связаны с контрольными этапами, РНС, СМР, заселением или окончанием работ.`,
                [
                    '**Что это значит:**',
                    '- ассистент не должен придумывать дату, если она отсутствует в данных;',
                    '- для точного ответа нужен календарный источник с этапами по очередям;',
                    '- в промышленной версии такой ответ должен строиться из графика проекта, а не из текста карточек.'
                ].join('\n'),
                [
                    '**Какие данные нужно подключить:**',
                    '- тип контрольной вехи: РНС, старт СМР, окончание СМР, ЗОС, РВЭ, заселение;',
                    '- плановая дата, прогнозная дата и фактическая дата;',
                    '- очередь, объект строительства и ответственный контур;',
                    '- причина отклонения и связь с событиями, которые вызвали сдвиг.'
                ].join('\n')
            ].join('\n\n');
        }

        const eventLines = scheduleEvents
            .map(event => `- ${event.dateText || 'дата не указана'}: ${event.title}`)
            .join('\n');

        return [
            '### Контрольные этапы и календарные сроки',
            `**Краткий вывод:** по контексту "${context?.contextName || 'контекст не выбран'}" найдены события, которые могут указывать на сдвиги сроков, РНС, СМР, заселение или окончание работ.`,
            ['**Найденные календарные сигналы:**', eventLines].join('\n'),
            [
                '**Как интерпретировать:**',
                '- эти карточки показывают не финальный календарь проекта, а демонстрационные события, связанные с датами;',
                '- если событие высокого приоритета связано с графиком, его нужно проверять первым;',
                '- если несколько событий относятся к одной очереди, их стоит анализировать вместе, потому что они могут описывать одну цепочку сдвигов.'
            ].join('\n'),
            [
                '**Что запросить дальше:**',
                '- точную плановую и прогнозную дату выбранной вехи;',
                '- список событий, которые повлияли на изменение этой даты;',
                '- ответственную команду и ближайший срок реакции;',
                '- влияние сдвига на строительную длительность и связанные финансовые показатели.'
            ].join('\n'),
            'Ограничение прототипа: сейчас ответ берет сигналы из событий. В промышленной версии дата должна подтягиваться из графика планирования по выбранной очереди и типу контрольной вехи.'
        ].join('\n\n');
    }

    function buildPnLIncidentAnswer() {
        return [
            '### Анализ инцидента: перенос РНС по 2-й очереди',
            'Этот перенос сроков является событием высокого приоритета, потому что он напрямую угрожает рентабельности проекта и запускает каскадное влияние на P&L-дерево. Ниже — разбор того, как сдвиг проходит от календарной вехи до чистой прибыли, какие риски возникают и какие действия стоит выполнить в интерфейсе S.Center прямо сейчас.',
            [
                '**1. Каскадное влияние на дерево P&L**',
                '- **Стартовая точка риска:** получение разрешения на строительство переносится на 6 месяцев. Это сдвигает старт продаж, старт части работ и календарный контур 2-й очереди.',
                '- **Драйверы и выручка:** срыв старта продаж снижает объем проданных метров `APTS_SOLD_M2`. Дальше эффект проходит по цепочке `REV_APTS -> REV_CORE -> REVENUE`, снижая валовую прибыль `GROSS_PROFIT`.',
                '- **Рост финансовых расходов:** задержка СМР отдаляет сдачу объекта и раскрытие эскроу-счетов. Проект дольше остается на проектном финансировании, поэтому растет нагрузка по `FIN_EXPENSES`.',
                '- **Двойной удар по прибыли:** снижение выручки давит на `OPER_PROFIT`, а рост процентов увеличивает отрицательный вклад `FIN_EXPENSES`. В результате ухудшается `PBT`, а затем итоговая `NP_SAMOLET`.',
                '- **Итоговая логика:** календарный сдвиг становится не только строительной проблемой, но и финансовым риском: меньше ранней выручки, больше кредитной нагрузки, ниже чистая прибыль.'
            ].join('\n'),
            [
                '**2. Угрозы для проекта**',
                '- **Кассовый разрыв:** деньги от продаж и раскрытия эскроу приходят позже, а расходы на финансирование продолжают накапливаться.',
                '- **Срыв управленческого плана:** прогноз по `REVENUE`, `GROSS_PROFIT`, `PBT` и `NP_SAMOLET` становится хуже текущего бюджета.',
                '- **Рост цепных задержек:** перенос РНС может потянуть за собой старт СМР, окончание СМР, ЗОС, РВЭ и дату заселения.',
                '- **Риск недостоверного анализа:** если похожие события смешать с нерелевантными карточками, массовая AI-аналитика может дать неточный вывод.'
            ].join('\n'),
            [
                '**3. Операционные действия в дровере карточки**',
                '- Нажмите **«Создать задачу»**. В теме укажите: **«Документы по РНС»**.',
                '- В описании задачи укажите: **«Прошу прислать документ РНС по 2-й очереди и подтвердить актуальную прогнозную дату получения разрешения»**.',
                '- В поле **«Ответственный»** выберите роль из команды проекта, например **«Главный инженер проекта»** или ответственный за разрешительную документацию.',
                '- Нажмите **«Запросить обоснование»**, чтобы зафиксировать причину срыва вехи и получить официальный комментарий.',
                '- Используйте действия **«Открыть график работ»** и **«Связаться с подрядчиком»**, если требуется сверить цепочку календарных последствий.'
            ].join('\n'),
            [
                '**4. Системные действия с карточкой**',
                '- Нажмите **«Закрепить»**. Карточка получит статус `pinned`, визуальную индикацию булавки и останется в быстром доступе.',
                '- Нажмите **«Изменить приоритет»** и установите высокий приоритет, если карточка еще не находится в этом статусе. Это нужно как пользовательский сигнал для будущего обучения ML-модели.',
                '- Если готовите массовый AI-анализ сдвигов за месяц, перейдите во **«Все события»**, примените фильтры по периоду, источнику и метрике, а затем крестиком исключите лишние карточки из текущей выборки.',
                '- После очистки выборки запускайте аналитику: ассистент должен анализировать только релевантные события, без информационного шума.'
            ].join('\n'),
            '### Рекомендация ассистента',
            'Сейчас эту карточку нужно оставить в оперативном фокусе: закрепить, создать задачу по документам РНС, запросить обоснование сдвига и проверить календарную цепочку до СМР, ЗОС, РВЭ и заселения. Финансово главный контрольный вопрос — насколько перенос ухудшает `REVENUE`, увеличивает `FIN_EXPENSES` и снижает `NP_SAMOLET`.'
        ].join('\n\n');
    }

    function createSCenterDemoProvider() {
        const answerSequence = [
            buildStatusAnswer,
            buildPhysicalAnswer,
            buildEventFocusAnswer,
            buildMetricAnswer,
            buildDatesAnswer
        ];

        return async ({ text, context }) => {
            setQuickQuestionsHidden(true);
            await wait(CHAT_RESPONSE_DELAY_MS);

            if (isPnLIncidentQuestion(text)) {
                setActiveQuickQuestions(PNL_INCIDENT_FOLLOW_UP_QUESTIONS);
                return {
                    text: buildPnLIncidentAnswer(context),
                    attachments: [],
                    actions: []
                };
            }

            const answerIndex = getRandomDemoAnswerIndex(answerSequence.length);
            const answerBuilder = answerSequence[answerIndex];
            setActiveQuickQuestions(FOLLOW_UP_QUESTIONS[answerIndex]);

            return {
                text: answerBuilder(context),
                attachments: [],
                actions: []
            };
        };
    }

    function getMessageProvider() {
        return createSCenterDemoProvider();
    }

    function handleAction() {
        return {
            text: 'В текущем этапе Ассистент S.Center не выполняет действия в интерфейсе. Он может объяснить следующий шаг, но изменение данных остается за пользователем.'
        };
    }

    function handleAttachFile() {
        global.alert('Вложения для Ассистента S.Center будут подключены на отдельном этапе.');
    }

    function handleOpenChange(isOpen) {
        document.body.classList.toggle('scenter-ai-chat-open', Boolean(isOpen));
        if (isOpen) applySCenterChatLabels();
        if (!isOpen) resetChatSession();
    }

    function updateContext() {
        if (global.SCostAIChat?.updateContext) {
            global.SCostAIChat.updateContext();
        }
    }

    function disableChatWorkspaceActions() {
        global.openCreateChatDialog = function disableCreateChatDialog() {
            return false;
        };
        global.confirmCreateChat = function disableConfirmCreateChat() {
            return false;
        };
        global.toggleChatWorkspaceAccordion = function disableChatWorkspaceToggle() {
            return false;
        };
        global.openEditChatDialog = function disableEditChatDialog(...args) {
            const event = args.find(arg => arg?.preventDefault && arg?.stopPropagation);
            if (event?.preventDefault) event.preventDefault();
            if (event?.stopPropagation) event.stopPropagation();
            return false;
        };
        global.openDeleteChatDialog = function disableDeleteChatDialog(...args) {
            const event = args.find(arg => arg?.preventDefault && arg?.stopPropagation);
            if (event?.preventDefault) event.preventDefault();
            if (event?.stopPropagation) event.stopPropagation();
            return false;
        };
    }

    function init() {
        if (!global.SCostAIChat?.configure || !global.SCostAIChat?.init) {
            console.warn('[SCenterChat] Переносимое ядро AIChat не подключено.');
            return false;
        }

        global.SCostAIChat.configure({
            getMountElement: () => document.getElementById('scenter-ai-chat-root'),
            getTriggerElement: () => document.getElementById('open-scenter-ai-chat'),
            getContext,
            getContextLabel,
            getSuggestedChatTitle,
            getInitialWorkspace: createInitialWorkspace,
            loadWorkspace,
            saveWorkspace,
            sendMessage: getMessageProvider(),
            onBeforeOpen: closeConflictingPanels,
            onOpenChange: handleOpenChange,
            onAttachFile: handleAttachFile,
            onAction: handleAction
        });

        global.SCostAIChat.init();
        disableChatWorkspaceActions();
        applySCenterChatLabels();
        startSCenterChatLabelObserver();
        updateContext();
        return true;
    }

    global.scenterChat = {
        init,
        getContext,
        getContextLabel,
        getSuggestedChatTitle,
        closeConflictingPanels,
        updateContext,
        open: () => global.SCostAIChat?.open?.(),
        close: () => global.SCostAIChat?.close?.(),
        toggle: () => global.SCostAIChat?.toggle?.(),
        getState: () => cloneValue(global.SCostAIChat?.getState?.() || null)
    };

    document.addEventListener('DOMContentLoaded', init);
})(window);
