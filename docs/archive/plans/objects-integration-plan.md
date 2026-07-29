# План: интеграция раздела «Объекты»

Статус: выполнен и принят 27.07.2026; нативная интеграция и browser QA завершены, временный стенд удален после продуктовой приемки.

Документ подчиняется `docs/plans/README.md` и описывает перенос принятого стенда `objects-stand/` в активный classic-script прототип S.Center. Это макро-интеграция с высокой связностью: она затрагивает общий header, основной screen-controller, `src/data`, действующую «Цифровую шахматку», новый feature, overlay/focus-контракты и проектную документацию.

## Goal

Добавить `Объекты` как третью сохраняемую основную поверхность приложения и открыть ее из доступного dropdown `Цифровая шахматка → Шахматка / Объекты`, не нарушая dashboard, уже интегрированную шахматку и публичные `window.*` контракты.

Итоговый пользовательский путь:

1. `Сводный дашборд` остается самостоятельным пунктом header.
2. Клик по trigger `Цифровая шахматка` только раскрывает или закрывает dropdown.
3. Пункт `Шахматка` открывает существующий interface цифровой шахматки.
4. Пункт `Объекты` открывает интегрированный interface принятого стенда.
5. Возврат между тремя поверхностями сохраняет их несвязанные локальные состояния в пределах загрузки страницы.

## Context

### Текущая реализация

- активный прототип работает через обычный `index.html`, classic `<script>` и IIFE без ES-модулей и сборщика;
- «Цифровая шахматка» уже интегрирована в `src/features/digital-chessboard/` и предоставляет lifecycle `mount`, `setContext`, `show`, `hide`, `closeOverlays`, `destroy`;
- до выполнения плана `src/app/app.js` содержал бинарный controller `dashboard | digital-chessboard`, а click по `#nav-digital-chessboard` сразу открывал шахматку;
- временный `objects-stand/` был реализован отдельно на React 19/Vite, не подключался к runtime активного приложения и удален после продуктовой приемки;
- стенд содержал пять карточек объектов, фиксированную строку параметров, quick/applied filters, двухуровневое дерево `WorkGroup → WorkType`, CSV, no-results, sticky header/footer и custom-scroll indicators;
- исходный пользовательский референс сохранен в `docs/reference/objects/`, а активной реализацией является только нативный feature.

### Критическое расхождение demo-данных

Стабильная идентичность пяти объектов совпадает: `id`, название, тип и иконка. Геометрия расходится:

- шахматка использует для жилых домов матрицу `34 этажа × 16 секций`;
- стенд `Объекты` показывает паспортные значения `25/3`, `27/4`, `24/3`.

Поэтому текущая интеграция не объявляет эти значения единым промышленным атрибутом. Общий слой объединяет только стабильную идентичность, а `matrix geometry` шахматки и `passport parameters` раздела «Объекты» остаются разными demo-view-model до отдельного продуктового решения.

## Architectural Decisions

1. React, ReactDOM, Vite runtime, iframe и bundle стенда в активное приложение не подключаются.
2. `Объекты` переносятся нативно в `src/features/objects/` как classic-script/IIFE feature `window.SCenterObjects`.
3. Новый `src/data/construction-objects-data.js` хранит только общую стабильную идентичность пяти объектов и не смешивает feature-specific параметры.
4. Новый `src/data/objects-data.js` формирует demo-модель `Объект → WorkGroup → WorkType` для project context.
5. `window.digitalChessboardData` и `window.SCenterDigitalChessboard` сохраняют названия и смысл.
6. Повторяемая карточка выбора объекта выносится в `src/components/construction-object-selector/`; компонент принимает feature-specific card view-model, поэтому общий визуальный контракт не требует ложного объединения данных.
7. `src/app/app.js` управляет явным whitelist `dashboard | digital-chessboard | objects`; неизвестное значение не должно молча превращаться в dashboard.
8. Dashboard, шахматка и `Объекты` монтируются при инициализации страницы и дальше переключаются без перемонтирования через `hidden`/`show`/`hide`; это сохраняет их независимые локальные состояния.
9. Выбранный объект каждой feature является независимым локальным состоянием. Не вводится неоговоренная синхронизация выбранной карточки и не расширяется `window.activeContext` уровнем ConstructionObject.
10. Trigger в header сохраняет постоянное название `Цифровая шахматка`; текущая дочерняя поверхность отмечается внутри dropdown.

