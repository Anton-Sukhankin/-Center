import './lightline-button.css';

export function FilterGlyph() {
    return (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M1.333 5.333H3.417 M9.667 5.333H14.667 M1.333 10.667H6.333 M12.583 10.667H14.667"
                strokeWidth="1.333" strokeLinecap="round" />
            <circle cx="6" cy="5.333" r="2" strokeWidth="1.334" />
            <circle cx="10" cy="10.667" r="2" strokeWidth="1.334" />
        </svg>
    );
}

export function FilterButton({ open, filtered, onClick }) {
    function handleClick(event) {
        event.currentTarget.focus({ preventScroll: true });
        onClick(event.currentTarget);
    }

    return (
        <button type="button" className="lightline-button lightline-filter btn-filter"
            aria-label="Фильтры" aria-haspopup="dialog" aria-expanded={open}
            aria-controls={open ? 'filter-drawer' : undefined}
            aria-description={filtered ? 'Условия применены' : undefined}
            title={filtered ? 'Фильтры — условия применены' : 'Фильтры'}
            data-filtered={filtered ? '' : undefined} onClick={handleClick}>
            <FilterGlyph />
        </button>
    );
}

export function CloseButton({ className, ...props }) {
    const classes = ['lightline-button lightline-close', className].filter(Boolean).join(' ');
    return (
        <button {...props} type="button" className={classes} aria-label="Закрыть">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M5 5l6 6m0-6-6 6" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
        </button>
    );
}
