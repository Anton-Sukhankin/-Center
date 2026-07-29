# План: интеграция «Сводки» цифровой шахматки

Статус: выполнен и принят 27.07.2026; временный стенд удален после переноса контракта и evidence.

Документ подчиняется `docs/plans/README.md`. Задача относится к сложным: миграция затрагивает `index.html`, общий header/dropdown, `src/app`, `src/data`, новый feature, табличный UI-контракт раздела `Объекты`, overlay/focus-сценарии, печать и несколько связанных документов.

## Goal

Перенести согласованный нативный стенд `digital-chessboard-summary-stand/` в основной classic-script прототип S.Center как самостоятельную сохраняемую поверхность `Сводка` внутри dropdown `Цифровая шахматка`.

Целевой пользовательский путь:

1. Пользователь нажимает кнопку `Цифровая шахматка` в общем header.
2. Dropdown показывает три пункта в порядке `Сводка` → `Шахматка` → `Объекты`.
3. Пункт `Сводка` открывает проектную сводку без перемонтирования остальных поверхностей.
4. Карточка выбора проекта меняет канонический `window.activeContext`, после чего dashboard, сводка, шахматка и `Объекты` получают один и тот же проектный контекст.
5. Возврат между четырьмя поверхностями сохраняет их независимые локальные UI-состояния в пределах загрузки страницы.

Локальный стенд сохраняется до функциональной, визуальной и продуктовой приемки интегрированной версии. Его удаление является отдельным завершающим действием, а не частью первого прохода миграции.

## Confirmed Baseline

### Основной прототип

- приложение запускается через обычный `index.html`, classic `<script>` и IIFE без React, JSX, ES-модулей и обязательного build-этапа;
- trigger `#nav-digital-chessboard` уже раскрывает доступный dropdown;
- dropdown сейчас содержит `Шахматка` и `Объекты`;
- `src/app/app.js` управляет whitelist `dashboard | digital-chessboard | objects`;
- три поверхности монтируются один раз и переключаются через `hidden`, `show()` и `hide()`;
- `window.setActiveEntity(...)` является канонической точкой смены `window.activeContext`;
- `window.SCenterDigitalChessboard` и `window.SCenterObjects` имеют lifecycle `mount`, `setContext`, `show`, `hide`, `closeOverlays`, `destroy`;
- `src/data/project-structure.js` является источником бизнес-юнитов, проектов и очередей;
- `window.constructionObjectsData` хранит стабильную идентичность объектов;
- таблица `Объекты` находится внутри feature и пока не является самостоятельным импортируемым компонентом.

### Локальный стенд

Стенд уже реализован на нативных HTML/CSS/JavaScript и содержит:

- project selector, `Архив` и `Печать`;
- шесть KPI-карточек;
- фиксируемую верхнюю область project toolbar + KPI;
- карточки `Динамика за неделю` и `Требуют внимания` с фиксированными header/footer и внутренним scroll;
- фильтр проблем по объекту;
- таблицу объектов с disclosure, readiness, weekly delta, risks, last update и row actions;
- object/issue/report drawers, read-only архив, print preview и print CSS;
- loading, empty, local error/retry, archive и print states;
- keyboard navigation, `Escape`, focus trap/return, focus-visible и reduced-motion;
- автоматические проверки нативной структуры и сценариев.

Стенд использует собственные проекты `horizons`, `river`, `north`. Эти записи являются stand-only fixtures и не переносятся в основной прототип как параллельный каталог Project.

## Architectural Decisions

