/**
 * UI Handler Module for Visitor
 * Handles all DOM manipulation and visual updates
 * Keeps UI logic separate from business logic
 */

// ============================================
// DOM ELEMENTS
// ============================================
export const elements = {
    // Sections
    dashboardSection: document.getElementById('dashboardSection'),
    startCallSection: document.getElementById('startCallSection'),
    activeCallSection: document.getElementById('activeCallSection'),

    // Status indicators
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),

    // Form inputs
    visitorName: document.getElementById('visitorName'),

    // Buttons
    startCallBtn: document.getElementById('startCallBtn'),
    endCallBtn: document.getElementById('endCallBtn'),

    // Error display
    errorDisplay: document.getElementById('errorDisplay'),

    // Container for iframe
    veContainer: document.getElementById('ve-visitor-container')
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
 * Update status indicator
 * @param {string} status - Status text to display
 * @param {string} color - Color class for the dot (e.g., 'green', 'red', 'yellow')
 */
export function updateStatus(status, color = 'green') {
    elements.statusText.textContent = status;
    elements.statusDot.classList.remove('bg-green-400', 'bg-red-400', 'bg-yellow-400', 'bg-gray-400');
    elements.statusDot.classList.add(`bg-${color}-400`);
}

/**
 * Show call active section and hide start call section
 */
export function showActiveCall() {
    elements.startCallSection.classList.add('hidden');
    elements.activeCallSection.classList.remove('hidden');
    updateStatus('In Call', 'green');
    lucide.createIcons();
}

/**
 * Show start call section and hide active call section
 */
export function showStartCall() {
    elements.activeCallSection.classList.add('hidden');
    elements.startCallSection.classList.remove('hidden');
    updateStatus('Ready', 'green');
    lucide.createIcons();
}

/**
 * Get visitor name from input
 * @returns {string} Visitor name or empty string
 */
export function getVisitorName() {
    return elements.visitorName.value.trim();
}

/**
 * Update start call button state
 * @param {boolean} disabled - Whether to disable the button
 * @param {string} text - Button text
 */
export function setStartCallButtonState(disabled, text = 'Start Video Call') {
    elements.startCallBtn.disabled = disabled;
    const span = elements.startCallBtn.querySelector('span span:last-child');
    if (span) {
        span.textContent = text;
    }
}

/**
 * Update end call button state
 * @param {boolean} disabled - Whether to disable the button
 */
export function setEndCallButtonState(disabled) {
    elements.endCallBtn.disabled = disabled;
}
