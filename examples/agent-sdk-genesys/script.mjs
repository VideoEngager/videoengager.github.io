/**
 * @fileoverview VideoEngager Agent SDK — Genesys Demo
 *
 * Reads configuration from URL params (populated by the form).
 * The floating SmartVideo window is shown on PRE_CALL / CALL_STARTED
 * and hidden on sessionEnded / sessionFailed.
 */

import * as VE from 'https://cdn.jsdelivr.net/npm/videoengager-agent-sdk@6.0.2/dist/index.mjs';

// ── constants ─────────────────────────────────────────────────────────────────
const SCREEN_W = window.screen?.width  || 1920;
const SCREEN_H = window.screen?.height || 1080;
const MIN_DIM  = 400;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $form        = document.getElementById('config-form');
const $confirmBtn  = document.getElementById('confirm-btn');
const $statusDot   = document.getElementById('status-dot');
const $statusText  = document.getElementById('status-text');
const $log         = document.getElementById('event-log');
const $videoWin    = document.getElementById('video-window');
const $vwTitlebar  = document.getElementById('vw-titlebar');
const $vwToggle    = document.getElementById('vw-toggle-btn');
const $shareUrl    = document.getElementById('share-url');
const $copyBtn     = document.getElementById('copy-btn');
const $accordion   = document.getElementById('advanced-accordion');
const $accToggle   = document.getElementById('accordion-toggle');

// ── form fields ───────────────────────────────────────────────────────────────
const $veEnv          = document.getElementById('ve-env');
const $genesysEnv     = document.getElementById('genesys-env');
const $initiallyHidden = document.getElementById('initially-hidden');
const $iframeWidth    = document.getElementById('iframe-width');
const $iframeHeight   = document.getElementById('iframe-height');
const $lang           = document.getElementById('lang');
const $isPopup        = document.getElementById('is-popup');
const $authPopup      = document.getElementById('auth-popup');

// ── state ─────────────────────────────────────────────────────────────────────
let isMinimized = false;

// ── logging ───────────────────────────────────────────────────────────────────
function log(msg, level = 'info') {
  const ts   = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className = `l-${level}`;
  line.textContent = `[${ts}] ${msg}`;
  $log.appendChild(line);
  $log.scrollTop = $log.scrollHeight;
}

// ── status indicator ──────────────────────────────────────────────────────────
function setStatus(dotClass, text) {
  $statusDot.className = `dot ${dotClass}`;
  $statusText.textContent = text;
}

// ── read config from form ─────────────────────────────────────────────────────
function readConfig() {
  const width  = Math.min(Math.max(parseInt($iframeWidth.value,  10) || 480, MIN_DIM), SCREEN_W);
  const height = Math.min(Math.max(parseInt($iframeHeight.value, 10) || 400, MIN_DIM), SCREEN_H);

  return {
    veEnv:           $veEnv.value.trim(),
    genesysEnv:      $genesysEnv.value,
    initiallyHidden: $initiallyHidden.checked,
    width,
    height,
    lang:            $lang.value,
    isPopup:         $isPopup.checked,
    authPopup:       $authPopup.checked,
  };
}

// ── URL params ────────────────────────────────────────────────────────────────
function configToParams(cfg) {
  const p = new URLSearchParams();
  if (cfg.veEnv)           p.set('veEnv',           cfg.veEnv);
  if (cfg.genesysEnv)      p.set('genesysEnv',       cfg.genesysEnv);
  if (cfg.initiallyHidden) p.set('initiallyHidden',  '1');
  if (cfg.width  !== 480)  p.set('width',            String(cfg.width));
  if (cfg.height !== 360)  p.set('height',           String(cfg.height));
  if (cfg.lang)            p.set('lang',              cfg.lang);
  if (cfg.isPopup)         p.set('isPopup',          '1');
  if (!cfg.authPopup)      p.set('authPopup',        '0');
  return p;
}

function paramsToConfig(p) {
  return {
    veEnv:           p.get('veEnv')           ?? 'videome.leadsecure.com',
    genesysEnv:      p.get('genesysEnv')      ?? 'mypurecloud.com',
    initiallyHidden: p.get('initiallyHidden') === '1',
    width:           parseInt(p.get('width'),  10) || 480,
    height:          parseInt(p.get('height'), 10) || 360,
    lang:            p.get('lang')            ?? '',
    isPopup:         p.get('isPopup')         === '1',
    authPopup:       p.get('authPopup')       !== '0',
  };
}

