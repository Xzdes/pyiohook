// Файл: test.js (Улучшенная версия для демонстрации)

// Используем установленный модуль. Раскомментируйте другую строку, если тестируете локально.
const { startHook } = require('./index.js');

console.log('--- pyiohook: Расширенный тест ---');
console.log('Инструкции:');
console.log('1. Нажимайте любые клавиши (буквы, цифры, символы).');
console.log('2. Переключите раскладку (например, на русскую) и продолжайте печатать.');
console.log('3. Попробуйте горячие клавиши: Ctrl+S, Alt+T, или Shift+1.');
console.log('4. Нажмите ESC, чтобы остановить тест досрочно.');
console.log('Тест автоматически завершится через 30 секунд.');
console.log('----------------------------------------------------');

let eventCount = 0;
const errors = [];
let stopTimeout; // Переменная для таймера

// Функция для чистого завершения теста
const stopTest = (reason = 'таймаут') => {
  // Важно сначала отменить таймер, если остановка вызвана не им
  clearTimeout(stopTimeout);

  hook.stop();
  console.log('----------------------------------------------------');
  console.log(`Хук остановлен (причина: ${reason}).`);
  console.log('--- Тест завершен! ---');
  console.log(`Всего событий перехвачено: ${eventCount}`);

  if (errors.length > 0) {
    console.error(`Обнаружено ошибок: ${errors.length}`);
    console.error('Детали ошибок:', errors);
  } else {
    console.log('Ошибок не обнаружено. Отличная работа!');
  }
  process.exit(0);
};

const hook = startHook({
  onKey(event) {
    eventCount++;
    // Выводим всю информацию о событии в удобном виде
    const modifiers = JSON.stringify(event.modifiers);
    console.log(`[Событие ${eventCount}] Клавиша: '${event.key}', Модификаторы: ${modifiers}`);

    // --- Примеры обработки горячих клавиш ---

    // 1. Выход по нажатию ESC
    if (event.key === 'ESC') {
      stopTest('нажатие ESC');
    }

    // 2. Демонстрация обнаружения Ctrl+S
    if (event.key === 's' && event.modifiers.ctrl) {
      console.log('>>> Обнаружена горячая клавиша: Сохранить (Ctrl+S)');
    }
  },
  onError(err, line) {
    console.error('--- [ОШИБКА ХУКА] ---');
    console.error('Произошла ошибка в дочернем процессе:');
    console.error(err);
    if (line) {
      console.error(`Невалидные данные, полученные от хука: "${line}"`);
    }
    errors.push({ err, line });
  }
});

// Запускаем таймер автоматической остановки
stopTimeout = setTimeout(() => stopTest('таймаут'), 30000); // 30 секунд