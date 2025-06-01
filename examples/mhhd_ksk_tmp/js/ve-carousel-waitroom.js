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

const COMPONENT_VERSION = "1.0.0"; // Phase 1 sign-off was based on this.
const THEME_API_VERSION = "1.0";
const ACCESSIBILITY_API_VERSION = "1.0";
const DEFAULT_HOST_LABEL = "Waitroom Information Carousel";
const DEFAULT_CANCEL_BUTTON_ARIA_LABEL = "Cancel current operation";

// Default theme values relevant to the cancel button (to be part of full default theme object later)
const DEFAULT_THEME_VALUES = {
    cancelButtonBackground: '#dc3545', // Danger Red
    cancelButtonIconColor: '#ffffff',  // White
    cancelButtonSize: '60px',
    cancelButtonMobileSize: '50px', // For smaller screens
    cancelButtonRadius: '50%',
    cancelButtonOffsetTop: '2rem',
    cancelButtonOffsetRight: '2rem',
    cancelButtonShadow: '0 4px 16px rgba(0,0,0,0.2)',
    cancelButtonFocusRingColor: 'rgba(220, 53, 69, 0.5)', // Derived from its own background
    accentColor: '#007bff' // General accent for other focus rings
};


class VECarouselWaitroom extends HTMLElement {
    #logger;
    #isExternalLoggerInjected = false;
    #internalConfig = null;
    #shadow;

    #containerEl = null;
    #slideDisplayAreaEl = null;
    #cancelButtonEl = null;
    #botMessageAreaEl = null;
    #ariaLiveRegionEl = null;

    #debugTotalSlides = 0;
    #debugCurrentSlideIndex = 0;

    // Internal bound event handlers
    #boundHandleCancelClick;
    #boundHandleHostKeydown;


