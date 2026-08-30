/**
 * videoengager-client.js
 * ----------------------------------------------------------------------
 * Zero-dependency JavaScript client for the VideoEngager Interactions
 * REST API + the Partner impersonate endpoint.
 *
 * This is the ONE place in the project that is allowed to call `fetch()`
 * against VideoEngager. Every method maps 1:1 to an operationId in the
 * OpenAPI specs under /openapi. If you need an endpoint that isn't here
 * yet, add it to the spec first, then mirror it here — see AGENTS.md
 * ("Adding a new endpoint") for the checklist.
 *
 * Works unmodified in any evergreen browser via `<script type="module">`
 * — no build step, no bundler, no npm install required.
 *
 * @example
 *   import { VideoEngagerClient } from './js/videoengager-client.js';
 *   const client = new VideoEngagerClient({ apiBase: 'https://videome.leadsecure.com' });
 *   const { token } = await client.impersonate({ pak, externalId, email });
 *   const interaction = await client.createAgentInteraction({ token, type: 'OUTBOUND', customData });
 * ----------------------------------------------------------------------
 */

/**
 * Thrown for any non-2xx response or network failure. Carries the parsed
 * response body (if any) so callers can render the real API error instead
 * of a generic "something went wrong".
 */
export class VideoEngagerApiError extends Error {
  /**
   * @param {string} message
   * @param {{status?: number, body?: unknown, url?: string, cause?: unknown}} [details]
   */
  constructor(message, { status, body, url, cause } = {}) {
    super(message);
    this.name = 'VideoEngagerApiError';
    this.status = status ?? null;
    this.body = body ?? null;
    this.url = url ?? null;
    if (cause) this.cause = cause;
  }
}

const DEFAULT_API_BASE = 'https://videome.leadsecure.com';

export class VideoEngagerClient {
  /**
   * @param {object} [opts]
   * @param {string} [opts.apiBase] Base URL of the Interactions API (tenant/agent endpoints).
   * @param {string} [opts.partnerApiBase] Base URL for the impersonate endpoint, if different
   *   from apiBase (defaults to apiBase — VideoEngager serves both from the same host today).
   * @param {string} [opts.impersonateProxyUrl] Optional URL of YOUR OWN backend endpoint that
   *   proxies the impersonate call. When set, `impersonate()` POSTs {pak, externalId, email}
   *   here instead of calling VideoEngager directly from the browser. Use this in anything
   *   beyond local/dev testing — see README "Security: where should the PAK live?".
   * @param {number} [opts.timeoutMs] Abort requests that take longer than this (default 30s).
   */
  constructor({ apiBase = DEFAULT_API_BASE, partnerApiBase, impersonateProxyUrl, timeoutMs = 30000 } = {}) {
    this.apiBase = stripTrailingSlash(apiBase || DEFAULT_API_BASE);
    this.partnerApiBase = stripTrailingSlash(partnerApiBase || this.apiBase);
    this.impersonateProxyUrl = impersonateProxyUrl || null;
    this.timeoutMs = timeoutMs;
  }

