# pyiohook

Native-like cross-language key hook for barcode scanners and fast typing.  
*Always* English key output, independent from current Windows language layout.

## Usage

```js
const { startHook } = require('pyiohook');

const hook = startHook({
  onKey(event) {
    console.log('[KEY]', event.key);
    // event = { type: "key_press", key: ... }
  },
  onError(err, line) {
    console.error('[ERROR]', err, line);
  }
});

// ... позже:
setTimeout(() => {
  hook.stop();
  console.log('Hook stopped.');
}, 10000);
````

## Platform

* Works out-of-the-box on **Windows** (with provided .exe)
* For other OS: compile and place corresponding hook\_server binary into ./bin

## How does it work?

This module runs a small native Python binary (compiled with PyInstaller) that hooks the keyboard and always emits English key names, even if you use Russian or other layouts.

````

---

## 5. **bin/hook_server.exe**

- Кладёшь свой `hook_server.exe`, собранный PyInstaller'ом.

---

## 6. Как собрать `hook_server.exe`?

(Только если захочешь пересобрать бинарь)
```bash
pip install pyinstaller pynput
pyinstaller --onefile hook_server.py
# Скопируй dist/hook_server.exe в pyiohook/bin/
````

---

## 7. Пример (Node.js-скрипт, который использует pyiohook):

```js
const { startHook } = require('./index.js');

const hook = startHook({
  onKey(event) {
    console.log(event); // { type: 'key_press', key: 'a' }, { type: 'key_press', key: 'ENTER' }, ...
  }
});
