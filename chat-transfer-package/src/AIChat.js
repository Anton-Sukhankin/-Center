/* ===========================================================================
   PORTABLE AI CHAT DRAWER
   Публичная интеграция выполняется через window.SCostAIChat.
   =========================================================================== */

const CHAT_WORKSPACE_STORAGE_KEY = 'escost.anrAsor.aiChatWorkspace.v1';
const defaultChatHistory = [];

const defaultAIChatHostAdapter = {
  getMountElement: () => document.getElementById('ai-sidebar-drawer-root'),
  getTriggerElement: () => document.getElementById('btn-trigger-ai-chat'),
  getContext: () => ({
    mode: 'general',
    projectTitle: 'Контекст не выбран',
    selectedNodeId: null,
    selectedNodeName: null
  }),
  getContextLabel: context => `Контекст: ${context?.projectTitle || 'не выбран'}`,
  getSuggestedChatTitle: context => context?.selectedNodeName || 'Новый чат',
  getInitialWorkspace: createEscostInitialWorkspace,
  loadWorkspace: null,
  saveWorkspace: null,
  sendMessage: null,
  onBeforeOpen: null,
  onOpenChange: null,
  onAttachFile: null,
  onAction: null
};

let aiChatHostAdapter = { ...defaultAIChatHostAdapter };
let initialChatWorkspace = createEscostInitialWorkspace();
let chatWorkspace = loadChatWorkspaceFromStorage();
let isChatWorkspaceCollapsed = false;

