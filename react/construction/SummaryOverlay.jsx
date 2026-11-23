import { closeAnimatedSurface, useAnimatedDialog } from '../ui/useAnimatedDialog.js';
import { CloseButton } from '../ui/LightlineButton.jsx';
import Icon from './ConstructionIcon.jsx';

function Overlay({ title, subtitle, icon, print, onClose, footer, children, source }) {
    const { dialogRef: dialog, backdropRef, dismiss } = useAnimatedDialog({ onClose, source, overlayContainsSurface: true });
    const id = print ? 'dcs-print-title' : 'dcs-overlay-title';
    return (
        <div className={`dcs-overlay${print ? ' dcs-modal-overlay' : ''}`} ref={backdropRef} data-dialog-motion
            onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
            <section ref={dialog} tabIndex={-1} className={print ? 'dcs-print-modal' : 'dcs-drawer'}
                role="dialog" aria-modal="true" aria-labelledby={id} data-dialog-motion>
                <header>
                    <div><span><Icon name={icon} size={21} /></span><div><h2 data-dialog-title id={id}>{title}</h2><p>{subtitle}</p></div></div>
                    <CloseButton data-initial-focus onClick={() => dismiss()} />
                </header>
                {print ? children : <div className="dcs-drawer-body">{children}</div>}
                {footer && <footer>{footer}</footer>}
            </section>
        </div>
    );
}

function Archive({ model, overlay, onClose, onRetry, onSnapshot }) {
    return (
        <Overlay title="Архив сводок" subtitle={model.project?.name} icon="history" onClose={onClose} source={overlay.source}>
            {overlay.status === 'error' ? (
                <div className="dcs-overlay-state"><Icon name="triangle-alert" size={24} /><strong>Архив временно недоступен</strong>
                    <button type="button" onClick={event => {
                        event.currentTarget.closest('[role="dialog"]')?.querySelector('[data-initial-focus]')?.focus();
                        onRetry();
                    }}>Повторить</button>
                </div>
            ) : overlay.status === 'empty' || !model.archive?.length ? (
                <div className="dcs-overlay-state"><Icon name="archive" size={24} /><strong>Архивных снимков пока нет</strong><span>Первый снимок появится после закрытия отчетного периода.</span></div>
            ) : (
                <div className="dcs-archive-list">
                    {model.archive.map(snapshot => <button key={snapshot.id} type="button" onClick={event => {
                        closeAnimatedSurface(event.currentTarget.closest('[role="dialog"]'), () => onSnapshot(snapshot));
                    }}>
                        <span><Icon name="file-clock" size={19} /><span><strong>{snapshot.title}</strong><small>{snapshot.period}</small></span></span>
                        <Icon name="chevron-right" size={18} />
                    </button>)}
                </div>
            )}
        </Overlay>
    );
}

function Detail({ model, item, onClose, onCopy, onFuture }) {
    const issue = item.kind === 'issue';
    const report = item.kind === 'report';
    const title = issue ? 'Проблема проекта' : report ? 'Недельный отчет' : 'Карточка объекта';
    const name = item.title || item.name || 'Детали';
    const period = model.period?.label || '';
    const footer = (
        <>
            <button type="button" className="dcs-secondary-button" onClick={() => onCopy(name)}><Icon name="copy" size={16} />Скопировать ссылку</button>
            <button type="button" className="dcs-primary-button" onClick={onFuture}><Icon name="external-link" size={16} />Открыть</button>
        </>
    );

    return (
        <Overlay title={title} subtitle={model.project?.name} icon={issue ? 'triangle-alert' : report ? 'file-text' : 'building-2'}
            onClose={onClose} footer={footer}>
            <span className={`dcs-detail-status is-${item.tone || 'info'}`}>
                <Icon name={issue ? 'circle-alert' : report ? 'file-text' : 'building-2'} size={17} />
                {issue ? `${item.count || 0} сигналов` : report ? period : `${item.readinessPercent || 0}% готовности`}
            </span>
            <h3>{name}</h3>
            <p>{item.detail || (report
                ? 'Сводный отчет объединяет недельные изменения по объектам, рискам и полноте данных.'
                : 'Демонстрационная детализация выбранного элемента сводки.')}</p>
            <dl><div><dt>Проект</dt><dd>{model.project?.name || '—'}</dd></div><div><dt>Период</dt><dd>{period || '—'}</dd></div></dl>
        </Overlay>
    );
}

function PrintPreview({ model, onClose, source }) {
    const footer = (
        <>
            <button type="button" className="dcs-secondary-button" onClick={event => closeAnimatedSurface(event.currentTarget.closest('[role="dialog"]'), onClose)}>Отмена</button>
            <button type="button" className="dcs-primary-button" onClick={() => window.print()}><Icon name="printer" size={17} />Печать</button>
        </>
    );
    return (
        <Overlay title="Печать сводки" subtitle={model.project?.name} icon="printer" print onClose={onClose} footer={footer} source={source}>
            <div className="dcs-print-sheet">
                <div className="dcs-print-heading">
                    <div><small>Проектная сводка</small><h3>{model.project?.name}</h3><p>{model.period?.label}</p></div>
                    <Icon name="drafting-compass" size={30} />
                </div>
                <div className="dcs-print-kpis">{model.kpis?.slice(0, 4).map(kpi => <div key={kpi.id || kpi.label}><span>{kpi.label}</span><strong>{kpi.value}</strong></div>)}</div>
                <table><thead><tr><th>Объект</th><th>Готовность</th><th>Динамика</th><th>Риски</th></tr></thead>
                    <tbody>{model.objects?.map(object => <tr key={object.id}><td>{object.name}</td><td>{object.readinessPercent}%</td>
                        <td>{object.weeklyDeltaPercent > 0 ? '+' : ''}{object.weeklyDeltaPercent}%</td><td>{object.risk.count}</td></tr>)}</tbody>
                </table>
            </div>
        </Overlay>
    );
}

export default function SummaryOverlay({ model, overlay, onClose, onRetry, onSnapshot, onCopy, onFuture }) {
    if (overlay.kind === 'print') return <PrintPreview model={model} onClose={onClose} source={overlay.source} />;
    if (overlay.kind === 'archive') return <Archive model={model} overlay={overlay} onClose={onClose} onRetry={onRetry} onSnapshot={onSnapshot} />;
    return <Detail model={model} item={overlay.item} onClose={onClose} onCopy={onCopy} onFuture={onFuture} />;
}
