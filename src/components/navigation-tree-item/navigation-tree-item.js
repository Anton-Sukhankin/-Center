/**
 * NavigationTreeItem renders one row in the left navigation tree.
 * Naming intent: Navigation -> Tree -> Item.
 */
(function (window) {
    const ui = window.SCenterUI;

    function renderNavigationTreeItem(params) {
        const {
            level,
            type,
            id,
            title,
            isSelected,
            hasChildren,
            isExpanded,
            currentProjectId
        } = params;

        let iconType = 'folder';
        if (type === 'bu' || type === 'project') {
            iconType = isExpanded ? 'folder-minus' : 'folder-plus';
        }

        const iconClick = hasChildren
            ? `toggleTreeNode('${ui.escapeAttr(id)}', event)`
            : 'event.stopPropagation()';

        return `
            <div class="tree-node" data-level="${ui.escapeAttr(level)}">
                <div class="tree-item ${isSelected ? 'selected' : ''}"
                     onclick="setActiveEntity('${ui.escapeAttr(type)}', '${ui.escapeAttr(id)}', '${ui.escapeAttr(currentProjectId || '')}')">
                    <div class="tree-icon ${type === 'queue' ? 'leaf-icon' : ''}"
                         onclick="${iconClick}">
                         ${ui.icon(iconType)}
                    </div>
                    <span class="tree-item-text">${ui.escapeHtml(title)}</span>
                </div>
        `;
    }

    function renderNavigationTreeItemClose() {
        return `</div>`;
    }

    window.SCenterComponents = window.SCenterComponents || {};
    window.SCenterComponents.renderNavigationTreeItem = renderNavigationTreeItem;
    window.SCenterComponents.renderNavigationTreeItemClose = renderNavigationTreeItemClose;
})(window);
