async function initialize () {
  // Step 1: Validate the demo and load the browser globals.
  validateDemoConfiguration();

  const { GenesysIntegration, VideoEngagerCore } = window.VideoEngager || {};

  setStatus('Authenticating with Okta…');

  // Step 2: Create the Okta callbacks required by Genesys (OauthProvider may vary and is not implemented by VideoEngager).
  const authProvider = window.createOktaAuthProvider({
    ...CONFIG.okta,
    onStatus: setStatus,
    onError: (error) => showError(error, 'Okta sign-in failed.')
  });

  // Step 3: Create VideoEngager and GenesysIntegration instances.
  // The GenesysIntegration instance is configured with the Okta auth provider so it can handle the authentication flow.
  videoEngager = new VideoEngagerCore({
    ...CONFIG.videoEngager,
    logger: true
  });

  const genesys = new GenesysIntegration({
    ...CONFIG.genesys,
    logger: true, // Add oAuthProvider to GenesysIntegration so it can handle the authentication flow.
    authProvider: {
      getAuthCode: authProvider.getAuthCode,
      reAuthenticate: authProvider.reAuthenticate
    }
  });

  // Step 4: Keep the button disabled until Genesys authentication is ready.
  await videoEngager.setContactCenterIntegration(genesys);

  setStatus('Authenticated and ready.');
  startButton.disabled = false;
}

// Demo configuration. Replace these values when using another environment.
const CONFIG = {
  okta: {
    authorizationEndpoint: 'https://integrator-6759517.okta.com/oauth2/v1/authorize',
    clientId: '0oa15o173k3Po5MRM698',
    scopes: ['openid', 'profile', 'email']
  },
  genesys: {
    domain: 'mypurecloud.com',
    deploymentId: 'c7387131-f85e-478e-b2f2-14e4a5ec9dbb'
  },
  videoEngager: {
    veEnv: 'videome.leadsecure.com',
    tenantId: '0FphTk091nt7G1W7'
  }
};

const statusElement = document.getElementById('status');
const startButton = document.getElementById('startInteraction');

let videoEngager;

function setStatus (message, isError = false) {
  statusElement.textContent = message;
  statusElement.dataset.error = String(isError);
}

function showError (error, fallbackMessage) {
  console.error(error);
  setStatus(error instanceof Error ? error.message : fallbackMessage, true);
}

function validateDemoConfiguration () {
  const requiredValues = {
    'Genesys deployment ID': CONFIG.genesys.deploymentId,
    'VideoEngager tenant ID': CONFIG.videoEngager.tenantId
  };

  const missingValues = Object.entries(requiredValues)
    .filter(([, value]) => !value || value.includes('YOUR_'))
    .map(([name]) => name);

  if (missingValues.length) {
    throw new Error(`Update CONFIG in app.js: ${missingValues.join(', ')}.`);
  }
}

async function startInteraction () {
  startButton.disabled = true;
  setStatus('Starting video interaction…');

  try {
    await videoEngager.startVideoEngagerInteraction({
      bindToOrStartContactCenterInteraction: true
    });
    setStatus('Video interaction started.');
  } catch (error) {
    showError(error, 'Could not start the interaction.');
    startButton.disabled = false;
  }
}

startButton.addEventListener('click', startInteraction);

initialize().catch((error) => {
  showError(error, 'Initialization failed.');
});