## Current and Future Boundaries

### Реализуется сейчас

- доступный dropdown и переключение трех основных поверхностей;
- общий catalog идентичности объектов;
- нативный feature `Объекты` с полной parity принятого стенда;
- demo-данные, project/queue/business-unit context resolver;
- сохранение локальных состояний в пределах загрузки страницы;
- demo CSV текущей выборки;
- документация текущей реализации.

### Остается будущей моделью

- единая подтвержденная геометрия объекта для шахматки и паспорта;
- реальные Gantt/ERP/КС-2/S.Control/backend API;
- промышленная методика агрегирования готовности;
- справочник `LegalEntity`/подрядчиков вместо display-строк `ООО ...`;
- роли, права, persistence, deep links и промышленный экспорт;
- согласованный состав row-menu;
- ConstructionObject как уровень общего дерева или `window.activeContext`.

## Scope

- `src/data/construction-objects-data.js`;
- `src/data/objects-data.js` и автоматическая проверка его инвариантов;
- `src/components/construction-object-selector/` с README, JS и CSS;
- адаптация шахматки к общему identity/selector без изменения ее публичного API и поведения;
- `src/features/objects/objects.js`, `objects.css`, `README.md`;
- `#objects-view` и `#objects-root` рядом с `#digital-chessboard-view`;
- header dropdown с mouse/keyboard/focus поведением;
- screen-controller для трех поверхностей;
- context и overlay coordination;
- регрессионная, accessibility, data и visual QA;
- синхронизация документации.

## Out of Scope

- изменение dashboard, событий, метрик, задач, BI, AI или чата, кроме необходимой регрессионной проверки;
- общий URL-router/history routing;
- добавление объекта строительства в левое дерево;
- изменение существующих публичных `window.*` интерфейсов;
- чтение, подключение или изменение `legacy/isolated/`;
- удаление `objects-stand/` до отдельной продуктовой приемки;
- исправление несовпадающей demo-геометрии без отдельного продуктового решения.

## Constraints

- активная страница продолжает запускаться как обычный `index.html` через локальный HTTP-сервер;
- порядок подключений остается явным: data → UI/shared component → feature → app;
- новые feature/data не создают копии Project, Queue, Event, Metric или Task;
- `src/app` только координирует view/context и не становится источником объектов или работ;
- существующие `window.activeContext`, `window.filterState`, `window.toolbarState`, `window.metricsData`, `window.SCenterComponents`, `window.digitalChessboardData`, `window.SCenterDigitalChessboard` и остальные документированные контракты не меняют смысл;
- CSS раздела полностью изолируется префиксом `obj-` и root-scope `#objects-root`; глобальные selectors стенда не переносятся;
- скрытие feature закрывает локальные overlay/drag, но не сбрасывает его состояние;
- business unit не получает данные предыдущего project context;
- нативные scrollbars таблицы остаются скрыты, custom indicators сохраняют принятый контракт;
- React/Vite/Sites-зависимости временного стенда не переносятся в активное приложение.

## Data and Public Contracts

### `window.constructionObjectsData`

Новый catalog предоставляет clone/read API для стабильных полей:

- `id`;
- `name`;
- `type`/`typeLabel`;
- `icon`.

Паспортные параметры, matrix axes, actual/plan и структурная подпись поступают через feature-specific adapters.

### `window.objectsData`

Публичный demo-слой предоставляет:

- `STATUS`;
- `getForContext(context)`;
- `validate(model)`.

Строка таблицы содержит `id`, `parentId`, `depth`, `kind`, `code`, `name`, `weightPercent`, `plannedStart`, `plannedEnd`, `contractorName`, `actualProgressPercent`, `status`, `hasChildren`.

### `window.SCenterObjects`

Feature повторяет lifecycle шахматки:

- `mount(root, options)`;
- `setContext(context)`;
- `show()`;
- `hide()`;
- `closeOverlays()`;
- `destroy()`.

### Контекст

- `project` использует собственный `projectId`;
- `queue` использует родительский `projectId`;
- `business unit` показывает `unsupported-context` и очищает stale project data;
- смена `projectId` сбрасывает выбранный объект, фильтры, раскрытие и прокрутку к безопасному состоянию;
- переход между очередями одного проекта сохраняет локальное состояние feature.

