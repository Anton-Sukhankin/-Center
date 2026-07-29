# План: контракт интеграции ИИ-чата S.Center

Статус: первоначальная demo-интеграция выполнена; промышленные provider и actions вынесены в `docs/plans/ai-chat-provider-actions-plan.md`.

Документ подчиняется регламенту `docs/plans/README.md`.

## Goal

Подготовить интеграционный слой ИИ-чата до визуальной реализации: определить назначение чата, контракт контекста, границы действий, место адаптера и правила взаимодействия с существующими панелями S.Center.

Результат этого этапа — технически подключенный и раскрытый через trigger-кнопку слой чата: переносимое ядро подключено, адаптер S.Center создан, mount root добавлен, кнопка `Задать вопрос` в тулбаре открывает drawer `Ассистент S.Center`.

## Статус текущего прохода

| Этап | Статус | Комментарий |
| --- | --- | --- |
| 1. Адаптер S.Center | Выполнен | Создан `src/features/chat/scenter-ai-chat-adapter.js`. |
| 2. Техническое подключение | Выполнено | В `index.html` подключены `AIChat.css`, локальные токены, `AIChat.js`, адаптер и mount root. Demo provider S.Center реализован внутри адаптера. Mount root зафиксирован как viewport-level overlay, чтобы drawer не обрезался центральным блоком событий. Для S.Center drawer имеет фиксированную ширину `570px`, список чатов, создание новых чатов и resize отключены; ожидание ответа отображается как UX-индикатор `Ассистент анализирует контекст...`; быстрые вопросы скрываются после выбора/отправки и возвращаются после ответа как контекстный follow-up к этому ответу. |
| 3. Trigger-кнопка | Выполнен | Кнопка `Задать вопрос` добавлена в правую зону `EventToolbar` и открывает `Ассистент S.Center` через `window.scenterChat.toggle()`. |

## Context

В проекте есть переносимый пакет `chat-transfer-package`:

- `chat-transfer-package/src/AIChat.js` — ядро чата, состояние, публичный API `window.SCostAIChat`;
- `chat-transfer-package/src/AIChat.css` — стили drawer-чата;
- `chat-transfer-package/docs/integration.md` — порядок подключения и адаптерный контракт;
- `chat-transfer-package/docs/behavior-contract.md` — поведение, геометрия и состояния;
- `chat-transfer-package/tests/interaction-checklist.md` — приемочный чек-лист;
- `chat-transfer-package/adapters/scost-prototype-adapter.js` — пример адаптера для другого проекта.

Текущий S.Center уже имеет:

- активный структурный контекст `window.activeContext`;
- ленту событий, фильтры, вкладки и priority-tabs;
- AI-аналитику как модальное действие по текущей выборке;
- правые drawer и модалки: детальная карточка события, структура метрик, BI;
- глобальные `window.*` интерфейсы и связующий слой `src/app/app.js`.

## Scope

В этот этап входит:

- зафиксировать отличие `Ассистент S.Center` от существующей `AI-аналитики`;
- описать данные, которые чат должен получать из S.Center;
- определить границы действий чата в прототипе;
- создать адаптер S.Center;
- подключить mount root, переносимые файлы и trigger-кнопку;
- определить правила закрытия конфликтующих панелей;
- обновить карты документации, чтобы будущая feature была видна агентам и разработчикам.

## Out of Scope

В этот проход не входит:

- реальный backend, LLM API или хранение истории на сервере;
- продуктовые action-кнопки в ответах чата;
- запуск чата из карточки события или drawer события;
- глубокая переработка визуального языка drawer-чата;
- изменение компоновки ленты событий за пределами trigger-кнопки;
- перенос `scost-prototype-adapter.js` в S.Center;
- переименование глобального API `window.SCostAIChat`.

## Назначение чата

`Ассистент S.Center` — диалоговый помощник по текущему контексту интерфейса S.Center.

Он отличается от кнопки `Аналитика`:

| Элемент | Назначение |
| --- | --- |
| `Аналитика` | Запускает массовый анализ текущей экранной выборки событий и показывает результат как отчет/вывод. |
| `Ассистент S.Center` | Позволяет задавать вопросы по выбранному бизнес-юниту, проекту, очереди, событиям, фильтрам, метрикам и открытым деталям. |

Чат не заменяет AI-аналитику. Он становится диалоговым слоем поверх текущего контекста и может объяснять, уточнять, сопоставлять и помогать пользователю принять решение.

