# VideoEngager Core SDK — Multilingual video call with Genesys Cloud

The [Core SDK Quick Start](../core-sdk-genesys-quickstart/) plus a language
picker: the visitor chooses a language before **Start video call**, and the
VideoEngager video UI opens in that language. Everything else — configuration,
event sequence, refresh restore, troubleshooting — is the same as in the quick
start; see its [README](../core-sdk-genesys-quickstart/README.md).

| File | Role |
| --- | --- |
| `index.html` | The example page. The integration is the numbered script at the bottom; the language is `callConfigs.lang` in steps 5 and 6. |
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

Core SDK **6.2.7** accepts visitor page options in the call configs. The
language is `lang`; the SDK writes it into the video page URL (`params.locale`)
and leaves the URL unchanged when it is not set:

```js
await core.startVideoEngagerInteraction({
  bindToOrStartContactCenterInteraction: true,
  callConfigs: { isPopup: false, lang: 'bg' },   // omit lang for the default
  customAttributes: { … }
});
```

The page passes the picker's value on every start and on the re-attach after a
refresh (step 5). The picker's value is kept in the page URL, so a refresh
re-attaches in the same language. Two-letter codes work: the video UI matches
`bg` to its `bg_BG` pack. For a fixed language on every call, set it once
instead: `new VideoEngagerCore({ …, defaultCallConfigs: { lang: 'bg' } })`.
See *Visitor Page Options* in the Core SDK README for the other options
(`precall`, `visitorName`, `fileTransfer`, …).

Language precedence in the video UI:

1. a language set on the **tenant** (it overrides everything below),
2. `lang` from the call configs (this page's picker),
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
