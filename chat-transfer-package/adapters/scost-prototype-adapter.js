(function configureSCostPrototypeChat(global) {
  function getProjectTitle() {
    return document.querySelector('.title-row h1')?.textContent?.trim() || 'АСОР №67408';
  }

  function getSelectedNode() {
    if (!global.activeTreeNodeId || !global.findMetadataNodeById) return null;
    return global.findMetadataNodeById(global.activeTreeNodeId);
  }

  global.configureAIChat({
    getMountElement: () => document.getElementById('ai-sidebar-drawer-root'),
    getTriggerElement: () => document.getElementById('btn-trigger-ai-chat'),

    getContext: () => {
      const selectedNode = getSelectedNode();
      return {
        mode: global.metadataPanelState?.mode || (selectedNode ? 'selected-document' : 'general'),
        projectTitle: getProjectTitle(),
        selectedNodeId: selectedNode?.id || null,
        selectedNodeName: selectedNode?.name || null
      };
    },

    getContextLabel: context => {
      const reviewDrawer = document.getElementById('reviewDrawer');
      const reviewTitle = document.getElementById('reviewContextTitle')?.textContent?.trim();
      const reviewStatus = document.getElementById('reviewCollisionType')?.textContent?.trim();
      if (reviewDrawer?.getAttribute('aria-hidden') === 'false' && reviewTitle) {
        return `Контекст: проверка позиции · ${reviewTitle}${reviewStatus ? ` · ${reviewStatus}` : ''}`;
      }
      return `Контекст: текущая смета · ${context.projectTitle} · АНР → АСОР`;
    },

    getSuggestedChatTitle: context => context.selectedNodeName || 'Новый чат: контекст не выбран',

    // В прототипе переписка намеренно живёт только до перезагрузки страницы.
    loadWorkspace: () => null,
    saveWorkspace: () => {},

    sendMessage: global.SCostAIChatDemo.createResponseProvider({ delay: 900 }),

    onBeforeOpen: () => {
      const reviewDrawer = document.getElementById('reviewDrawer');
      if (reviewDrawer?.getAttribute('aria-hidden') === 'false') {
        global.closeReviewDrawer?.();
      }
    },

    onAttachFile: () => {
      global.alert('Прикрепление файлов: выберите документ для добавления в контекст чата ИИ.');
    },

    onAction: () => ({
      text: 'В текущей версии ИИ-чат не выполняет автоматические действия с таблицей. Я могу объяснить следующий шаг, но изменение строки выполняется только пользователем в интерфейсе проверки.'
    })
  });
})(window);
