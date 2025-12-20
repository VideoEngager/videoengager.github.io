import * as UI from './ui-handler.mjs';

/**
 * Main Application Logic
 * Handles VideoEngager Visitor implementation via REST API
 */

// ============================================
// STATE
// ============================================
let iframe = null;

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Create a video call interaction via REST API
 * @param {Object} config - Configuration object
 * @see {@link https://api.videoengager.com/interactions_api?route=%2Finteractions_api#tag/interactions/POST/api/interactions/tenants/%7BtenantId%7D/interactions}
 * @returns {Promise<Object>} API response with interaction details
 */
async function createVideoCall(config) {
    try {
        const response = await fetch(`https://${config.domain}/api/interactions/tenants/${config.tenantId}/interactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: 'OUTBOUND' })
        });

        if (!response.ok) {
            throw new Error(`API Error ${response.status}`);
        }

        const data = await response.json();
        console.log('Call created successfully:', data);

        return data;
    } catch (error) {
        console.error('Failed to create call:', error);
        throw error;
    }
}

// ============================================
// IFRAME MANAGEMENT
// ============================================

/**
 * Create and display the VideoEngager iframe
 * @param {string} visitorUrl - The visitor URL to load in iframe
 * @param {string} visitorName - Optional visitor name
 */
function createCallIframe(visitorUrl, domain, visitorName) {
    // Clear previous iframe
    destroyIframe();

    // Build full URL with name parameter if provided
    const fullUrl = new URL(visitorUrl, `https://${domain}`);
    if (visitorName) {
        fullUrl.searchParams.set('name', visitorName);
    }

    // Create new iframe
    iframe = document.createElement('iframe');
    iframe.className = 'video-engager-iframe';
    iframe.src = fullUrl.toString();
    iframe.allow = 'camera; microphone; fullscreen; display-capture; autoplay';

    UI.elements.veContainer.appendChild(iframe);

    console.log('Call interface loaded:', fullUrl.toString());

    // Listen for iframe messages
    setupIframeMessageListener();
}

/**
 * Remove the iframe from DOM
 */
function destroyIframe() {
    if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
    }
    iframe = null;
}

// ============================================
// MESSAGE HANDLING
// ============================================

let messageListenerAdded = false;

/**
 * Setup listener for messages from VideoEngager iframe
 */
function setupIframeMessageListener() {
    if (messageListenerAdded) return;

    window.addEventListener('message', handleIframeMessage);
    messageListenerAdded = true;
}

/**
 * Handle messages from VideoEngager iframe
 * @param {MessageEvent} event - Message event from iframe
 */
function handleIframeMessage(event) {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    console.log('Iframe message:', data.type, data);

    switch (data.type) {
        case 'CallStarted':
            UI.updateStatus('Connected', 'green');
            console.log('Call connected with agent');
            break;

        case 'callEnded':
        case 'popupClosed':
            handleCallEnd();
            break;

        case 'RemoteVideoStarted':
            console.log('Agent video started');
            break;

        case 'RemoteVideoStopped':
            console.log('Agent video stopped');
            break;
    }
}

// ============================================
// CALL MANAGEMENT
// ============================================

/**
 * Start a video call
 */
async function startCall(config) {
    try {
        UI.setStartCallButtonState(true, 'Starting...');
        UI.updateStatus('Preparing call...', 'yellow');

        const visitorName = UI.getVisitorName();

        // Create the video call via API
        const response = await createVideoCall({
            domain: config.domain,
            tenantId: config.tenantId,
            visitorName
        });

        // Get visitor URL from response
        const visitorUrl = response.visitor?.fullUrl;
        if (!visitorUrl) {
            throw new Error('No visitor URL in API response');
        }

        console.log('Visitor URL:', visitorUrl);
        if (response.agent?.fullUrl) {
            console.log('Agent URL:', response.agent.fullUrl);
        }

        // Create and show iframe
        createCallIframe(visitorUrl, config.domain, visitorName);

        UI.showActiveCall();
        UI.updateStatus('Waiting for agent...', 'yellow');

    } catch (error) {
        console.error('Failed to start call:', error);
        UI.showError('Failed to start call: ' + error.message);
        UI.setStartCallButtonState(false);
        UI.updateStatus('Ready', 'green');
    }
}

/**
 * End the active call
 */
function endCall() {
    console.log('Ending call manually');
    handleCallEnd();
}

/**
 * Handle call ending (cleanup)
 */
function handleCallEnd() {
    destroyIframe();

    UI.showStartCall();
    UI.setStartCallButtonState(false);
    UI.updateStatus('Ready', 'green');

    console.log('Call ended - ready for new call');
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Get configuration from URL query parameters
 * @returns {Object|null} Configuration object or null if parameters are missing
 */
function getConfigFromURL() {
    const params = new URLSearchParams(window.location.search);

    const config = {
        domain: params.get('domain'),
        tenantId: params.get('tenantId')
    };

    // Check if all required parameters are present
    if (config.domain && config.tenantId) {
        return config;
    }

    return null;
}

// ============================================
// EVENT LISTENERS
// ============================================

// Check if configuration is provided in URL
const urlConfig = getConfigFromURL();
if (urlConfig) {
    // Enable start button
    UI.elements.startCallBtn.disabled = false;

    // Setup event listeners
    UI.elements.startCallBtn.addEventListener('click', () => startCall(urlConfig));
    UI.elements.endCallBtn.addEventListener('click', endCall);

    console.log('Visitor demo initialized with config:', urlConfig);
} else {
    console.warn('No configuration found in URL parameters. Please configure from the main page.');
    UI.showError('Missing configuration. Please return to the main page to configure.');
}