1. Интеграция остается нативной: React, ReactDOM, Vite runtime, iframe и bundle стенда не подключаются.
2. Создается feature `src/features/digital-chessboard-summary/` с root-scope `#digital-chessboard-summary-root` и префиксом `dcs-`.
3. Создается data-слой `src/data/digital-chessboard-summary-data.js`; он формирует demo view-model по каноническому `projectId` и не хранит второй каталог проектов.
4. Публичный lifecycle feature называется `window.SCenterDigitalChessboardSummary` и повторяет контракт соседних полноширинных feature.
5. `window.digitalChessboardSummaryData` предоставляет только чтение/валидацию demo-модели; presentation state, dropdown, scroll, overlay и toast в сущности не записываются.
6. Проектный selector не меняет контекст самостоятельно. `src/app` передает feature callback смены проекта, который вызывает существующий `window.setActiveEntity(...)` и затем распространяет новый контекст всем смонтированным поверхностям.
7. Для `queue` сводка использует родительский `projectId`; при выборе другой карточки проекта пользователь переходит в project context. Для `business unit` и неизвестного проекта stale-данные не показываются: выводится явное unsupported-state и доступный выбор допустимого проекта.
8. Stand-only проекты и числа не объявляются промышленными данными. Для активных проектов строится детерминированная demo-модель с общими identity объектов и feature-specific KPI/weekly/risk полями.
9. Внутренние project/KPI/analytics/table блоки переносятся как feature-разметка, но глобальный header и sidebar стенда не создаются.
10. Sticky-shell работает внутри scroll-контейнера новой поверхности с `top: 0`; общий header уже занимает отдельную строку `.app-shell`, поэтому дополнительный ручной offset `64px` не вводится.
11. Таблица сводки не копирует весь `objects.css`. Из `Объекты` выделяется минимальный общий construction-table contract: типографика, границы, row/header/footer geometry, overflow shell и scroll-indicator lifecycle. Колонки и строки остаются feature-specific.
12. Выделение общего табличного contract выполняется сначала для `Объекты` с baseline-regression, затем подключается к сводке. Нельзя одновременно перепроектировать таблицу `Объекты` или менять ее данные.
13. Локальные drawer/modal сводки включаются в общий overlay contract и закрываются при уходе с поверхности. Открытие сводки сначала закрывает конфликтующие event/task/BI/filter/AI/chat панели.
14. Все существующие публичные `window.*` сохраняют значение. Новые interfaces документируются отдельно; расширение API шахматки или `Объектов` не выполняется без необходимости подтвержденного cross-feature перехода.

## Current And Future Boundaries

### Реализуется в миграции

- новый пункт `Сводка` в существующем dropdown;
- четвертая основная поверхность и ее lifecycle;
- нативный перенос всех подтвержденных компонентов и локальных функций стенда;
- связь project selector с каноническим активным контекстом;
- единая demo-модель по проекту/очереди и unsupported-state для business unit;
- минимальный общий табличный UI/scroll contract с регрессией `Объекты`;
- read-only archive, print preview/print, drawers, menus, retries и доступность;
- синхронизация документации текущей реализации после фактического переноса;
- сохранение стенда до отдельной приемки и безопасной очистки.

### Остается будущей моделью

- реальные Gantt/ERP/КС-2/S.Control/backend источники;
- промышленная методика KPI, готовности, недельной динамики и рисков;
- серверный архив и юридически значимые снимки;
- роли, права, persistence, history routing и deep links;
- промышленная печатная форма и экспорт;
- канонические связи issue/report с Event и Metric;
- согласованный переход `Открыть в шахматке` с программным выбором объекта;
- ConstructionObject как уровень общего `activeContext`;
- автоматическое удаление стенда до подтверждения пользователя.

## Target File Structure

```text
index.html
src/
  app/
    app.js
    README.md
  components/
    construction-table/
      construction-table.js
      construction-table.css
      README.md
  data/
    digital-chessboard-summary-data.js
    README.md
  features/
    digital-chessboard-summary/
      digital-chessboard-summary.js
      digital-chessboard-summary.css
      README.md
docs/
  plans/digital-chessboard-summary-integration-plan.md
  reference/digital-chessboard-summary/
```

Имя `construction-table/` является целевым рабочим названием. До реализации нужно подтвердить, что в общий слой действительно выносятся повторяемые table-shell/scroll primitives, а не feature-specific колонки или строки.

## Data Contract

### `window.digitalChessboardSummaryData`

Минимальный публичный API:

- `getForContext(context)`;
- `validate(model)`;
- `STATUS` для `ready`, `empty`, `partial-error`, `unsupported-context`.

Целевой demo view-model:

