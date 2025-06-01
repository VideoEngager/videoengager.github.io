// file: js/ve-carousel-waitroom.js

// Assume ILogger, LogLevel, ConsoleLogger are imported from your logger module.
// Using the minimal stub from the Phase 1 sign-off.
// import { ILogger, LogLevel, ConsoleLogger } from './logger/index.js';

// --- Minimal Logger Stub ---
const LogLevel = Object.freeze({
    NONE: 0, ERROR: 1, WARN: 2, INFO: 3, DEBUG: 4,
});
class ILogger {
    debug(message, context) { console.debug('[ILogger STUB]', message, context); }
    info(message, context) { console.info('[ILogger STUB]', message, context); }
    warn(message, context) { console.warn('[ILogger STUB]', message, context); }
    error(message, error, context) { console.error('[ILogger STUB]', message, error, context); }
    withContext(context) { return this; }
    setLevel(level) {}
    getLevel() { return LogLevel.INFO; }
}
class ConsoleLogger extends ILogger {
    constructor(options = {}) { super(); this._level = options.level || LogLevel.INFO; this._component = options.component || 'VECarouselWaitroomDefault'; this._baseContext = options.context || {}; }
    _log(level, type, message, ...args) { if (this._level >= level) { const logMessage = `[${this._component}] ${type}: ${message}`; const fullArgs = args.filter(arg => arg !== undefined); console[type.toLowerCase()](logMessage, ...fullArgs); } }
    debug(message, context) { this._log(LogLevel.DEBUG, 'DEBUG', message, context); }
    info(message, context) { this._log(LogLevel.INFO, 'INFO', message, context); }
    warn(message, context) { this._log(LogLevel.WARN, 'WARN', message, context); }
    error(message, error, context) { this._log(LogLevel.ERROR, 'ERROR', message, error, context); }
    withContext(newContext) { return new ConsoleLogger({ level: this._level, component: this._component, context: { ...this._baseContext, ...newContext } }); }
    setLevel(level) { if (Object.values(LogLevel).includes(level)) { this._level = level; } else { this._log(LogLevel.WARN, 'WARN', `Invalid log level: ${level}. Level remains ${this._level}.`); } }
    getLevel() { return this._level; }
}
// --- End Minimal Logger Stub ---

const COMPONENT_VERSION = "1.0.0";
const THEME_API_VERSION = "1.0";
const ACCESSIBILITY_API_VERSION = "1.0";
const DEFAULT_HOST_LABEL = "Waitroom Information Carousel";
const DEFAULT_CANCEL_BUTTON_ARIA_LABEL = "Cancel current operation";

/**
 * Default theme values as per themeguide.md.
 * This object defines the complete ThemeSettingsV1 structure with defaults.
 */
