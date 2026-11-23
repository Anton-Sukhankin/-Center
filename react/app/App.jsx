import { lazy, Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { data } from './data.js';
import { Header, ProjectHeader, Sidebar } from './Shell.jsx';
import MetricChart from '../bi/MetricChart.jsx';
import { closeAnimatedSurface } from '../ui/useAnimatedDialog.js';
import Filters from '../event-tools/Filters.jsx';
import Analytics from '../events/Analytics.jsx';
import EventCard from '../events/EventCard.jsx';
import EventDetails, { ConfirmHideEvent } from '../events/EventDetails.jsx';
import { findMetric, getFeed, hasFilters, initialFilters, isHighPriority } from '../events/feedModel.js';
import { Toolbar } from '../events/Toolbar.jsx';
import MetricsDashboard from '../metrics/MetricsDashboard.jsx';
import MetricTree from '../metrics/MetricTree.jsx';
import Icon from '../ui/Icon.jsx';
import pinnedEventsIllustration from '../../assets/images/pinned-events-empty.webp';

const { appData, taskData, metricsDashboardData, projectStructureData } = data;
const nodes = projectStructureData.getProjectStructure();
const findEntity = id => projectStructureData.findProjectEntityById(id, nodes);
const originalContext = projectStructureData.getContextScope('project', 'proj-nova', nodes);
const Assistant = lazy(() => import('../assistant/Assistant.jsx'));
const Summary = lazy(() => import('../construction/Summary.jsx'));
const Objects = lazy(() => import('../construction/Objects.jsx'));

function getProjects(branch) {
    return branch.flatMap(node => node.type === 'project'
        ? [{ id: node.id, name: node.name, subtitle: [node.headerAttributes?.region, node.headerAttributes?.cluster].filter(Boolean).join(' · ') }]
        : getProjects(node.children || []));
}

function FloatingBar({ count, onReset }) {
    return <div id="floating-bar-root" className="floating-bar-container active">
        <div className="selection-action-bar">
            <div className="fab-indication"><span>Результат:</span><span className="fab-badge-oval">{count}</span></div>
            <div className="fab-btn-wrap"><button type="button" className="fbtn-outline" disabled
                title="Массовое создание задач будет доступно в будущей версии"><Icon name="plus" />Создать задачу · Скоро</button></div>
            <div className="fab-exit-wrap"><button type="button" className="fbtn-close" onClick={onReset}
                aria-label="Закрыть фильтры и выйти" title="Закрыть фильтры и выйти"><Icon name="x" /></button></div>
        </div>
    </div>;
}

function EmptyFeed({ pinned }) {
    return pinned ? <div className="pinned-empty-state">
        <img className="pinned-empty-illustration" src={pinnedEventsIllustration} alt="" width="144" height="88" />
        <div className="empty-title">Нет закреплённых событий</div>
        <div className="empty-subtitle">Вы можете закрепить важные события через меню карточки, чтобы они всегда были под рукой.</div>
    </div> : <div className="priority-empty-state" role="status">В выбранном приоритете нет событий.</div>;
}

export default function App({ view = 'dashboard' }) {
    const [context, setContext] = useState(originalContext);
    const [filters, setFilters] = useState(initialFilters);
    const [metricsSection, setMetricsSection] = useState('overview');
    const [changes, setChanges] = useState({});
    const [panel, setPanel] = useState(null);
    const panelSource = useRef(null);
    const metricSource = useRef(null);
    const confirmSource = useRef(null);
    const [chatVisited, setChatVisited] = useState(false);
    const [planHost, setPlanHost] = useState(null);
    const [eventId, setEventId] = useState(null);
    const [metricId, setMetricId] = useState(null);
    const [selectedMetricId, setSelectedMetricId] = useState(null);
    const [confirmHide, setConfirmHide] = useState(false);
    const [taskEditor, setTaskEditor] = useState(null);
    const [taskRevision, setTaskRevision] = useState(0);
    const [analysisEvents, setAnalysisEvents] = useState([]);

    const baseEvents = useMemo(() => appData.getEventsForContext(context), [context]);
    const events = useMemo(() => baseEvents.map(event => changes[event.id] ? { ...event, ...changes[event.id] } : event), [baseEvents, changes]);
    const metrics = useMemo(() => appData.getMetricsForContext(context, baseEvents), [context, baseEvents]);
    const viewModel = useMemo(() => metricsDashboardData.getDashboardForContext(context, baseEvents), [context, baseEvents]);
    const constructionMetrics = useMemo(() => appData.getConstructionMetricsForContext(context), [context]);
    const feed = useMemo(() => getFeed(events, filters), [events, filters]);
    const taskCounts = useMemo(() => new Map(baseEvents.map(event => [event.id, taskData.getTaskCountForEvent(event.id)])),
        [baseEvents, taskRevision]);
    const cards = useMemo(() => feed.page.map(event => {
        const card = appData.getEventListViewModel(event, metrics);
        return { ...card, chartMetricId: findMetric(metrics, card.metricId)?.id };
    }), [feed.page, metrics]);
    const editingEvent = events.find(event => event.id === eventId);
    const eventDetails = editingEvent ? appData.getEventDetailViewModel(editingEvent, metrics) : null;
    const eventMetric = eventDetails ? findMetric(metrics, eventDetails.metricId) : null;
    const metric = findMetric(metrics, metricId);
    const filtered = hasFilters(filters);
    const isMetrics = filters.activeTab === 'metrics';
    const isDashboard = view === 'dashboard';
    const isSummary = view === 'digital-chessboard-summary';
    const eventOpen = panel === 'event' && Boolean(eventDetails);
    const feedMetricOpen = panel === 'feed-metric' && isDashboard && !isMetrics;
    const treeOpen = panel === 'tree' && isDashboard;
    const projects = useMemo(() => getProjects(context.type === 'bu' ? [findEntity(context.id)].filter(Boolean) : nodes), [context]);

    useLayoutEffect(() => {
        document.body.classList.toggle('is-filtered', filtered && isDashboard && !isMetrics);
        return () => document.body.classList.remove('is-filtered');
    }, [filtered, isDashboard, isMetrics]);

    function closePanel() {
        setMetricId(null);
        setConfirmHide(false);
        setTaskEditor(null);
        setPanel(null);
    }

    function selectContext(type, id) {
        const next = projectStructureData.getContextScope(type, id, nodes);
        if (!next) return false;
        if (next.id === context.id) return true;
        closePanel();
        setContext(next);
        setChanges({});
        setFilters(previous => ({ ...initialFilters, activeTab: previous.activeTab, priorityView: previous.priorityView }));
        return true;
    }

    function changeTab(activeTab) {
        if (panel === 'tree' || panel === 'feed-metric') closePanel();
        setFilters(current => ({ ...current, activeTab }));
    }

    function patchEvent(id, update) {
        setChanges(previous => {
            const source = baseEvents.find(event => event.id === id);
            if (!source) return previous;
            const existing = previous[id] || {};
            return { ...previous, [id]: { ...existing, ...update({ ...source, ...existing }) } };
        });
    }

    function resetFilters() {
        setFilters(current => ({
            ...initialFilters,
            activeTab: current.activeTab === 'today' ? 'today' : 'all',
            priorityView: current.priorityView
        }));
        setChanges(previous => Object.fromEntries(Object.entries(previous).map(([id, item]) =>
            [id, { ...item, excluded: false }])));
    }

    const openEvent = useCallback((id, source) => {
        panelSource.current = source;
        setEventId(id);
        setTaskEditor(null);
        setMetricId(null);
        setPanel('event');
    }, []);

    const openFeedMetric = useCallback((id, source) => {
        metricSource.current = source;
        setMetricId(id);
        setPanel('feed-metric');
    }, []);

    function openPanel(next, source) {
        closePanel();
        panelSource.current = source || null;
        if (next === 'analytics') setAnalysisEvents(feed.page);
        setPanel(next);
    }

    function openMetric(id, source) {
        if (!findMetric(metrics, id)) return;
        metricSource.current = source;
        setSelectedMetricId(id);
        setMetricId(id);
    }

    function createTaskFromEvent() {
        const showForm = () => {
            setMetricId(null);
            setTaskEditor({ task: null });
        };
        if (metric && eventOpen) closeAnimatedSurface(document.querySelector('#bi-modal-overlay .metric-bi-dialog'), showForm);
        else showForm();
    }

    function togglePin(id) {
        patchEvent(id, event => ({ pinned: !event.pinned }));
    }

    function exclude(id) {
        if (filtered) patchEvent(id, () => ({ excluded: true }));
    }

    function saveTask(values) {
        if (taskEditor?.task) taskData.updateTask(taskEditor.task.id, values);
        else taskData.createTask(values);
        setTaskRevision(value => value + 1);
        setTaskEditor(null);
    }

    return <>
        <div className="app-shell">
            <Header chatOpen={panel === 'chat'} onChat={() => {
                setChatVisited(true);
                if (panel === 'chat') closePanel(); else openPanel('chat');
            }} />
            <div className="content-area app-main-view dashboard-workspace" id="dashboard-view" hidden={!isDashboard}>
                <Sidebar nodes={nodes} selection={context.id} onSelect={selectContext} />
                <div className="main-wrapper"><main className="main-content" id="main-event-feed">
                    <div className="sticky-header-wrapper">
                        <ProjectHeader context={context} findEntity={findEntity} onPlanHost={setPlanHost}
                            chatOpen={panel === 'chat'} onPlanChat={() => { setChatVisited(true); openPanel('chat'); }}
                            onDismissChat={closePanel} />
                        <Toolbar filters={filters} feed={feed} filtered={filtered} filterOpen={panel === 'filters'} treeOpen={treeOpen}
                            metricsAvailable={viewModel?.status === 'ready'} metricsSection={metricsSection}
                            onTab={changeTab} onMetricsSection={setMetricsSection}
                            onPriority={priorityView => setFilters(value => ({ ...value, priorityView }))} onLayer={openPanel} />
                    </div>
                    <div id="event-feed-sections" onScroll={({ currentTarget: feed }) => {
                        feed.toggleAttribute('data-scrolled', feed.scrollTop > 0);
                    }}>
                        <div className="priority-tab-panel" id="priority-events-panel" role={isMetrics ? undefined : 'tabpanel'}
                            aria-labelledby={isMetrics ? undefined : `priority-tab-${filters.priorityView}`}>
                            <div className={`events-grid ${isMetrics ? 'is-empty-state is-metrics-dashboard' : ''} ${!isMetrics && filters.activeTab === 'pinned' && !feed.counts.pinned ? 'is-empty-state' : ''}`}
                                id="priority-events-container">
                                <MetricsDashboard context={context} viewModel={viewModel} active={isMetrics && isDashboard}
                                    sectionId={metricsSection} onSelectSection={setMetricsSection}
                                    onOpenProject={id => selectContext('project', id)} />
                                {!isMetrics ? cards.length ? cards.map(card => <EventCard key={card.id} event={card}
                                    taskCount={taskCounts.get(card.id) || 0} canExclude={filtered} onOpen={openEvent}
                                    onOpenMetric={openFeedMetric} onPin={togglePin} onExclude={exclude} />)
                                    : <EmptyFeed pinned={filters.activeTab === 'pinned' && feed.counts.pinned === 0} /> : null}
                            </div>
                        </div>
                    </div>
                </main></div>
            </div>
            <section className="app-main-view" id="digital-chessboard-summary-view" aria-label="Сводка цифровой шахматки" hidden={!isSummary}>
                {isSummary ? <Suspense fallback={<div role="status">Загрузка сводки…</div>}>
                    <Summary context={context} active={isSummary} projects={projects} onSelectProject={id => selectContext('project', id)} data={data} />
                </Suspense> : null}
            </section>
            <section className="app-main-view" id="objects-view" aria-label="Объекты" hidden={view !== 'objects'}>
                {view === 'objects' ? <Suspense fallback={<div role="status">Загрузка объектов…</div>}>
                    <Objects context={context} active={view === 'objects'} data={data} />
                </Suspense> : null}
            </section>
        </div>
        {filtered && isDashboard && !isMetrics ? <FloatingBar count={feed.total} onReset={resetFilters} /> : null}
        {eventOpen ? <EventDetails key={eventDetails.id} event={eventDetails} metric={eventMetric} onClose={closePanel} source={panelSource.current}
            onOpenMetric={openMetric} onPin={() => togglePin(eventId)}
            chartOpen={Boolean(metric)} hasChildDialog={confirmHide}
            onPriority={() => patchEvent(eventId, event => ({ priority: isHighPriority(event) ? 'low' : 'high' }))}
            onHide={source => { confirmSource.current = source; setConfirmHide(true); }}
            tasks={taskData.getTasksForEvent(eventId)} taskEditor={taskEditor} taskData={taskData}
            onCreateTask={createTaskFromEvent}
            onEditTask={id => setTaskEditor({ task: taskData.getTaskById(id) })}
            onDeleteTask={id => { taskData.deleteTask(id); setTaskRevision(value => value + 1); }}
            onSaveTask={saveTask} onCancelTask={() => setTaskEditor(null)} /> : null}
        {panel === 'filters' ? <Filters filters={filters} metrics={metrics} sources={appData.getEventSources()}
            source={panelSource.current} onClose={closePanel} onApply={next => setFilters(value => ({ ...value, ...next }))} /> : null}
        <MetricTree metrics={metrics} open={treeOpen} onClose={closePanel} onCloseChart={() => setMetricId(null)} source={panelSource.current}
            onOpenMetric={openMetric} selectedMetricId={selectedMetricId || metrics.id}>
            {metric && treeOpen ? <MetricChart paired metric={metric} onClose={() => setMetricId(null)} /> : null}
        </MetricTree>
        {metric && (eventOpen || feedMetricOpen) ? <MetricChart key={`${context.id}:${metric.id}`} metric={metric}
            source={metricSource.current} sideBySide={eventOpen} onCreateTask={eventOpen ? createTaskFromEvent : undefined}
            onClose={feedMetricOpen ? closePanel : () => setMetricId(null)} /> : null}
        {eventOpen && confirmHide ? <ConfirmHideEvent focusSource={confirmSource.current} onCancel={() => setConfirmHide(false)}
            onConfirm={() => { patchEvent(eventId, () => ({ hidden: true })); closePanel(); }} /> : null}
        {panel === 'analytics' ? <Analytics events={analysisEvents} onClose={closePanel} source={panelSource.current} /> : null}
        {chatVisited ? <Suspense fallback={null}>
            <Assistant open={panel === 'chat'} portalHost={planHost} context={context} entity={findEntity(context.id)} events={feed.page} allEvents={events}
                metrics={metrics} activeMetricId={selectedMetricId} constructionMetrics={constructionMetrics} filters={filters} onClose={closePanel} />
        </Suspense> : null}
    </>;
}
