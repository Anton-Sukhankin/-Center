import { useLayoutEffect, useRef } from 'react';
import { useDialog } from './useDialog.js';
import { dialogMotionTiming } from './dialogMotionTiming.js';
import './dialog-motion.css';

const durations = dialogMotionTiming;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const block = event => { event.preventDefault(); event.stopImmediatePropagation(); };
const exits = new WeakMap();

export function closeAnimatedSurface(surface, fallback) {
    const exit = exits.get(surface);
    if (exit) exit(fallback);
    else fallback();
}

function box(element, visible = false) {
    if (!element?.isConnected || element.matches(':disabled') || !element.getClientRects().length) return null;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (!rect.width || !rect.height || style.visibility !== 'visible' ||
        (visible && (rect.bottom <= 0 || rect.right <= 0 || rect.left >= innerWidth || rect.top >= innerHeight))) return null;
    return { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`,
        borderRadius: style.borderRadius };
}

export function useAnimatedDialog({ onClose, onEscape, source, focusSource = source, surfaceSelector, companionSelector, siblingCompanionSelector, active = true, overlayContainsSurface = false, relatedControl }) {
    const layer = useRef(null);
    const backdropRef = useRef(null);
    const dialogRef = useDialog({
        active,
        trigger: focusSource,
        relatedControl,
        fallbackFocus: true,
        onClose: () => onEscape ? onEscape() : dismiss()
    });

    function dismiss(action = onClose, apply) {
        const motion = layer.current;
        if (!motion || reduced()) {
            if (motion?.closing) return;
            if (motion) motion.closing = true;
            apply?.();
            action();
            return;
        }
        if (motion.closing) return;
        motion.close(action, apply);
    }

    useLayoutEffect(() => {
        const owner = dialogRef.current;
        const surface = surfaceSelector ? owner?.querySelector(surfaceSelector) : owner;
        const backdrop = backdropRef.current;
        if (!surface) return;
        let animations = [];
        let ghost;
        let finish;
        let exitTimeout;
        let restoreSibling;
        const motion = { closing: false, close };
        layer.current = motion;
        exits.set(surface, dismiss);
        const style = getComputedStyle(surface);
        const paint = { background: style.backgroundColor, border: style.border, boxShadow: style.boxShadow };
        const originalOpacity = style.opacity;
        const scrim = backdrop && getComputedStyle(backdrop);
        const originalScrim = scrim && (overlayContainsSurface
            ? { backgroundColor: scrim.backgroundColor, backdropFilter: scrim.backdropFilter }
            : { opacity: scrim.opacity });
        const clearScrim = overlayContainsSurface
            ? { backgroundColor: 'transparent', backdropFilter: 'blur(0px)' }
            : { opacity: 0 };
        const options = (duration) => ({ duration, easing: durations.easing, fill: 'both' });
        function stop() {
            clearTimeout(exitTimeout);
            for (const animation of animations) {
                animation.onfinish = null;
                animation.oncancel = null;
                animation.cancel();
            }
            animations = [];
            ghost?.remove();
            ghost = null;
        }
        function animate(node, frames, duration) {
            const animation = node.animate(frames, options(duration));
            animations.push(animation);
            return animation;
        }
        function makeGhost() {
            const node = document.createElement('div');
            node.className = 'dialog-motion-surface';
            node.setAttribute('aria-hidden', 'true');
            node.dataset.dialogMotionSurface = '';
            Object.assign(node.style, paint, { zIndex: style.zIndex === 'auto' ? '1' : style.zIndex });
            surface.after(node);
            return node;
        }
        function readScrim() {
            if (!backdrop) return null;
            const current = getComputedStyle(backdrop);
            return overlayContainsSurface
                ? { backgroundColor: current.backgroundColor, backdropFilter: current.backdropFilter }
                : { opacity: current.opacity };
        }
        function close(action, apply) {
            motion.closing = true;
            const openingBox = box(ghost);
            const ghostOpacity = ghost ? getComputedStyle(ghost).opacity : 0;
            const opacity = getComputedStyle(surface).opacity;
            const backdropNow = readScrim();
            stop();
            const from = openingBox || box(surface);
            const to = box(source, true);
            owner.addEventListener('click', block, true);
            owner.addEventListener('submit', block, true);
            const duration = durations.close;
            if (from && to) {
                ghost = makeGhost();
                animate(ghost, [{ ...from, opacity: ghostOpacity }, { opacity: 1, offset: .24 }, { ...to, opacity: 0 }], duration);
            }
            const exit = animate(surface, from && to
                ? [{ opacity }, { opacity: 0, offset: .45 }, { opacity: 0 }]
                : [{ opacity }, { opacity: 0 }], duration);
            const companion = companionSelector && owner.querySelector(companionSelector);
            if (companion) animate(companion, [{ opacity: getComputedStyle(companion).opacity }, { opacity: 0 }], duration);
            const sibling = siblingCompanionSelector && owner.parentElement?.querySelector(siblingCompanionSelector);
            if (sibling) {
                const wasInert = sibling.inert;
                sibling.inert = true;
                restoreSibling = () => { sibling.inert = wasInert; };
                animate(sibling, [{ opacity: getComputedStyle(sibling).opacity }, { opacity: 0 }], duration);
            }
            if (backdropNow) animate(backdrop, [backdropNow, clearScrim], duration);
            finish = () => {
                if (!finish) return;
                finish = null;
                clearTimeout(exitTimeout);
                action();
            };
            exit.onfinish = finish;
            exit.oncancel = () => finish?.();
            exitTimeout = setTimeout(() => finish?.(), duration + 80);
            apply?.();
        }
        function resize() {
            if (finish) finish();
            else stop();
        }
        const media = matchMedia('(prefers-reduced-motion: reduce)');
        function motionPreference() { if (media.matches) resize(); }
        if (!reduced()) {
            const from = box(source, true);
            const to = box(surface);
            if (from && to) {
                ghost = makeGhost();
                animate(ghost, [{ ...from, opacity: 1 }, { opacity: 1, offset: .64 }, { ...to, opacity: 0 }], durations.open);
            }
            const opening = animate(surface, from && to
                ? [{ opacity: 0 }, { opacity: 0, offset: .38 }, { opacity: originalOpacity }]
                : [{ opacity: 0 }, { opacity: originalOpacity }], durations.open);
            if (originalScrim) animate(backdrop, [clearScrim, originalScrim], durations.open);
            opening.onfinish = stop;
            opening.oncancel = stop;
        }
        window.addEventListener('resize', resize);
        function shieldWheel(event) {
            if (!owner.contains(event.target)) event.preventDefault();
        }
        backdrop?.addEventListener('wheel', shieldWheel, { passive: false });
        media.addEventListener('change', motionPreference);
        return () => {
            finish = null;
            window.removeEventListener('resize', resize);
            media.removeEventListener('change', motionPreference);
            backdrop?.removeEventListener('wheel', shieldWheel);
            exits.delete(surface);
            owner.removeEventListener('click', block, true);
            owner.removeEventListener('submit', block, true);
            restoreSibling?.();
            stop();
            layer.current = null;
        };
    }, [dialogRef, source, surfaceSelector, companionSelector, siblingCompanionSelector, overlayContainsSurface]);

    return { dialogRef, backdropRef, dismiss };
}