## Контракт контекста

Будущий адаптер S.Center должен формировать объект контекста через `getContext`.

Минимальный состав:

```js
{
  mode: 'dashboard' | 'event-feed' | 'event-detail' | 'filtered-selection',
  contextType: 'bu' | 'project' | 'queue',
  contextId: string,
  contextName: string,
  projectIds: string[],
  queueIds: string[],
  activeTab: 'today' | 'all' | 'pinned' | 'metrics',
  priorityView: 'high' | 'low',
  searchQuery: string,
  filters: {
    period: string,
    sources: string[],
    priority: 'all' | 'high' | 'low',
    metrics: string[]
  },
  visibleEventIds: string[],
  excludedEventIds: string[],
  pinnedEventIds: string[],
  activeMetricId: string | null,
  activeEventId: string | null
}
```

Расширенный состав будущего этапа:

- краткие view model текущих событий;
- summary выбранной метрики;
- информация о праве пользователя видеть финансовые метрики;
- текущая роль пользователя;
- история последних действий пользователя;
- источник запуска чата: toolbar, event drawer, metric drawer, empty state.

## Границы действий чата

На первом интеграционном этапе чат должен:

- отвечать текстом на вопросы по текущему контексту;
- показывать короткий UX-индикатор ожидания перед ответом;
- скрывать быстрые вопросы на время ожидания ответа и показывать новый набор уточнений под последним ответом ассистента;
- объяснять событие, метрику, фильтр или выбранную очередь;
- помогать пользователю понять, какие события попали в текущую выборку;
- работать в режиме одной сессии: после закрытия drawer история переписки очищается;
- демонстрационно отвечать по трем темам: физические параметры объекта, текущий статус реализации, контрольные этапы и календарные сроки;
- предлагать управленческие действия как рекомендации;
- не изменять данные без отдельного подтвержденного будущего этапа.

На первом этапе чат не должен:

- физически создавать задачи;
- изменять приоритет события;
- закреплять или исключать события;
- менять фильтры;
- переключать проект, очередь или метрику;
- отправлять данные во внешние системы;
- сохранять историю нескольких чатов между открытиями drawer;
- показывать технический процесс "размышления" нейросети;
- выполнять действия вместо пользователя.

Допустимые будущие `actions` должны быть описаны отдельно перед реализацией:

| Action | Возможный payload | Статус |
| --- | --- | --- |
| `open-event` | `{ eventId }` | будущий этап |
| `open-metric` | `{ metricId }` | будущий этап |
| `apply-filter-suggestion` | `{ filters }` | будущий этап, требует подтверждения |
| `create-task-draft` | `{ eventIds, title, description }` | будущий этап, только draft |

## Будущий адаптер S.Center

Место реализации:

- `src/features/chat/scenter-ai-chat-adapter.js`;
- `src/features/chat/scenter-ai-chat.css`;
- `src/features/chat/README.md`.

Адаптер:

- вызывать `window.SCostAIChat.configure(...)`;
- передавать mount element;
- передавать trigger element;
- собирать контекст из `window.activeContext`, `window.filterState`, `window.toolbarState`, `window.metricsData`, текущей выдачи событий и открытых drawer;
- использовать demo provider S.Center только до подключения реального API;
- закрывать конфликтующие панели через `onBeforeOpen`;
- обновлять подпись контекста при переключении бизнес-юнита, проекта, очереди, фильтров и выбранной метрики.

Пример целевого адаптерного контура:

```js
window.SCostAIChat.configure({
  getMountElement: () => document.getElementById('scenter-ai-chat-root'),
  getTriggerElement: () => document.getElementById('open-scenter-ai-chat'),
  getContext: () => window.scenterChat?.getContext(),
  getContextLabel: context => window.scenterChat?.getContextLabel(context),
  getSuggestedChatTitle: context => window.scenterChat?.getSuggestedChatTitle(context),
  loadWorkspace: key => window.scenterChatStorage?.load(key),
  saveWorkspace: (key, workspace) => window.scenterChatStorage?.save(key, workspace),
  sendMessage: payload => window.scenterChatProvider.sendMessage(payload),
  onBeforeOpen: () => window.scenterChat?.closeConflictingPanels(),
  onOpenChange: isOpen => window.scenterChat?.handleOpenChange(isOpen),
  onAttachFile: payload => window.scenterChat?.handleAttachFile(payload),
  onAction: payload => window.scenterChat?.handleAction(payload)
});
```

