/**
 * Base UI helpers for shared render functions.
 * Components use this layer for predictable text and attribute output.
 */
(function (window) {
    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }

    function icon(name, className = '', style = '') {
        return `<i data-lucide="${escapeAttr(name)}"${className ? ` class="${escapeAttr(className)}"` : ''}${style ? ` style="${escapeAttr(style)}"` : ''}></i>`;
    }

    function renderInlineText(value, options = {}) {
        let html = escapeHtml(value);
        html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
        if (options.preserveLineBreaks) {
            html = html.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
        }
        return html;
    }

    window.SCenterUI = {
        escapeHtml,
        escapeAttr,
        icon,
        renderInlineText
    };
})(window);
