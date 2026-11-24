# VideoEngager Core SDK — Quick Start for Genesys Cloud

A single page that starts a video call with a Genesys Cloud agent and logs
every SDK event as it happens. Run it to see the full session lifecycle; the
numbered `<script>` at the bottom of `index.html` (steps 1–6, about 60 lines)
is the integration to reuse.

| File | Role |
| --- | --- |
| `index.html` | The quick start page. The integration is the script at the bottom; nothing else in the file is required in your application. |
| `config.js` | Page settings: URL parameters, validation, public demo tenants → `window.DEMO_CONFIG`. Your application replaces this with a configuration literal (**Copy SDK config** in the configurator produces it). |
| `configurator.html` | A form that writes connection settings into the page URL. Nothing is stored; the URL is the configuration. |

## Running locally

A hosted copy is available at https://videoengager.github.io/examples/core-sdk-genesys-quickstart/ (see *Hosted version*). To run locally:

```bash
python3 -m http.server 8080        # any local web server, in this folder
# open http://localhost:8080/configurator.html
```

Not `file://` — Genesys Messenger needs a real origin. The page tells you if you try.

## Configuration

The page URL is the configuration. `index.html` accepts one of two forms:

- **Your environment** — all four settings, as produced by `configurator.html`:
  ```
  index.html?veEnv=videome.leadsecure.com&tenantId=YOUR_TENANT&domain=mypurecloud.de&deploymentId=YOUR_DEPLOYMENT_ID&mode=messenger
  ```
- **A public demo tenant** — `index.html?env=production` (also `uae`, `staging`,
  `dev`). This is what the examples index links to. `env` cannot be combined
  with explicit settings.

Without parameters the page reports *Not configured* and links to the configurator.

| Setting | Where to find it |
| --- | --- |
| VideoEngager host (`veEnv`) | Production US `videome.leadsecure.com` · Production EU `videome.videoengager.eu` · Production UAE `uae.leadsecure.com` · Staging `staging.leadsecure.com` · Development `dev.videoengager.com` · or a dedicated host |
| VideoEngager tenant ID (`tenantId`) | Genesys Cloud → SmartVideo Settings → SmartVideo |
| Genesys region host (`domain`) | the list is read from the loaded SDK; e.g. `mypurecloud.de`, `mypurecloud.ie`, `mypurecloud.com` |
| Messenger deployment ID (`deploymentId`) | Genesys Cloud → Admin → Message → Messenger Deployments. Its **allowed domains** must include this page's origin. |
| Integration (`mode`) | `messenger` — Genesys' Messenger script is loaded (UI hidden if selected); refresh-restore available (see *Refresh and tab close*). `pure-socket` — Web Messaging over a WebSocket, no Messenger script, no restore; deployment auto-start **on** (SDK 6.2.5). |

Only public values go in the URL: a tenant ID and a deployment ID. Never a PAK,
an OAuth client secret or a token.

Messenger configuration used by the deployment: Messenger and conversations
on, **Clear Conversation on**, an inbound message flow routing to a queue with
SmartVideo-enabled agents. *Automatically Start Conversations*: **off** for
`messenger` mode if you want refresh-restore (SDK 6.2.5 persists the video
interaction ID in the visitor's first message, which it does not send when the
conversation was auto-started); **on** for `pure-socket` mode.

## How to test your own environment

1. Open `configurator.html` (locally, or in the hosted copy).
2. Select your VideoEngager host and Genesys region, enter your tenant ID and
   Messenger deployment ID.
3. **Open quick start** — the page loads with these values in its URL.
   **Copy link** gives you that URL to share with your team; everyone who opens
   it gets the same configuration, with nothing stored anywhere.
4. **Copy SDK config** copies the configuration literal for your application:

   ```js
   const CONFIG = {
     videoEngager: { veEnv: "videome.leadsecure.com", tenantId: "…", enableVeIframeCommands: true, veHttps: true, debug: false },
     genesys: { domain: "mypurecloud.de", deploymentId: "…", enableVideoEngagerRestoringSession: true, debug: false },
     genesysIntegration: "messenger",
     hideMessengerUi: true
   };
   ```

   This is exactly the object `index.html` hands to the SDK, so what worked on
   the quick start page works in your code.

## Event sequence

The event log shows SDK events as they arrive and, in blue, the calls the page
makes (`→ startVideoEngagerInteraction` with its full payload, including the
`customAttributes` that leave the browser, and `→ endVideoEngagerInteraction`).

