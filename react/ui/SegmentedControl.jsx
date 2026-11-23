export function SegmentedControl({ className = '', role = 'group', ...props }) {
    return <div {...props} role={role} className={`toolbar-segmented ${className}`.trimEnd()} />;
}

export function SegmentedButton({ active, role, ...props }) {
    return <button {...props} type="button" role={role} className={`seg-tab${active ? ' active' : ''}`}
        aria-selected={role === 'tab' ? active : undefined} aria-pressed={role === 'tab' ? undefined : active} />;
}
