/**
 * @fileoverview Entry point — wires the form to the VE SDK layer.
 *
 * UI logic lives in ui.mjs.
 * VideoEngager SDK logic lives in ve.mjs.
 */

import { $form, $confirmBtn, $videoWin, readConfig, setStatus, log, bootstrap } from './ui.mjs';
import { connect } from './ve.mjs';

// ── form submit → connect ─────────────────────────────────────────────────────
$form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const cfg = readConfig();

  $confirmBtn.disabled    = true;
  $confirmBtn.textContent = 'Connecting…';
  setStatus('connecting', 'Connecting…');
  log(`Initialising SDK — VE: ${cfg.veEnv} / Genesys: ${cfg.genesysEnv}`, 'info');

  // show SmartVideo window immediately if not initially-hidden
  if (!cfg.initiallyHidden) {
    $videoWin.classList.remove('hidden', 'minimized');
    $videoWin.style.width  = `${cfg.width}px`;
    $videoWin.style.height = `${cfg.height}px`;
  }

  try {
    await connect(cfg);

    setStatus('connected', 'Connected — waiting for calls');
    log('SDK initialised. Waiting for incoming calls…', 'success');
    $confirmBtn.textContent = 'Connected';
  } catch (err) {
    setStatus('error', 'Connection failed');
    log(`Init error: ${err?.message ?? err}`, 'error');
    if (err?.code) log(`Error code: ${err.code}`, 'error');
    $confirmBtn.disabled    = false;
    $confirmBtn.textContent = 'Retry';
  }
});

// ── bootstrap: read URL params → populate form ────────────────────────────────
bootstrap();
