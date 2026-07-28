# Design QA: интеграция «Цифровой шахматки»

Статус: `passed`

Дата: 26.07.2026.

## Источники сравнения

- канонический референс согласованного решения: `docs/reference/digital-chessboard/object-cards-and-metrics.png`;
- интегрированный экран: `design-audit/digital-chessboard-integration/01-integrated-prototype-cropped.png`;
- единый comparison view: `design-audit/digital-chessboard-integration/comparison.html`.

## Результат

Визуальный контракт экспериментального решения сохранен внутри дизайн-системы активного прототипа:

- пять карточек объектов расположены непосредственно на фоне без общей подложки;
- карточки сохраняют тип объекта, структуру, круговую готовность, отклонение, hover/focus и single-selection;
- сводная строка содержит только план, отклонение и время обновления, а календарь расположен перед `Факт` / `Факт / план` и primary-кнопкой сравнения;
- рабочая карточка сохраняет самостоятельные блоки наименования, атрибутов и закрытия;
- таблица содержит белые header/первую колонку, внутренние отступы ячеек `2px`, 34 возрастающих этажа, 16 секций и полный набор статусных цветов;
- sticky-title, sticky-первая колонка, фиксированная легенда и overlay-индикаторы скролла не меняют геометрию таблицы;
- общий header, профиль пользователя и его текущие токены сохранены намеренно: это интеграционная адаптация, а не перенос header стенда.

## Функциональная проверка

- переход dashboard → шахматка → dashboard работает без reload и сохраняет состояние обоих экранов;
- выбор объекта обновляет данные;
- карточки объектов поддерживают roving `tabindex`, стрелки, `Home` и `End` без геометрического сдвига на hover;
- single-picker показывает 27 работ, при открытии не имеет выбранного radio и блокирует подтверждение до выбора;
- comparison-picker начинает с пустого второго слота, запрещает дубликат и применяет две работы с gap `8px`;
- календарь показывает два месяца, пресеты, preview диапазона и draft/apply/cancel, закрывается по `Escape` и клику вне popover;
- модальные окна удерживают фокус и возвращают его на исходный trigger;
- тонкие overlay-индикаторы поддерживают перетаскивание, а обе оси сравниваемых матриц остаются синхронизированными;
- `Факт / план`, закрытие работы, empty-state и повторный выбор работают;
- в жилом доме отображаются 34 этажа и 16 секций;
- отсутствуют ошибки консоли;
- синтаксис всех затронутых JS-файлов и валидатор demo-данных проходят без ошибок.

## Допустимые расхождения

- тексты бренда и остальных пунктов header соответствуют действующему прототипу, а не бывшему экспериментальному решению;
- demo-проценты детерминированно зависят от `projectId`, поэтому могут отличаться от сохраненного референса;
- итоговая ширина контента подстраивается под доступную область действующего приложения.

---

# Design QA: интеграция «Сводки» цифровой шахматки

Дата: 27.07.2026.

## Артефакты и нормализация

- source visual truth: `docs/reference/digital-chessboard-summary/`, browser-capture бывшего стенда `qa/digital-chessboard-summary/source-stand.png`;
- implementation: `http://127.0.0.1:4174/`, пункт `Цифровая шахматка → Сводка`, browser-capture `qa/digital-chessboard-summary/implementation-main.png`;
- исходные browser PNG: `2851×1603 px`; CSS viewport обеих страниц: `1910×1074 px`; `window.devicePixelRatio = 0.8375000357627869`;
- in-app browser сохранил 2×2 повтор viewport внутри PNG; для честного сравнения взят верхний левый viewport-квадрант. У интеграции дополнительно удалены `48 px` растровой высоты глобального header, поскольку стенд его намеренно не содержит;
- нормализованные области: `1426×754 px` для source и implementation;
- state: default project-ready, desktop, light theme; различие названия проекта и числовых demo-значений ожидаемо из-за перехода на canonical `window.activeContext` и `window.digitalChessboardSummaryData`;
- full-view comparison: `qa/digital-chessboard-summary/comparison-stand-vs-integrated-vertical.png`;
- focused comparison toolbar/KPI/analytics: `qa/digital-chessboard-summary/comparison-focus-toolbar-kpi-analytics.png`;
- focused comparison table: `qa/digital-chessboard-summary/comparison-focus-table.png`;
- regression capture раздела `Объекты`: `qa/digital-chessboard-summary/objects-regression-normalized.png`.

