
const authClient = new window.ConversalyseAuth.Client({
  endpoint: 'https://communal-foal-59.clerk.accounts.dev',
  appId: 'nMz5wSoIBw6NSCxG'
});

const currentAwaitedResolvers = [];
async function signIn () {
  /**
   * @type {import('@convnersalyse-auth/browser').SignInOptions}
   */
  const options = {
    redirectUri: window.location.origin + window.location.pathname
  };
  if (await authClient.isAuthenticated()) {
    // options.prompt = window.ConversalyseAuth.Prompt.None;
    options.clearTokens = false;
    options.extraParams = {
      oidcPrompt: 'none'
    };
  } else {
    options.prompt = window.ConversalyseAuth.Prompt.Consent;
  }
  await authClient.signIn(options);
}
async function signOut () {
  window.Genesys('command', 'Auth.logout');
  await new Promise((resolve) => setTimeout(resolve, 2500));
  await authClient.signOut();
}
window.signIn = signIn;
window.signOut = signOut;
function flushResolvers (data) {
  while (currentAwaitedResolvers.length) {
    const resolve = currentAwaitedResolvers.pop();
    resolve(data);
  }
}
async function checkAuthentication () {
  const auth = await authClient.isAuthenticated();
  if (!auth && await authClient.isCallbackSignInRedirected(window.location.href)) {
    await authClient.handleSignInCallback(window.location.href);
    authClient.stripQueryParams(['code', 'state'], { preserveHash: true });
    return authClient.isAuthenticated();
  } else if (!auth) {
    return false;
  }
  return true;
}
/**
 * @type {Awaited<ReturnType<import('@convnersalyse-auth/browser').Client['getCodeAndStateFromCallbackUri']>> | null}
 */
let codeAndState = null;
async function getCode () {
  if (codeAndState) {
    return codeAndState;
  }
  if (!await authClient.isCallbackSignInRedirected(window.location.href)) return null;
  codeAndState = await authClient.getCodeAndStateFromCallbackUri(window.location.href);
  authClient.stripQueryParams(['code', 'state'], { preserveHash: true });
  return codeAndState;
}

async function getIsAuthorizedWithCode () {
  const codeAndState = await getCode();
  if (!codeAndState) {
    return;
  }
  const resolvedData = {
    redirectUri: window.location.origin + window.location.pathname,
    authCode: codeAndState.code,
    codeVerifier: codeAndState.codeVerifier
  };
  flushResolvers(resolvedData);
  return resolvedData;
}
async function registerGenesysAuthPlugin () {
  const isAuthenticated = await checkAuthentication();
  if (!isAuthenticated) {
    return false;
  }
  window.Genesys('registerPlugin', 'AuthProvider', (AuthProvider) => {
    // COMMAND
    // *********
    // getAuthCode
    // reAuthenticate
    // signIn

    // EVENTS
    // *********
    // signedIn
    // signInFailed

    /* Register Command - mandatory */

    AuthProvider.registerCommand('getAuthCode', async (e) => {
      console.log('[ve-conversalyse-plugin] Get Auth Code command called', e);
      // Add the necessary logic and resolve with the authCode and redirectUri provided by your Authentication provider. Messenger will call this command to get the the tokens.
      currentAwaitedResolvers.push(e.resolve);
      const authenticatedCode = await getIsAuthorizedWithCode();
      if (!authenticatedCode) {
        await signIn();
      }
      // if (data) {
      //   e.resolve(data);
      //   return;
      // }
      // e.resolve(
      // {
      // authCode: <brand auth code>,       // pass your authorization code here
      // redirectUri: <your redirect uri>,  // pass the redirection URI configured in your Authentication provider here
      // nonce: <your nonce>,               // pass the random string preferably in uuid format. Applicable for OKTA provider.
      // maxAge: <your maxAge>,             // pass elapsed time in seconds. Applicable for OKTA provider and it is an optional parameter.
      // codeVerifier: <your code verifier> // pass your code verifier here when PKCE flow is enabled
      // iss: <your iss>,                   // pass your iss here. It is an optional parameter provided in the authorization response by your Authentication provider.
      // }
      // );
    });

    AuthProvider.registerCommand('reAuthenticate', async (e) => {
      console.log('[ve-conversalyse-plugin] Re-authenticate command called');
      // Messenger will call this command when current refreshToken and/or authCode are no more valid.
      // Brand can add logic here to simply re-login and resolve this command after successful login so that Messenger can get the new authCode.
      // In case when browser needs to reload for a login, there is no need to resolve this command with the data.
      // Note: After a successful re-login, calling the getAuthCode command is taken care internally and there is no need to call it explicitly again.
      const data = await getIsAuthorizedWithCode();
      if (data) {
        e.resolve(data);
      } else {
        // when a page reload is required for authentication, you can resolve without the data here but your 'AuthProvider.getAuthCode' command must resolve with the data since Messenger will get it from there upon page reload.

        authClient.signIn({
          redirectUri: window.location.href,
          search: '?sss=123'
        });
        e.resolve();
      }
    });

    /* Register Command - optional */

    AuthProvider.registerCommand('signIn', async (e) => {
      console.log('[ve-conversalyse-plugin] Sign-in command called');
      // This command will let Messenger know that the user is not signed-in yet (although Messenger is initialized) and it can now try to sign-in later.
      // Write your logic here to trigger the login process by gathering the user credentials from your preferred location.
      // Messenger calls this command when Step-up conversation is enabled.
      const data = await getIsAuthorizedWithCode();
      if (data) {
        AuthProvider.publish('signedIn', data); // REQUIRED event {authCode: xxx, ...} to let Auth plugin know so it can re-initialize Messenger with authenticated details.

        e.resolve(data); // where 'data' is as discussed in the return data section here - https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/authProviderPlugin#authprovider-signin
      } else {
        AuthProvider.publish('signInFailed', new Error('Sign-in failed')); // REQUIRED event to let Messenger know that sign-in failed so it can reset its UI state.
      }
    });

    /* Subscribe to Auth plugin events */

    AuthProvider.subscribe('Auth.loggedOut', () => {
      console.log('[ve-conversalyse-plugin] User logged out');
      // This event is published across the browser tabs/devices where the user is logged in, so you can do something on logout.
      // For example, clear any authenticated flags that you might have set during login.
    });

    /* Subscribe to Auth plugin events - optional */

    AuthProvider.subscribe('Auth.authError', (error) => {
      console.error('[ve-conversalyse-plugin] Auth error:', error);
      // This event is published across the browser tabs/devices where the user is logged in, so you can do something on logout.
      // For example, clear any authenticated flags that you might have set during login.
    });

    /* Click Handlers */

    // Handle logout
    //   document.getElementById('myButton').onclick = function () {
    //     AuthProvider.command('Auth.logout').then(() => {
    //       // Do something on logout.
    //       // For example, clear any authenticated flags that you might have set on login
    //     });
    //   };

    // Tell Messenger that your plugin is ready (mandatory)
    AuthProvider.ready();
  });
  return true;
}
window.registerGenesysAuthPlugin = registerGenesysAuthPlugin;
