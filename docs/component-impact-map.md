# Карта взаимного влияния компонентов

## Назначение

Документ фиксирует, какие компоненты, сценарии и слои системы могут затрагивать друг друга при изменениях. Он нужен для случаев, когда правка одного элемента влияет не только на его внешний вид, но и на данные, пользовательский путь, состояния, расчеты или другие области интерфейса.

Эта карта дополняет:

- `docs/component-map.md` — где находится компонент и с какими данными он связан;
- `docs/system-compliance-matrix.md` — насколько элемент соответствует продуктовой модели;
- README компонентов и features — локальные паспорта конкретных элементов.

## Типы связности

| Тип связности | Что означает | Пример |
| --- | --- | --- |
| Низкая | Компонент в основном автономен, изменение обычно не затрагивает другие сценарии. | Локальная визуальная правка одной иконки без изменения данных и состояний. |
| Средняя | Компонент используется в нескольких местах или влияет на пользовательский путь. | Карточка события, тулбар событий, floating action bar. |
| Высокая | Компонент или feature работает с общими данными, состояниями или несколькими сценариями. | Фильтры, метрики, структура метрик, детальная карточка события. |
| Очень высокая | Слой связывает несколько областей интерфейса или является источником данных. | `src/data`, `src/app`. |

## Карта влияния

