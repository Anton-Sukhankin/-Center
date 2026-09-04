# План: удаление раздела «Шахматка»

План подчиняется `docs/plans/README.md`. Уровень задачи — сложный: меняются структура проекта, `src/data`, `src/app`, публичные `window.*` и пользовательский путь dropdown `Цифровая шахматка`. Пользователь прямо запросил реализацию, поэтому этап согласования считается пройденным.

## Goal

Полностью удалить из активного прототипа раздел `Шахматка`, который открывается одноименным пунктом dropdown `Цифровая шахматка`, сохранив без изменений основной дашборд, `Сводку`, `Объекты` и общие строительные компоненты, используемые оставшимися разделами.

## Context

Раздел смонтирован как отдельная feature-поверхность через `index.html` и `src/app/app.js`, получает собственные demo-данные из `src/data/digital-chessboard-data.js` и публикует `window.SCenterDigitalChessboard` и `window.digitalChessboardData`. Dropdown также содержит независимые разделы `Сводка` и `Объекты`, которые должны сохраниться.

## Scope

- удалить пункт `Шахматка` из dropdown и его mount-root;
- удалить подключения собственных CSS, JS и data-файла;
- удалить feature-каталог `src/features/digital-chessboard/` и `src/data/digital-chessboard-data.js`;
- убрать orchestration и публичные зависимости удаленного feature из `src/app/app.js`;
- скорректировать регрессионный тест контроллера основных поверхностей;
- синхронизировать активные паспорта, карты и матрицу соответствия;
- сохранить визуальные reference и evidence как исторические материалы, не описывающие текущий runtime.

## Out of Scope

- удаление или переименование кнопки `Цифровая шахматка`;
- изменение `Сводки`, `Объектов`, основного дашборда и их данных;
- удаление shared-компонентов `construction-object-selector` и `construction-table`;
- повторная интеграция перенесенной шахматки или изменение другого проекта;
- массовая чистка исторических архивов.

## Constraints

- dropdown после удаления содержит только рабочие пункты `Сводка` и `Объекты`;
- `window.SCenterDigitalChessboardSummary`, `window.SCenterObjects`, `window.constructionObjectsData`, `window.objectsData` и `window.digitalChessboardSummaryData` сохраняются;
- не затрагиваются несвязанные пользовательские изменения в dirty worktree;
- classic-script/IIFE архитектура и порядок оставшихся подключений сохраняются.

## Impact

- `index.html`: меню, root и подключения удаленного feature;
- `src/app/app.js`: dependency assertion, context propagation, screen-controller и mount;
- `src/features/digital-chessboard-summary/digital-chessboard-summary.test.mjs`: ожидаемый whitelist основных поверхностей;
- `src/features/digital-chessboard-summary/digital-chessboard-summary.css`: печатный selector удаленного root;
- `src/data/README.md`, `src/app/README.md`, карты компонентов/влияния, compliance, roadmap и реестр документации;
- shared selector и каталог identity остаются потребителями `Объектов` и не удаляются.

## Steps

1. Удалить runtime-входы и orchestration раздела.
2. Удалить исключительно принадлежащие разделу исходники и demo-данные.
3. Обновить тест screen-controller и исключить удаленный root из print CSS.
4. Синхронизировать текущую документацию и пометить reference/evidence как историю.
5. Проверить остаточные ссылки, синтаксис, тесты, подключения и UI-сценарии трех оставшихся поверхностей.
6. После приемки перенести этот план в архив завершенных планов.

## Acceptance Criteria

- в dropdown `Цифровая шахматка` нет пункта `Шахматка`;
- в DOM, `index.html` и `src/app/app.js` нет активного root или маршрута `digital-chessboard`;
- собственные JS/CSS/data/README раздела отсутствуют;
- `Сводка`, `Объекты` и `Сводный дашборд` открываются без runtime-ошибок;
- переключение контекста продолжает обновлять оставшиеся feature;
- документация не заявляет удаленный раздел как активную реализацию.

## Documentation Updates

Обновить `src/app/README.md`, `src/data/README.md`, `docs/README.md`, `docs/component-map.md`, `docs/component-impact-map.md`, `docs/system-compliance-matrix.md`, `docs/app-decomposition-map.md`, `docs/component-states.md`, `docs/component-library.md`, `docs/plans/system-scaling-roadmap.md`, а также паспорта исторических reference/evidence. После завершения зарегистрировать план в `docs/archive/plans/README.md`.

## Verification

- `node --check src/app/app.js` и syntax-check затронутых JS;
- существующие тесты summary, objects, shared selector и data;
- проверка всех локальных `src`/`href` из `index.html`;
- `node scripts/check-documentation.mjs`;
- поиск активных ссылок на удаленные файлы и публичные API;
- UI smoke: загрузка → dropdown → `Сводка` → `Объекты` → основной дашборд; отсутствие пункта `Шахматка`, overlay и console errors.

## Result

Статус: `completed`.

Из активного прототипа удалены пункт dropdown, экран, mount/orchestration, публичные runtime-контракты, feature-исходники и собственные demo-данные раздела. В `Сводке` удалена недействующая команда перехода. `Сводка`, `Объекты`, их данные и shared-компоненты сохранены; актуальные документы очищены от заявлений о действующем разделе, а его reference/evidence классифицированы как история.
