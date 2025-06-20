# pyiohook

A robust, native-like keyboard hook for Node.js on Windows. Guarantees English (QWERTY) key output regardless of the system's language layout, making it perfect for barcode scanners, POS systems, and global hotkeys.

## Key Features

*   **Layout Independent:** Always returns English characters, even if the user has a Russian, German, or any other layout active.
*   **Full Key Coverage:** Captures all key presses, including letters, numbers, symbols, function keys (F1-F12), and the numeric keypad (NumPad).
*   **Detailed Modifier Status:** Every key event includes the status of `Shift`, `Ctrl`, and `Alt`, allowing for easy implementation of complex hotkeys.
*   **State-Aware:** Correctly handles `CapsLock` and `NumLock` states.
*   **Robust and Stable:** Designed to be stable and crash-proof, with proper error handling.
*   **Simple Integration:** Emits clean JSON events to `stdout`, making it easy to integrate with any parent process.

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

    // Example: Stopping the hook with the ESC key
    if (event.key === 'ESC') {
      hook.stop();
      console.log('Hook stopped by user.');
    }
  },

  /**
   * Optional. Callback for handling errors from the underlying process.
   */
  onError(err) {
    console.error('[HOOK ERROR]', err);
  }
});

// To stop the hook programmatically later:
setTimeout(() => {
  // Check if the hook is still running before stopping
  if (hook) {
    hook.stop();
    console.log('Hook stopped by timeout.');
  }
}, 30000); // Stop after 30 seconds
```

## For Developers: Rebuilding `hook_server.exe`

If you want to modify the Python script (`hook_server.py`), you will need to recompile the executable.

#### 1. Requirements

*   Python 3.7+
*   The following Python packages:
    ```bash
    pip install pyinstaller pynput
    ```

#### 2. Build Command

This is the **recommended** command to build the `.exe`. It creates a console application, which is less likely to be flagged as a virus by security software.

```bash
pyinstaller --onefile --hidden-import=pynput.keyboard._win32 --hidden-import=pynput.keyboard._base hook_server.py
```

*   **Note:** When a Node.js application runs this `.exe`, a console window may flash for a fraction of a second. This is normal and is the trade-off for better antivirus compatibility.

#### 3. Copy the File

After a successful build, copy the resulting executable from `dist/hook_server.exe` to the `pyiohook/bin/` directory, replacing the old one.

## How It Works

This module works by spawning a small, self-contained Python executable (`hook_server.exe`) as a child process. This native process uses `pynput` and the `WinAPI` to establish a low-level keyboard hook. It captures key events before they are translated by the OS language layout, formats them into JSON, and prints them to its standard output. The Node.js wrapper reads this output line by line, parses the JSON, and emits the events to your `onKey` callback.