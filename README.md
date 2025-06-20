# pyiohook

A robust, native-like keyboard hook for Node.js on Windows. Guarantees English (QWERTY) key output regardless of the system's language layout, making it perfect for barcode scanners, POS systems, and global hotkeys.

## Key Features

*   **Layout Independent:** Always returns English characters, even if the user has a Russian, German, or any other layout active.
*   **Full Key Coverage:** Captures all key presses, including letters, numbers, symbols, function keys (F1-F12), and the numeric keypad (NumPad).
*   **Detailed Modifier Status:** Every key event includes the status of `Shift`, `Ctrl`, and `Alt`, allowing for easy implementation of complex hotkeys.
*   **State-Aware:** Correctly handles `CapsLock` and `NumLock` states.
*   **Robust and Stable:** Designed to be stable and crash-proof, with proper error handling.
*   **PKG-Compatible:** Designed to be bundled into a standalone `.exe` using `pkg`, with a built-in mechanism to handle native binaries.

## Platform

*   **Windows Only:** This module relies on the Windows API (`WinAPI`) to achieve its core functionality and is not compatible with Linux or macOS.

## Installation

```bash
npm i pyiohook
```

## Usage and API

The module exports a single function, `startHook`.

```javascript
const { startHook } = require('pyiohook');

const hook = startHook({
  /**
   * Required. Callback for every key press event.
   * The event object has the following structure:
   * {
   *   type: "key_press",
   *   key: "S", // The key that was pressed, e.g., "a", "F5", "ENTER"
   *   modifiers: { shift: true, ctrl: true, alt: false }
   * }
   */
  onKey(event) {
    console.log(`Key: '${event.key}', Modifiers: ${JSON.stringify(event.modifiers)}`);

    // Example: Handling a hotkey like Ctrl+S
    if (event.key.toLowerCase() === 's' && event.modifiers.ctrl) {
      console.log('>>> Save Action Triggered! <<<');
    }
  },

  /**
   * Optional. Callback for handling errors from the underlying process.
   */
  onError(err) {
    console.error('[HOOK ERROR]', err);
  }
});

// To stop the hook programmatically:
setTimeout(() => hook.stop(), 30000);
```

## Building a Standalone Application (.exe) with `pkg`

To distribute your application to users who don't have Node.js, you can bundle it into a single `.exe` file using `pkg`. `pyiohook` is fully compatible with this process, but requires specific configuration.

Here is a complete guide based on creating a `logger-app` example.

#### Step 1: Install `pkg`

In your application's project folder, install `pkg` as a development dependency:
```bash
npm install --save-dev pkg
```

#### Step 2: Configure `package.json`

You must tell `pkg` to include `pyiohook`'s native binary as an asset. Add a `"pkg"` and `"bin"` section to your `package.json`, and create a build script.

```json
{
  "name": "my-awesome-app",
  "version": "1.0.0",
  "main": "app.js",
  "dependencies": {
    "pyiohook": "^1.4.0"
  },
  "devDependencies": {
    "pkg": "^5.8.1"
  },
  "bin": "app.js",
  "scripts": {
    "start": "node app.js",
    "build": "npx pkg . --targets node18-win-x64 --output my-awesome-app.exe"
  },
  "pkg": {
    "assets": [
      "node_modules/pyiohook/bin/hook_server.exe"
    ]
  }
}
```

#### Step 3: Write `pkg`-Compatible Code

When working with files (like logs), your code must know whether it's running from a `node` script or a compiled `pkg` binary, as file paths will differ.

**Problem:** `__dirname` points to a real folder during development, but to a *virtual* folder inside the `.exe` after compilation.
**Solution:** Use `process.pkg` to detect the environment and choose the correct base directory.

Here's an example from a logger application (`app.js`):

```javascript
const fs = require('fs');
const path = require('path');
const { startHook } = require('pyiohook');

// Detect if running inside a PKG binary
const isPkg = typeof process.pkg !== 'undefined';

// Choose the base directory correctly:
// - In PKG: the directory of the .exe file.
// - In Node: the directory of the script (__dirname).
const baseDir = isPkg ? path.dirname(process.execPath) : __dirname;

const LOG_FILE = path.join(baseDir, 'my-log-file.txt');

// ... your application logic ...
```

#### Step 4: Build the Application

Run the build script you created:
```bash
npm run build
```
This will create `my-awesome-app.exe` in your project folder, ready for distribution. `pyiohook` will automatically handle extracting and running its native binary from a temporary location.

## For Developers: Rebuilding `hook_server.exe`

If you modify `pyiohook`'s internal Python script, you must recompile its `.exe`.

1.  **Requirements:** `pip install pyinstaller pynput`
2.  **Build Command (Recommended):**
    ```bash
    pyinstaller --onefile --hidden-import=pynput.keyboard._win32 --hidden-import=pynput.keyboard._base hook_server.py
    ```
3.  **Copy:** Move the new `dist/hook_server.exe` to the `pyiohook/bin/` directory.

## How It Works

This module spawns a self-contained Python executable (`hook_server.exe`) which uses `WinAPI` to establish a low-level keyboard hook. It captures key events, formats them into JSON, and prints them to `stdout`. The Node.js wrapper reads this output and emits events. When bundled with `pkg`, the module is smart enough to extract the Python `.exe` to a temporary location on the user's machine before running it, ensuring compatibility.