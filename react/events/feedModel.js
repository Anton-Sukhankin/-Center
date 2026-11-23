export const initialFilters = {
    activeTab: 'today', period: '', sources: [], priority: 'all', metrics: [], priorityView: 'high'
};
export const isHighPriority = event => event.priority === 'high' || event.priority === 'critical';
export function hasFilters(filters) {
    return Boolean(filters.period || filters.sources.length ||
        filters.priority !== 'all' || filters.metrics.length);
}

export function getFeed(events, filters, now = new Date()) {
    const today = now.toISOString().slice(0, 10);
    const isToday = event => /сегодня/i.test(event.dateText) || event.dateText?.startsWith(today);
    const selected = events.filter(event => {
        if (event.hidden) return false;
        if (filters.priority === 'high' && !isHighPriority(event)) return false;
        if (filters.priority === 'low' && event.priority !== 'low') return false;
        if (filters.sources.length && !filters.sources.includes(event.sourceId || event.sourceName)) return false;
        if (filters.metrics.length && !filters.metrics.includes(event.metricId)) return false;
        if (filters.period === 'today' && !isToday(event)) return false;
        if (filters.period === 'week' && !isToday(event) &&
            !(/вчера/i.test(event.dateText) || event.dateText?.startsWith(today.slice(0, 7)))) return false;
        return !event.excluded;
    });
    const daily = selected.filter(isToday);
    const pinned = selected.filter(event => event.pinned);
    const visible = { today: daily, all: selected, pinned, metrics: [] }[filters.activeTab] || [];
    const high = visible.filter(isHighPriority);
    const low = visible.filter(event => !isHighPriority(event));
    return {
        counts: { today: daily.length, all: selected.length, pinned: pinned.length },
        total: visible.length,
        high: high.length,
        low: low.length,
        page: filters.priorityView === 'low' ? low : high,
        visible
    };
}

export function findMetric(root, id) {
    if (!root || !id) return null;
    if (root.id === id) return root;
    for (const child of root.children || []) {
        const found = findMetric(child, id);
        if (found) return found;
    }
    return null;
}
