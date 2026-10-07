/**
 * @fileoverview VideoEngager Agent SDK — Genesys Demo
 *
 * Calls VE.call() immediately after init.
 * The floating SmartVideo window is shown on PRE_CALL or CALL_STARTED,
 * and hidden on FINISHED or sessionFailed.
 */

import * as VE from 'https://cdn.jsdelivr.net/npm/videoengager-agent-sdk@6.0.2/dist/index.mjs';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $form       = document.getElementById('config-form');
const $confirmBtn = document.getElementById('confirm-btn');
const $statusDot  = document.getElementById('status-dot');
const $statusText = document.getElementById('status-text');
const $log        = document.getElementById('event-log');
const $videoWin   = document.getElementById('video-window');
const $vwToggle   = document.getElementById('vw-toggle-btn');
const $vwTitle    = document.getElementById('vw-title-text');
const $liveDot    = document.getElementById('vw-live-dot');
const $endCallBtn = document.getElementById('end-call-btn');

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

// ── floating video window ─────────────────────────────────────────────────────
function showVideoWindow() {
  $videoWin.classList.remove('hidden', 'minimized');
  $vwTitle.textContent = 'SmartVideo — Live';
  $liveDot.style.display = 'inline-block';
  $endCallBtn.style.display = 'block';
  isMinimized = false;
  $vwToggle.textContent = '\u2304';
}

function hideVideoWindow() {
  $videoWin.classList.add('hidden');
  $liveDot.style.display = 'none';
  $endCallBtn.style.display = 'none';
}

$vwToggle.addEventListener('click', () => {
  if (isMinimized) {
    $videoWin.classList.remove('minimized');
    isMinimized = false;
    $vwToggle.textContent = '\u2304';
  } else {
    $videoWin.classList.add('minimized');
    isMinimized = true;
    $vwToggle.textContent = '\u2303';
  }
});

$endCallBtn.addEventListener('click', async () => {
  log('Ending call…', 'info');
  try {
    await VE.endCall();
  } catch (err) {
    log(`endCall error: ${err?.message ?? err}`, 'error');
  }
});

// ── custom UI handlers passed to the SDK ─────────────────────────────────────
// The iframe is always kept alive in the DOM so the SDK can communicate with it.
// Visibility of the floating window is driven solely by callStateUpdated / session events.
const uiHandlers = {
  openIframe: async (url) => {
    const container = document.getElementById('video-engager-container');
    container.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.allow = 'camera; microphone; clipboard-write; display-capture';
    container.appendChild(iframe);
    log('SmartVideo iframe ready (hidden until call state)', 'info');
  },

  closeIframe: async () => {
    const container = document.getElementById('video-engager-container');
    const iframe = container?.querySelector('iframe');
    if (iframe) {
      const url = iframe.src;
      iframe.remove();
      const newIframe = document.createElement('iframe');
      newIframe.src = url;
      newIframe.allow = 'camera; microphone; clipboard-write; display-capture';
      container.appendChild(newIframe);
    }
    log('SmartVideo iframe recycled', 'info');
  },

  getIframe: () => {
    return document.getElementById('video-engager-container')?.querySelector('iframe') ?? null;
  }
};

// ── SDK event listeners ───────────────────────────────────────────────────────
const SHOW_STATES  = new Set(['PRE_CALL', 'CALL_STARTED']);

function registerSDKEvents() {
  VE.on('callStateUpdated', (s) => {
    const status = s?.status;
    log(`Call state: ${status ?? JSON.stringify(s)}`, 'info');

    if (SHOW_STATES.has(status)) {
      showVideoWindow();
      setStatus('incall', `In call (${status})`);
    }
  });

  VE.on('sessionStarted', (s) => {
    log(`Session started — visitor: ${s?.visitorId ?? 'unknown'}`, 'success');
  });

  VE.on('sessionEnded', (s) => {
    log(`Session ended — status: ${s?.status ?? 'unknown'}`, 'info');
    hideVideoWindow();
    setStatus('connected', 'Connected — waiting for calls');
  });

  VE.on('sessionFailed', (p) => {
    log(`Session failed: ${JSON.stringify(p)}`, 'error');
    hideVideoWindow();
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

  const veDomain   = document.getElementById('ve-env').value.trim();
  const genesysEnv = document.getElementById('genesys-env').value.trim();

  if (!genesysEnv) {
    log('Please enter a Genesys Cloud environment.', 'error');
    return;
  }

  $confirmBtn.disabled = true;
  $confirmBtn.textContent = 'Connecting…';
  setStatus('connecting', 'Connecting…');
  log(`Initialising SDK — VE: ${veDomain} / Genesys: ${genesysEnv}`, 'info');

  try {
    await VE.init({
      authMethod: 'genesys',
      environment: genesysEnv,
      domain: veDomain,
      logger: true,
      options: {
        containerId: 'video-engager-container',
        uiHandlers,
      }
    });

    registerSDKEvents();

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
