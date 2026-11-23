import { useLayoutEffect, useRef, useState } from 'react';

const EMPTY_INDICATORS = {
    vertical: { visible: false, start: 0, end: 0, size: 0, offset: 0 },
    horizontal: { visible: false, end: 0, size: 0, offset: 0 }
};

function measureIndicators(scroller) {
    const body = scroller.querySelector('tbody');
    const header = scroller.querySelector('thead th');
    const footer = scroller.querySelector('tfoot td');
    if (!body || !header || !footer) return EMPTY_INDICATORS;

    const bounds = scroller.getBoundingClientRect();
    const start = Math.max(0, header.getBoundingClientRect().bottom - bounds.top + 4);
    const end = Math.max(0, bounds.bottom - footer.getBoundingClientRect().top + 8);
    const trackHeight = Math.max(0, scroller.clientHeight - start - end);
    const bodyHeight = body.getBoundingClientRect().height;
    const verticalRange = scroller.scrollHeight - scroller.clientHeight;
    const height = Math.max(22, trackHeight * Math.min(1, trackHeight / Math.max(1, bodyHeight)));
    const trackWidth = Math.max(0, scroller.clientWidth - 12);
    const horizontalRange = scroller.scrollWidth - scroller.clientWidth;
    const width = Math.max(22, trackWidth * scroller.clientWidth / Math.max(1, scroller.scrollWidth));

    return {
        vertical: {
            visible: trackHeight > 0 && verticalRange > 1 && bodyHeight > trackHeight,
            start, end, size: height,
            offset: scroller.scrollTop / Math.max(1, verticalRange) * Math.max(0, trackHeight - height)
        },
        horizontal: {
            visible: horizontalRange > 1,
            end, size: width,
            offset: scroller.scrollLeft / Math.max(1, horizontalRange) * Math.max(0, trackWidth - width)
        }
    };
}

export default function ConstructionTable({ prefix, labelId, active, children }) {
    const scrollRef = useRef(null);
    const dragRef = useRef(null);
    const [indicators, setIndicators] = useState(EMPTY_INDICATORS);
    const [dragAxis, setDragAxis] = useState(null);

    useLayoutEffect(() => {
        if (!active) {
            const drag = dragRef.current;
            dragRef.current = null;
            if (drag?.thumb.hasPointerCapture?.(drag.pointerId)) drag.thumb.releasePointerCapture(drag.pointerId);
            setDragAxis(null);
            return;
        }
        const scroller = scrollRef.current;
        const table = scroller.querySelector('table');
        let frame = 0;
        const refresh = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                setIndicators(measureIndicators(scroller));
            });
        };
        const observer = new ResizeObserver(refresh);
        observer.observe(scroller);
        if (table) observer.observe(table);
        scroller.addEventListener('scroll', refresh, { passive: true });
        refresh();
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            scroller.removeEventListener('scroll', refresh);
        };
    }, [active]);

    function startDrag(event, axis) {
        if (!event.isPrimary || event.button !== 0) return;
        const thumb = event.currentTarget;
        const track = thumb.parentElement;
        const scroller = scrollRef.current;
        const vertical = axis === 'vertical';
        event.preventDefault();
        thumb.setPointerCapture(event.pointerId);
        dragRef.current = {
            axis, thumb, pointerId: event.pointerId,
            startPointer: vertical ? event.clientY : event.clientX,
            startScroll: vertical ? scroller.scrollTop : scroller.scrollLeft,
            range: vertical ? scroller.scrollHeight - scroller.clientHeight : scroller.scrollWidth - scroller.clientWidth,
            travel: Math.max(1, vertical ? track.clientHeight - thumb.offsetHeight : track.clientWidth - thumb.offsetWidth)
        };
        setDragAxis(axis);
    }

    function moveDrag(event) {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const vertical = drag.axis === 'vertical';
        const pointer = vertical ? event.clientY : event.clientX;
        const scroll = drag.startScroll + (pointer - drag.startPointer) * drag.range / drag.travel;
        if (vertical) scrollRef.current.scrollTop = scroll;
        else scrollRef.current.scrollLeft = scroll;
    }

    function stopDrag(event) {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        dragRef.current = null;
        setDragAxis(null);
        if (drag.thumb.hasPointerCapture(event.pointerId)) drag.thumb.releasePointerCapture(event.pointerId);
    }

    return (
        <div className={`${prefix}-table-shell sct-shell`}>
            <div className={`${prefix}-table-scroll sct-scroll`} ref={scrollRef}
                role="region" aria-labelledby={labelId} tabIndex={0}>
                {children}
            </div>
            {['vertical', 'horizontal'].map(axis => {
                const indicator = indicators[axis];
                const isVertical = axis === 'vertical';
                return (
                    <i key={axis} aria-hidden="true"
                        className={`${prefix}-table-scroll-indicator sct-indicator is-${axis}${indicator.visible ? ' is-visible' : ''}`}
                        style={{ bottom: indicator.end, top: isVertical ? indicator.start : undefined }}>
                        <b data-scroll-axis={axis}
                            className={dragAxis === axis ? 'is-dragging' : undefined}
                            style={isVertical ? { height: indicator.size, top: indicator.offset, touchAction: 'none' } : { width: indicator.size, left: indicator.offset, touchAction: 'none' }}
                            onPointerDown={event => startDrag(event, axis)} onPointerMove={moveDrag}
                            onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={stopDrag} />
                    </i>
                );
            })}
        </div>
    );
}
