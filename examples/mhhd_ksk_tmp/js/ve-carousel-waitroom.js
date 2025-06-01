// file: js/ve-carousel-waitroom.js

// Assume ILogger, LogLevel, ConsoleLogger are imported from your logger module.
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
    }
    _log(level, type, message, ...args) {
        if (this._level >= level) {
            const logMessage = `[${this._component}] ${type}: ${message}`;
            const fullArgs = args.filter(arg => arg !== undefined);
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
const THEME_API_VERSION = "1.0";
const ACCESSIBILITY_API_VERSION = "1.0";
const DEFAULT_HOST_LABEL = "Waitroom Information Carousel";

class VECarouselWaitroom extends HTMLElement {
    #logger; // Instance of ILogger
    #isExternalLoggerInjected = false;
    #internalConfig = null;
    #shadow;

    // DOM Element References (assigned in _renderScaffold)
    #containerEl = null;
    #slideDisplayAreaEl = null;
    #cancelButtonEl = null;
    #botMessageAreaEl = null;
    #ariaLiveRegionEl = null; // For screen reader announcements

    // Internal State Placeholders for Phase 1 Keyboard Navigation Demo
    #debugTotalSlides = 0;
    #debugCurrentSlideIndex = 0; // Placeholder for visual/ARIA feedback

    static get observedAttributes() {
        // In the future, if config can be passed via attributes (e.g., config-src URL)
        return [/* 'config-src' */];
    }

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: 'open' });

        this.#logger = new ConsoleLogger({
            component: 'VECarouselWaitroom',
            level: LogLevel.INFO
        });
        this.#logger.info(`Constructor: Component instance created. Version: ${this.version}. Default logger active.`);
    }

    // --- 1. Logger Injection & Handling ---
    /**
     * Sets the logger instance for the component.
     * Must conform to ILogger interface.
     * @param {ILogger} newLogger
     */
    set logger(newLogger) {
        if (newLogger && typeof newLogger.info === 'function' && typeof newLogger.error === 'function') {
            this.#logger = newLogger;
            this.#isExternalLoggerInjected = true;
            this.#logger.info("External logger injected successfully.");
        } else {
            this.#logger.warn("Attempted to inject an invalid logger. Continuing with current logger (default or previously set).");
        }
    }

    /** @returns {ILogger} The currently active logger instance. */
    get logger() {
        return this.#logger;
    }

    // --- 2. API Contract: Properties ---
    /** @returns {string} The semantic version of this component. */
    get version() {
        return COMPONENT_VERSION;
    }

    /** @returns {string} The supported Theme API version (aligns with themeguide.md). */
    get themeApiVersion() {
        return THEME_API_VERSION;
    }

    /** @returns {string} The supported Accessibility API version (for accessibility config structure). */
    get accessibilityApiVersion() {
        return ACCESSIBILITY_API_VERSION;
    }

    /**
     * Sets the complete configuration for the carousel.
     * @param {object} newConfig - The configuration object.
     * Expected structure: {
     * slides: Array<object>,
     * theme: object (ThemeSettingsV1),
     * accessibility: object (AccessibilitySettings),
     * carousel: { interval?: number, loop?: boolean }
     * }
     */
    set config(newConfig) {
        this.#logger.info("Configuration received.", { configObjectReceived: !!newConfig });

        // --- Runtime Contract Check for Configuration ---
        if (!newConfig || typeof newConfig !== 'object') {
            this.#logger.error("Invalid configuration: Config must be an object.", { receivedType: typeof newConfig });
            this._renderFailSafe("Invalid configuration provided to carousel.");
            this.#internalConfig = null;
            this._dispatchEvent('error', { errorCode: 'INVALID_CONFIG', reason: 'Configuration must be an object.' });
            return;
        }
        if (!Array.isArray(newConfig.slides)) {
            this.#logger.error("Invalid configuration: 'slides' property must be an array.", { slidesReceived: typeof newConfig.slides });
            this._renderFailSafe("Slide configuration is missing or invalid (slides must be an array).");
            this.#internalConfig = null;
            this._dispatchEvent('error', { errorCode: 'INVALID_CONFIG_SLIDES', reason: "'slides' property must be an array." });
            return;
        }

        const validatedConfig = {
            slides: newConfig.slides, // TODO: Add validation for individual slide objects in Phase 2
            theme: (typeof newConfig.theme === 'object' && newConfig.theme !== null) ? newConfig.theme : {},
            accessibility: (typeof newConfig.accessibility === 'object' && newConfig.accessibility !== null) ? newConfig.accessibility : {},
            carousel: (typeof newConfig.carousel === 'object' && newConfig.carousel !== null) ? newConfig.carousel : {}
        };

        if (typeof newConfig.theme !== 'object' || newConfig.theme === null) {
            this.#logger.warn("Configuration: 'theme' property is missing or not an object. Default theme values will be applied.", { themeReceived: newConfig.theme });
        }
        if (typeof newConfig.accessibility !== 'object' || newConfig.accessibility === null) {
            this.#logger.warn("Configuration: 'accessibility' property is missing. Default accessibility settings will be applied.", { accessibilityReceived: newConfig.accessibility });
        }
        if (typeof newConfig.carousel !== 'object' || newConfig.carousel === null) {
            this.#logger.warn("Configuration: 'carousel' settings (interval, loop) are missing. Applying defaults.");
        }

        this.#internalConfig = validatedConfig;
        this.#logger.info("Configuration processed and stored.");
        this._dispatchEvent('configApplied', { config: this.#internalConfig });

        if (this.isConnected) {
            this._applyFullConfig();
        }
    }

    /** @returns {object | null} The current internal configuration object. */
    get config() {
        return this.#internalConfig;
    }

    // --- 3. API Contract: Methods (Stubs/Basic for Phase 1) ---
    /** Pauses autoplay and animations. */
    freeze() {
        this.#logger.info("API CALL: freeze() invoked.");
        // TODO (Phase 2/3): Implement logic
        this._dispatchEvent('frozen');
    }

    /** Resumes autoplay and animations. */
    thaw() {
        this.#logger.info("API CALL: thaw() invoked.");
        // TODO (Phase 2/3): Implement logic
        this._dispatchEvent('thawed');
    }

    /**
     * Displays a bot message overlay.
     * @param {string} message - The message text.
     * @param {object} [options] - Options for the message.
     * @param {'low' | 'high' | 'critical'} [options.tier='low'] - Importance tier.
     * @param {number} [options.duration=5000] - Display duration in ms (not for critical).
     */
    showBotMessage(message, options = {}) {
        const { tier = 'low', duration = 5000 } = options;
        this.#logger.info("API CALL: showBotMessage() invoked.", { message, tier, duration });
        if (this.#botMessageAreaEl) {
            this.#botMessageAreaEl.textContent = `Bot Message (Tier: ${tier}): ${message}`;
            this.#botMessageAreaEl.className = `bot-message-area__waitroom tier-${tier}`; // For styling
            this.#botMessageAreaEl.style.display = 'block';
            this.#botMessageAreaEl.setAttribute('aria-hidden', 'false');
            this._announceToScreenReader(`Notification: ${message}`);

            this._dispatchEvent('botMessageShown', { message, tier });

            if (tier !== 'critical' && duration > 0) {
                setTimeout(() => {
                    if (this.#botMessageAreaEl && this.#botMessageAreaEl.textContent.includes(message)) { // Avoid hiding if new message shown
                        this.#botMessageAreaEl.style.display = 'none';
                        this.#botMessageAreaEl.setAttribute('aria-hidden', 'true');
                        this._dispatchEvent('botMessageDismissed', { message, tier });
                    }
                }, duration);
            }
        } else {
            this.#logger.warn("showBotMessage called, but bot message area is not available in the DOM.");
        }
    }

    /** Starts or resumes autoplay if configured. */
    play() {
        this.#logger.info("API CALL: play() invoked.");
        // TODO (Phase 2): Implement
        this._dispatchEvent('playTriggered');
    }

    /** Pauses autoplay. */
    pause() {
        this.#logger.info("API CALL: pause() invoked.");
        // TODO (Phase 2): Implement
        this._dispatchEvent('pauseTriggered');
    }

    /**
     * Navigates to a specific slide index.
     * @param {number} index - The 0-based index of the slide to navigate to.
     */
    goToSlide(index) {
        this.#logger.info("API CALL: goToSlide() invoked.", { index });
        // TODO (Phase 2): Implement navigation logic with bounds checking.
        // For Phase 1 testable effect with keyboard:
        if (this.#internalConfig && index >= 0 && index < this.#debugTotalSlides) {
            this._updateDebugSlideIndex(index, "API");
        }
    }

    /** Resets the carousel to its initial state based on current config (e.g., first slide). */
    reset() {
        this.#logger.info("API CALL: reset() invoked.");
        // TODO (Phase 2): Implement logic. May involve re-applying parts of config or going to slide 0.
        this._updateDebugSlideIndex(0, "reset");
        this._dispatchEvent('reset');
    }

    // --- Lifecycle Callbacks ---
    connectedCallback() {
        this.#logger.info(`Component connected to DOM. Version: ${this.version}. Theme API: ${this.themeApiVersion}. Accessibility API: ${this.accessibilityApiVersion}.`);
        if (!this.#isExternalLoggerInjected) {
            this.#logger.warn("CRITICAL WARNING: No external production logger injected. Using default console logger. NOT SUITABLE FOR CLINICAL PRODUCTION. Inject logger via 'logger' property.");
        }

        if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
        
        const initialAriaLabel = this.#internalConfig?.accessibility?.carouselLabel || DEFAULT_HOST_LABEL;
        if (!this.hasAttribute('aria-label') || this.getAttribute('aria-label') !== initialAriaLabel) {
            this.setAttribute('aria-label', initialAriaLabel);
        }

        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

        this._renderScaffold();
        this._attachInternalEventListeners();
        this._setInitialFocus(); // Set initial focus

        if (this.#internalConfig) {
            this._applyFullConfig();
        } else {
            this.#logger.error("Component connected but no valid configuration has been set. Displaying fail-safe state. Provide config via 'config' property.");
            this._renderFailSafe("Carousel configuration missing.");
            this._dispatchEvent('error', { errorCode: 'CONFIG_MISSING_ON_CONNECT', reason: 'Configuration not set upon connection.' });
        }

        this._dispatchEvent('carouselReady', {
            version: this.version,
            supportedThemeApi: this.themeApiVersion,
            supportedAccessibilityApi: this.accessibilityApiVersion,
            initialConfigPresent: !!this.#internalConfig,
            loggerInjected: this.#isExternalLoggerInjected
        });
    }

    disconnectedCallback() {
        this.#logger.info("Component disconnected from DOM. Cleaning up event listeners.");
        if (this.#cancelButtonEl) {
            this.#cancelButtonEl.removeEventListener('click', this._handleCancelClick);
        }
        this.removeEventListener('keydown', this._handleHostKeydown);
        // TODO (Phase 2+): Clear timers, disconnect IntersectionObservers.
    }

    // --- Rendering & DOM Management ---
    _renderScaffold() {
        this.#logger.debug("Rendering scaffold structure into Shadow DOM.");
        this.#shadow.innerHTML = `
            <style>
                :host {
                    display: block; width: 100%; height: 100%; position: relative; overflow: hidden;
                    background: var(--ve-cw-component-background, #f0f0f0);
                    color: var(--ve-cw-primary-text-color, #333);
                    font-family: var(--ve-cw-font-family, sans-serif);
                    font-size: var(--ve-cw-base-font-size, 16px);
                    outline: none;
                }
                :host(:focus-visible) {
                     box-shadow: 0 0 0 3px var(--ve-cw-focus-indicator-host-shadow, rgba(0, 90, 180, 0.6));
                     border-radius: 2px;
                }
                .container__waitroom { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
                .slides-area__waitroom { flex-grow: 1; width: 100%; display: flex; flex-direction:column; align-items: center; justify-content: center; position: relative; overflow: hidden; border: 1px dashed var(--ve-cw-debug-border-color, #ccc); min-height: 250px; padding: 1em; }
                .slides-area__waitroom-message { padding: 1rem; font-style: italic; color: var(--ve-cw-placeholder-text-color, #555); text-align: center; }
                .debug-slide-info { font-size: 0.9em; color: #777; margin-top: 10px; }
                .cancel-button__waitroom {
                    position: absolute; top: 1rem; right: 1rem; padding: 0.6rem 1.2rem;
                    background-color: var(--ve-cw-cancel-button-bg, #d9534f);
                    color: var(--ve-cw-cancel-button-text, white);
                    border: none; border-radius: var(--ve-cw-cancel-button-radius, 4px);
                    cursor: pointer; z-index: 1000; font-size: var(--ve-cw-cancel-button-font-size, 0.9rem);
                }
                .cancel-button__waitroom:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 0.25rem var(--ve-cw-focus-indicator-button-shadow, rgba(217, 83, 79, 0.5));
                }
                .bot-message-area__waitroom {
                    position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%); width: auto; max-width: 90%;
                    padding: 0.75rem 1.25rem;
                    background-color: var(--ve-cw-bot-message-background, rgba(0,0,0,0.85));
                    color: var(--ve-cw-bot-message-text-color, white);
                    border-radius: var(--ve-cw-bot-message-border-radius, 4px);
                    text-align: center; z-index: 900; display: none;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    font-size: var(--ve-cw-bot-message-font-size, 0.95rem);
                }
                /* Tiered bot messages (basic example) */
                .bot-message-area__waitroom.tier-low { border-left: 5px solid var(--ve-cw-bot-message-tier-low-accent, #5bc0de); }
                .bot-message-area__waitroom.tier-high { border-left: 5px solid var(--ve-cw-bot-message-tier-high-accent, #f0ad4e); background-color: var(--ve-cw-bot-message-tier-high-bg, rgba(50,50,50,0.9));}
                .bot-message-area__waitroom.tier-critical { border: none; background-color: var(--ve-cw-bot-message-tier-critical-bg, #d9534f); color: var(--ve-cw-bot-message-tier-critical-text, white); }

                .fail-safe__message { padding: 2rem; text-align: center; font-weight: bold; font-size: 1.1rem; color: var(--ve-cw-error-text-color, #721c24); background-color: var(--ve-cw-error-bg-color, #f8d7da); border: 1px solid var(--ve-cw-error-border-color, #f5c6cb); border-radius: 4px;}
                .aria-live-region { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
            </style>
            <div class="container__waitroom" id="waitroom-container-host-id">
                <div class="slides-area__waitroom" id="slide-display-area-id">
                    <p class="slides-area__waitroom-message">Carousel initializing...</p>
                    <div class="debug-slide-info" id="debug-slide-info-id">Current Placeholder Slide: 0</div>
                </div>
                <button class="cancel-button__waitroom" id="cancel-btn-id" aria-label="Cancel Current Operation">
                    Cancel
                </button>
                <div class="bot-message-area__waitroom" id="bot-message-area-id" aria-hidden="true" role="status" aria-live="polite" aria-atomic="true">
                    </div>
                <div class="aria-live-region" id="aria-live-region-id" aria-live="polite" aria-atomic="true"></div>
            </div>
        `;

        this.#containerEl = this.#shadow.getElementById('waitroom-container-host-id');
        this.#slideDisplayAreaEl = this.#shadow.getElementById('slide-display-area-id');
        this.#cancelButtonEl = this.#shadow.getElementById('cancel-btn-id');
        this.#botMessageAreaEl = this.#shadow.getElementById('bot-message-area-id');
        this.#ariaLiveRegionEl = this.#shadow.getElementById('aria-live-region-id');

        this.#logger.debug("Scaffold DOM elements assigned. Initial styles applied.");
    }

    _applyFullConfig() {
        if (!this.#internalConfig || !this.isConnected) {
            this.#logger.debug("Skipping _applyFullConfig: Config not ready or component not connected.");
            return;
        }
        this.#logger.info("Applying full configuration to component.");
        this._resetInternalState(); // Reset state before applying new config

        this._applyTheme(this.#internalConfig.theme || {});
        this._renderSlides(this.#internalConfig.slides || []);

        const hostLabel = this.#internalConfig.accessibility?.carouselLabel || DEFAULT_HOST_LABEL;
        if (this.getAttribute('aria-label') !== hostLabel) {
            this.setAttribute('aria-label', hostLabel);
            this.#logger.debug(`Host aria-label updated to: "${hostLabel}"`);
        }
        // TODO (Phase 2): Apply other accessibility settings.
        // TODO (Phase 2): Restart/configure autoplay from this.#internalConfig.carousel.
    }

    _resetInternalState() {
        this.#logger.debug("Resetting internal component state before applying new config.");
        // Clear slide display area for re-rendering
        if (this.#slideDisplayAreaEl) {
            this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">Re-configuring slides...</p> <div class="debug-slide-info" id="debug-slide-info-id">Current Placeholder Slide: 0</div>`; // Keep debug info placeholder
        }
        // Reset placeholder slide index for keyboard nav demo
        this.#debugCurrentSlideIndex = 0;
        this.#debugTotalSlides = this.#internalConfig?.slides?.length || 0;
        this._updateDebugSlideDisplay();

        // TODO (Phase 2+): Reset autoplay timers, current slide index, etc.
    }


    /** @param {object} themeConfig */
    _applyTheme(themeConfig) {
        this.#logger.info("Applying theme configuration.", { themeConfigDetails: themeConfig });
        // Phase 1: Set at least one CSS custom property for testability.
        const fallbackBg = '#f8f8f8'; // A distinct fallback for testing
        const actualBg = this._validateCssColor(themeConfig.componentBackground, fallbackBg);
        this.style.setProperty('--ve-cw-component-background', actualBg);
        this.#logger.debug(`CSS var --ve-cw-component-background set to: ${actualBg}`);

        // Example: Apply accent color for focus indicators
        const accentColor = this._validateCssColor(themeConfig.accentColor, 'blue');
        this.style.setProperty('--ve-cw-focus-indicator-host-shadow', `rgba(${this._hexToRgb(accentColor)?.join(',') || '0,123,255'}, 0.5)`);
        this.style.setProperty('--ve-cw-focus-indicator-button-shadow', `rgba(${this._hexToRgb(this._validateCssColor(themeConfig.cancelButtonBackground, '#dc3545'))?.join(',') || '220,53,69'}, 0.5)`);


        // TODO (Phase 2): Iterate all properties from ThemeSettingsV1, validate, and set corresponding CSS vars.
        // For each: this.style.setProperty(CSS_VAR_NAME, validatedValue);
        this._dispatchEvent('themeApplied', { theme: themeConfig });
        // Test Harness Check: Verify CSS custom properties are set on host element.
    }

    /** @param {Array<object>} slidesConfig */
    _renderSlides(slidesConfig) {
        this.#logger.info(`Preparing to render ${slidesConfig.length} slides.`);
        this.#debugTotalSlides = slidesConfig.length;
        this.#debugCurrentSlideIndex = 0; // Reset placeholder index

        if (this.#slideDisplayAreaEl) {
            if (slidesConfig.length > 0) {
                // In Phase 1, just update the placeholder text. Full rendering in Phase 2.
                this._updateDebugSlideDisplay();
            } else {
                const noSlidesText = this.#internalConfig?.accessibility?.noSlidesText || "No information to display at this time.";
                this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">${noSlidesText}</p>`;
                this._announceToScreenReader(noSlidesText);
            }
        }
        // TODO (Phase 2): Implement actual slide element creation, lazy loading, media handling.
        // Dispatch 'slideChanged' event after the first slide is conceptually "rendered".
        if (slidesConfig.length > 0) {
            this._dispatchEvent('slideChanged', { currentIndex: 0, slideData: slidesConfig[0], totalSlides: slidesConfig.length });
        }
    }

    _renderFailSafe(message) {
        this.#logger.error("Entering fail-safe rendering mode.", { failMessage: message });
        if (!this.#shadow || !this.#shadow.firstChild) {
            this._renderScaffold(); // Ensure scaffold exists
        }
        const targetArea = this.#slideDisplayAreaEl || this.#containerEl;
        if (targetArea) {
            targetArea.innerHTML = `<div class="fail-safe__message">${message}</div>`;
        } else {
            this.#shadow.innerHTML = `<div style="color:red; padding:1em; border:2px solid red;">${message} (Critical render failure)</div>`;
        }
        this._announceToScreenReader(`Error: ${message}`);
        this._dispatchEvent('criticalError', { errorCode: 'FAIL_SAFE_RENDER', reason: message });
    }

    _setInitialFocus() {
        // In a more complex component, you might focus the first interactive slide element.
        // For Phase 1, focusing the host allows keyboard navigation to begin.
        // Or focus the cancel button if it's the primary initial action.
        if (this.#cancelButtonEl) {
            // this.#cancelButtonEl.focus();
            // this.#logger.debug("Initial focus set to cancel button.");
             this.focus(); // Focus the host element itself for carousel-level keyboard nav
             this.#logger.debug("Initial focus set to host element.");
        } else {
            this.focus();
            this.#logger.debug("Initial focus set to host element (cancel button not found).");
        }
    }

    // --- Internal Event Handling & Keyboard Navigation ---
    _attachInternalEventListeners() {
        if (this.#cancelButtonEl) {
            this.#cancelButtonEl.addEventListener('click', () => this._handleCancelClick());
        }
        this.addEventListener('keydown', (event) => this._handleHostKeydown(event));
        this.#logger.debug("Internal event listeners for cancel button and host keydown attached.");
    }

    _handleCancelClick() {
        this.#logger.info("Cancel button clicked by user.");
        this._dispatchEvent('userCancelled', { timestamp: Date.now(), reason: 'cancel_button_click' });
    }

    /** @param {KeyboardEvent} event */
    _handleHostKeydown(event) {
        this.#logger.debug(`Host keydown: Key='${event.key}', Code='${event.code}'`);
        let handled = false;
        const totalSlides = this.#debugTotalSlides; // Use the placeholder total

        if (totalSlides === 0 && event.key !== "Escape") return; // No slides, only Escape works

        switch (event.key) {
            case "Escape":
                this.#logger.info("Escape key pressed. Triggering cancel action.");
                this._handleCancelClick(); // Map Escape to cancel
                handled = true;
                break;
            case "ArrowLeft":
            case "ArrowUp": // Common alternative for previous
                this.#logger.info("ArrowLeft/Up key pressed.");
                if (totalSlides > 0) {
                    const newIndex = (this.#debugCurrentSlideIndex - 1 + totalSlides) % totalSlides;
                    this._updateDebugSlideIndex(newIndex, "keyboard_prev");
                }
                handled = true;
                break;
            case "ArrowRight":
            case "ArrowDown": // Common alternative for next
            case " ": // Space bar for next
                this.#logger.info("ArrowRight/Down/Space key pressed.");
                 if (totalSlides > 0) {
                    const newIndex = (this.#debugCurrentSlideIndex + 1) % totalSlides;
                    this._updateDebugSlideIndex(newIndex, "keyboard_next");
                }
                handled = true;
                break;
            case "Home":
                this.#logger.info("Home key pressed.");
                if (totalSlides > 0) this._updateDebugSlideIndex(0, "keyboard_home");
                handled = true;
                break;
            case "End":
                this.#logger.info("End key pressed.");
                if (totalSlides > 0) this._updateDebugSlideIndex(totalSlides - 1, "keyboard_end");
                handled = true;
                break;
        }

        if (handled) {
            event.preventDefault();
            this.#logger.debug(`Key "${event.key}" handled, default action prevented.`);
        }
        // Test Harness Check: Verify keys update #debug-slide-info-id and aria-live region.
    }

    _updateDebugSlideIndex(newIndex, trigger) {
        this.#debugCurrentSlideIndex = newIndex;
        this.#logger.info(`Placeholder slide index changed to ${newIndex} by ${trigger}.`);
        this._updateDebugSlideDisplay();
        const announcement = `Slide ${newIndex + 1} of ${this.#debugTotalSlides}.`;
        this._announceToScreenReader(announcement);

        // Dispatch stubbed slideChanged event
        this._dispatchEvent('slideChanged', {
            currentIndex: this.#debugCurrentSlideIndex,
            totalSlides: this.#debugTotalSlides,
            trigger: trigger,
            // slideData: this.#internalConfig?.slides[this.#debugCurrentSlideIndex] // Add in Phase 2
        });
    }

    _updateDebugSlideDisplay() {
        const debugInfoEl = this.#shadow.getElementById('debug-slide-info-id');
        if (debugInfoEl) {
            if (this.#debugTotalSlides > 0) {
                debugInfoEl.textContent = `Current Placeholder Slide: ${this.#debugCurrentSlideIndex + 1} of ${this.#debugTotalSlides}`;
            } else {
                debugInfoEl.textContent = "No slides loaded for placeholder navigation.";
            }
        }
    }

    _announceToScreenReader(message) {
        if (this.#ariaLiveRegionEl) {
            this.#ariaLiveRegionEl.textContent = message;
            this.#logger.debug(`Announced to screen reader (aria-live): "${message}"`);
        } else {
            this.#logger.warn("Attempted to announce to screen reader, but ARIA live region element is not found.");
        }
    }

    // --- Event Dispatch Helper (Defensive Guard for detail) ---
    _dispatchEvent(eventName, detailPayload = {}) { // Default detail to empty object
        if (!this.isConnected) {
            this.#logger.warn(`Attempted to dispatch "${eventName}" while disconnected. Event not sent.`, { detailPayload });
            return;
        }
        // Ensure detail is always an object
        const detail = (typeof detailPayload === 'object' && detailPayload !== null) ? detailPayload : {};

        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
        this.#logger.debug(`Dispatched event: "${eventName}"`, detail);
    }

    // --- Helper for theme validation (example) ---
    _validateCssColor(colorString, defaultValue) {
        if (typeof colorString === 'string') {
            const s = new Option().style;
            s.color = colorString;
            if (s.color !== '') return colorString;
        }
        this.#logger.warn(`Invalid CSS color value "${colorString}". Using default "${defaultValue}".`);
        this._dispatchEvent('error', { errorCode: 'THEME_INVALID_COLOR', propertyValue: colorString, fallbackValue: defaultValue});
        return defaultValue;
    }
     _hexToRgb(hex) { // Basic helper for RGBA conversion for box-shadows etc.
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return null;
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) { // #RGB
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) { // #RRGGBB
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        } else {
            return null; // Invalid hex
        }
        return [r, g, b];
    }
}

// --- Define the custom element (guarded) ---
if (!customElements.get('ve-carousel-waitroom')) {
    customElements.define('ve-carousel-waitroom', VECarouselWaitroom);
}

/*
================================================================================
MANUAL TEST HARNESS CHECKLIST FOR PHASE 1 (ve-carousel-waitroom.js)
================================================================================

Developer/Tester: After integrating this scaffold into `test-carousel.html` (or similar):

1.  LOGGER INJECTION:
    [ ] Verify: If no logger is passed to `carousel.logger`, a "CRITICAL WARNING" about using default logger appears in the console on connect.
    [ ] Verify: If a valid custom logger (implementing ILogger) is passed to `carousel.logger` *before* `connectedCallback` (i.e. before appending to DOM), subsequent logs (like in `connectedCallback`) use the custom logger and its prefix.
        Example:
        const el = document.createElement('ve-carousel-waitroom');
        el.logger = new MyCustomTestLogger(); // Set logger
        document.body.appendChild(el);       // Then connect
    [ ] Verify: If an invalid logger object is passed, a warning is logged, and the component continues with its previous/default logger.

2.  CONFIGURATION & FAIL-SAFE:
    [ ] Verify: If `carousel.config` is set with `null` or a non-object, an error is logged, and the fail-safe message "Invalid configuration provided to carousel." appears in the component's shadow DOM. An 'error' event with 'INVALID_CONFIG' is dispatched.
    [ ] Verify: If `carousel.config` is set with an object missing `slides` array, an error is logged, fail-safe message appears, and an 'error' event with 'INVALID_CONFIG_SLIDES' is dispatched.
    [ ] Verify: If `config.theme` or `config.accessibility` are missing/invalid, warnings are logged, defaults are used, and the component still initializes.
    [ ] Verify: If a valid minimal config (`{slides: [], theme:{}, accessibility:{}}`) is set, the `carouselReady` event detail contains `initialConfigPresent: true`. The component should show "No slides to display" or similar (from default accessibility config).
    [ ] Verify: Setting a new valid config updates the component (e.g., `debugTotalSlides` changes, host `aria-label` updates). A `configApplied` event is dispatched.

3.  API & VERSIONING:
    [ ] Verify: `carousel.version` returns "1.0.0".
    [ ] Verify: `carousel.themeApiVersion` returns "1.0".
    [ ] Verify: `carousel.accessibilityApiVersion` returns "1.0".
    [ ] Verify: Calling stubbed methods (`freeze`, `thaw`, `play`, `pause`, `goToSlide`, `reset`, `showBotMessage`) logs their invocation. `showBotMessage` makes the bot message area visible with text.

4.  ACCESSIBILITY (BASIC):
    [ ] Verify: Host element (`<ve-carousel-waitroom>`) has `role="region"` and `tabindex="0"`.
    [ ] Verify: Host element has an `aria-label` (default or from config.accessibility.carouselLabel).
    [ ] Verify: Cancel button (`#cancel-btn-id` in shadow DOM) has an `aria-label`.
    [ ] Verify: Cancel button is focusable via Tab key.
    [ ] Verify: Host element is focusable via Tab key. Tab order should be logical (e.g., host, then cancel button, or vice-versa depending on layout).
    [ ] Verify: When host or cancel button has focus, a visible focus indicator (`box-shadow`) appears (testable with keyboard only).
    [ ] Verify (with axe-core or similar browser extension): Run on test page. Expect minimal or no automated violations for this scaffold.
    [ ] Verify (Manual Screen Reader - NVDA/VoiceOver):
        [ ] On focusing host, its role and label are announced.
        [ ] On focusing cancel button, its role and label are announced.
        [ ] ARIA live region (`#aria-live-region-id`) is present in DOM (though empty initially).

5.  KEYBOARD NAVIGATION (PLACEHOLDER):
    [ ] Verify: With focus on the host element:
        [ ] Pressing `ArrowRight` or `ArrowDown` or `Space` updates the "Current Placeholder Slide" text in shadow DOM to the next slide (loops). An announcement like "Slide X of Y" is made to the ARIA live region. A `slideChanged` event is dispatched.
        [ ] Pressing `ArrowLeft` or `ArrowUp` updates to the previous slide (loops), announces, and dispatches event.
        [ ] Pressing `Home` updates to "Slide 1 of Y", announces, and dispatches event.
        [ ] Pressing `End` updates to "Slide Y of Y", announces, and dispatches event.
        [ ] Pressing `Escape` triggers the "Cancel button clicked" log and dispatches `userCancelled` event.
    [ ] Verify: Log messages in console confirm key presses and default prevention.

6.  THEMING (PLACEHOLDER):
    [ ] Verify: After setting a `config` with a `theme` object (e.g., `{ componentBackground: 'purple' }`), inspect the host element's inline styles. It should have `--ve-cw-component-background: purple;` (or the fallback if value was invalid). A `themeApplied` event is dispatched.
    [ ] Verify: If an invalid color is provided for `componentBackground`, a warning is logged, and the fallback color is used for the CSS variable. An `error` event for 'THEME_INVALID_COLOR' is dispatched.

7.  EVENT DISPATCH:
    [ ] Verify: `carouselReady` event is dispatched on `connectedCallback` with correct detail payload.
    [ ] Verify: `userCancelled` event (bubbles, composed) is dispatched on cancel button click or Escape key, with correct detail.
    [ ] Verify: Other stubbed events (`error`, `configApplied`, `themeApplied`, `slideChanged`, `botMessageShown/Dismissed`, `frozen`, `thawed`, `playTriggered`, `pauseTriggered`, `reset`) are dispatched when their corresponding actions/stubs are called, with non-null `detail` objects.

8.  ROBUST RE-RENDERING / STATE RESET:
    [ ] Set an initial valid config.
    [ ] Set a subsequent invalid config (e.g., `config = null`). Verify fail-safe mode.
    [ ] Set a new valid config. Verify the component recovers, clears the fail-safe message, and applies the new config correctly (e.g., placeholder slide info updates).
================================================================================
*/
