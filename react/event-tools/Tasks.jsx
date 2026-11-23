import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { assetUrl } from '../app/assets.js';
import Icon from '../ui/Icon.jsx';
import { CloseButton } from '../ui/LightlineButton.jsx';
import { useAnimatedDialog } from '../ui/useAnimatedDialog.js';
import teamSearchEmpty from '../../assets/images/team-search-empty.webp';
import './event-tools.css';

const formId = 'event-task-form';
const assigneeName = (assignee) => assignee?.displayName || assignee?.fullName || assignee?.name || '';
const normalizeTeamSearch = (value) => value.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');

export function TaskHeader({ event, task, inactive }) {
    return (
            <div className="event-heading-copy" aria-hidden={inactive || undefined}>
                <h2 data-dialog-title className="drawer-header-title" id="task-create-title">
                    {task ? 'Карточка задачи' : 'Создать задачу'}
                </h2>
                <div className="drawer-header-subtitle task-create-context">
                    <div className="task-create-context-row task-create-origin-row">
                        <span className="drawer-header-project-label">Событие-основание:</span>
                        <span className="drawer-header-project-value">
                            {event.listTitle || event.title || 'Событие без названия'}
                        </span>
                    </div>
                </div>
            </div>
    );
}

export function TaskFooter({ task, onCancel }) {
    return (
        <>
            <span className="drawer-footer-spacer" aria-hidden="true" />
            <button className="footer-btn task-create-cancel" type="button"
                data-task-action="cancel-task-form" onClick={onCancel}>Отмена</button>
            <button className="footer-btn footer-btn-primary task-create-submit" type="submit"
                form={formId} data-task-action={task ? 'save-task' : 'submit-task'}>
                {task ? 'Сохранить' : 'Создать'}
            </button>
        </>
    );
}

function TaskTextField({ type, label, value, maxLength, placeholder, error, inputRef, onChange }) {
    const id = `task-${type}`;
    const commonProps = {
        ref: inputRef,
        id,
        name: type,
        value,
        maxLength,
        placeholder,
        required: true,
        'aria-invalid': Boolean(error) || undefined,
        'aria-describedby': error ? `${id}-error` : undefined,
        onChange: (event) => onChange(event.target.value),
    };
    return (
        <div className="task-form-field">
            <div className="task-form-field-head">
                <label className="task-form-label" htmlFor={id}>{label} <span aria-hidden="true">*</span></label>
            </div>
            {type === 'description' ? (
                <textarea {...commonProps} rows={5}
                    className={`task-form-control task-form-textarea ${error ? 'is-invalid' : ''}`} />
            ) : (
                <input {...commonProps} type="text" autoComplete="off"
                    className={`task-form-control ${error ? 'is-invalid' : ''}`} />
            )}
            <span className="task-form-counter" id={`${id}-counter`}>{value.length}/{maxLength}</span>
            {error && <span className="task-form-error" id={`${id}-error`}>{error}</span>}
        </div>
    );
}