1. `integration:loaded` — Messenger is up; **Start video call** enables.
2. Click → `integration:sessionStarted` — a Genesys conversation exists; the
   iframe appears; the visitor waits. `startVideoEngagerInteraction()` has
   resolved by now: resolved means "in the queue", not "connected".
3. An agent accepts the interaction in Genesys Cloud → `videoEngager:CallStarted`
   — this is "connected".
4. Hang up (either side) → `videoEngager:call-state-changed: ended`; close the
   video → `videoEngager:active-ve-instance: false`. The SDK leaves the Genesys
   conversation open at this point (chat could continue); this page has no chat,
   so it ends the conversation itself — `→ endContactCenterInteraction` — and
   `integration:sessionEnded` follows. If the agent disconnected first, there is
   nothing left to end.
5. (`messenger` mode, auto-start off) Refresh the page during a call →
   `integration:sessionRestored`, then `→ startVideoEngagerInteraction` with the
   restored `interactionId` and the video re-attaches with no click.
   `pure-socket` mode has no restore: a refresh is a new visitor.

The text in the **Reference** field reaches the agent as a Genesys custom
attribute. This is how application context (order number, customer ID, any
string value) is passed into routing, the agent script and reporting.

## Integrating into your application

The six numbered steps in the script are the whole integration, in the order
they must run:

1. `new VideoEngagerCore(cfg)` + `new GenesysIntegration(cfg)` (or `GenesysIntegrationPureSocket`) — once per page.
2. `core.setUiCallbacks({...})` — your page owns the iframe. Before step 4.
3. `core.on(...)` — subscribe. Before step 4. Each call returns an unsubscribe function.
4. `await core.setContactCenterIntegration(genesys)` — loads Messenger.
5. `genesys.restoredSession` — re-attach after a refresh, or close a stale conversation.
6. `core.startVideoEngagerInteraction({ bindToOrStartContactCenterInteraction: true, callConfigs, customAttributes })` on user action.

Current state is available from `core.isCallOngoing`,
`core.contactCenterInActiveInteraction` and `core.activeInteractionId`. To end a
call from the page, call `core.endVideoEngagerInteraction(true)` (video and
Genesys conversation) or `core.endContactCenterInteraction()` (conversation);
a subsequent call is step 6 again.

**Refresh and tab close.** Nothing happens on unload. On a refresh (`messenger`
mode), Genesys Messenger resumes the conversation inside
`setContactCenterIntegration()`; the SDK finds the video interaction ID it
stored in the conversation when the call started
(`enableVideoEngagerRestoringSession`) and exposes it as
`genesys.restoredSession.veInteractionID`; step 5 re-attaches the iframe to
the running call and the agent sees the visitor reconnect. The page ignores
the video window closing while it is unloading — on a refresh the iframe
reports itself closed first, which is not the visitor ending the call.
Requires *Automatically Start Conversations* **off** on the deployment in
SDK 6.2.5 (see *Configuration*). `pure-socket` mode has no restore: each page
load is a new session.

On a real close, the conversation ends through Genesys' inactivity timeout or
the agent's wrap-up. If your requirements call for clearing abandoned
conversations on tab close, see the [kiosk example](../kiosk-core/app.js)
(`cleanupOnUnload`): it calls the SDK's synchronous
`core._expiremental_immedieteEndContactCenterInteraction()` from `pagehide`,
best effort, at the cost of restore on refresh — browsers cannot tell the two
apart.

## Hosted version

The same files are published at
https://videoengager.github.io/examples/core-sdk-genesys-quickstart/. Open
`configurator.html` there to run the quick start against your own tenant and
Messenger deployment without downloading anything. The deployment's allowed
domains must include `https://videoengager.github.io`; otherwise the page
reports that `setContactCenterIntegration` failed.

## Troubleshooting

- **"Could not initialise: …"** — Messenger configuration: the message names the
  check that failed (deployment not found, origin not allowed, conversations
  disabled, clear-conversation disabled).
- **Start is enabled but nothing visible happens after the click** — check the
  event log; if `integration:sessionStarted` fired, no agent is available in the queue.
- **`pure-socket`: "Failed to send join event"** — the deployment has
  *Automatically Start Conversations* off. Turn it on, or use `messenger` mode.
- **No camera prompt** — the iframe `allow` list in step 2 is missing or edited.
- Enable **Verbose SDK logs** in the configurator (or set both `debug: true`
  flags) for full SDK logging in the browser console.

## Resources

- Core SDK documentation: https://videoengager.github.io/videoengager.widget/#/core/README
- Event reference: https://videoengager.github.io/videoengager.widget/#/core/api-reference/events
