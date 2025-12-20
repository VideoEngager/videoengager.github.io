import * as UI from './ui-handler.mjs';
import { init, isOnQueue, isOnline, getReceivedCalls, on, switchQueue, rejectCall, acceptCall, endCall } from 'https://cdn.jsdelivr.net/npm/videoengager-agent-sdk@latest/+esm';

/**
 * Main Application Logic
 * Handles VideoEngager Agent SDK integration and business logic
 */

// ============================================
// STATE
// ============================================
let isAgentOnline = false;

// ============================================
// AGENT SDK INITIALIZATION
// ============================================
async function initializeAgent(config) {
  try {
    UI.setStartAgentButtonState(true, 'Connecting...');

    await init({
      authMethod: 'generic',
      apiKey: config.apiKey,
      domain: config.domain,
      agentEmail: config.agentEmail,
      organizationId: config.organizationId,
      externalId: config.externalId,
      standaloneMode: true,
      logger: true,
      options: {
        containerId: 've-agent-container'
      }
    });

    // Set up event listeners
    setupEventListeners();

    // Show dashboard
    UI.showDashboard();
    UI.showAgentDashboardContent();

    // Initialize status
    isAgentOnline = isOnline();
    UI.updateConnectionStatus(isAgentOnline);
    UI.updateQueueStatus(isOnQueue(), isAgentOnline);
    UI.renderCalls(getReceivedCalls());

    // Start dashboard tour if available
    if (typeof window.startAgentDashboardTour === 'function') {
      setTimeout(() => {
        window.startAgentDashboardTour();
      }, 500);
    }
  } catch (error) {
    console.error('Failed to initialize agent:', error);
    UI.showError('Failed to connect: ' + error.message);
    UI.setStartAgentButtonState(false);
  }
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================
function setupEventListeners() {
  // Connection status changes
  on('isOnline', (online) => {
    isAgentOnline = online;
    UI.updateConnectionStatus(online);
    UI.updateQueueStatus(isOnQueue(), isAgentOnline);

    if (!online) {
      UI.showError('Connection lost - attempting to reconnect...');
    }
  });

  // Queue status changes
  on('inCallsQueue', (inQueue) => {
    UI.updateQueueStatus(inQueue, isAgentOnline);
    UI.updateQueueToggleVisual(inQueue);
  });

  // Incoming call received
  on('incomingCall', () => {
    const calls = getReceivedCalls();
    console.log('📞 Incoming call event. Total calls:', calls.length);
    UI.renderCalls(calls);

    // Show first call tour if this is the first call and tour function exists
    if (calls.length === 1) {
      console.log('🎯 First call detected!');
      if (typeof window.startFirstCallTour === 'function') {
        console.log('✅ Calling startFirstCallTour with callerId:', calls[0].caller.id);
        window.startFirstCallTour(calls[0].caller.id);
      } else {
        console.log('❌ window.startFirstCallTour is not a function');
      }
    }
  });

  // Call removed from queue
  on('callRemoved', () => {
    UI.renderCalls(getReceivedCalls());
  });

  // Iframe opened/closed (call UI shown/hidden)
  on('iframeStateChanged', (isIframeOpen) => {
    UI.toggleCallControls(isIframeOpen);
  });
}

// ============================================
// BUSINESS LOGIC FUNCTIONS
// ============================================

/**
 * Toggle agent's queue status
 */
async function toggleQueue() {
  // Check if agent is online before allowing queue toggle
  if (!isAgentOnline) {
    UI.showError('Cannot toggle queue: Agent is offline');
    return;
  }

  try {
    UI.setQueueTogglePointerEvents(false);
    await switchQueue();
    UI.setQueueTogglePointerEvents(true);
  } catch (error) {
    console.error('Failed to toggle queue:', error);
    UI.showError('Failed to toggle queue: ' + error.message);
    UI.setQueueTogglePointerEvents(true);
  }
}

/**
 * Accept incoming call
 * @param {string} callerId - ID of the caller
 */
async function acceptCallCallback(callerId) {
  try {
    UI.setCallButtonsState(callerId, true);
    await acceptCall(callerId);
  } catch (error) {
    console.error('Failed to accept call:', error);
    UI.showError('Failed to accept call: ' + error.message);
    UI.setCallButtonsState(callerId, false);
  }
}

/**
 * Reject incoming call
 * @param {string} callerId - ID of the caller
 */
async function rejectCallCallback(callerId) {
  try {
    UI.setCallButtonsState(callerId, true);
    await rejectCall(callerId);
  } catch (error) {
    console.error('Failed to reject call:', error);
    UI.showError('Failed to reject call: ' + error.message);
    UI.setCallButtonsState(callerId, false);
  }
}

/**
 * End active call
 */
async function endCallCallback() {
  try {
    UI.setEndCallButtonState(true);
    await endCall();
    UI.setEndCallButtonState(false);
  } catch (error) {
    console.error('Failed to end call:', error);
    UI.showError('Failed to end call: ' + error.message);
    UI.setEndCallButtonState(false);
  }
}

// ============================================
// EVENT LISTENERS - USER INTERACTIONS
// ============================================

// Configuration form submission (kept for backward compatibility)
UI.elements.configForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const config = UI.getConfigFormValues();
  initializeAgent(config);
});

// Start agent button
UI.elements.startAgentBtn?.addEventListener('click', async () => {
  const urlConfig = getConfigFromURL();
  if (urlConfig) {
    const agentEmail = UI.getAgentEmail();
    if (agentEmail) {
      urlConfig.agentEmail = agentEmail;
      await initializeAgent(urlConfig);
    }
  }
});

// Queue toggle button
UI.elements.queueToggle?.addEventListener('click', toggleQueue);

// End call button
UI.elements.endCallBtn?.addEventListener('click', endCallCallback);

// ============================================
// AUTO-INITIALIZATION FROM URL PARAMETERS
// ============================================

/**
 * Get configuration from URL query parameters
 * @returns {Object|null} Configuration object or null if parameters are missing
 */
function getConfigFromURL() {
  const params = new URLSearchParams(window.location.search);

  const config = {
    domain: params.get('domain'),
    apiKey: params.get('apiKey'),
    agentEmail: params.get('agentEmail'),
    organizationId: params.get('organizationId'),
    externalId: params.get('externalId')
  };

  // Check if all required parameters are present (except agentEmail which user will enter)
  if (config.domain && config.apiKey &&
    config.organizationId && config.externalId) {
    return config;
  }

  return null;
}

// Check if configuration is provided in URL
const urlConfig = getConfigFromURL();
if (urlConfig) {
  // Pre-fill agent email if provided
  if (urlConfig.agentEmail) {
    UI.setAgentEmail(urlConfig.agentEmail);
  }
  // Enable start button - user must click to start
  UI.setStartAgentButtonState(false);
} else {
  console.warn('No configuration found in URL parameters. Please configure the agent from the main page.');
  UI.showError('Missing configuration. Please return to the main page to configure.');
}

// ============================================
// GLOBAL FUNCTIONS (for inline onclick handlers)
// ============================================
window.acceptCall = acceptCallCallback;
window.rejectCall = rejectCallCallback;
