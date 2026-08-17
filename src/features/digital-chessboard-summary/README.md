# Feature «Сводка» цифровой шахматки

## Назначение

Нативный classic-script/IIFE feature проектной сводки. Пользователь открывает его пунктом `Сводка` в dropdown `Цифровая шахматка`, меняет канонический проектный контекст и работает с KPI, недельной динамикой, проблемами и объектами строительства.

## Подключение

Порядок в `index.html`: `construction-objects-data.js` → `objects-data.js` → `digital-chessboard-summary-data.js` → `construction-table` → feature → `src/app/app.js`.

Root: `#digital-chessboard-summary-root`. Все feature-стили ограничены root и префиксом `dcs-`.

## Публичный lifecycle

`window.SCenterDigitalChessboardSummary` предоставляет:

- `mount(root, { context, getSelectableProjects, onProjectSelect })`;
- `setContext(context)`;
- `show()`;
- `hide()`;
- `closeOverlays()`;
- `destroy()`.

Project selector не создает собственный каталог Project: доступные проекты поступают через app-owned `getSelectableProjects`, а смена выполняется через `onProjectSelect` и общий `window.setActiveEntity`.

## Данные и состояния

`window.digitalChessboardSummaryData.getForContext(context)` использует canonical Project/Queue context, identity объектов из `constructionObjectsData` и готовность объектов из project-view-model `objectsData`. KPI, weekly, attention, risks и архив остаются детерминированными demo-представлениями сводки.

Поддержаны `ready`, `loading`, `empty`, `table-error/retry`, `attention-error/retry`, `unsupported-context`, `archive ready/empty/error/snapshot`, drawers и print preview. Для browser QA состояния доступны через `?summaryScenario=`.

## UX-контракт текущей реализации

- в верхней левой части рабочей области раздела всегда отображается локальный заголовок `Сводка` размером `24px / 600`; он не заменяет общий header и остается частью feature-поверхности при обычном и unsupported-состоянии;
- карточка выбора проекта в toolbar использует локально очищенный subtitle: слова `Москва` и `Премиум` не выводятся в trigger и option-строках, при этом исходные `headerAttributes` проекта в общем слое данных не изменяются;
- toolbar и шесть KPI-карточек образуют непрозрачный внутренний sticky-shell с нижним отступом `12px`; toolbar не имеет общей подложки, а карточка проекта, `Архив` и `Печать` остаются самостоятельными контролами;
- KPI представлены отдельными карточками с gap `8px`: в верхней строке icon-tile `40×40px` и значение `28px / 500`, ниже по левой оси значения — название параметра; внутренний gap `4px`; цвет icon-tile является семантической индикацией, а не дополнительной метрикой;
- аналитические карточки расположены горизонтально с gap `16px`, имеют одинаковую высоту `306px`, header `60px`, footer `58px` и внутренний вертикальный scroll без видимой native-полосы; при ширине до `980px` карточки переходят в одну колонку;
- недельный delta-tag имеет высоту `24px`, radius `16px` и tooltip; строки weekly/attention имеют высоту `39px`, текст `14px / 500 / 18px`, ellipsis и полный текст через `title`; weekly-маркер — `10×10px`, attention-hover — `200ms` без сдвига содержимого;
- таблица использует общий `construction-table` contract и feature-specific колонки: содержательные колонки выровнены влево и не переносятся, служебная disclosure-колонка центрирована; disclosure и menu-кнопки имеют размер `28px`, progress-track — `6px`, risk-индикатор — `16×16px`, `Открыть` и menu разнесены по краям ячейки действий;
- semantic `tfoot` завершает таблицу одной пустой строкой `51px` без border и padding;
- overlays закрываются при hide, удерживают и возвращают focus;
- выбранный project сбрасывает локальные filters/expanded/menu/archive/scroll, но соседние main-view не перемонтируются;
- действие `Открыть в шахматке` остается информационным до отдельного согласования программного выбора объекта.

Desktop-референс не задает глобальный header, sidebar и профиль пользователя: в интегрированном экране они принадлежат общей оболочке S.Center. Canonical demo-значения и название проекта могут отличаться от сохраненных изображений, поскольку feature не переносит локальный каталог проектов стенда.

## Будущая модель

Реальные источники KPI и рисков, утвержденная методика агрегации, серверный архив, права, persistence и рабочие cross-feature переходы не входят в текущую demo-сводку и реализуются отдельным этапом.

## Acceptance

- syntax нового data/feature/shared component;
- data test project/queue/BU/clone semantics;
- dropdown mouse/keyboard и четыре main-view;
- project switch и propagation общего context;
- weekly/attention/table/archive/print/drawers/retries;
- `Escape`, focus trap/return, reduced-motion;
- отсутствие регрессии раздела `Объекты`.