function AssigneeDropdown({ assignees, selectedId, anchorRef, nextRef, onSelect, onClose }) {
    const dropdownRef = useRef(null);
    const [position, setPosition] = useState();

    useLayoutEffect(() => {
        const dropdown = dropdownRef.current;
        const anchor = anchorRef.current;
        if (!dropdown || !anchor) return;

        function positionDropdown() {
            const rect = anchor.getBoundingClientRect();
            const gap = 6;
            const margin = 12;
            const maximum = 250;
            const below = Math.max(0, window.innerHeight - rect.bottom - gap - margin);
            const above = Math.max(0, rect.top - gap - margin);
            const needed = Math.min(maximum, assignees.length * 40 + 2);
            const opensUp = below < needed && above > below;
            const maxHeight = Math.max(40, Math.min(maximum, opensUp ? above : below));
            const top = opensUp ? Math.max(margin, rect.top - gap - Math.min(needed, maxHeight)) : rect.bottom + gap;
            const width = Math.min(window.innerWidth - margin * 2, Math.max(rect.width + 48, 380));
            setPosition({ left: Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin)), width, top, maxHeight });
        }

        positionDropdown();
        const drawerBody = anchor.closest('.drawer-body');
        drawerBody?.addEventListener('scroll', positionDropdown, { passive: true });
        window.addEventListener('resize', positionDropdown);
        return () => {
            drawerBody?.removeEventListener('scroll', positionDropdown);
            window.removeEventListener('resize', positionDropdown);
        };
    }, [anchorRef, assignees.length]);

    useLayoutEffect(() => {
        const dropdown = dropdownRef.current;
        const target = dropdown?.querySelector('[aria-selected="true"]') || dropdown?.querySelector('[role="option"]');
        (target || dropdown)?.focus({ preventScroll: true });
    }, []);

    useLayoutEffect(() => {
        function closeFromOutside(event) {
            if (!anchorRef.current?.contains(event.target) && !dropdownRef.current?.contains(event.target)) onClose();
        }
        document.addEventListener('pointerdown', closeFromOutside);
        return () => document.removeEventListener('pointerdown', closeFromOutside);
    }, [anchorRef, onClose]);

    function handleKeyDown(event) {
        const options = [...event.currentTarget.querySelectorAll('[role="option"]')];
        const index = options.indexOf(document.activeElement);
        if (event.key === 'Escape' || event.key === 'Tab') {
            event.preventDefault();
            onClose();
            const focusTarget = event.key === 'Tab' && !event.shiftKey ? nextRef.current : anchorRef.current;
            focusTarget?.focus();
            return;
        }
        if (!options.length) return;
        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            (event.key === 'Home' ? options[0] : options.at(-1)).focus();
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            const next = index === -1 ? 0 : (index + direction + options.length) % options.length;
            options[next].focus();
        }
    }

    return createPortal(
        <div id="task-assignee-dropdown" className="task-assignee-dropdown react-task-assignee-dropdown"
            role="listbox" aria-label="Ответственные" tabIndex={-1} style={position}
            ref={dropdownRef} onKeyDown={handleKeyDown}>
            {assignees.length ? assignees.map((assignee) => (
                <button className="task-assignee-option" key={assignee.id} type="button" role="option"
                    tabIndex={-1} data-assignee-id={assignee.id} aria-selected={assignee.id === selectedId}
                    onClick={() => onSelect(assignee)}>
                    <img className="task-project-team-avatar" src={assetUrl(assignee.avatarSrc)} alt="" />
                        <span className="task-contact"><span>{assigneeName(assignee)}</span><small>{assignee.email}</small></span>
                </button>
            )) : <div className="task-assignee-option">Нет доступных ответственных</div>}
        </div>,
        document.body
    );
}