function cloneValue(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function configureAIChat(hostAdapter = {}) {
  aiChatHostAdapter = {
    ...defaultAIChatHostAdapter,
    ...hostAdapter
  };
  initialChatWorkspace = cloneValue(
    aiChatHostAdapter.getInitialWorkspace?.() || createEscostInitialWorkspace()
  );
  chatWorkspace = loadChatWorkspaceFromStorage();

  if (document.getElementById('ai-drawer')) {
    updateAIDrawerContext();
    renderChatWorkspaceAccordion();
    renderChatMessages();
  }
}

window.configureAIChat = configureAIChat;

function loadChatWorkspaceFromStorage() {
  try {
    const storedWorkspace = aiChatHostAdapter.loadWorkspace?.(CHAT_WORKSPACE_STORAGE_KEY);
    if (storedWorkspace?.chats?.length) return cloneValue(storedWorkspace);
  } catch (error) {
    console.warn('[AIChat] Не удалось загрузить историю чатов.', error);
  }
  return cloneValue(initialChatWorkspace);
}

function createEscostInitialWorkspace() {
  const baseTimestamp = '2026-07-03T09:20:00.000Z';
  return {
    activeChatId: 'chat_asor_67408',
    chats: [
      {
        id: 'chat_asor_67408',
        title: 'АСОР №67408',
        description: 'Текущий документ',
        participantsLabel: 'Подрядчик / ИИ-ассистент',
        unreadCount: 0,
        context: {
          mode: 'estimate-document',
          projectTitle: 'АСОР №67408',
          selectedNodeId: null
        },
        createdAt: baseTimestamp,
        updatedAt: '2026-07-05T17:18:00.000Z',
        messages: createLongAsorChatHistory()
      },
      {
        id: 'chat_rss_123',
        title: 'РСС №123',
        description: 'Методология расценок',
        participantsLabel: 'Подрядчик / ИИ-ассистент',
        unreadCount: 0,
        context: {
          mode: 'methodology',
          projectTitle: 'РСС №123',
          selectedNodeId: null
        },
        createdAt: '2026-07-03T08:40:00.000Z',
        updatedAt: '2026-07-03T08:58:00.000Z',
        messages: []
      },
      {
        id: 'chat_sor_80513',
        title: 'СОР №80513',
        description: 'Онбординг подрядчика',
        participantsLabel: 'Подрядчик / ИИ-ассистент',
        unreadCount: 0,
        context: {
          mode: 'onboarding',
          projectTitle: 'СОР №80513',
          selectedNodeId: null
        },
        createdAt: '2026-07-03T07:50:00.000Z',
        updatedAt: '2026-07-03T08:05:00.000Z',
        messages: []
      }
    ]
  };
}

function createLongAsorChatHistory() {
  const script = [
    ['2026-06-28T09:12:00.000Z', 'user', 'Добрый день. Я впервые открываю эту смету. С чего начать проверку после загрузки АНР?'],
    ['2026-06-28T09:13:00.000Z', 'ai', 'Начните с кнопки **Проверка ИИ** в нижней панели. В дровере откройте список позиций и проверьте вкладки **Предупреждения**, **Ошибки переноса** и **Не распознано**.'],
    ['2026-06-28T09:18:00.000Z', 'user', 'Что означает вкладка “Всего создано”?'],
    ['2026-06-28T09:19:00.000Z', 'ai', 'Это все строки АСОР, которые система сформировала из исходного АНР. Внутри могут быть как строки без замечаний, так и строки с предупреждениями или ошибками переноса.'],
    ['2026-06-28T09:25:00.000Z', 'user', 'Если строка создана ИИ без предупреждений, мне нужно ее открывать?'],
    ['2026-06-28T09:26:00.000Z', 'ai', 'Обычно нет. Такие строки можно просматривать выборочно. Основной поток проверки начинается с предупреждений, ошибок переноса и нераспознанных строк АНР.'],
    ['2026-06-28T09:31:00.000Z', 'user', 'Где увидеть исходную строку АНР?'],
    ['2026-06-28T09:32:00.000Z', 'ai', 'В карточке проверки откройте блок **Сопоставление АНР с АСОР**. Слева будет исходное значение АНР, справа — выбранное значение в АСОР.'],
    ['2026-06-28T09:40:00.000Z', 'user', 'Чат может сам перейти к проблемной строке в таблице?'],
    ['2026-06-28T09:41:00.000Z', 'ai', 'Нет. В текущей версии чат не управляет таблицей. Навигация выполняется через дровер проверки: выберите карточку позиции или используйте стрелки в списке позиций.'],

    ['2026-06-29T10:04:00.000Z', 'user', 'Почему предупреждение появляется, если строка все-таки перенесена в АСОР?'],
    ['2026-06-29T10:05:00.000Z', 'ai', 'Предупреждение означает, что строка перенесена, но уверенность сопоставления ниже порога или найдено несколько близких вариантов в справочнике. Сметчик должен подтвердить или выбрать другой вариант.'],
    ['2026-06-29T10:11:00.000Z', 'user', 'Что считается ошибкой переноса?'],
    ['2026-06-29T10:12:00.000Z', 'ai', '**Ошибка переноса** относится к строке, которая уже есть в АСОР, но содержит критичное отклонение: например, неверный вид работ, единицу измерения или норму расхода.'],
    ['2026-06-29T10:20:00.000Z', 'user', 'А “Не распознано” чем отличается от ошибки переноса?'],
    ['2026-06-29T10:21:00.000Z', 'ai', '**Не распознано** — это исходная строка АНР, которую система вообще не смогла применить в АСОР. Такой позиции нет в таблице, поэтому она разбирается отдельно в дровере.'],
    ['2026-06-29T10:29:00.000Z', 'user', 'Если я вижу несколько вариантов справочника, какой выбирать?'],
    ['2026-06-29T10:30:00.000Z', 'ai', 'Выбирайте вариант, который точнее соответствует исходной формулировке АНР, группе работ, единице измерения и контексту соседних строк. Процент рядом с вариантом показывает близость совпадения.'],
    ['2026-06-29T10:37:00.000Z', 'user', 'После выбора справочника нужно нажимать “Применить”?'],
    ['2026-06-29T10:38:00.000Z', 'ai', 'Да. Выбор кандидата меняет значение локально в карточке, а **Применить** фиксирует принятое решение для текущей позиции и переводит ее в обработанное состояние.'],

    ['2026-07-01T11:02:00.000Z', 'user', 'Как понять, какой именно параметр проверяется в строке?'],
    ['2026-07-01T11:03:00.000Z', 'ai', 'В заголовке блока сопоставления рядом со статусом есть плашка проверяемого атрибута: например, **Вид работ**, **Единица измерения**, **Норма расхода** или **Признак номинации**.'],
    ['2026-07-01T11:08:00.000Z', 'user', 'Что делать, если выбранный вид работ выглядит похожим, но диапазон не тот?'],
    ['2026-07-01T11:09:00.000Z', 'ai', 'Откройте список кандидатов в блоке сопоставления и выберите вариант с корректным диапазоном. После этого проверьте единицу измерения и примените изменение.'],
    ['2026-07-01T11:17:00.000Z', 'user', 'Можно ли отправить строку на ручной разбор?'],
    ['2026-07-01T11:18:00.000Z', 'ai', 'Да. Используйте кнопку **Ручной разбор**, если автоматическое сопоставление недостаточно надежно или вы не можете выбрать корректный вариант из справочника.'],
    ['2026-07-01T11:27:00.000Z', 'user', 'Что произойдет после ручного разбора?'],
    ['2026-07-01T11:28:00.000Z', 'ai', 'Позиция получит статус ручной проверки. Это сигнал команде, что строку нельзя закрыть автоматическим подтверждением и требуется отдельная обработка.'],
    ['2026-07-01T11:36:00.000Z', 'user', 'Комментарии сохраняются вместе с применением?'],
    ['2026-07-01T11:37:00.000Z', 'ai', 'Комментарии работают отдельно от применения значения. Их можно оставить в блоке комментариев, чтобы зафиксировать причину выбора или вопрос для коллег.'],

    ['2026-07-03T14:06:00.000Z', 'user', 'Почему чат не меняет таблицу напрямую?'],
    ['2026-07-03T14:07:00.000Z', 'ai', 'Это ограничение MVP. Чат объясняет правила и помогает ориентироваться, но не выполняет действия с ячейками, чтобы не смешивать консультацию и юридически значимое решение сметчика.'],
    ['2026-07-03T14:16:00.000Z', 'user', 'Что лучше проверять сначала: предупреждения или нераспознанные строки?'],
    ['2026-07-03T14:17:00.000Z', 'ai', 'Для рабочего потока начните с **Не распознано**, потому что эти строки вообще не попали в АСОР. Затем переходите к **Ошибкам переноса**, после этого — к предупреждениям.'],
    ['2026-07-03T14:24:00.000Z', 'user', 'Если строк много, как быстро переходить по списку?'],
    ['2026-07-03T14:25:00.000Z', 'ai', 'Выберите нужный фильтр в списке позиций и используйте стрелки справа. Они листают только позиции внутри активного фильтра.'],
    ['2026-07-03T14:33:00.000Z', 'user', 'Почему при выборе карточки таблица иногда прокручивается?'],
    ['2026-07-03T14:34:00.000Z', 'ai', 'Для созданных строк АСОР дровер синхронизирован с таблицей: он раскрывает родительские строки, прокручивает таблицу к позиции и подсвечивает проблемную ячейку.'],
    ['2026-07-03T14:42:00.000Z', 'user', 'А для нераспознанной строки прокрутка будет?'],
    ['2026-07-03T14:43:00.000Z', 'ai', 'Нет. Нераспознанная строка не имеет строки АСОР, поэтому интерфейс показывает ее исходные параметры в дровере без навигации по таблице.'],

    ['2026-07-05T16:10:00.000Z', 'user', 'Мне нужно объяснить подрядчику, почему часть строк не закрыта автоматически. Как это сформулировать?'],
    ['2026-07-05T16:11:00.000Z', 'ai', 'Можно сказать так: часть строк требует проверки, потому что система нашла несколько похожих справочных вариантов или не смогла надежно определить атрибуты строки АНР для переноса в АСОР.'],
    ['2026-07-05T16:24:00.000Z', 'user', 'Что означает порог уверенности?'],
    ['2026-07-05T16:25:00.000Z', 'ai', 'Порог уверенности — минимальное значение, выше которого сопоставление считается достаточно надежным. Если уверенность ниже порога, позиция попадает в предупреждения.'],
    ['2026-07-05T16:39:00.000Z', 'user', 'Если уверенность 82%, а порог 85%, это обязательно ошибка?'],
    ['2026-07-05T16:40:00.000Z', 'ai', 'Нет. Это предупреждение, а не фатальная ошибка. Система предлагает вариант, но просит сметчика проверить его вручную.'],
    ['2026-07-05T16:58:00.000Z', 'user', 'Как завершить проверку текущей позиции?'],
    ['2026-07-05T16:59:00.000Z', 'ai', 'Если предложенное значение корректно, нажмите **Подтвердить**. Если вы выбрали другой вариант из справочника, нажмите **Применить**. Если уверенности нет, отправьте позицию на ручной разбор.'],
    ['2026-07-05T17:17:00.000Z', 'user', 'После обновления страницы эта переписка должна сохраниться?'],
    ['2026-07-05T17:18:00.000Z', 'ai', 'Нет. Пользовательские сообщения не сохраняются после обновления страницы. Эта история нужна только как демонстрационный пример первого чата в прототипе.']
  ];

  return script.map(([timestamp, sender, text], index) => ({
    id: `asor_demo_msg_${index + 1}`,
    sender,
    timestamp,
    text,
    attachments: [],
    actions: []
  }));
}

function persistChatWorkspace() {
  try {
    aiChatHostAdapter.saveWorkspace?.(
      CHAT_WORKSPACE_STORAGE_KEY,
      cloneValue(chatWorkspace)
    );
  } catch (error) {
    console.warn('[AIChat] Не удалось сохранить историю чатов.', error);
  }
}

function getActiveChat() {
  return chatWorkspace.chats.find(chat => chat.id === chatWorkspace.activeChatId) || chatWorkspace.chats[0];
}

function getActiveChatMessages() {
  return getActiveChat()?.messages || [];
}

function pushMessageToActiveChat(message) {
  const activeChat = getActiveChat();
  if (!activeChat) return;
  activeChat.messages.push(message);
  activeChat.updatedAt = message.timestamp;
  persistChatWorkspace();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.initAIDrawer = function() {
  const sceneRoot = aiChatHostAdapter.getMountElement?.();
  if (!sceneRoot) return;
  sceneRoot.classList.add('ai-chat-mount');

  sceneRoot.innerHTML = `
    <div id="ai-drawer" class="ai-drawer">
      <div id="ai-drawer-resize-handle" class="ai-drawer-resize-handle"></div>
      <div class="ai-drawer-content">
        <div class="ai-drawer-header">
          <div class="header-title-block">
            <span class="ai-header-stars" aria-hidden="true">
              <svg class="ai-header-stars-icon" viewBox="0 0 24 24" focusable="false">
                <path d="M12 3.25l1.55 4.2a3.7 3.7 0 0 0 2.2 2.2L19.95 11l-4.2 1.55a3.7 3.7 0 0 0-2.2 2.2L12 18.95l-1.55-4.2a3.7 3.7 0 0 0-2.2-2.2L4.05 11l4.2-1.35a3.7 3.7 0 0 0 2.2-2.2L12 3.25Z"></path>
                <path d="M5.5 15.25l.55 1.5a1.5 1.5 0 0 0 .9.9l1.5.55-1.5.55a1.5 1.5 0 0 0-.9.9l-.55 1.5-.55-1.5a1.5 1.5 0 0 0-.9-.9l-1.5-.55 1.5-.55a1.5 1.5 0 0 0 .9-.9l.55-1.5Z"></path>
                <path d="M18.25 3.25l.45 1.2a1.25 1.25 0 0 0 .75.75l1.2.45-1.2.45a1.25 1.25 0 0 0-.75.75l-.45 1.2-.45-1.2a1.25 1.25 0 0 0-.75-.75l-1.2-.45 1.2-.45a1.25 1.25 0 0 0 .75-.75l.45-1.2Z"></path>
              </svg>
            </span>
            <div class="ai-header-copy">
              <h4 class="ai-header-title">ИИ-ассистент S.Cost</h4>
              <span class="ai-header-context" id="chat-context-text">Контекст: текущая смета · АНР → АСОР</span>
            </div>
          </div>
          <button class="btn-close-drawer" onclick="window.closeAIDrawer()" aria-label="Закрыть чат">×</button>
        </div>

        <div class="ai-drawer-main">
          <nav class="chat-workspace-accordion" id="chat-workspace-accordion" aria-label="Список чатов ИИ-ассистента"></nav>

          <div class="ai-chat-thread">
            <div class="ai-drawer-messages" id="ai-drawer-messages-list"></div>

            <div class="typing-indicator-block" id="typing-indicator" style="display: none;">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-text">ИИ-ассистент думает...</span>
            </div>

            <div class="ai-drawer-footer">
              <div class="input-container">
                <textarea class="ai-chat-textarea" id="ai-chat-input" placeholder="Задать вопрос по смете или интерфейсу..." rows="1"></textarea>
                <button class="btn-attach-file" id="btn-attach-file-btn" type="button" title="Прикрепить файл" aria-label="Прикрепить файл">
                  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                    <path d="M8.5 12.5 14.9 6.1a3.2 3.2 0 1 1 4.5 4.5L10.2 19.8a5 5 0 0 1-7.1-7.1l8.6-8.6a6.7 6.7 0 0 1 9.5 9.5l-8.6 8.6"></path>
                  </svg>
                </button>
                <button class="btn-send-message" id="btn-send-message-btn" aria-label="Отправить сообщение">
                  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                    <path d="M4 11.8 20.2 4 16 20l-4.1-6.1L4 11.8Z"></path>
                    <path d="M11.9 13.9 20.2 4"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-create-modal-root" id="chat-create-modal-root"></div>
      </div>
    </div>
  `;

  setupResizeHandle();
  setupOutsideClickClose();
  setupInputHandlers();
  updateAIDrawerContext();
  renderChatWorkspaceAccordion();
  renderChatMessages();
};

function getAIDrawerContextLabel() {
  const context = getCurrentChatContext();
  return aiChatHostAdapter.getContextLabel?.(context)
    || `Контекст: ${context.projectTitle || 'не выбран'}`;
}

function getCurrentProjectTitle() {
  return getCurrentChatContext().projectTitle || 'Контекст не выбран';
}

function updateAIDrawerContext() {
  const contextNode = document.getElementById('chat-context-text');
  if (!contextNode) return;
  contextNode.textContent = getAIDrawerContextLabel();
  contextNode.title = contextNode.textContent;
}

window.updateAIDrawerContext = updateAIDrawerContext;

window.toggleAIDrawer = function() {
  const drawer = document.getElementById('ai-drawer');
  if (!drawer) return;

  const willOpen = !drawer.classList.contains('open');
  if (willOpen && aiChatHostAdapter.onBeforeOpen?.() === false) return;
  const isOpen = drawer.classList.toggle('open');
  document.body.classList.toggle('ai-chat-open', isOpen);
  if (isOpen) {
    updateAIDrawerContext();
    renderChatWorkspaceAccordion();
    const input = document.getElementById('ai-chat-input');
    if (input) input.focus();
    scrollToBottom();
  } else {
    collapseChatWorkspaceAccordion();
  }
  aiChatHostAdapter.onOpenChange?.(isOpen);
};

window.closeAIDrawer = function() {
  const drawer = document.getElementById('ai-drawer');
  const wasOpen = drawer?.classList.contains('open') || false;
  if (drawer) drawer.classList.remove('open');
  document.body.classList.remove('ai-chat-open');
  collapseChatWorkspaceAccordion();
  if (wasOpen) aiChatHostAdapter.onOpenChange?.(false);
};

function collapseChatWorkspaceAccordion() {
  renderChatWorkspaceAccordion();
}

function renderChatWorkspaceAccordion(options = {}) {
  const root = document.getElementById('chat-workspace-accordion');
  if (!root) return;
  const drawer = document.getElementById('ai-drawer');
  if (drawer) drawer.classList.toggle('chat-list-collapsed', isChatWorkspaceCollapsed);
  root.classList.toggle('is-collapsed', isChatWorkspaceCollapsed);

  const previousScrollTop = options.preserveScroll
    ? root.querySelector('.chat-workspace-scroll')?.scrollTop || 0
    : 0;
  const activeChat = getActiveChat();

  if (isChatWorkspaceCollapsed) {
    root.innerHTML = `
      <div class="chat-workspace-shell collapsed">
        <button class="chat-create-trigger collapsed" type="button" onclick="window.openCreateChatDialog()" title="Новый чат" aria-label="Новый чат">
          ${renderPlusIcon()}
        </button>
        <div class="chat-workspace-scroll collapsed">
          <div class="chat-workspace-list collapsed">
            ${chatWorkspace.chats.map(chat => renderCollapsedChatSessionRow(chat, chat.id === activeChat?.id)).join('')}
          </div>
        </div>
        <div class="chat-workspace-bottom">${renderChatWorkspaceToggle(true)}</div>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="chat-workspace-shell">
      <button class="chat-create-trigger" type="button" onclick="window.openCreateChatDialog()">
        ${renderPlusIcon()}
        <span>Новый чат</span>
      </button>
      <div class="chat-workspace-scroll">
        <div class="chat-workspace-list">
          ${chatWorkspace.chats.map(chat => renderChatSessionRow(chat, chat.id === activeChat?.id)).join('')}
        </div>
      </div>
      <div class="chat-workspace-bottom">${renderChatWorkspaceToggle(false)}</div>
    </div>
  `;

  if (options.preserveScroll) {
    const scrollArea = root.querySelector('.chat-workspace-scroll');
    if (scrollArea) scrollArea.scrollTop = previousScrollTop;
  }
}

function renderChatWorkspaceToggle(isCollapsed) {
  return `
    <button class="chat-workspace-toggle" type="button" onclick="window.toggleChatWorkspaceAccordion()" title="${isCollapsed ? 'Развернуть список чатов' : 'Свернуть список чатов'}" aria-label="${isCollapsed ? 'Развернуть список чатов' : 'Свернуть список чатов'}" aria-expanded="${String(!isCollapsed)}">
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        ${isCollapsed
          ? '<path d="m12.5 6-6 6 6 6"></path><path d="m17.5 6-6 6 6 6"></path>'
          : '<path d="m11.5 6 6 6-6 6"></path><path d="m6.5 6 6 6-6 6"></path>'}
      </svg>
    </button>
  `;
}

function renderPlusIcon() {
  return `
    <svg class="chat-plus-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M12 5v14"></path>
      <path d="M5 12h14"></path>
    </svg>
  `;
}

function renderCollapsedChatSessionRow(chat, isCurrent) {
  if (!chat) return '';
  const unreadCount = Number(chat.unreadCount) || 0;
  const title = escapeHtml(chat.title);
  return `
    <button
      class="chat-session-dot ${isCurrent ? 'is-current' : ''} tone-${getChatToneIndex(chat)}"
      type="button"
      onclick="window.selectChatSession('${escapeHtml(chat.id)}')"
      title="${title}"
      aria-label="Открыть чат ${title}"
      aria-current="${isCurrent ? 'true' : 'false'}"
    >
      <span>${escapeHtml(getChatInitial(chat))}</span>
      ${unreadCount > 0 ? '<i aria-hidden="true"></i>' : ''}
    </button>
  `;
}

function getChatInitial(chat) {
  const title = String(chat?.title || '').trim().toUpperCase();
  if (title.startsWith('АСОР') || title.startsWith('ASOR')) return 'А';
  if (title.startsWith('РСС') || title.startsWith('RSS')) return 'R';
  if (title.startsWith('СОР') || title.startsWith('SOR')) return 'S';
  return title.charAt(0) || 'Ч';
}

function getChatToneIndex(chat) {
  const value = String(chat?.id || chat?.title || '');
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash + value.charCodeAt(index) * (index + 1)) % 5;
  }
  return hash;
}

function renderChatSessionRow(chat, isCurrent) {
  if (!chat) return '';
  const metaLabel = escapeHtml(formatChatSessionMeta(chat));
  const unreadCount = Number(chat.unreadCount) || 0;
  const canDeleteChat = chatWorkspace.chats.length > 1;

  return `
    <div
      class="chat-session-row ${isCurrent ? 'is-current' : ''}"
      role="button"
      tabindex="0"
      onclick="window.selectChatSession('${escapeHtml(chat.id)}')"
      onkeydown="window.handleChatSessionKey(event, '${escapeHtml(chat.id)}')"
      aria-current="${isCurrent ? 'true' : 'false'}"
    >
      <span class="chat-session-copy">
        <span class="chat-session-title" title="${escapeHtml(chat.title)}">${escapeHtml(chat.title)}</span>
        <span class="chat-session-description">${metaLabel}</span>
      </span>
      <span class="chat-session-actions">
        ${unreadCount > 0 ? `
          <span class="chat-session-unread" title="Непрочитанные сообщения">
            ${renderUnreadIcon()}
            <span>${unreadCount}</span>
          </span>
        ` : '<span class="chat-session-unread-placeholder" aria-hidden="true"></span>'}
        <button
          class="chat-session-action-btn chat-session-edit-btn"
          type="button"
          title="Редактировать название чата"
          aria-label="Редактировать название чата"
          onclick="window.openEditChatDialog('${escapeHtml(chat.id)}', event)"
        >
          ${renderEditIcon()}
        </button>
        ${canDeleteChat ? `
          <button
            class="chat-session-action-btn chat-session-delete-btn"
            type="button"
            title="Удалить чат"
            aria-label="Удалить чат"
            onclick="window.openDeleteChatDialog('${escapeHtml(chat.id)}', event)"
          >
            ${renderDeleteIcon()}
          </button>
        ` : ''}
      </span>
    </div>
  `;
}

function renderEditIcon() {
  return `
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M4.75 19.25h3.5L18.7 8.8a2.1 2.1 0 0 0-3-3L5.25 16.25l-.5 3Z"></path>
      <path d="m14.5 7 2.5 2.5"></path>
    </svg>
  `;
}

function renderDeleteIcon() {
  return `
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M5.5 7.25h13"></path>
      <path d="M9.25 7.25V5.8a1.3 1.3 0 0 1 1.3-1.3h2.9a1.3 1.3 0 0 1 1.3 1.3v1.45"></path>
      <path d="M7.25 7.25l.65 11.1a1.55 1.55 0 0 0 1.55 1.45h5.1a1.55 1.55 0 0 0 1.55-1.45l.65-11.1"></path>
      <path d="M10.5 10.75v5.5"></path>
      <path d="M13.5 10.75v5.5"></path>
    </svg>
  `;
}

window.handleChatSessionKey = function(event, chatId) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  window.selectChatSession(chatId);
};

