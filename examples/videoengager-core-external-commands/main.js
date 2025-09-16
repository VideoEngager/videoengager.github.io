/**
 * VideoEngager Core - Custom Actions Example
 * Simple implementation using VideoEngager Core and GenesysIntegrationPureSocket
 * Based on GenesysIntegrationMockedNewUI pattern
 */

// Global variables
let videoEngagerInstance = null;
let genesysIntegration = null;
let isInitialized = false;
let config = {};

// DOM elements
const elements = {
  initBtn: null,
  startVideoBtn: null,
  endVideoBtn: null,
  initStatus: null,
  videoStatus: null,
  chatStatus: null,
  configDisplay: null,
  videoActionsSection: null,
  muteBtn: null,
  cameraBtn: null,
  screenBtn: null,
  switchBtn: null,
  muteIcon: null,
  cameraIcon: null,
  screenIcon: null,
  switchIcon: null
};

// Video state tracking
let videoState = {
  isMicOn: true,
  isVideoOn: true,
  isScreenSharing: false
};

/**
 * Initialize DOM elements and parse configuration
 */
function initializeApp () {
  // Get DOM elements
  Object.keys(elements).forEach(key => {
    elements[key] = document.getElementById(key);
  });

  // Parse configuration from URL parameters
  config = window.parseConfig();

  // Display configuration
  displayConfig();
}

/**
 * Display current configuration
 */
function displayConfig () {
  // user is allowed to override any of the following settings via URL parameters:
  // - tenantId
  // - veEnv
  // - veHttps
  // - environment
  // - deploymentId
  // - customerName
  // - customerEmail
  // - department
  // - debug
  // or predefined env:
  // - env=dev | prod | staging | prod-staging | prod-dev
  let configHtml = `
        <strong>VideoEngager:</strong> ${config.tenantId}@${config.veEnv} (HTTPS: ${config.veHttps})<br>
        <strong>Genesys:</strong> ${config.deploymentId}@${config.environment}<br>
        <strong>Customer:</strong> ${config.customerName} (${config.customerEmail})
        
    `;
    // add more details about how to override via URL parameters
  configHtml += '<br><br><em>- Override Configs via URL parameters: <br> <strong>?tenantId=...&veEnv=...&veHttps=...&environment=...&deploymentId=...&customerName=...&customerEmail=...&department=...&debug=...</strong></em>';
  configHtml += '<br><em>- Or use predefined env: <strong>?env=dev | prod | staging | prod-staging | prod-dev</strong></em>';

  elements.configDisplay.innerHTML = configHtml;
}

/**
 * Initialize VideoEngager Widget
 */
async function initializeWidget () {
  if (isInitialized) {
    return;
  }

  try {
    elements.initBtn.disabled = true;
    elements.initBtn.textContent = 'Initializing...';

    // Check if VideoEngager is available
    if (typeof window.VideoEngager === 'undefined') {
      throw new Error('VideoEngager library not found');
    }

    // Create Genesys integration
    genesysIntegration = new window.VideoEngager.GenesysIntegrationPureSocket({
      environment: config.environment,
      deploymentId: config.deploymentId,
      debug: config.debug
    });

    // Create VideoEngager Core instance
    videoEngagerInstance = new window.VideoEngager.VideoEngagerCore({
      tenantId: config.tenantId,
      veEnv: config.veEnv,
      veHttps: config.veHttps,
      enableVeIframeCommands: true
    });

    // Set up event listeners
    setupEventListeners();

    // Set up UI callbacks
    setupUiCallbacks();

    // Set contact center integration
    await videoEngagerInstance.setContactCenterIntegration(genesysIntegration);

    // Mark as initialized
    isInitialized = true;
    updateStatus('initStatus', 'active');

    // Enable buttons
    elements.startVideoBtn.disabled = false;

    // Update button text
    elements.initBtn.textContent = 'Initialized ✓';
  } catch (error) {
    console.error('Initialization failed:', error);
    elements.initBtn.disabled = false;
    elements.initBtn.textContent = 'Initialize VideoEngager';
    updateStatus('initStatus', 'error');
  }
}

