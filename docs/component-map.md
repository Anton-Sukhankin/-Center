# Карта компонентов и пользовательских сценариев

## Назначение

Документ связывает интерфейсные компоненты, пользовательские сценарии, источники данных и файлы кода. Он нужен, чтобы при изменении одного элемента было понятно, какие связанные документы и сценарии нужно проверить.

`docs/system-compliance-matrix.md` является следующей контрольной точкой после этой карты: карта отвечает на вопрос "где находится элемент и с чем он связан", а матрица фиксирует, насколько текущая реализация элемента соответствует продуктовой модели S.Center.

Для оценки каскадных изменений используется `docs/component-impact-map.md`: он отвечает на вопрос "что еще нужно проверить, если этот элемент изменился".

## Общая цепочка данных

```text
src/data/
  -> src/app/app.js
  -> src/components/ и src/features/
  -> интерфейс пользователя
```

`src/data/` хранит сущности и расчетные функции. `src/app/app.js` выбирает активный контекст, получает данные и передает их компонентам. Компоненты и сценарии отображают данные и вызывают публичные действия через `window.*`.

## Активные области интерфейса

| Область интерфейса | Код | Документация | Источник данных | Пользовательский путь |
| --- | --- | --- | --- | --- |
| Левое дерево навигации | `src/components/navigation-tree-item/`, `src/app/app.js` | `src/components/navigation-tree-item/README.md`, `src/app/README.md`, `docs/context-behavior.md`, `docs/access-control.md` | `src/data/project-structure.js` | Выбор бизнес-юнита, проекта или очереди меняет контекст интерфейса. |
| Шапка проекта | `src/app/app.js` | `src/app/README.md`, `docs/context-behavior.md` | `window.activeContext`, `projectStructureData` | Пользователь видит выбранный контекст и атрибуты проекта. |
| Тулбар событий | `src/components/event-toolbar/` | `src/components/event-toolbar/README.md` | `window.filterState`, `window.toolbarState` | Переключение вкладок `Сегодня`, `Все события`, `Закрепленные`, `Метрики`, поиск, открытие фильтра, запуск аналитики. |
| Центральный дашборд метрик | `src/features/metrics-dashboard/`, `src/app/app.js` | `src/features/metrics-dashboard/README.md`, `docs/plans/metrics-dashboard-integration-plan.md` | `window.metricsDashboardData`, `window.metricsDashboardViewModel`, `window.activeContext` | Пользователь выбирает проект или очередь и открывает `Метрики`; сроки, полная шкала контрольных этапов и бюджеты меняются по `contextKey` без loading-мерцания уже открытого dashboard, а блок этапов можно временно свернуть. |
| Сводка цифровой шахматки | `src/features/digital-chessboard-summary/`, `src/components/construction-table/`, `src/app/app.js`, `index.html` | `src/features/digital-chessboard-summary/README.md`, `src/components/construction-table/README.md`, `docs/reference/digital-chessboard-summary/README.md`, `docs/evidence/digital-chessboard-summary/README.md` | `window.digitalChessboardSummaryData`, `window.constructionObjectsData`, `window.objectsData`, `window.activeContext` | Пользователь выбирает `Сводка` в dropdown, меняет общий проект, изучает KPI, недельную динамику, проблемы и таблицу объектов, открывает архив, печатную форму и detail-drawer без потери состояния соседних экранов. |
| Цифровая шахматка | `src/features/digital-chessboard/`, `src/components/construction-object-selector/`, `src/app/app.js`, `index.html` | `src/features/digital-chessboard/README.md`, `src/components/construction-object-selector/README.md`, `docs/plans/digital-chessboard-integration-plan.md`, `docs/reference/digital-chessboard/README.md` | `window.constructionObjectsData`, `window.digitalChessboardData`, `window.activeContext` | Пользователь раскрывает dropdown `Цифровая шахматка`, выбирает `Шахматка`, затем объект с параметрами в description карточки, период и работу; изучает готовность по этажам/секциям или сравнивает две работы без потери состояния dashboard и раздела `Объекты`. |
| Объекты | `src/features/objects/`, `src/components/construction-object-selector/`, `src/app/app.js`, `index.html` | `src/features/objects/README.md`, `src/components/construction-object-selector/README.md`, `docs/plans/objects-integration-plan.md`, `docs/reference/objects/README.md` | `window.constructionObjectsData`, `window.objectsData`, `window.activeContext` | Пользователь выбирает `Объекты` в dropdown, переключает один из пяти объектов с параметрами в description карточки, изучает фиксированную строку параметров, фильтрует и раскрывает дерево `Группа работ → Вид работ`, прокручивает большую таблицу и формирует CSV; состояние независимо от шахматки. |

