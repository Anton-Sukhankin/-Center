(function (global) {
    'use strict';

    const MODES = Object.freeze({
        CLOSED: 'closed',
        EVENT_DETAIL: 'event-detail',
        TASK_CREATE: 'task-create',
        TASK_EDIT: 'task-edit'
    });

    const SELECTORS = Object.freeze({
        drawer: '#event-drawer',
        title: '#event-drawer-title',
        body: '#event-drawer-body',
        footer: '#event-drawer-footer',
        close: '#close-event-drawer-btn'
    });

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function assigneeName(assignee) {
        return assignee?.displayName || assignee?.fullName || assignee?.name || '';
    }

    function resolveEventTitle(event) {
        return event?.listTitle || event?.title || 'Событие без названия';
    }

    function createController(options = {}) {
        const {
            taskData,
            getEventById,
            renderEventDrawer,
            renderEventFeed,
            closeConflictingPanels,
            refreshIcons
        } = options;

        if (!taskData) throw new Error('SCenterTasks: не передан taskData.');
        if (typeof getEventById !== 'function') throw new Error('SCenterTasks: не передан getEventById.');
        if (typeof renderEventDrawer !== 'function') throw new Error('SCenterTasks: не передан renderEventDrawer.');

        const drawer = document.querySelector(SELECTORS.drawer);
        const titleNode = document.querySelector(SELECTORS.title);
        const bodyNode = document.querySelector(SELECTORS.body);
        const footerNode = document.querySelector(SELECTORS.footer);
        const closeNode = document.querySelector(SELECTORS.close);

        if (!drawer || !titleNode || !bodyNode || !footerNode) {
            throw new Error('SCenterTasks: разметка event drawer не найдена.');
        }

        let mode = MODES.CLOSED;
        let activeEventId = null;
        let activeTaskId = null;
        let draft = null;
        let createEntry = 'footer';
        let selectedTeamAssigneeId = '';
        let teamReturnTarget = null;
        let destroyed = false;

        const callRefreshIcons = () => {
            if (typeof refreshIcons === 'function') refreshIcons();
        };

        function ensurePortals() {
            let dropdown = document.getElementById('task-assignee-dropdown');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.id = 'task-assignee-dropdown';
                dropdown.className = 'task-assignee-dropdown';
                dropdown.setAttribute('role', 'listbox');
                dropdown.setAttribute('aria-label', 'Ответственные');
                dropdown.hidden = true;
                document.body.appendChild(dropdown);
            }

            let layer = document.getElementById('task-project-team-layer');
            if (!layer) {
                layer = document.createElement('div');
                layer.id = 'task-project-team-layer';
                layer.className = 'task-project-team-layer';
                layer.hidden = true;
                layer.innerHTML = `
                    <button
                        class="task-project-team-hit-area"
                        type="button"
                        data-task-modal-action="cancel"
                        aria-label="Закрыть окно команды проекта"></button>
                    <section
                        class="task-project-team-modal"
                        id="task-project-team-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="task-project-team-title"
                        tabindex="-1">
                        <header class="task-project-team-header">
                            <h2 id="task-project-team-title">Команда проекта</h2>
                            <button
                                class="task-project-team-close"
                                type="button"
                                data-task-modal-action="cancel"
                                aria-label="Закрыть окно команды проекта">
                                <i data-lucide="x" aria-hidden="true"></i>
                            </button>
                        </header>
                        <div class="task-project-team-body">
                            <div class="task-project-team-scroll">
                                <table class="task-project-team-table">
                                    <thead>
                                        <tr>
                                            <th class="task-project-team-radio-column" aria-label="Выбор"></th>
                                            <th>Фамилия, имя и отчество</th>
                                            <th>Роль</th>
                                            <th>Должность</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody id="task-project-team-table-body"></tbody>
                                </table>
                            </div>
                        </div>
                        <footer class="task-project-team-footer">
                            <button class="footer-btn" type="button" data-task-modal-action="cancel">Отмена</button>
                            <button
                                class="footer-btn footer-btn-primary"
                                id="task-project-team-assign"
                                type="button"
                                data-task-modal-action="assign"
                                disabled
                                aria-disabled="true">Назначить</button>
                        </footer>
                    </section>`;
                document.body.appendChild(layer);
            }

            let live = document.getElementById('task-feature-status');
            if (!live) {
                live = document.createElement('div');
                live.id = 'task-feature-status';
                live.className = 'task-visually-hidden';
                live.setAttribute('role', 'status');
                live.setAttribute('aria-live', 'polite');
                live.setAttribute('aria-atomic', 'true');
                document.body.appendChild(live);
            }

            return { dropdown, layer, live };
        }

        const portals = ensurePortals();

        function announce(message) {
            portals.live.textContent = '';
            window.requestAnimationFrame(() => {
                portals.live.textContent = message;
            });
        }

        function isTaskMode() {
            return mode === MODES.TASK_CREATE || mode === MODES.TASK_EDIT;
        }

        function setMode(nextMode) {
            mode = nextMode;
            drawer.dataset.taskMode = nextMode;
            const taskMode = nextMode === MODES.TASK_CREATE || nextMode === MODES.TASK_EDIT;
            drawer.setAttribute('aria-label', nextMode === MODES.TASK_CREATE
                ? 'Создание задачи'
                : nextMode === MODES.TASK_EDIT
                    ? 'Карточка задачи'
                    : 'Детальная карточка события');
            closeNode?.setAttribute('aria-label', taskMode
                ? 'Вернуться к карточке события'
                : 'Закрыть детальную карточку события');
            bodyNode.classList.toggle('task-drawer-body', taskMode);
            footerNode.classList.toggle('task-drawer-footer', taskMode);
        }

        function getActiveEvent() {
            return activeEventId ? getEventById(activeEventId) : null;
        }

        function getProjectId(event = getActiveEvent()) {
            return event?.projectId || event?.project?.id || '*';
        }

        function getAssignees(event = getActiveEvent()) {
            const items = taskData.getAssigneesForProject(getProjectId(event));
            return Array.isArray(items) ? items.filter((item) => item.active !== false) : [];
        }

        function getAssigneeById(id) {
            if (!id) return null;
            return taskData.getAssigneeById(id) || null;
        }

        function createDraft(event, task = null) {
            return {
                title: task?.title || '',
                description: task?.description || '',
                assigneeId: task?.assigneeId || '',
                sourceEventId: event.id,
                projectId: task?.projectId || getProjectId(event)
            };
        }

        function isDropdownOpen() {
            return !portals.dropdown.hidden;
        }

        function renderDropdown() {
            portals.dropdown.innerHTML = getAssignees().map((assignee) => `
                <div
                    class="task-assignee-option"
                    role="option"
                    tabindex="-1"
                    data-assignee-id="${escapeHtml(assignee.id)}"
                    aria-selected="${draft?.assigneeId === assignee.id ? 'true' : 'false'}">
                    ${escapeHtml(assigneeName(assignee))}
                </div>`).join('');
        }

        function positionDropdown() {
            const trigger = document.getElementById('task-assignee-trigger');
            if (!trigger || !isDropdownOpen()) return;

            const gap = 6;
            const margin = 12;
            const maximum = 250;
            const rect = trigger.getBoundingClientRect();
            const below = Math.max(0, window.innerHeight - rect.bottom - gap - margin);
            const above = Math.max(0, rect.top - gap - margin);
            const required = Math.min(maximum, portals.dropdown.scrollHeight);
            const opensUp = below < required && above > below;
            const available = Math.max(40, Math.min(maximum, opensUp ? above : below));

            portals.dropdown.style.left = `${rect.left}px`;
            portals.dropdown.style.width = `${rect.width}px`;
            portals.dropdown.style.maxHeight = `${available}px`;
            portals.dropdown.classList.toggle('opens-up', opensUp);
            portals.dropdown.style.top = opensUp
                ? `${Math.max(margin, rect.top - gap - Math.min(required, available))}px`
                : `${rect.bottom + gap}px`;
        }

        function openDropdown() {
            if (!isTaskMode()) return;
            const trigger = document.getElementById('task-assignee-trigger');
            if (!trigger) return;

            renderDropdown();
            portals.dropdown.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            positionDropdown();
            const selected = portals.dropdown.querySelector('[aria-selected="true"]');
            (selected || portals.dropdown.querySelector('[role="option"]'))?.focus();
        }

        function closeDropdown({ restoreFocus = false } = {}) {
            if (!isDropdownOpen()) return;
            portals.dropdown.hidden = true;
            portals.dropdown.classList.remove('opens-up');
            const trigger = document.getElementById('task-assignee-trigger');
            trigger?.setAttribute('aria-expanded', 'false');
            if (restoreFocus) trigger?.focus();
        }

        function setAssignee(id, message) {
            if (!draft) return;
            const assignee = getAssigneeById(id);
            draft.assigneeId = assignee?.id || '';
            const hidden = document.getElementById('task-assignee');
            const value = document.getElementById('task-assignee-value');
            if (hidden) hidden.value = draft.assigneeId;
            if (value) {
                value.textContent = assigneeName(assignee) || 'Выберите ответственного';
                value.classList.toggle('is-placeholder', !assignee);
            }
            if (assignee) clearFieldError('assigneeId');
            if (message) announce(message);
        }

        function selectDropdownAssignee(id) {
            const assignee = getAssigneeById(id);
            if (!assignee) return;
            setAssignee(id, `Ответственным выбран ${assigneeName(assignee)}.`);
            closeDropdown({ restoreFocus: true });
        }

        function isTeamModalOpen() {
            return !portals.layer.hidden;
        }

        function renderTeamTable() {
            const body = document.getElementById('task-project-team-table-body');
            if (!body) return;
            body.innerHTML = getAssignees().map((assignee) => {
                const selected = selectedTeamAssigneeId === assignee.id;
                return `
                    <tr
                        data-assignee-id="${escapeHtml(assignee.id)}"
                        class="${selected ? 'is-selected' : ''}"
                        aria-selected="${selected ? 'true' : 'false'}">
                        <td class="task-project-team-radio-cell">
                            <input
                                class="task-project-team-radio"
                                type="radio"
                                name="task-project-team-assignee"
                                value="${escapeHtml(assignee.id)}"
                                aria-label="Выбрать ${escapeHtml(assigneeName(assignee))}"
                                ${selected ? 'checked' : ''}>
                        </td>
                        <td>
                            <div class="task-project-team-person">
                                <img
                                    class="task-project-team-avatar"
                                    src="${escapeHtml(assignee.avatarSrc || '')}"
                                    width="42"
                                    height="42"
                                    alt=""
                                    aria-hidden="true"
                                    loading="lazy">
                                <span class="task-project-team-name">${escapeHtml(assigneeName(assignee))}</span>
                            </div>
                        </td>
                        <td>${escapeHtml(assignee.role || '')}</td>
                        <td>${escapeHtml(assignee.position || '')}</td>
                        <td><a href="mailto:${escapeHtml(assignee.email || '')}">${escapeHtml(assignee.email || '')}</a></td>
                    </tr>`;
            }).join('');
        }

        function selectTeamAssignee(id) {
            if (!getAssignees().some((item) => item.id === id)) return;
            selectedTeamAssigneeId = id;
            portals.layer.querySelectorAll('tr[data-assignee-id]').forEach((row) => {
                const selected = row.dataset.assigneeId === id;
                row.classList.toggle('is-selected', selected);
                row.setAttribute('aria-selected', selected ? 'true' : 'false');
                const radio = row.querySelector('.task-project-team-radio');
                if (radio) radio.checked = selected;
            });
            const assign = document.getElementById('task-project-team-assign');
            if (assign) {
                assign.disabled = false;
                assign.setAttribute('aria-disabled', 'false');
            }
        }

        function openTeamModal(trigger) {
            if (!isTaskMode()) return;
            closeDropdown();
            teamReturnTarget = trigger || document.activeElement;
            selectedTeamAssigneeId = '';
            renderTeamTable();
            const assign = document.getElementById('task-project-team-assign');
            if (assign) {
                assign.disabled = true;
                assign.setAttribute('aria-disabled', 'true');
            }
            portals.layer.hidden = false;
            portals.layer.classList.add('active');
            drawer.setAttribute('aria-modal', 'false');
            teamReturnTarget?.setAttribute('aria-expanded', 'true');
            portals.layer.querySelector('.task-project-team-close')?.focus();
            callRefreshIcons();
            announce('Открыто окно выбора участника из команды проекта.');
        }

        function closeTeamModal({ restoreFocus = true } = {}) {
            if (!isTeamModalOpen()) return;
            portals.layer.classList.remove('active');
            portals.layer.hidden = true;
            drawer.setAttribute('aria-modal', 'true');
            selectedTeamAssigneeId = '';
            const target = teamReturnTarget;
            teamReturnTarget = null;
            target?.setAttribute('aria-expanded', 'false');
            if (restoreFocus && target?.isConnected) target.focus();
            announce('Окно команды проекта закрыто.');
        }

        function assignTeamAssignee() {
            if (!selectedTeamAssigneeId || !draft) return;
            const assignee = getAssigneeById(selectedTeamAssigneeId);
            if (!assignee) return;
            setAssignee(assignee.id);
            closeTeamModal();
            announce(`Ответственным назначен ${assigneeName(assignee)}.`);
        }

        function renderFormBody() {
            const assignee = getAssigneeById(draft.assigneeId);
            bodyNode.innerHTML = `
                <form class="task-create-form" id="task-create-form" novalidate>
                    <div class="task-form-warning" id="task-form-warning" role="alert" hidden>
                        <i data-lucide="circle-alert" aria-hidden="true"></i>
                        <span>Заполните обязательные поля</span>
                    </div>
                    <div class="task-form-field">
                        <div class="task-form-field-head">
                            <label class="task-form-label" for="task-title">Название <span aria-hidden="true">*</span></label>
                            <span class="task-form-counter" id="task-title-counter">${draft.title.length}/128</span>
                        </div>
                        <input
                            class="task-form-control"
                            id="task-title"
                            name="title"
                            type="text"
                            maxlength="128"
                            placeholder="Введите название задачи"
                            value="${escapeHtml(draft.title)}"
                            autocomplete="off"
                            required
                            aria-required="true"
                            aria-describedby="task-title-error">
                        <span class="task-form-error" id="task-title-error" hidden></span>
                    </div>
                    <div class="task-form-field">
                        <div class="task-form-field-head">
                            <label class="task-form-label" for="task-description">Описание <span aria-hidden="true">*</span></label>
                            <span class="task-form-counter" id="task-description-counter">${draft.description.length}/4000</span>
                        </div>
                        <textarea
                            class="task-form-control task-form-textarea"
                            id="task-description"
                            name="description"
                            maxlength="4000"
                            rows="5"
                            placeholder="Опишите ожидаемый результат и необходимые действия"
                            required
                            aria-required="true"
                            aria-describedby="task-description-error">${escapeHtml(draft.description)}</textarea>
                        <span class="task-form-error" id="task-description-error" hidden></span>
                    </div>
                    <div class="task-form-field">
                        <div class="task-form-field-head">
                            <label class="task-form-label" for="task-assignee-trigger">Ответственный <span aria-hidden="true">*</span></label>
                        </div>
                        <button
                            class="task-form-control task-form-select-trigger"
                            id="task-assignee-trigger"
                            type="button"
                            role="combobox"
                            aria-haspopup="listbox"
                            aria-controls="task-assignee-dropdown"
                            aria-expanded="false"
                            aria-required="true"
                            aria-describedby="task-assignee-error">
                            <span
                                class="task-form-select-value ${assignee ? '' : 'is-placeholder'}"
                                id="task-assignee-value">${escapeHtml(assigneeName(assignee) || 'Выберите ответственного')}</span>
                            <i data-lucide="chevron-down" aria-hidden="true"></i>
                        </button>
                        <input id="task-assignee" name="assigneeId" type="hidden" value="${escapeHtml(draft.assigneeId)}">
                        <span class="task-form-error" id="task-assignee-error" hidden></span>
                        <button
                            class="footer-btn task-form-project-team-action"
                            type="button"
                            data-task-action="assign-from-project-team"
                            aria-controls="task-project-team-modal"
                            aria-haspopup="dialog"
                            aria-expanded="false">
                            <i data-lucide="user-plus" aria-hidden="true"></i>
                            Назначить из команды проекта
                        </button>
                    </div>
                </form>`;
        }

        function renderFormFooter() {
            const edit = mode === MODES.TASK_EDIT;
            footerNode.innerHTML = `
                <span class="drawer-footer-spacer" aria-hidden="true"></span>
                <button class="footer-btn task-create-cancel" type="button" data-task-action="cancel-task-form">Отмена</button>
                <button
                    class="footer-btn footer-btn-primary task-create-submit"
                    type="button"
                    data-task-action="${edit ? 'save-task' : 'submit-task'}">${edit ? 'Сохранить' : 'Создать'}</button>`;
        }

        function renderTaskShell(event, task = null) {
            if (!event) return;
            if (typeof closeConflictingPanels === 'function') closeConflictingPanels();
            closeDropdown();
            closeTeamModal({ restoreFocus: false });

            activeEventId = event.id;
            activeTaskId = task?.id || null;
            draft = createDraft(event, task);
            setMode(task ? MODES.TASK_EDIT : MODES.TASK_CREATE);

            titleNode.innerHTML = `
                <div class="event-detail-hero task-create-hero">
                    <img src="assets/images/task-create-header.png" alt="" class="event-detail-hero-image task-create-hero-image">
                </div>
                <div class="event-detail-heading task-create-heading">
                    <div class="drawer-header-title task-create-title" id="task-create-title" tabindex="-1">${task ? 'Карточка задачи' : 'Создать задачу'}</div>
                    <div class="drawer-header-subtitle task-create-context">
                        <div class="task-create-context-row task-create-origin-row">
                            <span class="drawer-header-project-label">Событие-основание:</span>
                            <span class="drawer-header-project-value">${escapeHtml(resolveEventTitle(event))}</span>
                        </div>
                    </div>
                </div>`;
            renderFormBody();
            renderFormFooter();
            callRefreshIcons();
            document.getElementById('task-create-title')?.focus();
            announce(task
                ? `Открыта карточка задачи «${task.title}» для редактирования.`
                : 'Открыт интерфейс создания задачи на основании текущего события.');
        }

        function getFieldNodes(fieldName) {
            const map = {
                title: [document.getElementById('task-title'), document.getElementById('task-title-error')],
                description: [document.getElementById('task-description'), document.getElementById('task-description-error')],
                assigneeId: [document.getElementById('task-assignee-trigger'), document.getElementById('task-assignee-error')]
            };
            const [control, error] = map[fieldName] || [];
            return { control, error };
        }

        function updateWarning() {
            const warning = document.getElementById('task-form-warning');
            if (warning) warning.hidden = !bodyNode.querySelector('.task-form-error:not([hidden])');
        }

        function clearFieldError(fieldName) {
            const { control, error } = getFieldNodes(fieldName);
            control?.classList.remove('is-invalid');
            control?.removeAttribute('aria-invalid');
            if (error) {
                error.hidden = true;
                error.textContent = '';
            }
            updateWarning();
        }

        function validateDraft() {
            const errors = {};
            const title = draft?.title.trim() || '';
            const description = draft?.description.trim() || '';
            if (!title) errors.title = 'Введите название задачи';
            else if (title.length > 128) errors.title = 'Сократите название до 128 символов';
            if (!description) errors.description = 'Добавьте описание задачи';
            else if (description.length > 4000) errors.description = 'Сократите описание до 4000 символов';
            if (!draft?.assigneeId || !getAssigneeById(draft.assigneeId)) errors.assigneeId = 'Выберите ответственного';
            return errors;
        }

        function showValidationErrors(errors) {
            ['title', 'description', 'assigneeId'].forEach((fieldName) => {
                const { control, error } = getFieldNodes(fieldName);
                const message = errors[fieldName];
                control?.classList.toggle('is-invalid', Boolean(message));
                if (message) control?.setAttribute('aria-invalid', 'true');
                else control?.removeAttribute('aria-invalid');
                if (error) {
                    error.textContent = message || '';
                    error.hidden = !message;
                }
            });
            updateWarning();
            const first = ['title', 'description', 'assigneeId'].find((fieldName) => errors[fieldName]);
            getFieldNodes(first).control?.focus();
        }

        function enterEventDetail(eventOrId) {
            const event = typeof eventOrId === 'string' ? getEventById(eventOrId) : eventOrId;
            closeDropdown();
            closeTeamModal({ restoreFocus: false });
            draft = null;
            activeTaskId = null;
            activeEventId = event?.id || null;
            setMode(event ? MODES.EVENT_DETAIL : MODES.CLOSED);
            return event || null;
        }

        function restoreEventDetail({ focusTaskId = null } = {}) {
            const event = getActiveEvent();
            const entry = createEntry;
            enterEventDetail(event);
            if (!event) return false;
            renderEventDrawer(event);
            callRefreshIcons();
            window.requestAnimationFrame(() => {
                const target = focusTaskId
                    ? drawer.querySelector(`[data-task-action="edit-task"][data-task-id="${CSS.escape(focusTaskId)}"]`)
                    : drawer.querySelector(`[data-task-create-entry="${CSS.escape(entry)}"]`);
                target?.focus();
            });
            return true;
        }

        function submitDraft() {
            if (!isTaskMode() || !draft) return;
            const wasEdit = mode === MODES.TASK_EDIT;
            const errors = validateDraft();
            if (Object.keys(errors).length) {
                showValidationErrors(errors);
                announce('Задача не сохранена: заполните обязательные поля.');
                return;
            }

            const input = {
                title: draft.title.trim(),
                description: draft.description.trim(),
                assigneeId: draft.assigneeId,
                sourceEventId: draft.sourceEventId,
                projectId: draft.projectId
            };

            try {
                const task = wasEdit
                    ? taskData.updateTask(activeTaskId, input)
                    : taskData.createTask(input);
                if (!task) throw new Error('Слой данных не вернул созданную задачу.');
                if (typeof renderEventFeed === 'function') renderEventFeed();
                restoreEventDetail({ focusTaskId: task.id });
                announce(wasEdit
                    ? `Изменения задачи «${task.title}» сохранены.`
                    : `Задача «${task.title}» создана и связана с событием.`);
            } catch (error) {
                announce(error?.message || 'Не удалось сохранить задачу.');
            }
        }

        function getTaskCountForEvent(eventId) {
            return Number(taskData.getTaskCountForEvent(eventId)) || 0;
        }

        function renderLinkedTaskCards(eventOrId) {
            const eventId = typeof eventOrId === 'string' ? eventOrId : eventOrId?.id;
            if (!eventId) return '';
            const tasks = taskData.getTasksForEvent(eventId);
            if (!Array.isArray(tasks) || !tasks.length) return '';

            return `
                <section class="event-linked-tasks" aria-label="Задачи по событию">
                    <div class="event-linked-tasks-list">
                        ${tasks.map((task) => {
                            const assignee = getAssigneeById(task.assigneeId);
                            return `
                                <article
                                    class="event-task-card"
                                    data-task-id="${escapeHtml(task.id)}"
                                    aria-label="Созданная задача ${escapeHtml(task.title)}">
                                    <span class="event-task-card-icon"><i data-lucide="clipboard-check" aria-hidden="true"></i></span>
                                    <span class="event-task-card-content">
                                        <span class="event-task-card-title">${escapeHtml(task.title)}</span>
                                        <span class="event-task-card-meta">
                                            <span class="event-task-card-meta-label">Ответственный:</span>
                                            ${escapeHtml(assigneeName(assignee) || 'Не назначен')}
                                        </span>
                                    </span>
                                    <span class="event-task-card-actions" aria-label="Действия с задачей">
                                        <button
                                            class="event-task-card-action"
                                            type="button"
                                            data-task-action="edit-task"
                                            data-task-id="${escapeHtml(task.id)}"
                                            aria-label="Редактировать задачу ${escapeHtml(task.title)}">
                                            <i data-lucide="pencil" aria-hidden="true"></i>
                                        </button>
                                        <button
                                            class="event-task-card-action event-task-card-action-danger"
                                            type="button"
                                            data-task-action="delete-task"
                                            data-task-id="${escapeHtml(task.id)}"
                                            aria-label="Удалить задачу ${escapeHtml(task.title)}">
                                            <i data-lucide="trash-2" aria-hidden="true"></i>
                                        </button>
                                    </span>
                                </article>`;
                        }).join('')}
                    </div>
                </section>`;
        }

        function handleCloseRequest() {
            if (!isTaskMode()) return false;
            closeDropdown();
            closeTeamModal({ restoreFocus: false });
            restoreEventDetail({ focusTaskId: activeTaskId });
            return true;
        }

        function reset() {
            closeDropdown();
            closeTeamModal({ restoreFocus: false });
            draft = null;
            activeTaskId = null;
            activeEventId = null;
            createEntry = 'footer';
            setMode(MODES.CLOSED);
        }

        function openTask(taskId) {
            const task = taskData.getTaskById(taskId);
            const event = task ? getEventById(task.sourceEventId) : null;
            if (!task || !event) return;
            renderTaskShell(event, task);
        }

        function deleteTask(taskId) {
            if (typeof taskData.deleteTask !== 'function') {
                announce('Удаление задач недоступно в текущем слое данных.');
                return;
            }

            try {
                const deletedTask = taskData.deleteTask(taskId);
                if (typeof renderEventFeed === 'function') renderEventFeed();
                restoreEventDetail();
                announce(`Задача «${deletedTask.title}» удалена.`);
            } catch (error) {
                announce(error?.message || 'Не удалось удалить задачу.');
            }
        }

        function handleDrawerClick(event) {
            const trigger = event.target.closest('#task-assignee-trigger');
            if (trigger && drawer.contains(trigger)) {
                if (isDropdownOpen()) closeDropdown({ restoreFocus: true });
                else openDropdown();
                return;
            }

            const action = event.target.closest('[data-task-action]');
            if (!action || !drawer.contains(action)) return;
            const name = action.dataset.taskAction;

            if ((name === 'create' || name === 'create-task') && mode === MODES.EVENT_DETAIL) {
                const eventId = action.dataset.eventId || activeEventId;
                const sourceEvent = getEventById(eventId);
                if (!sourceEvent) return;
                createEntry = action.dataset.taskCreateEntry || 'footer';
                renderTaskShell(sourceEvent);
            } else if ((name === 'open-task' || name === 'edit-task') && mode === MODES.EVENT_DETAIL) {
                openTask(action.dataset.taskId);
            } else if (name === 'delete-task' && mode === MODES.EVENT_DETAIL) {
                deleteTask(action.dataset.taskId);
            } else if (name === 'cancel-task-form' && isTaskMode()) {
                restoreEventDetail({ focusTaskId: activeTaskId });
            } else if (name === 'submit-task' && mode === MODES.TASK_CREATE) {
                submitDraft();
            } else if (name === 'save-task' && mode === MODES.TASK_EDIT) {
                submitDraft();
            } else if (name === 'assign-from-project-team' && isTaskMode()) {
                openTeamModal(action);
            }
        }

        function handleDrawerKeydown(event) {
            if (event.target.closest('#task-assignee-trigger') && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                event.preventDefault();
                openDropdown();
                return;
            }
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const action = event.target.closest('[data-task-action][role="button"]');
            if (!action || !drawer.contains(action)) return;
            event.preventDefault();
            action.click();
        }

        function handleInput(event) {
            if (!isTaskMode() || !draft) return;
            if (event.target.id === 'task-title') {
                draft.title = event.target.value;
                document.getElementById('task-title-counter').textContent = `${draft.title.length}/128`;
                if (draft.title.trim()) clearFieldError('title');
            } else if (event.target.id === 'task-description') {
                draft.description = event.target.value;
                document.getElementById('task-description-counter').textContent = `${draft.description.length}/4000`;
                if (draft.description.trim()) clearFieldError('description');
            }
        }

        function handlePortalClick(event) {
            const option = event.target.closest('.task-assignee-option[data-assignee-id]');
            if (option) {
                selectDropdownAssignee(option.dataset.assigneeId);
                return;
            }
            const modalAction = event.target.closest('[data-task-modal-action]');
            if (modalAction) {
                if (modalAction.dataset.taskModalAction === 'assign') assignTeamAssignee();
                else closeTeamModal();
                return;
            }
            if (event.target.closest('a')) return;
            const row = event.target.closest('#task-project-team-table-body tr[data-assignee-id]');
            if (row) selectTeamAssignee(row.dataset.assigneeId);
        }

        function handlePortalChange(event) {
            const radio = event.target.closest('.task-project-team-radio');
            if (radio) selectTeamAssignee(radio.value);
        }

        function trapModalFocus(event) {
            if (event.key !== 'Tab' || !isTeamModalOpen()) return;
            const modal = document.getElementById('task-project-team-modal');
            const focusable = [...modal.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')];
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (document.activeElement === modal) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
            } else if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        function handleDocumentKeydown(event) {
            if (event.key === 'Escape' && isDropdownOpen()) {
                event.preventDefault();
                event.stopImmediatePropagation();
                closeDropdown({ restoreFocus: true });
                return;
            }
            if (event.key === 'Escape' && isTeamModalOpen()) {
                event.preventDefault();
                event.stopImmediatePropagation();
                closeTeamModal();
                return;
            }
            if (event.key === 'Escape' && isTaskMode()) {
                event.preventDefault();
                event.stopImmediatePropagation();
                handleCloseRequest();
                return;
            }
            trapModalFocus(event);
        }

        function handleDropdownKeydown(event) {
            const options = [...portals.dropdown.querySelectorAll('[role="option"]')];
            const current = options.indexOf(document.activeElement);
            if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && options.length) {
                event.preventDefault();
                const delta = event.key === 'ArrowDown' ? 1 : -1;
                options[(current + delta + options.length) % options.length].focus();
            } else if (event.key === 'Home' && options.length) {
                event.preventDefault();
                options[0].focus();
            } else if (event.key === 'End' && options.length) {
                event.preventDefault();
                options[options.length - 1].focus();
            } else if (event.key === 'Enter' || event.key === ' ') {
                const option = event.target.closest('[data-assignee-id]');
                if (!option) return;
                event.preventDefault();
                selectDropdownAssignee(option.dataset.assigneeId);
            }
        }

        function handleDocumentClick(event) {
            if (!isDropdownOpen()) return;
            if (event.target.closest('#task-assignee-trigger') || event.target.closest('#task-assignee-dropdown')) return;
            closeDropdown();
        }

        function handleSubmit(event) {
            if (event.target.id !== 'task-create-form') return;
            event.preventDefault();
            submitDraft();
        }

        drawer.addEventListener('click', handleDrawerClick);
        drawer.addEventListener('keydown', handleDrawerKeydown);
        drawer.addEventListener('input', handleInput);
        drawer.addEventListener('submit', handleSubmit);
        bodyNode.addEventListener('scroll', positionDropdown, { passive: true });
        portals.dropdown.addEventListener('click', handlePortalClick);
        portals.dropdown.addEventListener('keydown', handleDropdownKeydown);
        portals.layer.addEventListener('click', handlePortalClick);
        portals.layer.addEventListener('change', handlePortalChange);
        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleDocumentKeydown, true);
        window.addEventListener('resize', positionDropdown);

        function destroy() {
            if (destroyed) return;
            reset();
            drawer.removeEventListener('click', handleDrawerClick);
            drawer.removeEventListener('keydown', handleDrawerKeydown);
            drawer.removeEventListener('input', handleInput);
            drawer.removeEventListener('submit', handleSubmit);
            bodyNode.removeEventListener('scroll', positionDropdown);
            portals.dropdown.removeEventListener('click', handlePortalClick);
            portals.dropdown.removeEventListener('keydown', handleDropdownKeydown);
            portals.layer.removeEventListener('click', handlePortalClick);
            portals.layer.removeEventListener('change', handlePortalChange);
            document.removeEventListener('click', handleDocumentClick);
            document.removeEventListener('keydown', handleDocumentKeydown, true);
            window.removeEventListener('resize', positionDropdown);
            destroyed = true;
        }

        setMode(MODES.CLOSED);

        return Object.freeze({
            enterEventDetail,
            getTaskCountForEvent,
            renderLinkedTaskCards,
            handleCloseRequest,
            reset,
            destroy,
            getMode: () => mode
        });
    }

    global.SCenterTasks = Object.freeze({
        MODES,
        createController
    });
})(window);
