/**
 * outbound-demo.js — page controller for outbound-demo.html.
 *
 * All API calls live in VideoEngagerClient; all generic UI plumbing lives
 * in ui-helpers.js. This file only wires the two together to this page's
 * specific DOM. Copy this file as a starting point for a new demo page
 * (e.g. an INBOUND/visitor-initiated flow) — you should not need to touch
 * videoengager-client.js or ui-helpers.js to do that.
 */
import { VideoEngagerClient, VideoEngagerApiError } from './videoengager-client.js';
import { formatJson, highlightJson, createToast, copyToClipboard, bindPersistentField } from './ui-helpers.js';

(function () {
  'use strict';

  // ---- DOM refs ----
  const pakInput = document.getElementById('pakInput');
  const externalIdInput = document.getElementById('externalIdInput');
  const emailInput = document.getElementById('emailInput');
  const impersonateBtn = document.getElementById('impersonateBtn');
  const clearAuthBtn = document.getElementById('clearAuthBtn');
  const tokenDisplay = document.getElementById('tokenDisplay');
  const tokenExpiryInfo = document.getElementById('tokenExpiryInfo');
  const authResponseArea = document.getElementById('authResponseArea');
  const authResponseBox = document.getElementById('authResponseBox');
  const authStatus = document.getElementById('authStatus');
  const authBadge = document.getElementById('authBadge');

  const bearerTokenEl = document.getElementById('bearerToken');
  const apiBaseEl = document.getElementById('apiBase');
  const customDataEl = document.getElementById('customData');
  const generateBtn = document.getElementById('generateBtn');
  const clearBtn = document.getElementById('clearBtn');
  const statusText = document.getElementById('statusText');
  const responseArea = document.getElementById('responseArea');
  const responseBox = document.getElementById('responseBox');
  const responseSummary = document.getElementById('responseSummary');
  const interactionIdBadge = document.getElementById('interactionIdBadge');
  const statusLabel = document.getElementById('statusLabel');

  const agentIframe = document.getElementById('agentIframe');
  const visitorIframe = document.getElementById('visitorIframe');
  const agentPlaceholder = document.getElementById('agentPlaceholder');
  const visitorPlaceholder = document.getElementById('visitorPlaceholder');
  const agentLoading = document.getElementById('agentLoading');
  const visitorLoading = document.getElementById('visitorLoading');
  const agentUrlPreview = document.getElementById('agentUrlPreview');
  const visitorUrlPreview = document.getElementById('visitorUrlPreview');

  const toggleTokenBtn = document.getElementById('toggleToken');
  const apiBaseDisplay = document.getElementById('apiBaseDisplay');
  const toastEl = document.getElementById('toast');

  const showToast = createToast(toastEl);

  // ---- state ----
  // The client is (re)created whenever the API base field changes, so
  // "override for dev/local" in the UI actually takes effect.
  let client = new VideoEngagerClient({ apiBase: apiBaseEl.value.trim() });

  // ---- helpers ----
  function setStatus(text, isError = false) {
    statusText.textContent = text;
    statusText.style.color = isError ? 'var(--danger)' : '';
    statusLabel.textContent = text;
  }

  function setAuthStatus(text, isError = false) {
    authStatus.textContent = text;
    authStatus.style.color = isError ? 'var(--danger)' : '';
  }

  function renderResponse(box, { title, data, ok }) {
    box.className = 'response-box ' + (ok ? 'success' : 'error');
    const icon = ok ? '✅' : '❌';
    box.innerHTML = `<strong>${icon} ${title}</strong>\n${highlightJson(formatJson(data))}`;
  }

  function getCustomData() {
    const raw = customDataEl.value.trim();
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (_) { return { raw }; }
  }

  /** Render a friendly message for any thrown error, API or otherwise. */
  function describeError(err) {
    if (err instanceof VideoEngagerApiError) {
      return { title: `Error${err.status ? ' ' + err.status : ''}`, data: err.body ?? { message: err.message } };
    }
    return { title: 'Unexpected error', data: { message: err.message || String(err) } };
  }

  // ---- Impersonate ----
  async function impersonate() {
    const pak = pakInput.value.trim();
    const externalId = externalIdInput.value.trim();
    const email = emailInput.value.trim();

    if (!pak) { showToast('PAK is required', 'error'); pakInput.focus(); return; }
    if (!externalId) { showToast('External ID is required', 'error'); externalIdInput.focus(); return; }
    if (!email) { showToast('Email is required', 'error'); emailInput.focus(); return; }

    setAuthStatus('Authenticating…');
    impersonateBtn.disabled = true;
    impersonateBtn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> Getting token…';
    authResponseArea.style.display = 'none';

    try {
      const data = await client.impersonate({ pak, externalId, email });
      const token = data.token || null;
      const expires = data.token_expiration;

      if (!token) {
        authResponseArea.style.display = 'block';
        renderResponse(authResponseBox, { title: 'No token in response', data, ok: false });
        setAuthStatus('No token received', true);
        showToast('Response missing token', 'error');
        return;
      }

      bearerTokenEl.value = token;

      tokenDisplay.textContent = ''; // clear, then build with textContent — never innerHTML the raw token
      const tokenSpan = document.createElement('span');
      tokenSpan.textContent = token;
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = '📋 Copy';
      copyBtn.addEventListener('click', (e) => { e.stopPropagation(); copyToClipboard(token, (ok) => showToast(ok ? 'Copied!' : 'Could not copy', ok ? 'success' : 'error', 1800)); });
      tokenDisplay.append(tokenSpan, copyBtn);

      if (expires !== null && expires !== undefined) {
        const expiryText = expires === 0 ? 'Session-scoped (no expiry)' : `Expires: ${new Date(expires * 1000).toLocaleString()}`;
        tokenExpiryInfo.innerHTML = `<span class="highlight"></span>`;
        tokenExpiryInfo.querySelector('.highlight').textContent = expiryText;
      } else {
        tokenExpiryInfo.textContent = 'Expiry not provided';
      }

      authResponseArea.style.display = 'block';
      renderResponse(authResponseBox, { title: 'Token obtained', data, ok: true });
      setAuthStatus('Token obtained ✓');
      authBadge.textContent = 'authenticated';
      authBadge.className = 'badge success';
      showToast('Bearer token obtained successfully!', 'success');
    } catch (err) {
      authResponseArea.style.display = 'block';
      const { title, data } = describeError(err);
      renderResponse(authResponseBox, { title, data, ok: false });
      setAuthStatus(title, true);
      showToast(`Impersonate failed: ${title}`, 'error');
    } finally {
      impersonateBtn.disabled = false;
      impersonateBtn.innerHTML = '<span>🔑</span> Get Token via Impersonate';
    }
  }

  function clearAuthToken() {
    bearerTokenEl.value = '';
    tokenDisplay.innerHTML = '<span class="empty">No token yet</span>';
    tokenExpiryInfo.textContent = '';
    authResponseArea.style.display = 'none';
    authBadge.textContent = 'get token';
    authBadge.className = 'badge';
    setAuthStatus('Token cleared');
    showToast('Token cleared', 'info', 1500);
  }

  // ---- Interaction generation (OUTBOUND via agent endpoint) ----
  function clearAll() {
    responseArea.style.display = 'none';
    responseBox.textContent = '';
    responseBox.className = 'response-box';
    responseSummary.innerHTML = '';
    interactionIdBadge.textContent = 'waiting for interaction';
    agentIframe.src = '';
    visitorIframe.src = '';
    agentPlaceholder.style.display = 'flex';
    visitorPlaceholder.style.display = 'flex';
    agentLoading.classList.add('hidden');
    visitorLoading.classList.add('hidden');
    agentUrlPreview.textContent = '—';
    visitorUrlPreview.textContent = '—';
    document.querySelectorAll('.error-placeholder').forEach((el) => el.remove());
    setStatus('Ready');
  }

  function renderIframe({ url, iframe, placeholder, loading, preview, bodyId, label }) {
    if (!url) {
      placeholder.style.display = 'flex';
      loading.classList.add('hidden');
      iframe.src = '';
      preview.textContent = '—';
      return;
    }
    placeholder.style.display = 'none';
    loading.classList.remove('hidden');
    iframe.src = url;
    preview.textContent = url.replace(/^https?:\/\//, '');
    iframe.onload = () => loading.classList.add('hidden');
    iframe.onerror = () => {
      loading.classList.add('hidden');
      const errDiv = document.createElement('div');
      errDiv.className = 'error-placeholder';
      errDiv.innerHTML = `<div style="font-size:28px;">⚠️</div><div>Failed to load ${label} view</div><div class="sub">CORS or invalid URL</div>`;
      const body = document.getElementById(bodyId);
      const oldErr = body.querySelector('.error-placeholder');
      if (oldErr) oldErr.remove();
      body.appendChild(errDiv);
    };
  }

  async function generateInteraction() {
    const token = bearerTokenEl.value.trim();
    if (!token) {
      showToast('Bearer token is required (use impersonate or enter manually)', 'error');
      bearerTokenEl.focus();
      return;
    }

    setStatus('Generating OUTBOUND…');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> Generating…';
    clearAll(); // clears iframes/response but keeps the token field as-is

    try {
      const data = await client.createAgentInteraction({ token, type: 'OUTBOUND', customData: getCustomData() });

      const interactionId = data.interactionId || data.id || null;
      if (!interactionId) {
        responseArea.style.display = 'block';
        renderResponse(responseBox, { title: 'Missing interactionId', data, ok: false });
        setStatus('Missing interactionId', true);
        showToast('Response missing interactionId', 'error');
        return;
      }

      responseArea.style.display = 'block';
      renderResponse(responseBox, { title: 'OUTBOUND interaction created', data, ok: true });

      // AgentJoin/VisitorJoin both expose `fullUrl` per the OpenAPI schema
      // (openapi/interactions.yaml). Older gateway responses have been seen
      // using top-level agentUrl/visitorUrl instead — both are handled here.
      let agentUrl = data.agent?.fullUrl || data.agentUrl || null;
      const visitorUrl = data.visitor?.shortUrl || data.visitorUrl || null;
      const type = data.type || 'OUTBOUND';

      if (agentUrl) {
        agentUrl = VideoEngagerClient.resolveJoinUrl(agentUrl, client.apiBase);
        agentUrl = VideoEngagerClient.appendTokenToUrl(agentUrl, token);
      }

      interactionIdBadge.textContent = `📍 ${interactionId} (${type})`;

      responseSummary.innerHTML = `
        <div class="item">
          <span class="label">Interaction ID</span>
          <span class="value" id="interactionIdValue"></span>
        </div>
        <div class="item">
          <span class="label">Type</span>
          <span class="value"></span>
        </div>
      `;
      const idValueEl = responseSummary.querySelector('#interactionIdValue');
      idValueEl.textContent = interactionId + ' ';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = '📋';
      copyBtn.addEventListener('click', (e) => { e.stopPropagation(); copyToClipboard(interactionId, (ok) => showToast(ok ? 'Copied!' : 'Could not copy', ok ? 'success' : 'error', 1500)); });
      idValueEl.appendChild(copyBtn);
      responseSummary.querySelectorAll('.item .value')[1].textContent = type;

      renderIframe({ url: agentUrl, iframe: agentIframe, placeholder: agentPlaceholder, loading: agentLoading, preview: agentUrlPreview, bodyId: 'agentBody', label: 'agent' });
      renderIframe({ url: visitorUrl, iframe: visitorIframe, placeholder: visitorPlaceholder, loading: visitorLoading, preview: visitorUrlPreview, bodyId: 'visitorBody', label: 'visitor' });

      setStatus(`✅ OUTBOUND interaction ${interactionId} ready`);
      showToast(`OUTBOUND interaction ${interactionId} created!`, 'success');
    } catch (err) {
      responseArea.style.display = 'block';
      const { title, data } = describeError(err);
      renderResponse(responseBox, { title, data, ok: false });
      setStatus(title, true);
      showToast(`API error: ${title}`, 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<span>🚀</span> Generate OUTBOUND Interaction';
    }
  }

  // ---- Init ----
  function init() {
    impersonateBtn.addEventListener('click', impersonate);
    clearAuthBtn.addEventListener('click', clearAuthToken);

    toggleTokenBtn.addEventListener('click', function () {
      const isPassword = bearerTokenEl.type === 'password';
      bearerTokenEl.type = isPassword ? 'text' : 'password';
      this.textContent = isPassword ? '🙈' : '👁';
    });

    generateBtn.addEventListener('click', generateInteraction);
    clearBtn.addEventListener('click', function () {
      clearAll();
      showToast('Cleared interaction views', 'info', 1500);
    });

    bearerTokenEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); generateBtn.click(); }
    });

    apiBaseEl.addEventListener('input', function () {
      let val = this.value.trim();
      client = new VideoEngagerClient({ apiBase: val || undefined });
      if (!val) val = 'videome.leadsecure.com';
      else val = val.replace(/^https?:\/\//, '');
      apiBaseDisplay.textContent = val;
    });

    if (!customDataEl.value) {
      customDataEl.value = JSON.stringify(
        { subject: 'Outbound Campaign #123', caseId: 'CASE-456', priority: 'high', source: 'demo-portal' },
        null,
        2
      );
    }

    // Dev convenience only — see README "Security: where should the PAK
    // live?" before relying on localStorage-persisted tokens beyond
    // local testing (a stored JWT is readable by any script on the page,
    // i.e. an XSS risk in a real deployment).
    bindPersistentField(pakInput, 've_demo_pak');
    bindPersistentField(externalIdInput, 've_demo_ext');
    bindPersistentField(emailInput, 've_demo_email');
    bindPersistentField(bearerTokenEl, 've_demo_token');

    setStatus('Ready — authenticate then generate OUTBOUND interaction');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
