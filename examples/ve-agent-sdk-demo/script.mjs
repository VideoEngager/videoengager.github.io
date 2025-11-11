/**
 * @fileoverview Simple VideoEngager Agent SDK Demo
 * This module demonstrates direct usage of the VideoEngager Agent SDK
 * 
 * @author VideoEngager Demo
 * @version 1.0.0
 */

const customUIHandlers = {
  openIframe: async (url, options) => {
    // Custom logic to open iframe in React/Vue/Angular etc.
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.setAttribute('allow', 'camera; microphone; clipboard-write; display-capture');
    
    const container = document.getElementById('video-container');
    container.appendChild(iframe);
  },
  
  closeIframe: async (options) => {
    // Custom logic to close iframe
    const container = document.getElementById('video-container');
    const iframe = container.querySelector('iframe');
    if (iframe) {
      iframe.remove();
    }
  },
  
  getIframe: (options) => {
    // Return the current iframe element
    const container = document.getElementById('video-container');
    return container.querySelector('iframe');
  }
};

/**
 * DOM element references for efficient access
 * @type {Object}
 */
const elements = {
    configForm: null,
    initBtn: null,
    startCallBtn: null,
    endCallBtn: null,
    clearLogBtn: null,
    statusDot: null,
    statusText: null,
    apiKeyInput: null,
    domainInput: null,
    agentEmailInput: null,
    organizationIdInput: null,
    customerIdInput: null,
    callInfo: null,
    eventLog: null,
    videoContainerText: null
};

/**
 * Application state
 * @type {Object}
 */
const state = {
    isSDKInitialized: false,
    isCallActive: false,
    currentCallState: null
};

/**
 * Initialize the application when DOM is loaded
 * Sets up all event listeners and prepares the UI
 */
async function initializeApp() {
    try {
        // Get DOM element references first
        getDOMReferences();
        
        logEvent('Application starting up...', 'info');
        
        // Load VideoEngager SDK from CDN
        await loadVideoEngagerSDK();
        
        // Set up event listeners
        setupEventListeners();
        
        logEvent('Application initialized successfully', 'success');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Try to log if elements are available, otherwise just show error
        if (elements.eventLog) {
            logEvent(`Failed to initialize application: ${error.message}`, 'error');
        }
        
        showError(`Application failed to start: ${error.message}`);
    }
}

/**
 * Get references to all DOM elements we need
 * Caches elements for efficient access throughout the app
 */
function getDOMReferences() {
    elements.configForm = document.getElementById('config-form');
    elements.initBtn = document.getElementById('init-btn');
    elements.startCallBtn = document.getElementById('start-call-btn');
    elements.endCallBtn = document.getElementById('end-call-btn');
    elements.clearLogBtn = document.getElementById('clear-log-btn');
    elements.statusDot = document.querySelector('.status-dot');
    elements.statusText = document.getElementById('status-text');
    elements.apiKeyInput = document.getElementById('api-key');
    elements.domainInput = document.getElementById('domain');
    elements.agentEmailInput = document.getElementById('agent-email');
    elements.organizationIdInput = document.getElementById('organization-id');
    elements.customerIdInput = document.getElementById('customer-id');
    elements.callInfo = document.getElementById('call-info');
    elements.eventLog = document.getElementById('event-log');
    elements.videoContainerText = document.getElementById('video-containet-text');
    
    // Verify all critical elements exist
    const criticalElements = [
        'configForm', 'initBtn', 'startCallBtn', 'endCallBtn', 'clearLogBtn',
        'statusDot', 'statusText', 'callInfo', 'eventLog'
    ];
    
    for (const elementName of criticalElements) {
        if (!elements[elementName]) {
            throw new Error(`Critical DOM element not found: ${elementName}`);
        }
    }
}

/**
 * Load the VideoEngager Agent SDK from CDN
 * Dynamically loads the SDK script and verifies availability
 * 
 * @returns {Promise<void>}
 * @throws {Error} If SDK fails to load
 */
async function loadVideoEngagerSDK() {
    try {
        logEvent('Loading VideoEngager SDK from CDN...', 'info');
        
        // Import the VideoEngager Agent SDK module
        window.VideoEngagerAgent = await import('https://cdn.jsdelivr.net/npm/videoengager-agent-sdk/dist/index.min.mjs');

        // Verify the SDK is available globally
        if (!window.VideoEngagerAgent) {
            throw new Error('VideoEngager SDK not available after loading');
        }
        
        logEvent('VideoEngager SDK is ready for use', 'success');

    } catch (error) {
        throw new Error(`SDK loading failed: ${error.message}`);
    }
}

/**
 * Set up all event listeners for the application
 * Handles form submissions, button clicks, and SDK events
 */
