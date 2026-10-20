const TRANSACTION_KEY = 'videoengager-kiosk-prod-ready-custom-design-oidc';
const TRANSACTION_TIMEOUT_MS = 10 * 60 * 1000;
const RELOAD_CONFIG_KEY = 'videoengager-kiosk-prod-ready-custom-design-reload-config';
const RELOAD_CONFIG_TIMEOUT_MS = 60 * 1000;
const redirectUri = `${window.location.origin}${window.location.pathname}`;
let callbackRead = false;
let pendingCallback = null;
let restoredConfig = null;
let callbackError = null;

function readCallback () {
  const parameters = new URLSearchParams(window.location.search);
  if (!['code', 'state', 'error', 'error_description'].some(key => parameters.has(key))) return null;

  // Remove one-time credentials immediately; failed callbacks stay blocked on reload.
  window.history.replaceState(null, document.title, `${redirectUri}?error=invalid_callback`);
  const storedTransaction = window.sessionStorage.getItem(TRANSACTION_KEY);
  window.sessionStorage.removeItem(TRANSACTION_KEY);
  let transaction;
  try {
    transaction = JSON.parse(storedTransaction || 'null');
  } catch {
    throw new Error('The saved sign-in request is invalid. Reopen the kiosk configuration to sign in again.');
  }
  if (!transaction || transaction.redirectUri !== redirectUri ||
      typeof transaction.state !== 'string' || !transaction.state ||
      parameters.getAll('state').length !== 1 || parameters.get('state') !== transaction.state ||
      typeof transaction.appSearch !== 'string') {
    throw new Error('The sign-in request state is invalid. Reopen the kiosk configuration to sign in again.');
  }
  if (!transaction.config || typeof transaction.config !== 'object' ||
      Array.isArray(transaction.config) || transaction.config.auth?.enabled !== true) {
    throw new Error('The sign-in callback requires authentication to be enabled in the saved kiosk configuration.');
  }
  const age = Date.now() - transaction.createdAt;
  if (!Number.isFinite(age) || age < 0 || age > TRANSACTION_TIMEOUT_MS ||
      typeof transaction.codeVerifier !== 'string' || !transaction.codeVerifier ||
      typeof transaction.nonce !== 'string' || !transaction.nonce) {
    throw new Error('The sign-in request expired or its credentials are invalid. Reopen the kiosk configuration to sign in again.');
  }
  if (parameters.has('error')) {
    throw new Error('Sign-in was denied or cancelled. Reopen the kiosk configuration to sign in again.');
  }
  if (parameters.getAll('code').length !== 1 || !parameters.get('code')?.trim()) {
    throw new Error('The identity provider did not return a valid authorization code. Reopen the kiosk configuration to sign in again.');
  }

  const appSearch = new URLSearchParams(transaction.appSearch);
  for (const key of ['code', 'state', 'error', 'error_description']) appSearch.delete(key);
  window.history.replaceState(null, document.title, redirectUri + (appSearch.size ? `?${appSearch}` : ''));
  return {
    config: transaction.config,
    startAfterLogin: transaction.startAfterLogin === true,
    grant: {
      authCode: parameters.get('code'),
      redirectUri,
      codeVerifier: transaction.codeVerifier,
      nonce: transaction.nonce
    }
  };
}

// ConfigManager calls this before reading the URL or fetching an external config.
export function restoreAuthConfig () {
  if (!callbackRead) {
    callbackRead = true;
    try {
      pendingCallback = readCallback();
      restoredConfig = pendingCallback?.config || null;
    } catch (error) {
      callbackError = error;
    }
  }
  if (callbackError) throw callbackError;
  return restoredConfig;
}

export function saveConfigForReload (config) {
  const configUrl = new URLSearchParams(window.location.search).get('config');
  if (!configUrl || new URL(configUrl, window.location.href).protocol !== 'blob:') return;
  // Only the resolved public configuration; never copy the provider or its grant.
  window.sessionStorage.setItem(RELOAD_CONFIG_KEY, JSON.stringify({
    url: window.location.href,
    createdAt: Date.now(),
    config
  }));
}

