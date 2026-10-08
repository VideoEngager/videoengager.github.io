/**
 * @fileoverview UI layer — DOM, form, floating windows, event log.
 * No VideoEngager SDK imports here.
 */

// ── constants ─────────────────────────────────────────────────────────────────
export const SCREEN_W = window.screen?.width  || 1920;
export const SCREEN_H = window.screen?.height || 1080;
export const MIN_DIM  = 400;

// ── DOM refs ──────────────────────────────────────────────────────────────────
export const $form        = document.getElementById('config-form');
export const $confirmBtn  = document.getElementById('confirm-btn');
export const $statusDot   = document.getElementById('status-dot');
export const $statusText  = document.getElementById('status-text');
export const $log         = document.getElementById('event-log');
export const $videoWin    = document.getElementById('video-window');
const $vwTitlebar         = document.getElementById('vw-titlebar');
const $vwToggle           = document.getElementById('vw-toggle-btn');
const $shareUrl           = document.getElementById('share-url');
const $copyBtn            = document.getElementById('copy-btn');
const $accordion          = document.getElementById('advanced-accordion');
const $accToggle          = document.getElementById('accordion-toggle');
const $genesysPanel       = document.getElementById('genesys-panel');
const $gpToggleBtn        = document.getElementById('gp-toggle-btn');
const $genesysContainer   = document.getElementById('genesys-iframe-container');

// ── form fields ───────────────────────────────────────────────────────────────
const $veEnv           = document.getElementById('ve-env');
const $genesysEnv      = document.getElementById('genesys-env');
const $initiallyHidden = document.getElementById('initially-hidden');
const $iframeWidth     = document.getElementById('iframe-width');
const $iframeHeight    = document.getElementById('iframe-height');
const $lang            = document.getElementById('lang');
const $isPopup         = document.getElementById('is-popup');
const $authPopup       = document.getElementById('auth-popup');
const $genesysEmbedded = document.getElementById('genesys-embedded');

// ── state ─────────────────────────────────────────────────────────────────────
let isMinimized   = false;
let gpMinimized   = false;
let genesysOrigin = '';

// ── event log ─────────────────────────────────────────────────────────────────
export function log(msg, level = 'info') {
  const ts   = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className  = `l-${level}`;
  line.textContent = `[${ts}] ${msg}`;
  $log.appendChild(line);
  $log.scrollTop = $log.scrollHeight;
}

// ── status indicator ──────────────────────────────────────────────────────────
export function setStatus(dotClass, text) {
  $statusDot.className   = `dot ${dotClass}`;
  $statusText.textContent = text;
}

// ── read config from form ─────────────────────────────────────────────────────
export function readConfig() {
  const width  = Math.min(Math.max(parseInt($iframeWidth.value,  10) || 480, MIN_DIM), SCREEN_W);
  const height = Math.min(Math.max(parseInt($iframeHeight.value, 10) || 400, MIN_DIM), SCREEN_H);

  return {
    veEnv:            $veEnv.value.trim(),
    genesysEnv:       $genesysEnv.value,
    initiallyHidden:  $initiallyHidden.checked,
    width,
    height,
    lang:             $lang.value,
    isPopup:          $isPopup.checked,
    authPopup:        $authPopup.checked,
    genesysEmbedded:  $genesysEmbedded?.checked ?? false,
  };
}

// ── URL params ────────────────────────────────────────────────────────────────
export function configToParams(cfg) {
  const p = new URLSearchParams();
  if (cfg.veEnv)            p.set('veEnv',           cfg.veEnv);
  if (cfg.genesysEnv)       p.set('genesysEnv',       cfg.genesysEnv);
  if (cfg.initiallyHidden)  p.set('initiallyHidden',  '1');
  if (cfg.width  !== 480)   p.set('width',            String(cfg.width));
  if (cfg.height !== 360)   p.set('height',           String(cfg.height));
  if (cfg.lang)             p.set('lang',              cfg.lang);
  if (cfg.isPopup)          p.set('isPopup',          '1');
  if (!cfg.authPopup)       p.set('authPopup',        '0');
  if (cfg.genesysEmbedded)  p.set('genesysEmbedded',  '1');
  return p;
}

