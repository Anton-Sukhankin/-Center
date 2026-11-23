import { useRef } from 'react';
import Icon from './ConstructionIcon.jsx';

function getNextIndex(key, index, length) {
    if (key === 'Home') return 0;
    if (key === 'End') return length - 1;
    if (key === 'ArrowLeft' || key === 'ArrowUp') return (index - 1 + length) % length;
    if (key === 'ArrowRight' || key === 'ArrowDown') return (index + 1) % length;
    return null;
}

export default function ConstructionObjectSelector({ cards, activeId, onSelect }) {
    const listRef = useRef(null);
    const tabs = cards.filter(card => card?.id && !card.disabled);
    const selectedId = tabs.some(card => card.id === activeId) ? activeId : tabs[0]?.id;

    function navigate(event, index) {
        const nextIndex = getNextIndex(event.key, index, tabs.length);
        if (nextIndex === null) return;
        event.preventDefault();
        onSelect(tabs[nextIndex].id);
        listRef.current.children[nextIndex]?.focus();
    }

    return (
        <section className="cos-selector obj-shared-object-list">
            <div ref={listRef} className="cos-list" role="tablist" aria-label="Объекты строительства">
                {tabs.map((card, index) => {
                    const selected = card.id === selectedId;
                    const progress = Math.max(0, Math.min(100, Math.round(Number(card.progressPercent) || 0)));
                    const description = card.descriptionLabel || card.typeLabel;
                    return (
                        <button key={card.id} className={`cos-card${selected ? ' is-selected' : ''}`}
                            type="button" role="tab" id={`obj-object-tab-${card.id}`} aria-controls="obj-work-panel"
                            aria-selected={selected} tabIndex={selected ? 0 : -1}
                            data-construction-object-id={card.id} data-action="select-object"
                            onClick={() => onSelect(card.id)} onKeyDown={event => navigate(event, index)}>
                            <span className="cos-card-head">
                                <span className="cos-card-icon"><Icon name={card.icon || 'building-2'} size={24} className="cos-card-icon-svg" /></span>
                                <span className="cos-card-title">
                                    <strong title={card.name}>{card.name}</strong>
                                    <small title={description}>{description}</small>
                                </span>
                                {selected && <span className="cos-card-check"><Icon name="check" size={15} className="cos-card-icon-svg" /></span>}
                            </span>
                            <span className="cos-card-readiness">
                                <span className="cos-card-progress"><span className="cos-card-ring" style={{ '--cos-progress': `${progress}%` }} /><strong>{progress}%</strong></span>
                                <span className={`cos-card-deviation ${card.deviationTone === 'behind' ? 'is-behind' : 'is-on-plan'}`}>{card.deviationLabel || 'По плану'}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