window.openEditChatDialog = function(chatId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const modalRoot = document.getElementById('chat-create-modal-root');
  const chat = chatWorkspace.chats.find(item => item.id === chatId);
  if (!modalRoot || !chat) return;

  modalRoot.innerHTML = `
    <div class="chat-create-backdrop" role="presentation" onclick="window.closeCreateChatDialog(event)">
      <div class="chat-create-dialog" role="dialog" aria-modal="true" aria-labelledby="chat-edit-title" onclick="event.stopPropagation()">
        <div class="chat-create-head">
          <h5 id="chat-edit-title">Редактировать чат</h5>
          <button type="button" class="chat-create-close" onclick="window.closeCreateChatDialog()" aria-label="Закрыть">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="m7 7 10 10"></path>
              <path d="m17 7-10 10"></path>
            </svg>
          </button>
        </div>
        <label class="chat-create-field">
          <span>Название чата</span>
          <input id="chat-edit-name-input" type="text" value="${escapeHtml(chat.title)}" maxlength="80">
        </label>
        <p class="chat-create-hint">Название изменится только для выбранного чата</p>
        <div class="chat-create-actions">
          <button type="button" class="chat-create-btn secondary" onclick="window.closeCreateChatDialog()">Отмена</button>
          <button type="button" class="chat-create-btn primary" onclick="window.confirmEditChat('${escapeHtml(chat.id)}')">Сохранить</button>
        </div>
      </div>
    </div>
  `;

  const input = document.getElementById('chat-edit-name-input');
  if (input) {
    input.focus();
    input.select();
  }
};

