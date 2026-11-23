import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn } from 'lucide-react';
import Icon from '../ui/Icon.jsx';
import thumbnail from '../../assets/images/nova-riverside-preview.webp';
import fullImage from '../../assets/images/nova-riverside.webp';

const zoomSteps = 16;
const scales = Array.from({ length: zoomSteps + 1 }, (_, i) => 4 ** (i / zoomSteps));
const initial = { level: 0, x: 0, y: 0 };
const clamp = (n, limit) => Math.max(-limit, Math.min(n, limit));

function constrain(view, area, ratio) {
    if (view.level === 0) return initial;
    const width = Math.max(area.clientWidth, area.clientHeight * ratio);
    const scale = scales[view.level];
    return { ...view,
        x: clamp(view.x, Math.max(0, (width * scale - area.clientWidth) / 2)),
        y: clamp(view.y, Math.max(0, (width / ratio * scale - area.clientHeight) / 2)) };
}

function PlanContent({ onClose, chatOpen, onChat }) {
    const stage = useRef(null), drag = useRef(null), ratio = useRef(16 / 9);
    const [view, setView] = useState(initial);
    const [animateZoom, setAnimateZoom] = useState(false);
    useLayoutEffect(() => {
        const el = stage.current;
        const observer = new ResizeObserver(() => setView(v => constrain(v, el, ratio.current)));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    function zoom(step) {
        setAnimateZoom(true);
        setView(v => {
            const level = Math.max(0, Math.min(scales.length - 1, v.level + step));
            const factor = scales[level] / scales[v.level];
            return constrain({ level, x: v.x * factor, y: v.y * factor }, stage.current, ratio.current);
        });
    }
    function pan(dx, dy) {
        setAnimateZoom(false);
        setView(v => constrain({ ...v, x: v.x + dx, y: v.y + dy }, stage.current, ratio.current));
    }
    return <>
        <div className="plan-stage" ref={stage} data-zoomed={view.level > 0} data-animate-zoom={animateZoom}
            tabIndex={view.level ? 0 : -1} role="group" aria-label="Генплан Nova. Перемещение увеличенного плана стрелками"
            onKeyDown={e => {
                const step = { ArrowRight: [-48, 0], ArrowLeft: [48, 0], ArrowUp: [0, 48], ArrowDown: [0, -48] }[e.key];
                if (step && view.level) { e.preventDefault(); pan(...step); }
            }}
            onPointerDown={e => {
                if (!view.level || !e.isPrimary || e.button !== 0) return;
                drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
                e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={e => {
                const start = drag.current;
                if (!start || start.id !== e.pointerId) return;
                pan(e.clientX - start.x, e.clientY - start.y);
                start.x = e.clientX; start.y = e.clientY;
            }}
            onLostPointerCapture={() => { drag.current = null; }}>
            <img className="project-photo-full" src={fullImage} draggable={false}
                alt="Визуализация Nova: стеклянная башня и бетонные корпуса с зелёными террасами вдоль набережной"
                onLoad={({ currentTarget: img }) => { ratio.current = img.naturalWidth / img.naturalHeight; }}
                style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${scales[view.level]})` }} />
        </div>
        <header className="plan-header">
            <h2 id="plan-view-title">Генплан</h2>
            <div className="plan-header-actions">
                <button type="button" className="assistant-trigger plan-chat" aria-haspopup="dialog" aria-expanded={chatOpen}
                    aria-controls={chatOpen ? 'ai-drawer' : undefined} aria-label="Открыть AI-ассистента"
                    title="Открыть AI-ассистента" onClick={onChat}><Icon name="sparkle" size={20} /></button>
                <button className="plan-control plan-close" type="button" aria-label="Закрыть генплан" title="Закрыть генплан" onClick={onClose}><Icon name="x" size={22} /></button>
            </div>
        </header>
        <div className="plan-tools">
            <div className="plan-zoom-tools" role="group" aria-label="Масштаб генплана">
                <button type="button" className="plan-control" aria-label="Увеличить масштаб" title="Увеличить масштаб" disabled={view.level === scales.length - 1} onClick={() => zoom(1)}><Icon name="plus" size={20} /></button>
                <button type="button" className="plan-control" aria-label="Уменьшить масштаб" title="Уменьшить масштаб" disabled={!view.level} onClick={() => zoom(-1)}><Icon name="minus" size={20} /></button>
                <button type="button" className="plan-control" aria-label="Сбросить масштаб" title="Сбросить масштаб" disabled={!view.level} onClick={() => { setAnimateZoom(true); setView(initial); }}><Icon name="rotate-ccw" size={18} /></button>
            </div>
        </div>
    </>;
}

export default function ProjectImage({ onPlanHost, chatOpen, onPlanChat, onDismissChat }) {
    const dialog = useRef(null), trigger = useRef(null), fullscreenOwner = useRef(false);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (!open) return;
        function syncFullscreen() {
            if (!fullscreenOwner.current || document.fullscreenElement) return;
            fullscreenOwner.current = false;
            if (!chatOpen) dialog.current?.close();
        }
        document.addEventListener('fullscreenchange', syncFullscreen);
        return () => document.removeEventListener('fullscreenchange', syncFullscreen);
    }, [open, chatOpen]);

    function show() {
        if (chatOpen) onDismissChat();
        dialog.current.showModal();
        onPlanHost(dialog.current);
        setOpen(true);
        if (document.fullscreenEnabled && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                if (dialog.current?.open) fullscreenOwner.current = true;
                else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            }).catch(() => {}); // Если браузер запрещает полный экран, диалог всё равно занимает всё окно.
        }
    }
    useLayoutEffect(() => {
        if (open) dialog.current.querySelector('.plan-close')?.focus({ preventScroll: true });
    }, [open]);
    function closed() {
        if (fullscreenOwner.current && document.fullscreenElement) document.exitFullscreen().catch(() => {});
        fullscreenOwner.current = false;
        if (chatOpen) onDismissChat();
        setOpen(false); onPlanHost(null);
        trigger.current?.focus({ preventScroll: true });
    }
    return <>
        <button ref={trigger} type="button" className="project-summary-thumbnail project-photo-trigger"
            aria-label="Открыть генплан проекта Nova" aria-haspopup="dialog" onClick={show}>
            <img src={thumbnail} width="80" height="64" alt="" />
            <span className="project-photo-zoom" aria-hidden="true"><ZoomIn size={20} /></span>
        </button>
        {createPortal(<dialog ref={dialog} className="project-photo-viewer" aria-labelledby="plan-view-title" onClose={closed}
            onCancel={e => { if (chatOpen) { e.preventDefault(); onDismissChat(); } }}>
            {open && <PlanContent chatOpen={chatOpen} onChat={onPlanChat} onClose={() => dialog.current.close()} />}
        </dialog>, document.getElementById('root'))}
    </>;
}