| Элемент | Тип связности | Что может затронуть изменение | Что проверить в интерфейсе | Обязательная документация | Риск |
| --- | --- | --- | --- | --- | --- |
| `src/data` | Очень высокая | Ленту событий, карточки, детальную карточку, задачи, справочник ответственных, фильтры, строительные показатели, финансовые метрики, структуру метрик, BI, шапку контекста. | Загрузка страницы, выбор бизнес-юнита/проекта/очереди, создание, редактирование и удаление задач, фильтры, карточки событий, правая панель, drawer метрик, BI. | `src/data/README.md`, `docs/entity-model.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`, при будущем требовании — `docs/plans/system-scaling-roadmap.md`. | Высокий |
| `src/app` | Очень высокая | Активный контекст, порядок рендера, глобальные `window.*`, шапку, ленту, drawer, задачи, модалки, метрики. | Все сценарии, которые завязаны на перерисовку: дерево, шапка, события, задачи, фильтры, метрики, AI, BI. | `src/app/README.md`, `docs/app-decomposition-map.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`. | Высокий |
| Левое дерево навигации | Высокая | Активный контекст, шапку, события, строительные и финансовые метрики, фильтры. | Выбор бизнес-юнита, проекта, очереди; раскрытие/сворачивание; сброс фильтров; пересчет данных. | `src/components/navigation-tree-item/README.md`, `docs/context-behavior.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`, `docs/access-control.md`. | Высокий |
| Шапка проекта / контекста | Средняя | Отображение активного контекста, атрибуты проекта, бизнес-юнита или очереди, визуальное подтверждение выбранного уровня. | Переключение дерева, отображение изображения, названия, стадии, БЮ, кластера, РП или руководителя бизнес-юнита. | `src/app/README.md`, `docs/context-behavior.md`, `docs/entity-model.md`, `docs/system-compliance-matrix.md`. | Средний |
| Тулбар событий | Средняя/высокая | Вкладки периода, режим `Метрики`, поиск, фильтры, AI-анализ, счетчики, состояние закрепленных. | `Сегодня`, `Все события`, `Закрепленные`, `Метрики`, поиск, открытие фильтра, запуск аналитики, контекстные действия режима метрик. | `src/components/event-toolbar/README.md`, `src/features/filters/README.md`, `src/features/analytics/README.md`, `src/app/README.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`. | Средний |
| Центральный дашборд метрик | Высокая | Активный проект, demo-данные сроков и бюджетов, тулбар, ассистента, режимы центральной области. | Переключение проектов, loading без старых данных, внутренние разделы, контрольные этапы, адаптив, возврат к событиям, бизнес-юнит и очередь. | `src/features/metrics-dashboard/README.md`, `src/data/README.md`, `src/app/README.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`, `docs/plans/metrics-dashboard-integration-plan.md`. | Высокий |
| Сводка цифровой шахматки | Высокая | Общий header/dropdown, canonical project context, summary data/view-model, sticky KPI-shell, недельную динамику, проблемы, архив, печать, detail-drawer и общий construction-table contract. | Переходы четырех поверхностей; project/queue/BU; project selector bridge; sticky-shell; internal scroll; фильтр проблем; архив/печать/detail; focus trap/return; shared table scroll; cleanup при hide. | `src/features/digital-chessboard-summary/README.md`, `src/components/construction-table/README.md`, `src/data/README.md`, `src/app/README.md`, `docs/reference/digital-chessboard-summary/README.md`, `docs/evidence/digital-chessboard-summary/README.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`. | Высокий |
| Цифровая шахматка | Высокая | Общий header/dropdown, active context, общий selector объектов, двухблочную карточку объекта, полноширинный экран, title рабочей зоны, demo-данные объектов/работ, календарь, модальные окна и состояния dashboard/Objects. | Переходы dashboard ↔ шахматка ↔ объекты, project/queue/business unit, общий selector и клавиатурная навигация, title `Готовность секций по этажам`, даты, выбор/закрытие работы, gap `4px` между сводкой/действиями и матрицей, focus trap, сравнение и скролл. | `src/features/digital-chessboard/README.md`, `src/components/construction-object-selector/README.md`, `src/data/README.md`, `src/app/README.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`. | Высокий |
| Объекты | Высокая | Общий header/dropdown, active context, общий selector и identity-каталог, двухблочную карточку объекта, полноширинный экран, title рабочей зоны, таблицу, фильтры, CSV, right-side filter overlay поверх header и локальные overlay/scroll состояния. | Переходы трех поверхностей; project/queue/BU; 5 карточек; title `Группы и виды работ`; 32 группы по 15–27 работ; параметры; gap `4px` между параметрами/действиями и таблицей; сложный header; раскрытие; фильтры поверх `.top-navbar`; no-results; ellipsis; sticky header/footer и приоритет header над sticky-ячейками строк; draggable indicators; CSV; keyboard/focus; cleanup при hide. | `src/features/objects/README.md`, `src/components/construction-object-selector/README.md`, `src/data/README.md`, `src/app/README.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`, `docs/plans/objects-integration-plan.md`, `docs/reference/objects/README.md`. | Высокий |
| Табы приоритета событий | Средняя | Разделение выдачи на высокий и низкий приоритет, счетчики, empty state. | Переключение высокого/низкого приоритета, отображение карточек, состояние пустой вкладки. | `src/app/README.md`, `src/components/event-card/README.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`. | Средний |
| Карточка события | Средняя/высокая | Краткое представление события, индикатор связанной задачи, детальную карточку, закрепление, исключение, выборку для AI, состояния `pinned` и `excluded`. | Открытие drawer, индикатор задачи, pin, исключение при активных фильтрах, отображение одного или нескольких источников, текста, метрики, empty state закрепленных. | `src/components/event-card/README.md`, `docs/source-visual-themes.md`, `docs/component-states.md`, `docs/decision-actions.md`, `docs/entity-model.md`, `docs/system-compliance-matrix.md`. | Средний |
| Детальная карточка события | Высокая | Расширенное представление события, задачи, действия пользователя, AI-вывод, влияние на метрику, BI-график и системные действия с карточкой. | Открытие/закрытие drawer, переходы `event-detail`/`task-create`/`task-edit`, статичные карточки задач, кнопки edit/delete задачи, header, источник/проект, приоритет, блок метрики, открытие/закрытие BI, действия, pin/exclude. | `src/app/README.md`, `src/components/event-card/README.md`, `src/features/tasks/README.md`, `src/features/bi/README.md`, `docs/decision-actions.md`, `docs/entity-model.md`, `docs/system-compliance-matrix.md`. | Высокий |
| Создание, редактирование и удаление задачи | Высокая | Сущность Task, справочник ответственных, event drawer, карточки задач, compact indicator и конфликтующие modal layers. | Точка входа в footer, обязательные поля, dropdown и команда проекта, create/edit/delete, возврат к событию, переключение контекста, overlay/`Escape`, адаптив. | `src/features/tasks/README.md`, `src/data/README.md`, `src/app/README.md`, `docs/entity-model.md`, `docs/component-states.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`, `docs/plans/event-task-creation-integration-plan.md`. | Высокий |
| Фильтры событий | Высокая | Ленту событий, тулбар, floating action bar, доступность исключения, выборку для AI-анализа, общий слой right drawer поверх header. | Выбор источника, периода, приоритета, метрики, применение/сброс, исключение событий только после фильтрации, открытие панели поверх `.top-navbar`. | `src/features/filters/README.md`, `src/components/event-toolbar/README.md`, `src/components/floating-action-bar/README.md`, `docs/context-behavior.md`, `docs/system-compliance-matrix.md`. | Высокий |
| Floating action bar | Средняя | Состояние активной выборки, сброс фильтров, пользовательское понимание режима работы с данными. | Появление после фильтрации, счетчики, сброс, связь с исключенными событиями. | `src/components/floating-action-bar/README.md`, `src/features/filters/README.md`, `docs/component-states.md`, `docs/system-compliance-matrix.md`. | Средний |
| AI-аналитика | Высокая | Выборку событий, фильтры, исключенные карточки, управленческие выводы, действия пользователя. | Запуск анализа после фильтрации, состав анализируемых карточек, модалка вывода, связь с действиями. | `src/features/analytics/README.md`, `docs/decision-actions.md`, `docs/entity-model.md`, `docs/system-compliance-matrix.md`, `docs/plans/system-scaling-roadmap.md`. | Высокий |
| AIShtab / ИИ-чат | Высокая | Активный контекст, экранную выборку событий, фильтры, метрики, открытые drawer, AI-аналитику, правые панели и общий слой right drawer поверх header. | Открытие кнопкой `Задать вопрос`, заголовок `Ассистент AIShtab`, корректная подпись контекста, закрытие конфликтующих панелей, открытие панели поверх `.top-navbar`, отсутствие изменения данных без подтвержденного действия. | `src/features/chat/README.md`, `docs/plans/scenter-ai-chat-integration-plan.md`, `src/features/analytics/README.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`, `docs/plans/system-scaling-roadmap.md`. | Высокий |
| Расчетные данные метрик без правой панели | Средняя/высокая | События, фильтры, ассистента, BI-график, `metricId` / `metricName`, активные BI-контракты и stub metric drawer. | Карточки событий показывают связанную метрику; фильтр строится из `window.metricsData`; BI открывает правильный узел текущего контекста; неизвестный `metricId` обрабатывается безопасно. | `src/data/README.md`, `src/features/bi/README.md`, `docs/entity-model.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`. | Средний |
| BI-график метрики | Высокая | Event drawer, модальные слои, выбранную метрику, прогноз, фокус и публичные `window.*` интерфейсы. | Открытие из нескольких событий, правильный заголовок метрики, прогноз `off/on`, hover, закрытие кнопкой/overlay/`Escape`, сохранение event drawer, адаптив side-by-side. | `src/features/bi/README.md`, `src/app/README.md`, `src/components/event-card/README.md`, `docs/component-states.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`. | Высокий |
| Изолированный правый блок метрик | Изолирован | Не должен затрагивать активный интерфейс до отдельной команды на возврат панели или дерева. | При обычной работе не проверять; при команде на возврат проверить правую панель, drawer структуры метрик, их конфликт с активным BI и контекстные пересчеты. | `legacy/isolated/right-metrics-panel/README.md`, `legacy/isolated/AGENTS.md`, `.agentsignore`. | Высокий при возврате |

## Правило каскадной проверки

Если компонент имеет среднюю, высокую или очень высокую связность, перед завершением изменения нужно проверить не только его собственный README, но и документы связанных компонентов.

Минимальная последовательность:

1. Определить элемент в этой карте.
2. Проверить колонку "Что может затронуть изменение".
3. Проверить пользовательские сценарии из колонки "Что проверить в интерфейсе".
4. Обновить документы из колонки "Обязательная документация".
5. Если изменение раскрывает будущую, но еще не реализованную логику, добавить или уточнить пункт в `docs/plans/system-scaling-roadmap.md`.

## Когда обновлять эту карту

Карту нужно обновлять, если:

- появился новый компонент, feature или слой;
- изменилась связность существующего элемента;
- компонент начал использовать новый источник данных;
- компонент начал влиять на другой компонент;
- изменилась роль элемента в пользовательском пути;
- изменился уровень риска при изменении элемента.

Если правка не меняет связность, достаточно обновить локальный README компонента или feature и при необходимости `docs/system-compliance-matrix.md`.
