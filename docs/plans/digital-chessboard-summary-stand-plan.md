# План: изолированный стенд «Сводка цифровой шахматки»

Статус: выполнен и принят; функциональность интегрирована в основной прототип, актуальный документальный и QA-контекст сохранен, временный стенд удален 27.07.2026. Итоговая design-to-implementation приемка имеет статус `passed` в корневом `design-qa.md`.

Документ подчиняется `docs/plans/README.md`. Задача относится к сложным: создается новый интерактивный desktop/web-стенд, используются субагенты, переиспользуется табличный контракт действующего feature и моделируется новый пользовательский путь со множеством состояний.

## Goal

Создать в корне проекта самостоятельный нативный HTML/CSS/JavaScript-стенд `digital-chessboard-summary-stand/`, который воспроизводит рабочую область предоставленного референса: выбор проекта, действия `Архив` и `Печать`, KPI проекта, недельную динамику, список проблем и таблицу объектов строительства.

Стенд нужен для продуктовой и визуальной приемки до будущей интеграции. Он не является частью текущего runtime S.Center и не меняет активную «Цифровую шахматку».

## Visual Source And Boundary

- канонический источник: `docs/reference/digital-chessboard-summary/source-reference.png`;
- глобальный header, профиль пользователя, левый sidebar и их резервированная геометрия не воспроизводятся;
- стенд начинается с панели проекта и занимает всю собственную рабочую область;
- иерархия референса сохраняется: project toolbar → KPI → analytics row → objects table;
- основная визуальная сверка выполняется на desktop-ширине рабочей области около `1620px` с дополнительной проверкой адаптива.

## Current Implementation And Reuse Decision

Таблица активного раздела `Объекты` находится внутри `src/features/objects/objects.js` и стилизована через `#objects-root` в `src/features/objects/objects.css`. Она не является независимым импортируемым компонентом, а ее runtime связан с classic-script/IIFE и `window.*`.

Поэтому стенд:

- переиспользует семантику, размеры, sticky/overflow-поведение, disclosure, progress, risk/status, focus и empty-state принятой таблицы;
- переносит нужные primitives в нативные table render-функции с единым UI-state и делегированием DOM-событий;
- не импортирует `objects.js`, `objects.css` и активные `window.*` интерфейсы;
- хранит новые поля `weeklyDeltaPercent`, `risk` и `lastUpdatedAt` в собственном demo view-model;
- не объявляет demo-расчеты промышленной методикой и не объединяет feature-specific геометрию существующих экранов.

## Scope

- переключение между несколькими demo-проектами с атомарным обновлением зависимых блоков;
- skeleton при смене проекта и сохранение стабильной геометрии;
- шесть KPI в самостоятельных горизонтальных карточках с gap `8px`, семантическими состояниями и цветными иконками на подложках, геометрически синхронизированных с иконкой project selector (`40×40px / 8px / icon 25px`);
- project selector, действия `Архив`/`Печать`, архивный banner и KPI образуют единый непрозрачный sticky-shell с `top: 0`; shell содержит адаптивный верхний padding и нижний внутренний отступ, под который при прокрутке уходят weekly dynamics и attention;
- недельная динамика и список проблем с object filter в двух самостоятельных карточках над таблицей: равные колонки, gap `16px`, одинаковая фиксированная высота `306px`, фиксированные header/action-footer и внутренний вертикальный scroll без accordion и drag-resize;
- нативная таблица объектов с раскрытием строки, прогрессом, недельной динамикой, рисками, датой обновления и действиями;
- detail drawer объекта и проблемы с возвратом фокуса;
- архивный read-only drawer со снимками и явным режимом архива;
- print preview и print CSS без управляющего chrome;
- ready, hover, focus, open/expanded, loading, empty, local error/retry, archive и print states;
- keyboard navigation, `Escape`, focus-visible, responsive и reduced-motion;
- локальный README и обязательный `design-qa.md` со статусом `passed` перед передачей.

## Out Of Scope

