import { useLayoutEffect, useRef, useState } from 'react';
import './milestones.css';

const statuses = {completed:'Завершён', current:'Текущий этап', planned:'Запланирован'};
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Milestones({ milestones, contextLabel }) {
    const [expanded, setExpanded] = useState(true);
    const [edges, setEdges] = useState(0);
    const railRef = useRef(null), trackRef = useRef(null), origin = useRef(0);
    const drag = useRef(null), snapshot = useRef(null);
    const current = Math.max(0, milestones.findIndex(m => m.status === 'current'));
    const start = Math.max(0, Math.min(current - 2, milestones.length - 5));
    const items = expanded ? milestones : milestones.slice(start, start + 5);

    useLayoutEffect(() => {
        const r = railRef.current, track = trackRef.current;
        const active = r.querySelector('[aria-current="step"]');
        r.scrollLeft = 0;
        if (active && r.scrollWidth > r.clientWidth) {
            const box = r.getBoundingClientRect(), first = active.getBoundingClientRect();
            const last = (active.nextElementSibling || active).getBoundingClientRect();
            if (last.right > box.right - 24) r.scrollLeft = Math.min(first.left-box.left-24,last.right-box.right+24);
        }
        origin.current = r.scrollLeft;
        const sync = () => {
            const x = r.scrollLeft, max = r.scrollWidth - r.clientWidth;
            // Measure the visible labels, markers and timestamps, not the empty
            // tail of a grid column. Layout offsets also ignore transition transforms.
            let left = false, right = false;
            if (max > 1) {
                for (const item of r.children) {
                    for (const part of item.children) {
                        if (part.classList.contains('sr')) continue;
                        const start = item.offsetLeft + part.offsetLeft;
                        left ||= x > 1 && start < x - 1;
                        right ||= max - x > 1 && start + part.offsetWidth > x + r.clientWidth + 1;
                    }
                }
            }
            setEdges((left ? 1 : 0) | (right ? 2 : 0));
            const ratio = track.clientWidth / (r.scrollWidth || 1);
            track.firstChild.style.width = (r.clientWidth * ratio) + 'px';
            track.firstChild.style.transform = 'translateX(' + (x * ratio) + 'px)';
        };
        const animations = [];
        if (snapshot.current && !reduceMotion()) {
            for (const item of r.children) {
                const prev = snapshot.current.get(item.dataset.id);
                const dx = prev == null ? 8 : prev - item.getBoundingClientRect().left;
                animations.push(item.animate([{transform:'translateX('+dx+'px)',opacity:prev == null ? 0 : .6},{transform:'none',opacity:1}],
                    {duration:220,easing:'cubic-bezier(.2,.65,.3,1)'}));
            }
        }
        snapshot.current = null;
        sync();
        const ro = new ResizeObserver(sync); ro.observe(r);
        r.querySelectorAll('.name,.stamp').forEach(node => ro.observe(node));
        r.addEventListener('scroll',sync,{passive:true});
        window.addEventListener('blur',endDrag);
        return () => { ro.disconnect(); r.removeEventListener('scroll',sync); window.removeEventListener('blur',endDrag); endDrag(); animations.forEach(a=>a.cancel()); };
    }, [expanded, milestones]);

    function toggle() {
        snapshot.current = new Map(Array.from(railRef.current.children,n=>[n.dataset.id,n.getBoundingClientRect().left]));
        setExpanded(v=>!v);
    }
    function endDrag() {
        const r = railRef.current, id = drag.current?.id;
        drag.current = null;
        if (!r) return;
        r.parentElement.classList.remove('dragging');
        if (id != null && r.hasPointerCapture(id)) r.releasePointerCapture(id);
    }
    function jump() {
        const r = railRef.current, max = r.scrollWidth-r.clientWidth;
        if (edges & 2) {
            if (!r.dataset.gliding) origin.current = r.scrollLeft;
            r.dataset.gliding = 'true';
            r.scrollTo({left:max,behavior:reduceMotion()?'instant':'smooth'});
        } else {
            delete r.dataset.gliding;
            r.scrollTo({left:origin.current >= max-1 ? 0 : origin.current,behavior:reduceMotion()?'instant':'smooth'});
        }
    }
    return <section className="stage-line metrics-milestones-panel" aria-labelledby="metrics-milestones-title">
        <header className="sheet-head"><div><h2 id="metrics-milestones-title">Контрольные этапы</h2>
            <p>{contextLabel ? contextLabel+' · ' : ''}Показано {items.length} из {milestones.length} · {milestones.some(m=>m.demoTime) ? 'Время для примера' : 'Время не задано'}</p></div>
            {milestones.length>5 && <button className="extent" aria-controls="metrics-milestone-timeline" aria-expanded={expanded} onClick={toggle}>{expanded?'Свернуть':'Все этапы'}</button>}
        </header>
        <div className={'viewport'+(edges&1?' more-left':'')+(edges&2?' more-right':'')}>
            <ol id="metrics-milestone-timeline" className={'metrics-timeline rail'+(!expanded&&items.length===5?' compact':'')} aria-label="Хронология этапов" tabIndex={0} ref={railRef}
                onScrollEnd={e=>{delete e.currentTarget.dataset.gliding;}}
                onPointerDown={e=>{const r=e.currentTarget;if(e.pointerType!=='mouse'||e.button!==0||!edges)return;r.scrollTo({left:r.scrollLeft,behavior:'instant'});drag.current={id:e.pointerId,x:e.clientX,left:r.scrollLeft};r.setPointerCapture(e.pointerId);}}
                onPointerMove={e=>{const d=drag.current,r=e.currentTarget;if(!d||d.id!==e.pointerId)return;if(!(e.buttons&1)){endDrag();return;}const dx=d.x-e.clientX;if(Math.abs(dx)<3&&!r.parentElement.classList.contains('dragging'))return;const old=r.scrollLeft;r.scrollLeft=d.left+dx;if(old!==r.scrollLeft)r.parentElement.classList.add('dragging');}}
                onPointerCancel={endDrag} onPointerUp={endDrag} onLostPointerCapture={endDrag}>
                {items.map(m=>{const date=m.actualDate||m.forecastDate||m.plannedDate;return <li className={'metrics-milestone '+m.status} data-id={m.id} key={m.id} aria-current={m.status==='current'?'step':undefined}>
                    <i className={'mark '+m.status} aria-hidden="true"/><span className="sr">{statuses[m.status]}</span><span className="name">{m.name}</span>
                    <span className="stamp">{m.demoTime ? <time dateTime={m.demoTime}>{m.demoTime}</time> : <span aria-label="Время не указано">—</span>}
                        <time className="metrics-milestone-date" dateTime={date}>{date ? date.split('-').reverse().join('.') : 'Нет даты'}</time></span>
                </li>})}
            </ol>
            <div className="drag-track" ref={trackRef} aria-hidden="true"><i/></div>
            {edges!==0 && <button className={'jump'+(edges&2?'':' return')} onClick={jump} aria-controls="metrics-milestone-timeline" aria-label={edges&2?'К концу ленты':'Вернуться к исходной позиции'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>}
        </div>
    </section>;
}
