/**
 * @fileoverview VideoEngager SDK layer.
 * Handles init, call, and SDK events. No direct DOM manipulation here —
 * all UI side-effects go through imports from ui.mjs.
 */

import * as VE from 'https://cdn.jsdelivr.net/npm/videoengager-agent-sdk@6.0.2/dist/index.mjs';
import {
  log,
  setStatus,
  showVideoWindow,
  hideVideoWindow,
  mountGenesysPanel,
  unmountGenesysPanel,
  patchIframeUrl,
  $videoWin,
} from './ui.mjs';

// ── internal state ────────────────────────────────────────────────────────────
const SHOW_STATES = new Set(['PRE_CALL', 'CALL_STARTED']);

// ── SDK event listeners ───────────────────────────────────────────────────────
function registerSDKEvents(cfg) {
  VE.on('callStateUpdated', (s) => {
    console.log('[VE] callStateUpdated', s);
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
    hideVideoWindow();
    unmountGenesysPanel();
    setStatus('', 'Disconnected');
    log('SDK cleaned up', 'warn');
  });
}

// ── UI handlers passed to the SDK ─────────────────────────────────────────────
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
        $videoWin.classList.remove('hidden', 'minimized');
        $videoWin.style.width  = `${cfg.width}px`;
        $videoWin.style.height = `${cfg.height}px`;
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
    },
  };
}

// ── connect ───────────────────────────────────────────────────────────────────
export async function connect(cfg) {
  await VE.init({
    authMethod:  'genesys',
    environment: cfg.genesysEnv,
    domain:      cfg.veEnv,
    logger:      true,
    options: {
      containerId: 'video-engager-container',
      uiHandlers:  buildUiHandlers(cfg),
    },
  });

  registerSDKEvents(cfg);
  if (cfg.genesysEmbedded) {
    mountGenesysPanel(cfg.genesysEnv);
  }

  await VE.call();
}

// ── cleanup on page unload ────────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  try { VE.destroy?.(); } catch (_) { /* ignore */ }
});