- изменение `index.html`, `src/app/`, `src/data/`, публичных `window.*` и активных features;
- добавление нового main-view в действующий controller;
- реальные API, persistence, роли, права и промышленная методика KPI/рисков;
- восстановление, удаление или редактирование архивных снимков;
- извлечение общего table-компонента из активного feature;
- будущая интеграция стенда в S.Center без отдельного плана и команды пользователя.

## Stand Data Contract

```ts
type ProjectOverview = {
  id: string;
  name: string;
  status: 'ready' | 'empty' | 'partial-error';
  kpis: ProjectKpi[];
  weeklySummary: WeeklySummary | null;
  attentionItems: AttentionItem[];
  objects: ObjectOverviewRow[];
};

type ObjectOverviewRow = {
  id: string;
  name: string;
  typeLabel: string;
  readinessPercent: number;
  weeklyDeltaPercent: number;
  risk: { count: number; tone: 'none' | 'warning' | 'critical'; flagged?: boolean };
  lastUpdatedAt: string;
  expandable?: boolean;
};
```

UI-состояния dropdown, expanded rows, drawers, menus, loading и toast не входят в сущности и хранятся в едином stand-local JavaScript state.

## Subagents

В работе используются три субагента с одинаковым базовым уровнем модели и полным релевантным контекстом задачи. Они не получают права на самостоятельные архитектурные решения или неограниченное редактирование проекта.

| Субагент | Цель | Параметры первого прохода | Ограничения | Роль после реализации |
| --- | --- | --- | --- | --- |
| `table_reuse_audit` | Найти точный контракт таблицы `Объекты` и безопасную границу переиспользования. | Read-only аудит `src/features/objects/`, связанных данных и документации; без `legacy/isolated/`. | Не менять код, не извлекать общий компонент, не менять `window.*`, не переносить demo-модель как промышленную. | Проверить нативные render-функции, семантику таблицы, disclosure, overflow и совпадение с действующим паттерном. |
| `reference_state_audit` | Разложить референс на секции, токены, интеракции и состояния. | Read-only анализ исходного изображения; header/sidebar исключены. | Не генерировать альтернативный дизайн, не добавлять неподтвержденные destructive-сценарии, не редактировать файлы. | Проверить browser screenshot относительно референса и дать только P0–P2 замечания. |
| `architecture_docs_audit` | Удержать границу между стендом и активной системой и определить документационное влияние. | Read-only аудит планов, карт и README без `legacy/isolated/`. | Не менять active `src/`, карты/матрицу и roadmap на этапе стенда; не принимать решение об интеграции. | Проверить итоговый план, README стенда и отсутствие смешения с текущей моделью. |

## Moderation And Merge Rules

Основной агент:

1. Сопоставляет выводы агентов с `docs/component-impact-map.md` и `docs/system-compliance-matrix.md`, но не изменяет их для изолированного стенда.
2. Разрешает конфликты в порядке источников истины: явная команда пользователя → приложенный референс → правила проекта → активный UI-контракт таблицы → предложения субагентов.
3. Не допускает одновременного редактирования одного файла несколькими агентами: основной агент единолично вносит изменения, субагенты выполняют аудит и последующую приемку.
4. Проверяет каждый результат на разделение current/future, отсутствие чтения `legacy/isolated/` и отсутствие изменений активного runtime.
5. Возвращает замечания соответствующему субагенту только как ограниченный повторный аудит; итоговые решения и исправления остаются за основным агентом.
6. Передает стенд только после syntax/test/browser/design QA и закрытия всех P0–P2 замечаний.

## Implementation Steps

1. Сохранить канонический референс и его границы.
2. Инициализировать `digital-chessboard-summary-stand/` как изолированный нативный HTML/CSS/JavaScript runtime без framework и bundler.
3. Создать stand-specific fixtures и адаптеры для проектов, KPI, проблем, архива и строк объектов.
4. Реализовать нативные table render-primitives на основе действующего контракта `Объекты`.
5. Собрать default desktop-композицию по референсу.
6. Реализовать project switching, loading, empty, local error/retry и object/issue states.
7. Реализовать архивный read-only drawer, object/issue detail и print preview/print CSS.
8. Добавить keyboard/focus, responsive и reduced-motion.
9. Запустить syntax/tests и браузерную проверку основных сценариев.
10. Провести итерационный Design QA по каноническому референсу до `final result: passed`.
11. Выполнить три повторных субагентских аудита и устранить P0–P2 замечания.

