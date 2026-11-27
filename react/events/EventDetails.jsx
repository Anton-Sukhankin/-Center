import { useLayoutEffect, useRef, useState } from 'react';
import { TaskFooter, TaskForm, TaskHeader, TaskList } from '../event-tools/Tasks.jsx';
import Icon from '../ui/Icon.jsx';
import { CloseButton } from '../ui/LightlineButton.jsx';
import InlineText from '../ui/InlineText.jsx';
import { useAnimatedDialog } from '../ui/useAnimatedDialog.js';
import { isHighPriority } from './feedModel.js';

function EventDescription({ event, introRef }) {
    const cardRef = useRef(null);
    const headingRef = useRef(null);
    const textRef = useRef(null);
    const [{ limit, collapsible }, setLayout] = useState({ limit: undefined, collapsible: false });
    const [expanded, setExpanded] = useState(false);
    useLayoutEffect(() => {
        const card = cardRef.current;
        const heading = headingRef.current;
        const text = textRef.current;
        const drawerBody = card.closest('.event-detail-body');
        const intro = introRef.current;
        const px = value => parseFloat(value) || 0;

        function measure() {
            const bodyStyle = getComputedStyle(drawerBody);
            const cardStyle = getComputedStyle(card);
            const headingStyle = getComputedStyle(heading);
            const available = drawerBody.clientHeight - intro.getBoundingClientRect().height
                - px(bodyStyle.paddingTop) - px(bodyStyle.paddingBottom) - px(bodyStyle.rowGap);
            // Leave a readable preview on short screens; the drawer body can scroll.
            const nextLimit = Math.max(180, Math.floor(available));
            const natural = text.getBoundingClientRect().height + heading.getBoundingClientRect().height
                + px(headingStyle.marginBottom) + px(cardStyle.paddingTop) + px(cardStyle.paddingBottom);
            const nextCollapsible = natural > nextLimit + 0.5;
            setLayout(current => current.limit === nextLimit && current.collapsible === nextCollapsible
                ? current : { limit: nextLimit, collapsible: nextCollapsible });
            if (!nextCollapsible) setExpanded(false);
        }

        measure();
        const observer = new ResizeObserver(measure);
        for (const node of [drawerBody, intro, heading, text]) observer.observe(node);
        return () => observer.disconnect();
    }, [introRef]);
    return <div ref={cardRef} style={{ maxBlockSize: expanded ? undefined : limit }}
        className={`drawer-card event-description-card ${collapsible && !expanded ? 'is-preview' : ''}`}>
        <div ref={headingRef} className="drawer-card-title">Описание события</div>
        <div className="drawer-card-desc event-description-content" id="event-description-content">
            <div ref={textRef} className="event-description-text">
                <InlineText value={event.detailText || event.text} />
            </div>
        </div>
        {collapsible ? <button className="event-description-toggle" type="button" aria-expanded={expanded}
            aria-controls="event-description-content" onClick={() => setExpanded(value => !value)}>
            <span>{expanded ? 'Свернуть' : 'Дополнительно'}</span>
            <span className="event-description-toggle-icon"><Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} /></span>
        </button> : null}
    </div>;
}

function EventHeading({ event, inactive }) {
    return <div className="event-heading-copy" aria-hidden={inactive || undefined}>
        <h2 data-dialog-title className="drawer-header-title">{event.listTitle || event.title}</h2>
        <div className="drawer-header-subtitle event-detail-source-line">
            <span className="event-detail-meta-item"><span className="drawer-header-project-label">Источник:</span>
                <span className="drawer-header-project-value">{event.sourceName || 'AIShtab'}</span></span>
        </div>
    </div>;
}