```ts
type DigitalChessboardSummaryViewModel = {
  status: 'ready' | 'empty' | 'partial-error' | 'unsupported-context';
  contextKey: string;
  project: { id: string; name: string; subtitle?: string } | null;
  period: { from: string; to: string; label: string } | null;
  kpis: ProjectKpi[];
  weeklySummary: WeeklySummary | null;
  attentionItems: AttentionItem[];
  objects: ObjectOverviewRow[];
  archive: ArchiveSnapshot[];
  message?: string;
};

type ObjectOverviewRow = {
  id: string;
  name: string;
  typeLabel: string;
  icon: string;
  readinessPercent: number;
  weeklyDeltaPercent: number;
  risk: { count: number; tone: 'none' | 'warning' | 'critical'; flagged?: boolean };
  lastUpdatedAt: string;
  detail?: string;
  expandable?: boolean;
};
```

Правила источников:

- `project.id/name` разрешаются из `projectStructureData`;
- `objects[].id/name/typeLabel/icon` разрешаются через `constructionObjectsData`;
- KPI, weekly delta, attention, risk, archive и last update остаются детерминированными demo-представлениями сводки;
- одинаковый `projectId` должен давать стабильный набор между перерисовками;
- `queue` использует родительский `projectId`, но `contextKey` сохраняет различимость контекста;
- неизвестный project/BU не получает данные предыдущего проекта;
- методы чтения возвращают копии;
- `validate()` проверяет identity, диапазоны процентов, уникальные ids, допустимые tone/status и непротиворечивые totals.

## Feature And App Contracts

### `window.SCenterDigitalChessboardSummary`

- `mount(root, { context, getSelectableProjects, onProjectSelect })`;
- `setContext(context)`;
- `show()`;
- `hide()`;
- `closeOverlays()`;
- `destroy()`.

`getSelectableProjects(context)` является app-owned read-adapter над `projectStructureData`: для project/queue он возвращает все Project-записи из текущего доступного дерева, для business unit — только Project-потомков выбранного BU. Права доступа в этом этапе не моделируются. Stand-заглушка `Открыть в шахматке` остается информационной, если целевой переход не согласован отдельно; скрыто расширять API соседних feature запрещено.

### Screen controller

Whitelist становится:

```text
dashboard | digital-chessboard-summary | digital-chessboard | objects
```

Controller обязан:

- смонтировать все четыре поверхности один раз;
- передавать новый `activeContext` во все три строительные feature, даже если они скрыты;
- показывать только одну поверхность;
- при hide закрывать локальные overlay/popover/menu, но сохранять безопасное локальное состояние;
- не сбрасывать dashboard при переходах;
- не превращать неизвестный view id в dashboard молча;
- синхронизировать header active-state и `aria-current`.

### Project selector bridge

При выборе проекта feature передает `projectId` в app callback. App:

1. находит каноническую Project-запись в `projectStructureData`;
2. вызывает существующую смену active entity;
3. обновляет dashboard header/events/metrics;
4. передает новый context в `SCenterDigitalChessboardSummary`, `SCenterDigitalChessboard` и `SCenterObjects`;
5. оставляет пользователя на поверхности `Сводка`;
6. сообщает ошибку без смены контекста, если Project не найден.

## Header Dropdown Contract

Trigger `#nav-digital-chessboard` сохраняет постоянный label `Цифровая шахматка` и существующие `aria-haspopup`, `aria-expanded`, `aria-controls`.

Dropdown:

- содержит ровно три дочерних пункта в порядке `Сводка`, `Шахматка`, `Объекты`;
- `Сводка` использует `data-main-view="digital-chessboard-summary"`;
- активный item получает `aria-current="page"`, `is-active` и check-индикацию;
- trigger активен для любой из трех дочерних поверхностей;
- на dashboard trigger не активен;
- ширина меню и сетка иконка/label/check не меняются без visual QA.

Keyboard/focus contract сохраняется и расширяется на три пункта:

