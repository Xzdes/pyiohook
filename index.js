// File: index.js (Финальная, стабильная версия)

const { spawn } = require('child_process');
const path = require('path');

const BIN_PATH = path.join(__dirname, 'bin', 'hook_server.exe');

/**
 * Запускает нативный хук клавиатуры.
 * @param {object} [options] - Опции для хука.
 * @param {(event: {type: string, key: string, modifiers: {shift: boolean, ctrl: boolean, alt: boolean}}}) => void} [options.onKey] - Колбэк, вызываемый при каждом нажатии клавиши.
 * @param {(error: Error, line?: string) => void} [options.onError] - Колбэк для обработки ошибок.
 * @returns {{stop: () => void}} - Объект с методом stop() для остановки хука.
 */
function startHook({ onKey, onError } = {}) {
  // Возвращаемся к проверенной и надежной конфигурации spawn.
  // windowsHide: true - это стандартный и стабильный способ Node.js
  // скрыть окно консоли для дочерних процессов в Windows.
  const proc = spawn(BIN_PATH, [], {
    // [stdin, stdout, stderr]
    // stdout и stderr перехватываем для умной обработки.
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  proc.stdout.setEncoding('utf8');
  proc.stderr.setEncoding('utf8');

  let buffer = '';

  // Обработка основного потока данных (JSON-события)
  proc.stdout.on('data', data => {
    buffer += data;
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Оставляем в буфере неполную строку

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      try {
        const event = JSON.parse(trimmedLine);
        if (onKey) onKey(event);
      } catch (e) {
        if (onError) onError(e, trimmedLine);
      }
    }
  });

  // Обработка потока ошибок
  proc.stderr.on('data', data => {
    // Игнорируем стартовое сообщение, но передаем все настоящие ошибки в onError
    if (!data.includes("pyiohook server started.")) {
      if (onError) onError(new Error(data.trim()));
    }
  });

  // Обработка ошибки запуска самого процесса
  proc.on('error', err => {
    if (onError) onError(err);
  });

  // Обработка неожиданного завершения процесса
  proc.on('close', code => {
    // Код 0 или null - штатное завершение. Любой другой код - ошибка.
    if (code !== 0 && code !== null) {
      if (onError) onError(new Error(`Hook process exited with error code: ${code}`));
    }
  });

  return {
    stop: () => {
      proc.kill();
    }
  };
}

module.exports = { startHook };