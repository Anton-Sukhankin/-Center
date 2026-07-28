// Общий lifecycle локальных scroll-индикаторов строительных таблиц.
(function (window, document) {
    'use strict';

    function bind(root, options = {}) {
        if (!root) throw new Error('SCenterConstructionTable.bind: root is required.');
        const selectors = {
            scroll: options.scrollSelector || '.sct-scroll',
            shell: options.shellSelector || '.sct-shell',
            vertical: options.verticalSelector || '.sct-indicator.is-vertical',
            horizontal: options.horizontalSelector || '.sct-indicator.is-horizontal'
        };
        const scroller = root.querySelector(selectors.scroll);
        if (!scroller) return Object.freeze({ refresh() {}, destroy() {} });
        const shell = scroller.closest(selectors.shell);
        const vertical = shell?.querySelector(selectors.vertical);
        const horizontal = shell?.querySelector(selectors.horizontal);
        const vThumb = vertical?.querySelector('[data-scroll-axis="vertical"]');
        const hThumb = horizontal?.querySelector('[data-scroll-axis="horizontal"]');
        let observer = null;
        let frame = 0;
        let stopDrag = null;

        function refresh() {
            if (!shell || !vertical || !horizontal || !vThumb || !hThumb) return;
            const body = scroller.querySelector('tbody');
            const header = scroller.querySelector('thead th');
            const footer = scroller.querySelector('tfoot td');
            if (!body || !header || !footer) return;
            const rect = scroller.getBoundingClientRect();
            const top = Math.max(0, header.getBoundingClientRect().bottom - rect.top + 4);
            const bottom = Math.max(0, rect.bottom - footer.getBoundingClientRect().top + 8);
            const trackHeight = Math.max(0, scroller.clientHeight - top - bottom);
            const verticalRange = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
            const bodyHeight = body.getBoundingClientRect().height;
            vertical.style.top = `${top}px`;
            vertical.style.bottom = `${bottom}px`;
            vertical.classList.toggle('is-visible', verticalRange > 1 && bodyHeight > trackHeight);
            if (verticalRange > 1) {
                const thumbHeight = Math.max(22, trackHeight * Math.min(1, trackHeight / Math.max(1, bodyHeight)));
                vThumb.style.height = `${thumbHeight}px`;
                vThumb.style.top = `${(scroller.scrollTop / verticalRange) * Math.max(0, trackHeight - thumbHeight)}px`;
            }
            const horizontalRange = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
            const trackWidth = Math.max(0, scroller.clientWidth - 12);
            horizontal.style.bottom = `${bottom}px`;
            horizontal.classList.toggle('is-visible', horizontalRange > 1);
            if (horizontalRange > 1) {
                const thumbWidth = Math.max(22, trackWidth * Math.min(1, scroller.clientWidth / scroller.scrollWidth));
                hThumb.style.width = `${thumbWidth}px`;
                hThumb.style.left = `${(scroller.scrollLeft / horizontalRange) * Math.max(0, trackWidth - thumbWidth)}px`;
            }
        }

        function handlePointerDown(event) {
            const thumb = event.target.closest?.('[data-scroll-axis]');
            if (!thumb || !shell?.contains(thumb)) return;
            const axis = thumb.dataset.scrollAxis;
            const track = thumb.parentElement;
            if (!track || !['vertical', 'horizontal'].includes(axis)) return;
            event.preventDefault();
            const startPointer = axis === 'vertical' ? event.clientY : event.clientX;
            const startScroll = axis === 'vertical' ? scroller.scrollTop : scroller.scrollLeft;
            const range = axis === 'vertical'
                ? scroller.scrollHeight - scroller.clientHeight
                : scroller.scrollWidth - scroller.clientWidth;
            const travel = axis === 'vertical'
                ? Math.max(1, track.clientHeight - thumb.offsetHeight)
                : Math.max(1, track.clientWidth - thumb.offsetWidth);
            thumb.setPointerCapture?.(event.pointerId);
            thumb.classList.add('is-dragging');
            const move = (moveEvent) => {
                const pointer = axis === 'vertical' ? moveEvent.clientY : moveEvent.clientX;
                const next = startScroll + (pointer - startPointer) * range / travel;
                if (axis === 'vertical') scroller.scrollTop = next;
                else scroller.scrollLeft = next;
            };
            const stop = () => {
                thumb.classList.remove('is-dragging');
                document.removeEventListener('pointermove', move);
                document.removeEventListener('pointerup', stop);
                stopDrag = null;
            };
            stopDrag?.();
            stopDrag = stop;
            document.addEventListener('pointermove', move);
            document.addEventListener('pointerup', stop, { once: true });
        }

        scroller.addEventListener('scroll', refresh, { passive: true });
        window.addEventListener('resize', refresh);
        root.addEventListener('pointerdown', handlePointerDown);
        if (window.ResizeObserver) {
            observer = new window.ResizeObserver(refresh);
            observer.observe(scroller);
            const table = scroller.querySelector('table');
            if (table) observer.observe(table);
        }
        frame = window.requestAnimationFrame(refresh);

        function destroy() {
            window.cancelAnimationFrame(frame);
            stopDrag?.();
            observer?.disconnect();
            scroller.removeEventListener('scroll', refresh);
            window.removeEventListener('resize', refresh);
            root.removeEventListener('pointerdown', handlePointerDown);
        }

        return Object.freeze({ refresh, destroy });
    }

    window.SCenterConstructionTable = Object.freeze({ bind });
})(window, document);
