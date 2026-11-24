import { useLayoutEffect, useRef } from 'react';

const activeDialogs = [];
const focusable = [
    'button:not(:disabled)', '[href]', 'input:not(:disabled):not([type="hidden"])',
    'select:not(:disabled)', 'textarea:not(:disabled)', '[tabindex="0"]'
].join(',');

function visibleControls(dialog) {
    return [...dialog.querySelectorAll(focusable)].filter(element =>
        element.tabIndex >= 0 && element.getClientRects().length && !element.closest('[inert], [hidden], [aria-hidden="true"]')
    );
}

function canRestoreFocus(element) {
    return element instanceof HTMLElement && element.isConnected && !element.matches(':disabled') &&
        element.getClientRects().length && getComputedStyle(element).visibility === 'visible' &&
        !element.closest('[hidden], [inert], [aria-hidden="true"]');
}

function onDocumentKeyDown(event) {
    const layer = activeDialogs.at(-1);
    if (!layer || event.defaultPrevented) return;
    if (layer.dialog.closest('[inert]')) {
        if (event.key === 'Escape' || event.key === 'Tab') event.preventDefault();
        return;
    }

    if (event.key === 'Escape') {
        event.preventDefault();
        layer.close();
    } else if (event.key === 'Tab') {
        const controls = visibleControls(layer.dialog);
        const related = layer.relatedControl
            ? [...document.querySelectorAll(layer.relatedControl)].filter(canRestoreFocus)
            : [];
        if (related.length) {
            controls.push(...related);
            const index = controls.indexOf(document.activeElement);
            const next = index < 0 ? (event.shiftKey ? controls.length - 1 : 0)
                : (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
            event.preventDefault();
            controls[next].focus({ preventScroll: true });
            return;
        }
        const first = controls[0] || layer.dialog;
        const last = controls.at(-1) || layer.dialog;
        const current = document.activeElement;

        if (!layer.dialog.contains(current) || (event.shiftKey ? current === first : current === last)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
        }
    }
}

export function useDialog({ onClose, active = true, restoreFocus = true, trigger: providedTrigger, fallbackFocus = false, relatedControl }) {
    const dialogRef = useRef(null);
    const callbacks = useRef({ onClose, restoreFocus });
    useLayoutEffect(() => { callbacks.current = { onClose, restoreFocus }; }, [onClose, restoreFocus]);

    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        if (!active || !dialog) return;

        const trigger = providedTrigger || document.activeElement;
        const layer = { dialog, relatedControl, trigger, parent: activeDialogs.at(-1), close: () => callbacks.current.onClose() };
        if (activeDialogs.length === 0) document.addEventListener('keydown', onDocumentKeyDown);
        activeDialogs.push(layer);
        const initialTarget = dialog.querySelector('[data-initial-focus]') || visibleControls(dialog)[0] || dialog;
        initialTarget.focus({ preventScroll: true });

        return () => {
            const wasTop = activeDialogs.at(-1) === layer;
            activeDialogs.splice(activeDialogs.indexOf(layer), 1);
            if (activeDialogs.length === 0) document.removeEventListener('keydown', onDocumentKeyDown);
            if (wasTop && callbacks.current.restoreFocus) {
                queueMicrotask(() => {
                    const parent = activeDialogs.at(-1)?.dialog;
                    for (let ancestor = layer; ancestor; ancestor = ancestor.parent) {
                        const target = ancestor.trigger;
                        if (canRestoreFocus(target) && (!parent || parent.contains(target))) {
                            target.focus({ preventScroll: true });
                            return;
                        }
                    }
                    if (fallbackFocus) {
                        if (parent?.contains(document.activeElement) && canRestoreFocus(document.activeElement)) return;
                        const fallback = parent ? visibleControls(parent)[0] || parent
                            : ['#event-toolbar-root button.active', '#event-toolbar-root button', '#root .top-navbar button']
                                .flatMap(selector => [...document.querySelectorAll(selector)]).find(canRestoreFocus);
                        fallback?.focus({ preventScroll: true });
                    }
                });
            }
        };
    }, [active, providedTrigger, fallbackFocus, relatedControl]);
    return dialogRef;
}