export function paramsToConfig(p) {
  return {
    veEnv:            p.get('veEnv')            ?? 'videome.leadsecure.com',
    genesysEnv:       p.get('genesysEnv')       ?? 'mypurecloud.com',
    initiallyHidden:  p.get('initiallyHidden')  === '1',
    width:            parseInt(p.get('width'),   10) || 480,
    height:           parseInt(p.get('height'),  10) || 360,
    lang:             p.get('lang')             ?? '',
    isPopup:          p.get('isPopup')          === '1',
    authPopup:        p.get('authPopup')        !== '0',
    genesysEmbedded:  p.get('genesysEmbedded')  === '1',
  };
}

export function applyConfigToForm(cfg) {
  const veOpt = [...$veEnv.options].find(o => o.value === cfg.veEnv);
  if (veOpt) $veEnv.value = cfg.veEnv;

  const genesysOpt = [...$genesysEnv.options].find(o => o.value === cfg.genesysEnv);
  if (genesysOpt) $genesysEnv.value = cfg.genesysEnv;
  $initiallyHidden.checked = cfg.initiallyHidden;
  $iframeWidth.value       = String(cfg.width);
  $iframeHeight.value      = String(cfg.height);
  const langOpt = [...$lang.options].find(o => o.value === cfg.lang);
  if (langOpt) $lang.value = cfg.lang;
  $isPopup.checked  = cfg.isPopup;
  $authPopup.checked = cfg.authPopup;
  if ($genesysEmbedded) $genesysEmbedded.checked = cfg.genesysEmbedded;

  // open accordion if any advanced value differs from default
  const hasAdvanced = cfg.initiallyHidden || cfg.width !== 480 || cfg.height !== 360
                   || cfg.lang || cfg.isPopup || !cfg.authPopup || cfg.genesysEmbedded;
  if (hasAdvanced) $accordion.classList.add('open');
}

function updateShareUrl() {
  const cfg    = readConfig();
  const params = configToParams(cfg);
  const base   = `${location.origin}${location.pathname}`;
  $shareUrl.value = params.toString() ? `${base}?${params}` : base;
}

// ── clamp dimension inputs ────────────────────────────────────────────────────
function clampDimInput($el, min, max) {
  let v = parseInt($el.value, 10);
  if (isNaN(v)) v = min;
  $el.value = String(Math.min(Math.max(v, min), max));
}

$iframeWidth.addEventListener('change',  () => { clampDimInput($iframeWidth,  MIN_DIM, SCREEN_W); updateShareUrl(); });
$iframeHeight.addEventListener('change', () => { clampDimInput($iframeHeight, MIN_DIM, SCREEN_H); updateShareUrl(); });
$iframeWidth.setAttribute('max',  String(SCREEN_W));
$iframeHeight.setAttribute('max', String(SCREEN_H));

// ── live URL update on any field change ───────────────────────────────────────
[$veEnv, $genesysEnv, $initiallyHidden, $lang, $isPopup, $authPopup, $genesysEmbedded]
  .filter(Boolean)
  .forEach($el => $el.addEventListener('change', updateShareUrl));

// ── accordion toggle ──────────────────────────────────────────────────────────
$accToggle.addEventListener('click', () => {
  $accordion.classList.toggle('open');
});

// ── copy link ─────────────────────────────────────────────────────────────────
$copyBtn.addEventListener('click', () => {
  const url = $shareUrl.value;
  if (!url) return;
  const doConfirm = () => {
    $copyBtn.textContent = 'Copied!';
    $copyBtn.classList.add('copied');
    setTimeout(() => {
      $copyBtn.textContent = 'Copy link';
      $copyBtn.classList.remove('copied');
    }, 1800);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(doConfirm).catch(() => {});
  } else {
    $shareUrl.select();
    doConfirm();
  }
});

// ── floating SmartVideo window ────────────────────────────────────────────────
function applyWindowSize(width, height) {
  $videoWin.style.width  = `${width}px`;
  $videoWin.style.height = `${height}px`;
}

export function showVideoWindow(cfg) {
  $videoWin.classList.remove('hidden', 'minimized');
  applyWindowSize(cfg?.width ?? 800, cfg?.height ?? 800);
  isMinimized = false;
  $vwToggle.textContent = '\u2013'; // –
}

