(function startStandaloneDemo(global) {
  global.SCostAIChat.configure({
    getMountElement: () => document.getElementById('demo-chat-root'),
    getTriggerElement: () => document.getElementById('demo-chat-trigger'),
    getContext: () => ({
      mode: 'standalone-demo',
      projectTitle: 'Демонстрационный проект',
      selectedNodeId: null,
      selectedNodeName: null
    }),
    getContextLabel: context => `Контекст: ${context.projectTitle} · автономный запуск`,
    getSuggestedChatTitle: () => 'Новый демонстрационный чат',
    loadWorkspace: key => {
      const serialized = global.localStorage.getItem(key);
      return serialized ? JSON.parse(serialized) : null;
    },
    saveWorkspace: (key, workspace) => {
      global.localStorage.setItem(key, JSON.stringify(workspace));
    },
    sendMessage: global.SCostAIChatDemo.createResponseProvider({ delay: 900 }),
    onAttachFile: () => global.alert('В демо вложения не подключены.'),
    onAction: () => ({ text: 'Демо-приложение получило действие из сообщения.' })
  });

  global.SCostAIChat.init();
  document.getElementById('demo-chat-trigger').addEventListener('click', global.SCostAIChat.toggle);
})(window);
