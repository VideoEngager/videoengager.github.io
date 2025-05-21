# VideoEngager UMD SDK Demo Harness

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
A zero-friction, ES-module demo harness for VideoEngager’s UMD SDK, requiring no build tools or frameworks. Launch in 30 seconds to test core chat and video functionalities.

---

## Getting Started

### Prerequisites

* A modern web browser.
* [Node.js](https://nodejs.org/) (optional, for `npm start`).

### Quick Start

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/VideoEngager/videoengager.github.io](https://github.com/VideoEngager/videoengager.github.io) # Or your specific demo repo URL
    cd videoengager.github.io/examples/messaging # Adjust path to match your repository structure
    ```

2.  **Configure (Optional - uses test defaults):**
    Edit `js/config.js` to set your SDK parameters if needed. See the "Configuration" section below for details.

3.  **Run the demo:**
    From the `examples/messaging` directory (or your demo's root if `package.json` is there):
    ```bash
    npm start
    ```
    (This assumes a `package.json` with a start script like `"start": "http-server public -o"`. If not using `npm start`, use your preferred static server command, e.g., `npx http-server ./public -o` from within the demo's root directory where `public/` resides.)

    This will open `public/index.html` in your default browser.

---

## How to Use

1.  **Initialize SDK:** Click "Initialize SDK". The log confirms readiness.
2.  **Start Interaction:** Click "Start Chat" or "Start Video". UI updates reflect the active state (`idle`, `chat`, or `video`).
3.  **Observe:** The inline video container appears for video calls (default `isPopup: false`). The log shows user actions and SDK events.
4.  **End Interaction:** Click "End Chat" or "End Video" to terminate sessions.

---

## Configuration

Core SDK parameters are managed in `js/config.js` via the `testConfig` object. Modify this file to test with different environments or accounts.

Key properties structure (see `js/config.js` for default values and detailed comments):
```javascript
// js/config.js
export const testConfig = {
  videoEngager: { tenantId: '...', veEnv: '...', isPopup: false },
  genesys:      { deploymentId: '...', domain: '...' },
  useGenesysMessengerChat: true
};
```

The `js/client.js` module correctly structures this configuration for the VideoEngager UMD SDK.

-----

## Troubleshooting

  * **HTTP 404 on `genesys-hub.umd.js` (or SDK script):** Verify your internet connection. The CDN URL for the SDK is defined in `js/client.js`.
  * **"Init error: …" in Log:**
      * Check your `testConfig` values in `js/config.js` are correct for your VideoEngager/Genesys environment.
      * Review the browser's developer console for more detailed errors from the SDK.
  * **"Genesys script is not loaded" (during chat/video start):**
      * Ensure `useGenesysMessengerChat: true` is set in `js/config.js`.
      * Confirm your Genesys `domain` and `deploymentId` in `js/config.js` are valid.
  * **File Path Issues:** The demo uses relative paths. If serving from a sub-directory or with a complex server setup, ensure paths in `public/index.html` to `styles.css` and `../js/main.js` are resolving correctly.

-----

## Key Code Overview

This demo utilizes a modular JavaScript structure to separate concerns and provide a clean interaction layer with the VideoEngager UMD SDK.

### `js/client.js` ([VideoEngagerClient](js/client.js))

This class is the core adapter responsible for all direct interactions with the VideoEngager UMD SDK.

  * **Initialization (`async init()`):**
      * Sets up the global configuration (`window.__VideoEngagerConfigs`) and the command queue proxy (`window.VideoEngager` and `window.__VideoEngagerQueue`) required by the UMD SDK. This ensures configurations like `useGenesysMessengerChat` are correctly placed.
      * Dynamically loads the main SDK script (`genesys-hub.umd.js`) from the CDN.
      * Waits for the SDK's internal `onReady` signal before resolving, ensuring the SDK is fully initialized and the proxy has been replaced by the real API.
    <!-- end list -->
    ```javascript
    // js/client.js - Simplified init flow
    async init() {
      this._setupConfigProxy(); // Sets window.__VideoEngagerConfigs, window.VideoEngager proxy
      await this._loadScript();   // Loads the UMD script tag
      await this._waitForReady(); // Waits for window.VideoEngager.onReady() callback
    }
    ```
  * **Public API Methods:** Exposes clean, Promise-based methods (e.g., `startChat()`, `endVideo()`, `on(event, callback)`) that internally call the corresponding `window.VideoEngager` functions. This abstracts the global SDK object from the rest of the application.
    ```javascript
    // js/client.js - Example public method
    startChat()  { return window.VideoEngager.startGenesysChat(); }
    ```

### `js/main.js` ([main.js](js/main.js))

This is the main entry point for the demo application's logic.

  * **State Management:** Implements a simple state machine (`let state = 'idle'; setState(newState)`) to manage the current interaction state (`idle`, `chat`, `video`). This state dictates UI element properties (e.g., button disabled states, visibility of the video container).
    ```javascript
    // js/main.js - State management example
    let state = 'idle';
    function setState(s) {
      state = s;
      btnStartC.disabled = (s !== 'idle');
      btnEndC.disabled   = (s !== 'chat');
      // ... more button states ...
      videoDiv.hidden    = (s !== 'video');
    }
    ```
  * **UI Interaction:** Attaches event listeners to HTML buttons ("Initialize SDK", "Start Chat", etc.). These listeners trigger actions via the `VideoEngagerClient` instance.
  * **SDK Event Handling:** Uses `client.on()` to subscribe to SDK events. Callbacks update the application state and log messages.
    ```javascript
    // js/main.js - SDK event handling example
    client.on('GenesysMessenger.conversationEnded', () => {
      log('Chat ended');
      setState('idle');
    });
    ```
  * **Initialization Flow:** The `main()` function orchestrates the initialization: on "Initialize SDK" click, it creates a `VideoEngagerClient` instance, calls `client.init()`, and upon success, sets up SDK event listeners and initial UI state.

### `js/config.js` ([config.js](js/config.js))

Provides the default `testConfig` object for the SDK. This is where a developer would typically change `tenantId`, `deploymentId`, etc., to match their specific VideoEngager and Genesys environment.

```javascript
// js/config.js - Structure
export const testConfig = {
  videoEngager: { /* tenantId, veEnv, isPopup */ },
  genesys:      { /* deploymentId, domain */ },
  useGenesysMessengerChat: true
};
```

-----

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.

-----

## Issues & Contributions

Found a bug or have a suggestion? Please [open an issue](https://github.com/VideoEngager/videoengager.github.io/issues) (replace with your actual demo repository issue URL if different).

Pull requests are welcome\! For major changes, please open an issue first to discuss what you would like to change. Please ensure to update tests as appropriate and follow existing code style.