## Header Dropdown Contract

Существующий `id="nav-digital-chessboard"` сохраняется на trigger, но anchor заменяется нативной кнопкой:

- `type="button"`;
- `aria-haspopup="menu"`;
- `aria-expanded`;
- `aria-controls="digital-section-menu"`;
- постоянный label `Цифровая шахматка`;
- chevron с `aria-hidden="true"`.

Dropdown:

- `role="menu"`, связь с trigger через `aria-labelledby`;
- два `role="menuitem"`: `Шахматка` и `Объекты`;
- активный item получает `aria-current="page"` и визуальную check-индикацию;
- trigger активен, когда открыта любая из двух дочерних поверхностей;
- на dashboard trigger не активен.

Keyboard/focus:

- click, `Enter` и `Space` на trigger переключают dropdown без смены поверхности;
- `ArrowDown` открывает меню и фокусирует активный или первый item;
- `ArrowUp` открывает меню и фокусирует последний item;
- внутри работают `ArrowUp/Down`, `Home`, `End`;
- `Enter`/`Space` выбирают item;
- `Escape` закрывает меню и возвращает focus trigger;
- `Tab` закрывает меню без focus trap;
- outside-click закрывает меню;
- после выбора item меню закрывается, focus возвращается trigger;
- недопустимо скрывать меню с фокусом на скрытом item.

## Objects Feature Parity

Нативный перенос сохраняет:

- пять object cards и roving tab navigation;
- локальные `activeObjectId`, `expandedGroups`, `quickStatus`, `appliedFilters`, `draftFilters`, filter-dialog и announcement;
- reset фильтров и раскрытие стартовой группы при выборе другого объекта;
- пересечение quick status, applied status, contractor и search;
- видимость группы при совпадении самой группы или ее дочерней работы;
- двухуровневое дерево с отдельной disclosure-колонкой;
- сложный header `Плановый срок → С / По`;
- одиночный header `Степень готовности` без дочернего `Факт`;
- фиксированные пять параметров `114 / 98 / 143 / 133 / 141px`;
- гибкие колонки `Подрядчик / поставщик` и `Степень готовности`;
- ellipsis/title, status chips, row action announcement;
- empty/no-results;
- filter draft/apply/cancel/reset, `Escape`, outside-click, focus trap и focus return;
- CSV с UTF-8 BOM, `;`, CRLF, escaping, текущей отфильтрованной выборкой и revoke ObjectURL;
- sticky двухстрочный header, пустой sticky footer и локальный overflow;
- vertical/horizontal draggable indicators, horizontal track на `8px` выше footer;
- cleanup ResizeObserver, document listeners, pointer drag и toast timer при hide/destroy.

Для нагрузки DOM рендерит только активный объект и текущие видимые/отфильтрованные строки. Данные могут лениво кэшироваться по `projectId/objectId`.

## Impact

| Область | Влияние | Риск и обязательная проверка |
| --- | --- | --- |
| `index.html` | Dropdown, новый root, CSS/JS order | Unique IDs, data → component/feature → app, отсутствие React/Vite runtime |
| Header / `global.css` | Новый menu trigger и overlay | z-index, active state, 200% zoom, keyboard/focus |
| `src/app/app.js` | Трехэкранный controller | Dashboard, context, overlay cleanup, отсутствие нового публичного router API |
| `src/data/` | Общая identity и objects view-model | Не смешать passport/matrix geometry, clone semantics, project/queue/BU |
| Общий selector | Две feature используют один визуальный контракт | Visual/keyboard regression шахматки до подключения Objects |
| `digital-chessboard` | Новый источник identity и новый путь входа | Сохранить 27 работ, матрицы, calendar/comparison, public lifecycle |
| `objects` | Новый крупный active feature | Полная parity стенда, cleanup, 3415 demo rows, CSV |
| Overlay layers | Header menu + objects filter | Event/task/filter/BI/AI/chat conflicts, Escape/focus |
| Документация | Меняется current implementation и user path | Maps, matrix, states, entity/data/app/feature README, roadmap |

По `docs/component-impact-map.md` задача имеет высокую связность и относится к макро-уровню.

## Subagents

