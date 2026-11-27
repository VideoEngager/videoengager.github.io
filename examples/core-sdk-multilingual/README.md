# VideoEngager Core SDK — Multilingual video call with Genesys Cloud

The [Core SDK Quick Start](../core-sdk-genesys-quickstart/) plus a language
picker: the visitor chooses a language before **Start video call**, and the
VideoEngager video UI opens in that language. Everything else — configuration,
event sequence, refresh restore, troubleshooting — is the same as in the quick
start; see its [README](../core-sdk-genesys-quickstart/README.md).

| File | Role |
| --- | --- |
| `index.html` | The example page. The integration is the numbered script at the bottom; the language part is step 2b and `callConfigs.locale` in steps 5 and 6. |
| `locales.js` | The languages offered in the picker → `window.VE_LOCALES`. **Generated** — do not edit. |
| `build-locales.js` | Regenerates `locales.js` from the master localization CSV. |
| `config.js` | Page settings from the URL, as in the quick start, plus the optional `locale`. |
| `configurator.html` | The quick start's configurator, plus a language field. |

## Running locally

```bash
python3 -m http.server 8080        # any local web server, in this folder
# open http://localhost:8080/index.html?env=staging   (or configurator.html)
```

Add `&locale=bg` to preselect a language. Without it the picker preselects the
browser language when it is in the list, otherwise **Default language**.

## How the language reaches the video UI

`VideoEngagerCore` has no locale option (6.2.x). It does let the application
replace the function that builds the URL of the video page
(`core.setPreparePopupHtmlUrlFn`). Step 2b registers the SDK's own default
builder (`defaultPreparePopupHtmlUrl`, identical in 6.2.2–6.2.5) with one
addition: `locale` in the page's `params`. The video page reads it as its UI
language.

The language is passed per call as `callConfigs.locale`:

```js
await core.startVideoEngagerInteraction({
  bindToOrStartContactCenterInteraction: true,
  callConfigs: { isPopup: false, locale: 'bg' },   // omit locale for the default
  customAttributes: { … }
});
```

The SDK copies every `callConfigs` key into the call configuration it passes to
the builder, so no other SDK change is needed. The picker's value is kept in
the page URL, so a refresh re-attaches to the call in the same language.

Language precedence in the video UI:

1. a language set on the **tenant** (it overrides everything below),
2. `locale` from this page,
3. the browser language,
4. English.

## Languages

`locales.js` lists the language columns of the master localization CSV
(`instac/i18n/localizations-all.csv`, header row `i18n=>,en,bg,…`), first two
letters only. Each label is the language's own name from the CSV row keyed by
its code, falling back to the English name, then to the code. After the CSV
changes:

```bash
node build-locales.js ~/work/instac/i18n/localizations-all.csv
```

## Known limitations (video UI, not this page)

- A language set on the tenant overrides the requested one.
- The recording-consent text picks its language from the tenant, then the
  browser, then the last language used — not from `locale`.
- The tenant's custom waiting message is a single string for all languages;
  clear it to use the translated default.
- `ja`: the video UI's language list (`widgets/i18n.js`) has no Japanese entry,
  and its pack is published as `jp_JP.json`, so `ja` falls back to the browser
  language or English.
