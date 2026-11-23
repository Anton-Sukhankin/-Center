import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Icon from './ConstructionIcon.jsx';
import { SummaryAttention, SummaryKpis, WeeklySummary } from './SummaryAnalytics.jsx';
import SummaryOverlay from './SummaryOverlay.jsx';
import SummaryTable from './SummaryTable.jsx';
import useAnnouncement from './useAnnouncement.js';
import './construction-print.css';

const SCENARIOS = new Set(['loading', 'empty', 'table-error', 'attention-error', 'archive-empty', 'archive-error']);
const EMPTY_PROJECTS = [];

function getScenario() {
    const scenario = new URLSearchParams(window.location.search).get('summaryScenario');
    return SCENARIOS.has(scenario) ? scenario : 'default';
}

function projectSubtitle(value) {
    return String(value || '').split('·').map(part => part.trim())
        .filter(part => part && part !== 'Москва' && part !== 'Премиум').join(' · ');
}

function ProjectToolbar({ project, projects, open, setOpen, onSelect, onArchive, onPrint }) {
    const trigger = useRef(null);
    const optionsRef = useRef(null);
    const subtitle = projectSubtitle(project?.subtitle);
    const label = project?.name || 'Выберите проект';

    useLayoutEffect(() => {
        const options = optionsRef.current;
        if (open && options) (options.querySelector('[aria-selected="true"]') || options.firstElementChild)?.focus();
    }, [open]);

    function select(projectId) {
        setOpen(false);
        trigger.current?.focus({ preventScroll: true });
        onSelect(projectId);
    }

    function navigate(event) {
        if (event.key === 'Escape' && open) {
            event.preventDefault();
            setOpen(false);
            trigger.current?.focus({ preventScroll: true });
            return;
        }
        const options = [...(optionsRef.current?.querySelectorAll('[role="option"]') || [])];
        if (!options.length) return;
        const index = Math.max(0, options.indexOf(event.target));
        let next;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = options.length - 1;
        if (event.key === 'ArrowDown') next = (index + 1) % options.length;
        if (event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
        if (next === undefined) return;
        event.preventDefault();
        options[next].focus();
    }

    return (
        <section className="dcs-project-toolbar" aria-label="Проект и действия">
            <div className="dcs-project-selector" onKeyDown={navigate}>
                <button className="dcs-project-trigger" id="dcs-project-trigger" type="button" ref={trigger}
                    aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? 'dcs-project-options' : undefined}
                    onClick={() => setOpen(!open)} onKeyDown={event => {
                        if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                            event.preventDefault();
                            setOpen(true);
                        }
                    }}>
                    <span className="dcs-project-icon"><Icon name="drafting-compass" size={25} /></span>
                    <span className="dcs-project-copy"><small>Проект</small><strong title={label}>{label}</strong>{subtitle && <span>{subtitle}</span>}</span>
                    <Icon name="chevron-down" className={open ? 'is-rotated' : undefined} size={20} />
                </button>
                {open && <div className="dcs-project-popover" id="dcs-project-options" role="listbox" aria-label="Выбор проекта" ref={optionsRef}>
                    {projects.length ? projects.map(option => {
                        const selected = option.id === project?.id;
                        const optionSubtitle = projectSubtitle(option.subtitle);
                        return (
                            <button key={option.id} type="button" role="option" aria-selected={selected} onClick={() => select(option.id)}>
                                <span><span className="dcs-project-option-icon"><Icon name="drafting-compass" size={18} /></span>
                                    <span><strong title={option.name}>{option.name}</strong>{optionSubtitle && <small>{optionSubtitle}</small>}</span>
                                </span>
                                {selected && <Icon name="check" size={17} />}
                            </button>
                        );
                    }) : <p>Проекты недоступны</p>}
                </div>}
            </div>
            <div className="dcs-toolbar-actions">
                <button type="button" onClick={event => onArchive(event.currentTarget)}><Icon name="archive" size={19} />Архив</button>
                <button type="button" onClick={event => onPrint(event.currentTarget)}><Icon name="printer" size={19} />Печать</button>
            </div>
        </section>
    );
}