function applyConfigToForm(cfg) {
  // veEnv select
  const veOpt = [...$veEnv.options].find(o => o.value === cfg.veEnv);
  if (veOpt) $veEnv.value = cfg.veEnv;

  const genesysOpt = [...$genesysEnv.options].find(o => o.value === cfg.genesysEnv);
  if (genesysOpt) $genesysEnv.value = cfg.genesysEnv;
  $initiallyHidden.checked  = cfg.initiallyHidden;
  $iframeWidth.value        = String(cfg.width);
  $iframeHeight.value       = String(cfg.height);
  const langOpt = [...$lang.options].find(o => o.value === cfg.lang);
  if (langOpt) $lang.value = cfg.lang;
  $isPopup.checked          = cfg.isPopup;
  $authPopup.checked        = cfg.authPopup;

  // open accordion if any advanced value differs from default
  const hasAdvanced = cfg.initiallyHidden || cfg.width !== 480 || cfg.height !== 360
                   || cfg.lang || cfg.isPopup || !cfg.authPopup;
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
[$veEnv, $genesysEnv, $initiallyHidden, $lang, $isPopup, $authPopup].forEach($el => {
  $el.addEventListener('change', updateShareUrl);
});

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

// ── floating video window size ────────────────────────────────────────────────
function applyWindowSize(width, height) {
  $videoWin.style.width  = `${width}px`;
  $videoWin.style.height = `${height}px`;
}

// ── draggable video window ────────────────────────────────────────────────────
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
    // switch from bottom/right to top/left positioning
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

// ── floating video window show/hide ──────────────────────────────────────────
function showVideoWindow(cfg) {
  $videoWin.classList.remove('hidden', 'minimized');
  applyWindowSize(cfg?.width ?? 800, cfg?.height ?? 800);
  isMinimized = false;
  $vwToggle.textContent = '\u2013'; // –
}

function hideVideoWindow(cfg) {
  const initiallyHidden = cfg?.initiallyHidden ?? true;
  if (initiallyHidden) {
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

// ── patch openIframe URL with extra params ────────────────────────────────────
function patchIframeUrl(url, cfg) {
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

// ── custom UI handlers passed to the SDK ─────────────────────────────────────
function buildUiHandlers(cfg) {
  return {
    openIframe: async (url) => {
      const container = document.getElementById('video-engager-container');
      container.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src   = patchIframeUrl(url, cfg);
      iframe.allow = 'camera; microphone; clipboard-write; display-capture';
      container.appendChild(iframe);

      if (!cfg.initiallyHidden) {
        // always show the window
        $videoWin.classList.remove('hidden', 'minimized');
        applyWindowSize(cfg.width, cfg.height);
      }
      log('SmartVideo iframe ready', 'info');
    },

    closeIframe: async () => {
      const container = document.getElementById('video-engager-container');
      const iframe    = container?.querySelector('iframe');
      if (iframe) {
        const url = iframe.src;
        iframe.remove();
        const newIframe = document.createElement('iframe');
        newIframe.src   = patchIframeUrl(url, cfg);
        newIframe.allow = 'camera; microphone; clipboard-write; display-capture';
        container.appendChild(newIframe);
      }
      log('SmartVideo iframe recycled', 'info');
    },

    getIframe: () => {
      return document.getElementById('video-engager-container')?.querySelector('iframe') ?? null;
    }
  };
}

// ── SDK event listeners ───────────────────────────────────────────────────────
const SHOW_STATES = new Set(['PRE_CALL', 'CALL_STARTED']);

function registerSDKEvents(cfg) {
  VE.on('callStateUpdated', (s) => {
    const status = s?.status;
    log(`Call state: ${status ?? JSON.stringify(s)}`, 'info');

    if (SHOW_STATES.has(status)) {
      showVideoWindow(cfg);
      setStatus('incall', `In call (${status})`);
    }
  });

  VE.on('sessionStarted', (s) => {
    log(`Session started — visitor: ${s?.visitorId ?? 'unknown'}`, 'success');
  });

  VE.on('sessionEnded', (s) => {
    log(`Session ended — status: ${s?.status ?? 'unknown'}`, 'info');
    hideVideoWindow(cfg);
    setStatus('connected', 'Connected — waiting for calls');
  });

  VE.on('sessionFailed', (p) => {
    log(`Session failed: ${JSON.stringify(p)}`, 'error');
    hideVideoWindow(cfg);
    setStatus('connected', 'Connected — waiting for calls');
  });

  VE.on('cleanup', () => {
    setStatus('', 'Disconnected');
    log('SDK cleaned up', 'warn');
  });
}

// ── form submit → init SDK ────────────────────────────────────────────────────
$form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const cfg = readConfig();

  $confirmBtn.disabled = true;
  $confirmBtn.textContent = 'Connecting…';
  setStatus('connecting', 'Connecting…');
  log(`Initialising SDK — VE: ${cfg.veEnv} / Genesys: ${cfg.genesysEnv}`, 'info');

  // show window immediately if not initially-hidden
  if (!cfg.initiallyHidden) {
    $videoWin.classList.remove('hidden', 'minimized');
    applyWindowSize(cfg.width, cfg.height);
  }

  try {
    await VE.init({
      authMethod: 'genesys',
      environment: cfg.genesysEnv,
      domain: cfg.veEnv,
      logger: true,
      options: {
        containerId: 'video-engager-container',
        uiHandlers: buildUiHandlers(cfg),
      }
    });

    registerSDKEvents(cfg);

    setStatus('connected', 'Connected — waiting for calls');
    log('SDK initialised. Waiting for incoming calls…', 'success');
    $confirmBtn.textContent = 'Connected';

    await VE.call();
  } catch (err) {
    setStatus('error', 'Connection failed');
    log(`Init error: ${err?.message ?? err}`, 'error');
    if (err?.code) log(`Error code: ${err.code}`, 'error');
    $confirmBtn.disabled = false;
    $confirmBtn.textContent = 'Retry';
  }
});

// ── cleanup on page unload ────────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  try { VE.destroy?.(); } catch (_) { /* ignore */ }
});

// ── bootstrap: read URL params → populate form ────────────────────────────────
(function bootstrap() {
  const params = new URLSearchParams(location.search);
  if (params.toString()) {
    applyConfigToForm(paramsToConfig(params));
  }
  updateShareUrl();
})();