function EventParams({ event, onPriority }) {
    const high = isHighPriority(event);
    const statusIcon = high ? 'arrow-up' : event.priority === 'low' ? 'minus' : null;
    const rows = [
        ['Время', event.dateText, 'calendar'],
        ['Проект', event.projectName, 'folder-open'],
        ['Очередь', event.queue, 'list-checks'],
        ['Тип объекта', event.objectType, 'building'],
        ['Объект', event.objectName, 'construction']
    ];
    return <dl className="event-params-register" aria-label="Параметры события">
        <div className="event-status-row">
            <dt><Icon name="circle-alert" size={16} />Статус</dt>
            <dd className="event-status-field">
                <span className={`event-status-value${high ? ' event-status-high' : ''}`}>
                    {statusIcon ? <Icon name={statusIcon} size={16} /> : null}{event.priorityName || '—'}
                </span>
                <button type="button" className="event-priority-link" title={high ? 'Понизить приоритет' : 'Повысить приоритет'}
                    onClick={onPriority}>Изменить приоритет</button>
            </dd>
        </div>
        {rows.map(([label, value, icon]) => <div key={label}>
            <dt><Icon name={icon} size={16} />{label}</dt><dd>{value || '—'}</dd>
        </div>)}
    </dl>;
}

function MetricTrigger({ metric, onOpen, event }) {
    return <button className={`card-content metric-impact-trigger ${event.impactType === 'negative' ? 'negative' : ''}`}
        type="button" onClick={click => onOpen(metric.id, click.currentTarget)} aria-label="Открыть график связанной метрики">
        <div className="impact-card-top">
            <div className="impact-card-icon-box">
                <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 3.5v16.8h17" />
                    <path d="m6.7 13.8 4.1-5.2 4.1 3.1 5.1-5.2" />
                    <g fill="#E5F2FF">
                        <circle cx="6.7" cy="13.8" r="1.3" />
                        <circle cx="10.8" cy="8.6" r="1.3" />
                        <circle cx="14.9" cy="11.7" r="1.3" />
                        <circle cx="20" cy="6.5" r="1.3" />
                    </g>
                </svg>
            </div>
            <div className="impact-card-info"><div className="impact-card-title">{metric.name}</div>
                <div className="impact-card-description">Влияние на метрику</div></div>
        </div>
    </button>;
}

