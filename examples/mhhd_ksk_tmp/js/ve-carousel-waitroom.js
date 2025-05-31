// file: js/ve-carousel-waitroom.js

// Assume ILogger, LogLevel, ConsoleLogger are imported from your logger module
// For this example, using the minimal stub from the previous response.
// import { ILogger, LogLevel, ConsoleLogger } from './logger/index.js'; // Adjust path

// --- Minimal Logger Stub (Ensure this aligns with your actual logger/index.js) ---
const LogLevel = Object.freeze({
    NONE: 0, ERROR: 1, WARN: 2, INFO: 3, DEBUG: 4,
});

class ILogger { // Basic interface definition
    debug(message, context) { console.debug('[ILogger STUB]', message, context); }
    info(message, context) { console.info('[ILogger STUB]', message, context); }
    warn(message, context) { console.warn('[ILogger STUB]', message, context); }
    error(message, error, context) { console.error('[ILogger STUB]', message, error, context); }
    withContext(context) { return this; }
    setLevel(level) {}
    getLevel() { return LogLevel.INFO; }
}

class ConsoleLogger extends ILogger {
    constructor(options = {}) {
        super();
        this._level = options.level || LogLevel.INFO;
        this._component = options.component || 'VECarouselWaitroomDefault';
        this._baseContext = options.context || {};
        // Avoid logging in constructor if logger itself is not fully ready or if it causes noise
        // console.info(`[${this._component}] Logger initialized. Level: ${this._level}`);
    }
    _log(level, type, message, ...args) {
        if (this._level >= level) {
            // Ensure _component is part of the main message or structured log
            const logMessage = `[${this._component}] ${type}: ${message}`;
            const fullArgs = args.filter(arg => arg !== undefined); // Filter out undefined optional args
            console[type.toLowerCase()](logMessage, ...fullArgs);
        }
    }
    debug(message, context) { this._log(LogLevel.DEBUG, 'DEBUG', message, context); }
    info(message, context) { this._log(LogLevel.INFO, 'INFO', message, context); }
    warn(message, context) { this._log(LogLevel.WARN, 'WARN', message, context); }
    error(message, error, context) { this._log(LogLevel.ERROR, 'ERROR', message, error, context); }
    withContext(newContext) {
      return new ConsoleLogger({
        level: this._level,
        component: this._component,
        context: { ...this._baseContext, ...newContext }
      });
    }
    setLevel(level) {
        if (Object.values(LogLevel).includes(level)) {
            this._level = level;
        } else {
            this._log(LogLevel.WARN, 'WARN', `Attempted to set invalid log level: ${level}. Level remains ${this._level}.`);
        }
    }
    getLevel() { return this._level; }
}
// --- End Minimal Logger Stub ---

const COMPONENT_VERSION = "1.0.0";
const THEME_API_VERSION = "1.0"; // Matches themeguide.md
const DEFAULT_HOST_LABEL = "Waitroom Information Carousel";

class VECarouselWaitroom extends HTMLElement {
    #logger; // Instance of ILogger
    #isExternalLoggerInjected = false;
    #internalConfig = null; // Holds the validated and processed configuration
    #shadow;

