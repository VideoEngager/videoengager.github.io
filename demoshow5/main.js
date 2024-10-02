import {
  sendStartVideoSessionMessage,
  sendStopVideoSessionMessage,
  registerGenesysDisconnectListeners,
  initializeMessengerService,
  loadGenesysMessengerLibrary
} from './genesysMessengerIntegration.js';
import { startVideo, getGuid } from './videoengagerHelper.js';
import { IframeManager } from './iframeManager.js';
import { VideoSessionStateMachine } from './videoSessionStateMachine.js';

const config = {
  staging: {
    envUrl: 'https://apps.mypurecloud.de',
    environment: 'prod-euc1',
    deploymentId: 'a3201abf-c4bc-4742-8bd0-b55c34ef787d',
    veUrl: 'https://staging.leadsecure.com',
    tenantId: 'oIiTR2XQIkb7p0ub'
  }
};

document.addEventListener('DOMContentLoaded', async function () {
  const { envUrl, environment, deploymentId, veUrl, tenantId } = config.staging;

  const startVideoButton = document.querySelector('#StartVideoCall');
  const stopVideoButton = document.querySelector('#StopVideoCall');
  const iframeContainer = document.querySelector('#iframe-container');

  const iframeManager = new IframeManager();
  const videoSessionStateMachine = new VideoSessionStateMachine({
    startVideoCallback: sendStartVideoSessionMessage,
    stopVideoCallback: sendStopVideoSessionMessage
  });

  // Load Genesys Library if not loaded
  loadGenesysMessengerLibrary({ environment, deploymentId, envUrl, debug: true });

  // Handle start and stop video session button clicks
  startVideoButton.addEventListener('click', () => {
    handleStartVideoSession({ TENANT_ID: tenantId, veUrl });
  });
  stopVideoButton.addEventListener('click', () => {
    handleStopVideoSession();
  });

  // handle on window close events
  window.onbeforeunload = async () => {
    handleStopVideoSession();
  };
  window.addEventListener('message', async (e) => {
    if (e.data.type === 'popupClosed') {
      console.log('VideoEngagerWidget: popupClosed');
      handleStopVideoSession();
    }
    if (e.data.type === 'callEnded') {
      console.log('VideoEngagerWidget: callEnded');
      handleStopVideoSession();
    }
  });

  // wait for messenger library and messging service library initialization
  initializeMessengerService()
    .then(function () {
      videoSessionStateMachine.signal('MESSENGER_INITIALIZED');
    }).catch(function (e) {
      console.error('Canont initialize messenger', e);
    });

  // Register Genesys disconect event listeners
  registerGenesysDisconnectListeners(function (sendMessage) {
    handleStopVideoSession({ sendMessage });
  });

  // Functions to start and stop the video session
  async function handleStartVideoSession ({ TENANT_ID, veUrl }) {
    // UI
    startVideoButton.style.display = 'none';
    stopVideoButton.style.display = 'block';
    // VideoEngager
    const interactionId = getGuid();
    const iframeInstance = startVideo({ interactionId, autoAccept: true, customAttributes: null, startWithVideo: true }, { TENANT_ID, veUrl });
    iframeManager.setIframe({ iframe: iframeInstance, iframeContainer });
    // Set State
    videoSessionStateMachine.signal('START_SESSION_REQUEST', { interactionId });
  }

  // Functions to start and stop the video session
  async function handleStopVideoSession ({ sendMessage = true } = {}) {
  // UI
    startVideoButton.style.display = 'block';
    stopVideoButton.style.display = 'none';
    iframeManager.close();
    // Set State
    videoSessionStateMachine.signal('STOP_SESSION_REQUEST', { sendMessage });
  }
});