export default function EventDetails({
    event, metric, onClose, onOpenMetric, onPin, onPriority, onHide, hasChildDialog, chartOpen,
    tasks, taskEditor, taskData, onCreateTask, onEditTask, onDeleteTask, onSaveTask, onCancelTask, source
}) {
    const { dialogRef: ref, backdropRef, dismiss } = useAnimatedDialog({
        onClose, source, onEscape: close, siblingCompanionSelector: '#bi-modal-overlay.is-side-by-side'
    });
    function close() {
        if (taskEditor) onCancelTask();
        else dismiss();
    }
    const task = taskEditor?.task;
    const mode = taskEditor ? task ? 'task-edit' : 'task-create' : undefined;
    const introRef = useRef(null);
    const previousMode = useRef(undefined);
    useLayoutEffect(() => {
        if (mode) ref.current?.querySelector('#task-title')?.focus({ preventScroll: true });
        else if (previousMode.current) ref.current?.querySelector('#event-create-task')?.focus({ preventScroll: true });
        previousMode.current = mode;
    }, [mode, ref, task?.id]);
    const name = taskEditor ? task ? 'Карточка задачи' : 'Создание задачи' : 'Детальная карточка события';
    const pinLabel = event.pinned ? 'Открепить событие' : 'Закрепить событие';
    const closeButton = <CloseButton className="drawer-close-btn" id="close-event-drawer-btn" data-initial-focus
        data-linked-chart={chartOpen || undefined}
        aria-description={taskEditor ? 'Отменить редактирование задачи' : chartOpen ? 'Закрыть событие и график' : undefined} onClick={close} />;
    return <>
        <div className="drawer-overlay active" id="event-drawer-overlay" ref={backdropRef} data-dialog-motion onClick={close} aria-hidden="true" />
        <section ref={ref} className="drawer right-drawer open" id="event-drawer" role="dialog" aria-modal={!hasChildDialog && !chartOpen} data-dialog-motion
            aria-label={name} tabIndex={-1} data-task-mode={mode} inert={hasChildDialog}>
            <div className="drawer-header" id="event-drawer-title-container">
                <div className="drawer-header-info" id="event-drawer-title" inert={chartOpen}>
                    <EventHeading event={event} inactive={Boolean(taskEditor)} />
                    <TaskHeader event={event} task={task} inactive={!taskEditor} />
                </div>
                {closeButton}
            </div>
            <div className={`drawer-body ${taskEditor ? 'task-drawer-body' : 'event-detail-body'}`} id="event-drawer-body" inert={chartOpen}>
                {taskEditor ? <TaskForm key={task?.id || event.id} event={event} task={task} taskData={taskData}
                    onSave={onSaveTask} onCancel={onCancelTask} /> : <>
                    <div ref={introRef} className="event-detail-intro">
                        <EventParams event={event} onPriority={onPriority} />
                        {metric ? <MetricTrigger metric={metric} event={event} onOpen={onOpenMetric} /> : null}
                    </div>
                    <EventDescription key={event.id} event={event} introRef={introRef} />
                    <TaskList tasks={tasks} taskData={taskData} onEdit={onEditTask} onDelete={onDeleteTask} />
                </>}
            </div>
            <div className={`drawer-footer ${taskEditor ? 'task-drawer-footer' : ''}`} id="event-drawer-footer">
                {taskEditor ? <TaskFooter task={task} onCancel={onCancelTask} /> : <>
                    <button type="button" className={`footer-btn footer-btn-icon event-detail-pin${event.pinned ? ' active' : ''}`}
                        aria-label={pinLabel} title={pinLabel} aria-pressed={Boolean(event.pinned)}
                        onClick={onPin} inert={chartOpen}><Icon name="bookmark" size={16} /></button>
                    <span className="drawer-footer-spacer" aria-hidden="true" />
                    <button type="button" id="event-create-task" className="footer-btn"
                        data-linked-chart={chartOpen || undefined} onClick={onCreateTask}>
                        <Icon name="clipboard-plus" size={16} />Создать задачу
                    </button>
                    <button type="button" className="footer-btn delete" aria-label="Скрыть событие" inert={chartOpen}
                        onClick={event => onHide(event.currentTarget)}><Icon name="trash-2" size={18} /></button>
                </>}
            </div>
        </section>
    </>;
}

export function ConfirmHideEvent({ onCancel, onConfirm, focusSource }) {
    const { dialogRef: ref, backdropRef, dismiss } = useAnimatedDialog({ onClose: onCancel, focusSource, overlayContainsSurface: true });
    const cancel = () => dismiss();
    return <div className="modal-overlay alert-dialog-overlay active aishtab-confirm-overlay" ref={backdropRef} data-dialog-motion
        onClick={event => { if (event.target === event.currentTarget) cancel(); }}>
        <section className="modal-content alert-dialog" ref={ref} role="alertdialog" aria-modal="true" data-dialog-motion
            aria-labelledby="hide-event-title" aria-describedby="hide-event-text" tabIndex={-1}>
            <header className="alert-dialog-header">
                <h3 data-dialog-title className="alert-dialog-title" id="hide-event-title">Скрыть событие?</h3>
                <CloseButton onClick={cancel} />
            </header>
            <p className="alert-dialog-text" id="hide-event-text">Событие исчезнет из ленты текущего контекста.</p>
            <div className="alert-dialog-actions">
                <button className="btn alert-dialog-cancel" type="button" data-initial-focus onClick={cancel}>Отмена</button>
                <button className="btn alert-dialog-confirm" type="button" onClick={() => dismiss(onConfirm)}>Скрыть</button>
            </div>
        </section>
    </div>;
}