window.confirmEditChat = function(chatId) {
  const input = document.getElementById('chat-edit-name-input');
  const chat = chatWorkspace.chats.find(item => item.id === chatId);
  const title = input?.value?.trim();
  if (!chat || !title) return;

  chat.title = title;
  persistChatWorkspace();
  window.closeCreateChatDialog();
  renderChatWorkspaceAccordion();
};

window.openDeleteChatDialog = function(chatId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const modalRoot = document.getElementById('chat-create-modal-root');
  const chat = chatWorkspace.chats.find(item => item.id === chatId);
  if (!modalRoot || !chat || chatWorkspace.chats.length <= 1) return;

  modalRoot.innerHTML = `
    <div class="chat-create-backdrop" role="presentation" onclick="window.closeCreateChatDialog(event)">
      <div class="chat-create-dialog chat-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="chat-delete-title" onclick="event.stopPropagation()">
        <div class="chat-create-head">
          <h5 id="chat-delete-title">Удалить чат</h5>
          <button type="button" class="chat-create-close" onclick="window.closeCreateChatDialog()" aria-label="Закрыть">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="m7 7 10 10"></path>
              <path d="m17 7-10 10"></path>
            </svg>
          </button>
        </div>
        <p class="chat-delete-text">
          Чат <strong>${escapeHtml(chat.title)}</strong> будет удален из списка. История этого чата больше не будет отображаться в прототипе.
        </p>
        <div class="chat-create-actions">
          <button type="button" class="chat-create-btn secondary" onclick="window.closeCreateChatDialog()">Отмена</button>
          <button type="button" class="chat-create-btn danger" onclick="window.confirmDeleteChat('${escapeHtml(chat.id)}')">Удалить</button>
        </div>
      </div>
    </div>
  `;
};

