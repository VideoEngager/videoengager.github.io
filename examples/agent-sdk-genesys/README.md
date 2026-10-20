# Add VideoEngager video to a custom agent desktop that embeds Genesys Cloud

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
[![npm](https://img.shields.io/npm/v/videoengager-agent-sdk.svg)](https://www.npmjs.com/package/videoengager-agent-sdk)

**You have:** a custom agent desktop (a web app) that loads the Genesys Cloud softphone through the **Genesys Cloud Embeddable Framework**.
**You want:** VideoEngager (SmartVideo) video calls inside that same desktop.
**This guide:** shows what to add, where to add it and how to test it. You add about 40 lines of JavaScript and one `<div>`. Nothing changes in your Embeddable Framework setup.

---

## The short version

VideoEngager runs **next to** your Embeddable Framework softphone, in its own panel. It is not added to `framework.js` or to the softphone iframe.

```
┌──────────────────────── Your agent desktop (your origin, HTTPS) ────────────────────────┐
│                                                                                         │
│   ┌─ Genesys Embeddable Framework ─┐        ┌─ VideoEngager panel ───────────────────┐  │
│   │ <iframe src="https://apps.     │        │ <div id="video-engager-container">     │  │
│   │   mypurecloud.com/crm/…">      │        │   SmartVideo iframe, created and        │  │
│   │                                │        │   managed by videoengager-agent-sdk     │  │
│   │  voice / chat / callbacks      │        │   camera · mic · screen share           │  │
│   │  (unchanged)                   │        │                                         │  │
│   └────────────────────────────────┘        └─────────────────────────────────────────┘  │
│                                                                                         │
│   your code ── VE.init() / VE.call() / VE.on(...) ──► shows or hides the video panel     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

- The two panels **do not talk to each other**. VideoEngager integrates with Genesys Cloud at the **API level**, not through the UI. Once the agent is signed in, SmartVideo picks up the video interactions Genesys routes to that agent by itself. Your page passes nothing from Embeddable Framework to the SDK.
- Both panels sign in to Genesys Cloud as **the same agent, in the same Genesys region**.
- Genesys routing decides which agent gets a video interaction, exactly as for any other interaction.
- The SDK tells your page when a video call starts and ends, so your desktop decides where and how to show the panel.

---

## Before you start

| You need | Where it comes from |
|---|---|
| Your **VideoEngager domain**: e.g. `videome.leadsecure.com` or `uae.leadsecure.com` <!-- CONFIRM (VE): full list per region, incl. EU --> | Your VideoEngager onboarding contact |
| VideoEngager enabled for your Genesys Cloud org, and agents able to use SmartVideo | <!-- CONFIRM (VE): AppFoundry integration installed? which roles/permissions per agent? --> |
| Your **Genesys region domain**. It is the host of your Embeddable Framework iframe without `apps.` (for example, `apps.mypurecloud.de` → `mypurecloud.de`) | Your existing Embeddable Framework setup |
| Your desktop served over **HTTPS**, because browsers only allow camera and microphone on secure origins (`localhost` is the exception) | Your hosting |
| A decision on **how the agent signs in**: allow pop-ups, or show the sign-in page. See [Agent sign-in](#agent-sign-in-choose-one) | You |
| <!-- CONFIRM (VE): does the customer's desktop origin need to be allowlisted on the VE tenant? --> | |

---

## Integrate in 4 steps

### Step 1: Add a container for the video panel

Put an empty element anywhere in your desktop layout. Your Embeddable Framework iframe stays exactly as it is.

```html
<!-- Existing: Genesys Cloud Embeddable Framework (unchanged) -->
<iframe id="softphone" src="https://apps.mypurecloud.com/crm/embeddableFramework.html" …></iframe>

<!-- New: VideoEngager video panel -->
<section id="video-panel" hidden>
  <div id="video-engager-container" style="width:100%; height:100%"></div>
</section>
```

Give the panel a real size when it is shown. A width of at least 480 × 360 px works well for agent video.

### Step 2: Add the SDK

With a bundler:

```bash
npm install videoengager-agent-sdk
```

```js
import * as VE from 'videoengager-agent-sdk';
```

Without a bundler, import the ES module from the CDN and pin the version:

```js
import * as VE from 'https://cdn.jsdelivr.net/npm/videoengager-agent-sdk@6.0.2/dist/index.mjs';
```

### Step 3: Drop in the integration module

Copy this file into your desktop as `videoengager.js`. It is the same logic as this demo's `script.mjs`, without the demo UI.

```js
// videoengager.js — VideoEngager video panel for a Genesys Embeddable Framework desktop
import * as VE from 'videoengager-agent-sdk';

const IFRAME_ALLOW = 'camera; microphone; clipboard-write; display-capture';

function mountIframe(container, url) {
  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.allow = IFRAME_ALLOW;                 // required: without it there is no camera or mic
  iframe.style.cssText = 'width:100%;height:100%;border:0';
  container.replaceChildren(iframe);
}

/**
 * Start VideoEngager for the logged-in agent. Call once, after your desktop loads.
 * @param {object}   cfg
 * @param {string}   cfg.veDomain    e.g. 'videome.leadsecure.com'
 * @param {string}   cfg.genesysEnv  same region as your Embeddable Framework, e.g. 'mypurecloud.com'
 * @param {Element}  cfg.container   the #video-engager-container element
 * @param {Function} cfg.onCallStart called when a video call starts, so show your panel here
 * @param {Function} cfg.onCallEnd   called when the call ends or fails, so hide your panel here
 */
export async function startVideoEngager({ veDomain, genesysEnv, container, onCallStart, onCallEnd }) {
  await VE.init({
    authMethod: 'genesys',
    environment: genesysEnv,
    domain: veDomain,
    logger: false,                             // set true while integrating
    options: {
      uiHandlers: {
        openIframe:  (url) => mountIframe(container, url),
        // On call end, reload the widget instead of removing it, so the agent
        // stays signed in and ready for the next call.
        closeIframe: () => {
          const iframe = container.querySelector('iframe');
          if (iframe) mountIframe(container, iframe.src);
        },
        getIframe:   () => container.querySelector('iframe'),
      },
    },
  });

  VE.on('callStateUpdated', (s) => {
    if (s.status === 'PRE_CALL' || s.status === 'CALL_STARTED') onCallStart?.(s);
  });
  VE.on('sessionEnded',  (s) => onCallEnd?.(s));
  VE.on('sessionFailed', (p) => onCallEnd?.(p));

  await VE.call();                             // loads SmartVideo; the agent signs in once
}

/** Hang up the current video call (e.g. from your own "End video" button). */
export const endVideoCall = () => VE.endCall();

/** Tear down on agent logout. Call startVideoEngager() again on next login. */
export const stopVideoEngager = () => VE.destroy();
```

### Step 4: Wire it into your desktop

```js
import { startVideoEngager, endVideoCall, stopVideoEngager } from './videoengager.js';

const panel = document.getElementById('video-panel');

await startVideoEngager({
  veDomain:   'videome.leadsecure.com',
  genesysEnv: 'mypurecloud.com',               // match your Embeddable Framework region
  container:  document.getElementById('video-engager-container'),
  onCallStart: (call) => { panel.hidden = false; /* e.g. focus the panel, open a tab */ },
  onCallEnd:   ()     => { panel.hidden = true; },
});

document.getElementById('end-video-btn')?.addEventListener('click', endVideoCall);
yourDesktop.on('logout', stopVideoEngager);    // whatever your desktop uses for logout
```

That completes the integration. Before going live, choose how agents sign in, as described next.

---

## Agent sign-in (choose one)

When `VE.call()` loads SmartVideo, the agent has to sign in to Genesys Cloud once. That sign-in goes through your Genesys identity provider (Genesys login, Okta, Azure AD/Entra, ADFS and so on). **Identity providers do not allow their login pages to load inside an iframe**, so SmartVideo opens the sign-in in a **pop-up window**. Your desktop has to make room for that pop-up in one of two ways.

### Option A: Allow pop-ups (the panel can stay hidden)

Allow pop-ups for your desktop's origin, either per browser or centrally through your browser management policy (for example Chrome/Edge `PopupsAllowedForUrls`). SmartVideo can then open the sign-in pop-up from the hidden panel without the agent doing anything. The code in Step 4 works unchanged.

This option suits managed corporate desktops, where IT can push the policy.

### Option B: Show the sign-in page (do not load the panel hidden)

If you can't control pop-up settings, keep the video panel **visible** while SmartVideo loads, so the agent sees its sign-in page. When the agent clicks sign-in, the browser treats the pop-up as user-initiated and allows it even with the pop-up blocker on.

```js
panel.hidden = false;                          // show SmartVideo's sign-in page first

await startVideoEngager({
  veDomain:   'videome.leadsecure.com',
  genesysEnv: 'mypurecloud.com',
  container:  document.getElementById('video-engager-container'),
  onCallStart: () => { panel.hidden = false; },
  onCallEnd:   () => { panel.hidden = true;  },
});
```

The SDK has no "agent signed in" event, so let the agent collapse or minimise the panel once signed in. One way is a collapse button in your panel header, like the minimise button in this demo. The `onCallStart` callback brings the panel back when a call arrives.

> Whichever option you choose, never `display:none` the panel before the agent has signed in **and** block pop-ups at the same time. If you do, the sign-in can't appear and the agent never receives video calls.

---

## What the agent experiences

1. The agent logs in to your desktop. Embeddable Framework signs them in to Genesys Cloud as it does today.
2. `startVideoEngager()` loads SmartVideo, and the agent signs in to Genesys once through a pop-up. With option A this happens on its own. With option B the agent clicks sign-in in the visible panel. See [Agent sign-in](#agent-sign-in-choose-one).
3. A customer starts a video call, and Genesys routes it to the agent.
   <!-- CONFIRM (VE): does the agent accept it in the Embeddable Framework softphone first, or does SmartVideo pick it up directly? -->
4. `onCallStart` fires, your desktop shows the video panel, and the agent and customer are on video.
5. Either side hangs up, or your desktop calls `endVideoCall()`. `onCallEnd` fires and the panel hides. The agent stays signed in for the next call.

---

## Test it

1. Open your desktop and log in as an agent who is enabled for video.
2. Complete the sign-in. The pop-up opens on its own (option A) or from the visible panel (option B). With `logger: true`, the browser console shows the SDK loading SmartVideo.
3. Put the agent **on queue** in Genesys.
4. Start a video call as a customer. <!-- CONFIRM (VE): link to the customer-side test page / visitor widget for the tenant -->
5. Check that the video panel opens, that camera and microphone work, and that the panel hides after hang-up.
6. Start a second call without reloading. It should open without another sign-in.

---

## Optional: link the video call to the Genesys interaction

If your desktop already handles interaction events from Embeddable Framework (`window.PureCloud.subscribe` in your `framework.js`, forwarded to your page with `postMessage`), you can show video next to the matching interaction. The SDK passes call details to `onCallStart(call)`:

| Field | Meaning |
|---|---|
| `call.visitorId` | VideoEngager visitor/session ID |
| `call.callerEmail` | Customer e-mail, if collected |
| `call.attributes` | Extra attributes sent by the VideoEngager widget |
| `call.shortUrl`, `call.pin` | Session link and PIN |

<!-- CONFIRM (VE): which field carries the Genesys conversationId (or which interaction attribute carries visitorId), so integrators can join the two? -->

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Agent never receives video calls, and no sign-in appeared | The panel was hidden while pop-ups were blocked, so the sign-in could not open. Allow pop-ups (option A) or show the panel until the agent signs in (option B). |
| Sign-in page shows inside the panel but the identity provider's page is blank or refuses to load | That is the identity provider blocking iframes. Sign-in has to run in the pop-up, so don't block it. |
| Panel never opens on a video call | The VideoEngager domain must match your tenant exactly, because the SDK ignores messages from any other origin. Check that `genesysEnv` is the same region as your Embeddable Framework iframe. Make sure the agent is on queue. Set `logger: true` and look in the console. |
| Video opens, but no camera or microphone | The iframe needs `allow="camera; microphone"` (set in `videoengager.js`). The page must be HTTPS. Your desktop must not send a `Permissions-Policy` header that blocks camera or microphone. Check the browser's site permissions. |
| Screen share button does nothing | `display-capture` must be in the iframe `allow` list, and the parent page must not block it. |
| `agent\|already-initialized` error | `startVideoEngager()` was called twice. Call `stopVideoEngager()` first, for example on re-login. |
| `auth\|genesys-environment-required` | `genesysEnv` is empty. |
| `config\|domain-required` / `config\|domain-invalid-format` | `veDomain` is empty or malformed. Use the host only, without `https://`. |

---

## Run this demo

This folder is a working reference of the same integration, using a floating window instead of a desktop panel:

| File | Contents |
|---|---|
| `index.html` | Config form, status badge, event log and the floating SmartVideo window (`#video-engager-container`) |
| `script.mjs` | Entry point — reads the form, calls `connect()`, handles connect/error UI |
| `ve.mjs` | VideoEngager SDK layer — `VE.init()`, `VE.call()`, SDK event listeners and `uiHandlers` |
| `ui.mjs` | UI layer — DOM refs, status indicator, event log, draggable floating window, Genesys panel, URL sharing |

```bash
cd examples/agent-sdk-genesys
npx http-server . -p 8080        # or: python3 -m http.server 8080
```

Open <http://localhost:8080/>, choose the VideoEngager environment, enter your Genesys region (for example `mypurecloud.com`) and click **Connect**.

> **SDK version:** the demo imports `videoengager-agent-sdk@6.0.2` from the CDN. If you upgrade, update the version pin in `ve.mjs` line 7 and verify the API surface matches the examples in this README.

---

## SDK reference (used here)

| Call | Purpose |
|---|---|
| `VE.init({ authMethod: 'genesys', environment, domain, logger, options: { uiHandlers } })` | Configure the SDK. Call once. |
| `VE.call()` | Load SmartVideo for the agent. |
| `VE.on(event, fn)` / `VE.off(event, fn)` | `callStateUpdated`, `sessionStarted`, `sessionEnded`, `sessionFailed`, `cleanup`, `iframeStateChanged` |
| `VE.endCall()` | Hang up and run `closeIframe`. |
| `VE.destroy()` | Remove listeners and reset. `init()` is needed again afterwards. |

Full API, other auth methods (`generic`, `token`, `custom`) and Standalone Mode: [videoengager-agent-sdk on npm](https://www.npmjs.com/package/videoengager-agent-sdk).

## Support

- Issues: [VideoEngager Helpdesk](https://help.videoengager.com/hc/en-us/requests/new)
- Enterprise support: [support@videoengager.com](mailto:support@videoengager.com)

This is a reference implementation. Production deployment, security and maintenance are the responsibility of the implementing organisation. Licensed under MIT, see [LICENSE.md](LICENSE.md).
