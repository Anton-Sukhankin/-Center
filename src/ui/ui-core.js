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

    window.SCenterUI = {
        escapeHtml,
        escapeAttr,
        icon
    };
})(window);
