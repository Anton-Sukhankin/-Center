# Слой данных

## Назначение

`src/data/` хранит единые источники данных и расчетные функции. Компоненты не должны создавать собственные копии событий, метрик, проектов или очередей.

## Файлы

| Файл | Назначение |
| --- | --- |
| `app-data.js` | События, источники, приоритеты, финансовые метрики, строительные показатели, представления событий и расчетные функции. |
| `project-structure.js` | Дерево бизнес-юнитов, проектов и очередей, а также функции получения активного контекста. |

## Публичные интерфейсы

`window.appData` предоставляет:

- `getEventsForContext(context)`;
- `getMetricsForContext(context, events)`;
- `getConstructionMetricsForContext(context)`;
- `getEventSources()`;
- `getPriorities()`;
- `getMetricSelectorTree(metricsRoot)`;
- `getEventListViewModel(event, metricsRoot)`;
- `getEventDetailViewModel(event, metricsRoot)`;
- `findMetricById(node, id)`;
- `findMetricPathById(node, id)`.

`window.projectStructureData` предоставляет:

- `getProjectStructure()`;
- `findProjectEntityById(id)`;
- `getContextScope(type, id)`.

## Сущности

Основные сущности слоя:

- событие;
- финансовая метрика;
- строительный показатель;
- бизнес-юнит;
- проект;
- очередь;
- активный контекст.

## Пользовательский путь

Пользователь выбирает узел в левом дереве. `project-structure.js` формирует активный контекст. Затем `app-data.js` возвращает события, финансовые метрики и строительные показатели только для этого контекста.

## Когда обновлять документ

Документ нужно обновлять, если:

- добавлен новый тип сущности;
- изменился атрибутивный состав события, метрики, проекта или очереди;
- изменились правила агрегации;
- изменились публичные функции `window.appData` или `window.projectStructureData`;
- компонент начал использовать новый источник данных.
