/**
 * @fileoverview VideoEngager Agent SDK — Genesys Demo
 *
 * Calls VE.call() immediately after init.
 *
 * Sign-in (README "Agent sign-in", option B): the SmartVideo window is shown
 * as soon as the iframe loads, so the agent can click sign-in. Identity
 * providers refuse to be framed, so sign-in runs in a pop-up, and a pop-up
 * opened from a click is allowed even with the pop-up blocker on.
 * After that the window is never hidden while connected: it is restored on
 * PRE_CALL / CALL_STARTED and minimised (title bar only) when a call ends.
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
function setMinimized(min) {
  $videoWin.classList.toggle('minimized', min);
  isMinimized = min;
  $vwToggle.textContent = min ? '\u2303' : '\u2304';
}

// Before the first call: visible and expanded so the agent can sign in.
function showSignInWindow() {
  $videoWin.classList.remove('hidden');
  $vwTitle.textContent = 'SmartVideo — sign in, then minimise';
  $liveDot.style.display = 'none';
  $endCallBtn.style.display = 'none';
  setMinimized(false);
}

// Call in progress: expanded, live indicator, End call button.
function showVideoWindow() {
  $videoWin.classList.remove('hidden');
  $vwTitle.textContent = 'SmartVideo — Live';
  $liveDot.style.display = 'inline-block';
  $endCallBtn.style.display = 'block';
  setMinimized(false);
}

// Between calls: minimised to the title bar, never hidden, so the agent can
// reopen it if SmartVideo ever asks to sign in again.
function idleVideoWindow() {
  $vwTitle.textContent = 'SmartVideo — waiting for calls';
  $liveDot.style.display = 'none';
  $endCallBtn.style.display = 'none';
  setMinimized(true);
}

function hideVideoWindow() {
  $videoWin.classList.add('hidden');
  $liveDot.style.display = 'none';
  $endCallBtn.style.display = 'none';
}

$vwToggle.addEventListener('click', () => setMinimized(!isMinimized));

$endCallBtn.addEventListener('click', async () => {
  log('Ending call…', 'info');
  try {
    await VE.endCall();
  } catch (err) {
    log(`endCall error: ${err?.message ?? err}`, 'error');
  }
});

// ── custom UI handlers passed to the SDK ─────────────────────────────────────
// The iframe is always kept alive in the DOM so the SDK can communicate with it
// and the agent stays signed in between calls.
const uiHandlers = {
  openIframe: async (url) => {
    const container = document.getElementById('video-engager-container');
    container.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.allow = 'camera; microphone; clipboard-write; display-capture';
    container.appendChild(iframe);
    showSignInWindow();
    log('SmartVideo loaded — sign in inside the video window, then minimise it', 'info');
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
    idleVideoWindow();
    setStatus('connected', 'Connected — waiting for calls');
  });

  VE.on('sessionFailed', (p) => {
    log(`Session failed: ${JSON.stringify(p)}`, 'error');
    idleVideoWindow();
    setStatus('connected', 'Connected — waiting for calls');
  });

  VE.on('cleanup', () => {
    hideVideoWindow();
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
