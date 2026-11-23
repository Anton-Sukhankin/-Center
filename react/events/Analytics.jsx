import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../ui/Icon.jsx';
import { CloseButton } from '../ui/LightlineButton.jsx';
import { useAnimatedDialog } from '../ui/useAnimatedDialog.js';
import { summarizeSelection } from './analysisModel.js';

const sections = [['file-text','Общий вывод'],['link','Выявленные связи'],['gauge','Прогноз и риски'],['list-checks','Предлагаемые действия']];

// Миниатюра иллюстрирует процесс, не отображает измерения или процент готовности.
const comparisonPoints = [[4,42,53],[32,37,46],[61,42,49],[89,22,39],[119,25,35],[149,8,26]];
const comparisonPath = index => comparisonPoints.map(p => `${p[0]},${p[index]}`).join(' ');
const scan = [...comparisonPoints, ...comparisonPoints.slice(0,-1).reverse()];
const scanValues = index => scan.map(p => p[index]).join(';');
function AnalysisLoading() {
    return <div className="analysis-placeholder" role="status">
        <div className="analysis-loading">
            <svg width="233.22" height="95.68" viewBox="0 0 156 64" aria-hidden="true" focusable="false">
                <g fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                    <polyline stroke="#d2dbe6" points={comparisonPath(2)}/>
                    <polyline stroke="#6398dd" points={comparisonPath(1)}/>
                </g>
                <g transform="translate(61 0)">
                    <animateTransform attributeName="transform" type="translate" dur="3s" repeatCount="indefinite" values={scanValues(0)}/>
                    <line y1="42" y2="49" stroke="#2070db" strokeWidth="2">
                        <animate attributeName="y1" dur="3s" repeatCount="indefinite" values={scanValues(1)}/>
                        <animate attributeName="y2" dur="3s" repeatCount="indefinite" values={scanValues(2)}/>
                    </line>
                    <circle cy="49" r="3" fill="#2070db"><animate attributeName="cy" dur="3s" repeatCount="indefinite" values={scanValues(2)}/></circle>
                    <circle cy="42" r="4" fill="white" stroke="#2070db" strokeWidth="2"><animate attributeName="cy" dur="3s" repeatCount="indefinite" values={scanValues(1)}/></circle>
                </g>
            </svg>
        </div>
        <span className="analysis-loading-status">Идёт анализ выбранных событий…</span>
    </div>;
}

function Evidence({items}) {
    const [limit, setLimit] = useState(3);
    return <><ul className="analysis-evidence">{items.slice(0, limit).map(e =>
        <li key={e.id}><strong>{e.title}</strong><small>{[e.dateText, e.sourceName, e.objectName].filter(Boolean).join(' · ')}</small>
            {e.metricName && <span>{e.metricName}{e.impact ? ` · ${e.impact}` : ''}</span>}</li>)}</ul>
        {limit < items.length && <button type="button" className="analysis-more" onClick={() => setLimit(limit + 10)}>Показать ещё ({items.length - limit})</button>}</>;
}