export function restoreConfigAfterReload () {
  const configUrl = new URLSearchParams(window.location.search).get('config');
  if (!configUrl || new URL(configUrl, window.location.href).protocol !== 'blob:') return null;
  const stored = window.sessionStorage.getItem(RELOAD_CONFIG_KEY);
  window.sessionStorage.removeItem(RELOAD_CONFIG_KEY);
  if (!stored) return null;
  let snapshot;
  try { snapshot = JSON.parse(stored); } catch { return null; }
  const age = Date.now() - snapshot?.createdAt;
  if (snapshot?.url !== window.location.href || !Number.isFinite(age) ||
      age < 0 || age > RELOAD_CONFIG_TIMEOUT_MS) return null;
  return snapshot.config;
}

export function createKioskAuthProvider ({ authorizationEndpoint, clientId, scopes, mode = 'perInteraction', config, onStatus = () => {}, shouldStartAfterLogin = () => false }) {
  restoreAuthConfig();
  const endpoint = new URL(authorizationEndpoint);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.hash) {
    throw new Error('Use an HTTPS authorization endpoint from your identity provider.');
  }
  if (typeof clientId !== 'string' || !clientId.trim() || !Array.isArray(scopes) ||
      !scopes.includes('openid') || scopes.some(scope => typeof scope !== 'string' || !scope.trim())) {
    throw new Error('Configure the OIDC client ID and scopes, including openid.');
  }
  if (config?.auth?.enabled !== true) {
    throw new Error('Enable authentication in the resolved kiosk configuration before signing in.');
  }
  if (!window.isSecureContext || !window.crypto?.subtle) {
    throw new Error('OIDC sign-in requires HTTPS or localhost.');
  }

  let redirecting = false;
  let cancelled = false;
  let grantConsumed = false;

  function base64Url (bytes) {
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function randomValue (length) {
    return base64Url(window.crypto.getRandomValues(new Uint8Array(length)));
  }

  const callback = pendingCallback;
  pendingCallback = null;
  let grant = callback?.grant;

  async function redirectToSignIn (forceLogin = false) {
    if (cancelled) throw new Error('Sign-in was cancelled. Reload to try again.');
    if (redirecting) return new Promise(() => {});
    redirecting = true;
    try {
      onStatus('Redirecting to sign in…');
      const transaction = {
        codeVerifier: randomValue(64),
        state: randomValue(32),
        nonce: randomValue(32),
        redirectUri,
        appSearch: window.location.search,
        // Public resolved settings survive external/blob config URLs across navigation.
        config,
        startAfterLogin: shouldStartAfterLogin(),
        createdAt: Date.now()
      };
      const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(transaction.codeVerifier));
      const authorizeUrl = new URL(endpoint);
      authorizeUrl.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        response_mode: 'query',
        scope: scopes.join(' '),
        state: transaction.state,
        nonce: transaction.nonce,
        code_challenge: base64Url(new Uint8Array(digest)),
        code_challenge_method: 'S256'
      }).toString();
      if (forceLogin || mode === 'perInteraction') authorizeUrl.searchParams.set('prompt', 'login');
      if (cancelled) throw new Error('Sign-in was cancelled. Reload to try again.');
      window.sessionStorage.setItem(TRANSACTION_KEY, JSON.stringify(transaction));
      window.location.assign(authorizeUrl.href);
      // Navigation replaces this page; never return an empty grant to Genesys.
      return new Promise(() => {});
    } catch (error) {
      redirecting = false;
      window.sessionStorage.removeItem(TRANSACTION_KEY);
      throw error;
    }
  }

  return {
    startAfterLogin: callback?.startAfterLogin === true,
    get grantConsumed () { return grantConsumed; },
    get isRedirecting () { return redirecting; },
    getAuthCode: async (request = {}) => {
      if (cancelled) throw new Error('Sign-in was cancelled. Reload to try again.');
      if (grant) {
        const result = grant;
        grant = null;
        grantConsumed = true;
        return result;
      }
      return redirectToSignIn(!!request.forceUpdate);
    },
    reAuthenticate: () => redirectToSignIn(true),
    cancel () {
      cancelled = true;
      grant = null;
      try { window.sessionStorage.removeItem(TRANSACTION_KEY); } catch { /* Storage may be disabled. */ }
    }
  };
}