## Findings

После второй итерации нет незакрытых P0/P1/P2.

- [P3] Иконки заголовков аналитических карточек используют нейтральный token активного прототипа, тогда как стенд применяет чуть более синий оттенок. Геометрия, размер, stroke-family Lucide и контраст сохранены; различие принято как адаптация к общей оболочке.
- После приемки пользователь изменил информационную иерархию KPI: icon-tile и крупное значение находятся в верхней строке, название параметра — ниже. Это осознанная корректировка основной реализации, а не расхождение миграции.
- Canonical demo-значения KPI, готовности, риска и счетчика проблем отличаются от стенда. Это не визуальная ошибка: интеграция не переносит stand-only каталог проектов и получает детерминированное представление из `src/data`.

Обязательные поверхности fidelity проверены:

- fonts/typography: системный font stack, размеры `14px` списков, `28px / 500` KPI, веса заголовков, ellipsis/title и nowrap колонок совпадают с принятым стендом;
- spacing/layout rhythm: sticky toolbar + KPI-shell, горизонтальный набор KPI с gap `8px`, равновысокие analytics-card с gap `16px`, фиксированные header/footer, локальный scroll и высота пустого table-footer сохранены;
- colors/tokens: семантические green/red/yellow/neutral состояния, белые поверхности, границы, progress и risk colors совпадают; глобальный фон и header принадлежат основному прототипу;
- image/assets: растровых продуктовых изображений в целевом блоке нет; все метафоры используют существующую Lucide-библиотеку, custom SVG/CSS-art/emoji не добавлены;
- copy/content: названия блоков, колонок, действий, tooltip и состояний сохранены; project label и числа приходят из canonical context/data layer.

## Comparison history

### Итерация 1 — blocked

- [P2] KPI-метафоры и цветовые подложки расходились со стендом; readiness-card не показывала недельную delta.
- [P2] attention/header metaphors и кнопка архива использовали другой набор пиктограмм.
- [P2] detail-drawer проблемы не возвращал фокус на исходную строку.
- [P2] `?summaryScenario=loading` сбрасывался при первом `setContext`.

Исправления: синхронизированы Lucide icons/tone tokens, KPI markup и `28px / 500` value; возвращена readiness delta; добавлены stable `data-focus-key` для проблем; loading-state устанавливается после начального context reset и завершается через `1600 ms`.

### Итерация 2 — passed

Post-fix evidence: три comparison PNG выше, browser-проверки default/loading/empty/table-error/attention-error/archive-empty/archive-error, project switch, row disclosure/menu, archive, print, detail drawers, Escape и focus-return. В консоли нет `error`/`warn`.

## Функциональная проверка

- три полных цикла `dashboard → Шахматка → Объекты → Сводка → dashboard` прошли без reload и ошибок консоли;
- dropdown содержит ровно `Сводка`, `Шахматка`, `Объекты` и открывается мышью;
- canonical project selector переключает проект и показывает промежуточное loading-state;
- weekly tooltip, object filter, internal scroll, раскрытие таблицы и row-menu работают;
- архив, snapshot list, пустой/error архив, печатная форма и detail-drawer открываются и закрываются;
- overlay закрываются по `Escape`; фокус возвращается на trigger, включая строку проблемы;
- shared construction-table contract не изменил визуальную структуру раздела `Объекты`;
- синтаксис затронутых JS, data-test, feature integration-test и objects regression-test проходят; результаты 14 тестов бывшего стенда сохранены как историческая приемка, но больше не входят в активный test contour.

## Остаточные ограничения

- tablet/mobile проверены по scoped media rules и отсутствию глобального overflow в реализации; отдельного мобильного visual target у стенда нет;
- реальная методика KPI/рисков, server archive, права, persistence и cross-feature `Открыть в шахматке` не входят в demo-миграцию;
- локальный стенд удален после сокращенного переноса принятого UI/UX-контракта, границ demo-данных, осознанных отличий и ключевых KPI-референсов в документацию основного прототипа.

final result: passed