export function hideVideoWindow(cfg) {
  if (cfg?.initiallyHidden ?? true) {
    $videoWin.classList.add('hidden');
  }
}

$vwToggle.addEventListener('click', () => {
  if (isMinimized) {
    $videoWin.classList.remove('minimized');
    isMinimized = false;
    $vwToggle.title = 'Minimise';
    $vwToggle.textContent = '\u2013'; // –
  } else {
    $videoWin.classList.add('minimized');
    isMinimized = true;
    $vwToggle.title = 'Restore';
    $vwToggle.textContent = '\u25A1'; // □
  }
});

// ── draggable SmartVideo window ───────────────────────────────────────────────
(function makeDraggable() {
  let startX, startY, startLeft, startTop, dragging = false;

  $vwTitlebar.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = $videoWin.getBoundingClientRect();
    startLeft = rect.left;
    startTop  = rect.top;
    $videoWin.style.right  = 'auto';
    $videoWin.style.bottom = 'auto';
    $videoWin.style.left   = `${startLeft}px`;
    $videoWin.style.top    = `${startTop}px`;
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newLeft = Math.max(0, Math.min(startLeft + dx, window.innerWidth  - $videoWin.offsetWidth));
    const newTop  = Math.max(0, Math.min(startTop  + dy, window.innerHeight - $videoWin.offsetHeight));
    $videoWin.style.left = `${newLeft}px`;
    $videoWin.style.top  = `${newTop}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.userSelect = '';
  });
})();

// ── Genesys Embedded Framework panel ─────────────────────────────────────────
export function mountGenesysPanel(genesysEnv) {
  genesysOrigin = `https://apps.${genesysEnv}`;
  $genesysContainer.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.id    = 'softphone';
  iframe.allow = 'camera *; microphone *; autoplay *; hid *';
  iframe.src   = `https://apps.${genesysEnv}/crm/embeddableFramework.html?enableFrameworkClientId=true&dedicatedLoginWindow=true&provider=gsuite`;
  $genesysContainer.appendChild(iframe);

  $genesysPanel.classList.remove('hidden');
  requestAnimationFrame(() => $genesysPanel.classList.add('open'));
  log('Genesys Embedded Framework panel mounted', 'info');
}

export function unmountGenesysPanel() {
  $genesysPanel.classList.remove('open');
  $genesysPanel.addEventListener('transitionend', () => {
    $genesysPanel.classList.add('hidden');
    $genesysContainer.innerHTML = '';
    genesysOrigin = '';
  }, { once: true });
}

$gpToggleBtn.addEventListener('click', () => {
  if (gpMinimized) {
    $genesysPanel.style.height = '';
    gpMinimized = false;
    $gpToggleBtn.title = 'Minimise';
    $gpToggleBtn.textContent = '\u2013'; // –
  } else {
    $genesysPanel.style.height = '44px';
    gpMinimized = true;
    $gpToggleBtn.title = 'Restore';
    $gpToggleBtn.textContent = '\u25A1'; // □
  }
});

// Forward postMessage events from the Genesys iframe into the event log
window.addEventListener('message', (event) => {
  if (!genesysOrigin || event.origin !== genesysOrigin) return;
  let msg;
  try {
    msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
  } catch (_) {
    return;
  }
  const type    = msg?.type ?? 'message';
  const preview = JSON.stringify(msg).slice(0, 120);
  log(`[Genesys] ${type}: ${preview}`, 'warn');
});

// ── patch SmartVideo iframe URL with extra params ─────────────────────────────
export function patchIframeUrl(url, cfg) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (cfg.lang)       parsed.searchParams.set('lang', cfg.lang);
  if (cfg.isPopup)    parsed.searchParams.set('isPopup', 'true');
  if (!cfg.authPopup) parsed.searchParams.delete('authPopup');
  return parsed.toString();
}

// ── bootstrap: read URL params → populate form ────────────────────────────────
export function bootstrap() {
  const params = new URLSearchParams(location.search);
  if (params.toString()) {
    applyConfigToForm(paramsToConfig(params));
  }
  updateShareUrl();
}