  // ------------------------------------------------------------------
  // Core request helper — every public method funnels through this so
  // error handling, timeouts, and auth headers stay in exactly one place.
  // ------------------------------------------------------------------
  async _request(base, path, { method = 'GET', token, otip, body, headers = {} } = {}) {
    const url = `${base}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const reqHeaders = { Accept: 'application/json', ...headers };
    if (token) reqHeaders.Authorization = `Bearer ${token}`;
    if (otip) reqHeaders.otip = otip;
    if (body !== undefined) reqHeaders['Content-Type'] = 'application/json';

    let resp;
    try {
      resp = await fetch(url, {
        method,
        headers: reqHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      const isAbort = err && err.name === 'AbortError';
      throw new VideoEngagerApiError(
        isAbort ? `Request to ${url} timed out after ${this.timeoutMs}ms` : `Network error calling ${url}: ${err.message}`,
        { url, cause: err }
      );
    }
    clearTimeout(timer);

    const rawText = await resp.text();
    let data = null;
    if (rawText) {
      try { data = JSON.parse(rawText); } catch (_) { data = { raw: rawText }; }
    }

    if (!resp.ok) {
      throw new VideoEngagerApiError(
        (data && data.message) || `Request failed with ${resp.status}`,
        { status: resp.status, body: data, url }
      );
    }
    return data;
  }

  // ------------------------------------------------------------------
  // Partner authentication
  // Spec: openapi/partners-impersonate.yaml (not part of interactions.yaml —
  // it belongs to the separate Partner API, documented here for completeness).
  // ------------------------------------------------------------------

  /**
   * Exchange a Partner API Key for a short-lived agent bearer token.
   *
   * SECURITY: a PAK authenticates as your entire partner tenant. If
   * `impersonateProxyUrl` is configured, this calls YOUR backend instead of
   * VideoEngager directly, so the PAK never has to touch the browser. If it
   * is not configured, this falls back to calling VideoEngager directly from
   * the browser (fine for local/dev testing — see README before using this
   * path in anything a real user's browser will run).
   *
   * @param {{pak: string, externalId: string, email: string}} params
   * @returns {Promise<{token: string, token_expiration: number}>}
   */
  async impersonate({ pak, externalId, email }) {
    requireFields({ pak, externalId, email });

    if (this.impersonateProxyUrl) {
      return this._request(stripTrailingSlash(this.impersonateProxyUrl), '', {
        method: 'POST',
        body: { pak, externalId, email },
      });
    }

    const path = `/api/partners/impersonate/${encodeURIComponent(pak)}/${encodeURIComponent(externalId)}/${encodeURIComponent(email)}`;
    return this._request(this.partnerApiBase, path, { method: 'GET' });
  }

  // ------------------------------------------------------------------
  // Interactions
  // Spec: openapi/interactions.yaml
  // ------------------------------------------------------------------

  /**
   * operationId: createInteractionByVisitor
   * Public, tenant-scoped: create an interaction from the visitor/widget side.
   * No auth required — this is the endpoint a public website widget calls.
   * @param {{tenantId: string, customData: object, options?: object, visitorData?: object}} params
   */
  async createVisitorInteraction({ tenantId, customData, options, visitorData }) {
    requireFields({ tenantId, customData });
    const path = `/api/interactions/tenants/${encodeURIComponent(tenantId)}/interactions`;
    return this._request(this.apiBase, path, {
      method: 'POST',
      body: { customData, ...(options ? { options } : {}), ...(visitorData ? { visitorData } : {}) },
    });
  }

  /**
   * operationId: createInteractionByAgent
   * Authenticated: create an interaction on behalf of an agent (e.g. an
   * OUTBOUND call the agent initiates). Requires a bearer token — see
   * `impersonate()`.
   * @param {{token: string, type?: 'OUTBOUND'|string, customData?: object, options?: object}} params
   */
  async createAgentInteraction({ token, type = 'OUTBOUND', customData = {}, options }) {
    requireFields({ token });
    return this._request(this.apiBase, '/api/interactions', {
      method: 'POST',
      token,
      body: { type, customData, ...(options ? { options } : {}) },
    });
  }

  /** operationId: getInteractionByVisitor — public visitor-safe projection. */
  async getVisitorProjection({ interactionId }) {
    requireFields({ interactionId });
    return this._request(this.apiBase, `/api/interactions/${encodeURIComponent(interactionId)}/visitor`, {});
  }

  /** operationId: getInteractionByAgent — requires bearer token. */
  async getAgentProjection({ interactionId, token }) {
    requireFields({ interactionId, token });
    return this._request(this.apiBase, `/api/interactions/${encodeURIComponent(interactionId)}/agent`, { token });
  }

  /**
   * operationId: updateInteractionByAgent (key: "updateAttributes" variant)
   * Update subject / start / expiresOn on an interaction.
   * @param {{interactionId: string, token: string, updates: {subject?: string, start?: number, expiresOn?: number}}} params
   */
  async updateInteractionAttributes({ interactionId, token, updates }) {
    requireFields({ interactionId, token, updates });
    return this._request(this.apiBase, `/api/interactions/${encodeURIComponent(interactionId)}/agent`, {
      method: 'PATCH',
      token,
      body: { key: 'updateAttributes', updates },
    });
  }

  /**
   * operationId: updateInteractionByAgent (generic variant)
   * Any other agent-side update payload (eventing, flags, externalId, etc.)
   * that doesn't fit the `updateAttributes` shape.
   * @param {{interactionId: string, token: string, payload: object}} params
   */
  async updateInteractionAgent({ interactionId, token, payload }) {
    requireFields({ interactionId, token, payload });
    return this._request(this.apiBase, `/api/interactions/${encodeURIComponent(interactionId)}/agent`, {
      method: 'PATCH',
      token,
      body: payload,
    });
  }

  /**
   * operationId: unwrapVisitorData
   * Decrypt visitor PII using the one-time password (OTIP) returned when the
   * interaction was created with `visitorData`.
   * @param {{interactionId: string, otip: string}} params
   */
  async unwrapVisitorData({ interactionId, otip }) {
    requireFields({ interactionId, otip });
    return this._request(this.apiBase, `/api/interactions/${encodeURIComponent(interactionId)}/visitor-data`, { otip });
  }

  /** operationId: invalidateByAgent — globally invalidates the interaction. */
  async invalidateInteraction({ interactionId, token }) {
    requireFields({ interactionId, token });
    return this._request(this.apiBase, `/api/interactions/${encodeURIComponent(interactionId)}`, {
      method: 'DELETE',
      token,
    });
  }

  /** operationId: getFeedbackForInteraction */
  async getFeedback({ interactionId }) {
    requireFields({ interactionId });
    return this._request(this.apiBase, `/api/interactions/${encodeURIComponent(interactionId)}/feedback`, {});
  }

  /**
   * operationId: createFeedbackForInteraction
   * @param {{interactionId: string, feedback: {rating: number, comment?: string, metadata?: object}}} params
   */
  async createFeedback({ interactionId, feedback }) {
    requireFields({ interactionId, feedback });
    return this._request(this.apiBase, `/api/interactions/${encodeURIComponent(interactionId)}/feedback`, {
      method: 'POST',
      body: feedback,
    });
  }

  /**
   * operationId: updateByExternalId
   * Analytics backfill (speech/text analytics) keyed by externalId rather
   * than interactionId.
   * @param {{externalId: string, speechandtextanalytics: object}} params
   */
  async updateAnalyticsByExternalId({ externalId, speechandtextanalytics }) {
    requireFields({ externalId, speechandtextanalytics });
    return this._request(this.apiBase, `/api/interactions/external/${encodeURIComponent(externalId)}`, {
      method: 'PATCH',
      body: { speechandtextanalytics },
    });
  }

  // ------------------------------------------------------------------
  // Static helpers — pure functions, safe to reuse anywhere (no fetch).
  // ------------------------------------------------------------------

  /** Append `?token=` to a join URL, preserving any existing query string. */
  static appendTokenToUrl(url, token) {
    if (!url || !token) return url;
    try {
      const u = new URL(url);
      u.searchParams.set('token', token);
      return u.toString();
    } catch (_) {
      const sep = url.includes('?') ? '&' : '?';
      return url + sep + 'token=' + encodeURIComponent(token);
    }
  }

  /** Resolve a possibly-relative join URL against the API base it came from. */
  static resolveJoinUrl(url, base) {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    return stripTrailingSlash(base) + (url.startsWith('/') ? '' : '/') + url;
  }
}

// ---- module-private helpers ----

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function requireFields(fields) {
  const missing = Object.entries(fields)
    .filter(([, v]) => v === undefined || v === null || v === '')
    .map(([k]) => k);
  if (missing.length) {
    throw new VideoEngagerApiError(`Missing required field(s): ${missing.join(', ')}`);
  }
}