/**
 * Set up event listeners for VideoEngager events
 */
function setupEventListeners () {
  // Video call events
  videoEngagerInstance.on('videoEngager:active-ve-instance', (hasActiveInstance) => {
    if (hasActiveInstance) {
      updateStatus('videoStatus', 'active');
      elements.startVideoBtn.disabled = true;
      elements.endVideoBtn.disabled = false;
      showVideoActions(true);
    } else {
      updateStatus('videoStatus', '');
      elements.startVideoBtn.disabled = false;
      elements.endVideoBtn.disabled = true;
      showVideoActions(false);
    }
  });

  // Integration session events
  videoEngagerInstance.on('integration:sessionStarted', () => {
    updateStatus('chatStatus', 'active');
  });

  videoEngagerInstance.on('integration:sessionEnded', () => {
    updateStatus('chatStatus', '');
  });

  // Video state changes
  videoEngagerInstance.on('videoEngager:iframe-video-state-changed', (newState) => {
    console.log('Video state changed:', newState);
    updateVideoState(newState);
  });

  // Error handling
  videoEngagerInstance.on('videoEngager:error', (error) => {
    console.error('VideoEngager error:', error);
    updateStatus('videoStatus', 'error');
  });
}
function createVeIframe () {
  const iframe = document.createElement('iframe');
  iframe.id = 'videoIframe';
  iframe.allow = 'microphone; camera; autoplay; display-capture';
  document.body.appendChild(iframe);
  return iframe;
}
function getVeIframe () {
  return document.getElementById('videoIframe');
}

/**
 * Set up UI callbacks for iframe management
 */
function setupUiCallbacks () {
  videoEngagerInstance.setUiCallbacks({
    createIframe: (src) => {
      const iframe = getVeIframe() || createVeIframe();
      iframe.src = src;
      iframe.classList.add('active');

      return new Promise((resolve) => {
        iframe.onload = () => {
          resolve();
        };
        // Fallback timeout
        setTimeout(resolve, 1000);
      });
    },

    getIframeInstance: () => {
      return getVeIframe();
    },

    destroyIframe: () => {
      const iframe = getVeIframe();
      if (iframe) {
        iframe.src = '';
        iframe.classList.remove('active');
      }
    },

    setIframeVisibility: (visible) => {
      const iframe = getVeIframe();
      if (visible && iframe) {
        iframe.classList.add('active');
      } else {
        iframe.classList.remove('active');
      }
    }
  });
}

/**
 * Start video call
 */
async function startVideo () {
  if (!isInitialized || !videoEngagerInstance) {
    console.error('Please initialize VideoEngager first');
    return;
  }

  try {
    // Prepare custom attributes
    const customAttributes = {
      'context.firstName': config.customerName.split(' ')[0],
      'context.lastName': config.customerName.split(' ').slice(1).join(' ') || 'Customer',
      'context.email': config.customerEmail,
      'context.department': config.department,
      'context.timestamp': new Date().toISOString()
    };

    // Configure video call settings
    const callConfigs = {
      autoAccept: true,
      firstMessage: `Video call requested by ${config.customerName}`
    };

    // Start video chat session
    await videoEngagerInstance.startVideoChatSession(callConfigs, customAttributes);
  } catch (error) {
    console.error('Failed to start video call:', error);
    updateStatus('videoStatus', 'error');
  }
}

/**
 * End video call
 */
async function endVideo () {
  if (!videoEngagerInstance) {
    return;
  }

  try {
    await videoEngagerInstance.endVideoChatSession();
  } catch (error) {
    console.error('Failed to end video call:', error);
  }
}

/**
 * Update status indicator
 */
function updateStatus (elementId, status) {
  const element = elements[elementId];
  if (!element) return;

  element.className = 'status-indicator';
  if (status) {
    element.classList.add(status);
  }
}