- click/`Enter`/`Space` на trigger только открывают или закрывают меню;
- `ArrowDown` открывает меню и фокусирует активный или первый пункт;
- `ArrowUp` открывает меню и фокусирует последний пункт;
- внутри работают `ArrowUp/Down`, `Home`, `End`, `Enter`, `Space`;
- `Escape` закрывает меню и возвращает focus trigger;
- `Tab` и outside-click закрывают меню;
- после выбора focus возвращается trigger;
- скрытый пункт не сохраняет DOM-focus.

## UI And Functional Parity

### Верхняя область

- project selector и кнопки `Архив`/`Печать` без общей карточечной подложки;
- метафора проекта и KPI-иконки сохраняют контракт `40×40px / radius 8px / icon 25px`;
- шесть KPI остаются самостоятельными карточками с gap `8px`, value `28px` и выравниванием значения по левому краю label;
- toolbar, archive banner и KPI входят в единый непрозрачный sticky-shell;
- sticky-shell имеет собственный нижний padding, под который уходит прокручиваемый контент;
- dropdown проекта и tooltip не обрезаются sticky/root overflow.

### Аналитические карточки

- `Динамика за неделю` и `Требуют внимания` стоят горизонтально с gap `16px` и одинаковой высотой `306px`;
- на узкой ширине переходят в одну колонку;
- header и action-footer фиксированы внутри карточки;
- списки имеют собственный scroll и общий scrollbar contract;
- weekly tag `24px / radius 16px` показывает signed delta и tooltip;
- weekly rows не кликабельны, attention rows кликабельны и имеют плавный hover;
- ellipsis сопровождается доступным полным текстом;
- footer-кнопки занимают доступную ширину;
- object filter не смешивает данные разных проектов.

### Таблица объектов

- semantic `table`, `caption`, `thead`, `tbody`, `tfoot`;
- header `42px`, data row `51px`, пустой footer `51px` без border/padding;
- minimum column widths исключают перенос названий целевых колонок;
- значения выровнены по левому краю header;
- progress, signed weekly delta, risk circles `16×16px`, count и priority star сохраняются;
- `Открыть` слева, kebab справа;
- disclosure, hover, sticky columns/header, local overflow и scroll indicators работают;
- table error/retry и empty state не ломают геометрию;
- общий construction-table слой не меняет внешний вид и поведение действующего раздела `Объекты`.

### Overlays, archive and print

- object/issue/report drawers открываются поверх общего header по согласованной z-index шкале;
- focus trap, `Escape`, backdrop и focus return обязательны;
- archive read-only, snapshot mode визуально отделен от актуальных данных и имеет явный выход;
- archive empty/error/retry состояния сохраняются;
- print preview показывает project/period/KPI/table без interactive chrome;
- `window.print()` вызывается только из явной кнопки пользователя;
- при hide/смене main-view все overlay сводки закрываются и document listeners очищаются.

## State Policy

Локально в feature хранятся только presentation state:

- выбранный object filter для attention;
- раскрытые строки таблицы;
- row menu;
- archive snapshot mode;
- открытый overlay и focus return target;
- локальные loading/error/retry состояния;
- scroll positions и короткий live announcement.

При смене `projectId` сбрасываются object filter, expanded rows, row menu, archive mode, локальные errors и scroll. При смене очереди внутри одного проекта безопасное локальное состояние может сохраняться, если view-model не меняет набор объектов. При hide закрываются overlays/popovers/menus, но проектные данные и безопасный scroll не сбрасываются.

## Scope

- новый data/feature/shared-table слой и README;
- новый root и явный порядок CSS/script подключений в `index.html`;
- новый пункт `Сводка` в dropdown;
- четырехэкранный controller и project selector bridge;
- перенос функциональной parity стенда;
- regression dashboard, шахматки и `Объектов`;
- static/data/browser/accessibility/visual QA;
- обновление связанной документации после фактической реализации;
- отдельный post-acceptance cleanup стенда.

## Out Of Scope

- React/Vite/Sites миграция;
- рефакторинг всего `src/app/app.js` или переход на router/modules;
- изменение бизнес-логики dashboard, событий, задач, BI, AI и чата;
- чтение или возврат `legacy/isolated/`;
- промышленная методика или реальные API;
- неоговоренное объединение готовности/рисков разных feature;
- удаление локального стенда в одном коммите с первым переносом;
- изменение действующих `window.SCenterDigitalChessboard`/`window.SCenterObjects` без отдельной необходимости и документации.

