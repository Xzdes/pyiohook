const { spawn } = require('child_process');
const path = require('path');

const BIN_PATH = path.join(__dirname, 'bin', 'hook_server.exe'); // для Windows

function startHook({ onKey, onError } = {}) {
  const proc = spawn(BIN_PATH, [], {
    stdio: ['ignore', 'pipe', 'inherit'],
    windowsHide: true,
  });

  proc.stdout.setEncoding('utf8');
  let buffer = '';

  proc.stdout.on('data', data => {
    buffer += data;
    let lines = buffer.split('\n');
    buffer = lines.pop(); // если строка не закончилась
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      try {
        const event = JSON.parse(line);
        if (onKey) onKey(event);
      } catch (e) {
        if (onError) onError(e, line);
      }
    }
  });

  proc.on('error', err => {
    if (onError) onError(err);
  });

  return {
    stop: () => {
      proc.kill();
    }
  };
}

// Экспорт по-умолчанию
module.exports = { startHook };
