import { init, isOnQueue, isOnline, getReceivedCalls, on, switchQueue, rejectCall, acceptCall, endCall } from 'https://cdn.jsdelivr.net/npm/videoengager-agent-sdk@latest/+esm';
import * as UI from './ui-handler.mjs';

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
async function initializeAgent (config) {
  try {
    UI.setConnectButtonState(true);

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

    // Initialize status
    isAgentOnline = isOnline();
    UI.updateConnectionStatus(isAgentOnline);
    UI.updateQueueStatus(isOnQueue(), isAgentOnline);
    UI.renderCalls(getReceivedCalls());
  } catch (error) {
    console.error('Failed to initialize agent:', error);
    UI.showError('Failed to connect: ' + error.message);
    UI.setConnectButtonState(false);
  }
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================
function setupEventListeners () {
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
    UI.renderCalls(getReceivedCalls());
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
async function toggleQueue () {
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
async function acceptCallCallback (callerId) {
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
async function rejectCallCallback (callerId) {
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
async function endCallCallback () {
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

// Configuration form submission
UI.elements.configForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const config = UI.getConfigFormValues();
  initializeAgent(config);
});

// Queue toggle button
UI.elements.queueToggle?.addEventListener('click', toggleQueue);

// End call button
UI.elements.endCallBtn?.addEventListener('click', endCallCallback);

// ============================================
// GLOBAL FUNCTIONS (for inline onclick handlers)
// ============================================
window.acceptCall = acceptCallCallback;
window.rejectCall = rejectCallCallback;