Для этапа Execute оптимальна схема `основной агент + 3 ограниченных субагента`, но одновременно изменяют код только два субагента:

1. `objects_data_selector`
   - область: `src/data/construction-objects-data.js`, `src/data/objects-data.js`, data validators и `src/components/construction-object-selector/`;
   - не меняет `index.html`, `src/app/app.js`, глобальные стили и архитектурные статусы;
   - результат: стабильный API, tests и parity selector.
2. `objects_feature`
   - область: только `src/features/objects/`;
   - переносит native render/state/filter/tree/CSV/dialog/scroll/lifecycle и `obj-` CSS;
   - работает против заранее зафиксированного API data/selector и не редактирует shell.
3. `integration_audit`
   - запускается после первичного объединения;
   - read-only аудит header semantics, keyboard/focus, трех маршрутов, context, overlays, CSS collisions, regression и документационных связей;
   - не принимает архитектурных решений и не меняет код без отдельного follow-up основного агента.

Основной агент оставляет за собой `index.html`, `src/app/app.js`, `src/styles/global.css`, адаптацию шахматки, объединение результатов, browser QA, карты влияния, compliance matrix и финальную приемку.

Параметры субагентов:

- без model override: наследуется текущая модель и reasoning;
- ограниченный fork последних релевантных turns плюс полный task brief и ссылки на обязательные документы;
- запрет дальнейшего делегирования без согласования;
- отдельные непересекающиеся file scopes;
- временные инструкции передаются в task prompt и прекращают действие с завершением подзадачи; отдельные временные instruction-файлы не создаются;
- устойчивые решения после реализации фиксируются только в профильных README/AGENTS и картах проекта.

## Steps

### 1. Baseline и data reconciliation

- зафиксировать текущие browser/DOM/interaction baselines dashboard, шахматки и стенда;
- прогнать текущие syntax/data/browser smoke checks;
- зафиксировать общий identity contract и несовпадающие feature-specific параметры;
- сохранить stand fixtures неизменными как источник переноса.

### 2. Общий identity и objects data

- создать `construction-objects-data.js`;
- создать `objects-data.js` с context resolver и lazy/cache strategy;
- перенести детерминированные fixtures и validation;
- адаптировать `digital-chessboard-data.js` только к стабильной identity;
- убедиться, что публичный ответ шахматки и ее карточки не изменились.

### 3. Общий object selector

- создать pure renderer/keyboard helper в `window.SCenterComponents`;
- перенести accepted card styling в scoped component CSS;
- мигрировать шахматку на selector;
- пройти visual/keyboard parity до продолжения интеграции.

### 4. Нативный Objects feature

- перенести JSX в безопасные render-функции и event delegation;
- реализовать lifecycle и cleanup registry;
- перенести object cards, parameters/tools, tree table, filters, CSV, no-results, toast и scroll indicators;
- использовать глобальный Lucide/`SCenterUI`, не `lucide-react`;
- проверить feature изолированно через временный programmatic mount без изменения header.

### 5. Трехэкранный shell

- добавить общий `.app-main-view[hidden]` contract;
- добавить `#objects-view/#objects-root`;
- подключить CSS/JS в правильном порядке;
- заменить бинарный `setMainView` явным registry/whitelist трех поверхностей;
- сначала проверить programmatic переходы без dropdown;
- при смене поверхности скрывать две неактивные feature и закрывать их overlays без destroy.

### 6. Header dropdown

- заменить прямой переход доступным trigger/menu;
- реализовать mouse, keyboard, outside-click и focus behavior;
- синхронизировать active/`aria-expanded`/`aria-current`;
- убедиться, что прямой click trigger больше не меняет экран.

### 7. Context и overlay coordination

- при `window.setActiveEntity` передавать context обеим feature, включая скрытую;
- закрывать event drawer и конфликтующие task/filter/BI/AI/chat layers до смены основной поверхности;
- проверить project, queue, business unit и возврат из unsupported state;
- исключить stale data и duplicate listeners.

### 8. Regression и visual QA

- пройти полную матрицу Objects parity;
- пройти полную regression шахматки;
- пройти dashboard/event/metrics/task/filter/BI/AI/chat smoke;
- проверить desktop, narrow viewport и zoom 200%;
- проверить console, lifecycle и повторные циклы переходов.

### 9. Документация и статус

