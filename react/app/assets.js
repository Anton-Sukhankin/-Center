const assets = import.meta.glob('../../assets/images/**/*.{png,jpg,webp,svg}', {
    eager: true,
    import: 'default',
    query: '?url'
});

export function assetUrl(path) {
    return assets[`../../${String(path || '').replace(/^\.?\//, '')}`] || undefined;
}
