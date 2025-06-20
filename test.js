const { startHook } = require('./index.js'); // если тестируешь локально
// const { startHook } = require('pyiohook'); // если установлен как npm-модуль

console.log('--- pyiohook test ---');
console.log('Жмите на клавиши (10 секунд)...');

const pressedKeys = [];
const errors = [];

const hook = startHook({
  onKey(event) {
    console.log('[KEY]', event.key);
    pressedKeys.push(event.key);
  },
  onError(err, line) {
    console.error('[ERROR]', err, line || '');
    errors.push({ err, line });
  }
});

setTimeout(() => {
  hook.stop();
  console.log('--- Test finished! ---');
  console.log('Keys pressed:', pressedKeys);
  if (errors.length) {
    console.log('Errors:', errors);
  }
  process.exit(0);
}, 10000); // 10 сек
