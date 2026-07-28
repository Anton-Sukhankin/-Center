(function registerAIChatDemoProvider(global) {
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

  function buildDemoResponse(text) {
    const lowerText = String(text || '').toLowerCase();
    let answer = 'Я отвечаю в контексте текущей сметы и правил АНР → АСОР. Могу подсказать, где найти нужный блок, как проверить предупреждение или почему строка могла попасть в ошибки переноса.';

    if (lowerText.includes('создат') || lowerText.includes('строк')) {
      answer = 'Чтобы создать или проверить строку, откройте текущую смету, перейдите к панели **Проверка ИИ** и выберите нужный тип позиций. Для созданных строк отображается сопоставление АНР с АСОР, для нераспознанных — исходные параметры АНР и причина, почему строка не была применена.';
    } else if (lowerText.includes('фильтр') || lowerText.includes('отфильтр')) {
      answer = 'Фильтрация находится в блоке **Список позиций**. Используйте вкладки **Всего создано**, **Предупреждения**, **Ошибки переноса** и **Не распознано**. Стрелки справа листают позиции только внутри выбранного фильтра.';
    } else if (lowerText.includes('ошиб') || lowerText.includes('не распозн')) {
      answer = 'Ошибки делятся на два типа. **Ошибки переноса** относятся к строкам, которые уже есть в АСОР, но требуют исправления. **Не распознано** — это исходные строки АНР, которые система не смогла применить в АСОР, поэтому по ним нет строки в таблице.';
    } else if (lowerText.includes('цена') || lowerText.includes('расцен') || lowerText.includes('группа') || lowerText.includes('материал')) {
      answer = 'Методологически система сопоставляет исходный текст АНР со справочниками АСОР и показывает уровень уверенности. Если найдено несколько близких вариантов или уверенность ниже порога, сметчик выбирает корректное значение вручную и подтверждает результат.';
    } else if (lowerText.includes('привет') || lowerText.includes('здравствуй')) {
      answer = 'Здравствуйте! Я помогу с навигацией по интерфейсу, проверкой предупреждений и методологическими вопросами по сметным позициям.';
    }

    return { text: answer, actions: [], attachments: [] };
  }

  global.SCostAIChatDemo = {
    createResponseProvider(options = {}) {
      const delay = Number.isFinite(options.delay) ? options.delay : 900;
      return async ({ text }) => {
        if (delay > 0) await wait(delay);
        return buildDemoResponse(text);
      };
    }
  };
})(window);