function setupEventListeners() {
    // Handle SDK initialization form submission
    elements.configForm.addEventListener('submit', handleSDKInitialization);
    
    // Handle call control buttons
    elements.startCallBtn.addEventListener('click', handleStartCall);
    elements.endCallBtn.addEventListener('click', handleEndCall);
    
    // Handle utility buttons
    elements.clearLogBtn.addEventListener('click', handleClearLog);
    
    // Handle page cleanup on unload
    window.addEventListener('beforeunload', handlePageUnload);
    
    logEvent('Event listeners set up successfully', 'info');
}

/**
 * Handle SDK initialization form submission
 * Validates input and initializes VideoEngager SDK with user configuration
 * 
 * @param {Event} event - Form submit event
 */
async function handleSDKInitialization(event) {
    event.preventDefault();
    
    try {
        // Update UI to show initialization in progress
        setStatus('initializing', 'Initializing SDK...');
        elements.initBtn.disabled = true;
        
        logEvent('Starting SDK initialization...', 'info');
        
        // Get and validate configuration from form
        const config = getConfigurationFromForm();
        validateConfiguration(config);
        
        // Prepare initialization parameters
        const initParams = {
            authMethod: 'generic',
            apiKey: config.apiKey,
            domain: config.domain,
            agentEmail: config.agentEmail,
            options: {
                containerId: 'video-container',
                uiHandlers: customUIHandlers,
            }
        };
        
        // Add optional organization ID if provided
        if (config.organizationId) {
            initParams.organizationId = config.organizationId;
        }
        
        // Initialize VideoEngager SDK
        await window.VideoEngagerAgent.init(initParams);
        
        // Set up SDK event listeners
        setupVideoEngagerEventListeners();
        
        // Update application state
        state.isSDKInitialized = true;
        
        // Update UI to show successful initialization
        setStatus('initialized', 'SDK Initialized Successfully');
        enableCallControls();
        
        logEvent('SDK initialized successfully', 'success');
        logEvent(`Connected to domain: ${config.domain}`, 'info');
        logEvent(`Agent email: ${config.agentEmail}`, 'info');
        
    } catch (error) {
        // Handle initialization errors
        state.isSDKInitialized = false;
        setStatus('error', `Initialization failed: ${error.message}`);
        elements.initBtn.disabled = false;
        
        logEvent(`SDK initialization failed: ${error.message}`, 'error');
        
        // Log detailed error information for VideoEngager errors
        if (error.code) {
            logEvent(`Error code: ${error.code}`, 'error');
            if (error.cause?.description) {
                logEvent(`Error details: ${error.cause.description}`, 'error');
            }
        }
        
        showError(`Initialization failed: ${error.message}`);
    }
}

/**
 * Get configuration values from the form inputs
 * Retrieves and trims all configuration values from the form
 * 
 * @returns {Object} Configuration object with form values
 */
function getConfigurationFromForm() {
    return {
        apiKey: elements.apiKeyInput.value.trim(),
        domain: elements.domainInput.value.trim(),
        agentEmail: elements.agentEmailInput.value.trim(),
        organizationId: elements.organizationIdInput.value.trim()
    };
}

/**
 * Validate configuration object before SDK initialization
 * Ensures all required fields are present and properly formatted
 * 
 * @param {Object} config - Configuration object to validate
 * @throws {Error} If validation fails
 */
function validateConfiguration(config) {
    if (!config.apiKey) {
        throw new Error('API Key is required and cannot be empty');
    }
    
    if (!config.domain) {
        throw new Error('Domain is required and cannot be empty');
    }
    
    if (!config.agentEmail) {
        throw new Error('Agent Email is required and cannot be empty');
    }

    // Basic domain format validation
    if (!config.domain.includes('.')) {
        throw new Error('Domain must be a valid domain name (e.g., your-domain.videome.leadsecure.com)');
    }
}

/**
 * Set up event listeners for VideoEngager SDK events
 * Registers handlers for all SDK events to update UI and log activity
 */
