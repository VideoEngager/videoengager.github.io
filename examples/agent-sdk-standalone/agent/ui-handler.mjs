/**
 * UI Handler Module
 * Handles all DOM manipulation and visual updates
 * Keeps UI logic separate from business logic
 */

// ============================================
// DOM ELEMENTS
// ============================================
export const elements = {
    // Sections
    configSection: document.getElementById('configSection'),
    dashboardSection: document.getElementById('dashboardSection'),
    callControlsSection: document.getElementById('callControlsSection'),
    queueSection: document.getElementById('queueSection'),

    // Form
    configForm: document.getElementById('configForm'),
    connectBtn: document.getElementById('connectBtn'),

    // Status indicators
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    queueStatusDot: document.getElementById('queueStatusDot'),
    queueStatusText: document.getElementById('queueStatusText'),

    // Queue toggle
    queueToggle: document.getElementById('queueToggle'),

    // Calls list
    callsList: document.getElementById('callsList'),
    emptyState: document.getElementById('emptyState'),
    emptyStateText: document.getElementById('emptyStateText'),
    callCount: document.getElementById('callCount'),

    // Buttons
    endCallBtn: document.getElementById('endCallBtn'),

    // Error display
    errorDisplay: document.getElementById('errorDisplay')
};

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
export function showError(message) {
    elements.errorDisplay.querySelector('span').textContent = message;
    elements.errorDisplay.classList.remove('hidden');
    lucide.createIcons();
    setTimeout(() => {
        elements.errorDisplay.classList.add('hidden');
    }, 5000);
}

/**
 * Update connection status indicator
 * @param {boolean} isOnline - Whether agent is connected to service
 */
export function updateConnectionStatus(isOnline) {
    if (isOnline) {
        elements.statusDot.classList.remove('bg-red-400', 'bg-gray-400');
        elements.statusDot.classList.add('bg-green-400', 'animate-pulse');
        elements.statusText.textContent = 'Connected';
    } else {
        elements.statusDot.classList.remove('bg-green-400', 'animate-pulse');
        elements.statusDot.classList.add('bg-red-400', 'animate-pulse');
        elements.statusText.textContent = 'Disconnected';
    }
}

/**
 * Update queue status indicator and toggle button
 * @param {boolean} isOnQueue - Whether agent is in call queue
 * @param {boolean} isAgentOnline - Whether agent is connected to service
 */
export function updateQueueStatus(isOnQueue, isAgentOnline) {
    // Disable queue toggle if agent is offline
    if (!isAgentOnline) {
        elements.queueToggle.classList.add('opacity-50', 'cursor-not-allowed');
        elements.queueToggle.disabled = true;
        elements.queueStatusDot.classList.remove('bg-green-400', 'animate-pulse');
        elements.queueStatusDot.classList.add('bg-gray-400');
        elements.queueStatusText.textContent = 'Unavailable';
        elements.emptyStateText.textContent = 'Service disconnected - reconnecting...';
        return;
    }

    // Agent is online, show queue status
    elements.queueToggle.classList.remove('opacity-50', 'cursor-not-allowed');
    elements.queueToggle.disabled = false;

    if (isOnQueue) {
        elements.queueStatusDot.classList.remove('bg-gray-400');
        elements.queueStatusDot.classList.add('bg-green-400', 'animate-pulse');
        elements.queueStatusText.textContent = 'Active';
        elements.emptyStateText.textContent = 'Waiting for visitors...';
    } else {
        elements.queueStatusDot.classList.remove('bg-green-400', 'animate-pulse');
        elements.queueStatusDot.classList.add('bg-gray-400');
        elements.queueStatusText.textContent = 'Inactive';
        elements.emptyStateText.textContent = 'Enable queue to receive calls';
    }
}

/**
 * Update queue toggle visual state (slider position and color)
 * @param {boolean} isOnQueue - Whether agent is in call queue
 */
export function updateQueueToggleVisual(isOnQueue) {
    const slider = elements.queueToggle.querySelector('div');
    if (isOnQueue) {
        elements.queueToggle.classList.add('bg-green-500');
        elements.queueToggle.classList.remove('bg-gray-300');
        slider.style.transform = 'translateX(1.5rem)';
    } else {
        elements.queueToggle.classList.remove('bg-green-500');
        elements.queueToggle.classList.add('bg-gray-300');
        slider.style.transform = 'translateX(0)';
    }
}

/**
 * Render incoming calls list
 * @param {Array} calls - Array of call objects
 */
export function renderCalls(calls) {
    elements.callCount.textContent = calls.length;

    // Show empty state if no calls
    if (calls.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.callsList.innerHTML = '';
        elements.callsList.appendChild(elements.emptyState);
        return;
    }

    // Render call items
    elements.emptyState.classList.add('hidden');
    elements.callsList.innerHTML = calls.map(call => `
        <div class="bg-gradient-to-r from-blue-50 to-white border-2 border-blue-200 rounded-lg p-4 mb-3 flex items-center justify-between gap-4 hover:shadow-md transition-shadow" data-call-id="${call.caller.id}">
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <i data-lucide="user" class="w-5 h-5 text-white"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-gray-800 truncate">${call.displayName || 'Visitor'}</div>
                    <div class="text-xs text-gray-500 font-mono truncate">ID: ${call.caller.id}</div>
                </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
                <button onclick="acceptCall('${call.caller.id}')" 
                    class="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-all transform hover:scale-110 active:scale-95 disabled:opacity-50">
                    <i data-lucide="check" class="w-5 h-5"></i>
                </button>
                <button onclick="rejectCall('${call.caller.id}')" 
                    class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all transform hover:scale-110 active:scale-95 disabled:opacity-50">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Reinitialize Lucide icons for dynamically added content
    lucide.createIcons();
}

/**
 * Show or hide call controls section
 * @param {boolean} show - Whether to show the call controls
 */
export function toggleCallControls(show) {
    elements.callControlsSection.classList.toggle('hidden', !show);
    elements.queueSection.classList.toggle('hidden', show);
}

/**
 * Disable/enable call action buttons for a specific call
 * @param {string} callerId - The ID of the call
 * @param {boolean} disabled - Whether to disable the buttons
 */
export function setCallButtonsState(callerId, disabled) {
    const buttons = document.querySelectorAll(`[data-call-id="${callerId}"] button`);
    buttons.forEach(btn => btn.disabled = disabled);
}

/**
 * Show dashboard and hide config form
 */
export function showDashboard() {
    elements.configSection.classList.add('hidden');
    elements.dashboardSection.classList.remove('hidden');
}

/**
 * Update connect button state
 * @param {boolean} connecting - Whether connection is in progress
 */
export function setConnectButtonState(connecting) {
    elements.connectBtn.disabled = connecting;
    elements.connectBtn.textContent = connecting ? 'Connecting...' : 'Connect';
}

/**
 * Update end call button state
 * @param {boolean} disabled - Whether to disable the button
 */
export function setEndCallButtonState(disabled) {
    elements.endCallBtn.disabled = disabled;
}

/**
 * Set queue toggle pointer events
 * @param {boolean} enabled - Whether pointer events are enabled
 */
export function setQueueTogglePointerEvents(enabled) {
    elements.queueToggle.style.pointerEvents = enabled ? '' : 'none';
}

/**
 * Get form configuration values
 * @returns {Object} Configuration object with form values
 */
export function getConfigFormValues() {
    return {
        domain: document.getElementById('domain').value,
        apiKey: document.getElementById('apiKey').value,
        agentEmail: document.getElementById('agentEmail').value,
        organizationId: document.getElementById('organizationId').value,
        externalId: document.getElementById('externalId').value
    };
}
