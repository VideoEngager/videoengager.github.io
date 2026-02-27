/**
 * UI Handler Module for Visitor
 * Handles all DOM manipulation and visual updates
 * Keeps UI logic separate from business logic
 */

// ============================================
// DOM ELEMENTS
// ============================================
/** @type {Record<string, HTMLElement>} */
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

  // Recording notice
  recordingNotice: document.getElementById('recordingNotice'),

  // Buttons
  startCallBtn: document.getElementById('startCallBtn'),
  endCallBtn: document.getElementById('endCallBtn'),

  // Error display
  errorDisplay: document.getElementById('errorDisplay'),

  // Container for iframe
  veContainer: document.getElementById('ve-visitor-container'),

  // Custom controls
  customControls: document.getElementById('custom-controls'),
  muteBtn: document.getElementById('mute-btn'),
  videoBtn: document.getElementById('video-btn'),
  screenBtn: document.getElementById('screen-btn'),
  cameraSwitchBtn: document.getElementById('camera-switch-btn'),
  hangupBtn: document.getElementById('hangup-btn')
};

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
export function showError (message) {
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
export function updateStatus (status, color = 'green') {
  elements.statusText.textContent = status;
  elements.statusDot.classList.remove('bg-green-400', 'bg-red-400', 'bg-yellow-400', 'bg-gray-400');
  elements.statusDot.classList.add(`bg-${color}-400`);
}

/**
 * Show call active section and hide start call section
 */
export function showActiveCall () {
  elements.startCallSection.classList.add('hidden');
  elements.activeCallSection.classList.remove('hidden');
  updateStatus('In Call', 'green');
  lucide.createIcons();
}

/**
 * Show start call section and hide active call section
 */
export function showStartCall () {
  elements.activeCallSection.classList.add('hidden');
  elements.startCallSection.classList.remove('hidden');
  updateStatus('Ready', 'green');
  lucide.createIcons();
}

/**
 * Get visitor name from input
 * @returns {string} Visitor name or empty string
 */
export function getVisitorName () {
  return elements.visitorName.value.trim();
}

// ============================================
// RECORDING STRATEGY UI
// ============================================

const RECORDING_TEXTS = {
  mandatory: 'This call will be recorded. By proceeding, you acknowledge and accept that the session will be recorded.',
  consent: 'I consent to this call being recorded',
  optional: 'This call may be recorded during the interaction. A visible indicator will appear when recording starts. You may ask the agent not to record.'
};

/**
 * Apply the recording strategy to the UI
 * @param {'disabled'|'mandatory'|'consent'|'optional'} strategy
 */
export function applyRecordingStrategy (strategy) {
  const container = elements.recordingNotice;
  container.innerHTML = '';
  container.classList.add('hidden');

  if (strategy === 'disabled') return;

  container.classList.remove('hidden');

  if (strategy === 'mandatory') {
    container.innerHTML = `
      <div class="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg p-3">
        <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"></i>
        <span class="text-sm text-amber-800">${RECORDING_TEXTS.mandatory}</span>
      </div>`;
  } else if (strategy === 'consent') {
    container.innerHTML = `
      <div class="flex items-center gap-2">
        <input type="checkbox" id="recordingConsent"
          class="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 cursor-pointer">
        <label for="recordingConsent" class="text-sm text-gray-700 cursor-pointer">
          ${RECORDING_TEXTS.consent}
        </label>
      </div>`;
  } else if (strategy === 'optional') {
    container.innerHTML = `
      <div class="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <i data-lucide="info" class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"></i>
        <span class="text-sm text-blue-700">${RECORDING_TEXTS.optional}</span>
      </div>`;
  }

  lucide.createIcons();
}

/**
 * Get recording consent value (only meaningful for 'consent' strategy)
 * @returns {boolean} Whether recording consent checkbox is checked
 */
export function getRecordingConsent () {
  const checkbox = document.getElementById('recordingConsent');
  return checkbox ? checkbox.checked : false;
}

/**
 * Get the recording notice text currently displayed to the user
 * @param {'disabled'|'mandatory'|'consent'|'optional'} strategy
 * @returns {string} The text shown to the user
 */
export function getRecordingNoticeText (strategy) {
  return RECORDING_TEXTS[strategy] || '';
}

/**
 * Update start call button state
 * @param {boolean} disabled - Whether to disable the button
 * @param {string} text - Button text
 */
export function setStartCallButtonState (disabled, text = 'Start Video Call') {
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
export function setEndCallButtonState (disabled) {
  elements.endCallBtn.disabled = disabled;
}

// ============================================
// CUSTOM CONTROLS FUNCTIONS
// ============================================

/**
 * Show custom controls overlay
 */
export function showCustomControls () {
  elements.customControls.classList.add('visible');
  lucide.createIcons();
}

/**
 * Hide custom controls overlay
 */
export function hideCustomControls () {
  elements.customControls.classList.remove('visible');
}

/**
 * Update custom controls based on video state
 * @param {Object} state - Video state object from VideoEngager
 */
export function updateCustomControlsState (state) {
  // Update mute button
  if (state.isMicOn) {
    elements.muteBtn.classList.remove('off');
    elements.muteBtn.innerHTML = '<i data-lucide="mic" class="w-6 h-6"></i>';
    elements.muteBtn.title = 'Mute Microphone';
  } else {
    elements.muteBtn.classList.add('off');
    elements.muteBtn.innerHTML = '<i data-lucide="mic-off" class="w-6 h-6"></i>';
    elements.muteBtn.title = 'Unmute Microphone';
  }

  // Update video button
  if (state.isVideoOn) {
    elements.videoBtn.classList.remove('off');
    elements.videoBtn.innerHTML = '<i data-lucide="video" class="w-6 h-6"></i>';
    elements.videoBtn.title = 'Turn Off Camera';
  } else {
    elements.videoBtn.classList.add('off');
    elements.videoBtn.innerHTML = '<i data-lucide="video-off" class="w-6 h-6"></i>';
    elements.videoBtn.title = 'Turn On Camera';
  }

  // Update screen share button
  if (state.isScreenSharing) {
    elements.screenBtn.classList.add('active');
    elements.screenBtn.title = 'Stop Screen Share';
  } else {
    elements.screenBtn.classList.remove('active');
    elements.screenBtn.title = 'Share Screen';
  }

  // Update camera switch button (disable if only one camera)
  if (!state.availableCameras || state.availableCameras.length <= 1) {
    elements.cameraSwitchBtn.disabled = true;
  } else {
    elements.cameraSwitchBtn.disabled = false;
  }

  lucide.createIcons();
}