/**
 * Show/hide video action buttons
 */
function showVideoActions (show) {
  if (elements.videoActionsSection) {
    elements.videoActionsSection.style.display = show ? 'block' : 'none';
  }
}

/**
 * Update overlay button states
 */
function updateOverlayButtons () {
  const overlayMuteIcon = document.getElementById('overlayMuteIcon');
  const overlayCameraIcon = document.getElementById('overlayCameraIcon');
  const overlayScreenIcon = document.getElementById('overlayScreenIcon');

  if (overlayMuteIcon) {
    overlayMuteIcon.textContent = videoState.isMicOn ? '🎤' : '🔇';
  }

  if (overlayCameraIcon) {
    overlayCameraIcon.textContent = videoState.isVideoOn ? '📹' : '📷';
  }

  if (overlayScreenIcon) {
    overlayScreenIcon.textContent = videoState.isScreenSharing ? '🛑' : '🖥️';
  }
}

/**
 * Update video state and button appearances
 */
function updateVideoState (newState) {
  videoState = { ...videoState, ...newState };

  // Update mute button
  if (elements.muteIcon) {
    elements.muteIcon.textContent = videoState.isMicOn ? '🎤' : '🔇';
    elements.muteBtn.classList.toggle('muted', !videoState.isMicOn);
  }

  // Update camera button
  if (elements.cameraIcon) {
    elements.cameraIcon.textContent = videoState.isVideoOn ? '📹' : '📷';
    elements.cameraBtn.classList.toggle('active', !videoState.isVideoOn);
  }

  // Update screen share button
  if (elements.screenIcon) {
    elements.screenIcon.textContent = videoState.isScreenSharing ? '🛑' : '🖥️';
    elements.screenBtn.classList.toggle('active', videoState.isScreenSharing);
  }

  // Update overlay buttons if they exist
  updateOverlayButtons();
}

/**
 * Toggle microphone mute/unmute
 */
async function toggleMute () {
  if (!videoEngagerInstance) return;

  try {
    elements.muteBtn.disabled = true;
    await videoEngagerInstance.executeVideoCallFn('triggerMuteUnmute');
  } catch (error) {
    console.error('Failed to toggle mute:', error);
  } finally {
    elements.muteBtn.disabled = false;
  }
}

/**
 * Toggle camera on/off
 */
async function toggleCamera () {
  if (!videoEngagerInstance) return;

  try {
    elements.cameraBtn.disabled = true;
    await videoEngagerInstance.executeVideoCallFn('triggerShowHideVideo');
  } catch (error) {
    console.error('Failed to toggle camera:', error);
  } finally {
    elements.cameraBtn.disabled = false;
  }
}

/**
 * Toggle screen share
 */
async function toggleScreenShare () {
  if (!videoEngagerInstance) return;

  try {
    elements.screenBtn.disabled = true;
    await videoEngagerInstance.executeVideoCallFn('triggerScreenShare');
  } catch (error) {
    console.error('Failed to toggle screen share:', error);
  } finally {
    elements.screenBtn.disabled = false;
  }
}

/**
 * Switch camera (front/back)
 */
async function switchCamera () {
  if (!videoEngagerInstance) return;

  try {
    elements.switchBtn.disabled = true;
    await videoEngagerInstance.executeVideoCallFn('triggerCameraSwitch');
  } catch (error) {
    console.error('Failed to switch camera:', error);
  } finally {
    elements.switchBtn.disabled = false;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// Export functions to global scope for button onclick handlers
window.initializeWidget = initializeWidget;
window.startVideo = startVideo;
window.endVideo = endVideo;
window.toggleMute = toggleMute;
window.toggleCamera = toggleCamera;
window.toggleScreenShare = toggleScreenShare;
window.switchCamera = switchCamera;

// Debug helpers
window.getVideoEngagerInstance = () => videoEngagerInstance;
window.getGenesysIntegration = () => genesysIntegration;
window.getConfig = () => config;
window.getVideoState = () => videoState;
