# Компонент `construction-table`

## Назначение

Компонент фиксирует общий визуальный и lifecycle-контракт локальных строительных таблиц разделов `Объекты` и `Сводка`: базовую геометрию header/row, скрытый native scrollbar, overlay-индикаторы и drag-прокрутку. Колонки, строки, данные и действия остаются feature-specific.

## Публичный интерфейс

`window.SCenterConstructionTable.bind(root, options)` возвращает `refresh()` и `destroy()`.

По умолчанию используются селекторы `sct-shell`, `sct-scroll`, `sct-indicator`. Для существующей таблицы разрешены feature-specific селекторы через options.

## Ограничения

- компонент не создает данные и разметку строк;
- компонент не синхронизирует выбранные объекты разных feature;
- `destroy()` обязателен перед заменой DOM таблицы и при hide/destroy feature;
- общий визуальный контракт: `14px` typography, header `42px / 600`, строка `51px`, горизонтальный padding ячеек `14px`, выравнивание влево и `white-space: nowrap`;
- native scrollbar скрыт, а доступ к прокрутке сохраняется для wheel, touch, клавиатуры и overlay-индикаторов;
- пустой semantic footer таблицы, если он нужен feature, имеет высоту строки `51px` и не получает border или padding;
- feature-specific CSS может уточнять ширины колонок, sticky-ячейки, цвета и hover, но не должен менять общую геометрию без совместной регрессии `Объектов` и `Сводки`.
