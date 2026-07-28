(function () {
  const OKTA_CONFIG = {
    authorizationEndpoint: 'https://integrator-6759517.okta.com/oauth2/v1/authorize',
    clientId: '0oa15o173k3Po5MRM698',
    scopes: ['openid', 'profile', 'email']
  };

  // Register ./callback.html as a Sign-in redirect URI in Okta.
  const CALLBACK_MESSAGE = 'videoengager:okta-callback';
  const POPUP_NAME = 'videoengager-okta-auth';
  const AUTH_TIMEOUT_MS = 5 * 60 * 1000;
  const grantResolvers = [];
  const signInButton = document.getElementById('signIn');
  const statusElement = document.getElementById('status');

  let activeRequest;

  function setStatus (message, isError = false) {
    statusElement.textContent = message;
    statusElement.dataset.error = String(isError);
  }

  function base64Url (bytes) {
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function randomValue (byteLength) {
    return base64Url(window.crypto.getRandomValues(new Uint8Array(byteLength)));
  }

  async function createCodeChallenge (codeVerifier) {
    const digest = await window.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(codeVerifier)
    );
    return base64Url(new Uint8Array(digest));
  }

  async function runAuthentication (popup) {
    if (!window.crypto?.subtle) {
      popup.close();
      throw new Error('Okta PKCE requires HTTPS or localhost.');
    }

    const redirectUri = new URL('./auth/callback.html', window.location.href).href;
    const codeVerifier = randomValue(64);
    const state = randomValue(32);
    const nonce = randomValue(32);
    const authorizeUrl = new URL(OKTA_CONFIG.authorizationEndpoint);

    authorizeUrl.search = new URLSearchParams({
      client_id: OKTA_CONFIG.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      response_mode: 'query',
      scope: OKTA_CONFIG.scopes.join(' '),
      state,
      nonce,
      code_challenge: await createCodeChallenge(codeVerifier),
      code_challenge_method: 'S256'
    }).toString();

    return new Promise((resolve, reject) => {
      let finished = false;

      const cleanup = () => {
        window.removeEventListener('message', onMessage);
        window.clearInterval(closedTimer);
        window.clearTimeout(timeoutTimer);
      };

      const finish = (error, grant) => {
        if (finished) {
          return;
        }
        finished = true;
        cleanup();
        if (!popup.closed) {
          popup.close();
        }
        error ? reject(error) : resolve(grant);
      };

      const onMessage = (event) => {
        if (event.origin !== window.location.origin ||
            event.source !== popup ||
            event.data?.type !== CALLBACK_MESSAGE) {
          return;
        }

        if (event.data.state !== state) {
          finish(new Error('Okta callback state is missing or invalid.'));
        } else if (event.data.error) {
          finish(new Error(`Okta sign-in failed: ${event.data.errorDescription || event.data.error}`));
        } else if (!event.data.code) {
          finish(new Error('Okta did not return an authorization code.'));
        } else {
          finish(null, {
            authCode: event.data.code,
            redirectUri,
            codeVerifier,
            nonce
          });
        }
      };

      const closedTimer = window.setInterval(() => {
        if (popup.closed) {
          finish(new Error('Okta sign-in was cancelled.'));
        }
      }, 250);

      const timeoutTimer = window.setTimeout(() => {
        finish(new Error('Okta sign-in timed out.'));
      }, AUTH_TIMEOUT_MS);

      window.addEventListener('message', onMessage);

      try {
        popup.location.replace(authorizeUrl.href);
      } catch (error) {
        finish(error);
      }
    });
  }

  function authenticate () {
    if (activeRequest) {
      if (!activeRequest.popup.closed) {
        activeRequest.popup.focus();
      }
      return activeRequest.promise;
    }

    // This runs directly from the button click so popup blockers allow it.
    const popup = window.open(
      './auth/callback.html?pending=1',
      POPUP_NAME,
      'popup,width=500,height=700'
    );
    if (!popup) {
      return Promise.reject(new Error('The Okta sign-in popup was blocked.'));
    }

    const promise = runAuthentication(popup).finally(() => {
      if (activeRequest?.promise === promise) {
        activeRequest = null;
      }
    });
    activeRequest = { popup, promise };
    return promise;
  }

  function requestGrant () {
    signInButton.hidden = false;
    signInButton.disabled = false;
    signInButton.textContent = grantResolvers.length ? 'Sign in again' : 'Sign in with Okta';
    setStatus('Sign in with Okta to continue.');

    return new Promise((resolve) => grantResolvers.push(resolve));
  }

  signInButton.addEventListener('click', async () => {
    signInButton.disabled = true;
    setStatus('Waiting for Okta sign-in…');

    try {
      const grant = await authenticate();
      const resolve = grantResolvers.shift();
      if (!resolve) {
        throw new Error('Genesys did not request an authentication grant.');
      }

      resolve(grant);
      if (grantResolvers.length) {
        signInButton.disabled = false;
        setStatus('Another fresh Okta sign-in is required.');
      } else {
        signInButton.hidden = true;
        setStatus('Completing Genesys authentication…');
      }
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : 'Okta sign-in failed.', true);
      signInButton.disabled = false;
    }
  });

  window.OktaAuthProvider = Object.freeze({
    getAuthCode: requestGrant,
    reAuthenticate: requestGrant
  });
})();