## Migration Steps

### 0. Freeze и baseline

- зафиксировать текущий stand README, tests и визуальные артефакты;
- выполнить syntax/tests стенда;
- пройти baseline dashboard/шахматки/`Объектов` и сохранить контрольные screenshots;
- проверить текущий dropdown мышью и клавиатурой;
- составить parity-чеклист всех stand actions/states.

Gate: миграция не начинается при падающем baseline, неразрешенном конфликте файлов или незафиксированной функциональности стенда.

### 1. Data reconciliation

- создать `digital-chessboard-summary-data.js`;
- заменить stand project ids на canonical `projectId`;
- использовать `constructionObjectsData` для identity;
- адаптировать KPI/weekly/attention/archive как summary-specific demo view-model;
- реализовать project/queue/BU/unknown semantics и `validate()`;
- покрыть data invariants тестами.

Gate: data-layer не зависит от DOM, не мутирует входной context и не возвращает stale project data.

### 2. Shared construction-table contract

- выделить только устойчивые table-shell/geometry/scroll primitives из `Объекты`;
- перевести `Объекты` на shared primitives без изменения markup semantics, данных и визуального результата;
- запустить полную regression `Объекты`;
- только после этого подключить primitives к таблице сводки.

Gate: diff screenshots/geometry и browser scenarios `Объекты` не показывают регрессии.

### 3. Native summary feature

- перенести разметку, state и event delegation из стенда в IIFE feature;
- заменить document-global listeners на root-scoped lifecycle с cleanup;
- реализовать `mount/setContext/show/hide/closeOverlays/destroy`;
- подключить data API и callbacks app bridge;
- сохранить CSS namespace и убрать stand-only page/reset styles.

Gate: feature можно смонтировать в тестовый root повторно без дублирования listeners и stale state.

### 4. App shell и dropdown

- добавить `#digital-chessboard-summary-view` и root;
- подключить data → shared component → feature → app в явном порядке;
- расширить controller до четырех views;
- добавить `Сводка` первым menuitem;
- расширить roving/keyboard navigation на три пункта;
- подключить project selector к app-owned context bridge.

Gate: все четыре поверхности доступны программно, mouse/keyboard menu работает, активный пункт и trigger синхронизированы.

### 5. Overlay, archive, print and cross-view coordination

- встроить drawers/modal в общую z-index/focus модель;
- закрывать конфликтующие панели при входе в строительный раздел;
- закрывать summary overlays при hide;
- проверить archive states и print preview/print stylesheet;
- оставить неподтвержденный cross-feature action явно неактивным или информационным.

Gate: нет двойных overlay, утечки scroll lock, потерянного focus или действий над скрытой поверхностью.

### 6. State, responsive and accessibility parity

- перенести ready/loading/empty/error/retry/archive/print states;
- проверить sticky-shell в реальном scroll-контейнере приложения;
- проверить desktop/medium/narrow layouts;
- проверить keyboard paths, focus-visible, reduced-motion, tooltip и live regions;
- проверить отсутствие page-level overflow.

### 7. Regression and product QA

- syntax и unit/data tests;
- dropdown/controller/context regression;
- полная functional parity сводки;
- regression шахматки и `Объектов`;
- overlay/AI/chat/task/BI conflict smoke tests;
- визуальное сравнение интегрированного feature со стендом и каноническим референсом;
- минимум три повторных цикла `dashboard → Сводка → Шахматка → Объекты → dashboard`.

### 8. Documentation synchronization

После фактической интеграции обновить:

- `src/features/digital-chessboard-summary/README.md`;
- `src/components/construction-table/README.md`;
- `src/data/README.md`;
- `src/app/README.md`;
- `src/features/objects/README.md`, если выделен shared table contract;
- `docs/component-map.md`;
- `docs/component-impact-map.md`;
- `docs/component-states.md`;
- `docs/context-behavior.md`;
- `docs/app-decomposition-map.md`;
- `docs/entity-model.md`;
- `docs/system-compliance-matrix.md`;
- `docs/plans/system-scaling-roadmap.md`;
- этот план и план стенда — фактическим статусом выполнения.

