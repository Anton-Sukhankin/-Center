class AIInsights {
    constructor() {
        this.init();
    }

    init() {
        this.overlay = document.getElementById('ai-analytics-modal-overlay');
        this.modal = document.getElementById('ai-analytics-modal');
        this.loader = document.getElementById('analytics-loader');
        
        this.header = document.getElementById('analytics-modal-header');
        this.body = document.getElementById('analytics-modal-body');
        this.footer = document.getElementById('analytics-modal-footer');
        this.subtitle = document.getElementById('analytics-modal-subtitle');
    }

    triggerAnalysis() {
        const activeCards = document.querySelectorAll('.event-card:not(.is-excluded)');
        const count = activeCards.length;

        if (count === 0) {
            alert('Нет активных событий для анализа.');
            return;
        }

        // 1. Sequence Start: Animated data capture
        activeCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('ai-card-sending');
                setTimeout(() => card.classList.remove('ai-card-sending'), 1200);
            }, index * 60);
        });

        // 2. Open Modal after 2 seconds delay
        setTimeout(() => {
            this.showModal();
            this.modal.classList.add('is-loading');
            this.loader.style.display = 'flex';
            this.header.style.display = 'none';
            this.body.style.display = 'none';
            this.footer.style.display = 'none';
        }, 2000);

        // 3. Simulate AI Processing & Content Reveal (5 seconds after loader appears)
        setTimeout(() => {
            this.modal.classList.remove('is-loading');
            this.loader.style.display = 'none';
            this.header.style.display = 'flex';
            this.body.style.display = 'block';
            this.footer.style.display = 'flex';

            this.subtitle.textContent = `Событий: ${count}`;
            this.renderModalContent(count);
            
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }, 7000);
    }

    renderModalContent(count) {
        this.body.innerHTML = `
            <!-- General Conclusion -->
            <div class="ai-section">
                <div class="ai-section-label">Общий вывод</div>
                <div class="conclusion-block" style="margin-top:0; background: white; border-radius: 8px;">
                    <p class="ai-summary-text">
                        На основе анализа ${count} событий выявлена положительная динамика в управлении рисками. Подрядчик демонстрирует высокую адаптивность к изменениям, однако сохраняется риск задержки из-за бюрократии.
                    </p>
                </div>
            </div>

            <!-- Identified Links (Separate Cards) -->
            <div class="ai-section">
                <div class="ai-section-label">Выявленные связи</div>
                <div class="drawer-card" style="margin-bottom:12px;">
                    <div class="action-row-left" style="gap:16px;">
                        <div class="action-icon-box"><i data-lucide="link"></i></div>
                        <div class="ai-insight-content">
                            <h4 style="margin:0; font-size:0.95rem;">Логистическая задержка и Смета</h4>
                            <p style="margin:4px 0 0; font-size:0.85rem; color:var(--text-muted);">Сдвиг сроков поставки материалов на 4 дня коррелирует с ростом расходов на 1.2%.</p>
                        </div>
                    </div>
                </div>
                <div class="drawer-card">
                    <div class="action-row-left" style="gap:16px;">
                        <div class="action-icon-box"><i data-lucide="alert-triangle"></i></div>
                        <div class="ai-insight-content">
                            <h4 style="margin:0; font-size:0.95rem;">Человеческий фактор</h4>
                            <p style="margin:4px 0 0; font-size:0.85rem; color:var(--text-muted);">Выявлена повторяющаяся задержка в согласовании актов после смены инженера.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Forecast and Risks (Separate Cards) -->
            <div class="ai-section">
                <div class="ai-section-label">Прогноз и Риски</div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div class="drawer-card impact-block ai-impact-no-hover" style="margin:0; padding:16px; border: 1px solid #F1F3F5; box-shadow: none;">
                        <div class="impact-icon-box" style="background:#FEF2F2; color:#EF4444;">
                            <i data-lucide="bar-chart-3" style="width:20px;height:20px;"></i>
                        </div>
                        <div class="impact-info">
                            <div class="impact-label">Финансовый риск</div>
                            <div class="impact-value neg">➘ -15 000 000 ₽</div>
                        </div>
                    </div>
                    <div class="drawer-card impact-block ai-impact-no-hover" style="margin:0; padding:16px; border: 1px solid #F1F3F5; box-shadow: none;">
                        <div class="impact-icon-box" style="background:#F0F7FF; color:#007AFF;">
                            <i data-lucide="clock" style="width:20px;height:20px;"></i>
                        </div>
                        <div class="impact-info">
                            <div class="impact-label">Сроки сдачи</div>
                            <div class="impact-value pos">➙ +14 дней</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Proposed Actions (Separate Clickable Cards) -->
            <div class="ai-section" style="margin-bottom:0;">
                <div class="ai-section-label">Предлагаемые действия</div>
                <div class="action-row" style="margin-bottom:12px; height:auto;">
                    <div class="action-row-left">
                        <div class="action-icon-box" style="background:#F0F7FF;"><i data-lucide="check-circle" style="color:#007AFF;"></i></div>
                        <span class="action-label" style="font-weight:500;">Ускорить согласование ТЗ по разделу вентиляции до 15.04.2025</span>
                    </div>
                    <i data-lucide="chevron-right" style="color:#ADB5BD; width:18px;height:18px;"></i>
                </div>
                <div class="action-row" style="height:auto;">
                    <div class="action-row-left">
                        <div class="action-icon-box" style="background:#F0F7FF;"><i data-lucide="message-square" style="color:#007AFF;"></i></div>
                        <span class="action-label" style="font-weight:500;">Инициировать встречу с подрядчиком по вопросу логистики</span>
                    </div>
                    <i data-lucide="chevron-right" style="color:#ADB5BD; width:18px;height:18px;"></i>
                </div>
            </div>
        `;
    }

    showModal() {
        if (this.overlay) this.overlay.classList.add('active');
        if (window.lucide) window.lucide.createIcons();
    }

    closeModal() {
        if (this.overlay) this.overlay.classList.remove('active');
    }

    downloadReport() {
        alert('Формирование PDF-отчета...');
    }
}

// Global instance
window.aiInsights = new AIInsights();

window.triggerAIAnalysis = () => {
    window.aiInsights.triggerAnalysis();
};
