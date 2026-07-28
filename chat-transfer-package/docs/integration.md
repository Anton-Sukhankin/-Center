# Интеграция в целевой проект

## 1. Подключение

Подключите стили, ядро и собственный адаптер в указанном порядке:

```html
<link rel="stylesheet" href="chat-transfer-package/src/AIChat.css" />
<div id="ai-chat-root"></div>
<script src="chat-transfer-package/src/AIChat.js"></script>
<script src="my-project-ai-chat-adapter.js"></script>
```

В приложениях со сборщиком эти файлы можно импортировать, но порядок остаётся тем же: сначала ядро, затем конфигурация, потом `init()`.

## 2. Минимальный адаптер

```js
SCostAIChat.configure({
  getMountElement: () => document.getElementById('ai-chat-root'),
  getTriggerElement: () => document.getElementById('open-ai-chat'),
  getContext: () => ({
    mode: 'document',
    projectTitle: currentProject.title,
    selectedNodeId: selectedItem?.id ?? null,
    selectedNodeName: selectedItem?.name ?? null
  }),
  getContextLabel: context => `Контекст: ${context.projectTitle}`,
  getSuggestedChatTitle: context => context.selectedNodeName || 'Новый чат',
  loadWorkspace: key => chatRepository.load(key),
  saveWorkspace: (key, workspace) => chatRepository.save(key, workspace),
  sendMessage: async ({ text, chat, context }) => api.send({ text, chat, context }),
  onAttachFile: ({ chat, context }) => uploadDialog.open({ chat, context }),
  onAction: payload => applicationActions.execute(payload),
  onBeforeOpen: () => closeConflictingPanels(),
  onOpenChange: isOpen => analytics.track('ai_chat', { isOpen })
});

SCostAIChat.init();
document.getElementById('open-ai-chat').addEventListener('click', SCostAIChat.toggle);
```

## 3. Формат ответа провайдера

`sendMessage` возвращает строку или объект:

```js
{
  text: 'Ответ ассистента',
  attachments: [],
  actions: [
    {
      id: 'open-row',
      label: 'Открыть строку',
      payload: { action: 'open-row', row_id: 'row-42' }
    }
  ]
}
```

## 4. Публичный API

- `SCostAIChat.configure(adapter)` — задаёт интеграционный слой.
- `SCostAIChat.init()` — создаёт DOM и обработчики.
- `SCostAIChat.open()`, `close()`, `toggle()` — управляют панелью.
- `SCostAIChat.updateContext()` — обновляет подпись контекста.
- `SCostAIChat.getState()` — возвращает копию workspace.
- `SCostAIChat.setState(workspace)` — заменяет состояние и перерисовывает чат.

## 5. Что не переносить из исходного проекта

Не копируйте зависимости от `.title-row`, `reviewDrawer`, `activeTreeNodeId` и `metadataPanelState` в ядро. Это пример данных исходного S.Cost, реализованный только в `adapters/scost-prototype-adapter.js`.