function SummaryWorkspace({ model, scenario, active, projects, onSelectProject }) {
    const [projectOpen, setProjectOpen] = useState(false);
    const [menuId, setMenuId] = useState(null);
    const [overlay, setOverlay] = useState(null);
    const [archive, setArchive] = useState(null);
    const [selectedObject, setSelectedObject] = useState('all');
    const [loading, setLoading] = useState(scenario === 'loading');
    const [tableLoading, setTableLoading] = useState(false);
    const [tableError, setTableError] = useState(scenario === 'table-error');
    const [attentionError, setAttentionError] = useState(scenario === 'attention-error');
    const [announcement, announce] = useAnnouncement(active, 2400);
    const unsupported = model.status === 'unsupported-context';

    // Меню и диалоги привязаны к видимому экрану. Примененные настройки остаются в его состоянии.
    if (!active) {
        if (overlay) setOverlay(null);
        if (projectOpen) setProjectOpen(false);
        if (menuId) setMenuId(null);
    }

    useEffect(() => {
        if (!loading || !active) return;
        const timer = setTimeout(() => setLoading(false), 1600);
        return () => clearTimeout(timer);
    }, [loading, active]);

    useEffect(() => {
        if (!tableLoading || !active) return;
        const timer = setTimeout(() => setTableLoading(false), 500);
        return () => clearTimeout(timer);
    }, [tableLoading, active]);

    useEffect(() => {
        if (!active || (!projectOpen && !menuId)) return;
        function closeOutside(event) {
            if (!event.target.closest?.('.dcs-project-selector')) setProjectOpen(false);
            if (!event.target.closest?.('.dcs-row-menu-wrap')) setMenuId(null);
        }
        document.addEventListener('pointerdown', closeOutside);
        return () => document.removeEventListener('pointerdown', closeOutside);
    }, [active, projectOpen, menuId]);

    function openDialog(next) {
        setProjectOpen(false);
        setMenuId(null);
        setOverlay(next);
    }

    function changeProject(projectId) {
        if (!projectId || projectId === model.project?.id) return;
        if (onSelectProject(projectId) === false) announce('Не удалось переключить проект');
    }

    async function copyLabel(name) {
        try {
            await navigator.clipboard.writeText(`${model.project?.name || ''}: ${name}`);
            announce('Ссылка скопирована');
        } catch {
            announce('Не удалось скопировать ссылку');
        }
    }

    return (
        <main className="dcs-workspace">
            <header className="dcs-view-header"><h1 className="dcs-view-title">Сводка</h1></header>
            <div className="dcs-sticky-summary-shell">
                {archive && !unsupported && <div className="dcs-archive-banner" role="status">
                    <Icon name="archive" size={18} /><span><strong>{archive.title}</strong><small>{archive.period}</small></span>
                    <button type="button" onClick={() => { setArchive(null); document.getElementById('dcs-project-trigger')?.focus(); }}>
                        Вернуться к актуальной сводке
                    </button>
                </div>}
                <ProjectToolbar project={model.project} projects={projects} open={projectOpen} onSelect={changeProject}
                    setOpen={open => { setProjectOpen(open); if (open) setMenuId(null); }}
                    onArchive={source => openDialog({ kind: 'archive', source, status: scenario === 'archive-error' ? 'error' : scenario === 'archive-empty' ? 'empty' : 'ready' })}
                    onPrint={source => openDialog({ kind: 'print', source })} />
                {!unsupported && <SummaryKpis kpis={model.kpis} loading={loading} />}
            </div>
            {unsupported ? <section className="dcs-unsupported">
                <span><Icon name="info" size={28} /></span><h2>Выберите проект</h2>
                <p>{model.message || 'Сводка доступна в контексте проекта или очереди.'}</p>
            </section> : <>
                <div className="dcs-analytics-grid">
                    <WeeklySummary weekly={model.weeklySummary} period={model.period} loading={loading}
                        openReport={() => openDialog({ kind: 'detail', item: { kind: 'report', title: 'Недельный отчет', tone: 'info' } })} />
                    <SummaryAttention objects={model.objects || []} items={model.attentionItems || []}
                        selectedObject={selectedObject} onSelectObject={setSelectedObject} loading={loading} error={attentionError}
                        onRetry={() => setAttentionError(false)}
                        openIssue={issue => openDialog({ kind: 'detail', item: { ...issue, kind: 'issue' } })}
                        openAllIssues={(object, count) => openDialog({ kind: 'detail', item: {
                            kind: 'issue', title: `Все проблемы по ${object.id === 'all' ? 'проекту' : object.name}`, tone: 'warning', count
                        } })} />
                </div>
                <SummaryTable model={model} active={active} loading={loading || tableLoading} error={tableError} archive={archive}
                    menuId={menuId} setMenu={id => { setMenuId(id); if (id) setProjectOpen(false); }}
                    onObject={item => openDialog({ kind: 'detail', item })} onCopy={copyLabel}
                    onRetry={() => { setTableError(false); setTableLoading(true); }} />
            </>}
            <div className={`dcs-toast${announcement ? ' is-visible' : ''}`} role="status">
                <Icon name="circle-check" size={18} /><span>{announcement}</span>
            </div>
            {active && overlay && <SummaryOverlay model={model} overlay={overlay} onClose={() => setOverlay(null)}
                onRetry={() => setOverlay(current => ({ ...current, status: 'ready' }))}
                onSnapshot={snapshot => { setArchive(snapshot); setOverlay(null); }}
                onCopy={copyLabel} onFuture={() => announce('Переход подготовлен для следующего интеграционного этапа')} />}
        </main>
    );
}

export default function Summary({ context, active = true, onSelectProject, projects = EMPTY_PROJECTS, data }) {
    const [scenario] = useState(getScenario);
    const root = useRef(null);
    const pendingProjectFocus = useRef(null);
    const model = useMemo(() => {
        const next = data.digitalChessboardSummaryData.getForContext(context);
        if (next.status !== 'ready' || scenario !== 'empty') return next;
        return { ...next, status: 'empty', objects: [], attentionItems: [], weeklySummary: null,
            kpis: next.kpis.map(kpi => ({ ...kpi, value: '0' })) };
    }, [data.digitalChessboardSummaryData, context, scenario]);
    const projectId = model.project?.id;

    useLayoutEffect(() => {
        if (!active || !projectId || pendingProjectFocus.current !== projectId) return;
        pendingProjectFocus.current = null;
        root.current?.querySelector('#dcs-project-trigger')?.focus({ preventScroll: true });
    }, [active, projectId]);

    function selectProject(id) {
        pendingProjectFocus.current = id;
        const result = onSelectProject(id);
        if (result === false) pendingProjectFocus.current = null;
        return result;
    }

    return (
        <div id="digital-chessboard-summary-root" hidden={!active} ref={root}>
            <SummaryWorkspace key={projectId || 'unsupported'} model={model} active={active}
                projects={projects} onSelectProject={selectProject} scenario={scenario} />
        </div>
    );
}
