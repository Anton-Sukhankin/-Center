// Единый источник атрибутивных данных для событий и финансовых метрик.
// Файл подключается обычным <script> до src/app/app.js и сохраняет текущую глобальную модель проекта.
(function (window) {
    const eventSources = [
        { id: 'S.Pass', name: 'S.Pass', icon: 'circle-user' },
        { id: 'S.Center', name: 'S.Center', icon: 'layers' },
        { id: 'S.Control', name: 'S.Control', icon: 'clipboard-list' },
        { id: 'MS Project', name: 'MS Project', icon: 'file-text' },
        { id: 'S.Materis', name: 'S.Materis', icon: 'activity' }
    ];

    const priorities = [
        { id: 'high', name: 'Высокий', rank: 2, visualClass: 'volcano' },
        { id: 'critical', name: 'Критический', rank: 3, visualClass: 'volcano' },
        { id: 'low', name: 'Низкий', rank: 1, visualClass: 'gray' }
    ];

    const rawEvents = [
        { id: 'e1', priority: 'high', sourceName: 'S.Pass', sourceIcon: 'circle-user', title: 'Сдвиг сроков монолита: Корпус 1', text: 'Зафиксировано отставание на 8 дней из-за поломки бетононасоса. Критический путь проекта смещен.', dateText: 'Сегодня 10:45', metricName: 'Окончание СМР', metricId: 'GANTT_DATES', impact: '+8 дней', impactType: 'negative', excluded: false },
        { id: 'e2', priority: 'high', sourceName: 'S.Pass', sourceIcon: 'circle-user', title: 'Невыход подрядчика на фасадные работы', text: 'ООО «Фасад-Строй» не вывел рабочих на 3-ю секцию. Риск остановки работ по внешнему контуру.', dateText: 'Сегодня 09:20', metricName: 'Себестоимость СМР', metricId: 'COGS_CONSTRUCTION', impact: '-2.4 млн ₽', impactType: 'negative', excluded: false },
        { id: 'e3', priority: 'high', sourceName: 'S.Control', sourceIcon: 'activity', title: 'Превышение лимита: Вывоз мусора', text: 'Затраты по статье превысили бюджет Q1 на 25%. Требуется доп. согласование с фин. департаментом.', dateText: '2026-04-16 17:30', metricName: 'Чистая прибыль', metricId: 'NP_SAMOLET', impact: '-0.8 млн ₽', impactType: 'negative', excluded: false },
        { id: 'e4', priority: 'high', sourceName: 'MS Project', sourceIcon: 'file-text', title: 'Задержка получения РНС по 2 очереди', text: 'Выявлены замечания в ГПЗУ. Плановая дата получения разрешения сдвигается на 15 рабочих дней.', dateText: '2026-04-17 08:15', metricName: 'Срок реализации', metricId: 'GANTT_DATES', impact: '+15 дней', impactType: 'negative', excluded: false },
        { id: 'e5', priority: 'high', sourceName: 'S.Center', sourceIcon: 'layers', title: 'Синхронизация данных 1С завершена', text: 'Автоматическая сверка задолженностей по всем подрядчикам прошла успешно. Ошибок не обнаружено.', dateText: 'Сегодня 16:15', metricName: 'Интеграция', metricId: 'OTHER_INCOME', impact: '+12.5 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e6', priority: 'high', sourceName: 'S.Center', sourceIcon: 'layers', title: 'Обновлено расписание башенных кранов', text: 'Перераспределены смены операторов для повышения эффективности на 4-й секции Корпуса 2.', dateText: '2026-04-15 14:00', metricName: 'Логистика', metricId: 'OPER_PROFIT', impact: '+1.5 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e7', priority: 'high', sourceName: 'S.Control', sourceIcon: 'clipboard-list', title: 'Приемка работ по благоустройству', text: 'Укладка тротуарной плитки на въезде №2 завершена. Качество соответствует стандартам Самолет.', dateText: '2026-04-17 11:30', metricName: 'Качество', metricId: 'OTHER_INCOME', impact: '+0.8 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e8', priority: 'high', sourceName: 'S.Pass', sourceIcon: 'circle-user', title: 'Дефицит арматуры на складе', text: 'Рыночный скачок цен вызвал задержку отгрузки от поставщика. Запас на площадке — 3 дня.', dateText: '2026-04-17 12:00', metricName: 'Чистая прибыль', metricId: 'NP_SAMOLET', impact: '-12 млн ₽', impactType: 'negative', excluded: false },
        { id: 'e9', priority: 'high', sourceName: 'S.Materis', sourceIcon: 'activity', title: 'Обучение персонала на объекте', text: 'Завершен курс по ТБ для 45 новых сотрудников субподрядчика. Пройдено тестирование 100%.', dateText: '2026-04-14 10:00', metricName: 'Риски ТБ', metricId: 'ADMIN_EXP', impact: '+0.3 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e10', priority: 'high', sourceName: 'S.Center', sourceIcon: 'layers', title: 'Обновление фотоотчета в кабинете', text: 'Загружены снимки с дрона за 25.03.2026. Строительная готовность — 42%.', dateText: '2026-04-16 14:00', metricName: 'Готовность', metricId: 'REVENUE', impact: '+5.5 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e11', priority: 'high', sourceName: 'S.Control', sourceIcon: 'clipboard-list', title: 'Срыв поставки лифтового оборудования', text: 'Транспортная компания сообщает о задержке на границе. Требуется корректировка графика монтажа.', dateText: 'Сегодня 13:10', metricName: 'Срок сдачи', metricId: 'GANTT_DATES', impact: '+10 дней', impactType: 'negative', excluded: false },
        { id: 'e12', priority: 'high', sourceName: 'S.Control', sourceIcon: 'clipboard-list', title: 'Плановая проверка документации', text: 'Замечания по исполнительной схеме 2-го этажа устранены. Пакет документов готов к передаче.', dateText: '2026-04-17 15:45', metricName: 'Документооборот', metricId: 'OTHER_INCOME', impact: '+2.1 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e13', priority: 'high', sourceName: 'S.Pass', sourceIcon: 'circle-user', title: 'Штраф от ГХИ: Навалы мусора', text: 'По результатам проверки выписано предписание. Требуется немедленная очистка площадки.', dateText: '2026-04-16 10:00', metricName: 'Чистая прибыль', metricId: 'NP_SAMOLET', impact: '-0.5 млн ₽', impactType: 'negative', excluded: false },
        { id: 'e14', priority: 'high', sourceName: 'S.Materis', sourceIcon: 'activity', title: 'Закрытие актов КС-2 за февраль', text: 'Все акты по 1-й очереди согласованы. Объем выполненных работ соответствует плану-фавту.', dateText: '2026-04-13 11:00', metricName: 'Выручка', metricId: 'REVENUE', impact: '+210 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e15', priority: 'high', sourceName: 'MS Project', sourceIcon: 'file-text', title: 'Завершение остекления: Секция 2', text: 'Установлены последние пакеты на 12-м этаже. Контур закрыт тепло к завершению сезона.', dateText: '2026-04-15 17:00', metricName: 'Закрытие контура', metricId: 'GANTT_DATES', impact: '+5.4 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e16', priority: 'high', sourceName: 'MS Project', sourceIcon: 'file-text', title: 'Отказ в согласовании ТУ на тепло', text: 'Необходима корректировка проектного решения по узлу учета. Риск задержки пуска тепла.', dateText: '2026-04-14 09:00', metricName: 'Инженерия', metricId: 'NP_SAMOLET', impact: '-18.2 млн ₽', impactType: 'negative', excluded: false },
        { id: 'e17', priority: 'high', sourceName: 'S.Center', sourceIcon: 'layers', title: 'Обновление мобильного приложения', text: 'Новая версия S.Center поддерживает детальные отчеты по подрядчикам. Доступно для скачивания.', dateText: '2026-04-17 09:00', metricName: 'ПО', metricId: 'OTHER_INCOME', impact: '+0.2 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e18', priority: 'high', sourceName: 'S.Control', sourceIcon: 'clipboard-list', title: 'Инспекция систем пожаротушения', text: 'Испытания спринклерной системы прошли успешно. Давление в норме, утечек нет.', dateText: '2026-04-16 11:20', metricName: 'Безопасность', metricId: 'OTHER_INCOME', impact: '+0.6 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e19', priority: 'high', sourceName: 'S.Pass', sourceIcon: 'circle-user', title: 'Коррекция цен на ГСМ', text: 'Рост стоимости топлива привел к увеличению затрат на логистику внутри площадки на 12%.', dateText: '2026-04-17 10:00', metricName: 'Себестоимость СМР', metricId: 'COGS_CONSTRUCTION', impact: '-1.2 млн ₽', impactType: 'negative', excluded: false },
        { id: 'e20', priority: 'high', sourceName: 'S.Pass', sourceIcon: 'circle-user', title: 'Монтаж временных дорог завершен', text: 'Обеспечен проезд тяжелой техники к Корпусу 3. Подготовка к свайным работам окончена.', dateText: '2026-04-17 08:30', metricName: 'Подготовка', metricId: 'OTHER_INCOME', impact: '+4.2 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e21', priority: 'high', sourceName: 'S.Materis', sourceIcon: 'activity', title: 'Конкурс на закупку кровельных материалов', text: 'Определен победитель тендера. Экономия от НМЦ составила 4.5% за счет объема.', dateText: '2026-04-16 16:00', metricName: 'Чистая прибыль', metricId: 'NP_SAMOLET', impact: '+3.2 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e22', priority: 'high', sourceName: 'MS Project', sourceIcon: 'file-text', title: 'Задержка по ГПЗУ: Корпус 4', text: 'Требуется доп. согласование с комитетом по архитектуре. Смещение старта продаж на месяц.', dateText: '2026-04-13 12:00', metricName: 'Продажи', metricId: 'REVENUE', impact: '-450 млн ₽', impactType: 'negative', excluded: false },
        { id: 'e23', priority: 'high', sourceName: 'S.Center', sourceIcon: 'layers', title: 'Вебинар для руководителей проектов', text: 'Презентация новых инструментов управления рисками в S.Center. Запись доступна в обучении.', dateText: '2026-04-16 10:00', metricName: 'HR', metricId: 'ADMIN_EXP', impact: '+0.1 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e24', priority: 'high', sourceName: 'S.Control', sourceIcon: 'clipboard-list', title: 'Аудит чистоты на площадке', text: 'Показатель культуры производства вырос до 4.8/5.0. Площадка признана лучшей за неделю.', dateText: '2026-04-17 16:30', metricName: 'Compliance', metricId: 'OTHER_INCOME', impact: '+0.5 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e25', priority: 'high', sourceName: 'S.Center', sourceIcon: 'layers', title: 'Авария на магистрали водопровода', text: 'Требуется срочный ремонт участка на западном въезде. Подача воды временно ограничена.', dateText: '2026-04-17 14:15', metricName: 'Коммуникации', metricId: 'COGS_CONSTRUCTION', impact: '-3.5 млн ₽', impactType: 'negative', excluded: false },
        { id: 'e26', priority: 'high', sourceName: 'S.Pass', sourceIcon: 'circle-user', title: 'Поставка спецодежды: Партия 2', text: 'Все сотрудники полностью укомплектованы летней формой с логотипом Самолет.', dateText: '2026-04-15 10:00', metricName: 'Экипировка', metricId: 'OTHER_INCOME', impact: '+0.2 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e27', priority: 'high', sourceName: 'S.Materis', sourceIcon: 'activity', title: 'Сверка лимитов по IT-инфраструктуре', text: 'Потребление облачных ресурсов находится в рамках годового бюджета. Превышений нет.', dateText: '2026-04-16 09:45', metricName: 'IT Опекс', metricId: 'ADMIN_EXP', impact: '+0.1 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e28', priority: 'high', sourceName: 'MS Project', sourceIcon: 'file-text', title: 'Блокировка счетов субподрядчика', text: 'ФНС наложила арест на счета ООО «ПромТех». Риск приостановки монтажа вентиляции.', dateText: '2026-04-17 08:00', metricName: 'Прогресс СМР', metricId: 'COGS_CONSTRUCTION', impact: '-7.8 млн ₽', impactType: 'negative', excluded: false },
        { id: 'e29', priority: 'high', sourceName: 'S.Control', sourceIcon: 'clipboard-list', title: 'Временное ограждение: Секция 1', text: 'Завершен монтаж защитных экранов для обеспечения безопасности пешеходов на тротуаре.', dateText: '2026-04-16 15:00', metricName: 'Безопасность', metricId: 'OTHER_INCOME', impact: '+1.2 млн ₽', impactType: 'positive', excluded: false },
        { id: 'e30', priority: 'high', sourceName: 'S.Control', sourceIcon: 'clipboard-list', title: 'Маркировка этажей завершена', text: 'Нанесена навигация на всех лестничных клетках Корпуса 1. Удобство для инспекций +20%.', dateText: '2026-04-17 17:00', metricName: 'Навигация', metricId: 'OTHER_INCOME', impact: '+2.3 млн ₽', impactType: 'positive', excluded: false },
        // 17 New Neutral Events
        { id: 'n1', priority: 'low', sourceName: 'S.Center', sourceIcon: 'layers', title: 'Проверка прав доступа: Подрядчики', text: 'Проведен ежеквартальный аудит ролей в системе. Права актуализированы для 15 компаний.', dateText: 'Сегодня 10:15', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n2', priority: 'low', sourceName: 'S.Pass', sourceIcon: 'circle-user', title: 'План-график: Установка лесов', text: 'Размещен технический регламент по монтажу фасадных лесов на Корпусе 4. Ознакомление до 18:00.', dateText: 'Сегодня 11:20', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n3', priority: 'low', sourceName: 'MS Project', sourceIcon: 'file-text', title: 'Регистрация входящих: ТУ на воду', text: 'Принят пакет документов от Водоканала. Направлен в инженерный отдел на экспертизу.', dateText: '2026-04-17 09:45', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n4', priority: 'low', sourceName: 'S.Materis', sourceIcon: 'activity', title: 'Сверка ведомостей: Бетон B25', text: 'Проверка объемов заливки за прошлую неделю. Отклонений в отчетности не выявлено.', dateText: '2026-04-17 12:30', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n5', priority: 'low', sourceName: 'S.Control', sourceIcon: 'clipboard-list', title: 'Инструктаж по высотным работам', text: 'Проведен плановый брифинг для бригады фасадчиков. Все сотрудники расписались в журнале.', dateText: '2026-04-17 08:30', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n6', priority: 'low', sourceName: 'S.Pass', sourceIcon: 'circle-user', title: 'Анализ пропускной способности КПП', text: 'Зафиксировано среднее время ожидания транспорта. Логистика в норме, простоев нет.', dateText: '2026-04-17 13:40', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n7', priority: 'low', sourceName: 'S.Center', sourceIcon: 'layers', title: 'Обновление ГПР: Благоустройство', text: 'Внесены уточнения по срокам поставки малых архитектурных форм. Резерв времени - 5 дней.', dateText: '2026-04-17 14:10', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n8', priority: 'low', sourceName: 'MS Project', sourceIcon: 'file-text', title: 'Архив: Акты скрытых работ (Секция 3)', text: 'Вся исполнительная документация по заливке плиты перекрытия 4-го этажа сдана в архив.', dateText: '2026-04-17 15:20', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n9', priority: 'low', sourceName: 'S.Materis', sourceIcon: 'activity', title: 'Мониторинг цен: Теплоизоляция', text: 'Проведен срез цен по альтернативным поставщикам минваты. Текущий контракт выгоднее на 8%.', dateText: '2026-04-17 16:00', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n10', priority: 'low', sourceName: 'S.Control', sourceIcon: 'clipboard-list', title: 'Проверка электрощитовых', text: 'Плановый осмотр временных сетей электроснабжения. Замечаний нет, пломбы на месте.', dateText: '2026-04-17 17:15', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n11', priority: 'low', sourceName: 'S.Center', sourceIcon: 'layers', title: 'Рассылка отчетности за месяц', text: 'Сформированы и разосланы сводные отчеты по строительной готовности объектам Москвы.', dateText: '2026-04-17 10:50', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n12', priority: 'low', sourceName: 'S.Control', sourceIcon: 'clipboard-list', title: 'Уточнение графика вывоза грунта', text: 'Согласован ночной график работы самосвалов для исключения пробок на въезде.', dateText: '2026-04-17 11:55', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n13', priority: 'low', sourceName: 'S.Materis', sourceIcon: 'activity', title: 'Аудит заявок на ТМЦ', text: 'Проверены заявки на краску и штукатурку. Все позиции соответствуют проектным спецификациям.', dateText: '2026-04-17 18:20', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n14', priority: 'low', sourceName: 'MS Project', sourceIcon: 'file-text', title: 'Статус договора: Охрана объекта', text: 'Договор на охрану Корпуса 5 продлен на следующий квартал. Условия без изменений.', dateText: '2026-04-17 08:45', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n15', priority: 'low', sourceName: 'S.Control', sourceIcon: 'clipboard-list', title: 'Тестирование пожарных гидрантов', text: 'Проверка работоспособности системы наружного пожаротушения. Проливка выполнена.', dateText: '2026-04-17 12:10', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n16', priority: 'low', sourceName: 'S.Pass', sourceIcon: 'circle-user', title: 'Выдача спецодежды (Зима->Весна)', text: 'Завершена выдача демисезонных жилетов для бригад субподрядчика "Эверест".', dateText: '2026-04-17 14:50', impact: null, impactType: 'neutral', excluded: false },
        { id: 'n17', priority: 'low', sourceName: 'MS Project', sourceIcon: 'file-text', title: 'Фотофиксация: Армирование колонн', text: 'Создан фотоотчет по армированию 4-й секции для приемочной комиссии.', dateText: '2026-04-17 16:40', impact: null, impactType: 'neutral', excluded: false },
        // Filter coverage events
        { id: 'fc1', type: 'event', priority: 'high', sourceId: 'S.Center', title: 'Рост бронирований квартир', text: 'По проекту Nova зафиксировано увеличение бронирований квартир после обновления витрины продаж.', dateText: 'Сегодня 18:05', projectId: 'proj-nova', queueId: 'q-n-2', queue: '2 очередь', objectType: 'корпус', objectName: 'Nova / Корпус 2', metricId: 'REV_APTS', impact: '+18 млн ₽', impactValue: 18, impactUnit: 'млн ₽', impactType: 'positive', excluded: false, pinned: false },
        { id: 'fc2', type: 'event', priority: 'low', sourceId: 'S.Pass', title: 'Уточнение реестра паркомест', text: 'Коммерческий блок обновил статус доступных паркомест и передал данные в проектный офис.', dateText: 'Сегодня 18:20', projectId: 'proj-nova', queueId: 'q-n-1', queue: '1 очередь', objectType: 'паркинг', objectName: 'Nova / Подземный паркинг', metricId: 'REV_PARKING', impact: '+4 млн ₽', impactValue: 4, impactUnit: 'млн ₽', impactType: 'positive', excluded: false, pinned: false },
        { id: 'fc3', type: 'event', priority: 'high', sourceId: 'S.Control', title: 'Дополнительная коммерческая выручка', text: 'Согласованы условия размещения сервисного оператора на первом этаже корпуса.', dateText: '2026-04-18 10:30', projectId: 'proj-nova', queueId: 'q-n-3', queue: '3 очередь', objectType: 'помещение', objectName: 'Nova / Коммерческий блок', metricId: 'REV_OTHER', impact: '+6.5 млн ₽', impactValue: 6.5, impactUnit: 'млн ₽', impactType: 'positive', excluded: false, pinned: false },
        { id: 'fc4', type: 'event', priority: 'low', sourceId: 'S.Materis', title: 'Индексация платежа за участок', text: 'Финансовая служба уточнила график платежей по земле после сверки договорных условий.', dateText: '2026-04-18 11:10', projectId: 'proj-nova', queueId: 'q-n-4', queue: '4 очередь', objectType: 'земельный участок', objectName: 'Nova / Земельный контур', metricId: 'COGS_LAND', impact: '-9 млн ₽', impactValue: -9, impactUnit: 'млн ₽', impactType: 'negative', excluded: false, pinned: false },
        { id: 'fc5', type: 'event', priority: 'high', sourceId: 'MS Project', title: 'Увеличение маркетингового бюджета', text: 'Для поддержки темпа продаж предложено расширить рекламную кампанию по проекту Nova.', dateText: '2026-04-18 12:25', projectId: 'proj-nova', queueId: 'q-n-2', queue: '2 очередь', objectType: 'кампания', objectName: 'Nova / Продвижение', metricId: 'COMM_EXP', impact: '-3.8 млн ₽', impactValue: -3.8, impactUnit: 'млн ₽', impactType: 'negative', excluded: false, pinned: false },
        { id: 'fc6', type: 'event', priority: 'low', sourceId: 'S.Center', title: 'Прочий расход по эксплуатации штаба', text: 'Добавлен счет на обслуживание временного штаба строительства за отчетный период.', dateText: '2026-04-18 13:40', projectId: 'proj-nova', queueId: 'q-n-1', queue: '1 очередь', objectType: 'штаб', objectName: 'Nova / Штаб строительства', metricId: 'OTHER_EXP', impact: '-1.1 млн ₽', impactValue: -1.1, impactUnit: 'млн ₽', impactType: 'negative', excluded: false, pinned: false },
        { id: 'fc7', type: 'event', priority: 'high', sourceId: 'S.Control', title: 'Корректировка финансовых расходов', text: 'Банк обновил график начисления процентов по проектному финансированию.', dateText: '2026-04-18 14:15', projectId: 'proj-nova', queueId: 'q-n-5', queue: '5 очередь', objectType: 'финансирование', objectName: 'Nova / Проектное финансирование', metricId: 'FIN_EXPENSES', impact: '-5.6 млн ₽', impactValue: -5.6, impactUnit: 'млн ₽', impactType: 'negative', excluded: false, pinned: false },
        { id: 'fc8', type: 'event', priority: 'low', sourceId: 'S.Materis', title: 'Уточнен расчет налога на прибыль', text: 'После сверки налоговой базы обновлен прогноз налога на прибыль по проектному контуру.', dateText: '2026-04-18 15:05', projectId: 'proj-nova', queueId: 'q-n-3', queue: '3 очередь', objectType: 'налоговый расчет', objectName: 'Nova / Финансовая модель', metricId: 'TAX_PROFIT', impact: '+2.2 млн ₽', impactValue: 2.2, impactUnit: 'млн ₽', impactType: 'positive', excluded: false, pinned: false }
    ];

    const rawMetricsTree = {
        id: 'NP_SAMOLET', name: 'Чистая прибыль', fact: 1250, plan: 1300, forecast: 1150, delta: -50, deltaPrevMonth: -30, risk: true, budgetImpact: '+',
        children: [
            {
                id: 'PBT', name: 'Прибыль до налогообложения', fact: 1560, plan: 1625, forecast: 1437, delta: -65, deltaPrevMonth: -40, risk: true, budgetImpact: '+',
                children: [
                    { id: 'OTHER_INCOME', name: 'Прочие доходы', fact: 100, plan: 100, forecast: 100, delta: 0, deltaPrevMonth: 0, budgetImpact: '+' },
                    {
                        id: 'OPER_PROFIT', name: 'Операционная прибыль', fact: 2100, plan: 2200, forecast: 2000, delta: -100, deltaPrevMonth: -55, risk: true, budgetImpact: '+',
                        children: [
                            {
                                id: 'GROSS_PROFIT', name: 'Валовая прибыль', fact: 3200, plan: 3100, forecast: 2900, delta: 100, deltaPrevMonth: 80, risk: true, budgetImpact: '+',
                                children: [
                                    {
                                        id: 'REVENUE', name: 'Выручка', fact: 8500, plan: 8500, forecast: 8200, delta: 0, deltaPrevMonth: 120, risk: true, budgetImpact: '+',
                                        children: [
                                            { id: 'REV_APTS', name: 'Выручка от квартир', fact: 7000, plan: 7000, forecast: 6800, delta: 0, deltaPrevMonth: 100, risk: true, budgetImpact: '+' },
                                            { id: 'REV_PARKING', name: 'Выручка от паркомест', fact: 1000, plan: 1000, forecast: 1000, delta: 0, deltaPrevMonth: 15, budgetImpact: '+' },
                                            { id: 'REV_OTHER', name: 'Прочая выручка', fact: 500, plan: 500, forecast: 400, delta: 0, deltaPrevMonth: 5, budgetImpact: '+' }
                                        ]
                                    },
                                    {
                                        id: 'COGS', name: 'Себестоимость', fact: -5300, plan: -5400, forecast: -5300, delta: 100, deltaPrevMonth: -40, budgetImpact: '-',
                                        children: [
                                            { id: 'COGS_CONSTRUCTION', name: 'СМР (строительство)', fact: -4000, plan: -4200, forecast: -4200, delta: 200, deltaPrevMonth: -25, budgetImpact: '-' },
                                            { id: 'COGS_LAND', name: 'Земля', fact: -1300, plan: -1200, forecast: -1100, delta: -100, deltaPrevMonth: -15, budgetImpact: '-' }
                                        ]
                                    }
                                ]
                            },
                            { id: 'ADMIN_EXP', name: 'Управленческие расходы', fact: -600, plan: -500, forecast: -550, delta: -100, deltaPrevMonth: -20, budgetImpact: '-' },
                            { id: 'COMM_EXP', name: 'Коммерческие расходы', fact: -500, plan: -400, forecast: -350, delta: -100, deltaPrevMonth: -35, budgetImpact: '-' },
                            { id: 'OTHER_EXP', name: 'Прочие расходы', fact: 0, plan: 0, forecast: 0, delta: 0, deltaPrevMonth: 0, budgetImpact: '-' }
                        ]
                    },
                    { id: 'FIN_EXPENSES', name: 'Финансовые расходы', fact: -640, plan: -675, forecast: -663, delta: 35, deltaPrevMonth: 10, budgetImpact: '-' }
                ]
            },
            { id: 'TAX_PROFIT', name: 'Налог на прибыль', fact: -310, plan: -325, forecast: -287, delta: 15, deltaPrevMonth: 5, budgetImpact: '-' },
            { id: 'GANTT_DATES', name: 'Сроки реализации (ГПР)', fact: 100, plan: 100, forecast: 110, delta: -10, deltaPrevMonth: -5, budgetImpact: '-' }
        ]
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function parseImpactValue(impact) {
        if (typeof impact !== 'string') return null;
        const value = parseFloat(impact.replace(/[^\d.-]/g, ''));
        return Number.isNaN(value) ? null : value;
    }

    function parseImpactUnit(impact) {
        if (typeof impact !== 'string') return '';
        return impact.replace(/[+\-\d.,\s]/g, '').trim();
    }

    function findSourceById(id) {
        return eventSources.find(source => source.id === id || source.name === id) || null;
    }

    function addParentLinks(node, parentId) {
        const nextNode = { ...node, parentId: parentId || null };
        if (node.children) {
            nextNode.children = node.children.map(child => addParentLinks(child, nextNode.id));
        }
        return nextNode;
    }

    const metricsTemplate = addParentLinks(rawMetricsTree, null);

    function findMetricById(node, id) {
        if (!node) return null;
        if (node.id === id) return node;
        if (node.children) {
            for (const child of node.children) {
                const found = findMetricById(child, id);
                if (found) return found;
            }
        }
        return null;
    }

    function findMetricPathById(node, id, path) {
        if (!node) return null;
        const nextPath = [...(path || []), node];
        if (node.id === id) return nextPath;
        if (node.children) {
            for (const child of node.children) {
                const found = findMetricPathById(child, id, nextPath);
                if (found) return found;
            }
        }
        return null;
    }

    function stableHash(value) {
        const text = String(value || '');
        let hash = 0;
        for (let i = 0; i < text.length; i += 1) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function roundMetric(value) {
        return Number((Number(value) || 0).toFixed(2));
    }

    function collectLeafMetricIds(node, result) {
        const nextResult = result || [];
        if (!node.children || node.children.length === 0) {
            nextResult.push(node.id);
            return nextResult;
        }
        node.children.forEach(child => collectLeafMetricIds(child, nextResult));
        return nextResult;
    }

    function resolveMetricIdForEvent(metricId, seed) {
        const metric = findMetricById(metricsTemplate, metricId);
        if (!metric) return metricId || 'OTHER_INCOME';
        if (!metric.children || metric.children.length === 0) return metric.id;
        const leafIds = collectLeafMetricIds(metric);
        return leafIds[stableHash(seed) % leafIds.length] || metric.id;
    }

    function buildMetricValues(event, index, metric, impactValue, context) {
        if (event.metricValues) {
            return {
                fact: roundMetric(event.metricValues.fact),
                plan: roundMetric(event.metricValues.plan),
                forecast: roundMetric(event.metricValues.forecast),
                previousMonth: roundMetric(event.metricValues.previousMonth)
            };
        }

        const metricSign = metric && metric.budgetImpact === '-' ? -1 : 1;
        const seed = stableHash(`${event.id || index}:${context.queueId}:${metric ? metric.id : ''}`);
        const baseImpact = Math.abs(Number(impactValue) || 0);
        const base = baseImpact > 0 ? baseImpact : 0.45 + (seed % 11) * 0.2;
        const scale = 1 + (seed % 7) * 0.06;
        const factAbs = base * scale;
        const planAbs = factAbs * (0.88 + (seed % 9) * 0.025);
        const forecastAbs = factAbs + baseImpact * (((seed % 5) - 2) * 0.08);
        const previousAbs = factAbs * (0.9 + (seed % 8) * 0.03);

        return {
            fact: roundMetric(metricSign * factAbs),
            plan: roundMetric(metricSign * planAbs),
            forecast: roundMetric(metricSign * forecastAbs),
            previousMonth: roundMetric(metricSign * previousAbs)
        };
    }

    const contextCatalog = [
        { businessUnitId: 'bu-2', projectId: 'proj-nova', projectName: 'Nova', queueId: 'q-n-1', queue: 'Очередь 1' },
        { businessUnitId: 'bu-2', projectId: 'proj-nova', projectName: 'Nova', queueId: 'q-n-2', queue: 'Очередь 2' },
        { businessUnitId: 'bu-2', projectId: 'proj-nova', projectName: 'Nova', queueId: 'q-n-3', queue: 'Очередь 3' },
        { businessUnitId: 'bu-2', projectId: 'proj-nova', projectName: 'Nova', queueId: 'q-n-4', queue: 'Очередь 4' },
        { businessUnitId: 'bu-2', projectId: 'proj-nova', projectName: 'Nova', queueId: 'q-n-5', queue: 'Очередь 5' },
        { businessUnitId: 'bu-2', projectId: 'proj-alkhimovo', projectName: 'Алхимово', queueId: 'q-a-1', queue: 'Очередь 1' },
        { businessUnitId: 'bu-2', projectId: 'proj-alkhimovo', projectName: 'Алхимово', queueId: 'q-a-2', queue: 'Очередь 2' },
        { businessUnitId: 'bu-2', projectId: 'proj-alkhimovo', projectName: 'Алхимово', queueId: 'q-a-3', queue: 'Очередь 3' },
        { businessUnitId: 'bu-2', projectId: 'proj-alkhimovo', projectName: 'Алхимово', queueId: 'q-a-4', queue: 'Очередь 4' },
        { businessUnitId: 'bu-2', projectId: 'proj-alkhimovo', projectName: 'Алхимово', queueId: 'q-a-5', queue: 'Очередь 5' },
        { businessUnitId: 'bu-2', projectId: 'proj-malzhenninovo', projectName: 'Малженниново', queueId: 'q-m-1', queue: 'Очередь 1' },
        { businessUnitId: 'bu-2', projectId: 'proj-malzhenninovo', projectName: 'Малженниново', queueId: 'q-m-2', queue: 'Очередь 2' },
        { businessUnitId: 'bu-2', projectId: 'proj-malzhenninovo', projectName: 'Малженниново', queueId: 'q-m-3', queue: 'Очередь 3' },
        { businessUnitId: 'bu-2', projectId: 'proj-malzhenninovo', projectName: 'Малженниново', queueId: 'q-m-4', queue: 'Очередь 4' },
        { businessUnitId: 'bu-2', projectId: 'proj-malzhenninovo', projectName: 'Малженниново', queueId: 'q-m-5', queue: 'Очередь 5' },
        { businessUnitId: 'bu-2', projectId: 'proj-novy-kvartal', projectName: 'Новый квартал', queueId: 'q-nk-1', queue: 'Очередь 1' },
        { businessUnitId: 'bu-2', projectId: 'proj-novy-kvartal', projectName: 'Новый квартал', queueId: 'q-nk-2', queue: 'Очередь 2' },
        { businessUnitId: 'bu-2', projectId: 'proj-novy-kvartal', projectName: 'Новый квартал', queueId: 'q-nk-3', queue: 'Очередь 3' },
        { businessUnitId: 'bu-2', projectId: 'proj-novy-kvartal', projectName: 'Новый квартал', queueId: 'q-nk-4', queue: 'Очередь 4' },
        { businessUnitId: 'bu-2', projectId: 'proj-novy-kvartal', projectName: 'Новый квартал', queueId: 'q-nk-5', queue: 'Очередь 5' },
        { businessUnitId: 'bu-2', projectId: 'proj-kolskie-ogni', projectName: 'Кольские огни', queueId: 'q-ko-1', queue: 'Очередь 1' },
        { businessUnitId: 'bu-2', projectId: 'proj-kolskie-ogni', projectName: 'Кольские огни', queueId: 'q-ko-2', queue: 'Очередь 2' },
        { businessUnitId: 'bu-2', projectId: 'proj-kolskie-ogni', projectName: 'Кольские огни', queueId: 'q-ko-3', queue: 'Очередь 3' },
        { businessUnitId: 'bu-2', projectId: 'proj-kolskie-ogni', projectName: 'Кольские огни', queueId: 'q-ko-4', queue: 'Очередь 4' },
        { businessUnitId: 'bu-2', projectId: 'proj-kolskie-ogni', projectName: 'Кольские огни', queueId: 'q-ko-5', queue: 'Очередь 5' },
        { businessUnitId: 'bu-2', projectId: 'proj-dmitrov-dom', projectName: 'Дмитров дом', queueId: 'q-dd-1', queue: 'Очередь 1' },
        { businessUnitId: 'bu-2', projectId: 'proj-dmitrov-dom', projectName: 'Дмитров дом', queueId: 'q-dd-2', queue: 'Очередь 2' },
        { businessUnitId: 'bu-2', projectId: 'proj-dmitrov-dom', projectName: 'Дмитров дом', queueId: 'q-dd-3', queue: 'Очередь 3' },
        { businessUnitId: 'bu-2', projectId: 'proj-dmitrov-dom', projectName: 'Дмитров дом', queueId: 'q-dd-4', queue: 'Очередь 4' },
        { businessUnitId: 'bu-2', projectId: 'proj-dmitrov-dom', projectName: 'Дмитров дом', queueId: 'q-dd-5', queue: 'Очередь 5' },
        { businessUnitId: 'bu-2', projectId: 'proj-tsvetochny', projectName: 'Цветочный', queueId: 'q-ts-1', queue: 'Очередь 1' },
        { businessUnitId: 'bu-2', projectId: 'proj-tsvetochny', projectName: 'Цветочный', queueId: 'q-ts-2', queue: 'Очередь 2' },
        { businessUnitId: 'bu-2', projectId: 'proj-tsvetochny', projectName: 'Цветочный', queueId: 'q-ts-3', queue: 'Очередь 3' },
        { businessUnitId: 'bu-2', projectId: 'proj-tsvetochny', projectName: 'Цветочный', queueId: 'q-ts-4', queue: 'Очередь 4' },
        { businessUnitId: 'bu-2', projectId: 'proj-tsvetochny', projectName: 'Цветочный', queueId: 'q-ts-5', queue: 'Очередь 5' },
        { businessUnitId: 'bu-3', projectId: 'proj-putilkovo', projectName: 'БОЛЬШОЕ ПУТИЛКОВО', queueId: 'q-p-1', queue: 'Очередь 1' },
        { businessUnitId: 'bu-3', projectId: 'proj-putilkovo', projectName: 'БОЛЬШОЕ ПУТИЛКОВО', queueId: 'q-p-2', queue: 'Очередь 2' },
        { businessUnitId: 'bu-3', projectId: 'proj-putilkovo', projectName: 'БОЛЬШОЕ ПУТИЛКОВО', queueId: 'q-p-3', queue: 'Очередь 3' },
        { businessUnitId: 'bu-3', projectId: 'proj-putilkovo', projectName: 'БОЛЬШОЕ ПУТИЛКОВО', queueId: 'q-p-4', queue: 'Очередь 4' }
    ];

    const addedContextCatalog = [
        { businessUnitId: 'bu-1', projectId: 'proj-education-campus', projectName: 'Образовательный кампус', queueId: 'q-edu-1', queue: 'Очередь 1' },
        { businessUnitId: 'bu-1', projectId: 'proj-education-campus', projectName: 'Образовательный кампус', queueId: 'q-edu-2', queue: 'Очередь 2' },
        { businessUnitId: 'bu-4', projectId: 'proj-bank-platform', projectName: 'Банковская платформа', queueId: 'q-bank-1', queue: 'Очередь 1' },
        { businessUnitId: 'bu-4', projectId: 'proj-bank-platform', projectName: 'Банковская платформа', queueId: 'q-bank-2', queue: 'Очередь 2' },
        { businessUnitId: 'bu-5', projectId: 'proj-plus-services', projectName: 'Сервисная платформа', queueId: 'q-plus-1', queue: 'Очередь 1' },
        { businessUnitId: 'bu-5', projectId: 'proj-plus-services', projectName: 'Сервисная платформа', queueId: 'q-plus-2', queue: 'Очередь 2' },
        { businessUnitId: 'bu-6', projectId: 'proj-hospitality-hub', projectName: 'Гостиничный кластер', queueId: 'q-hosp-1', queue: 'Очередь 1' },
        { businessUnitId: 'bu-6', projectId: 'proj-hospitality-hub', projectName: 'Гостиничный кластер', queueId: 'q-hosp-2', queue: 'Очередь 2' }
    ];

    contextCatalog.push(...addedContextCatalog);

    const contextByQueueId = contextCatalog.reduce((acc, item) => {
        acc[item.queueId] = item;
        return acc;
    }, {});

    const contextByProjectId = contextCatalog.reduce((acc, item) => {
        if (!acc[item.projectId]) acc[item.projectId] = item;
        return acc;
    }, {});

    function resolveEventContext(event, index) {
        const fallback = contextCatalog[index % contextCatalog.length];
        const fromQueue = event.queueId ? contextByQueueId[event.queueId] : null;
        const fromProject = event.projectId ? contextByProjectId[event.projectId] : null;
        const context = fromQueue || fromProject || fallback;
        return {
            businessUnitId: event.businessUnitId || context.businessUnitId,
            projectId: event.projectId || context.projectId,
            projectName: event.projectName || context.projectName,
            queueId: event.queueId || context.queueId,
            queue: event.queue || context.queue
        };
    }

    function normalizeEvent(event, index = 0) {
        const sourceId = event.sourceId || event.sourceName || 'S.Center';
        const source = findSourceById(sourceId) || eventSources[1];
        const impactValue = event.impactValue !== undefined ? event.impactValue : parseImpactValue(event.impact);
        const context = resolveEventContext(event, index);
        const metricId = resolveMetricIdForEvent(event.metricId || 'OTHER_INCOME', `${event.id || index}:${context.queueId}`);
        const metric = metricId ? findMetricById(metricsTemplate, metricId) : null;
        const metricValues = buildMetricValues(event, index, metric, impactValue, context);

        return {
            type: 'event',
            businessUnitId: context.businessUnitId,
            projectId: context.projectId,
            projectName: context.projectName,
            queueId: context.queueId,
            queue: event.queue || '2 очередь',
            objectType: event.objectType || 'корпус',
            objectName: event.objectName || 'Nova / Корпус 1',
            sourceId,
            sourceName: source.name,
            sourceIcon: event.sourceIcon || source.icon,
            metricName: event.metricName || (metric ? metric.name : ''),
            impactValue,
            impactUnit: event.impactUnit || parseImpactUnit(event.impact),
            metricValues,
            pinned: false,
            excluded: false,
            ...event,
            businessUnitId: context.businessUnitId,
            projectId: context.projectId,
            projectName: context.projectName,
            queueId: context.queueId,
            queue: context.queue,
            objectName: event.objectName || `${context.projectName} / ${context.queue}`,
            metricId,
            metricName: event.metricName || (metric ? metric.name : ''),
            metricValues
        };
    }

    function compactTitle(title) {
        const words = String(title || '').split(/\s+/).filter(Boolean);
        if (words.length <= 4) return String(title || '');
        return words.slice(0, 4).join(' ');
    }

    function buildListTitle(event, index) {
        const baseTitle = String(event.title || '').trim();
        const objectName = event.objectName || event.queue || '';
        const queueName = event.queue || '';
        const variant = index % 3;
        if (variant === 0) return compactTitle(baseTitle);
        if (variant === 1) return baseTitle;
        return objectName ? `${baseTitle}: ${objectName}, ${queueName}, требуется проверка` : `${baseTitle}: требуется проверка`;
    }

    function buildListPresentation(event, index) {
        const baseText = String(event.text || '').trim();
        const metricName = event.metricName || 'ключевой показатель проекта';
        const objectName = event.objectName || event.queue || 'выбранный контур проекта';
        const sourceName = event.sourceName || event.sourceId || 'S.Center';
        const isLong = index % 2 === 0;
        const mediumDetails = `Контекст зафиксирован для ${objectName}; источник ${sourceName} передал данные для проверки ответственной командой.`;
        const longDetails = `${mediumDetails} Связанные параметры будут использованы при сверке влияния на ${metricName}, чтобы пользователь видел причину события без открытия детальной карточки.`;

        return {
            ...event,
            listTitle: buildListTitle(event, index),
            listText: `${baseText} ${isLong ? longDetails : mediumDetails}`,
            listDescriptionTargetLines: isLong ? 4 : 3
        };
    }

    const portfolioEvents = [
        { id: 'pf-bu-1', businessUnitId: 'bu-1', projectId: 'portfolio-education', projectName: 'Самолет Образование', queueId: 'portfolio-education', queue: 'Портфель', priority: 'low', sourceId: 'S.Center', title: 'Портфельная сверка образовательных объектов', text: 'Зафиксирована плановая актуализация портфеля объектов образовательного направления для управленческой отчетности.', dateText: 'Сегодня 11:05', objectType: 'портфель', objectName: 'Самолет Образование / Портфель', metricId: 'ADMIN_EXP', impact: '+0.4 млн ₽', impactValue: 0.4, impactUnit: 'млн ₽', impactType: 'positive' },
        { id: 'pf-bu-4', businessUnitId: 'bu-4', projectId: 'portfolio-bank', projectName: 'Самолет Банк', queueId: 'portfolio-bank', queue: 'Портфель', priority: 'low', sourceId: 'S.Control', title: 'Обновление банковского портфеля проектов', text: 'Сформирована сводная запись по банковскому направлению для отображения данных на уровне бизнес-юнита.', dateText: 'Сегодня 12:10', objectType: 'портфель', objectName: 'Самолет Банк / Портфель', metricId: 'FIN_EXPENSES', impact: '-0.7 млн ₽', impactValue: -0.7, impactUnit: 'млн ₽', impactType: 'negative' },
        { id: 'pf-bu-5', businessUnitId: 'bu-5', projectId: 'portfolio-plus', projectName: 'Самолет Плюс', queueId: 'portfolio-plus', queue: 'Портфель', priority: 'high', sourceId: 'S.Pass', title: 'Рост сервисных обращений по направлению Плюс', text: 'Поступили агрегированные данные по сервисным обращениям, влияющие на портфельную оценку направления.', dateText: 'Сегодня 13:25', objectType: 'портфель', objectName: 'Самолет Плюс / Портфель', metricId: 'OTHER_INCOME', impact: '+1.2 млн ₽', impactValue: 1.2, impactUnit: 'млн ₽', impactType: 'positive' },
        { id: 'pf-bu-6', businessUnitId: 'bu-6', projectId: 'portfolio-hospitality', projectName: 'Гостеприимство', queueId: 'portfolio-hospitality', queue: 'Портфель', priority: 'low', sourceId: 'MS Project', title: 'Актуализация гостиничного портфеля', text: 'Обновлен общий контур работ по направлению гостеприимства для проверки реакции интерфейса на выбор бизнес-юнита.', dateText: 'Сегодня 14:40', objectType: 'портфель', objectName: 'Гостеприимство / Портфель', metricId: 'REV_OTHER', impact: '+0.9 млн ₽', impactValue: 0.9, impactUnit: 'млн ₽', impactType: 'positive' }
    ];

    function buildQueueCoverageEvents() {
        const metricCycle = ['REVENUE', 'REV_APTS', 'REV_PARKING', 'REV_OTHER', 'COGS_CONSTRUCTION', 'COGS_LAND', 'ADMIN_EXP', 'COMM_EXP', 'OTHER_EXP', 'FIN_EXPENSES', 'TAX_PROFIT', 'GANTT_DATES', 'OTHER_INCOME'];
        const sourceCycle = eventSources.map(source => source.id);
        const todayCount = 27;
        const totalCount = 41;
        const todayIso = new Date().toISOString().split('T')[0];

        return contextCatalog.flatMap((context, contextIndex) => {
            return Array.from({ length: totalCount }, (_, eventIndex) => {
                const isToday = eventIndex < todayCount;
                const priority = eventIndex % 4 < 2 ? 'high' : 'low';
                const metricId = metricCycle[(contextIndex + eventIndex) % metricCycle.length];
                const sourceId = sourceCycle[(contextIndex + eventIndex) % sourceCycle.length];
                const isExpense = metricId.startsWith('COGS') || metricId.includes('EXP') || metricId === 'TAX_PROFIT';
                const sign = eventIndex % 5 === 0 || isExpense ? -1 : 1;
                const impactValue = Number((sign * (0.4 + ((contextIndex + eventIndex) % 9) * 0.35)).toFixed(2));
                const dateText = isToday
                    ? `${todayIso} ${String(8 + (eventIndex % 10)).padStart(2, '0')}:${String((eventIndex * 7) % 60).padStart(2, '0')}`
                    : `2026-04-${String(10 + (eventIndex % 10)).padStart(2, '0')} ${String(9 + (eventIndex % 8)).padStart(2, '0')}:30`;
                const priorityLabel = priority === 'high' ? 'Высокий приоритет' : 'Низкий приоритет';

                return {
                    id: `ctx-${context.queueId}-${eventIndex + 1}`,
                    type: 'event',
                    businessUnitId: context.businessUnitId,
                    projectId: context.projectId,
                    projectName: context.projectName,
                    queueId: context.queueId,
                    queue: context.queue,
                    priority,
                    sourceId,
                    title: `${priorityLabel}: ${context.projectName}, ${context.queue}, событие ${eventIndex + 1}`,
                    text: 'Событие относится к выбранной очереди и используется для проверки суммирования на уровне проекта и бизнес-юнита. В карточке зафиксированы источник, приоритет, метрика и влияние на финансовый показатель.',
                    dateText,
                    objectType: 'очередь',
                    objectName: `${context.projectName} / ${context.queue}`,
                    metricId,
                    impact: `${impactValue > 0 ? '+' : ''}${impactValue} млн ₽`,
                    impactValue,
                    impactUnit: 'млн ₽',
                    impactType: impactValue >= 0 ? 'positive' : 'negative',
                    excluded: false,
                    pinned: false
                };
            });
        });
    }

    const eventTemplates = rawEvents.concat(portfolioEvents, buildQueueCoverageEvents()).map(normalizeEvent).map(buildListPresentation);

    function cloneEvents() {
        return clone(eventTemplates);
    }

    function cloneMetrics() {
        return clone(metricsTemplate);
    }

    function getEventsForContext(context) {
        const events = cloneEvents();
        if (!context) return events;

        const queueIds = new Set(context.queueIds || []);
        const projectIds = new Set(context.projectIds || []);
        const businessUnitIds = new Set(context.businessUnitIds || []);

        return events.filter(event => {
            if (queueIds.size > 0) return queueIds.has(event.queueId);
            if (projectIds.size > 0) return projectIds.has(event.projectId);
            if (businessUnitIds.size > 0) return businessUnitIds.has(event.businessUnitId);
            return true;
        });
    }

    function getMetricsForContext(context, events) {
        const metrics = cloneMetrics();
        resetMetricValues(metrics);
        const contextEvents = events || getEventsForContext(context);
        contextEvents.forEach(event => {
            if (event.excluded || !event.metricId) return;
            const metricId = resolveMetricIdForEvent(event.metricId, event.id || event.title);
            const metric = findMetricById(metrics, metricId);
            if (!metric || (metric.children && metric.children.length > 0)) return;
            const values = event.metricValues || buildMetricValues(event, 0, metric, event.impactValue, resolveEventContext(event, 0));
            metric.fact = roundMetric(metric.fact + values.fact);
            metric.plan = roundMetric(metric.plan + values.plan);
            metric.forecast = roundMetric(metric.forecast + values.forecast);
            metric.previousMonth = roundMetric((metric.previousMonth || 0) + values.previousMonth);
        });
        aggregateMetricTree(metrics);
        return metrics;
    }

    function resetMetricValues(node) {
        node.fact = 0;
        node.plan = 0;
        node.forecast = 0;
        node.delta = 0;
        node.deltaPrevMonth = 0;
        node.previousMonth = 0;
        node.risk = false;
        if (node.children) {
            node.children.forEach(resetMetricValues);
        }
    }

    function setDerivedMetricValues(node) {
        node.fact = roundMetric(node.fact);
        node.plan = roundMetric(node.plan);
        node.forecast = roundMetric(node.forecast);
        node.previousMonth = roundMetric(node.previousMonth || 0);
        node.delta = roundMetric(node.fact - node.plan);
        node.deltaPrevMonth = node.previousMonth
            ? Number((((node.fact - node.previousMonth) / Math.abs(node.previousMonth)) * 100).toFixed(1))
            : 0;
        node.risk = Math.abs(node.deltaPrevMonth) > 8 || Math.abs(node.delta) > Math.abs(node.plan || 1) * 0.08;
    }

    function aggregateMetricTree(node) {
        if (node.children && node.children.length > 0) {
            node.children.forEach(aggregateMetricTree);
            node.fact = roundMetric(node.children.reduce((sum, child) => sum + (child.fact || 0), 0));
            node.plan = roundMetric(node.children.reduce((sum, child) => sum + (child.plan || 0), 0));
            node.forecast = roundMetric(node.children.reduce((sum, child) => sum + (child.forecast || 0), 0));
            node.previousMonth = roundMetric(node.children.reduce((sum, child) => sum + (child.previousMonth || 0), 0));
        }
        setDerivedMetricValues(node);
    }

    function getEventSources() {
        return clone(eventSources);
    }

    function getPriorities() {
        return clone(priorities);
    }

    function getMetricSelectorTree(metricsRoot) {
        return clone(metricsRoot || metricsTemplate);
    }

    function getEventListViewModel(event, metricsRoot) {
        const normalized = normalizeEvent(event);
        const metric = normalized.metricId ? findMetricById(metricsRoot || metricsTemplate, normalized.metricId) : null;
        return {
            ...normalized,
            metricName: normalized.metricName || (metric ? metric.name : '')
        };
    }

    function getEventDetailViewModel(event, metricsRoot) {
        const view = getEventListViewModel(event, metricsRoot);
        const priority = priorities.find(item => item.id === view.priority);
        return {
            ...view,
            priorityName: priority ? priority.name : view.priority,
            projectName: view.projectName || 'Nova'
        };
    }

    function applyMetricImpact(metricsRoot, metricId, impactValue) {
        const value = Number(impactValue);
        if (!metricsRoot || !metricId || Number.isNaN(value)) return false;
        const path = findMetricPathById(metricsRoot, metricId, []);
        if (!path) return false;
        path.forEach(metric => {
            metric.forecast = (metric.forecast || 0) + value;
            metric.delta = (metric.delta || 0) + value;
        });
        return true;
    }

    window.appData = {
        clone,
        cloneEvents,
        cloneMetrics,
        getEventsForContext,
        getMetricsForContext,
        getEventSources,
        getPriorities,
        getMetricSelectorTree,
        getEventListViewModel,
        getEventDetailViewModel,
        normalizeEvent,
        findMetricById,
        findMetricPathById,
        applyMetricImpact
    };
})(window);
