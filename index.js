// File: index.js (Финальная, "пуленепробиваемая" версия для PKG)

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// --- ЛОГИКА ОПРЕДЕЛЕНИЯ ПУТИ К БИНАРНИКУ ---

// Определяем, запущен ли скрипт внутри .exe, собранного pkg
const isPkg = typeof process.pkg !== 'undefined';

// Путь к hook_server.exe внутри виртуальной ФС pkg или в обычной папке
const sourceBinPath = path.join(__dirname, 'bin', 'hook_server.exe');

// Переменная для хранения пути к временному файлу, если он будет создан
let temporaryBinPath = null;

function getExecutablePath() {
  if (!isPkg) {
    // Режим разработки: просто возвращаем путь к бинарнику в ./bin
    return sourceBinPath;
  }

  // Режим PKG: извлекаем бинарник во временную папку
  try {
    // Создаем уникальное имя для временного файла
    const tempDir = os.tmpdir();
    temporaryBinPath = path.join(tempDir, `pyiohook_${Date.now()}_hook_server.exe`);

    // Читаем бинарник из виртуальной ФС pkg
    const binaryData = fs.readFileSync(sourceBinPath);
    
    // Записываем его на реальный диск во временную папку
    fs.writeFileSync(temporaryBinPath, binaryData);
    
    // Даем права на исполнение (важно для кросс-платформенности в будущем)
    fs.chmodSync(temporaryBinPath, 0o755);

    return temporaryBinPath;
  } catch (error) {
    // Если что-то пошло не так, возвращаем null и обработаем ошибку ниже
    console.error('Failed to extract hook binary:', error);
    return null;
  }
}

function cleanupTemporaryFile() {
  if (temporaryBinPath && fs.existsSync(temporaryBinPath)) {
    try {
      fs.unlinkSync(temporaryBinPath);
    } catch (error) {
      // Игнорируем ошибки при удалении, т.к. это не критично
    }
  }
}

// --- ОСНОВНАЯ ФУНКЦИЯ МОДУЛЯ ---

function startHook({ onKey, onError } = {}) {
  const executablePath = getExecutablePath();

  if (!executablePath) {
    if (onError) onError(new Error("Could not get path to hook_server.exe"));
    return { stop: () => {} }; // Возвращаем пустой объект, если не смогли запуститься
  }

  const proc = spawn(executablePath, [], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  proc.stdout.setEncoding('utf8');
  proc.stderr.setEncoding('utf8');

  let buffer = '';

  proc.stdout.on('data', data => {
    buffer += data;
    const lines = buffer.split('\n');
    buffer = lines.pop();
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

  proc.stderr.on('data', data => {
    if (!data.includes("pyiohook server started.")) {
      if (onError) onError(new Error(data.trim()));
    }
  });

  proc.on('error', err => {
    if (onError) onError(err);
    cleanupTemporaryFile();
  });

  proc.on('close', code => {
    if (code !== 0 && code !== null) {
      if (onError) onError(new Error(`Hook process exited with error code: ${code}`));
    }
    cleanupTemporaryFile();
  });
  
  // Добавляем глобальный обработчик для очистки файла при завершении процесса
  process.on('exit', cleanupTemporaryFile);

  return {
    stop: () => {
      proc.kill();
      // Очистка вызывается автоматически через событие 'close'
    }
  };
}

module.exports = { startHook };