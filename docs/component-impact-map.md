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
| Центральный дашборд метрик | Высокая | Активный проект, demo-данные сроков и бюджетов, тулбар, ассистента, режимы центральной области. | Переключение проектов, loading без старых данных, внутренние разделы, контрольные этапы, адаптив, возврат к событиям, бизнес-юнит и очередь. | `src/features/metrics-dashboard/README.md`, `src/data/README.md`, `src/app/README.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`, `docs/plans/metrics-real-data-integration-plan.md`. | Высокий |
| Сводка цифровой шахматки | Высокая | Header, общий контекст, summary view-model, KPI, проблемы, архив, печать, detail и shared table. | Переходы экранов; project/queue/BU; loading/error; фильтр проблем; архив/печать/detail; focus; shared scroll. | `src/features/digital-chessboard-summary/README.md`, `src/components/construction-table/README.md`, `src/data/README.md`, `src/app/README.md`, `docs/evidence/digital-chessboard-summary/README.md`, `docs/system-compliance-matrix.md`. | Высокий |
| Цифровая шахматка | Высокая | Header, активный контекст, общий selector, demo-данные, период, работы, сравнение и модальные состояния. | Переходы экранов; project/queue/BU; выбор объекта/периода/работы; сравнение; focus; scroll. | `src/features/digital-chessboard/README.md`, `src/components/construction-object-selector/README.md`, `src/data/README.md`, `src/app/README.md`, `docs/evidence/digital-chessboard/README.md`, `docs/system-compliance-matrix.md`. | Высокий |
| Объекты | Высокая | Общий header/dropdown, active context, общий selector и identity-каталог, карточку объекта, таблицу, фильтры, CSV и overlay/scroll состояния. | Переходы поверхностей; project/queue/BU; выбор объекта; параметры; раскрытие; фильтры; no-results; sticky-области; CSV; keyboard/focus; cleanup при hide. | `src/features/objects/README.md`, `src/components/construction-object-selector/README.md`, `src/data/README.md`, `src/app/README.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`, `docs/reference/objects/README.md`. | Высокий |
| Табы приоритета событий | Средняя | Разделение выдачи на высокий и низкий приоритет, счетчики, empty state. | Переключение высокого/низкого приоритета, отображение карточек, состояние пустой вкладки. | `src/app/README.md`, `src/components/event-card/README.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`. | Средний |
| Карточка события | Средняя/высокая | Краткое представление события, источник, индикатор задачи, drawer, закрепление, исключение и выборку для AI. | Single/multi-source, pin, исключение при активных фильтрах, метрика, задача, empty state закрепленных, hover/focus. | `src/components/event-card/README.md`, `src/data/README.md`, `docs/component-states.md`, `docs/decision-actions.md`, `docs/entity-model.md`, `docs/system-compliance-matrix.md`. | Средний |
| Детальная карточка события | Высокая | Представление Event, задачи, управленческие действия, связанную метрику, BI и системные состояния. | Drawer; event/task modes; create/edit/delete; связанная метрика; BI; возврат фокуса; pin/exclude. | `src/app/README.md`, `src/components/event-card/README.md`, `src/features/tasks/README.md`, `src/features/bi/README.md`, `docs/decision-actions.md`, `docs/system-compliance-matrix.md`. | Высокий |
| Создание, редактирование и удаление задачи | Высокая | Task, ответственных, event drawer, карточки задач и конфликтующие modal layers. | Обязательные поля; выбор ответственного; create/edit/delete; отмена; возврат к событию; переключение контекста; адаптив. | `src/features/tasks/README.md`, `src/data/README.md`, `src/app/README.md`, `docs/entity-model.md`, `docs/component-states.md`, `docs/system-compliance-matrix.md`. | Высокий |
| Фильтры событий | Высокая | Ленту, toolbar, floating bar, исключение и выборку для AI-анализа. | Выбор атрибутов; применение/сброс; поиск; исключение после фильтрации; смена контекста. | `src/features/filters/README.md`, `src/components/event-toolbar/README.md`, `src/components/floating-action-bar/README.md`, `docs/context-behavior.md`, `docs/system-compliance-matrix.md`. | Высокий |
| Floating action bar | Средняя | Состояние активной выборки, сброс фильтров, пользовательское понимание режима работы с данными. | Появление после фильтрации, счетчики, сброс, связь с исключенными событиями. | `src/components/floating-action-bar/README.md`, `src/features/filters/README.md`, `docs/component-states.md`, `docs/system-compliance-matrix.md`. | Средний |
| AI-аналитика | Высокая | Выборку событий, фильтры, исключенные карточки, управленческие выводы, действия пользователя. | Запуск анализа после фильтрации, состав анализируемых карточек, модалка вывода, связь с действиями. | `src/features/analytics/README.md`, `docs/decision-actions.md`, `docs/entity-model.md`, `docs/system-compliance-matrix.md`, `docs/plans/system-scaling-roadmap.md`. | Высокий |
| AIShtab / ИИ-чат | Высокая | Активный контекст, экранную выборку событий, фильтры, метрики, открытые drawer, AI-аналитику и общий слой right drawer. | Открытие кнопкой, корректный контекст, закрытие конфликтующих панелей, доступность, отсутствие изменения данных без подтвержденного действия. | `src/features/chat/README.md`, `docs/plans/ai-chat-provider-actions-plan.md`, `src/features/analytics/README.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`, `docs/plans/system-scaling-roadmap.md`. | Высокий |
| Расчетные данные метрик без правой панели | Средняя/высокая | События, фильтры, ассистента, BI-график, `metricId` / `metricName`, активные BI-контракты и stub metric drawer. | Карточки событий показывают связанную метрику; фильтр строится из `window.metricsData`; BI открывает правильный узел текущего контекста; неизвестный `metricId` обрабатывается безопасно. | `src/data/README.md`, `src/features/bi/README.md`, `docs/entity-model.md`, `docs/component-map.md`, `docs/system-compliance-matrix.md`. | Средний |
| BI-график метрики | Высокая | Event drawer, выбранную метрику, прогноз, фокус и публичный API. | Открытие правильной метрики; прогноз; закрытие; сохранение event drawer; возврат фокуса; адаптив. | `src/features/bi/README.md`, `src/app/README.md`, `src/components/event-card/README.md`, `docs/component-states.md`, `docs/system-compliance-matrix.md`. | Высокий |
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