function Findings({section, events, model:m}) {
    if (section === 0) return <>
        <p>Событий в выборке: {events.length}. С отрицательным влиянием — {m.negative.length}, с положительным — {m.positive.length}.
            {m.negative.length ? ' Начните разбор с раздела «Прогноз и риски»: там видны события и указанные в них оценки.' : ' В этой выборке нет событий с отметкой об отрицательном влиянии.'}</p>
        <h4>Основные источники событий</h4>
        {m.sources.length ? <dl className="analysis-counts">{m.sources.map(g => <div key={g.label}><dt>{g.label}</dt><dd>{g.items.length}</dd></div>)}</dl> : <p>Источники не указаны.</p>}
        <h4>События в выборке</h4><Evidence items={events}/>
    </>;
    if (section === 1) return <>
        <p>События сгруппированы по названию основной метрики в карточке. Общая метрика помогает найти связанные материалы, но не доказывает, что одно событие вызвало другое.</p>
        {m.metrics.length ? m.metrics.map(g => <details className="analysis-group" key={g.label}><summary>{g.label}<span>{g.items.length}</span></summary><Evidence items={g.items}/></details>) : <p>В карточках выборки не указаны основные метрики.</p>}
    </>;
    if (section === 2) return <>
        <h4>События с отрицательным влиянием · {m.negative.length}</h4>
        {m.negative.length ? <Evidence items={m.negative}/> : <p>Отрицательное влияние в этих событиях не отмечено. Это не означает, что проект свободен от рисков.</p>}
        <h4>Границы прогноза</h4><p>Значения приведены из отдельных карточек. Длительности и суммы не складываются: события могут относиться к одному отклонению. Подтверждённого прогноза по проекту нет.</p>
        <p>Без указанной оценки влияния: {m.unassessed.length} из {events.length}.</p>
    </>;
    const repeated = m.repeated;
    return <><p>Предложения для ручной проверки. Задачи не создаются автоматически.</p>
        {m.negative.length > 0 && <section><h4>Проверить основание оценки</h4><p>Сверьте данные по событию «{m.negative[0].title}» с источником {m.negative[0].sourceName || 'из карточки'}. Уточните, остаётся ли отклонение актуальным.</p></section>}
        {repeated && <section><h4>Исключить двойной учёт</h4><p>С метрикой «{repeated.label}» связано событий: {repeated.items.length}. Сопоставьте объекты и даты, прежде чем объединять оценки.</p></section>}
        {m.unassessed.length > 0 && <section><h4>Уточнить влияние</h4><p>В событии «{m.unassessed[0].title}» нет числовой оценки. Проверьте, нужна ли она для решения; отсутствие значения не равно нулю.</p></section>}
        <section><h4>Зафиксировать результат разбора</h4><p>Если требуется контроль, откройте исходную карточку в ленте: событие можно закрепить, а поручение — оформить как задачу.</p></section>
    </>;
}

export default function Analytics({events, onClose, source}) {
    const [section, select] = useState(0);
    const [ready, setReady] = useState(!events.length);
    const [reported, report] = useState(false);
    const { dialogRef: ref, backdropRef, dismiss } = useAnimatedDialog({onClose, source});
    const close = () => dismiss();
    const model = useMemo(() => summarizeSelection(events), [events]);
    useEffect(() => {
        if (ready) return;
        const timer = setTimeout(() => setReady(true), 5000);
        return () => clearTimeout(timer);
    }, [ready]);
    return createPortal(<>
        <div className="filter-drawer-overlay" ref={backdropRef} data-dialog-motion aria-hidden="true" onClick={close}/>
        <section id="ai-analytics-modal" className="navigator-modal active" role="dialog" aria-modal="true" aria-labelledby="analysis-title" ref={ref} tabIndex={-1} data-dialog-motion>
            <header className="fd-header"><div className="fd-heading">
                <h2 id="analysis-title" data-dialog-title>Аналитика</h2>
                {ready ? <span aria-label={`Событий: ${events.length}`}>{events.length}</span> : null}
            </div><CloseButton data-initial-focus onClick={close}/></header>
            {!events.length ? <div className="analysis-placeholder" role="status">Нет активных событий для анализа.</div> : !ready ? <AnalysisLoading/> :
                <div className="fd-workspace"><nav className="fd-nav" aria-label="Разделы аналитики">{sections.map(([icon,name],i) =>
                    <button type="button" key={name} aria-current={section === i ? 'page' : undefined} onClick={() => select(i)}><Icon name={icon}/>{name}<b aria-label={`Событий: ${model.counts[i]}`}>{model.counts[i]}</b></button>)}</nav>
                    <div className="fd-content analysis-page" key={section}><h3>{sections[section][1]}</h3><Findings section={section} events={events} model={model}/></div></div>}
            <footer className="fd-footer analysis-footer">{reported && <small role="status">PDF-отчёт недоступен в прототипе.</small>}
                <div className="fd-footer-right">{ready && events.length > 0 && <button type="button" className="ai-btn-secondary" onClick={() => report(true)}><Icon name="download" size={16}/>Скачать отчёт</button>}
                    <button type="button" className="ai-btn-secondary" onClick={close}>Закрыть</button></div></footer>
        </section></>, document.body);
}