function ProjectTeam({ assignees, anchorRef, onAssign, onClose }) {
    const [selectedId, setSelectedId] = useState('');
    const [search, setSearch] = useState('');
    const { dialogRef: dialog, backdropRef, dismiss } = useAnimatedDialog({
        onClose, source: anchorRef.current, overlayContainsSurface: true
    });
    const close = () => dismiss();
    const terms = normalizeTeamSearch(search).split(/\s+/).filter(Boolean);
    const matches = terms.length ? assignees.filter(assignee => {
        const text = normalizeTeamSearch([assigneeName(assignee), assignee.email, assignee.role, assignee.position].join(' '));
        return terms.every(term => text.includes(term));
    }) : assignees;
    const selected = matches.find((assignee) => assignee.id === selectedId);

    useLayoutEffect(() => {
        const parent = anchorRef.current?.closest('[role="dialog"]');
        const original = parent?.getAttribute('aria-modal');
        parent?.setAttribute('aria-modal', 'false');
        return () => {
            if (original == null) parent?.removeAttribute('aria-modal');
            else parent?.setAttribute('aria-modal', original);
        };
    }, [anchorRef]);

    return createPortal(
        <div className="task-project-team-layer active" id="task-project-team-layer" ref={backdropRef} data-dialog-motion>
            <div className="task-project-team-hit-area" aria-hidden="true" onClick={close} />
            <section className="task-project-team-modal" id="task-project-team-modal"
                role="dialog" aria-modal="true" aria-labelledby="task-project-team-title" tabIndex={-1} ref={dialog} data-dialog-motion>
                <header className="task-project-team-header">
                    <h2 data-dialog-title id="task-project-team-title">Команда проекта</h2>
                    <CloseButton data-initial-focus onClick={close} />
                </header>
                <div className="task-project-team-body">
                    <label className="fd-search-box task-project-team-search">
                        <Icon name="search" />
                        <input type="search" aria-label="Поиск по команде проекта" placeholder="Поиск по команде проекта"
                            value={search} onChange={event => setSearch(event.target.value)} />
                    </label>
                    <div className={`task-project-team-scroll${matches.length ? '' : ' is-empty'}`}>
                        {matches.length ? (
                        <table className="task-project-team-table">
                            <thead>
                                <tr>
                                    <th className="task-project-team-radio-column" aria-label="Выбор" scope="col" />
                                    <th scope="col"><span className="task-contact-heading">ФИО <span>·</span> Почта</span></th>
                                    <th scope="col">Роль</th><th scope="col">Должность</th>
                                </tr>
                            </thead>
                            <tbody id="task-project-team-table-body">
                                {matches.map((assignee) => (
                                    <tr key={assignee.id} data-assignee-id={assignee.id}
                                        className={assignee.id === selectedId ? 'is-selected' : ''}
                                        aria-selected={assignee.id === selectedId}
                                        onClick={(event) => {
                                            if (!event.target.closest('a, input')) setSelectedId(assignee.id);
                                        }}>
                                        <td className="task-project-team-radio-cell">
                                            <input className="task-project-team-radio" type="radio" name="task-project-team-assignee"
                                                aria-label={`Выбрать ${assigneeName(assignee)}`} value={assignee.id}
                                                checked={assignee.id === selectedId} onChange={() => setSelectedId(assignee.id)} />
                                        </td>
                                        <td>
                                            <div className="task-project-team-person">
                                                <img className="task-project-team-avatar" src={assetUrl(assignee.avatarSrc)}
                                                    width={42} height={42} alt="" loading="lazy" />
                                                <span className="task-contact"><span className="task-project-team-name">{assigneeName(assignee)}</span>
                                                    {assignee.email && <a href={`mailto:${assignee.email}`}>{assignee.email}</a>}</span>
                                            </div>
                                        </td>
                                        <td>{assignee.role}</td>
                                        <td>{assignee.position}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        ) : (
                            <div className="task-project-team-empty" role="status">
                                <img src={teamSearchEmpty} width="144" height="96" alt="" />
                                <h3>{assignees.length ? 'Участники не найдены' : 'Нет доступных участников'}</h3>
                                <p>{assignees.length ? 'Проверьте запрос или попробуйте поискать по имени, почте, роли или должности.'
                                    : 'В команде проекта пока нет сотрудников, которых можно назначить.'}</p>
                            </div>
                        )}
                    </div>
                </div>
                <footer className="task-project-team-footer">
                    <button className="footer-btn" type="button" onClick={close}>Отмена</button>
                    <button className="footer-btn footer-btn-primary" id="task-project-team-assign" type="button"
                        disabled={!selected} onClick={() => dismiss(() => onAssign(selected))}>Назначить</button>
                </footer>
            </section>
        </div>,
        document.body
    );
}

export function TaskForm({ event, task, taskData, onSave }) {
    const projectId = task?.projectId || event.projectId || event.project?.id || '*';
    const assignees = useMemo(() => taskData.getAssigneesForProject(projectId)
        .filter((assignee) => assignee.active !== false), [taskData, projectId]);
    const [title, setTitle] = useState(task?.title ?? '');
    const [description, setDescription] = useState(task?.description ?? '');
    const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '');
    const [errors, setErrors] = useState({});
    const [saveError, setSaveError] = useState('');
    const [openPicker, setOpenPicker] = useState(null);
    const [status, setStatus] = useState('');
    const titleRef = useRef(null);
    const descriptionRef = useRef(null);
    const assigneeRef = useRef(null);
    const teamRef = useRef(null);
    const saving = useRef(false);
    const assignee = assignees.find((item) => item.id === assigneeId);
    const dropdownOpen = openPicker === 'dropdown';
    const teamOpen = openPicker === 'team';
    const closePicker = () => setOpenPicker(null);

    function clearError(field) {
        setErrors((previous) => previous[field] ? { ...previous, [field]: undefined } : previous);
    }

    function selectAssignee(selected, fromTeam = false) {
        setAssigneeId(selected.id);
        clearError('assigneeId');
        closePicker();
        if (!fromTeam) assigneeRef.current?.focus();
        setStatus(`Ответственный: ${assigneeName(selected)}.`);
    }

    function submit(eventObject) {
        eventObject.preventDefault();
        if (saving.current) return;
        const nextErrors = {};
        const nextTitle = title.trim();
        const nextDescription = description.trim();
        if (!nextTitle) nextErrors.title = 'Введите название задачи';
        else if (nextTitle.length > 128) nextErrors.title = 'Сократите название до 128 символов';
        if (!nextDescription) nextErrors.description = 'Добавьте описание задачи';
        else if (nextDescription.length > 4000) nextErrors.description = 'Сократите описание до 4000 символов';
        if (!assignee) nextErrors.assigneeId = 'Выберите ответственного';
        setErrors(nextErrors);
        setSaveError('');
        if (Object.keys(nextErrors).length) {
            const firstInvalid = nextErrors.title ? titleRef : nextErrors.description ? descriptionRef : assigneeRef;
            firstInvalid.current?.focus();
            return;
        }
        saving.current = true;
        try {
            onSave({
                title: nextTitle,
                description: nextDescription,
                assigneeId,
                sourceEventId: event.id,
                projectId,
            });
        } catch (error) {
            saving.current = false;
            setSaveError(error?.message || 'Не удалось сохранить задачу.');
        }
    }

    return (
        <form className="task-create-form" id={formId} noValidate onSubmit={submit}>
            {(saveError || Object.values(errors).some(Boolean)) && (
                <div className="task-form-warning" id="task-form-warning" role="alert">
                    <Icon name="circle-alert" />
                    <span>{saveError || 'Заполните обязательные поля'}</span>
                </div>
            )}
            <TaskTextField type="title" label="Название" value={title} maxLength={128}
                placeholder="Введите название задачи" error={errors.title} inputRef={titleRef}
                onChange={(value) => { setTitle(value); if (value.trim()) clearError('title'); }} />
            <TaskTextField type="description" label="Описание" value={description} maxLength={4000}
                placeholder="Опишите ожидаемый результат и необходимые действия" error={errors.description} inputRef={descriptionRef}
                onChange={(value) => { setDescription(value); if (value.trim()) clearError('description'); }} />
            <div className="task-form-field">
                <div className="task-form-field-head">
                    <label className="task-form-label" id="task-assignee-label" htmlFor="task-assignee-trigger">
                        Ответственный <span aria-hidden="true">*</span>
                    </label>
                </div>
                <button className={`task-form-control task-form-select-trigger ${errors.assigneeId ? 'is-invalid' : ''}`}
                    id="task-assignee-trigger" type="button" role="combobox" ref={assigneeRef}
                    aria-labelledby="task-assignee-label" aria-haspopup="listbox"
                    aria-controls={dropdownOpen ? 'task-assignee-dropdown' : undefined}
                    aria-expanded={dropdownOpen} aria-required="true" aria-invalid={Boolean(errors.assigneeId) || undefined}
                    aria-describedby={errors.assigneeId ? 'task-assignee-error' : 'task-assignee-value'}
                    onClick={() => setOpenPicker(dropdownOpen ? null : 'dropdown')}
                    onKeyDown={(eventObject) => {
                        if (eventObject.key === 'ArrowDown' || eventObject.key === 'ArrowUp') {
                            eventObject.preventDefault();
                            setOpenPicker('dropdown');
                        }
                    }}>
                    <span className={`task-form-select-value ${assignee ? '' : 'is-placeholder'}`} id="task-assignee-value">
                        {assigneeName(assignee) || 'Выберите ответственного'}
                    </span>
                    <Icon name="chevron-down" />
                </button>
                {errors.assigneeId && <span className="task-form-error" id="task-assignee-error">{errors.assigneeId}</span>}
                <button className="footer-btn task-form-project-team-action" type="button"
                    data-task-action="assign-from-project-team" ref={teamRef} aria-haspopup="dialog"
                    aria-expanded={teamOpen} aria-controls={teamOpen ? 'task-project-team-modal' : undefined}
                    onClick={() => setOpenPicker('team')}>
                    <Icon name="user-plus" />Назначить из команды проекта
                </button>
                {dropdownOpen && <AssigneeDropdown assignees={assignees} selectedId={assigneeId}
                    anchorRef={assigneeRef} nextRef={teamRef} onSelect={selectAssignee} onClose={closePicker} />}
                {teamOpen && <ProjectTeam assignees={assignees} anchorRef={teamRef}
                    onAssign={(selected) => selectAssignee(selected, true)} onClose={closePicker} />}
            </div>
            <span className="task-visually-hidden" role="status">{status}</span>
        </form>
    );
}

export function TaskList({ tasks, taskData, onEdit, onDelete }) {
    if (!tasks?.length) return null;
    return (
        <section className="event-linked-tasks" aria-label="Задачи по событию">
            <div className="event-linked-tasks-list">
                {tasks.map((task) => (
                    <article className="event-task-card" key={task.id} data-task-id={task.id}
                        aria-label={`Созданная задача ${task.title}`}>
                        <span className="event-task-card-icon"><Icon name="clipboard-check" /></span>
                        <span className="event-task-card-content">
                            <span className="event-task-card-title">{task.title}</span>
                            <span className="event-task-card-meta">
                                <span className="event-task-card-meta-label">Ответственный:</span>
                                {assigneeName(taskData.getAssigneeById(task.assigneeId)) || 'Не назначен'}
                            </span>
                        </span>
                        <span className="event-task-card-actions" role="group" aria-label="Действия с задачей">
                            <button className="event-task-card-action" type="button" data-task-action="edit-task" data-task-id={task.id}
                                aria-label={`Редактировать задачу ${task.title}`} onClick={() => onEdit(task.id)}>
                                <Icon name="pencil" />
                            </button>
                            <button className="event-task-card-action event-task-card-action-danger" type="button"
                                data-task-action="delete-task" data-task-id={task.id}
                                aria-label={`Удалить задачу ${task.title}`} onClick={() => onDelete(task.id)}>
                                <Icon name="trash-2" />
                            </button>
                        </span>
                    </article>
                ))}
            </div>
        </section>
    );
}