До реализации карты и compliance matrix не должны утверждать, что `Сводка` уже активна.

### 9. Post-acceptance cleanup

Удаление `digital-chessboard-summary-stand/` выполняется отдельным подтвержденным этапом только когда:

- parity checklist закрыт;
- интегрированная версия принята пользователем;
- browser/visual regression пройдена;
- основной runtime не импортирует файлы стенда;
- канонический reference и важные QA-материалы сохранены в `docs/reference/digital-chessboard-summary/`;
- README/планы/карты больше не ведут на удаляемый runtime;
- удаление оформляется отдельным diff, чтобы его можно было проверить и откатить независимо.

## Documentation Status At Planning Stage

На текущем этапе изменяются только planning/reference-документы и README стенда:

- создан настоящий integration plan;
- запись стенда переводится из неопределенного `в работе` в `готов к миграции, сохраняется до приемки`;
- roadmap получает отдельный будущий этап `3.5. Сводка цифровой шахматки`;
- README стенда и каталог референса получают ссылку на migration/cleanup gate;
- `component-map`, `component-impact-map`, `component-states`, `system-compliance-matrix` и feature README остаются описанием текущего runtime и будут обновлены только после фактической интеграции.

## Acceptance Criteria

### Navigation and lifecycle

- dropdown содержит `Сводка`, `Шахматка`, `Объекты` и сохраняет полный mouse/keyboard contract;
- controller принимает только четыре документированных view ids;
- поверхности монтируются один раз и сохраняют независимые состояния;
- active-state/`aria-current` корректны;
- неизвестный view id отклоняется безопасно.

### Context and data

- project selector использует canonical Project и меняет общий `activeContext`;
- summary не содержит параллельный каталог stand-only проектов;
- project/queue/BU/unknown states не смешивают данные;
- object identity берется из `constructionObjectsData`;
- demo KPI/risk/weekly явно остаются feature-specific;
- data invariants проходят автоматические тесты.

### UI and functionality

- все подтвержденные компоненты и состояния стенда доступны в основном прототипе;
- sticky-shell, KPI, analytics cards и table сохраняют принятую геометрию;
- archive, print, filters, disclosure, menus, drawers и retry работают;
- таблица стилистически синхронизирована с `Объекты`, а сам раздел `Объекты` не изменился визуально;
- unsupported/empty/error/loading states доступны и устойчивы.

### Accessibility and cleanup

- keyboard/focus/Escape/return-focus работают во всех popover/menu/drawer/modal;
- скрытие feature очищает overlays, timers и document listeners;
- reduced-motion и narrow layout не теряют действия;
- console errors/warnings отсутствуют;
- локальный стенд удаляется только после отдельного подтверждения, переноса актуальных сведений и повторной регрессии; условие выполнено 27.07.2026.

### Documentation

- current/future модель разделена;
- все новые `window.*`, data и lifecycle contracts документированы;
- component map, impact map, states, context behavior и compliance matrix синхронизированы после реализации;
- roadmap отмечает demo-интеграцию и отдельно сохраняет реальные источники/методику/права как будущий этап.

## Verification Matrix

### Static

- `node --check` для нового data, shared component, feature и измененного `src/app/app.js`;
- проверка порядка `<link>`/`<script>` и существования всех путей из `index.html`;
- отсутствие React/Vite/import/iframe зависимостей;
- поиск неразрешенных stand-only ids и глобальных `dcs-` selectors вне root scope.

### Automated data/component tests

- canonical project/queue/BU/unknown resolution;
- стабильность/clone semantics/validation;
- уникальность object/attention/archive ids;
- проценты `0..100`, допустимые tones/statuses;
- общий table footer/row/header geometry contract;
- отсутствие регрессии существующих `objects-data.test.mjs` и связанных тестов.

### Browser scenarios

