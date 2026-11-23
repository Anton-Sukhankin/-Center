const months = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
const factEnd = 7;
const interpolate = (start, end, progress) => start + (end - start) * progress;
const decimal = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export function formatMetricValue(value) {
    return (Math.abs(value) < 10 ? decimal : integer).format(value);
}

export function createMetricSeries(metric) {
    let seed = Array.from(String(metric.id || 'metric')).reduce((value, char, index) =>
        (value + char.charCodeAt(0) * (index + 1)) % 233280, 0);
    function random() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }
    const planTarget = Number(metric.plan) || 0;
    const factTarget = Number(metric.fact) || 0;
    const forecast = Number(metric.forecast);
    const forecastTarget = Number.isFinite(forecast) ? forecast : factTarget;
    const magnitude = Math.max(Math.abs(planTarget), Math.abs(factTarget), Math.abs(forecastTarget), 1);
    const start = planTarget - magnitude * (0.18 + random() * 0.08);
    const last = months.length - 1;
    return months.map((month, index) => {
        const progress = index / last;
        const noise = (random() - 0.5) * magnitude * 0.08 * Math.sin(progress * Math.PI);
        const isForecast = index > factEnd;
        const plan = interpolate(start, planTarget, progress);
        const actual = isForecast
            ? interpolate(factTarget, forecastTarget, (index - factEnd) / (last - factEnd)) + noise * 0.45
            : interpolate(start, factTarget, index / factEnd) + (index < factEnd ? noise : 0);
        return { month, plan, actual, isForecast };
    });
}

export function makeChart(points, scalePoints = points) {
    const values = scalePoints.flatMap(point => [point.plan, point.actual]);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (max === min) { min -= 1; max += 1; }
    const padding = (max - min) * 0.16;
    min -= padding;
    max += padding;
    const width = 1000 / points.length;
    const x = index => width * (index + 0.5);
    const y = value => 34 + (max - value) / (max - min) * 352;
    const path = (items, accessor, start = 0) => items.map((item, index) =>
        `${index === 0 ? 'M' : 'L'} ${x(start + index).toFixed(2)} ${y(accessor(item)).toFixed(2)}`).join(' ');
    return {
        grid: [0, .25, .5, .75, 1].map(t => ({ y: 34 + 352 * t, value: max - (max-min)*t })),
        markers: points.map((p, i) => ({ x: x(i), planY: y(p.plan), actualY: y(p.actual) })),
        area: path(points, p => p.actual) + ' ' + points.map((_, j) => {
            const i = points.length - 1 - j;
            return `L ${x(i)} ${y(points[i].plan)}`;
        }).join(' ') + ' Z',
        plan: path(points, item => item.plan),
        fact: path(points.slice(0, factEnd + 1), item => item.actual),
        forecast: points.length > factEnd + 1 ? path(points.slice(factEnd), item => item.actual, factEnd) : null
    };
}
