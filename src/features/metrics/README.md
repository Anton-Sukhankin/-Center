# Структура метрик

## Назначение

Feature `metrics` отвечает за drawer структуры финансовых метрик и синхронизацию выбора метрики с правой панелью.

## Код

- `metric-drawer.js`;
- `metric-drawer.css`.

## Источник данных

Feature использует:

- `window.metricsData`;
- `window.activeMetricId`;
- `window.setActiveMetricId`;
- `window.openChartWidget`.

`window.metricsData` рассчитывается в `appData.getMetricsForContext(activeContext, events)`.

## Пользовательский путь

Пользователь открывает структуру метрик, раскрывает дерево, выбирает метрику и видит синхронное обновление правой панели. Из структуры метрик пользователь может открыть BI-график.

## Важные правила

Drawer структуры метрик и правая панель должны использовать один и тот же источник `window.metricsData`.

Родительские метрики являются суммой дочерних метрик.

## Публичные интерфейсы

- `window.openTreeDrawer`;
- `window.closeMetricDrawer`;
- `window.selectMetricInStructure`;
- `window.selectAndCloseMetric`;
- `window.openChartFromStructure`.

## Когда обновлять документ

Документ нужно обновлять, если меняется структура дерева, расчет метрик, синхронизация с правой панелью, открытие BI или правила выбора активной метрики.
