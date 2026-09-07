# abcfcu-site — ABC Federal Credit Union demo page

`index.html` — the fictional ABC Federal Credit Union member site used in the VideoEngager × Salesforce
Agentforce demo. Single file, no build step. It embeds the Agentforce messaging widget and the video
escalation plumbing from `../demo-customer/demo.html` (same org, same deployment, same
`onEmbeddedMessageSent` capture), and adds the signed-in member shell, the wire transfer form, the
reproducible failure and the success path (tracker WEB-01 … WEB-04, WEB-06, INT-01, INT-03, INT-05).

## Run it

    cd abcfcu-site && python3 -m http.server 8000

Open **http://localhost:8000/** — `localhost`, not `127.0.0.1`. That origin is already allowlisted in the
org (CORS and `siteIframeWhiteListUrls`); any other origin needs both — see `../demo-customer/README.md`.
HTTPS hosting for the recording is still open (WEB-05).

## The demo flow on this page

| Phase | What the page does |
|---|---|
| Load | Ben R. is signed in. The wire form is pre-filled from a "saved recipient" with the **routing and account numbers in each other's fields**. Nothing on screen hints at this. |
| Phase 1 | Ben clicks **Review transfer**. The form stops with: *"There is an issue with the routing number and/or the account number. Please verify both numbers with the recipient and try again."* Both fields are outlined red, but nothing says which is wrong. It fails every time until the two numbers are swapped back. |
| Phase 2–3 | Ben uses the chat button (bottom right). When the bot posts the VideoEngager link, the page opens it in a **separate floating browser window** (1100×760, top-right of the screen). Because it is its own window it does **not** appear when Ben shares this page in Phase 7. If the browser blocks the automatic pop-up, a *Join video session* banner appears at the top of the page and one click opens it. A *Return to video session* button reappears if the window is closed. |
| Phase 7 | Ben shares this screen. Jenna sees the two fields. He swaps them, **Review transfer** now goes through to the review step, he ticks the confirmation box and **Submit wire** → confirmation number `WT-YYYYMMDD-NNNNN`. |

The only validation that matters runs when **Review transfer** is clicked: the routing number must pass the
ABA checksum (and the account number must be 6–17 digits). Swapped, the routing field holds a 10-digit
account number, so it fails. Corrected, it passes. There is no inline format hint on either field —
deliberately (script, production notes: *the transposed fields must stay transposed until Jenna sees them*).
The same check is repeated on **Submit wire** as a safety net (generic error, Ref WT-4021).

## Video window: pop-up vs in-page panel

The default is the pop-up window. Browsers only allow `window.open()` without a click if pop-ups are allowed
for the site, so **before the run**: Chrome → Site settings for `localhost:8000` → *Pop-ups and redirects* →
**Allow**. Without that the Join banner appears and Ben clicks it (still one click, still no new link to
chase). `?panel` switches to an in-page panel docked left of the chat widget (starts 960×660, draggable by its
title bar, resizable from the bottom-right corner) — that panel *will* be visible in a screen share.

Screen-share tip for Phase 7: share the **browser tab or window** of the ABC FCU page, not the entire screen,
so the video window stays out of the share either way.

## Persona and account data (WEB-06)

All values live in one `DEMO_DATA` block at the top of the script — change them there so the page keeps
matching whatever the Agentforce agent asserts in Phase 1.

| Item | Value |
|---|---|
| Member | Ben Rogers — shown only as "Ben", "Ben R." or initials "BR"; member since 2014, member no. 1004471 |
| Account | Everyday Checking •••• 2290, available $18,642.17 |
| Limits / status | Daily external wire limit $25,000.00, used today $0.00, no holds, external wires enabled |
| Recipient | Northgate Construction LLC — Cascade Community Bank, business checking, 2210 Industrial Way, Tacoma, WA 98421 |
| Routing number | 121047324 (fictional; valid ABA checksum) |
| Account number | 4471882033 (fictional) |
| Transfer | $12,450.00 + $25.00 fee — "Invoice NC-2291 — kitchen remodel deposit" |
| Error reference | WT-4021 |

## Rehearsal switches (never use on camera)

| Switch | Effect |
|---|---|
| `?correct` | Pre-fill with the numbers in the right fields — success path in one click |
| `?reset` | Start with an empty recipient form |
| `?nochat` | Do not load the Salesforce widget (layout checks offline) |
| `?panel` | Show the video call in an in-page panel instead of a separate window |
| **Shift+D** | Toggle a one-line operator strip: widget status · captured video link · form state |

Video-link capture and form outcomes are also logged to the browser console with an `[ABCFCU]` prefix.
