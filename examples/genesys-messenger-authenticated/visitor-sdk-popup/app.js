async function initialize () {
  // STEP 1: Get the Visitor SDK classes loaded by main.umd.js.
  const { GenesysIntegration, VideoEngagerCore } = window.VideoEngager || {};
  if (!GenesysIntegration || !VideoEngagerCore) {
    throw new Error('main.umd.js did not expose window.VideoEngager.');
  }
  if (!window.OktaAuthProvider) {
    throw new Error('The Okta auth provider did not load.');
  }

  // STEP 2: Create the VideoEngager visitor.
  videoEngager = new VideoEngagerCore({
    ...VIDEOENGAGER_CONFIG,
    logger: true
  });

  // STEP 3: Create Genesys with the provider supplied by auth/.
  const genesys = new GenesysIntegration({
    ...GENESYS_CONFIG,
    logger: true,
    authProvider: window.OktaAuthProvider
  });

  // STEP 4: Wait until Genesys confirms that authentication is complete.
  await videoEngager.setContactCenterIntegration(genesys);

  // STEP 5: Allow interactions only after initialization is ready.
  setStatus('Authenticated and ready.');
  startButton.disabled = false;
}

document.getElementById('startInteraction').addEventListener('click', async () => {
  startButton.disabled = true;
  setStatus('Starting video interaction…');

  try {
    await videoEngager.startVideoEngagerInteraction({
      bindToOrStartContactCenterInteraction: true
    });

    setStatus('Video interaction started.');
  } catch (error) {
    console.error(error);
    setStatus(error instanceof Error ? error.message : 'Could not start the interaction.', true);
    startButton.disabled = false;
  }
});

const GENESYS_CONFIG = {
  domain: 'mypurecloud.com',
  deploymentId: 'c7387131-f85e-478e-b2f2-14e4a5ec9dbb'
};

const VIDEOENGAGER_CONFIG = {
  veEnv: 'videome.leadsecure.com',
  tenantId: '0FphTk091nt7G1W7'
};

const statusElement = document.getElementById('status');
const startButton = document.getElementById('startInteraction');

let videoEngager;

function setStatus (message, isError = false) {
  statusElement.textContent = message;
  statusElement.dataset.error = String(isError);
}

initialize().catch((error) => {
  console.error(error);
  setStatus(error instanceof Error ? error.message : 'Initialization failed.', true);
});
