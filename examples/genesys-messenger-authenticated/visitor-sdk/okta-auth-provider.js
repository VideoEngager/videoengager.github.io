// This file owns the full Okta Authorization Code + PKCE redirect flow.
(function exposeOktaAuthProvider () {
  const TRANSACTION_KEY = 'videoengager-okta-pkce';

  window.createOktaAuthProvider = function createOktaAuthProvider ({
    authorizationEndpoint,
    clientId,
    scopes,
    onStatus = () => {},
    onError = (error) => console.error(error)
  }) {
    validateConfiguration();

    const redirectUri = `${window.location.origin}${window.location.pathname}`;

    function validateConfiguration () {
      if (!authorizationEndpoint || !clientId || !scopes || !scopes.length) {
        throw new Error('Update the Okta configuration in app.js.');
      }

      if (!window.isSecureContext || !window.crypto || !window.crypto.subtle) {
        throw new Error('Okta PKCE requires HTTPS or localhost.');
      }
    }

    function base64Url (bytes) {
      return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }

    function randomValue (byteLength) {
      return base64Url(
        window.crypto.getRandomValues(new Uint8Array(byteLength))
      );
    }

    async function createCodeChallenge (codeVerifier) {
      const digest = await window.crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(codeVerifier)
      );

      return base64Url(new Uint8Array(digest));
    }

    function readCallback () {
      const parameters = new URLSearchParams(window.location.search);
      const code = parameters.get('code');
      const error = parameters.get('error');

      // No Okta parameters means this is the first page load.
      if (!code && !error) {
        return null;
      }

      let transaction;
      try {
        transaction = JSON.parse(
          window.sessionStorage.getItem(TRANSACTION_KEY) || 'null'
        );
      } catch (error) {
        console.warn('Ignoring an invalid Okta transaction.', error);
        transaction = null;
      }

      window.sessionStorage.removeItem(TRANSACTION_KEY);

      // Remove the one-time code and state from the browser address bar.
      window.history.replaceState(null, document.title, redirectUri);

      if (!transaction || parameters.get('state') !== transaction.state) {
        throw new Error('Okta callback state is missing or invalid.');
      }

      if (error) {
        const description = parameters.get('error_description');
        throw new Error(`Okta sign-in failed: ${description || error}`);
      }

      // Genesys exchanges this authorization grant for its authenticated session.
      return {
        authCode: code,
        redirectUri: transaction.redirectUri,
        codeVerifier: transaction.codeVerifier,
        nonce: transaction.nonce
      };
    }

    async function redirectToOkta () {
      onStatus('Redirecting to Okta…');

      const transaction = {
        codeVerifier: randomValue(64),
        state: randomValue(32),
        nonce: randomValue(32),
        redirectUri
      };

      window.sessionStorage.setItem(
        TRANSACTION_KEY,
        JSON.stringify(transaction)
      );

      const authorizeUrl = new URL(authorizationEndpoint);
      authorizeUrl.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        response_mode: 'query',
        scope: scopes.join(' '),
        state: transaction.state,
        nonce: transaction.nonce,
        code_challenge: await createCodeChallenge(transaction.codeVerifier),
        code_challenge_method: 'S256'
      }).toString();

      window.location.assign(authorizeUrl);
    }

    async function getAuthCode () {
      try {
        const callbackGrant = readCallback();
        if (callbackGrant) {
          return callbackGrant;
        }

        await redirectToOkta();

        // Navigation replaces this page. Keep Genesys waiting instead of
        // returning an empty grant before the browser leaves.
        return new Promise(() => {});
      } catch (error) {
        onError(error);
        throw error;
      }
    }

    return {
      getAuthCode,
      reAuthenticate: redirectToOkta
    };
  };
}());
