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
| Тулбар событий | `src/components/event-toolbar/` | `src/components/event-toolbar/README.md` | `window.filterState`, `window.toolbarState` | Переключение вкладок, поиск, открытие фильтра, запуск аналитики. |
| Табы приоритета событий | `src/app/app.js` | `src/app/README.md` | `window.filterState.priorityView`, текущая выборка событий | Пользователь переключает отображение между событиями высокого и низкого приоритета. |
| Карточка события | `src/components/event-card/`, `src/app/app.js` | `src/components/event-card/README.md` | `appData.getEventListViewModel()` | Пользователь читает событие, закрепляет, открывает детали, исключает при активных фильтрах. |
| Детальная карточка события | `src/app/app.js` | `src/app/README.md`, `src/components/event-card/README.md`, `docs/decision-actions.md` | `appData.getEventDetailViewModel()` | Пользователь раскрывает событие, видит расширенный состав данных и выбирает дальнейшее действие. |
| Фильтр событий | `src/features/filters/` | `src/features/filters/README.md`, `docs/context-behavior.md`, `docs/access-control.md` | `appData.getEventSources()`, `appData.getMetricSelectorTree()`, `window.filterState` | Пользователь настраивает выдачу событий внутри активного контекста. |
| Плавающая панель действий | `src/components/floating-action-bar/` | `src/components/floating-action-bar/README.md` | `window.toolbarState`, `window.filterState` | Пользователь видит режим фильтрации и может выйти из него. |
| Строительные показатели | `src/components/construction-metric-card/`, `src/app/app.js` | `src/components/construction-metric-card/README.md`, `docs/plans/construction-metrics-context-plan.md` | `appData.getConstructionMetricsForContext()` | Значения меняются при выборе очереди, проекта или бизнес-юнита. |
| Финансовые показатели | `src/components/metric-card/`, `src/app/app.js` | `src/components/metric-card/README.md`, `src/features/metrics/README.md`, `docs/access-control.md` | `window.metricsData`, `appData.getMetricsForContext()` | Пользователь смотрит сводную метрику, переходит к дочерним и открывает график. |
| Структура метрик | `src/features/metrics/` | `src/features/metrics/README.md`, `docs/access-control.md` | `window.metricsData`, `window.activeMetricId` | Пользователь раскрывает дерево метрик и синхронизирует выбор с правой панелью. |
| BI-модалка | `src/features/bi/` | `src/features/bi/README.md` | выбранная финансовая метрика | Пользователь анализирует выбранную метрику в расширенном представлении. |
| AI-аналитика | `src/features/analytics/` | `src/features/analytics/README.md`, `docs/decision-actions.md` | активные события и состояние интерфейса | Пользователь запускает аналитический сценарий по текущей выдаче и получает основу для управленческого решения. |

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