Уточнение карты: `Сводка`, `Объекты` и `Шахматка` являются самостоятельными feature-поверхностями dropdown `Цифровая шахматка` и каждая показывает локальный заголовок выбранного раздела в верхней левой части рабочей области с контрактом `24px / 600`.
| Табы приоритета событий | `src/app/app.js` | `src/app/README.md` | `window.filterState.priorityView`, текущая выборка событий | Пользователь переключает отображение между событиями высокого и низкого приоритета. |
| Карточка события | `src/components/event-card/`, `src/app/app.js` | `src/components/event-card/README.md`, `docs/source-visual-themes.md` | `appData.getEventListViewModel()`, `taskData.getTaskCountForEvent()` | Пользователь читает событие, видит индикатор связанной задачи, закрепляет, открывает детали, исключает при активных фильтрах. |
| Детальная карточка события | `src/app/app.js`, `src/features/tasks/`, `src/features/bi/` | `src/app/README.md`, `src/components/event-card/README.md`, `docs/decision-actions.md`, `docs/plans/event-task-creation-integration-plan.md`, `docs/plans/event-metric-bi-modal-reintegration-plan.md` | `appData.getEventDetailViewModel()`, `window.taskData`, `window.metricsData` | Пользователь раскрывает событие, видит расширенный состав данных и статичные карточки созданных задач, создаёт задачу, редактирует ее через кнопку с карандашом, удаляет через кнопку с корзиной либо открывает BI-график связанной метрики. |
| BI-график метрики | `src/features/bi/`, `src/app/app.js` | `src/features/bi/README.md`, `docs/plans/event-metric-bi-modal-reintegration-plan.md`, `docs/entity-model.md` | Выбранный узел `window.metricsData`; демонстрационная помесячная серия feature | Пользователь нажимает связанную метрику в event drawer, изучает план/факт, включает прогноз и закрывает график без закрытия события. |
| Создание, редактирование и удаление задачи | `src/features/tasks/`, `src/app/app.js` | `src/features/tasks/README.md`, `docs/decision-actions.md`, `docs/plans/event-task-creation-integration-plan.md` | `window.taskData`, исходное событие из `window.appData` | Пользователь нажимает кнопку «Создать задачу» в footer события, переходит в `task-create`, заполняет обязательные поля, выбирает ответственного из dropdown или команды проекта, создаёт задачу, позднее редактирует ее через icon-кнопку с карандашом или удаляет через icon-кнопку с корзиной. |
| Фильтр событий | `src/features/filters/` | `src/features/filters/README.md`, `docs/context-behavior.md`, `docs/access-control.md` | `appData.getEventSources()`, `appData.getMetricSelectorTree()`, `window.filterState` | Пользователь настраивает выдачу событий внутри активного контекста. |
| Плавающая панель действий | `src/components/floating-action-bar/` | `src/components/floating-action-bar/README.md` | `window.toolbarState`, `window.filterState` | Пользователь видит режим фильтрации и может выйти из него. |
| AI-аналитика | `src/features/analytics/` | `src/features/analytics/README.md`, `docs/decision-actions.md` | активные события и состояние интерфейса | Пользователь запускает аналитический сценарий по текущей выдаче и получает основу для управленческого решения. |