## Конфликтующие панели

Так как чат открывается правым drawer поверх dashboard, он конфликтует с правыми и модальными слоями интерфейса.

При открытии чата в `onBeforeOpen` нужно закрывать или согласованно скрывать:

| Элемент | Текущее назначение | Правило |
| --- | --- | --- |
| Детальная карточка события | Правый drawer события | Закрывать перед открытием чата. Если событие было открыто, его `eventId` можно передать в контекст. |
| Структура метрик | Изолированный правый drawer дерева метрик | Не участвует в активном сценарии чата до возврата правого блока метрик. Выбранная метрика может оставаться только расчетным контекстом. |
| BI-модалка | Изолированный модальный анализ метрики | Не участвует в активном сценарии чата до возврата правого блока метрик. |
| Filter drawer | Панель фильтрации | Закрывать только если она перекрывает чат; состояние фильтров сохранять. |
| Floating action bar | Плавающая панель режима фильтрации | Не закрывать автоматически, но учитывать режим `filtered` в контексте. |

## Точка входа

Рекомендуемое место: правая зона `event-toolbar-root`, рядом с кнопкой `Аналитика`.

Причины:

- это sticky-зона, доступная при скролле событий;
- рядом уже находится AI-действие, поэтому пользователь считывает общую область интеллектуальных функций;
- кнопка не перекрывает карточки и не конкурирует с floating action bar;
- контекст входа естественно связан с текущей лентой событий, фильтрами и выбранным объектом.

Визуальный концепт точки входа сохранен как `docs/evidence/chat/entry-point-proposal.svg`.

## Impact

Будущая интеграция затронет:

- `index.html` — подключение CSS/JS и mount root;
- `src/components/event-toolbar/` — trigger-кнопка;
- `src/features/chat/` — адаптер и локальная документация;
- `src/app/app.js` — обновление контекста чата при перерисовках;
- `src/features/analytics/` — разграничение сценариев AI-аналитики и чата;
- `src/features/filters/` — передача фильтров в контекст;
- `window.metricsData` — расчетный контекст метрик; бывшие `src/features/metrics/` и `src/features/bi/` изолированы в `legacy/isolated/right-metrics-panel/` и не считаются активными конфликтующими панелями;
- `src/components/event-card/` — будущий запуск чата из события, если будет принято такое решение;
- `docs/component-map.md`, `docs/component-impact-map.md`, `docs/system-compliance-matrix.md`.

Уровень связности будущей feature: высокий.

## Steps

1. Зафиксировать этот план и паспорт `src/features/chat/README.md`. Выполнено.
2. Обновить карты и матрицу документации как планируемую feature. Выполнено.
3. Создать адаптер `scenter-ai-chat-adapter.js`. Выполнено.
4. Добавить mount root без trigger-кнопки. Выполнено.
5. Подключить `AIChat.css`, локальные токены, `AIChat.js` и адаптер в правильном порядке. Выполнено.
6. Проверить конфликты drawer, reset-сценарий и обновление контекста при переключении дерева, фильтров и метрик. Частично подготовлено в адаптере; слой drawer вынесен поверх viewport, ширина зафиксирована на `570px`, финальная визуальная проверка выполняется в браузере.
7. Реализовать trigger-кнопку в тулбаре. Выполнено.
8. После визуальной проверки решить, нужен ли запуск чата из event drawer. Запуск из metric drawer возможен только после отдельного возврата правого блока метрик из изоляции.

## Acceptance Criteria

Подготовительный этап считается выполненным, если:

- назначение чата отделено от `AI-аналитики`;
- контракт `getContext` описан;
- границы действий чата описаны;
- место будущего адаптера определено;
- конфликтующие панели перечислены;
- feature отражена в карте компонентов, карте влияния и матрице соответствия;
- визуальная реализация не выполнена до отдельной команды пользователя.

## Documentation Updates

В этом этапе обновляются:

- `docs/archive/plans/scenter-ai-chat-integration-plan.md`;
- `src/features/chat/README.md`;
- `docs/component-map.md`;
- `docs/component-impact-map.md`;
- `docs/system-compliance-matrix.md`;
- `docs/plans/README.md`;
- `docs/plans/system-scaling-roadmap.md`.

## Verification

Проверить:

- наличие планового документа;
- наличие паспорта feature;
- что новая feature не описана как уже реализованная;
- что future-требования вынесены в roadmap;
- что код прототипа и визуальная реализация чата не изменены.