function setupVideoEngagerEventListeners() {
    // Session started event - fired when a video call begins
    window.VideoEngagerAgent.on('sessionStarted', (callState) => {
        state.currentCallState = callState;
        state.isCallActive = true;
        
        logEvent(`Session started - Visitor ID: ${callState.visitorId}`, 'success');
        logEvent(`Call PIN: ${callState.pin}`, 'info');
        logEvent(`Short URL: ${callState.shortUrl}`, 'info');
        
        updateCallInfo(callState);
        updateCallButtons(true);
    });
    
    // Session ended event - fired when a video call ends
    window.VideoEngagerAgent.on('sessionEnded', (callState) => {
        state.currentCallState = callState;
        state.isCallActive = false;
        
        logEvent('Session ended', 'info');
        logEvent(`Final status: ${callState.status}`, 'info');
        
        clearCallInfo();
        updateCallButtons(false);
    });
    
    // Session failed event - fired when a call fails to start
    window.VideoEngagerAgent.on('sessionFailed', (payload) => {
        state.isCallActive = false;
        
        logEvent(`Session failed to start: ${JSON.stringify(payload)}`, 'error');
        showError('Failed to start video session. Please try again.');
        
        updateCallButtons(false);
    });
    
    // Call state updated event - fired whenever call state changes
    window.VideoEngagerAgent.on('callStateUpdated', (callState) => {
        state.currentCallState = callState;
        
        logEvent(`Call state updated: ${callState.status}`, 'info');
        if (callState.inActiveSession !== undefined) {
            logEvent(`Active session: ${callState.inActiveSession}`, 'info');
        }
        
        updateCallInfo(callState);
    });
    
    // Cleanup event - fired when SDK is being cleaned up
    window.VideoEngagerAgent.on('cleanup', () => {
        state.isSDKInitialized = false;
        state.isCallActive = false;
        state.currentCallState = null;
        
        logEvent('SDK cleanup initiated', 'warning');
        
        resetUI();
    });
    
    logEvent('VideoEngager SDK event listeners registered', 'success');
}

/**
 * Handle start call button click
 * Initiates a video call with optional customer ID
 * 
 * @param {Event} event - Button click event
 */
async function handleStartCall(event) {
    event.preventDefault();
    
    try {
        // Ensure SDK is initialized
        if (!state.isSDKInitialized) {
            throw new Error('SDK is not initialized. Please initialize the SDK first.');
        }
        
        // Get customer ID from input (optional)
        const customerId = elements.customerIdInput.value.trim();
        
        // Prepare call parameters
        if (customerId) {
            const callParams = {
                customerId: customerId,
            };
            logEvent(`Starting call for customer: ${customerId}`, 'info');
        // Start the video call using VideoEngager SDK
            await window.VideoEngagerAgent.call(callParams);
        } else {
            logEvent('Starting call without customer ID', 'info');
        // Start the video call using VideoEngager SDK
            await window.VideoEngagerAgent.call();
        }
        
        elements.videoContainerText.style.display = 'none';
        
        // Disable start button to prevent multiple calls
        elements.startCallBtn.disabled = true;
        
        
        logEvent('Call start request sent successfully', 'success');
        
    } catch (error) {
        // Re-enable start button on error
        elements.startCallBtn.disabled = false;
        
        logEvent(`Failed to start call: ${error.message}`, 'error');
        
        // Log detailed error information for VideoEngager errors
        if (error.code) {
            logEvent(`Error code: ${error.code}`, 'error');
        }
        
        showError(`Failed to start call: ${error.message}`);
    }
}

/**
 * Handle end call button click
 * Terminates the current video call
 * 
 * @param {Event} event - Button click event
 */
async function handleEndCall(event) {
    event.preventDefault();
    
    try {
        // Ensure SDK is initialized
        if (!state.isSDKInitialized) {
            throw new Error('SDK is not initialized');
        }
        
        logEvent('Ending call...', 'info');
        
        // Disable end button to prevent multiple requests
        elements.endCallBtn.disabled = true;
        
        // End the video call using VideoEngager SDK
        await window.VideoEngagerAgent.endCall();
        elements.videoContainerText.style.display = 'block';
        
        logEvent('Call end request sent successfully', 'success');
        
    } catch (error) {
        // Re-enable end button on error
        elements.endCallBtn.disabled = false;
        
        logEvent(`Failed to end call: ${error.message}`, 'error');
        
        // Log detailed error information for VideoEngager errors
        if (error.code) {
            logEvent(`Error code: ${error.code}`, 'error');
        }
        
        showError(`Failed to end call: ${error.message}`);
    }
}

/**
 * Handle clear log button click
 * Clears the event log display
 * 
 * @param {Event} event - Button click event
 */
function handleClearLog(event) {
    event.preventDefault();
    elements.eventLog.innerHTML = '';
    logEvent('Event log cleared', 'info');
}

/**
 * Handle page unload event
 * Performs cleanup when user navigates away or closes the page
 * 
 * @param {Event} event - Page unload event
 */