## Технически подключенные и планируемые области интерфейса

Эти элементы еще не имеют полного пользовательского пути в интерфейсе. Они могут быть технически подключены, но не считаются завершенными компонентами прототипа, пока не имеют точки входа, проверенного UX и актуального статуса в матрице.

| Область интерфейса | Планируемый код | Документация | Источник данных | Пользовательский путь |
| --- | --- | --- | --- | --- |
| Ассистент S.Center / ИИ-чат | `src/features/chat/`, `src/components/event-toolbar/`, `chat-transfer-package/src/AIChat.js`, `chat-transfer-package/src/AIChat.css` | `src/features/chat/README.md`, `src/components/event-toolbar/README.md`, `docs/plans/scenter-ai-chat-integration-plan.md` | `window.activeContext`, `window.filterState`, `window.toolbarState`, `window.metricsData`, текущая экранная выборка событий | Пользователь открывает drawer `Ассистент S.Center` кнопкой `Задать вопрос` в правой зоне тулбара событий. |

## Изолированные области

Эти элементы сохранены в репозитории, но не входят в активную структуру проекта. Их нельзя читать и индексировать при обычном обзоре. Использовать только по прямой команде пользователя на восстановление, аудит или повторную интеграцию.

| Область интерфейса | Изолированное расположение | Документация | Сохраненный источник данных | Статус |
| --- | --- | --- | --- | --- |
| Архивный правый блок метрик: строительные и финансовые карточки, drawer структуры и исходная версия BI | `legacy/isolated/right-metrics-panel/` | `legacy/isolated/right-metrics-panel/README.md` | `window.metricsData`, `appData.getMetricsForContext()`, `appData.getConstructionMetricsForContext()` | Правая панель и дерево исключены из активного интерфейса. BI возвращен отдельно как активный `src/features/bi/`, архивная копия не подключается. |

## Правило обновления карты

Карту нужно обновлять, если:

- появился новый компонент или сценарий;
- компонент начал использовать новый источник данных;
- изменился пользовательский путь;
- изменился публичный `window.*` интерфейс;
- компонент переехал в другую папку;
- один компонент начал зависеть от другого.

Если изменение меняет назначение компонента, данные, визуальный слой, пользовательский путь или статус готовности относительно продуктовой модели, нужно также обновить `docs/system-compliance-matrix.md`.

Если изменение одного компонента влияет на другой компонент, общий слой данных, состояние, расчет или пользовательский сценарий, нужно проверить и при необходимости обновить `docs/component-impact-map.md`.

Состояния компонентов считаются частью карты интерфейса. Если меняется состояние `hidden`, `excluded`, `pinned`, `empty`, `selected`, `active` или условия перехода в него, нужно проверить `docs/component-states.md` и README соответствующего компонента или feature.

## Связанные документы

- `PROJECT_GUIDELINES.md` — общие правила проекта;
- `docs/component-states.md` — классификация состояний компонентов и правила их документирования;
- `src/data/README.md` — модель данных и расчетные функции;
- `src/app/README.md` — связующий слой приложения;
- `docs/entity-model.md` — модель сущностей;
- `docs/access-control.md` — правила видимости данных и действий по ролям;
- `docs/decision-actions.md` — решения и действия пользователя после события или ИИ-аналитики;
- `docs/context-behavior.md` — правила перестройки интерфейса при выборе активного контекста;
- `docs/component-library.md` — концепция внутренней библиотеки компонентов.
- `docs/system-compliance-matrix.md` — матрица соответствия компонентов, данных и сценариев текущей продуктовой модели;
- `docs/component-impact-map.md` — карта взаимного влияния компонентов и обязательных проверок при связанных изменениях;
- `docs/plans/system-scaling-roadmap.md` — будущие этапы для элементов, которые пока не реализованы полностью.
