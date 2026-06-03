# FloatingActionBar

## Назначение

`FloatingActionBar` отображает плавающую панель действий в режиме фильтрации и исключения событий.

## Код

- `floating-action-bar.js`;
- `floating-action-bar.css`.

## Данные и зависимости

Компонент использует:

- `window.toolbarState`;
- `window.filterState`;
- `window.undoExclusions`;
- `window.resetAllFilters`;
- `window.resetToolbarMode`;
- `window.updateFloatingBar`.

## Пользовательский путь

Пользователь применяет фильтры, исключает события из выдачи и видит плавающую панель для выхода из режима или сброса действий.

## Когда обновлять документ

Документ нужно обновлять, если меняется логика появления панели, набор действий, связь с фильтрами, исключениями или тулбаром.