async function handlePageUnload(event) {
    if (state.isSDKInitialized) {
        try {
            logEvent('Page unloading - cleaning up SDK...', 'info');
            await window.VideoEngagerAgent.destroy();
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

/**
 * Update the status indicator in the UI
 * Changes the status dot color and text to reflect current state
 * 
 * @param {'not-initialized'|'initializing'|'initialized'|'error'} status - Status type
 * @param {string} text - Status text to display
 */
function setStatus(status, text) {
    // Update status dot appearance
    elements.statusDot.className = `status-dot ${status}`;
    
    // Update status text
    elements.statusText.textContent = text;
}

/**
 * Enable call control buttons after successful SDK initialization
 * Unlocks the call management functionality
 */
function enableCallControls() {
    elements.startCallBtn.disabled = false;
    elements.clearLogBtn.disabled = false;
    
    // Keep init button disabled to prevent re-initialization
    elements.initBtn.disabled = true;
    elements.initBtn.textContent = 'SDK Initialized';
}

/**
 * Update call control buttons based on call state
 * Manages which buttons should be enabled/disabled during different call states
 * 
 * @param {boolean} isCallActive - Whether a call is currently active
 */
function updateCallButtons(isCallActive) {
    if (isCallActive) {
        elements.startCallBtn.disabled = true;
        elements.endCallBtn.disabled = false;
    } else {
        elements.startCallBtn.disabled = false;
        elements.endCallBtn.disabled = true;
    }
}

/**
 * Update the call information display
 * Shows current call details in the UI
 * 
 * @param {Object} callState - VideoEngager call state object
 */
function updateCallInfo(callState) {
    console.log('Updating call info:', callState);
    const callInfoHTML = `
        <p><strong>Status:</strong> ${callState.status}</p>
        <p><strong>Visitor ID:</strong> ${callState.visitorId}</p>
        <p><strong>Agent Email:</strong> ${callState.email}</p>
        <p><strong>PIN:</strong> ${callState.pin}</p>
        <p><strong>Short URL:</strong> <a href="${callState.shortUrl}" target="_blank">${callState.shortUrl}</a></p>
        <p><strong>Active Session:</strong> ${callState.inActiveSession ? 'Yes' : 'No'}</p>
        <p><strong>Tenant ID:</strong> ${callState.tennant_id}</p>
    `;
    
    elements.callInfo.innerHTML = callInfoHTML;
}

/**
 * Clear the call information display
 * Resets the call info area to show no active call
 */
function clearCallInfo() {
    elements.callInfo.innerHTML = '<p>No active call</p>';
}

/**
 * Reset the entire UI to initial state
 * Used after SDK cleanup or initialization failure
 */
function resetUI() {
    setStatus('not-initialized', 'Not Initialized');
    clearCallInfo();
    elements.initBtn.disabled = false;
    elements.initBtn.textContent = 'Initialize SDK';
    elements.startCallBtn.disabled = true;
    elements.endCallBtn.disabled = true;
}

/**
 * Log an event to the event log display
 * Adds timestamped entries to the scrollable log area
 * 
 * @param {string} message - Log message
 * @param {'info'|'success'|'error'|'warning'} level - Log level for styling
 */
function logEvent(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    
    // Always log to console for debugging
    console.log(`[VideoEngager Demo] ${message}`);
    
    // Only add to DOM if event log element is available
    if (elements.eventLog) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${level}`;
        logEntry.textContent = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        elements.eventLog.appendChild(logEntry);
        
        // Auto-scroll to bottom
        elements.eventLog.scrollTop = elements.eventLog.scrollHeight;
    }
}

/**
 * Show an error message to the user
 * Displays temporary error notifications
 * 
 * @param {string} message - Error message to display
 */
function showError(message) {
    // Always log to console
    console.error(`[VideoEngager Demo Error] ${message}`);
    
    // Try to show in UI if main element exists
    const main = document.querySelector('main');
    if (main) {
        // Create error alert element
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-error';
        errorAlert.textContent = message;
        
        // Insert at the top of the main content
        main.insertBefore(errorAlert, main.firstChild);
        
        // Remove error after 5 seconds
        setTimeout(() => {
            if (errorAlert.parentNode) {
                errorAlert.remove();
            }
        }, 5000);
    }
}

/**
 * Main application entry point
 * Initializes the app when DOM is ready
 */
async function main() {
    try {
        // Wait for DOM to be fully loaded if needed
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Initialize the application
        await initializeApp();

        // Make some functions available globally for debugging (optional)
        window.videoEngagerDemo = {
            state,
            elements,
            logEvent,
            showError
        };

    } catch (error) {
        console.error('Failed to start VideoEngager demo:', error);
        
        // Show error in UI if possible
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; 
            top: 20px; 
            left: 20px; 
            right: 20px;
            background: #dc3545; 
            color: white; 
            padding: 15px; 
            border-radius: 8px; 
            z-index: 9999;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        errorDiv.innerHTML = `
            <strong>Application Error:</strong> ${error.message}<br>
            <small>Please check the console for more details and refresh the page to try again.</small>
        `;
        document.body.appendChild(errorDiv);
        
        // Auto-remove error after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 10000);
    }
}

// Start the application
main();