const DEFAULT_THEME = Object.freeze({
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    componentBackground: '#333333', // Dark Grey
    primaryTextColor: '#FFFFFF',    // White
    baseFontSize: '16px',

    slideTitleColor: '#FFFFFF', // Defaults to primaryTextColor conceptually
    slideTitleFontSize: '2em',
    slideDescriptionColor: '#FFFFFF', // Defaults to primaryTextColor conceptually
    slideDescriptionFontSize: '1.2em',
    slideMediaOverlayBackground: 'rgba(0,0,0,0.5)', // Semi-black

    botMessageBackground: 'rgba(0,0,0,0.8)', // Semi-black
    botMessageTextColor: '#FFFFFF',         // Defaults to primaryTextColor conceptually
    botMessageBorderRadius: '4px',
    botMessageFontSize: '1em',
    botMessageTierLowAccentColor: '#5bc0de',       // Info Blue
    botMessageTierHighAccentColor: '#f0ad4e',      // Warning Orange
    botMessageTierCriticalBackground: '#d9534f',  // Danger Red
    botMessageTierCriticalTextColor: '#FFFFFF',    // White

    accentColor: '#007bff', // Primary Blue

    // Cancel Button Specifics (added based on spec discussion)
    cancelButtonBackground: '#dc3545', // Danger Red (Bootstrap's danger)
    cancelButtonIconColor: '#ffffff',  // White
    cancelButtonSize: '60px',
    cancelButtonMobileSize: '50px',
    cancelButtonRadius: '50%',
    cancelButtonOffsetTop: '1.5rem', // Adjusted slightly from POC for typical viewport
    cancelButtonOffsetRight: '1.5rem',// Adjusted slightly from POC
    cancelButtonShadow: '0 2px 8px rgba(0,0,0,0.25)',
    cancelButtonFocusRingColor: 'rgba(220, 53, 69, 0.5)', // Default derived from its own bg

    // Placeholders for other focus indicators if needed separately
    focusIndicatorHostShadow: 'rgba(0, 123, 255, 0.5)', // Derived from accentColor
    focusIndicatorButtonShadow: 'rgba(0, 123, 255, 0.5)', // Generic button, cancel overrides

    // Debug/Placeholder colors (not part of ThemeSettingsV1, for internal use)
    debugBorderColor: '#adb5bd',
    placeholderTextColor: '#6c757d',
    errorTextColor: '#721c24',
    errorBgColor: '#f8d7da',
    errorBorderColor: '#f5c6cb'
});

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

    #boundHandleCancelClick;
    #boundHandleHostKeydown;

    static get observedAttributes() { return []; }

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: 'open' });
        this.#logger = new ConsoleLogger({ component: 'VECarouselWaitroom', level: LogLevel.INFO });
        this.#logger.info(`Constructor: Version ${this.version}. Default logger active.`);
        this.#boundHandleCancelClick = this._handleCancelClick.bind(this);
        this.#boundHandleHostKeydown = this._handleHostKeydown.bind(this);
    }

    set logger(newLogger) {
        if (newLogger && typeof newLogger.info === 'function' && typeof newLogger.error === 'function') {
            this.#logger = newLogger; this.#isExternalLoggerInjected = true;
            this.#logger.info("External logger injected.");
        } else {
            this.#logger.warn("Invalid external logger. Continuing with current.");
        }
    }
    get logger() { return this.#logger; }
    get version() { return COMPONENT_VERSION; }
    get themeApiVersion() { return THEME_API_VERSION; }
    get accessibilityApiVersion() { return ACCESSIBILITY_API_VERSION; }

    set config(newConfig) {
        this.#logger.info("Config received.", { hasConfig: !!newConfig });
        if (!newConfig || typeof newConfig !== 'object') {
            this.#logger.error("Invalid config: Must be an object.", { type: typeof newConfig });
            this._renderFailSafe("Invalid configuration provided.");
            this.#internalConfig = null;
            this._dispatchEvent('error', { errorCode: 'INVALID_CONFIG', reason: 'Config must be an object.' });
            return;
        }
        if (!Array.isArray(newConfig.slides)) {
            this.#logger.error("Invalid config: 'slides' must be an array.", { slidesType: typeof newConfig.slides });
            this._renderFailSafe("Slide config missing/invalid (must be array).");
            this.#internalConfig = null;
            this._dispatchEvent('error', { errorCode: 'INVALID_CONFIG_SLIDES', reason: "'slides' must be an array." });
            return;
        }

        this.#internalConfig = {
            slides: newConfig.slides,
            theme: (typeof newConfig.theme === 'object' && newConfig.theme !== null) ? { ...newConfig.theme } : {},
            accessibility: (typeof newConfig.accessibility === 'object' && newConfig.accessibility !== null) ? { ...newConfig.accessibility } : {},
            carousel: (typeof newConfig.carousel === 'object' && newConfig.carousel !== null) ? { ...newConfig.carousel } : {}
        };
        // Ensure all sub-objects exist even if empty, for easier merging with defaults later
        if (!this.#internalConfig.theme) this.#internalConfig.theme = {};
        if (!this.#internalConfig.accessibility) this.#internalConfig.accessibility = {};
        if (!this.#internalConfig.carousel) this.#internalConfig.carousel = {};


        this.#logger.info("Config processed.");
        this._dispatchEvent('configApplied', { /* config: this.#internalConfig (can be large) */ });
        if (this.isConnected) this._applyFullConfig();
    }
    get config() { return this.#internalConfig; }

    freeze() { this.#logger.info("API: freeze()"); this._internalPauseActivity('freeze_api'); this._dispatchEvent('frozen'); }
    thaw() { this.#logger.info("API: thaw()"); /* TODO: _internalResumeActivity('thaw_api'); */ this._dispatchEvent('thawed'); }

    showBotMessage(message, options = {}) {
        const { tier = 'low', duration = 5000 } = options;
        this.#logger.info("API: showBotMessage()", { message, tier, duration });
        if (this.#botMessageAreaEl) {
            // Sanitize message text before inserting
            const messageP = document.createElement('p');
            messageP.textContent = message; // textContent auto-sanitizes against HTML injection
            this.#botMessageAreaEl.innerHTML = ''; // Clear previous
            this.#botMessageAreaEl.appendChild(messageP);

            this.#botMessageAreaEl.className = `bot-message-area__waitroom tier-${tier}`;
            this.#botMessageAreaEl.style.display = 'block';
            this.#botMessageAreaEl.setAttribute('aria-hidden', 'false');
            this._announceToScreenReader(`Notification: ${message}`);
            this._dispatchEvent('botMessageShown', { message, tier });

            // Clear existing timeout if any, to prevent multiple hide timeouts
            if (this.#botMessageAreaEl.hideTimeout) clearTimeout(this.#botMessageAreaEl.hideTimeout);

            if (tier !== 'critical' && duration > 0) {
                this.#botMessageAreaEl.hideTimeout = setTimeout(() => {
                    if (this.#botMessageAreaEl && this.#botMessageAreaEl.style.display === 'block') {
                        this.#botMessageAreaEl.style.display = 'none';
                        this.#botMessageAreaEl.setAttribute('aria-hidden', 'true');
                        this._dispatchEvent('botMessageDismissed', { message, tier });
                    }
                }, duration);
            }
        } else { this.#logger.warn("Bot message area not available."); }
    }

    play() { this.#logger.info("API: play()"); /* TODO: _internalResumeActivity('play_api'); */ this._dispatchEvent('playTriggered'); }
    pause() { this.#logger.info("API: pause()"); this._internalPauseActivity('pause_api'); this._dispatchEvent('pauseTriggered'); }

    goToSlide(index) {
        this.#logger.info("API: goToSlide()", { index });
        if (this.#internalConfig && index >= 0 && index < this.#debugTotalSlides) {
            this._updateDebugSlideIndex(index, "API");
        } else {
            this.#logger.warn(`Invalid slide index ${index}.`);
            this._dispatchEvent('error', { errorCode: 'INVALID_SLIDE_INDEX', reason: `Invalid index: ${index}` });
        }
    }
    reset() { this.#logger.info("API: reset()"); this._updateDebugSlideIndex(0, "reset_api"); this._dispatchEvent('reset'); }

    connectedCallback() {
        this.#logger.info(`Connected. Version: ${this.version}. ThemeAPI: ${this.themeApiVersion}. A11yAPI: ${this.accessibilityApiVersion}.`);
        if (!this.#isExternalLoggerInjected) this.#logger.warn("CRITICAL WARNING: No external logger. Using default. NOT FOR CLINICAL PRODUCTION.");

        if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
        const initialAriaLabel = this.#internalConfig?.accessibility?.carouselLabel || DEFAULT_HOST_LABEL;
        this.setAttribute('aria-label', initialAriaLabel);
        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

        this._renderScaffold();
        this._attachInternalEventListeners();
        this._setInitialFocus();

        if (this.#internalConfig) this._applyFullConfig();
        else {
            this.#logger.error("Connected, no valid config. Fail-safe. Set 'config' property.");
            this._renderFailSafe("Carousel configuration missing.");
            this._dispatchEvent('error', { errorCode: 'CONFIG_MISSING_ON_CONNECT', reason: 'No config on connect.' });
        }
        this._dispatchEvent('carouselReady', { version: this.version, supportedThemeApi: this.themeApiVersion, supportedAccessibilityApi: this.accessibilityApiVersion, initialConfigPresent: !!this.#internalConfig, loggerInjected: this.#isExternalLoggerInjected });
    }

    disconnectedCallback() {
        this.#logger.info("Disconnected. Cleaning up.");
        if (this.#cancelButtonEl) this.#cancelButtonEl.removeEventListener('click', this.#boundHandleCancelClick);
        this.removeEventListener('keydown', this.#boundHandleHostKeydown);
        // TODO: Clear autoplay timers, IntersectionObservers
    }

    _renderScaffold() {
        this.#logger.debug("Rendering scaffold structure.");
        // Style tag now directly includes theme variable fallbacks from DEFAULT_THEME
        this.#shadow.innerHTML = `
            <style>
                :host {
                    display: block; width: 100%; height: 100%; position: relative; overflow: hidden;
                    background: var(--ve-cw-component-background, ${DEFAULT_THEME.componentBackground});
                    color: var(--ve-cw-primary-text-color, ${DEFAULT_THEME.primaryTextColor});
                    font-family: var(--ve-cw-font-family, ${DEFAULT_THEME.fontFamily});
                    font-size: var(--ve-cw-base-font-size, ${DEFAULT_THEME.baseFontSize});
                    outline: none;
                }
                :host(:focus-visible) {
                     box-shadow: 0 0 0 3px var(--ve-cw-focus-indicator-host-shadow, ${DEFAULT_THEME.focusIndicatorHostShadow});
                     border-radius: 2px;
                }
                .container__waitroom { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
                .slides-area__waitroom { flex-grow: 1; width: 100%; display: flex; flex-direction:column; align-items: center; justify-content: center; position: relative; overflow: hidden; border: 1px dashed var(--ve-cw-debug-border-color, ${DEFAULT_THEME.debugBorderColor}); min-height: 250px; padding: 1em; }
                .slides-area__waitroom-message { padding: 1rem; font-style: italic; color: var(--ve-cw-placeholder-text-color, ${DEFAULT_THEME.placeholderTextColor}); text-align: center; }
                .debug-slide-info { font-size: 0.9em; color: #777; margin-top: 10px; }

                .cancel-button__waitroom {
                    position: absolute;
                    top: var(--ve-cw-cancel-button-offset-top, ${DEFAULT_THEME.cancelButtonOffsetTop});
                    right: var(--ve-cw-cancel-button-offset-right, ${DEFAULT_THEME.cancelButtonOffsetRight});
                    width: var(--ve-cw-cancel-button-size, ${DEFAULT_THEME.cancelButtonSize});
                    height: var(--ve-cw-cancel-button-size, ${DEFAULT_THEME.cancelButtonSize});
                    background: var(--ve-cw-cancel-button-background, ${DEFAULT_THEME.cancelButtonBackground});
                    border: none;
                    border-radius: var(--ve-cw-cancel-button-radius, ${DEFAULT_THEME.cancelButtonRadius});
                    cursor: pointer; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 0;
                    transition: transform 0.1s ease-out, background-color 0.2s ease;
                    box-shadow: var(--ve-cw-cancel-button-shadow, ${DEFAULT_THEME.cancelButtonShadow});
                }
                .cancel-button__waitroom:hover {
                    /* Hover styles will be defined by themes or use CSS filters for simple variations */
                    filter: brightness(1.1); /* Example for hover */
                    transform: scale(1.05);
                }
                .cancel-button__waitroom:active { transform: scale(0.95); filter: brightness(0.9); }
                .cancel-button__waitroom .icon__cancel {
                    width: 50%; height: 50%;
                    fill: var(--ve-cw-cancel-button-icon-color, ${DEFAULT_THEME.cancelButtonIconColor});
                }
                .cancel-button__waitroom:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 0.25rem var(--ve-cw-cancel-button-focus-ring-color, ${DEFAULT_THEME.cancelButtonFocusRingColor});
                }

                .bot-message-area__waitroom {
                    position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%); width: auto; max-width: 90%;
                    padding: 0.75rem 1.25rem;
                    background-color: var(--ve-cw-bot-message-background, ${DEFAULT_THEME.botMessageBackground});
                    color: var(--ve-cw-bot-message-text-color, ${DEFAULT_THEME.botMessageTextColor});
                    border-radius: var(--ve-cw-bot-message-border-radius, ${DEFAULT_THEME.botMessageBorderRadius});
                    text-align: center; z-index: 900; display: none;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    font-size: var(--ve-cw-bot-message-font-size, ${DEFAULT_THEME.botMessageFontSize});
                }
                .bot-message-area__waitroom.tier-low { border-left: 5px solid var(--ve-cw-bot-message-tier-low-accent, ${DEFAULT_THEME.botMessageTierLowAccentColor}); }
                .bot-message-area__waitroom.tier-high { border-left: 5px solid var(--ve-cw-bot-message-tier-high-accent, ${DEFAULT_THEME.botMessageTierHighAccentColor}); /* Potentially different background too */ }
                .bot-message-area__waitroom.tier-critical { border: none; background-color: var(--ve-cw-bot-message-tier-critical-bg, ${DEFAULT_THEME.botMessageTierCriticalBackground}); color: var(--ve-cw-bot-message-tier-critical-text, ${DEFAULT_THEME.botMessageTierCriticalTextColor}); }

                .fail-safe__message { padding: 2rem; text-align: center; font-weight: bold; font-size: 1.1rem; color: var(--ve-cw-error-text-color, ${DEFAULT_THEME.errorTextColor}); background-color: var(--ve-cw-error-bg-color, ${DEFAULT_THEME.errorBgColor}); border: 1px solid var(--ve-cw-error-border-color, ${DEFAULT_THEME.errorBorderColor}); border-radius: 4px;}
                .aria-live-region { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }

                @media (max-width: 768px) {
                    .cancel-button__waitroom {
                        width: var(--ve-cw-cancel-button-mobile-size, ${DEFAULT_THEME.cancelButtonMobileSize});
                        height: var(--ve-cw-cancel-button-mobile-size, ${DEFAULT_THEME.cancelButtonMobileSize});
                        top: var(--ve-cw-cancel-button-mobile-offset-top, 1rem); /* Example - these need theme props */
                        right: var(--ve-cw-cancel-button-mobile-offset-right, 1rem);/* Example - these need theme props */
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
        this.#logger.debug("Scaffold DOM elements assigned.");
    }

    _applyFullConfig() {
        if (!this.#internalConfig || !this.isConnected) {
            this.#logger.debug("Skipping _applyFullConfig: No config or not connected."); return;
        }
        this.#logger.info("Applying full configuration.");
        this._resetInternalState();
        this._applyTheme(this.#internalConfig.theme || {});
        this._applyAccessibilitySettings(this.#internalConfig.accessibility || {});
        this._renderSlides(this.#internalConfig.slides || []);
        // TODO (P2): Configure autoplay from this.#internalConfig.carousel
    }

    _resetInternalState() {
        this.#logger.debug("Resetting internal state.");
        if (this.#slideDisplayAreaEl) {
            this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">Re-configuring...</p> <div class="debug-slide-info" id="debug-slide-info-id">Current Placeholder Slide: 0</div>`;
        }
        this.#debugCurrentSlideIndex = 0;
        this.#debugTotalSlides = this.#internalConfig?.slides?.length || 0;
        this._updateDebugSlideDisplay();
        // TODO (P2+): Clear autoplay timers, active slide elements etc.
    }

    /** @param {object} themeConfig - ThemeSettingsV1 object */
    _applyTheme(themeConfigInput) {
        const themeConfig = themeConfigInput || {}; // Ensure themeConfig is an object
        this.#logger.info("Applying theme.", { receivedThemeIsObject: typeof themeConfig === 'object' });

        // Define mapping from ThemeSettingsV1 keys to CSS Custom Property names
        const themePropertyMap = {
            fontFamily: '--ve-cw-font-family',
            componentBackground: '--ve-cw-component-background',
            primaryTextColor: '--ve-cw-primary-text-color',
            baseFontSize: '--ve-cw-base-font-size',
            slideTitleColor: '--ve-cw-slide-title-color',
            slideTitleFontSize: '--ve-cw-slide-title-font-size',
            slideDescriptionColor: '--ve-cw-slide-description-color',
            slideDescriptionFontSize: '--ve-cw-slide-description-font-size',
            slideMediaOverlayBackground: '--ve-cw-slide-media-overlay-background',
            botMessageBackground: '--ve-cw-bot-message-background',
            botMessageTextColor: '--ve-cw-bot-message-text-color',
            botMessageBorderRadius: '--ve-cw-bot-message-border-radius',
            botMessageFontSize: '--ve-cw-bot-message-font-size',
            botMessageTierLowAccentColor: '--ve-cw-bot-message-tier-low-accent',
            botMessageTierHighAccentColor: '--ve-cw-bot-message-tier-high-accent',
            botMessageTierCriticalBackground: '--ve-cw-bot-message-tier-critical-bg',
            botMessageTierCriticalTextColor: '--ve-cw-bot-message-tier-critical-text',
            accentColor: '--ve-cw-accent-color',
            // Cancel Button
            cancelButtonBackground: '--ve-cw-cancel-button-background',
            cancelButtonIconColor: '--ve-cw-cancel-button-icon-color',
            cancelButtonSize: '--ve-cw-cancel-button-size',
            cancelButtonMobileSize: '--ve-cw-cancel-button-mobile-size',
            cancelButtonRadius: '--ve-cw-cancel-button-radius',
            cancelButtonOffsetTop: '--ve-cw-cancel-button-offset-top',
            cancelButtonOffsetRight: '--ve-cw-cancel-button-offset-right',
            cancelButtonShadow: '--ve-cw-cancel-button-shadow',
            cancelButtonFocusRingColor: '--ve-cw-cancel-button-focus-ring-color',
            // Focus Indicators (can be derived if not set, using accentColor)
            focusIndicatorHostShadow: '--ve-cw-focus-indicator-host-shadow',
            focusIndicatorButtonShadow: '--ve-cw-focus-indicator-button-shadow',
            // Internal/Debug (not part of ThemeSettingsV1, but still useful for consistency)
            debugBorderColor: '--ve-cw-debug-border-color',
            placeholderTextColor: '--ve-cw-placeholder-text-color',
            errorTextColor: '--ve-cw-error-text-color',
            errorBgColor: '--ve-cw-error-bg-color',
            errorBorderColor: '--ve-cw-error-border-color',
        };

        let effectiveTheme = {};

        for (const key in DEFAULT_THEME) {
            const cssVarName = themePropertyMap[key];
            if (!cssVarName) {
                //this.#logger.warn(`No CSS variable mapping for theme key: ${key}`);
                continue; // Skip if no CSS var defined for this default key
            }

            let valueToApply = themeConfig[key];
            let validationFn;

            // Determine validation function based on key
            if (key.toLowerCase().includes('color') || key.toLowerCase().includes('background') && !key.toLowerCase().includes('image')) { // crude check
                validationFn = this._validateCssColor.bind(this);
            } else if (key.toLowerCase().includes('size') || key.toLowerCase().includes('radius') || key.toLowerCase().includes('offset')) {
                validationFn = this._validateCssSize.bind(this);
            } else if (key.toLowerCase().includes('family')) {
                validationFn = this._validateFontFamily.bind(this);
            } else if (key.toLowerCase().includes('shadow')) {
                validationFn = this._validateShadow.bind(this);
            } else {
                validationFn = (val, defVal) => val !== undefined ? val : defVal; // Passthrough if no specific validator
            }

            const validatedValue = validationFn(valueToApply, DEFAULT_THEME[key], key); // Pass key for error reporting
            this.style.setProperty(cssVarName, validatedValue);
            effectiveTheme[key] = validatedValue;
           // this.#logger.debug(`Theme: CSS Var ${cssVarName} = ${validatedValue}`);
        }
        
        // Handle derived focus colors if not explicitly set by theme
        if (!themeConfig.focusIndicatorHostShadow && effectiveTheme.accentColor) {
            const derivedFocus = `rgba(${this._hexToRgb(effectiveTheme.accentColor)?.join(',') || '0,90,180'}, 0.6)`;
            this.style.setProperty(themePropertyMap.focusIndicatorHostShadow, derivedFocus);
            effectiveTheme.focusIndicatorHostShadow = derivedFocus;
           // this.#logger.debug(`Theme: Derived CSS Var ${themePropertyMap.focusIndicatorHostShadow} = ${derivedFocus}`);
        }
        if (!themeConfig.cancelButtonFocusRingColor && effectiveTheme.cancelButtonBackground) { // Derive from its own bg
             const derivedCancelFocus = `rgba(${this._hexToRgb(effectiveTheme.cancelButtonBackground)?.join(',') || '220,53,69'}, 0.5)`;
            this.style.setProperty(themePropertyMap.cancelButtonFocusRingColor, derivedCancelFocus);
            effectiveTheme.cancelButtonFocusRingColor = derivedCancelFocus;
           // this.#logger.debug(`Theme: Derived CSS Var ${themePropertyMap.cancelButtonFocusRingColor} = ${derivedCancelFocus}`);
        }


        this.#logger.info("Theme applied successfully.");
        this._dispatchEvent('themeApplied', { effectiveTheme });
    }

    _applyAccessibilitySettings(accessibilityConfig) {
        this.#logger.info("Applying accessibility settings.", { accessibilityConfig });
        const hostLabel = accessibilityConfig.carouselLabel || DEFAULT_HOST_LABEL;
        if (this.getAttribute('aria-label') !== hostLabel) {
            this.setAttribute('aria-label', hostLabel);
            this.#logger.debug(`Host aria-label set: "${hostLabel}"`);
        }
        if (this.#cancelButtonEl) {
            const cancelLabel = accessibilityConfig.cancelButtonAriaLabel || DEFAULT_CANCEL_BUTTON_ARIA_LABEL;
            if (this.#cancelButtonEl.getAttribute('aria-label') !== cancelLabel) {
                this.#cancelButtonEl.setAttribute('aria-label', cancelLabel);
                this.#logger.debug(`Cancel button aria-label set: "${cancelLabel}"`);
            }
        }
        // TODO (P3): Use accessibilityConfig.slideChangeAnnouncementPattern etc.
    }

    _renderSlides(slidesConfig) {
        this.#logger.info(`Rendering ${slidesConfig.length} slides.`);
        this.#debugTotalSlides = slidesConfig.length;
        this.#debugCurrentSlideIndex = 0;
        this._updateDebugSlideDisplay();

        if (this.#slideDisplayAreaEl) {
            if (slidesConfig.length > 0) {
                this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">Slides rendering Phase 2. First slide title: "${slidesConfig[0]?.title || 'N/A'}"</p> <div class="debug-slide-info" id="debug-slide-info-id">${this._getDebugSlideInfoText()}</div>`;
                const firstSlideData = slidesConfig[0];
                this._announceToScreenReader(`Displaying slide 1 of ${slidesConfig.length}. ${firstSlideData?.title || ''}`);
                this._dispatchEvent('slideChanged', { currentIndex: 0, slideData: firstSlideData, totalSlides: slidesConfig.length, trigger: 'config_apply' });
            } else {
                const noSlidesText = this.#internalConfig?.accessibility?.noSlidesText || "No information to display.";
                this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">${noSlidesText}</p>`;
                this._announceToScreenReader(noSlidesText);
            }
        }
        // TODO (P2 Actual): Clear old, create actual slide elements, lazy load, transitions.
    }

    _renderFailSafe(message) {
        this.#logger.error("Fail-safe render.", { failMessage: message });
        if (!this.#shadow?.firstChild) this._renderScaffold();
        const target = this.#slideDisplayAreaEl || this.#containerEl || this.#shadow;
        if (target) target.innerHTML = `<div class="fail-safe__message">${message}</div>`;
        this._announceToScreenReader(`Error: ${message}`);
        this._dispatchEvent('criticalError', { errorCode: 'FAIL_SAFE_RENDER', reason: message });
    }

    _setInitialFocus() { this.focus(); this.#logger.debug("Initial focus set to host."); }

    _attachInternalEventListeners() {
        if (this.#cancelButtonEl) {
            this.#cancelButtonEl.removeEventListener('click', this.#boundHandleCancelClick);
            this.#cancelButtonEl.addEventListener('click', this.#boundHandleCancelClick);
        }
        this.removeEventListener('keydown', this.#boundHandleHostKeydown);
        this.addEventListener('keydown', this.#boundHandleHostKeydown);
        this.#logger.debug("Internal event listeners (re)attached.");
    }

    _handleCancelClick() {
        this.#logger.info("Cancel button clicked.");
        this._internalPauseActivity('cancel_button');
        this._dispatchEvent('userCancelled', { timestamp: Date.now(), reason: 'cancel_button_click' });
    }

    _internalPauseActivity(reason) {
        this.#logger.info(`Internal activity paused due to: ${reason}.`);
        // No call to this.pause() here. This IS the core pause logic stub for Phase 1/2.
        // TODO (P2/P3): Clear autoplay timers, stop animations, etc.
        this.#logger.debug(`Internal pause logic executed for ${reason}.`);
    }

    _handleHostKeydown(event) {
        this.#logger.debug(`Host keydown: Key='${event.key}'`);
        let handled = false; const total = this.#debugTotalSlides;
        if (total === 0 && event.key !== "Escape") return;
        switch (event.key) {
            case "Escape": this._handleCancelClick(); handled = true; break;
            case "ArrowLeft": case "ArrowUp": if(total > 0) this._updateDebugSlideIndex((this.#debugCurrentSlideIndex - 1 + total) % total, "kb_prev"); handled = true; break;
            case "ArrowRight": case "ArrowDown": case " ": if(total > 0) this._updateDebugSlideIndex((this.#debugCurrentSlideIndex + 1) % total, "kb_next"); handled = true; break;
            case "Home": if(total > 0) this._updateDebugSlideIndex(0, "kb_home"); handled = true; break;
            case "End": if(total > 0) this._updateDebugSlideIndex(total - 1, "kb_end"); handled = true; break;
        }
        if (handled) event.preventDefault();
    }

    _getDebugSlideInfoText() { return this.#debugTotalSlides > 0 ? `Placeholder Slide: ${this.#debugCurrentSlideIndex + 1}/${this.#debugTotalSlides}` : "No slides for placeholder nav."; }

    _updateDebugSlideIndex(newIndex, trigger) {
        const oldIndex = this.#debugCurrentSlideIndex;
        this.#debugCurrentSlideIndex = newIndex;
        this.#logger.info(`Placeholder slide idx ${oldIndex} -> ${newIndex} by ${trigger}.`);
        this._updateDebugSlideDisplay();
        const slideData = this.#internalConfig?.slides[newIndex];
        const announcement = `Slide ${newIndex + 1} of ${this.#debugTotalSlides}. ${slideData?.title || ''}`.trim();
        this._announceToScreenReader(announcement);
        this._dispatchEvent('slideChanged', { currentIndex: newIndex, totalSlides: this.#debugTotalSlides, trigger, slideData: slideData || null });
    }

    _updateDebugSlideDisplay() {
        const el = this.#shadow.getElementById('debug-slide-info-id');
        if (el) el.textContent = this._getDebugSlideInfoText();
    }

    _announceToScreenReader(message) {
        if (this.#ariaLiveRegionEl) {
            this.#ariaLiveRegionEl.textContent = ''; this.#ariaLiveRegionEl.textContent = message;
            this.#logger.debug(`ARIA Live: "${message}"`);
        } else this.#logger.warn("ARIA live region not found for announcement.");
    }

    _dispatchEvent(eventName, detailPayload = {}) {
        if (!this.isConnected) { this.#logger.warn(`Dispatch "${eventName}" suppressed (disconnected).`, { detailPayload }); return; }
        const detail = (typeof detailPayload === 'object' && detailPayload !== null) ? detailPayload : {};
        this.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true, composed: true }));
        this.#logger.debug(`Dispatched event: "${eventName}"`, detail);
    }

    // --- Validation Helpers (to be expanded as per themeguide.md) ---
    _validateCssColor(value, defaultValue, propertyName = 'unknown_color_prop') {
        if (typeof value === 'string' && value.trim() !== '') {
            const s = new Option().style; s.color = value.trim();
            if (s.color !== '') return value.trim();
        }
        if (value !== undefined) { // Only warn if a value was provided but was invalid
            this.#logger.warn(`Invalid CSS color for ${propertyName}: "${value}". Using default "${defaultValue}".`);
            this._dispatchEvent('error', { errorCode: 'THEME_INVALID_VALUE', propertyName, receivedValue: String(value), fallbackValue: defaultValue });
        }
        return defaultValue;
    }
    _validateCssSize(value, defaultValue, propertyName = 'unknown_size_prop') {
        if (typeof value === 'string' && /^\d+(\.\d+)?(px|em|rem|%|vw|vh|vmin|vmax)$/i.test(value.trim())) {
            return value.trim();
        }
        if (value !== undefined) {
            this.#logger.warn(`Invalid CSS size for ${propertyName}: "${value}". Using default "${defaultValue}".`);
            this._dispatchEvent('error', { errorCode: 'THEME_INVALID_VALUE', propertyName, receivedValue: String(value), fallbackValue: defaultValue });
        }
        return defaultValue;
    }
    _validateFontFamily(value, defaultValue, propertyName = 'unknown_font_prop') { // Basic, relies on browser parsing
        if (typeof value === 'string' && value.trim() !== '') return value.trim();
        if (value !== undefined) {
             this.#logger.warn(`Invalid Font Family for ${propertyName}: "${value}". Using default "${defaultValue}".`);
             this._dispatchEvent('error', { errorCode: 'THEME_INVALID_VALUE', propertyName, receivedValue: String(value), fallbackValue: defaultValue });
        }
        return defaultValue;
    }
    _validateShadow(value, defaultValue, propertyName = 'unknown_shadow_prop') { // Basic, relies on browser parsing
        if (typeof value === 'string' && value.trim() !== '' && value.toLowerCase() !== 'none') return value.trim();
        if (value === 'none') return 'none'; // Allow 'none' explicitly
        if (value !== undefined) {
             this.#logger.warn(`Invalid Box Shadow for ${propertyName}: "${value}". Using default "${defaultValue}".`);
             this._dispatchEvent('error', { errorCode: 'THEME_INVALID_VALUE', propertyName, receivedValue: String(value), fallbackValue: defaultValue });
        }
        return defaultValue;
    }

     _hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return null;
        hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
    }
     // Basic color adjuster for hover/active states if specific theme props aren't given
    _adjustColor(hexColor, percent) {
        const rgb = this._hexToRgb(hexColor);
        if (!rgb) return hexColor; // Return original if not a valid hex
        const amt = Math.round(25.5 * percent); // percent is -1 to 1 for -100% to 100% change
        const [r, g, b] = rgb.map(val => Math.max(0, Math.min(255, val + amt)));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

if (!customElements.get('ve-carousel-waitroom')) {
    customElements.define('ve-carousel-waitroom', VECarouselWaitroom);
}

/* MANUAL TEST HARNESS CHECKLIST FOR PHASE 1 & 2.2 (THEMING) REMAINS LARGELY THE SAME
   ADDITIONAL CHECKS FOR THEMING (Task 2.2):
1. THEME APPLICATION & VALIDATION:
    [ ] Verify: All properties in `ThemeSettingsV1` (from `themeguide.md`) are processed by `_applyTheme`.
    [ ] Verify: For each theme property, if an *invalid* value is provided in `config.theme`:
        [ ] A warning is logged by the component's logger detailing the property, invalid value, and fallback.
        [ ] An 'error' event with `errorCode: 'THEME_INVALID_VALUE'` and relevant details is dispatched.
        [ ] The corresponding CSS Custom Property on the host element is set to the documented default value for that property.
        [ ] The component's visual appearance reflects the default value for that property.
    [ ] Verify: If a theme property is *omitted* from `config.theme`, its documented default value is used for the CSS Custom Property and visuals.
    [ ] Verify: If a *valid* value is provided for a theme property, the CSS Custom Property is set correctly, and visuals reflect this.
    [ ] Verify: Test with a "worst-case" theme object containing multiple invalid values. Ensure all are handled, fallbacks applied, and component remains stable.
    [ ] Verify: `themeApplied` event is dispatched after `_applyTheme` completes, with `event.detail.effectiveTheme` reflecting the applied (validated/defaulted) theme.
    [ ] Verify: Styles in Shadow DOM correctly use `var(--ve-cw-propertyName, DEFAULT_VALUE_IN_CSS)` for all themeable aspects.
    [ ] Verify: Runtime theme changes:
        [ ] Set initial config with theme A.
        [ ] Later, set `carousel.config = newConfigWithThemeB`.
        [ ] Verify CSS Custom Properties and visuals update to reflect Theme B.
        [ ] Verify `themeApplied` event is dispatched again.

2. CANCEL BUTTON THEMING (Specific Checks):
    [ ] Verify: `cancelButtonBackground`, `cancelButtonIconColor`, `cancelButtonSize`, `cancelButtonMobileSize`, `cancelButtonRadius`, `cancelButtonOffsetTop`, `cancelButtonOffsetRight`, `cancelButtonShadow`, `cancelButtonFocusRingColor` from `ThemeSettingsV1` correctly style the cancel button via their respective CSS Custom Properties.
    [ ] Verify: Default values for cancel button theming are applied if properties are missing/invalid.
    [ ] Verify responsive styling for cancel button size/offsets (desktop vs. mobile viewports).
*/
