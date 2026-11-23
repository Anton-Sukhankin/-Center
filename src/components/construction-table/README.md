# Компонент `construction-table`

## Назначение

Компонент фиксирует общий визуальный и lifecycle-контракт локальных строительных таблиц разделов `Объекты` и `Сводка`: базовую геометрию header/row, скрытый native scrollbar, overlay-индикаторы и drag-прокрутку. Колонки, строки, данные и действия остаются feature-specific.

## Реализация и стили

[ConstructionTable](../../../react/construction/ConstructionTable.jsx) и `construction-table.css`.

## Публичный интерфейс

`ConstructionTable` получает содержимое таблицы и настройки видимости. Локальные наблюдатели и события прокрутки принадлежат компоненту и очищаются при его размонтировании.

## Текущий контракт и границы

- компонент не создает данные и разметку строк;
- компонент не синхронизирует выбранные объекты разных feature;
- `destroy()` обязателен перед заменой DOM таблицы и при hide/destroy feature;
- общий визуальный контракт: `14px` typography, шапка `42px / 500`, заливка `#F1F3F7`, текст `#4C5C6F`, без нижнего бордера (в «Объектах» два уровня по 21 px), строка `51px`, горизонтальный padding ячеек `14px`, выравнивание влево и `white-space: nowrap`;
- native scrollbar скрыт, а доступ к прокрутке сохраняется для wheel, touch, клавиатуры и overlay-индикаторов;
- пустой semantic footer таблицы, если он нужен feature, имеет высоту строки `51px` и не получает border или padding;
- feature-specific CSS может уточнять ширины колонок, sticky-ячейки, цвета и hover, но не должен менять общую геометрию без совместной регрессии `Объектов` и `Сводки`.

## Пространственный контракт

- Scroll остается внутри `.sct-scroll`; native scrollbar визуально скрыт, но wheel, touch и keyboard сохраняются.
- Overlay-индикаторы появляются только при локальном overflow и не меняют ширину колонок.
- Drag-обработчики и observer удаляются через `destroy()` до замены DOM или hide feature.
- Sticky header/footer и feature-specific sticky columns согласуются так, чтобы индикаторы и disclosure-контролы не перекрывали ячейки.

## Acceptance

Ручная регрессия выполняется одновременно в `Объектах` и `Сводке`: horizontal/vertical overflow, wheel/touch/keyboard, drag индикаторов, sticky header/footer, hide/show, повторный mount и `destroy()` без оставшихся document listeners. Геометрия `42px` header и `51px` row должна совпадать в обеих таблицах.

## Когда обновлять документ

README обновляется при изменении bind/lifecycle API, общей геометрии, scroll-индикаторов, drag или правил sticky/overflow. Feature-specific колонки и строки обновляются только в паспорте потребителя.
