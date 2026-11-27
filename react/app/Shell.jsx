import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import ProjectImage from './ProjectImage.jsx';

export function Header({ chatOpen, onChat }) {
    return <header className="top-navbar">
        <div className="navbar-brand"><div className="logo"><Icon name="building-2" size={24} /><span>AIShtab</span></div></div>
        <div className="navbar-actions">
            <button type="button" id="open-scenter-ai-chat" className="assistant-trigger" aria-haspopup="dialog"
                aria-expanded={chatOpen} aria-controls={chatOpen ? 'ai-drawer' : undefined} onClick={onChat}>
                <Icon name="sparkle" size={20} /><span>AI ассистент</span>
            </button>
        </div>
    </header>;
}

function matches(node, query) {
    return node.name.toLocaleLowerCase('ru').includes(query) || node.children?.some(child => matches(child, query));
}

function ContextBranch({ node, depth, query, expanded, onToggle, onSelect, selection }) {
    if (query && !matches(node, query)) return null;
    const hasChildren = Boolean(node.children?.length);
    const isExpanded = hasChildren && Boolean(query || (expanded[node.id] ?? node.isExpanded));
    const isSelected = node.id === selection;
    const icon = node.type === 'queue' ? 'building-2' : isExpanded ? 'folder-open' : 'folder';
    return <div className="tree-node" data-level={depth}>
        <div className={`tree-item ${isSelected ? 'selected' : ''}`}>
            {hasChildren ? <button type="button" className="tree-icon tree-expander" onClick={() => onToggle(node.id, isExpanded)}
                aria-label={`${isExpanded ? 'Свернуть' : 'Развернуть'}: ${node.name}`} aria-expanded={isExpanded}>
                <Icon name={icon} size={18} />
            </button> : <span className={`tree-icon ${node.type === 'queue' ? 'leaf-icon' : ''}`}><Icon name={icon} size={18} /></span>}
            <button type="button" className="tree-item-label" aria-current={isSelected ? 'true' : undefined}
                title={node.name} onClick={() => onSelect(node.type, node.id)}>
                <span className="tree-item-text">{node.name}</span>
            </button>
        </div>
        {hasChildren && isExpanded ? <div className="tree-children">
            {node.children.map(child => <ContextBranch key={child.id} node={child} depth={depth + 1} query={query}
                expanded={expanded} onToggle={onToggle} onSelect={onSelect} selection={selection} />)}
        </div> : null}
    </div>;
}

export function Sidebar({ nodes, selection, onSelect }) {
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const [expanded, setExpanded] = useState({});
    const query = search.trim().toLocaleLowerCase('ru');
    const tree = useRef(null);
    const scrollThumb = useRef(null);

    useEffect(() => {
        if (collapsed) return;
        const viewport = tree.current, thumb = scrollThumb.current;
        let lastTop = viewport.scrollTop, wheelAt = -Infinity, direction, hideTimer;

        function hide() {
            clearTimeout(hideTimer);
            thumb.classList.remove('is-visible');
        }
        function onWheel(event) {
            if (event.ctrlKey || event.shiftKey || !event.deltaY) return;
            wheelAt = performance.now();
            direction = Math.sign(event.deltaY);
        }
        function onScroll() {
            const { clientHeight, scrollHeight, scrollTop } = viewport;
            const movement = scrollTop - lastTop;
            lastTop = scrollTop;
            if (!movement) return;
            const range = scrollHeight - clientHeight;
            // Заданное колесом направление должно привести к реальному смещению списка.
            if (range <= 0 || Math.sign(movement) !== direction || performance.now() - wheelAt > 220) {
                hide();
                return;
            }
            const length = Math.min(clientHeight, Math.max(24, clientHeight ** 2 / scrollHeight));
            const progress = Math.max(0, Math.min(1, scrollTop / range));
            thumb.style.height = `${length}px`;
            thumb.style.transform = `translateY(${progress * (clientHeight - length)}px)`;
            thumb.classList.add('is-visible');
            clearTimeout(hideTimer);
            hideTimer = setTimeout(hide, 650);
        }
        function interrupt() {
            wheelAt = -Infinity;
            hide();
        }

        viewport.addEventListener('wheel', onWheel, { passive: true });
        viewport.addEventListener('scroll', onScroll, { passive: true });
        viewport.addEventListener('keydown', interrupt);
        viewport.addEventListener('pointerdown', interrupt, { passive: true });
        return () => {
            hide();
            viewport.removeEventListener('wheel', onWheel);
            viewport.removeEventListener('scroll', onScroll);
            viewport.removeEventListener('keydown', interrupt);
            viewport.removeEventListener('pointerdown', interrupt);
        };
    }, [collapsed, expanded, query]);

    return <aside className={`left-panel${collapsed ? ' collapsed' : ''}`} id="left-sidebar" aria-label="Навигация по проектам">
        <div className="left-panel-header">
            <label className="left-search-box" id="project-search-root" hidden={collapsed}><Icon name="search" size={18} /><input type="search" placeholder="Поиск" aria-label="Поиск проекта"
                value={search} onChange={event => setSearch(event.target.value)} /></label>
            <button type="button" className="left-panel-collapse-btn" aria-controls="project-search-root project-tree-root" aria-expanded={!collapsed}
                aria-label={collapsed ? 'Развернуть левую панель' : 'Свернуть левую панель'} onClick={() => setCollapsed(value => !value)}>
                <Icon name={collapsed ? 'chevrons-right' : 'chevrons-left'} size={16} />
            </button>
        </div>
        <div className="project-tree-viewport" hidden={collapsed}>
            <div className="project-tree-container" id="project-tree-root" ref={tree}>
                {nodes.map(node => <ContextBranch key={node.id} node={node} depth={0} query={query} expanded={expanded}
                    selection={selection} onSelect={onSelect} onToggle={(id, isExpanded) => setExpanded(map => ({ ...map, [id]: !isExpanded }))} />)}
            </div>
            <span className="project-tree-scroll-thumb" ref={scrollThumb} aria-hidden="true" />
        </div>
    </aside>;
}

export function ProjectHeader({ context, findEntity, onPlanHost, chatOpen, onPlanChat, onDismissChat }) {
    const entity = findEntity(context.id);
    const project = context.type === 'queue' ? findEntity(context.projectId) : entity;
    const name = context.type === 'queue' ? `${project?.name || ''} / ${entity?.name || ''}` : entity?.name;
    const attributes = context.type === 'bu' ? {
        stage: 'Многофункциональный', businessUnit: entity?.name, cluster: 'N/A', region: 'N/A', manager: 'Центральный офис'
    } : project?.headerAttributes;
    if (!attributes) return null;
    return <div id="project-header-container"><div className="project-summary-header">
        {context.type !== 'bu' && (project?.id === 'proj-nova'
            ? <ProjectImage onPlanHost={onPlanHost} chatOpen={chatOpen} onPlanChat={onPlanChat} onDismissChat={onDismissChat} />
            : <div className="project-summary-thumbnail" aria-hidden="true" />)}
        <div className="project-summary-content">
            <div className="project-summary-title">{name}</div>
            <div className="project-summary-meta">
                <span><b className="project-summary-label">Стадия:</b> {attributes.stage}</span>
                <span><b className="project-summary-label">БЮ:</b> {attributes.businessUnit}</span>
                <span><b className="project-summary-label">Кластер:</b> {attributes.cluster} / {attributes.region}</span>
                <span><b className="project-summary-label">РП:</b> {attributes.manager}</span>
            </div>
        </div>
    </div></div>;
}