- dashboard → dropdown → `Сводка`;
- navigation по меню mouse/keyboard;
- project switch и propagation во все surfaces;
- queue того же проекта, другой project, business unit, возврат;
- weekly/attention scroll, tooltip, filter и drawers;
- table disclosure, object drawer, row menu, copy announcement;
- table/attention retry;
- archive ready/empty/error/snapshot/exit;
- print preview, cancel и print invocation;
- four-view state preservation;
- conflict smoke с event drawer, task draft, filter, AI, chat и BI;
- desktop/medium/narrow и отсутствие page overflow.

### Visual

- сравнить с последним принятым состоянием локального стенда, а не только с первоначальным source-reference;
- отдельно проверить header boundary: глобальный header основного прототипа сохраняется, stand header/sidebar не переносятся;
- проверить sticky-shell во время реальной вертикальной прокрутки;
- проверить shared table against активного `Объекты` до и после выделения primitives;
- закрыть все P0–P2 visual defects до продуктовой приемки.

## Risks And Mitigations

| Риск | Мера |
| --- | --- |
| Дублирование Project между стендом и системой | Canonical project bridge; stand ids не переносятся. |
| Расхождение readiness/risk между feature | Общая identity отдельно, summary view-model отдельно; не объявлять demo-поля едиными сущностями. |
| Регрессия таблицы `Объекты` при переиспользовании | Двухступенчатое выделение shared primitives с baseline gate до подключения сводки. |
| Sticky-shell перекрывает или обрезает контент | Собственный scroll-container, `top: 0`, явный bottom padding и browser scroll QA. |
| Конфликт overlay/z-index/focus | App-owned coordination, единая шкала слоев, `closeOverlays()` и focus-return tests. |
| Утечки global listeners после переноса stand IIFE | Root-scoped delegation и обязательный cleanup в `hide/destroy`. |
| Несогласованный action `Открыть в шахматке` | Не имитировать готовый переход; оставить информационным до отдельного API-решения. |
| Преждевременное удаление стенда | Отдельный post-acceptance gate и отдельный diff удаления. |
| Документы объявят будущую функцию текущей | До implementation acceptance менять только plan/roadmap; current maps обновлять постфактум. |

## Execution Roles And Moderation

Для будущего выполнения достаточно основного агента и до двух узких read-only аудитов, если пользователь разрешит субагентов на этапе реализации:

- `table-regression-audit` — проверяет только извлечение shared table contract и раздел `Объекты`;
- `integration-qa-audit` — проверяет только dropdown/controller/context/overlay и parity стенда.

Ограничения для обоих: не принимать архитектурные решения, не менять `legacy/isolated/`, не редактировать один файл параллельно с основным агентом, не объявлять demo-данные промышленными. Основной агент единолично объединяет изменения, сопоставляет их с impact map/compliance matrix и отвечает за итоговую приемку.

## Approval Gate

Этот документ разрешает последующее выполнение только после явной команды пользователя начать миграцию. До такой команды не меняются `index.html`, `src/app`, `src/data`, активные features и публичные `window.*`; локальный стенд сохраняется без удаления.

## Результат выполнения 27.07.2026

План выполнен после явной команды пользователя:

- в dropdown добавлен первый пункт `Сводка` с `data-main-view="digital-chessboard-summary"`;
- `src/app/app.js` управляет четырьмя смонтированными поверхностями и передает canonical `window.activeContext` в `window.SCenterDigitalChessboardSummary`;
- создан `window.digitalChessboardSummaryData` с project/queue/BU semantics и явной границей demo-методики;
- создан нативный lifecycle `window.SCenterDigitalChessboardSummary` с project selector bridge, KPI, weekly/attention, таблицей, архивом, печатью, detail-drawer и состояниями ошибок/пустых данных;
- выделен `src/components/construction-table/`; раздел `Объекты` и `Сводка` используют общий shell/scroll contract без объединения feature-specific колонок и данных;
- статические, data-, browser- и design-QA результаты зафиксированы в `docs/evidence/digital-chessboard-summary/README.md`;
- после отдельной приемки выполнена сокращенная документальная миграция: актуальный UI/UX-контракт, границы demo-данных, осознанные отличия и ключевые QA-референсы сохранены в основной документации; временный локальный стенд удален после повторной функциональной и визуальной проверки.
