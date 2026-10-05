# VideoEngager kiosk demo

A vanilla JavaScript example of a video assistance kiosk built with
`VideoEngagerCore` and `GenesysIntegration`. It includes optional visitor sign-in,
a waiting carousel, configurable Messenger chat, and post-call surveys.
No build step or frontend framework is required.

Visitors press **Start**, sign in if required, and wait for an agent. When the call
connects, the video expands to fill the browser window. After the interaction, the
kiosk displays the configured survey or returns to welcome the next visitor.

## Get started

Open the [hosted configurator](https://videoengager.github.io/examples/kiosk-core/configurator.html)
from the [VideoEngager Demos and Examples repository](https://github.com/VideoEngager/videoengager.github.io).

1. Choose an environment preset.
2. Enter the VideoEngager tenant and Genesys deployment assigned to your organization.
3. Choose the waiting screen, chat, authentication and survey settings.
4. Select **Launch kiosk**, or **Copy kiosk link** to save the configuration.

The generated URL contains public configuration. Do not place client secrets,
passwords or access tokens in it. Presets are examples; use your own deployment
and identity provider settings when adapting the demo.

To run your local copy, execute this from the repository root:

```sh
python -m http.server 8765 --bind localhost
```

Then open the [local configurator](http://localhost:8765/examples/kiosk-core/configurator.html).
Use `localhost` for local authentication. Host deployed copies over HTTPS; opening
`index.html` directly through `file://` is not supported.

## Requirements

- A VideoEngager tenant and a Genesys Messenger deployment configured for your
  video assistance flow, with an available agent to answer calls.
- In the Genesys deployment, enable **Messenger**, **Conversations**,
  **Markdown/Rich Text**, **conversation clear**, and **conversation disconnect**
  in **ReadOnly** mode.
- A browser with JavaScript enabled, camera and microphone permissions, and
  access to the VideoEngager CDN. Authentication also uses browser session storage.
- For authenticated Messenger, configure the deployment's OIDC integration and
  disable `allowSessionUpgrade`. The kiosk's authentication setting must match
  the deployment.
- For minimized chat, enable the Messenger launcher so visitors can reopen it.
- For surveys, configure a post-call survey in your VideoEngager tenant.

The pages load the SDK from the VideoEngager CDN. `GenesysIntegration` loads
Messenger, so do not add a second Genesys bootstrap script. Genesys regions in the
configurator come from the SDK's `window.VideoEngager.gensysPureDomainsMapping`.

## Configuration

Use the configurator to build a URL, or supply these query parameters directly.
Defaults and environment presets are defined in [config.js](config.js).

| Parameter | Behavior / default |
| --- | --- |
| `env` | Environment preset: `dev`, `staging`, `production` (default), or `uae` |
| `veDomain`, `veTenantId` | VideoEngager hostname and tenant ID; use the selected preset or override it |
| `genesysDomain`, `genesysDeploymentId` | Genesys region hostname and deployment ID; use the selected preset or override it |
| `kioskId` | Identifies the kiosk through the `context.kioskId` interaction attribute; default `demo-kiosk-01` |
| `auth` | Enable authenticated Messenger; default `false` |
| `authMode` | `perInteraction` (default) or `shared`; used when `auth=true` |
| `authorizationEndpoint` | Your identity provider's HTTPS authorization endpoint |
| `clientId` | Public OIDC client ID |
| `scopes` | Space-separated OIDC scopes; default `openid profile email`; must include `openid` |
| `waitingScreen` | Show waiting tips while requesting an agent; default `true` |
| `waitingScreenMode` | `overlay` (default) or `beside` |
| `chatMode` | `hidden` (default), `onActivity`, `always`, or `afterStart` |
| `chatMinimized` | Initially minimize chat when it becomes visible; default `false` |
| `postCallSurvey` | Keep the video frame for the tenant's post-call survey; default `false` |
| `cleanupOnUnload` | Request session cleanup when the page closes or navigates away; default `true` |
| `maxWaitMs` | Maximum wait for an agent after sign-in, including camera setup; default `180000` (3 minutes) |
| `endTimeoutMs` | Maximum wait for session cleanup before requiring a reload; default `10000` (10 seconds) |
| `surveyTimeoutMs` | Maximum time to display the survey; default `60000` (1 minute) |

Boolean values must be `true` or `false`. Domains are hostnames without `https://`
or a path. Timeouts use whole milliseconds. Invalid settings display a configuration
error before SDK initialization. Enabling authentication requires an authenticated
deployment; the production preset includes an example, while other presets require
you to provide one.

## Authentication

Opening an authenticated kiosk shows the welcome screen without starting sign-in.
Pressing **Start** begins authentication. After a successful sign-in initiated by
that button, the kiosk automatically continues the call request.

| Mode | Visitor experience |
| --- | --- |
| `perInteraction` — Each visitor signs in | Requests a fresh identity provider login for each visit. After the interaction, the kiosk logs out of Messenger and reloads before the next visitor. If a survey is displayed, the reload follows Finish / skip or the survey timeout. |
| `shared` — Shared kiosk account | Signs in as needed on the first Start, then reuses the same account for subsequent calls. It does not log out between interactions. |

Register the exact kiosk callback URL with your identity provider, without query
parameters. The configurator displays the URL for the host you are using. For example:

```text
https://videoengager.github.io/examples/kiosk-core/index.html
http://localhost:8765/examples/kiosk-core/index.html
```

Register your own HTTPS callback when hosting elsewhere. `localhost` and
`127.0.0.1` are different callback addresses.

[auth.js](auth.js) implements Authorization Code with PKCE S256, state and nonce.
It preserves the kiosk settings across sign-in; Genesys exchanges the authorization
code. Keep client secrets out of browser code. If sign-in cannot be resumed,
follow the displayed **Reload kiosk** or **Configure kiosk** action.

Per-interaction mode logs out of **Messenger** and requests fresh authentication
using `prompt=login`. It does not end the identity provider's global SSO session.
If your kiosk policy requires full SSO logout, integrate your provider's logout
flow and confirm its sign-in behavior with your identity administrator.

## Waiting screen and video

- **Overlay:** the carousel covers the video widget container while waiting,
  leaving the page header and Cancel request button visible. It hides during
  camera/microphone setup and returns if an agent has not yet connected.
- **Beside:** tips appear alongside the video on larger screens and above it on
  smaller screens. The video remains accessible during camera setup.
- **Disabled:** the kiosk displays a compact status message without the carousel.

Tips rotate every eight seconds. Visitors can navigate or pause them; reduced-motion
preferences disable automatic rotation and animation. Edit the cards in
[index.html](index.html) to change the content.

The overlay's precall handling in [ui.js](ui.js) listens for
`VideoEngager.event:PreCallStarted` and `VideoEngager.event:PreCallFinished` through
`event.data.__postRobot__.name`, accepting only messages from the current video
iframe and its origin. **This precall event mechanism is experimental and may change.**

Once connected, the existing video frame expands to fill the browser viewport.
This animation preserves the call and does not invoke browser fullscreen mode.
The End call button remains available; the survey returns to the normal layout.

## Chat appearance

| `chatMode` | When chat appears |
| --- | --- |
| `hidden` | Messenger and its launcher stay hidden. |
| `onActivity` | After an agent/bot message or a connected video call. Visitor messages and presence events are ignored. |
| `always` | After integration initialization. With authentication enabled, initialization still waits for Start. |
| `afterStart` | After `startVideoEngagerInteraction()` resolves successfully; the agent may still be joining. |

`chatMinimized=true` applies `Messenger.close` when chat is first shown;
`false` applies `Messenger.open`. Later manual expansion or minimization is
respected. Hidden mode takes precedence over this setting.

[app.js](app.js) decides when chat appears. It uses `integration:raw-message`,
which can include restored messages, and `videoEngager:call-state-changed`.
[chat-ui.js](chat-ui.js) only provides `show()`, `hide()`, `open()` and `minimize()`.
Showing and hiding use CSS; they do not end the Genesys conversation.

Wait for `setContactCenterIntegration()` to resolve before issuing interaction or
Messenger commands. The demo hides chat during initialization, startup, ending
and logout, and waits for pending appearance commands before starting those operations.
Keep this ordering when adding chat controls.

## Ending a visit and surveys

The **Cancel request / End call** button stays disabled during sign-in and startup.
It becomes available only after `startVideoEngagerInteraction()` resolves, even
if a connected event arrives earlier. Visitors can then cancel the agent wait or
end their call. An agent ending the interaction also starts the kiosk's end flow. The app calls
`endVideoEngagerInteraction(true)` and, in per-interaction authentication mode,
logs out of Messenger before preparing for the next visitor.

With `postCallSurvey=true`, a connected call can retain the video frame to display
the survey configured for that tenant. This option does not create a survey.
**Finish / skip survey** or the survey timeout returns to the welcome screen;
leaving the survey does not imply it was submitted. Cancelled or failed call
requests do not show a survey.

If startup, authentication or cleanup fails, follow the displayed **Reload kiosk**
or **Configure kiosk** action. A cleanup timeout requires a reload before another
call. Page-exit cleanup is best effort: browsers do not wait for requests to finish.

## Implementation guide

Start with [app.js](app.js): `initialize`, `startSession`, `listenToCore` and
`finishSession` describe the session flow. UI callbacks are registered before
integration initialization so Core can create and manage the video iframe.

The main initialization and start calls are:

```js
await veWidgetCore.setContactCenterIntegration(genesysIntegration);

await veWidgetCore.startVideoEngagerInteraction({
  bindToOrStartContactCenterInteraction: true,
  callConfigs: { isPopup: false },
  customAttributes: { 'context.kioskId': config.kioskId }
});
```

At the end of the interaction, use `await veWidgetCore.endVideoEngagerInteraction(true)`.
Keep authentication, chat ordering and survey handling in the surrounding app flow.
For a survey-enabled visitor hangup, the app first calls
`executeVideoCallFn('triggerHangup')`; UI callbacks retain the same iframe for the
survey. The Core instance enables these commands with `enableVeIframeCommands: true`.

| Event | How the demo uses it |
| --- | --- |
| `videoEngager:call-state-changed` | `active` marks the connected call and expands video; `ended` or `idle` enters the end flow. |
| `videoEngager:active-ve-instance` | `false` detects video app closure. An active instance alone does not mean an agent connected. |
| `integration:raw-message` | Reveals chat in `onActivity` mode for outbound non-event messages during the visit. |
| `integration:sessionStarted` / `integration:sessionEnded` | Tracks the Genesys conversation and handles its ending. |
| `videoEngager:CallEnded` | Handles video hangup. |
| `videoEngager:PopupClosed` | Records hangup while allowing the same iframe to remain available for a survey. |
| `error:catchAll` | Handles authentication loss; individual method calls handle operation failures. |

| File | What to customize |
| --- | --- |
| [config.js](config.js) | Environment presets, defaults and URL validation |
| [configurator.html](configurator.html), [configurator.js](configurator.js) | Configuration form and generated links |
| [app.js](app.js) | Core/Genesys integration, session flow and chat rules |
| [auth.js](auth.js) | OIDC sign-in and callback handling |
| [ui.js](ui.js) | Screens, buttons, iframe management and precall handling |
| [waiting-screen.js](waiting-screen.js) | Carousel navigation and rotation |
| [chat-ui.js](chat-ui.js) | Chat visibility and open/minimize actions |
| [index.html](index.html), [styles.css](styles.css), [configurator.css](configurator.css) | Content, branding and layout |

## Validation

Run the local regression checks from the repository root with Node.js:

```sh
node examples/kiosk-core/check.cjs
```

These checks use simulated SDK responses. With your assigned tenant and an agent,
also test visitor and agent hangup, cancellation while waiting, consecutive calls,
both authentication modes, chat visibility, camera setup and the optional survey.
For per-interaction authentication, use two different visitor accounts to confirm
the intended sign-in and logout experience.