## Acceptance Criteria

- в стенде отсутствуют глобальные header/sidebar/profile и декоративные заглушки для них;
- структура, плотность, типографика, цвета, границы и пропорции рабочей области соответствуют референсу;
- project selector, `Архив`, `Печать`, KPI, weekly dynamics, attention и objects table работают;
- weekly dynamics и attention расположены над таблицей по горизонтали с gap `16px`, имеют одинаковую фиксированную высоту `306px`, закреплённые header и action-footer с рабочими кнопками, прокручиваемые списки и не содержат accordion/resize-поведения;
- смена проекта не смешивает данные разных проектов и показывает стабильный skeleton;
- таблица следует действующему контракту `Объекты`: semantic table, disclosure, progress, risk/status, hover/focus, sticky header, local overflow и empty/loading/error states;
- строка раскрывается, `Открыть` показывает detail drawer, kebab имеет безопасное меню без destructive-действий;
- архив read-only и визуально отделен от актуальных данных;
- print preview исключает интерактивный chrome и сохраняет различимость статусов;
- все основные действия доступны мышью и клавиатурой, overlays закрываются по `Escape` и возвращают фокус;
- desktop, medium и narrow layouts не перекрывают постоянные действия;
- активные `index.html`, `src/`, `window.*`, component maps, compliance matrix и roadmap не изменены;
- итоговая приемка перенесена в корневой `design-qa.md` и содержит `final result: passed`.

## Documentation Updates

- создан README изолированного стенда с границами, сценариями и командами проверки;
- сохранен канонический визуальный источник и описана исключенная shell-область;
- запись о стенде добавлена в `docs/plans/README.md`;
- активные `component-map`, `component-impact-map`, `system-compliance-matrix`, roadmap и feature README не изменяются до отдельной команды интеграции;
- результат итоговой визуальной приемки хранится в корневом `design-qa.md`; канонические референсы — в `docs/reference/digital-chessboard-summary/`, нормализованные сравнения — в `qa/digital-chessboard-summary/`.

## Verification

- `node --check src/data.js` и `node --check src/app.js` — синтаксис нативных classic scripts;
- `node --test tests/native-stand.test.mjs` — структура, стабильные идентификаторы fixtures и query-сценарии;
- build, package manager и Sites-артефакты отсутствуют как ненужные для нативного runtime;
- локальный HTTP endpoint `http://127.0.0.1:4173/` отвечает `200`;
- во встроенном браузере проверены project switching, local retry, object drawer, archive snapshot и print preview; console errors отсутствуют;
- повторные read-only аудиты трех субагентов выполнены, их P1-замечания по таблице, focus и package contract модерированы основным агентом;
- исторический tiled browser-capture заменен нормализованными сравнениями в `qa/digital-chessboard-summary/`; итоговый статус интеграции — `passed`.

## Future Integration Gate

Интеграционный контракт зафиксирован в `digital-chessboard-summary-integration-plan.md`: поверхность открывается пунктом `Сводка` в dropdown `Цифровая шахматка`, использует canonical Project/ConstructionObject, отдельные demo KPI/Risk, lifecycle соседних feature и общий табличный UI/scroll contract с regression раздела `Объекты`. Gate удаления выполнен после фактического переноса, browser/visual QA, сокращенной документальной миграции и отдельной команды пользователя.

## Статус после миграции 27.07.2026

Фактический перенос выполнен: активная `Сводка` подключена к dropdown, canonical context, нативному data/feature-слою и общему construction-table contract. После отдельной приемки актуальный UI/UX-, data- и QA-контекст перенесен в feature-документацию и `docs/reference/digital-chessboard-summary/`, а временный каталог стенда удален. Этот документ остается историей выполненного этапа; команды и пути стенда больше не являются активными контрактами.
