(function () {
  const TRANSACTION_KEY = 'videoengager-kiosk-core-oidc';
  const TRANSACTION_TIMEOUT_MS = 10 * 60 * 1000;
  const redirectUri = `${window.location.origin}${window.location.pathname}`;

  function readCallback () {
    const parameters = new URLSearchParams(window.location.search);
    if (!parameters.has('code') && !parameters.has('error')) return null;

    // Remove one-time parameters, but keep reloads blocked until settings are recovered.
    window.KIOSK_AUTH_REQUIRES_CONFIG = true;
    window.history.replaceState(null, document.title, `${redirectUri}?error=invalid_callback`);
    const storedTransaction = window.sessionStorage.getItem(TRANSACTION_KEY);
    window.sessionStorage.removeItem(TRANSACTION_KEY);

    const transaction = JSON.parse(storedTransaction || 'null');
    if (!transaction || transaction.redirectUri !== redirectUri ||
        typeof transaction.state !== 'string' || !transaction.state ||
        parameters.getAll('state').length !== 1 || parameters.get('state') !== transaction.state ||
        typeof transaction.appSearch !== 'string') {
      throw new Error('The sign-in request state is invalid.');
    }
    // A matching transaction can restore settings even when its sign-in grant has expired.
    const appSearch = new URLSearchParams(transaction.appSearch);
    if (appSearch.getAll('auth').length !== 1 || appSearch.get('auth').trim() !== 'true') {
      throw new Error('The sign-in callback requires authentication to be enabled.');
    }
    for (const key of ['code', 'state', 'error', 'error_description']) appSearch.delete(key);
    window.history.replaceState(null, document.title, redirectUri + (appSearch.size ? `?${appSearch}` : ''));
    window.KIOSK_AUTH_REQUIRES_CONFIG = false;
    const age = Date.now() - transaction.createdAt;
    if (!Number.isFinite(age) || age < 0 || age > TRANSACTION_TIMEOUT_MS ||
        typeof transaction.codeVerifier !== 'string' || !transaction.codeVerifier ||
        typeof transaction.nonce !== 'string' || !transaction.nonce) {
      throw new Error('The sign-in request expired or its credentials are invalid. Reload to sign in again.');
    }
    if (parameters.has('error')) {
      throw new Error('Sign-in was denied or cancelled. Reload to sign in again.');
    }
    if (parameters.getAll('code').length !== 1 || !parameters.get('code')?.trim()) {
      throw new Error('The identity provider did not return an authorization code.');
    }
    return {
      startAfterLogin: transaction.startAfterLogin === true,
      grant: {
        authCode: parameters.get('code'),
        redirectUri,
        codeVerifier: transaction.codeVerifier,
        nonce: transaction.nonce
      }
    };
  }

  // Read once at page load, without starting sign-in. The provider takes the cached grant later.
  let pendingCallback;
  try {
    pendingCallback = readCallback();
  } catch (error) {
    window.KIOSK_AUTH_ERROR = window.KIOSK_AUTH_REQUIRES_CONFIG
      ? 'The sign-in request is invalid and its settings could not be restored. Reopen the kiosk configuration to sign in again.'
      : error.message || 'The sign-in request is invalid. Reload to sign in again.';
  }

  window.createKioskAuthProvider = function ({ authorizationEndpoint, clientId, scopes, mode = 'perInteraction', onStatus = () => {}, shouldStartAfterLogin = () => false }) {
    if (window.KIOSK_AUTH_ERROR) throw new Error(window.KIOSK_AUTH_ERROR);
    const endpoint = new URL(authorizationEndpoint);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.hash) {
      throw new Error('Use an HTTPS authorization endpoint from your identity provider.');
    }
    if (typeof clientId !== 'string' || !clientId.trim() || !Array.isArray(scopes) ||
        !scopes.includes('openid') || scopes.some((scope) => typeof scope !== 'string' || !scope.trim())) {
      throw new Error('Configure the OIDC client ID and scopes, including openid.');
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
          // Remember Start across navigation; later SDK sign-ins need not start a call.
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
      cancel() {
        cancelled = true;
        grant = null;
        try { window.sessionStorage.removeItem(TRANSACTION_KEY); } catch { /* Storage may be disabled. */ }
      }
    };
  };
}());