- обновить feature/component/data/app README;
- обновить entity/states/context/maps/matrix/roadmap;
- перевести `Объекты` из `не реализовано` в `частично совпадает` только после фактической интеграции и приемки;
- явно сохранить реальные sources, methodology, rights, persistence, LegalEntity, row-menu и industrial export как future.

## Acceptance Criteria

### Header и навигация

- trigger явно показывает dropdown и содержит ровно два пункта `Шахматка` и `Объекты`;
- click trigger не меняет основную поверхность;
- весь keyboard/outside-click/focus contract работает;
- одновременно видима ровно одна из `dashboard`, `digital-chessboard`, `objects`;
- `aria-expanded`, `aria-current` и active styles синхронизированы;
- цикл `dashboard → шахматка → объекты → шахматка → dashboard` повторяется не менее пяти раз без duplicate listeners и console warnings.

### Состояние и контекст

- dashboard сохраняет active context, внутреннюю вкладку, фильтры и scroll;
- шахматка сохраняет объект, период, выбранные работы и comparison;
- `Объекты` сохраняют объект, filters, expanded groups и scroll;
- смена project сбрасывает только зависимое состояние feature;
- queue одного project сохраняет состояние;
- business unit показывает unsupported state без данных предыдущего project;
- выбранный объект двух feature не синхронизируется неявно.

### Shared data и selector

- пять стабильных object IDs/names/types/icons поступают из одного identity catalog;
- шахматка сохраняет собственные matrix axes, раздел `Объекты` — собственные passport parameters;
- selector сохраняет визуальный и keyboard contract шахматки;
- существующие `window.digitalChessboardData` и `window.SCenterDigitalChessboard` не ломаются.

### Objects parity

- пять карточек и параметры совпадают с принятым стендом;
- у каждого объекта ровно 32 группы и 15–27 уникальных дочерних работ;
- tree disclosure, complex header, filters, reset, no-results, CSV и row announcement работают;
- filter dialog поддерживает draft/apply/cancel/reset, focus trap/return и `Escape`;
- fixed parameter widths, flexible contractor/progress columns, ellipsis/title, sticky header/footer и custom scroll сохранены;
- CSV содержит текущую отфильтрованную выборку, BOM, `;`, CRLF и корректное escaping;
- hide/show не сбрасывает состояние, destroy полностью удаляет observers/listeners/timers.

### Общая регрессия

- dashboard, event feed/drawer, metrics dashboard, filters, tasks, BI, AI analytics и chat проходят smoke-test;
- шахматка сохраняет пять карточек, 27 работ, calendar draft/apply/cancel, single/empty/comparison, пять статусов и synchronized scroll;
- page-level overflow не появляется;
- zoom `200%` не скрывает обязательные действия;
- console не содержит errors/warnings.

## Documentation Updates

При реализации обновить:

- `src/features/objects/README.md`;
- `src/components/construction-object-selector/README.md`;
- `src/features/digital-chessboard/README.md`;
- `src/data/README.md`;
- `src/app/README.md`;
- `docs/entity-model.md`;
- `docs/component-states.md`;
- `docs/context-behavior.md`;
- `docs/access-control.md` — проверить; менять только при появлении текущих role rules;
- `docs/component-map.md`;
- `docs/component-impact-map.md`;
- `docs/app-decomposition-map.md`;
- `docs/system-compliance-matrix.md`;
- `docs/plans/README.md`;
- `docs/plans/system-scaling-roadmap.md`;
- `objects-stand-plan.md` и `docs/reference/objects/README.md` — после приемки зафиксировать удаление временного стенда и сохранение исходного референса;
- `index.html` — документированный порядок mount roots и подключений.

## Verification

### Static

- `node --check` всех новых и измененных classic JS;
- проверка существования каждого локального `href/src` из `index.html`;
- проверка порядка `project-structure → construction objects → chessboard/objects data → UI/component → features → app`;
- проверка unique IDs, отсутствия каталога/ссылок runtime на удаленный стенд и отсутствия связей с `legacy/isolated/`;
- проверка отсутствия непреднамеренных новых `window.*`.

### Data

