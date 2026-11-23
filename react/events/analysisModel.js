// Only the frozen feed selection is evidence; group membership is not causation.
function groups(events, field) {
    const buckets = new Map();
    for (const event of events) {
        const label = event[field];
        if (!label) continue;
        if (!buckets.has(label)) buckets.set(label, []);
        buckets.get(label).push(event);
    }
    return Array.from(buckets, ([label, items]) => ({label, items}))
        .sort((a,b) => b.items.length - a.items.length || a.label.localeCompare(b.label, 'ru'));
}

export function summarizeSelection(events) {
    const metrics = groups(events, 'metricName');
    const negative = events.filter(e => e.impactType === 'negative');
    const unassessed = events.filter(e => !e.impact);
    const repeated = metrics.find(g => g.items.length > 1);
    const actionIds = new Set([negative[0], ...(repeated?.items ?? []), unassessed[0]]
        .filter(Boolean).map(e => e.id));
    return {
        sources: groups(events, 'sourceName'),
        metrics, negative, repeated, unassessed,
        counts: [events.length, metrics.reduce((n,g) => n + g.items.length, 0), negative.length, actionIds.size],
        positive: events.filter(e => e.impactType === 'positive'),
    };
}