window.confirmDeleteChat = function(chatId) {
  if (chatWorkspace.chats.length <= 1) return;

  const deleteIndex = chatWorkspace.chats.findIndex(chat => chat.id === chatId);
  if (deleteIndex === -1) return;

  const wasActive = chatWorkspace.activeChatId === chatId;
  chatWorkspace.chats.splice(deleteIndex, 1);

  if (wasActive) {
    const fallbackChat = chatWorkspace.chats[deleteIndex] || chatWorkspace.chats[deleteIndex - 1] || chatWorkspace.chats[0];
    chatWorkspace.activeChatId = fallbackChat?.id || null;
  }

  if (chatWorkspace.chats.length === 1) {
    chatWorkspace.activeChatId = chatWorkspace.chats[0].id;
  }

  persistChatWorkspace();
  window.closeCreateChatDialog();
  renderChatWorkspaceAccordion();
  updateAIDrawerContext();
  renderChatMessages();
};

function renderUnreadIcon() {
  return `
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M4.75 7.25h14.5v9.5H4.75v-9.5Z"></path>
      <path d="m5.25 8 6.75 5 6.75-5"></path>
    </svg>
  `;
}

function formatChatSessionMeta(chat) {
  const updatedLabel = formatChatSessionDate(chat.updatedAt);
  const participants = chat.participantsLabel || 'Сметчик / ИИ-ассистент';
  return `${updatedLabel} · ${participants}`;
}

function formatChatSessionDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  }).replace('.', '') + `, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
}

window.toggleChatWorkspaceAccordion = function() {
  isChatWorkspaceCollapsed = !isChatWorkspaceCollapsed;
  renderChatWorkspaceAccordion();
};

window.selectChatSession = function(chatId) {
  const selectedChat = chatWorkspace.chats.find(chat => chat.id === chatId);
  if (!selectedChat) return;
  selectedChat.unreadCount = 0;
  chatWorkspace.activeChatId = chatId;
  persistChatWorkspace();
  renderChatWorkspaceAccordion({ preserveScroll: true });
  updateAIDrawerContext();
  renderChatMessages();
};

window.openCreateChatDialog = function() {
  const modalRoot = document.getElementById('chat-create-modal-root');
  if (!modalRoot) return;

  const suggestedTitle = getSuggestedChatTitle();
  modalRoot.innerHTML = `
    <div class="chat-create-backdrop" role="presentation" onclick="window.closeCreateChatDialog(event)">
      <div class="chat-create-dialog" role="dialog" aria-modal="true" aria-labelledby="chat-create-title" onclick="event.stopPropagation()">
        <div class="chat-create-head">
          <h5 id="chat-create-title">Создать новый чат</h5>
          <button type="button" class="chat-create-close" onclick="window.closeCreateChatDialog()" aria-label="Закрыть">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="m7 7 10 10"></path>
              <path d="m17 7-10 10"></path>
            </svg>
          </button>
        </div>
        <label class="chat-create-field">
          <span>Название чата (контекст)</span>
          <input id="chat-create-name-input" type="text" value="${escapeHtml(suggestedTitle)}" maxlength="80">
        </label>
        <p class="chat-create-hint">Вы можете изменить название чата</p>
        <div class="chat-create-actions">
          <button type="button" class="chat-create-btn secondary" onclick="window.closeCreateChatDialog()">Отмена</button>
          <button type="button" class="chat-create-btn primary" onclick="window.confirmCreateChat()">Создать</button>
        </div>
      </div>
    </div>
  `;

  const input = document.getElementById('chat-create-name-input');
  if (input) {
    input.focus();
    input.select();
  }
};

window.closeCreateChatDialog = function(event) {
  if (event && event.target !== event.currentTarget) return;
  const modalRoot = document.getElementById('chat-create-modal-root');
  if (modalRoot) modalRoot.innerHTML = '';
};

window.confirmCreateChat = function() {
  const input = document.getElementById('chat-create-name-input');
  const title = input?.value?.trim() || 'Новый чат: контекст не выбран';
  const now = new Date().toISOString();
  const chatId = `chat_${Date.now()}`;

  chatWorkspace.chats.unshift({
    id: chatId,
    title,
    description: 'Новый чат добавлен',
    participantsLabel: 'Сметчик / ИИ-ассистент',
    unreadCount: 0,
    context: getCurrentChatContext(),
    createdAt: now,
    updatedAt: now,
    messages: []
  });
  chatWorkspace.activeChatId = chatId;
  persistChatWorkspace();

  window.closeCreateChatDialog();
  renderChatWorkspaceAccordion();
  updateAIDrawerContext();
  renderChatMessages();
};

function getSuggestedChatTitle() {
  const context = getCurrentChatContext();
  return aiChatHostAdapter.getSuggestedChatTitle?.(context)
    || context.selectedNodeName
    || 'Новый чат';
}

function getCurrentChatContext() {
  const context = aiChatHostAdapter.getContext?.() || {};
  return {
    mode: context.mode || 'general',
    projectTitle: context.projectTitle || 'Контекст не выбран',
    selectedNodeId: context.selectedNodeId || null,
    selectedNodeName: context.selectedNodeName || null,
    ...context
  };
}

function renderChatMessages() {
  const list = document.getElementById('ai-drawer-messages-list');
  if (!list) return;

  let previousDayKey = '';
  const messages = getActiveChatMessages();
  if (!messages.length) {
    list.innerHTML = renderChatEmptyState();
    return;
  }

  list.innerHTML = messages.map(msg => {
    const dayKey = getMessageDayKey(msg.timestamp);
    const dateSeparator = dayKey !== previousDayKey ? renderDateSeparator(msg.timestamp) : '';
    previousDayKey = dayKey;

    let bubbleClass = 'bubble-ai';
    let senderName = 'ИИ-ассистент';
    if (msg.sender === 'user') {
      bubbleClass = 'bubble-user';
      senderName = 'Вы';
    } else if (msg.sender === 'operator') {
      bubbleClass = 'bubble-operator';
      senderName = 'Оператор';
    }

    const textHtml = parseMarkdown(msg.text);
    const avatarHtml = msg.sender === 'user'
      ? ''
      : `<div class="message-avatar" aria-hidden="true">${msg.sender === 'operator' ? 'ОП' : 'ИИ'}</div>`;

    return `
      ${dateSeparator}
      <div class="chat-message-row ${msg.sender}">
        ${avatarHtml}
        <div class="chat-message-content">
          <div class="message-meta">
            <span class="message-sender">${senderName}</span>
          </div>
          <div class="chat-bubble ${bubbleClass}">
            <div class="bubble-text">${textHtml}</div>
          </div>
          ${renderMessageActions(msg.actions)}
        </div>
      </div>
    `;
  }).join('');

  scrollToBottom();
}

function renderChatEmptyState() {
  return `
    <div class="chat-empty-state" role="status">
      <span class="chat-empty-visual" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M6.2 5.5h11.6a3 3 0 0 1 3 3v4.9a3 3 0 0 1-3 3h-4.8l-4.5 3v-3H6.2a3 3 0 0 1-3-3V8.5a3 3 0 0 1 3-3Z"></path>
          <path d="M8.2 10h7.6"></path>
          <path d="M8.2 12.8h4.9"></path>
        </svg>
      </span>
      <strong>Сообщений пока нет</strong>
      <p>Задайте вопрос по текущей смете, проверке АНР или работе с интерфейсом S.Cost.</p>
    </div>
  `;
}

function getMessageDayKey(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'unknown-date';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function renderDateSeparator(timestamp) {
  const label = formatMessageDateLabel(timestamp);
  return `
    <div class="chat-date-separator" role="separator" aria-label="${escapeHtml(label)}">
      <span class="chat-date-label">${escapeHtml(label)}</span>
    </div>
  `;
}

function formatMessageDateLabel(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Дата не указана';

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function renderMessageActions(actions) {
  if (!actions || actions.length === 0) return '';

  return `
    <div class="message-actions-block" aria-label="Действия по результату аналитики">
      ${actions.map(act => {
        const actionType = act.payload?.action || act.id || 'action';
        return `
          <button class="btn-message-action" data-action-type="${escapeHtml(actionType)}" onclick="window.triggerChatAction('${escapeHtml(act.id)}', '${escapeHtml(act.payload?.action || '')}', '${escapeHtml(act.payload?.row_id || '')}')">
            ${escapeHtml(act.label)}
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function parseMarkdown(text) {
  if (!text) return '';
  let html = escapeHtml(text);

  html = html.replace(/^### (.*?)$/gm, '<h5 class="chat-message-h5">$1</h5>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`(.*?)`/g, (match, value) => {
    const isErrorToken = /ошибка|🔴/i.test(value);
    const className = isErrorToken ? 'chat-inline-code is-error-token' : 'chat-inline-code';
    return `<code class="${className}">${value}</code>`;
  });
  html = html.replace(/^\* (.*?)$/gm, '<li class="chat-message-li">$1</li>');
  html = html.replace(/(<li class="chat-message-li">.*?<\/li>\n?)+/g, (match) => {
    return `<ul class="chat-message-ul">${match.replace(/\n/g, '')}</ul>`;
  });
  html = html.replace(/\n\n/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/<br><br>(?=<h5 class="chat-message-h5">|<ul class="chat-message-ul">)/g, '');
  html = html.replace(/(<\/h5>)<br><br>(?=<ul class="chat-message-ul">)/g, '$1');
  html = html.replace(/(<\/ul>)<br><br>(?=<h5 class="chat-message-h5">)/g, '$1');

  return html;
}

function setupResizeHandle() {
  const handle = document.getElementById('ai-drawer-resize-handle');
  const drawer = document.getElementById('ai-drawer');
  if (!handle || !drawer) return;

  let isResizing = false;

  handle.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.classList.add('resizing-chat');
    handle.classList.add('active');
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    const minWidth = drawer.classList.contains('chat-list-collapsed') ? 560 : 670;
    if (newWidth >= minWidth && newWidth <= 1270) {
      drawer.style.setProperty('width', `${newWidth}px`, 'important');
    }
  });

  document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.classList.remove('resizing-chat');
    handle.classList.remove('active');
  });
}

function setupOutsideClickClose() {
  if (window.__scostAIDrawerOutsideCloseBound) return;
  window.__scostAIDrawerOutsideCloseBound = true;

  document.addEventListener('mousedown', (event) => {
    const drawer = document.getElementById('ai-drawer');
    if (!drawer?.classList.contains('open')) return;

    const trigger = aiChatHostAdapter.getTriggerElement?.();
    const clickedInsideDrawer = drawer.contains(event.target);
    const clickedTrigger = trigger?.contains(event.target);

    if (clickedInsideDrawer || clickedTrigger) return;
    window.closeAIDrawer();
  });
}

function setupInputHandlers() {
  const input = document.getElementById('ai-chat-input');
  const sendBtn = document.getElementById('btn-send-message-btn');
  const attachBtn = document.getElementById('btn-attach-file-btn');
  if (!input) return;

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserSendMessage();
    }
  });

  if (sendBtn) sendBtn.addEventListener('click', handleUserSendMessage);
  if (attachBtn) {
    attachBtn.addEventListener('click', () => {
      aiChatHostAdapter.onAttachFile?.({
        chat: cloneValue(getActiveChat()),
        context: getCurrentChatContext()
      });
    });
  }
}

function handleUserSendMessage() {
  const input = document.getElementById('ai-chat-input');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  pushMessageToActiveChat({
    id: `msg_user_${Date.now()}`,
    sender: 'user',
    timestamp: new Date().toISOString(),
    text,
    attachments: [],
    actions: []
  });
  renderChatWorkspaceAccordion();
  renderChatMessages();

  input.value = '';
  input.style.height = 'auto';
  void requestAiResponse(text);
}

async function requestAiResponse(userText) {
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.style.display = 'flex';
  scrollToBottom();

  try {
    const response = aiChatHostAdapter.sendMessage
      ? await aiChatHostAdapter.sendMessage({
          text: userText,
          chat: cloneValue(getActiveChat()),
          context: getCurrentChatContext()
        })
      : {
          text: 'Провайдер ответов не подключён. Настройте `sendMessage` в адаптере проекта.',
          actions: []
        };
    const normalizedResponse = typeof response === 'string' ? { text: response } : (response || {});
    pushMessageToActiveChat({
      id: `msg_ai_${Date.now()}`,
      sender: 'ai',
      timestamp: new Date().toISOString(),
      text: normalizedResponse.text || 'Ответ не содержит текста.',
      attachments: normalizedResponse.attachments || [],
      actions: normalizedResponse.actions || []
    });
  } catch (error) {
    pushMessageToActiveChat({
      id: `msg_ai_error_${Date.now()}`,
      sender: 'ai',
      timestamp: new Date().toISOString(),
      text: 'Не удалось получить ответ. Повторите попытку или проверьте подключение провайдера сообщений.',
      attachments: [],
      actions: []
    });
    console.error('[AIChat] Ошибка провайдера сообщений.', error);
  } finally {
    if (typing) typing.style.display = 'none';
    renderChatWorkspaceAccordion();
    renderChatMessages();
  }
}

window.triggerChatAction = async function(actionId, actionType, rowId) {
  const hostResult = await aiChatHostAdapter.onAction?.({
    actionId,
    actionType,
    rowId,
    chat: cloneValue(getActiveChat()),
    context: getCurrentChatContext()
  });
  if (hostResult === false) return;
  const result = typeof hostResult === 'string' ? { text: hostResult } : (hostResult || {});
  pushMessageToActiveChat({
    id: `msg_info_${Date.now()}`,
    sender: 'ai',
    timestamp: new Date().toISOString(),
    text: result.text || 'Действие передано приложению.',
    attachments: result.attachments || [],
    actions: result.actions || []
  });
  renderChatWorkspaceAccordion();
  renderChatMessages();
};

function scrollToBottom() {
  const list = document.getElementById('ai-drawer-messages-list');
  if (list) list.scrollTop = list.scrollHeight;
}

window.SCostAIChat = {
  configure: configureAIChat,
  init: () => window.initAIDrawer(),
  open: () => {
    const drawer = document.getElementById('ai-drawer');
    if (drawer && !drawer.classList.contains('open')) window.toggleAIDrawer();
  },
  close: () => window.closeAIDrawer(),
  toggle: () => window.toggleAIDrawer(),
  updateContext: updateAIDrawerContext,
  getState: () => cloneValue(chatWorkspace),
  setState: workspace => {
    if (!workspace?.chats || !Array.isArray(workspace.chats)) {
      throw new TypeError('AIChat.setState ожидает объект workspace с массивом chats.');
    }
    chatWorkspace = cloneValue(workspace);
    persistChatWorkspace();
    renderChatWorkspaceAccordion();
    renderChatMessages();
  }
};
