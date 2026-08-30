/**
 * ui-helpers.js
 * ----------------------------------------------------------------------
 * Small, generic UI utilities with zero dependency on any specific page's
 * DOM structure. Every demo page in this project (outbound-demo.html and
 * any you add later) should import these instead of re-implementing toast
 * notifications, JSON highlighting, clipboard copy, or localStorage
 * persistence from scratch.
 * ----------------------------------------------------------------------
 */

/** Escape text for safe insertion into innerHTML. Always call this before
 * building any HTML string from data that came off the network — this is
 * what stops a `customData.note` field like `<img src=x onerror=...>`
 * echoed back by the API from executing in the page. */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Pretty-print a value as JSON, falling back to String() if it isn't serializable. */
export function formatJson(value) {
  try { return JSON.stringify(value, null, 2); } catch (_) { return String(value); }
}

/**
 * Render a JSON string as syntax-highlighted HTML (keys/strings/numbers/
 * booleans/null get their own <span> class). The input is HTML-escaped
 * first, so this is safe to use with untrusted API responses.
 */
export function highlightJson(jsonStr) {
  const safe = escapeHtml(jsonStr);
  return safe
    .replace(/&quot;([^&]*?)&quot;:/g, '<span class="key">&quot;$1&quot;</span>:')
    .replace(/: &quot;([^&]*?)&quot;/g, ': <span class="string">&quot;$1&quot;</span>')
    .replace(/: (\d+(?:\.\d+)?)/g, ': <span class="number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="null">$1</span>');
}

/**
 * Create a toast controller bound to one element. Reused across pages so
 * the show/hide/timer logic lives in one place.
 * @param {HTMLElement} el
 * @returns {(message: string, type?: 'info'|'success'|'error', duration?: number) => void}
 */
export function createToast(el) {
  let timer = null;
  return function showToast(message, type = 'info', duration = 3500) {
    if (timer) clearTimeout(timer);
    el.textContent = message;
    el.className = 'toast';
    if (type === 'success') el.classList.add('success');
    if (type === 'error') el.classList.add('error');
    void el.offsetWidth; // restart the CSS transition
    el.classList.add('show');
    timer = setTimeout(() => el.classList.remove('show'), duration);
  };
}

/**
 * Copy text to the clipboard, falling back to a hidden textarea + execCommand
 * for browsers/contexts where the async Clipboard API is unavailable.
 * @param {string} text
 * @param {(ok: boolean) => void} [onDone]
 */
export function copyToClipboard(text, onDone) {
  if (!text) return;
  const done = (ok) => { if (onDone) onDone(ok); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => done(true)).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
  document.body.removeChild(ta);
  done(ok);
}

/**
 * Bind an input/textarea element to localStorage under `storageKey`,
 * restoring any saved value immediately and saving on every `change` event.
 * Fails silently (private browsing / storage disabled) — persistence is a
 * convenience, never a requirement for the demo to function.
 * @param {HTMLInputElement|HTMLTextAreaElement} el
 * @param {string} storageKey
 */
export function bindPersistentField(el, storageKey) {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) el.value = saved;
  } catch (_) { /* storage unavailable — ignore */ }

  el.addEventListener('change', () => {
    try { localStorage.setItem(storageKey, el.value); } catch (_) { /* ignore */ }
  });
}

/** Clear a set of localStorage keys, ignoring failures. */
export function clearPersistedFields(storageKeys) {
  try { storageKeys.forEach((k) => localStorage.removeItem(k)); } catch (_) { /* ignore */ }
}