    // Elements within Shadow DOM (to be assigned in _renderScaffold)
    #containerEl = null;
    #slideDisplayAreaEl = null;
    #cancelButtonEl = null;
    #botMessageAreaEl = null;

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: 'open' });

        this.#logger = new ConsoleLogger({ // Default internal logger
            component: 'VECarouselWaitroom',
            level: LogLevel.INFO
        });
        // Initial log using the default logger; will be quickly replaced if an external one is set.
        this.#logger.info(`Constructor: Component instance created. Version: ${COMPONENT_VERSION}. Default logger active.`);
    }

    // --- 1. Logger Injection & Handling ---
    /**
     * @param {ILogger} newLogger - An instance conforming to ILogger.
     */
    set logger(newLogger) {
        if (newLogger && typeof newLogger.info === 'function' && typeof newLogger.error === 'function') {
            this.#logger = newLogger;
            this.#isExternalLoggerInjected = true;
            // Use the newly injected logger for this message.
            this.#logger.info("External logger injected successfully into VECarouselWaitroom.");
        } else {
            // Use the current logger (default or previously set) to warn.
            this.#logger.warn("Attempted to inject an invalid logger. Continuing with current logger.");
        }
    }

    get logger() {
        return this.#logger;
    }

    // --- 2. API Contract: Properties ---
    get version() {
        return COMPONENT_VERSION;
    }

    /**
     * @param {object} newConfig - The configuration object.
     * Structure defined by JSDoc types (CarouselConfig, SlideConfig, ThemeSettingsV1, AccessibilitySettings)
     * and validated against themeguide.md requirements.
     */
    set config(newConfig) {
        // Use `this.#logger?.info || console.info` style if logger could be nullified,
        // but current design ensures #logger is always an ILogger instance.
        this.#logger.info("Configuration received.", { configObject: newConfig });

        // --- Runtime Contract Check for Configuration ---
        if (!newConfig || typeof newConfig !== 'object') {
            this.#logger.error("Invalid configuration: Must be an object.", { received: typeof newConfig });
            this._renderFailSafe("Invalid configuration: Expected an object.");
            this.#internalConfig = null; // Ensure config is nulled on critical failure
            return;
        }
        if (!Array.isArray(newConfig.slides)) {
            this.#logger.error("Invalid configuration: 'slides' property must be an array.", { slidesReceived: typeof newConfig.slides });
            this._renderFailSafe("Slide configuration is missing or invalid (must be an array).");
            this.#internalConfig = null;
            return;
        }
        if (newConfig.theme !== undefined && (typeof newConfig.theme !== 'object' || newConfig.theme === null)) {
            this.#logger.error("Invalid configuration: 'theme' property, if provided, must be an object.", { themeReceived: typeof newConfig.theme });
             // Don't fail completely, try to use defaults, but log error
            newConfig.theme = {}; // Attempt to recover by using default theme
        } else if (newConfig.theme === undefined) {
            this.#logger.warn("Configuration: 'theme' property is missing. Applying all default theme values.");
            newConfig.theme = {}; // Ensure theme object exists for defaults
        }

        if (newConfig.accessibility !== undefined && (typeof newConfig.accessibility !== 'object' || newConfig.accessibility === null)) {
            this.#logger.error("Invalid configuration: 'accessibility' property, if provided, must be an object.", { accessibilityReceived: typeof newConfig.accessibility });
            newConfig.accessibility = {}; // Attempt to recover
        } else if (newConfig.accessibility === undefined) {
            this.#logger.warn("Configuration: 'accessibility' property is missing. Applying default accessibility values.");
            newConfig.accessibility = {};
        }
        // TODO: Add more granular validation for sub-properties of theme, accessibility, slides, and carousel settings.

        this.#internalConfig = newConfig;
        this.#logger.info("Configuration processed and stored.", /* { internalConfig: this.#internalConfig } - too verbose for now */);

        // If component is already connected, apply the new config immediately.
        if (this.isConnected) {
            this._applyConfig();
        }
    }

    get config() {
        return this.#internalConfig;
    }

    // --- 3. API Contract: Methods (Stubs for Phase 1) ---
    freeze() {
        this.#logger.info("API CALL: freeze() invoked.");
        // TODO (Phase 2/3): Implement logic to pause animations, autoplay, video playback etc.
    }

    thaw() {
        this.#logger.info("API CALL: thaw() invoked.");
        // TODO (Phase 2/3): Implement logic to resume animations, autoplay, video playback etc.
    }

    showBotMessage(message, options = {}) {
        this.#logger.info("API CALL: showBotMessage() invoked.", { message, options });
        if (this.#botMessageAreaEl) {
            this.#botMessageAreaEl.textContent = `Bot Message (Tier: ${options.tier || 'low'}): ${message}`;
            this.#botMessageAreaEl.style.display = 'block';
            this.#botMessageAreaEl.setAttribute('aria-hidden', 'false');
            // TODO (Phase 2): Implement tiered styling, auto-hide based on duration, and accessibility announcements.
        } else {
            this.#logger.warn("showBotMessage called, but bot message area is not available in the DOM.");
        }
    }

    play() {
        this.#logger.info("API CALL: play() invoked.");
        // TODO (Phase 2): Start/resume autoplay and slide transitions.
    }

    pause() {
        this.#logger.info("API CALL: pause() invoked.");
        // TODO (Phase 2): Pause autoplay and slide transitions.
    }

    goToSlide(index) {
        this.#logger.info("API CALL: goToSlide() invoked.", { index });
        // TODO (Phase 2): Implement navigation to specific slide with validation.
    }

    // --- Lifecycle Callbacks ---
    connectedCallback() {
        this.#logger.info(`Component connected to DOM. Version: ${this.version}. Theme API: ${THEME_API_VERSION}`);
        if (!this.#isExternalLoggerInjected) {
            this.#logger.warn("CRITICAL WARNING: No external production logger has been injected. Using default console logger. This is NOT suitable for production in a clinical environment. Please inject a production-grade logger instance via the 'logger' property.");
        }

        // --- ARIA for Host Element from Day 1 ---
        if (!this.hasAttribute('role')) {
            this.setAttribute('role', 'region');
        }
        const initialAriaLabel = this.#internalConfig?.accessibility?.carouselLabel || DEFAULT_HOST_LABEL;
        this.setAttribute('aria-label', initialAriaLabel);

        if (!this.hasAttribute('tabindex')) {
            this.setAttribute('tabindex', '0'); // Make component focusable for keyboard nav
        }
        // Developers/Testers: Remember to add tabindex="0" to <ve-carousel-waitroom> in test HTML for keyboard interaction.

        this._renderScaffold(); // Build initial DOM structure
        this._attachInternalEventListeners();

        if (this.#internalConfig) {
            this._applyConfig(); // Apply any config set before connection
        } else {
            this.#logger.error("Component connected but no valid configuration has been set. Displaying fail-safe state. Please provide a configuration object via the 'config' property.");
            this._renderFailSafe("Carousel not configured. Please contact support.");
        }

        // --- Dispatch 'carouselReady' event ---
        this._dispatchEvent('carouselReady', {
            version: this.version,
            supportedThemeApi: THEME_API_VERSION,
            initialConfigPresent: !!this.#internalConfig
        });
        // Test Harness Check: Verify 'carouselReady' event and its detail.
    }

    disconnectedCallback() {
        this.#logger.info("Component disconnected from DOM. Cleaning up.");
        if (this.#cancelButtonEl) {
            this.#cancelButtonEl.removeEventListener('click', this._handleCancelClick);
        }
        this.removeEventListener('keydown', this._handleHostKeydown); // Remove host keydown listener
        // TODO (Phase 2+): Clear any timers (autoplay), disconnect IntersectionObservers, etc.
    }

    // --- Rendering & DOM Management ---
    _renderScaffold() {
        this.#logger.debug("Rendering scaffold structure into Shadow DOM.");
        this.#shadow.innerHTML = `
            <style>
                /* --- CSS Custom Property Placeholders & Basic Styles --- */
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                    background: var(--ve-cw-component-background, #e9ecef); /* Fallback background */
                    color: var(--ve-cw-primary-text-color, #212529);
                    font-family: var(--ve-cw-font-family, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
                    font-size: var(--ve-cw-base-font-size, 1rem);
                    outline: none; /* Remove default browser outline */
                }
                /* Themed focus indicator for the host element (accessibility) */
                :host(:focus-visible) {
                     box-shadow: 0 0 0 3px var(--ve-cw-focus-indicator-host-shadow, rgba(0, 123, 255, 0.5)); /* Example focus */
                     border-radius: 3px; /* Optional: if you want rounded focus */
                }

                .container__waitroom { /* BEM-ish naming */
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative; /* Context for absolutely positioned children like cancel button */
                }
                .slides-area__waitroom {
                    flex-grow: 1;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    border: 1px dashed var(--ve-cw-debug-border-color, #adb5bd); /* Placeholder border */
                    min-height: 250px; /* Ensure it has some size */
                }
                .slides-area__waitroom-message {
                    padding: 1rem;
                    font-style: italic;
                    color: var(--ve-cw-placeholder-text-color, #6c757d);
                }
                .cancel-button__waitroom {
                    position: absolute;
                    top: 1rem;    /* More consistent with common UI patterns */
                    right: 1rem;
                    padding: 0.6rem 1.2rem;
                    background-color: var(--ve-cw-cancel-button-bg, #dc3545);
                    color: var(--ve-cw-cancel-button-text, white);
                    border: none; /* Remove default border */
                    border-radius: var(--ve-cw-cancel-button-radius, 0.375rem); /* Bootstrap-like */
                    cursor: pointer;
                    z-index: 1000; /* High z-index */
                    font-size: var(--ve-cw-cancel-button-font-size, 0.9rem);
                    line-height: 1.5;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                 /* Themed focus for cancel button */
                .cancel-button__waitroom:focus-visible {
                    outline: none; /* Remove default */
                    box-shadow: 0 0 0 0.25rem var(--ve-cw-focus-indicator-button-shadow, rgba(220, 53, 69, 0.5));
                }
                .bot-message-area__waitroom {
                    position: absolute;
                    bottom: 1.5rem;
                    left: 50%;
                    transform: translateX(-50%); /* Center it */
                    width: auto; /* Fit content */
                    max-width: 90%; /* Prevent very wide messages */
                    padding: 0.75rem 1.25rem;
                    background-color: var(--ve-cw-bot-message-background, rgba(33, 37, 41, 0.9));
                    color: var(--ve-cw-bot-message-text-color, white);
                    border-radius: var(--ve-cw-bot-message-border-radius, 0.375rem);
                    text-align: center;
                    z-index: 900;
                    display: none; /* Initially hidden */
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                    font-size: var(--ve-cw-bot-message-font-size, 0.95rem);
                }
                .fail-safe__message {
                    padding: 2rem;
                    text-align: center;
                    font-weight: bold;
                    font-size: 1.1rem;
                    color: var(--ve-cw-error-text-color, #721c24); /* Dark red for errors */
                    background-color: var(--ve-cw-error-bg-color, #f8d7da); /* Light red background */
                    border: 1px solid var(--ve-cw-error-border-color, #f5c6cb);
                    border-radius: 0.375rem;
                }
            </style>
            <div class="container__waitroom" id="waitroom-container-host-id">
                <div class="slides-area__waitroom" id="slide-display-area-id">
                    <p class="slides-area__waitroom-message">Carousel initializing...</p>
                </div>
                <button class="cancel-button__waitroom" id="cancel-btn-id" aria-label="Cancel Operation">
                    Cancel
                </button>
                <div class="bot-message-area__waitroom" id="bot-message-area-id" role="alert" aria-live="assertive" aria-atomic="true" aria-hidden="true">
                    </div>
            </div>
        `;

        // Assign shadow DOM elements to class fields
        this.#containerEl = this.#shadow.getElementById('waitroom-container-host-id');
        this.#slideDisplayAreaEl = this.#shadow.getElementById('slide-display-area-id');
        this.#cancelButtonEl = this.#shadow.getElementById('cancel-btn-id');
        this.#botMessageAreaEl = this.#shadow.getElementById('bot-message-area-id');

        this.#logger.debug("Scaffold DOM elements assigned and initial styles applied.");
        // MANUAL ACCESSIBILITY TESTING NOTE:
        // Run axe-core or similar tools on the test page with this component.
        // Manually test with NVDA/VoiceOver:
        // - Is the host "region" announced with its label?
        // - Can you tab to the "Cancel" button? Is it announced correctly?
    }

    _applyConfig() {
        if (!this.#internalConfig || !this.isConnected) {
            this.#logger.debug("Skipping _applyConfig: Config not ready or component not connected.");
            return;
        }
        this.#logger.info("Applying full configuration to the component.");

        this._applyTheme(this.#internalConfig.theme || {});
        this._renderSlides(this.#internalConfig.slides || []);

        // Update host ARIA label if provided in config
        const hostLabel = this.#internalConfig.accessibility?.carouselLabel || DEFAULT_HOST_LABEL;
        if (this.getAttribute('aria-label') !== hostLabel) {
            this.setAttribute('aria-label', hostLabel);
            this.#logger.debug(`Host aria-label updated to: "${hostLabel}"`);
        }
        // TODO (Phase 2): Apply other accessibility settings (e.g., live region announcements for slide changes).
        // TODO (Phase 2): Restart/configure autoplay based on this.#internalConfig.carousel settings.
    }

    /**
     * @param {object} themeConfig - The theme object from this.#internalConfig.theme
     */
    _applyTheme(themeConfig) {
        this.#logger.info("Applying theme configuration.", { themeConfig });
        // TODO (Phase 2): Iterate through themeConfig, validate values, and set CSS Custom Properties on ':host'.
        // Example for one property:
        // const bgColor = this._validateCssColor(themeConfig.componentBackground, DEFAULT_THEME.componentBackground);
        // this.style.setProperty('--ve-cw-component-background', bgColor);
        if (this.#slideDisplayAreaEl) { // Temporary visual cue for theme application
            this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">Theme would be applied. Background: ${themeConfig.componentBackground || 'Default'}</p>`;
        }
    }

    /**
     * @param {Array<object>} slidesConfig - The slides array from this.#internalConfig.slides
     */
    _renderSlides(slidesConfig) {
        this.#logger.info(`Rendering ${slidesConfig.length} slides.`);
        // TODO (Phase 2): Clear existing slides and render new ones into #slideDisplayAreaEl
        // This will involve creating slide elements, handling types (image, video, content),
        // lazy loading, media controls, etc.
        if (this.#slideDisplayAreaEl) {
             if (slidesConfig.length > 0) {
                this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">Slides would be rendered here. First slide title (if any): ${slidesConfig[0]?.title || 'N/A'}</p>`;
            } else {
                this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">${this.#internalConfig?.accessibility?.noSlidesText || 'No slides to display.'}</p>`;
            }
        }
    }

    _renderFailSafe(message) {
        this.#logger.error("Entering fail-safe rendering mode.", { message });
        if (!this.#shadow || !this.#shadow.firstChild) { // Ensure shadowRoot is populated
            this._renderScaffold(); // Attempt to render scaffold if not already done
        }
        // Target the slide display area if available, otherwise the main container
        const targetArea = this.#slideDisplayAreaEl || this.#containerEl;
        if (targetArea) {
            targetArea.innerHTML = `<div class="fail-safe__message">${message}</div>`;
        } else {
            // Absolute fallback if even scaffold failed
            this.#shadow.innerHTML = `<div style="color:red; padding:1em; border:2px solid red;">${message} (Critical render failure)</div>`;
        }
    }

    // --- Internal Event Handling & Keyboard Navigation ---
    _attachInternalEventListeners() {
        if (this.#cancelButtonEl) {
            this.#cancelButtonEl.addEventListener('click', () => this._handleCancelClick());
        }
        // Listen for keydown events on the host element (shadow root won't get them directly unless delegated or host is focused)
        this.addEventListener('keydown', (event) => this._handleHostKeydown(event));
        this.#logger.debug("Internal event listeners attached.");
    }

    _handleCancelClick() {
        this.#logger.info("Cancel button clicked by user.");
        this._dispatchEvent('userCancelled', { timestamp: Date.now(), reason: 'cancel_button_click' });
    }

    /**
     * @param {KeyboardEvent} event
     */
    _handleHostKeydown(event) {
        this.#logger.debug(`Host keydown event received: Key='${event.key}', Code='${event.code}'`, { alt: event.altKey, ctrl: event.ctrlKey, shift: event.shiftKey });

        // Basic keyboard interaction stubs for Phase 1 - observable for testing
        // Full navigation logic will be in Phase 2/3
        let handled = false;
        switch (event.key) {
            case "Escape":
                // Potentially trigger cancel, or close a modal if one were open
                this.#logger.info("Escape key pressed on host. Potential cancel action.");
                this._handleCancelClick(); // Example: map Escape to cancel
                handled = true;
                break;
            case "ArrowLeft":
                this.#logger.info("ArrowLeft key pressed on host. (Slide navigation stub)");
                // TODO: Go to previous slide
                handled = true;
                break;
            case "ArrowRight":
                this.#logger.info("ArrowRight key pressed on host. (Slide navigation stub)");
                // TODO: Go to next slide
                handled = true;
                break;
            case "Home":
                this.#logger.info("Home key pressed on host. (Slide navigation stub)");
                // TODO: Go to first slide
                handled = true;
                break;
            case "End":
                this.#logger.info("End key pressed on host. (Slide navigation stub)");
                // TODO: Go to last slide
                handled = true;
                break;
            // No default case needed unless we want to log unhandled keys specifically for this component's focus.
            // Tab key is handled by the browser for focus management.
        }

        if (handled) {
            event.preventDefault(); // Prevent default browser action (e.g., scrolling) if key was handled
        }
        // Test Harness Check: Verify appropriate keys are logged and default is prevented.
    }

    // --- Event Dispatch Helper ---
    _dispatchEvent(eventName, detail = {}) {
        if (!this.isConnected) {
            this.#logger.warn(`Attempted to dispatch "${eventName}" while disconnected. Event not sent.`, detail);
            return;
        }
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
        this.#logger.debug(`Dispatched event: "${eventName}"`, detail);
    }
}

// --- Define the custom element (guarded) ---
if (!customElements.get('ve-carousel-waitroom')) {
    customElements.define('ve-carousel-waitroom', VECarouselWaitroom);
}
