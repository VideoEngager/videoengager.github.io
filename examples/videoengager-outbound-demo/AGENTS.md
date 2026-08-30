# AGENTS.md — working agreement for AI coding tools in this repo

This file exists so an AI assistant (or a new engineer) can extend this
project correctly on the first try, without re-deriving conventions from
scratch. If you are an AI tool editing this repo, read this before writing
code here.

## What this repo is

A reference demo of the VideoEngager Interactions API: impersonate → get a
bearer token → create an OUTBOUND interaction → load the agent + visitor
join views in iframes. It is meant to be **copy-pasted from** — every piece
of API-calling code lives in one reusable module so a real integration can
lift it wholesale.

## File map — know where code belongs before writing any

| File | Responsibility | Touch it when... |
|---|---|---|
| `openapi/interactions.yaml` | Source of truth for the Interactions API | An endpoint's shape changes or a new one is added |
| `openapi/partners-impersonate.yaml` | Source of truth for the impersonate call | The impersonate contract changes |
| `public/js/videoengager-client.js` | **The only file allowed to call `fetch()` against VideoEngager.** One method per operationId. | Adding/changing an API call |
| `public/js/ui-helpers.js` | Generic, page-agnostic UI utilities (toast, JSON highlighting, clipboard, persistence) | Adding a UI utility more than one page will need |
| `public/js/outbound-demo.js` | Page controller: wires the DOM of `outbound-demo.html` to the client + helpers | Changing this page's behavior only |
| `public/outbound-demo.html` | Markup only — no inline `<script>`/`<style>`, no fetch calls | Changing layout/copy |
| `public/style.css` | Shared visual system, themed via `:root` custom properties | Visual/theme changes for *all* pages |
| `server/secure-proxy.js` | Reference backend showing how to keep the PAK server-side | Demonstrating/using the production auth pattern |

**Golden rule:** if you're about to write `fetch(` outside of
`videoengager-client.js`, stop — add a method to the client instead and
call that. This is what keeps the "reuse this in your own app" promise
true; a second inline fetch call is a bug, not a shortcut.

## Adding a new endpoint

1. Add/update the operation in `openapi/interactions.yaml` (or
   `openapi/partners-impersonate.yaml` if it's a partner-auth call).
2. Add a method to `VideoEngagerClient` in `videoengager-client.js`. Name it
   after what it does, not the HTTP verb+path. JSDoc it with the
   `operationId` it implements, and reuse the existing `_request()` helper
   — don't hand-roll a new `fetch()`.
3. Add `requireFields({...})` for any parameter the API requires, so a
   missing field fails fast with a clear message instead of a confusing
   4xx from the server.
4. If a demo page needs it, call it from that page's own controller
   (`public/js/<page>.js`) — never from `videoengager-client.js` itself,
   which must stay UI-free and reusable outside the browser DOM.

## Adding a new demo page (e.g. an INBOUND/visitor-initiated flow)

Copy the three-file pattern of the outbound demo:
`your-page.html` (markup) + `your-page.js` (controller, imports
`videoengager-client.js` and `ui-helpers.js`) + reuse `style.css` as-is.
You should not need to modify `videoengager-client.js` or `ui-helpers.js`
to add a page — if you find yourself needing to, that's a sign the thing
you need belongs in one of those shared files instead of the page.

## Security rules — non-negotiable

- **The PAK is a tenant-wide secret.** It may appear in a browser only in
  the local/dev demo path (`impersonateProxyUrl` unset). Any code path a
  real user's browser could reach must go through a backend proxy — see
  `server/secure-proxy.js`. Don't remove the warning banner in
  `outbound-demo.html` or the equivalent note in the README.
- **Never build HTML strings from API response data without escaping.**
  Use `escapeHtml()` / `highlightJson()` from `ui-helpers.js`. Use
  `textContent`, not `innerHTML`, wherever the content doesn't need to be
  markup (e.g. rendering the raw token).
- **Don't persist secrets to `localStorage` and call it done.** The demo
  does this for developer convenience (`bindPersistentField`) and says so
  in a comment. Don't extend that pattern into anything described as
  production-ready without flagging it the same way.
- **Don't log tokens or PAKs** to the console in new code, even for
  debugging — grep-ability of secrets in browser history/console history
  is exactly the failure mode this repo exists to demonstrate avoiding.

## Code style

- Vanilla JS, ES2022+, native ES modules (`<script type="module">`). No
  bundler, no framework, no build step — that's a deliberate property of
  this repo, not an oversight. Don't introduce one without being asked.
- No dependencies. `server/secure-proxy.js` uses only Node's `http`/`https`/
  `fs` — keep it that way; if a real project needs Express/etc., that's a
  decision for that project, not this demo.
- JSDoc on every exported function/method: what it does, what it maps to
  (operationId), and any security caveat that matters at the call site.
- 2-space indentation, single quotes in JS, semicolons on.
- Don't add a field or control to the UI unless it's wired to something —
  the original demo had a "Tenant ID" input that nothing used; it was
  removed rather than kept "for reference."

## Verification before calling something done

There's no test suite here (it's a demo, not a library) — verify by
running it:

```bash
node server/secure-proxy.js        # or: cd public && python3 -m http.server 8080
```

Then in a browser: open the page, open devtools console + network tab,
run the impersonate → generate flow, and confirm (a) no console errors,
(b) the network tab shows the calls you'd expect and nothing extra, (c)
error paths render (try an invalid PAK) without throwing unhandled
exceptions in the console.