    static get observedAttributes() {
        return [];
    }

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: 'open' });

        this.#logger = new ConsoleLogger({
            component: 'VECarouselWaitroom',
            level: LogLevel.INFO
        });
        this.#logger.info(`Constructor: Component instance created. Version: ${this.version}. Default logger active.`);

        this.#boundHandleCancelClick = this._handleCancelClick.bind(this);
        this.#boundHandleHostKeydown = this._handleHostKeydown.bind(this);
    }

    set logger(newLogger) {
        if (newLogger && typeof newLogger.info === 'function' && typeof newLogger.error === 'function') {
            this.#logger = newLogger;
            this.#isExternalLoggerInjected = true;
            this.#logger.info("External logger injected successfully.");
        } else {
            this.#logger.warn("Attempted to inject an invalid logger. Continuing with current logger.");
        }
    }

    get logger() {
        return this.#logger;
    }

    get version() { return COMPONENT_VERSION; }
    get themeApiVersion() { return THEME_API_VERSION; }
    get accessibilityApiVersion() { return ACCESSIBILITY_API_VERSION; }

    set config(newConfig) {
        this.#logger.info("Configuration received.", { configObjectReceived: !!newConfig });

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
            slides: newConfig.slides,
            theme: (typeof newConfig.theme === 'object' && newConfig.theme !== null) ? newConfig.theme : {},
            accessibility: (typeof newConfig.accessibility === 'object' && newConfig.accessibility !== null) ? newConfig.accessibility : {},
            carousel: (typeof newConfig.carousel === 'object' && newConfig.carousel !== null) ? newConfig.carousel : {}
        };

        if (!validatedConfig.theme) this.#logger.warn("Config: 'theme' missing, using defaults.");
        if (!validatedConfig.accessibility) this.#logger.warn("Config: 'accessibility' missing, using defaults.");
        if (!validatedConfig.carousel) this.#logger.warn("Config: 'carousel' settings missing, using defaults.");

        this.#internalConfig = validatedConfig;
        this.#logger.info("Configuration processed and stored.");
        this._dispatchEvent('configApplied', { config: this.#internalConfig });

        if (this.isConnected) {
            this._applyFullConfig();
        }
    }

    get config() {
        return this.#internalConfig;
    }

    freeze() {
        this.#logger.info("API CALL: freeze() invoked.");
        this._internalPauseActivity('freeze_api');
        this._dispatchEvent('frozen');
    }

    thaw() {
        this.#logger.info("API CALL: thaw() invoked.");
        // TODO (Phase 2/3): Resume autoplay, etc. For now, just log.
        // this._internalResumeActivity('thaw_api');
        this._dispatchEvent('thawed');
    }

    showBotMessage(message, options = {}) {
        const { tier = 'low', duration = 5000 } = options;
        this.#logger.info("API CALL: showBotMessage() invoked.", { message, tier, duration });
        if (this.#botMessageAreaEl) {
            this.#botMessageAreaEl.innerHTML = ''; // Clear previous content
            const messageP = document.createElement('p');
            messageP.textContent = message; // Text content for security
            this.#botMessageAreaEl.appendChild(messageP);

            this.#botMessageAreaEl.className = `bot-message-area__waitroom tier-${tier}`;
            this.#botMessageAreaEl.style.display = 'block';
            this.#botMessageAreaEl.setAttribute('aria-hidden', 'false');
            this._announceToScreenReader(`Notification: ${message}`);
            this._dispatchEvent('botMessageShown', { message, tier });

            if (tier !== 'critical' && duration > 0) {
                // TODO: Manage timeouts for bot messages properly (e.g., clear previous if new one comes)
                setTimeout(() => {
                    if (this.#botMessageAreaEl && this.#botMessageAreaEl.style.display === 'block' && this.#botMessageAreaEl.textContent.includes(message)) {
                        this.#botMessageAreaEl.style.display = 'none';
                        this.#botMessageAreaEl.setAttribute('aria-hidden', 'true');
                        this._dispatchEvent('botMessageDismissed', { message, tier });
                    }
                }, duration);
            }
        } else {
            this.#logger.warn("showBotMessage called, but bot message area is not available.");
        }
    }

    play() {
        this.#logger.info("API CALL: play() invoked.");
        // TODO (Phase 2): Start/resume autoplay. For now, links to _internalResumeActivity
        // this._internalResumeActivity('play_api');
        this._dispatchEvent('playTriggered');
    }

    /** Pauses autoplay. */
    pause() {
        this.#logger.info("API CALL: pause() invoked.");
        this._internalPauseActivity('pause_api'); // Call the internal method to do the work
        // The event is dispatched here, after the internal logic is called.
        this._dispatchEvent('pauseTriggered', { reason: 'pause_api_called' });
    }

    goToSlide(index) {
        this.#logger.info("API CALL: goToSlide() invoked.", { index });
        if (this.#internalConfig && index >= 0 && index < this.#debugTotalSlides) {
            this._updateDebugSlideIndex(index, "API");
        } else {
            this.#logger.warn(`goToSlide: Invalid index ${index} or no slides.`);
            this._dispatchEvent('error', { errorCode: 'INVALID_SLIDE_INDEX', reason: `Attempted to go to invalid slide index: ${index}` });
        }
    }

    reset() {
        this.#logger.info("API CALL: reset() invoked.");
        this._updateDebugSlideIndex(0, "reset_api");
        // TODO (Phase 2): Fully reset internal state to reflect first slide, clear bot messages, etc.
        this._dispatchEvent('reset');
    }

    connectedCallback() {
        this.#logger.info(`Component connected. Version: ${this.version}. Theme API: ${this.themeApiVersion}. Accessibility API: ${this.accessibilityApiVersion}.`);
        if (!this.#isExternalLoggerInjected) {
            this.#logger.warn("CRITICAL WARNING: No external production logger injected. Using default. NOT SUITABLE FOR CLINICAL PRODUCTION.");
        }

        if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
        const initialAriaLabel = this.#internalConfig?.accessibility?.carouselLabel || DEFAULT_HOST_LABEL;
        this.setAttribute('aria-label', initialAriaLabel);
        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

        this._renderScaffold();
        this._attachInternalEventListeners();
        this._setInitialFocus();

        if (this.#internalConfig) {
            this._applyFullConfig();
        } else {
            this.#logger.error("Component connected but no config set. Displaying fail-safe. Provide config via 'config' property.");
            this._renderFailSafe("Carousel configuration missing.");
            this._dispatchEvent('error', { errorCode: 'CONFIG_MISSING_ON_CONNECT', reason: 'Config not set on connection.' });
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
        this.#logger.info("Component disconnected. Cleaning up.");
        if (this.#cancelButtonEl) {
            this.#cancelButtonEl.removeEventListener('click', this.#boundHandleCancelClick);
        }
        this.removeEventListener('keydown', this.#boundHandleHostKeydown);
        // TODO (Phase 2+): Clear autoplay timers, disconnect IntersectionObservers.
    }

    _renderScaffold() {
        this.#logger.debug("Rendering scaffold structure into Shadow DOM.");
        this.#shadow.innerHTML = `
            <style>
                :host {
                    display: block; width: 100%; height: 100%; position: relative; overflow: hidden;
                    background: var(--ve-cw-component-background, #e9ecef);
                    color: var(--ve-cw-primary-text-color, #212529);
                    font-family: var(--ve-cw-font-family, system-ui, sans-serif);
                    font-size: var(--ve-cw-base-font-size, 1rem);
                    outline: none;
                }
                :host(:focus-visible) {
                     box-shadow: 0 0 0 3px var(--ve-cw-focus-indicator-host-shadow, rgba(0, 90, 180, 0.6));
                     border-radius: 2px;
                }
                .container__waitroom { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
                .slides-area__waitroom { flex-grow: 1; width: 100%; display: flex; flex-direction:column; align-items: center; justify-content: center; position: relative; overflow: hidden; border: 1px dashed var(--ve-cw-debug-border-color, #adb5bd); min-height: 250px; padding: 1em; }
                .slides-area__waitroom-message { padding: 1rem; font-style: italic; color: var(--ve-cw-placeholder-text-color, #555); text-align: center; }
                .debug-slide-info { font-size: 0.9em; color: #777; margin-top: 10px; }

                .cancel-button__waitroom {
                    /* From POC & Spec */
                    position: absolute;
                    top: var(--ve-cw-cancel-button-offset-top, ${DEFAULT_THEME_VALUES.cancelButtonOffsetTop});
                    right: var(--ve-cw-cancel-button-offset-right, ${DEFAULT_THEME_VALUES.cancelButtonOffsetRight});
                    width: var(--ve-cw-cancel-button-size, ${DEFAULT_THEME_VALUES.cancelButtonSize});
                    height: var(--ve-cw-cancel-button-size, ${DEFAULT_THEME_VALUES.cancelButtonSize});
                    background: var(--ve-cw-cancel-button-background, ${DEFAULT_THEME_VALUES.cancelButtonBackground});
                    border: none;
                    border-radius: var(--ve-cw-cancel-button-radius, ${DEFAULT_THEME_VALUES.cancelButtonRadius});
                    cursor: pointer;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0; /* Remove padding if using SVG for size control */
                    transition: transform 0.1s ease-out, background-color 0.2s ease;
                    box-shadow: var(--ve-cw-cancel-button-shadow, ${DEFAULT_THEME_VALUES.cancelButtonShadow});
                }
                .cancel-button__waitroom:hover {
                    background-color: var(--ve-cw-cancel-button-background-hover, ${this._adjustColor(DEFAULT_THEME_VALUES.cancelButtonBackground, -0.1)}); /* Darken slightly */
                    transform: scale(1.05);
                }
                .cancel-button__waitroom:active {
                    transform: scale(0.95);
                }
                .cancel-button__waitroom .icon__cancel {
                    width: 50%; /* Relative to button size */
                    height: 50%; /* Relative to button size */
                    fill: var(--ve-cw-cancel-button-icon-color, ${DEFAULT_THEME_VALUES.cancelButtonIconColor});
                }
                .cancel-button__waitroom:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 0.25rem var(--ve-cw-cancel-button-focus-ring-color, ${DEFAULT_THEME_VALUES.cancelButtonFocusRingColor});
                }

                .bot-message-area__waitroom {
                    /* Basic styles, to be enhanced by ThemeSettingsV1 in _applyTheme */
                    position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%); width: auto; max-width: 90%;
                    padding: 0.75rem 1.25rem;
                    background-color: var(--ve-cw-bot-message-background, rgba(0,0,0,0.85));
                    color: var(--ve-cw-bot-message-text-color, white);
                    border-radius: var(--ve-cw-bot-message-border-radius, 4px);
                    text-align: center; z-index: 900; display: none;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    font-size: var(--ve-cw-bot-message-font-size, 0.95rem);
                }
                /* Tiered bot messages - example styling, theme will override via CSS vars */
                .bot-message-area__waitroom.tier-low { border-left: 5px solid var(--ve-cw-bot-message-tier-low-accent, #5bc0de); }
                .bot-message-area__waitroom.tier-high { border-left: 5px solid var(--ve-cw-bot-message-tier-high-accent, #f0ad4e); background-color: var(--ve-cw-bot-message-tier-high-bg, rgba(50,50,50,0.9));}
                .bot-message-area__waitroom.tier-critical { border: none; background-color: var(--ve-cw-bot-message-tier-critical-bg, #d9534f); color: var(--ve-cw-bot-message-tier-critical-text, white); }

                .fail-safe__message { padding: 2rem; text-align: center; font-weight: bold; font-size: 1.1rem; color: var(--ve-cw-error-text-color, #721c24); background-color: var(--ve-cw-error-bg-color, #f8d7da); border: 1px solid var(--ve-cw-error-border-color, #f5c6cb); border-radius: 4px;}
                .aria-live-region { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }

                /* Responsive size for cancel button icon */
                @media (max-width: 768px) {
                    .cancel-button__waitroom {
                        width: var(--ve-cw-cancel-button-mobile-size, ${DEFAULT_THEME_VALUES.cancelButtonMobileSize});
                        height: var(--ve-cw-cancel-button-mobile-size, ${DEFAULT_THEME_VALUES.cancelButtonMobileSize});
                        top: var(--ve-cw-cancel-button-mobile-offset-top, 1rem);
                        right: var(--ve-cw-cancel-button-mobile-offset-right, 1rem);
                    }
                }
            </style>
            <div class="container__waitroom" id="waitroom-container-host-id">
                <div class="slides-area__waitroom" id="slide-display-area-id">
                    <p class="slides-area__waitroom-message">Carousel initializing...</p>
                    <div class="debug-slide-info" id="debug-slide-info-id">Current Placeholder Slide: 0</div>
                </div>
                <button class="cancel-button__waitroom" id="cancel-btn-id" type="button">
                    <svg class="icon__cancel" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    </button>
                <div class="bot-message-area__waitroom" id="bot-message-area-id" aria-hidden="true" role="status" aria-live="polite" aria-atomic="true"></div>
                <div class="aria-live-region" id="aria-live-region-id" aria-live="polite" aria-atomic="true"></div>
            </div>
        `;

        this.#containerEl = this.#shadow.getElementById('waitroom-container-host-id');
        this.#slideDisplayAreaEl = this.#shadow.getElementById('slide-display-area-id');
        this.#cancelButtonEl = this.#shadow.getElementById('cancel-btn-id');
        this.#botMessageAreaEl = this.#shadow.getElementById('bot-message-area-id');
        this.#ariaLiveRegionEl = this.#shadow.getElementById('aria-live-region-id');
        this.#logger.debug("Scaffold DOM elements assigned and initial styles applied.");
    }

    _applyFullConfig() {
        if (!this.#internalConfig || !this.isConnected) {
            this.#logger.debug("Skipping _applyFullConfig: Config not ready or component not connected.");
            return;
        }
        this.#logger.info("Applying full configuration to component.");
        this._resetInternalState();

        // Apply theme first, so CSS vars are available for slide rendering if needed
        this._applyTheme(this.#internalConfig.theme || {});
        this._applyAccessibilitySettings(this.#internalConfig.accessibility || {});
        this._renderSlides(this.#internalConfig.slides || []); // Actual slide rendering in Phase 2

        // TODO (Phase 2): Restart/configure autoplay from this.#internalConfig.carousel.
    }

    _resetInternalState() {
        this.#logger.debug("Resetting internal component state.");
        if (this.#slideDisplayAreaEl) {
            this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">Re-configuring slides...</p> <div class="debug-slide-info" id="debug-slide-info-id">Current Placeholder Slide: 0</div>`;
        }
        this.#debugCurrentSlideIndex = 0;
        this.#debugTotalSlides = this.#internalConfig?.slides?.length || 0;
        this._updateDebugSlideDisplay();
        // TODO (Phase 2+): Clear autoplay timers, active slide elements, etc.
    }

    /** @param {object} themeConfig - ThemeSettingsV1 object */
    _applyTheme(themeConfig) {
        this.#logger.info("Applying theme configuration.", { receivedTheme: themeConfig });

        const setCssVar = (varName, value, defaultValue, validatorFn) => {
            const validatedValue = validatorFn ? validatorFn(value, defaultValue) : (value || defaultValue);
            this.style.setProperty(varName, validatedValue);
            this.#logger.debug(`CSS Var Set: ${varName} = ${validatedValue}`);
        };
        
        // Apply all theme properties from ThemeSettingsV1 using their CSS vars
        // This is just a small subset for demonstration; expand for all in themeguide.md
        setCssVar('--ve-cw-component-background', themeConfig.componentBackground, DEFAULT_THEME_VALUES.componentBackground, this._validateCssColor);
        setCssVar('--ve-cw-primary-text-color', themeConfig.primaryTextColor, DEFAULT_THEME_VALUES.primaryTextColor, this._validateCssColor);
        setCssVar('--ve-cw-font-family', themeConfig.fontFamily, 'sans-serif', this._validateFontFamily); // Assuming _validateFontFamily
        setCssVar('--ve-cw-base-font-size', themeConfig.baseFontSize, '1rem', this._validateCssSize); // Assuming _validateCssSize

        // Cancel Button Specific Theming
        setCssVar('--ve-cw-cancel-button-background', themeConfig.cancelButtonBackground, DEFAULT_THEME_VALUES.cancelButtonBackground, this._validateCssColor);
        setCssVar('--ve-cw-cancel-button-icon-color', themeConfig.cancelButtonIconColor, DEFAULT_THEME_VALUES.cancelButtonIconColor, this._validateCssColor);
        setCssVar('--ve-cw-cancel-button-size', themeConfig.cancelButtonSize, DEFAULT_THEME_VALUES.cancelButtonSize, this._validateCssSize);
        setCssVar('--ve-cw-cancel-button-mobile-size', themeConfig.cancelButtonMobileSize, DEFAULT_THEME_VALUES.cancelButtonMobileSize, this._validateCssSize);
        setCssVar('--ve-cw-cancel-button-radius', themeConfig.cancelButtonRadius, DEFAULT_THEME_VALUES.cancelButtonRadius, this._validateCssSize);
        setCssVar('--ve-cw-cancel-button-offset-top', themeConfig.cancelButtonOffsetTop, DEFAULT_THEME_VALUES.cancelButtonOffsetTop, this._validateCssSize);
        setCssVar('--ve-cw-cancel-button-offset-right', themeConfig.cancelButtonOffsetRight, DEFAULT_THEME_VALUES.cancelButtonOffsetRight, this._validateCssSize);
        setCssVar('--ve-cw-cancel-button-shadow', themeConfig.cancelButtonShadow, DEFAULT_THEME_VALUES.cancelButtonShadow, this._validateShadow); // Assuming _validateShadow
        setCssVar('--ve-cw-cancel-button-focus-ring-color', themeConfig.cancelButtonFocusRingColor, DEFAULT_THEME_VALUES.cancelButtonFocusRingColor, this._validateCssColor);
        
        // Accent color for general focus (fallback if specific not set)
        const accentColor = this._validateCssColor(themeConfig.accentColor, DEFAULT_THEME_VALUES.accentColor);
        setCssVar('--ve-cw-accent-color', accentColor);
        if (!themeConfig.cancelButtonFocusRingColor) { // If specific cancel button focus color not set, derive from accent
            this.style.setProperty('--ve-cw-cancel-button-focus-ring-color', `rgba(${this._hexToRgb(accentColor)?.join(',') || '0,123,255'}, 0.5)`);
        }
         if (!themeConfig.hostFocusIndicatorShadowColor) { // Example for host focus
            this.style.setProperty('--ve-cw-focus-indicator-host-shadow', `rgba(${this._hexToRgb(accentColor)?.join(',') || '0,90,180'}, 0.6)`);
        }


        this._dispatchEvent('themeApplied', { themeApplied: themeConfig });
    }

    /** @param {object} accessibilityConfig */
    _applyAccessibilitySettings(accessibilityConfig) {
        this.#logger.info("Applying accessibility configuration.", { accessibilityConfig });

        const hostLabel = accessibilityConfig.carouselLabel || DEFAULT_HOST_LABEL;
        if (this.getAttribute('aria-label') !== hostLabel) {
            this.setAttribute('aria-label', hostLabel);
            this.#logger.debug(`Host aria-label updated to: "${hostLabel}"`);
        }

        if (this.#cancelButtonEl) {
            const cancelLabel = accessibilityConfig.cancelButtonAriaLabel || DEFAULT_CANCEL_BUTTON_ARIA_LABEL;
            if (this.#cancelButtonEl.getAttribute('aria-label') !== cancelLabel) {
                this.#cancelButtonEl.setAttribute('aria-label', cancelLabel);
                this.#logger.debug(`Cancel button aria-label updated to: "${cancelLabel}"`);
            }
        }
        // TODO (Phase 3): Apply other accessibility settings like patterns for announcements.
    }


    /** @param {Array<object>} slidesConfig */
    _renderSlides(slidesConfig) {
        this.#logger.info(`Preparing to render ${slidesConfig.length} slides.`);
        this.#debugTotalSlides = slidesConfig.length;
        this.#debugCurrentSlideIndex = 0;
        this._updateDebugSlideDisplay(); // Update placeholder with correct total

        if (this.#slideDisplayAreaEl) {
            if (slidesConfig.length > 0) {
                // Phase 1: Update placeholder. Phase 2: Actual slide rendering.
                this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">Slides would be rendered here. First slide title (if any): "${slidesConfig[0]?.title || 'N/A'}"</p> <div class="debug-slide-info" id="debug-slide-info-id">${this._getDebugSlideInfoText()}</div>`;
                this._announceToScreenReader(`Displaying slide 1 of ${slidesConfig.length}. ${slidesConfig[0]?.title || ''}`);
                this._dispatchEvent('slideChanged', { currentIndex: 0, slideData: slidesConfig[0], totalSlides: slidesConfig.length, trigger: 'config_apply' });
            } else {
                const noSlidesText = this.#internalConfig?.accessibility?.noSlidesText || "No information to display at this time.";
                this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">${noSlidesText}</p>`;
                this._announceToScreenReader(noSlidesText);
            }
        }
        // TODO (Phase 2): Create slide elements, manage active slide, transitions, lazy loading.
    }

    _renderFailSafe(message) {
        this.#logger.error("Entering fail-safe rendering mode.", { failMessage: message });
        if (!this.#shadow || !this.#shadow.firstChild) {
            this._renderScaffold();
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
        this.focus(); // Focus the host element by default.
        this.#logger.debug("Initial focus programmatically set to host element.");
    }

    _attachInternalEventListeners() {
        if (this.#cancelButtonEl) {
            this.#cancelButtonEl.removeEventListener('click', this.#boundHandleCancelClick); // Remove first to prevent duplicates if called again
            this.#cancelButtonEl.addEventListener('click', this.#boundHandleCancelClick);
        }
        this.removeEventListener('keydown', this.#boundHandleHostKeydown); // Remove first
        this.addEventListener('keydown', this.#boundHandleHostKeydown);
        this.#logger.debug("Internal event listeners (re)attached.");
    }

    _handleCancelClick() {
        this.#logger.info("Cancel button clicked by user.");
        // When cancel is clicked, we want to pause the carousel's activity
        this._internalPauseActivity('cancel_button'); // Call the internal method
        this._dispatchEvent('userCancelled', { timestamp: Date.now(), reason: 'cancel_button_click' });
    }

    _internalPauseActivity(reason) {
        this.#logger.info(`Internal activity being paused due to: ${reason}.`);
        // TODO (Phase 2): Implement actual pausing logic here:
        // - Clear autoplay timers (e.g., if (this.#autoplayTimerId) clearInterval(this.#autoplayTimerId); this.#autoplayTimerId = null;)
        // - Stop any ongoing slide transitions or animations.
        // - Potentially update an internal state like this.#isPlaying = false;
        // DO NOT CALL this.pause() from here as that creates the loop.
        this.#logger.debug(`Internal pause logic executed for reason: ${reason}.`);
    }
    // _internalResumeActivity(reason) { /* For symmetry, to be used by thaw/play */ }


    /** @param {KeyboardEvent} event */
    _handleHostKeydown(event) {
        this.#logger.debug(`Host keydown: Key='${event.key}', Code='${event.code}'`);
        let handled = false;
        const totalSlides = this.#debugTotalSlides;

        if (totalSlides === 0 && event.key !== "Escape") return;

        switch (event.key) {
            case "Escape":
                this.#logger.info("Escape key pressed. Triggering cancel action.");
                this._handleCancelClick();
                handled = true;
                break;
            case "ArrowLeft": case "ArrowUp":
                this.#logger.info("ArrowLeft/Up key pressed (previous slide).");
                if (totalSlides > 0) {
                    const newIndex = (this.#debugCurrentSlideIndex - 1 + totalSlides) % totalSlides;
                    this._updateDebugSlideIndex(newIndex, "keyboard_prev");
                }
                handled = true;
                break;
            case "ArrowRight": case "ArrowDown": case " ":
                this.#logger.info("ArrowRight/Down/Space key pressed (next slide).");
                 if (totalSlides > 0) {
                    const newIndex = (this.#debugCurrentSlideIndex + 1) % totalSlides;
                    this._updateDebugSlideIndex(newIndex, "keyboard_next");
                }
                handled = true;
                break;
            case "Home":
                this.#logger.info("Home key pressed (first slide).");
                if (totalSlides > 0) this._updateDebugSlideIndex(0, "keyboard_home");
                handled = true;
                break;
            case "End":
                this.#logger.info("End key pressed (last slide).");
                if (totalSlides > 0) this._updateDebugSlideIndex(totalSlides - 1, "keyboard_end");
                handled = true;
                break;
        }

        if (handled) {
            event.preventDefault();
            this.#logger.debug(`Key "${event.key}" handled, default action prevented.`);
        }
    }

    _getDebugSlideInfoText() {
        if (this.#debugTotalSlides > 0) {
            return `Current Placeholder Slide: ${this.#debugCurrentSlideIndex + 1} of ${this.#debugTotalSlides}`;
        }
        return "No slides loaded for placeholder navigation.";
    }

    _updateDebugSlideIndex(newIndex, trigger) {
        const oldIndex = this.#debugCurrentSlideIndex;
        this.#debugCurrentSlideIndex = newIndex;
        this.#logger.info(`Placeholder slide index changed from ${oldIndex} to ${newIndex} by ${trigger}.`);
        this._updateDebugSlideDisplay();

        const slideData = this.#internalConfig?.slides[newIndex];
        const announcement = `Slide ${newIndex + 1} of ${this.#debugTotalSlides}. ${slideData?.title || ''}`.trim();
        this._announceToScreenReader(announcement);

        this._dispatchEvent('slideChanged', {
            currentIndex: this.#debugCurrentSlideIndex,
            totalSlides: this.#debugTotalSlides,
            trigger: trigger,
            slideData: slideData || null
        });
    }

    _updateDebugSlideDisplay() {
        const debugInfoEl = this.#shadow.getElementById('debug-slide-info-id');
        if (debugInfoEl) {
            debugInfoEl.textContent = this._getDebugSlideInfoText();
        }
    }

    _announceToScreenReader(message) {
        if (this.#ariaLiveRegionEl) {
            // Clear previous message before setting new one to ensure it's announced
            this.#ariaLiveRegionEl.textContent = '';
            this.#ariaLiveRegionEl.textContent = message;
            this.#logger.debug(`Announced to screen reader (aria-live): "${message}"`);
        } else {
            this.#logger.warn("ARIA live region element not found for screen reader announcement.");
        }
    }

    _dispatchEvent(eventName, detailPayload = {}) {
        if (!this.isConnected) {
            this.#logger.warn(`Dispatch event "${eventName}" attempt while disconnected. Suppressed.`, { detailPayload });
            return;
        }
        const detail = (typeof detailPayload === 'object' && detailPayload !== null) ? detailPayload : {};
        const event = new CustomEvent(eventName, { detail, bubbles: true, composed: true });
        this.dispatchEvent(event);
        this.#logger.debug(`Dispatched event: "${eventName}"`, detail);
    }

    // --- Helper for theme validation (example with expanded stubs) ---
    _validateCssColor(colorString, defaultValue) {
        if (typeof colorString === 'string' && colorString.trim() !== '') {
            const s = new Option().style;
            s.color = colorString.trim(); // Use trimmed value for validation
            if (s.color !== '') return colorString.trim(); // Return trimmed valid color
        }
        //this.#logger.warn(`Invalid CSS color value "${colorString}". Using default "${defaultValue}".`);
        //this._dispatchEvent('error', { errorCode: 'THEME_INVALID_COLOR', propertyValue: String(colorString), fallbackValue: defaultValue});
        return defaultValue;
    }
    _validateCssSize(sizeString, defaultValue) {
        if (typeof sizeString === 'string' && /^\d+(\.\d+)?(px|em|rem|%|vw|vh)$/i.test(sizeString.trim())) {
            return sizeString.trim();
        }
        //this.#logger.warn(`Invalid CSS size value "${sizeString}". Using default "${defaultValue}".`);
        //this._dispatchEvent('error', { errorCode: 'THEME_INVALID_SIZE', propertyValue: String(sizeString), fallbackValue: defaultValue});
        return defaultValue;
    }
    _validateFontFamily(fontString, defaultValue) {
        if (typeof fontString === 'string' && fontString.trim() !== '') {
            return fontString.trim(); // Basic check, browser handles actual font availability
        }
        return defaultValue;
    }
    _validateShadow(shadowString, defaultValue) {
         if (typeof shadowString === 'string' && shadowString.trim() !== '') {
            return shadowString.trim(); // Complex to validate fully, accept strings
        }
        return defaultValue;
    }

     _hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return null;
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
    }
    // Helper to slightly darken or lighten a hex color for hover/active states (very basic)
    _adjustColor(hexColor, percent) {
        const num = parseInt(hexColor.slice(1), 16);
        const amt = Math.round(2.55 * percent * 10); // More aggressive change
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        const newR = Math.max(0, Math.min(255, R)).toString(16).padStart(2, '0');
        const newG = Math.max(0, Math.min(255, G)).toString(16).padStart(2, '0');
        const newB = Math.max(0, Math.min(255, B)).toString(16).padStart(2, '0');
        return `#${newR}${newG}${newB}`;
    }
}

if (!customElements.get('ve-carousel-waitroom')) {
    customElements.define('ve-carousel-waitroom', VECarouselWaitroom);
}

/*
================================================================================
MANUAL TEST HARNESS CHECKLIST FOR PHASE 1 (ve-carousel-waitroom.js) - UPDATED
================================================================================
(As per previous Phase 1 sign-off, this checklist is for verifying the scaffold)

Developer/Tester: After integrating this scaffold into `test-carousel.html` (or similar):

1.  LOGGER INJECTION:
    [X] Verify: If no logger is passed to `carousel.logger`, a "CRITICAL WARNING" about using default logger appears in console on connect.
    [X] Verify: If a valid custom logger (implementing ILogger) is passed to `carousel.logger` *before* `connectedCallback` (e.g., before appending to DOM), subsequent logs (like in `connectedCallback`) use the custom logger.
    [X] Verify: If an invalid logger object is passed, a warning is logged, and the component continues with its previous/default logger.

2.  CONFIGURATION & FAIL-SAFE:
    [X] Verify: `carousel.config = null` (or non-object) -> error log, fail-safe message in Shadow DOM, 'error' event 'INVALID_CONFIG'.
    [X] Verify: `carousel.config = { slides: "not-an-array" }` -> error log, fail-safe, 'error' event 'INVALID_CONFIG_SLIDES'.
    [X] Verify: `config.theme` or `config.accessibility` missing/invalid -> warnings logged, defaults used, component initializes.
    [X] Verify: Valid minimal config (`{slides:[], theme:{}, accessibility:{}, carousel:{}}`) -> `carouselReady` event detail `initialConfigPresent: true`. Shows "No slides to display" (or configured `noSlidesText`).
    [X] Verify: Setting a new valid config updates component (debugTotalSlides, host aria-label). `configApplied` event dispatched.

3.  API & VERSIONING:
    [X] Verify: `carousel.version` returns "1.0.0".
    [X] Verify: `carousel.themeApiVersion` returns "1.0".
    [X] Verify: `carousel.accessibilityApiVersion` returns "1.0".
    [X] Verify: Calling stubbed methods (`freeze`, `thaw`, `play`, `pause`, `goToSlide`, `reset`, `showBotMessage`) logs invocation. `showBotMessage` makes bot message area visible with text and ARIA live region updated.

4.  ACCESSIBILITY (BASIC):
    [X] Verify: Host `<ve-carousel-waitroom>` has `role="region"`, `tabindex="0"`, and `aria-label` (default or from config).
    [X] Verify: Cancel button (`#cancel-btn-id` in shadow DOM) is a `<button>`, has `aria-label` (default or from config).
    [X] Verify: Cancel button focusable via Tab. Host focusable via Tab. Logical tab order.
    [X] Verify: Visible focus indicator (`box-shadow`) on host and cancel button when keyboard focused.
    [X] Verify (axe-core): Run on test page. Expect minimal/no automated violations for this scaffold.
    [X] Verify (Manual Screen Reader):
        [X] Host focused: role and label announced.
        [X] Cancel button focused: role and label announced.
        [X] ARIA live region (`#aria-live-region-id`) present.

5.  KEYBOARD NAVIGATION (PLACEHOLDER):
    [X] Verify: Focus on host:
        [X] `ArrowRight/Down/Space`: "Current Placeholder Slide" text in shadow DOM updates (loops). ARIA live region announces "Slide X of Y. [Optional Title]". `slideChanged` event dispatched.
        [X] `ArrowLeft/Up`: Same for previous slide.
        [X] `Home`: Updates to "Slide 1 of Y", announces, dispatches event.
        [X] `End`: Updates to "Slide Y of Y", announces, dispatches event.
        [X] `Escape`: Triggers cancel log, dispatches `userCancelled` event.
    [X] Verify: Console logs confirm key presses and `event.preventDefault()`.

6.  THEMING (PLACEHOLDER):
    [X] Verify: After `carousel.config = { theme: { componentBackground: 'purple', accentColor: 'lime' } }`, inspect host's inline styles:
        `--ve-cw-component-background: purple;`
        `--ve-cw-accent-color: lime;` (and derived focus colors if not explicitly set in theme)
        `themeApplied` event dispatched.
    [X] Verify: Invalid color (e.g. `componentBackground: 'not-a-color'`) -> warning logged, fallback color used for CSS var, `error` event `THEME_INVALID_COLOR` dispatched.

7.  EVENT DISPATCH:
    [X] Verify: `carouselReady` event (bubbles, composed) dispatched on `connectedCallback` with correct detail.
    [X] Verify: `userCancelled` event (bubbles, composed) on cancel button/Escape, with correct detail.
    [X] Verify: All other specified events (`error`, `configApplied`, `themeApplied`, `slideChanged`, `botMessageShown/Dismissed`, `frozen`, `thawed`, `playTriggered`, `pauseTriggered`, `reset`) are dispatched from their respective (stubbed) locations with non-null `detail` objects.

8.  ROBUST RE-RENDERING / STATE RESET:
    [X] Set initial valid config.
    [X] `carousel.config = null`. Verify fail-safe mode.
    [X] Set new valid config. Verify component recovers, clears fail-safe, applies new config (placeholder slide info updates). `_resetInternalState` is called.
================================================================================
*/
