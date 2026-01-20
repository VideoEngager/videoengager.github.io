import * as UI from './ui-handler.mjs';

// ============================================
// VISITOR INITIALIZATION
// ============================================
function initializeVisitor (config) {
  const videoEngagerInstance = new window.VideoEngager.VideoEngagerCore({
    veHttps: true,
    veEnv: config.domain,
    tenantId: config.tenantId,
    logger: true,
    enableVeIframeCommands: config.customizedUI
  });

  videoEngagerInstance.setUiCallbacks({
    getIframeInstance,
    createIframe,
    destroyIframe
  });

  async function startCall () {
    try {
      UI.setStartCallButtonState(true, 'Starting...');
      UI.updateStatus('Preparing call...', 'yellow');

      const visitorName = UI.getVisitorName();
      const { interactionId, visitorUrl } = await prepareVisitorOutboundInteraction(config);

      const visitorUrlObj = new URL(visitorUrl, `https://${config.domain}`);
      if (visitorName) {
        visitorUrlObj.searchParams.set('name', visitorName);
      }
      if (config.customCssGuid) {
        visitorUrlObj.searchParams.set('csg', config.customCssGuid);
      }

      videoEngagerInstance.setPreparePopupHtmlUrlFn(() => visitorUrlObj.toString());

      await videoEngagerInstance.startVideoEngagerInteraction({
        callConfigs: {
          interactionId
        }
      });

      UI.showActiveCall();
    } catch (error) {
      console.error('Failed to start call:', error);
      UI.showError('Failed to start call: ' + error.message);
      UI.setStartCallButtonState(false);
      UI.updateStatus('Ready', 'green');
    }
  }

  async function endCall () {
    try {
      UI.setEndCallButtonState(true);
      await videoEngagerInstance.endVideoEngagerInteraction();
      UI.showStartCall();
      UI.setStartCallButtonState(false);
      UI.setEndCallButtonState(false);
    } catch (error) {
      console.error('Failed to end call:', error);
      UI.showError('Failed to end call: ' + error.message);
      UI.setEndCallButtonState(false);
    }
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  UI.elements.startCallBtn.disabled = false;
  UI.elements.startCallBtn.addEventListener('click', startCall);
  UI.elements.endCallBtn.addEventListener('click', endCall);

  videoEngagerInstance.on('videoEngager:call-state-changed', (callState) => {
    console.log('Call state changed:', callState);

    // Update UI based on call state
    if (callState === 'connected') {
      UI.updateStatus('Connected', 'green');
    } else if (callState === 'disconnected' || callState === 'ended') {
      UI.showStartCall();
      UI.setStartCallButtonState(false);
    } else if (callState === 'connecting') {
      UI.updateStatus('Connecting...', 'yellow');
    }
  });

  videoEngagerInstance.on('videoEngager:active-ve-instance', (veInstance) => {
    console.log('VE instance state:', veInstance ? 'opened' : 'closed');

    // Iframe opened/closed
    if (!veInstance) {
      // Iframe closed - return to start call view
      UI.showStartCall();
      UI.setStartCallButtonState(false);
      UI.hideCustomControls();
    }
  });

  // ============================================
  // CUSTOM CONTROLS (only when customizedUI is enabled)
  // ============================================
  if (!config.customizedUI) {
    UI.hideCustomControls();
  }

  videoEngagerInstance.on('videoEngager:iframe-connected', (state) => {
    console.log('Iframe ready, initial state:', state);
    if (config.customizedUI) UI.showCustomControls();
    UI.updateCustomControlsState(state);
  });

  videoEngagerInstance.on('videoEngager:iframe-video-state-changed', (state) => {
    console.log('Video state changed:', state);
    UI.updateCustomControlsState(state);
  });

  UI.elements.muteBtn.addEventListener('click', async () => {
    try {
      await videoEngagerInstance.executeVideoCallFn('triggerMuteUnmute');
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  });

  UI.elements.videoBtn.addEventListener('click', async () => {
    try {
      await videoEngagerInstance.executeVideoCallFn('triggerShowHideVideo');
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  });

  UI.elements.screenBtn.addEventListener('click', async () => {
    try {
      await videoEngagerInstance.executeVideoCallFn('triggerScreenShare');
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  });

  UI.elements.cameraSwitchBtn.addEventListener('click', async () => {
    try {
      await videoEngagerInstance.executeVideoCallFn('triggerCameraSwitch');
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  });

  UI.elements.hangupBtn.addEventListener('click', async () => {
    try {
      await videoEngagerInstance.executeVideoCallFn('triggerHangup');
    } catch (error) {
      console.error('Failed to hang up:', error);
    }
  });
}

// ============================================
// API FUNCTIONS
// ============================================
/**
 * Create a video call interaction via REST API
 * @param {Object} config - Configuration object
 * @see {@link https://api.videoengager.com/interactions_api?route=%2Finteractions_api#tag/interactions/POST/api/interactions/tenants/%7BtenantId%7D/interactions}
 * @returns {Promise<Object>} API response with interaction details
 */
async function prepareVisitorOutboundInteraction (config) {
  const resp = await fetch(`https://${config.domain}/api/interactions/tenants/${config.tenantId}/interactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: 'OUTBOUND' })
  });
  const data = await resp.json();
  console.log('Outbound interaction created', data);
  return {
    visitorUrl: data.visitor.fullUrl,
    interactionId: data.interactionId
  };
}

// ============================================
// AUTO-INITIALIZATION FROM URL PARAMETERS
// ============================================

/**
 * Get configuration from URL query parameters
 * @returns {Object|null} Configuration object or null if parameters are missing
 */
function getConfigFromURL () {
  const params = new URLSearchParams(window.location.search);

  const config = {
    domain: params.get('domain'),
    tenantId: params.get('tenantId'),
    customizedUI: params.get('customizedUI') === 'true',
    customCssGuid: params.get('customCssGuid') || ''
  };

  // Check if all required parameters are present
  if (config.domain && config.tenantId) {
    return config;
  }

  return null;
}

// ============================================
// IFRAME MANAGEMENT
// ============================================
let iframeInstance = null;

function getIframeInstance () {
  return iframeInstance;
}

function createIframe (src) {
  const iframe = document.createElement('iframe');
  iframe.className = 'video-engager-widget-iframe';
  iframe.allow = 'camera; microphone; display-capture; autoplay';
  iframe.src = src;
  UI.elements.veContainer.appendChild(iframe);
  iframeInstance = iframe;
  return iframe;
}

function destroyIframe () {
  if (iframeInstance) {
    iframeInstance.remove();
    iframeInstance = null;
  }
}

// Auto-initialize if configuration is provided in URL
const urlConfig = getConfigFromURL();
if (urlConfig) {
  initializeVisitor(urlConfig);
} else {
  console.warn('No configuration found in URL parameters. Please configure from the main page.');
  UI.showError('Missing configuration. Please return to the main page to configure.');
}
