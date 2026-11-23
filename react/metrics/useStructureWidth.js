import { useLayoutEffect, useRef, useState } from 'react';
import { dialogMotionTiming } from '../ui/dialogMotionTiming.js';

const px = value => `${value}px`;

export function useStructureWidth(workspace, paired, requestedWidth, onWidthChange) {
    const [lockedChartWidth, setLockedChartWidth] = useState(null);
    const [values, setValues] = useState({ width: 500, min: 360, max: 500 });
    const [dragging, setDragging] = useState(false);
    const drawer = useRef(null);
    const gesture = useRef(null);
    const beforePair = useRef(null);
    const pairWidth = useRef(null);
    const sizeMotion = useRef(null);

    function preparePair() {
        beforePair.current = drawer.current.getBoundingClientRect();
    }

    function stopMotion() {
        const animation = sizeMotion.current;
        sizeMotion.current = null;
        animation?.cancel();
    }

    function measure() {
        const root = workspace.current;
        const panel = drawer.current.getBoundingClientRect();
        const style = getComputedStyle(root);
        const chart = paired && root.querySelector('.metric-bi-dialog')?.getBoundingClientRect();
        const beside = chart && chart.right <= panel.left + 1;
        const chartWidth = beside ? chart.width : null;
        const left = parseFloat(style.getPropertyValue('--metric-structure-left-edge'));
        const gap = beside ? parseFloat(style.columnGap) : 0;
        const max = Math.max(0, Math.round(panel.right - left - gap - (chartWidth || 0)));
        const min = Math.min(max, parseFloat(style.getPropertyValue('--metric-structure-min')));
        return { width: Math.round(panel.width), min, max, chartWidth };
    }

    function end() {
        const current = gesture.current;
        if (!current) return;
        gesture.current = null;
        if (current.target.hasPointerCapture(current.id)) current.target.releasePointerCapture(current.id);
        setDragging(false);
    }

    useLayoutEffect(() => {
        end();
        if (!paired) {
            setLockedChartWidth(null);
            if (pairWidth.current !== null && measure().width > pairWidth.current) onWidthChange(pairWidth.current);
            pairWidth.current = null;
        }
        const panel = drawer.current;
        const chart = workspace.current.querySelector('.metric-bi-dialog');
        const sync = () => {
            if (sizeMotion.current) return;
            const { width, min, max } = measure();
            if (paired) pairWidth.current = width;
            setValues(old => old.width === width && old.min === min && old.max === max ? old : { width, min, max });
        };
        const resized = () => { stopMotion(); end(); sync(); };
        const media = matchMedia('(prefers-reduced-motion: reduce)');
        const onMotionPreference = () => { if (media.matches) resized(); };
        sync();
        const before = beforePair.current;
        beforePair.current = null;
        if (paired && before) {
            const after = panel.getBoundingClientRect();
            if (Math.round(before.width) > Math.round(after.width)) onWidthChange(Math.round(after.width));
            const frames = [{}, {}];
            for (const dimension of ['width', 'height']) {
                if (Math.abs(before[dimension] - after[dimension]) < .5) continue;
                frames[0][dimension] = px(before[dimension]);
                frames[1][dimension] = px(after[dimension]);
            }
            if (!media.matches && Object.keys(frames[0]).length) {
                // У графика финальная геометрия с первого кадра; меняется только размер структуры.
                const animation = panel.animate(frames, { duration: dialogMotionTiming.open, easing: dialogMotionTiming.easing });
                sizeMotion.current = animation;
                animation.onfinish = () => {
                    if (sizeMotion.current !== animation) return;
                    stopMotion();
                    sync();
                };
            }
        }
        const observer = new ResizeObserver(sync);
        observer.observe(panel);
        if (chart) observer.observe(chart);
        window.addEventListener('resize', resized);
        media.addEventListener('change', onMotionPreference);
        return () => {
            stopMotion();
            observer.disconnect();
            window.removeEventListener('resize', resized);
            media.removeEventListener('change', onMotionPreference);
        };
    }, [workspace, paired, onWidthChange]);

    function setWidth(next, { min, max }) {
        onWidthChange(Math.min(max, Math.max(min, next)));
    }

    function start(event) {
        if (event.button !== 0 || gesture.current) return;
        stopMotion();
        const bounds = measure();
        if (bounds.max <= bounds.min) return;
        event.preventDefault();
        const target = event.currentTarget;
        target.focus({ preventScroll: true });
        target.setPointerCapture(event.pointerId);
        gesture.current = { bounds, target, id: event.pointerId, x: event.clientX };
        setLockedChartWidth(bounds.chartWidth);
        setDragging(true);
    }

    function move(event) {
        const drag = gesture.current;
        if (drag?.id !== event.pointerId) return;
        setWidth(drag.bounds.width + drag.x - event.clientX, drag.bounds);
    }

    function stop(event) {
        if (gesture.current?.id === event.pointerId) end();
    }

    function key(event) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        stopMotion();
        const bounds = measure();
        if (bounds.max <= bounds.min) return;
        const step = event.shiftKey ? 48 : 16;
        const next = { ArrowLeft: bounds.width + step, ArrowRight: bounds.width - step, Home: bounds.min, End: bounds.max }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        setLockedChartWidth(bounds.chartWidth);
        setWidth(next, bounds);
    }

    return {
        drawer, dragging,
        preparePair,
        style: {
            '--metric-structure-request': requestedWidth == null ? undefined : px(requestedWidth),
            '--metric-chart-lock': !paired || lockedChartWidth == null ? undefined : px(lockedChartWidth)
        },
        handle: {
            'aria-valuenow': values.width, 'aria-valuemin': values.min, 'aria-valuemax': values.max,
            hidden: values.max <= values.min,
            onPointerDown: start, onPointerMove: move, onPointerUp: stop,
            onPointerCancel: stop, onLostPointerCapture: stop, onKeyDown: key
        }
    };
}