- пять уникальных объектов;
- 32 группы на объект;
- 15–27 уникальных детей в группе;
- только `depth 0/1`, корректные `parentId`, уникальные row IDs;
- сумма весов групп `100`, сумма детей равна весу группы;
- даты детей входят в диапазон группы;
- progress `0–100`, только известные статусы;
- все подрядчики начинаются с `ООО`, присутствуют короткие и длинные строки;
- clone semantics и отсутствие межпроектного mutation leakage;
- project/queue/BU context tests;
- существующая validation шахматки продолжает проходить.

### Browser scenarios

- mouse и keyboard dropdown;
- dashboard ↔ шахматка ↔ объекты;
- пять повторных циклов;
- сохранение локального состояния всех поверхностей;
- project A → project B, queue одного project, BU unsupported и возврат;
- object selection, group disclosure, quick/applied filter intersections;
- filter Apply/Cancel/Reset/Escape/outside-click;
- no-results и CSV content/count/download;
- vertical/horizontal wheel и drag, sticky header/footer, horizontal gap `8px`;
- overlay conflicts и focus return;
- отсутствие console errors/warnings.

### Visual

- сравнение с `docs/reference/objects/` и принятыми карточками шахматки;
- ширины `2560`, `1440`, `1280`, `1024`, `900/768px`;
- zoom `200%`;
- dropdown open/active/focus;
- Objects default/filter/no-results/scroll states;
- Chessboard single/comparison/modal/calendar states.

## Risks and Mitigations

| Риск | Защита |
| --- | --- |
| CSS collision стенда | Полный `obj-` prefix, root scope, запрет stand globals |
| React/Vite попадает в active runtime | Нативный IIFE-перенос, static script-order check |
| Несовпадающая геометрия объявлена общей | Общий catalog только identity, feature-specific adapters |
| DCH regression при общем selector | Отдельный этап migration и parity gate до Objects shell |
| 3415 demo rows перегружают DOM | Active-object/visible-row render и lazy data cache |
| Listeners/ResizeObserver/drag leaks | Cleanup registry, hide/destroy tests, пять циклов переходов |
| Hidden root дает нулевую геометрию | Bind/update scroll indicators после `show()`/`requestAnimationFrame` |
| Dropdown конфликтует с modal/drawer | Согласованный z-index, centralized close sequence, focus audit |
| Старые данные после смены context | Явный project resolver, BU unsupported и context tests |

## Post-acceptance Cleanup

Продуктовая приемка выполнена пользователем. Временный `objects-stand/` вместе с React/Vite/Sites-зависимостями и дублирующими QA-материалами удален. Исходный пользовательский референс сохранен в `docs/reference/objects/`; активное приложение не получило зависимостей стенда. Локальный запуск основного прототипа переведен на независимый `scripts/serve-prototype.mjs`.

## Execution Result

- `objects_data_selector` реализовал общий identity-каталог, `objectsData`, pure selector и два автоматических набора тестов;
- `objects_feature` реализовал нативный lifecycle feature, таблицу, фильтры, CSV и scroll cleanup;
- основной агент интегрировал roots/scripts, трехэкранный controller, header dropdown, адаптацию шахматки, overlay coordination и документацию;
- `integration_audit` выполнил read-only проверку; найденные сценарии trigger `Escape/Tab`, force-cleanup drawer/AI и `ResizeObserver` на `hide()` исправлены;
- статически проверены 7 classic JS, 38 локальных ссылок `index.html`, 45 уникальных ID и отсутствие ошибок `git diff --check`;
- автоматические тесты прошли `2/2`, `objectsData` подтвердил 5 объектов и 3415 строк, `digitalChessboardData.validate()` — 5 объектов;
- browser QA подтвердил mouse/keyboard dropdown, три поверхности, общий selector, object selection, disclosure, filters, CSV generation, project/queue/BU states, 3 повторных цикла и отсутствие console errors/warnings.
- после подтверждения пользователя удален временный `objects-stand/`, обновлены карты и матрица, а основной прототип переведен на независимый локальный server script.

## Approval Gate

Gate пройден явной командой пользователя `Переходи к реализации плана`; последующая продуктовая приемка также подтверждена пользователем. Нативная интеграция выполнена, временный стенд удален; дальнейшие изменения относятся к отдельным future-этапам. Реальные источники, единая геометрия, методика готовности, права, persistence, `LegalEntity`, row-menu и промышленный экспорт не добавлены автоматически.
