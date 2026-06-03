/**
 * Event Card Component Logic
 * handles context menus and selection mode interactions.
 */

class EventCardManager {
    constructor() {
        this.init();
    }

    init() {
        // Close menus on outside click
        window.addEventListener('click', () => this.closeAllMenus());
    }

    /**
     * Toggles the visibility of the context menu for a specific card.
     * @param {string} menuId - The ID of the menu element.
     */
    toggleMenu(event, menuId) {
        event.stopPropagation();
        const menu = document.getElementById(menuId);
        const isOpen = menu.classList.contains('active');
        
        this.closeAllMenus();
        
        if (!isOpen) {
            menu.classList.add('active');
        }
    }

    closeAllMenus() {
        document.querySelectorAll('.ec-dropdown-menu').forEach(menu => {
            menu.classList.remove('active');
        });
    }

    /**
     * Visual "deactivation" of the card in Selection Mode.
     * @param {string} cardId - The ID of the card element.
     */
    deactivateCard(event, cardId) {
        event.stopPropagation();
        const card = document.getElementById(cardId);
        if (card) {
            card.classList.toggle('is-deactivated');
        }
    }

    /**
     * Enables or disables Global Selection Mode.
     * @param {boolean} active 
     */
    setSelectionMode(active) {
        if (active) {
            document.body.classList.add('selection-mode-active');
        } else {
            document.body.classList.remove('selection-mode-active');
            // Optionally reset deactivated cards when exiting selection mode
            // document.querySelectorAll('.event-card').forEach(c => c.classList.remove('is-deactivated'));
        }
    }
}

// Global instance for usage in HTML attributes
window.eventCardManager = new EventCardManager();
