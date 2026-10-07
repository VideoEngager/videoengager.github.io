# VideoEngager Agent SDK — Genesys Demo

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

A minimal, single-page demo showing how to integrate the **VideoEngager Agent SDK** with Genesys Cloud. For full SDK documentation, see the [VideoEngager Agent SDK repository](https://github.com/VideoEngager/videoengager-agent-sdk). When an incoming SmartVideo call arrives, a floating video window opens automatically. The agent can end the call and the window dismisses itself.

---

## How It Works

1. The agent opens the page and enters their **Genesys Cloud environment** (e.g. `mypurecloud.com`).
2. Clicking **Connect** calls `VE.init()` with `authMethod: 'genesys'`, which authenticates the agent via Genesys OAuth.
3. `VE.call()` is called immediately after init — the SDK starts listening for incoming SmartVideo calls.
4. When a call arrives the SDK emits `callStateUpdated` with status `PRE_CALL` or `CALL_STARTED`. The floating SmartVideo window becomes visible and the iframe loads.
5. When the call ends (`FINISHED` / `sessionEnded` / `sessionFailed`) the window hides itself automatically.
6. The agent can also click **End call** to terminate the session via `VE.endCall()`.

### Event Flow

```
Agent opens page
      │
      ▼
VE.init({ authMethod: 'genesys', … })
      │  Genesys OAuth popup / redirect
      ▼
VE.call()  ◄──────────────────────────────────────────────┐
      │  SDK listens for incoming calls                    │
      ▼                                                    │
callStateUpdated → PRE_CALL / CALL_STARTED                │
      │  floating window shown, iframe loaded              │
      ▼                                                    │
callStateUpdated → FINISHED  ─── or ─── sessionEnded / sessionFailed
      │  floating window hidden                            │
      └────────────────────────────────────────────────────┘
```

---

## File Structure

```
examples/agent-sdk-genesys/
├── index.html      # Single-page UI — form, status badge, event log, floating video window
├── script.mjs      # All SDK logic — init, event handlers, iframe lifecycle
├── README.md       # This file
└── LICENSE.md      # MIT License
```

---

## Getting Started

### Prerequisites

- A modern browser with ES module support (Chrome 88+, Firefox 85+, Safari 14+, Edge 88+)
- A valid **Genesys Cloud** agent account
- A **VideoEngager** tenant configured for Genesys

### Running Locally

Serve the directory over HTTP (ES modules require a server, not `file://`):

```bash
# Node.js
npx http-server . -p 8080

# Python
python -m http.server 8080
```

Then open `http://localhost:8080/examples/agent-sdk-genesys/` in your browser.

### Usage

1. Select the **VideoEngager Environment** that matches your tenant.
2. Enter your **Genesys Cloud Environment** (e.g. `mypurecloud.com`).
3. Click **Connect** — a Genesys OAuth flow will authenticate you.
4. Once connected, wait for an incoming SmartVideo call.
5. The floating video window will appear automatically when a call arrives.

---

## Configuration

All configuration is entered at runtime via the on-screen form — no build step or config file required.

| Field | Description | Example |
|-------|-------------|---------|
| VideoEngager Environment | Your VE tenant host | `videome.leadsecure.com` |
| Genesys Cloud Environment | Your Genesys org domain | `mypurecloud.com` |

---

## SDK Integration Reference

### Initialisation

```javascript
await VE.init({
  authMethod: 'genesys',
  environment: genesysEnv,   // e.g. 'mypurecloud.com'
  domain: veDomain,          // e.g. 'videome.leadsecure.com'
  logger: true,
  options: {
    containerId: 'video-engager-container',
    uiHandlers,
  }
});
```

### Custom UI Handlers

The demo provides three hooks so the SDK can control the iframe lifecycle:

| Handler | Purpose |
|---------|---------|
| `openIframe(url)` | Create and mount the SmartVideo iframe |
| `closeIframe()` | Recycle the iframe (keeps SDK messaging alive) |
| `getIframe()` | Return the current iframe element |

### Key Events

| Event | When fired | Demo action |
|-------|-----------|-------------|
| `callStateUpdated` | Call state changes | Show/hide floating window |
| `sessionStarted` | Session established | Log visitor ID |
| `sessionEnded` | Session closed cleanly | Hide window, reset status |
| `sessionFailed` | Session error | Hide window, log error |
| `cleanup` | SDK destroyed | Reset status to disconnected |

---

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome / Chromium | 88+ |
| Firefox | 85+ |
| Safari | 14+ |
| Edge (Chromium) | 88+ |

---

## Troubleshooting

**Genesys OAuth popup is blocked**
- Allow popups for the page in your browser settings and retry.

**"Please enter a Genesys Cloud environment" error**
- The Genesys environment field must not be empty (e.g. `mypurecloud.com`).

**Floating window does not appear after a call arrives**
- Check the event log for `callStateUpdated` events.
- Confirm the SDK emits `PRE_CALL` or `CALL_STARTED` — other states do not trigger the window.

**Video/audio not working**
- Ensure the browser has camera and microphone permissions.
- The iframe `allow` attribute includes `camera; microphone` — verify no CSP header is blocking it.

---

## Support

**Note**: This is a demo application. VideoEngager provides the SDK and integration guidance, but production implementation, security, and maintenance are the responsibility of the implementing organization.

- **Issues**: [VideoEngager Helpdesk](https://help.videoengager.com/hc/en-us/requests/new)
- **Dev Documentation**: [VideoEngager Docs](https://videoengager.github.io/videoengager.widget/#/)
- **Enterprise support**: [support@videoengager.com](mailto:support@videoengager.com)

---

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.

---

**Disclaimer**: This demo provides implementation patterns and best practices. VideoEngager provides the SDK and integration guidance, but production deployment, security, compliance, and maintenance are the sole responsibility of the implementing organization.
