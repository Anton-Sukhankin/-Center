// Демонстрационный in-memory слой данных задач и справочника ответственных.
// Файл подключается обычным <script> до task feature и src/app/app.js.
(function (window) {
    'use strict';

    const assignees = [
        ['Смирнова Анна Сергеевна', 'АС', 'Руководство проектом', 'Руководитель проекта', 'a.smirnova@scenter.local', 'female'],
        ['Волков Илья Андреевич', 'ИВ', 'Управление строительством', 'Руководитель строительства', 'i.volkov@scenter.local', 'male'],
        ['Орлова Мария Викторовна', 'МО', 'Планирование', 'Ведущий специалист по планированию', 'm.orlova@scenter.local', 'female'],
        ['Петров Алексей Михайлович', 'АП', 'Строительный контроль', 'Инженер строительного контроля', 'a.petrov@scenter.local', 'male'],
        ['Соколова Елена Игоревна', 'ЕС', 'Финансовый контроль', 'Финансовый контролер', 'e.sokolova@scenter.local', 'female'],
        ['Лебедев Дмитрий Олегович', 'ДЛ', 'Работа с подрядчиками', 'Менеджер подрядчиков', 'd.lebedev@scenter.local', 'male'],
        ['Кузнецова Ольга Павловна', 'ОК', 'Координация проекта', 'Координатор проекта', 'o.kuznetsova@scenter.local', 'female'],
        ['Мочульский Олег Александрович', 'ОМ', 'Руководство проектом', 'Руководитель проекта', 'o.mochulskiy@scenter.local', 'male'],
        ['Точилин Михаил Александрович', 'МТ', 'Руководство проектом', 'Заместитель руководителя проекта', 'm.tochilin@scenter.local', 'male'],
        ['Романов Дмитрий Михайлович', 'ДР', 'Инженерное управление', 'Главный инженер проекта', 'd.romanov@scenter.local', 'male'],
        ['Симонов Никита Александрович', 'НС', 'Инженерные сети', 'Главный инженер проекта по сетям', 'n.simonov@scenter.local', 'male'],
        ['Завьялова Анна Сергеевна', 'АЗ', 'Инженерное сопровождение', 'Инженер проекта', 'a.zavyalova@scenter.local', 'female'],
        ['Кукушкина Анастасия Вячеславовна', 'АК', 'Администрирование проекта', 'Администратор проекта', 'a.kukushkina@scenter.local', 'female'],
        ['Федоров Максим Олегович', 'МФ', 'Управление сроками', 'Руководитель группы планирования', 'm.fedorov@scenter.local', 'male']
    ].map(function (entry, index) {
        return {
            id: 'user-' + String(index + 1).padStart(3, '0'),
            displayName: entry[0],
            initials: entry[1],
            role: entry[2],
            position: entry[3],
            email: entry[4],
            gender: entry[5],
            avatarSrc: 'assets/images/assignees/assignee-' + String(index + 1).padStart(3, '0') + '.png',
            team: entry[2],
            projectIds: ['*'],
            active: true
        };
    });

    const tasks = [];
    let sequence = 0;

    function clone(value) {
        if (value === undefined || value === null) return value;
        return JSON.parse(JSON.stringify(value));
    }

    function requiredText(value, fieldName) {
        const normalized = typeof value === 'string' ? value.trim() : '';
        if (!normalized) {
            throw new Error('Поле «' + fieldName + '» обязательно для заполнения.');
        }
        return normalized;
    }

    function validateEditableFields(input, projectId) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            throw new Error('Данные задачи должны быть переданы в виде объекта.');
        }

        const title = requiredText(input.title, 'Название');
        if (title.length > 128) {
            throw new Error('Название задачи не должно превышать 128 символов.');
        }

        const description = requiredText(input.description, 'Описание');
        if (description.length > 4000) {
            throw new Error('Описание задачи не должно превышать 4000 символов.');
        }

        const assigneeId = requiredText(input.assigneeId, 'Ответственный');
        const assignee = assignees.find(function (item) {
            return item.id === assigneeId;
        });
        const belongsToProject = assignee && (
            assignee.projectIds.includes('*') || assignee.projectIds.includes(projectId)
        );
        if (!assignee || !assignee.active || !belongsToProject) {
            throw new Error('Выбранный ответственный недоступен для этого проекта.');
        }

        return { title, description, assigneeId };
    }

    function getAssigneesForProject(projectId) {
        const normalizedProjectId = requiredText(projectId, 'Проект');
        return clone(assignees.filter(function (assignee) {
            return assignee.active && (
                assignee.projectIds.includes('*') || assignee.projectIds.includes(normalizedProjectId)
            );
        }));
    }

    function getAssigneeById(id) {
        const assignee = assignees.find(function (item) {
            return item.id === id;
        });
        return clone(assignee || null);
    }

    function getTasksForEvent(eventId) {
        return clone(tasks.filter(function (task) {
            return task.sourceEventId === eventId;
        }));
    }

    function getTaskById(taskId) {
        const task = tasks.find(function (item) {
            return item.id === taskId;
        });
        return clone(task || null);
    }

    function getTaskCountForEvent(eventId) {
        return tasks.reduce(function (count, task) {
            return count + (task.sourceEventId === eventId ? 1 : 0);
        }, 0);
    }

    function createTask(input) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            throw new Error('Данные задачи должны быть переданы в виде объекта.');
        }

        const sourceEventId = requiredText(input.sourceEventId, 'Событие-основание');
        const projectId = requiredText(input.projectId, 'Проект');
        const editableFields = validateEditableFields(input, projectId);
        const timestamp = new Date().toISOString();

        sequence += 1;
        const task = {
            id: 'task-' + String(sequence).padStart(3, '0'),
            status: 'new',
            title: editableFields.title,
            description: editableFields.description,
            assigneeId: editableFields.assigneeId,
            sourceEventId,
            projectId,
            createdAt: timestamp,
            updatedAt: timestamp
        };

        tasks.push(task);
        return clone(task);
    }

    function updateTask(taskId, input) {
        const normalizedTaskId = requiredText(taskId, 'Идентификатор задачи');
        const task = tasks.find(function (item) {
            return item.id === normalizedTaskId;
        });
        if (!task) {
            throw new Error('Задача с указанным идентификатором не найдена.');
        }

        const editableFields = validateEditableFields(input, task.projectId);
        task.title = editableFields.title;
        task.description = editableFields.description;
        task.assigneeId = editableFields.assigneeId;
        task.updatedAt = new Date().toISOString();

        return clone(task);
    }

    function deleteTask(taskId) {
        const normalizedTaskId = requiredText(taskId, 'Идентификатор задачи');
        const index = tasks.findIndex(function (item) {
            return item.id === normalizedTaskId;
        });
        if (index === -1) {
            throw new Error('Задача с указанным идентификатором не найдена.');
        }

        const deletedTask = tasks.splice(index, 1)[0];
        return clone(deletedTask);
    }

    window.taskData = {
        getAssigneesForProject,
        getAssigneeById,
        getTasksForEvent,
        getTaskById,
        getTaskCountForEvent,
        createTask,
        updateTask,
        deleteTask
    };
})(window);
