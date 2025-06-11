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
const DEFAULT_SLIDE_TRANSITION_DURATION = 500; // ms for opacity fade

const DEFAULT_THEME = Object.freeze({ /* ... (Keep full DEFAULT_THEME from previous step) ... */
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    componentBackground: '#333333', primaryTextColor: '#FFFFFF', baseFontSize: '16px',
    slideTitleColor: '#FFFFFF', slideTitleFontSize: '2em', slideDescriptionColor: '#FFFFFF',
    slideDescriptionFontSize: '1.2em', slideMediaOverlayBackground: 'rgba(0,0,0,0.5)',
    botMessageBackground: 'rgba(0,0,0,0.8)', botMessageTextColor: '#FFFFFF', botMessageBorderRadius: '4px',
    botMessageFontSize: '1em', botMessageTierLowAccentColor: '#5bc0de', botMessageTierHighAccentColor: '#f0ad4e',
    botMessageTierCriticalBackground: '#d9534f', botMessageTierCriticalTextColor: '#FFFFFF',
    accentColor: '#007bff', cancelButtonBackground: '#dc3545', cancelButtonIconColor: '#ffffff',
    cancelButtonSize: '60px', cancelButtonMobileSize: '50px', cancelButtonRadius: '50%',
    cancelButtonOffsetTop: '1.5rem', cancelButtonOffsetRight: '1.5rem',
    cancelButtonShadow: '0 2px 8px rgba(0,0,0,0.25)', cancelButtonFocusRingColor: 'rgba(220, 53, 69, 0.5)',
    focusIndicatorHostShadow: 'rgba(0, 123, 255, 0.5)', focusIndicatorButtonShadow: 'rgba(0, 123, 255, 0.5)',
    debugBorderColor: '#adb5bd', placeholderTextColor: '#6c757d', errorTextColor: '#721c24',
    errorBgColor: '#f8d7da', errorBorderColor: '#f5c6cb',
    slideTransitionDuration: `${DEFAULT_SLIDE_TRANSITION_DURATION}ms`, // New theme prop for transition speed
    slideMediaPlaceholderBackground: 'rgba(255,255,255,0.1)', // For lazy load placeholder
    slideMediaErrorTextColor: 'rgba(255,255,255,0.8)', // For media load error text
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

    // Slide and Autoplay State
    #slideElements = []; // Array of actual DOM elements for slides
    #currentSlideIndex = 0;
    #totalSlides = 0;
    #autoplayTimerId = null;
    #isPlaying = false; // Tracks if autoplay is active or should be active
    #transitionDuration = DEFAULT_SLIDE_TRANSITION_DURATION;
    #prefersReducedMotion = false;
    #intersectionObserver = null; // For pauseWhenHidden
    #mediaLazyLoadObserver = null; // For lazy loading media

    #boundHandleCancelClick;
    #boundHandleHostKeydown;
    #boundHandleVisibilityChange; // For pauseWhenHidden
    #boundHandleMediaIntersection; // For lazy loading

    static get observedAttributes() { return []; }

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: 'open' });
        this.#logger = new ConsoleLogger({ component: 'VECarouselWaitroom', level: LogLevel.INFO });
        this.#logger.info(`Constructor: Version ${this.version}. Default logger active.`);

        this.#boundHandleCancelClick = this._handleCancelClick.bind(this);
        this.#boundHandleHostKeydown = this._handleHostKeydown.bind(this);
        this.#boundHandleVisibilityChange = this._handleVisibilityChange.bind(this);
        this.#boundHandleMediaIntersection = this._handleMediaIntersection.bind(this);

        this.#prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // --- Logger, Version, API Versions, Config (mostly same as Phase 1 sign-off) ---
    set logger(newLogger) { /* ... same ... */
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

    set config(newConfig) { /* ... same validation logic as Phase 1 sign-off ... */
        this.#logger.info("Configuration received.", { hasConfig: !!newConfig });
        if (!newConfig || typeof newConfig !== 'object') {
            this.#logger.error("Invalid config: Must be an object.", { type: typeof newConfig });
            this._renderFailSafe("Invalid configuration provided."); this.#internalConfig = null;
            this._dispatchEvent('error', { errorCode: 'INVALID_CONFIG', reason: 'Config must be an object.' }); return;
        }
        if (!Array.isArray(newConfig.slides)) {
            this.#logger.error("Invalid config: 'slides' must be an array.", { slidesType: typeof newConfig.slides });
            this._renderFailSafe("Slide config missing/invalid (must be array)."); this.#internalConfig = null;
            this._dispatchEvent('error', { errorCode: 'INVALID_CONFIG_SLIDES', reason: "'slides' must be an array." }); return;
        }
        this.#internalConfig = {
            slides: newConfig.slides,
            theme: (typeof newConfig.theme === 'object' && newConfig.theme !== null) ? { ...newConfig.theme } : {},
            accessibility: (typeof newConfig.accessibility === 'object' && newConfig.accessibility !== null) ? { ...newConfig.accessibility } : {},
            carousel: (typeof newConfig.carousel === 'object' && newConfig.carousel !== null) ? { ...newConfig.carousel } : {}
        };
        if (!this.#internalConfig.theme) this.#logger.warn("Config: 'theme' missing, using defaults.");
        if (!this.#internalConfig.accessibility) this.#logger.warn("Config: 'accessibility' missing, using defaults.");
        if (!this.#internalConfig.carousel) this.#logger.warn("Config: 'carousel' settings missing, using defaults.");
        this.#logger.info("Config processed.");
        this._dispatchEvent('configApplied', { /* config: this.#internalConfig */ });
        if (this.isConnected) this._applyFullConfig();
    }
    get config() { return this.#internalConfig; }

    // --- Public API Methods ---
    freeze() {
        this.#logger.info("API: freeze() invoked.");
        this.pause('freeze_api'); // Call pause with a reason
        this._dispatchEvent('frozen');
    }

    thaw() {
        this.#logger.info("API: thaw() invoked.");
        // Only play if autoplay was intended as per config
        if (this.#internalConfig?.carousel?.interval > 0) {
            this.play('thaw_api');
        }
        this._dispatchEvent('thawed');
    }

    showBotMessage(message, options = {}) { /* ... same as Phase 1 sign-off ... */
        const { tier = 'low', duration = 5000 } = options;
        this.#logger.info("API: showBotMessage()", { message, tier, duration });
        if (this.#botMessageAreaEl) {
            const messageP = document.createElement('p'); messageP.textContent = message;
            this.#botMessageAreaEl.innerHTML = ''; this.#botMessageAreaEl.appendChild(messageP);
            this.#botMessageAreaEl.className = `bot-message-area__waitroom tier-${tier}`;
            this.#botMessageAreaEl.style.display = 'block';
            this.#botMessageAreaEl.setAttribute('aria-hidden', 'false');
            this._announceToScreenReader(`Notification: ${message}`);
            this._dispatchEvent('botMessageShown', { message, tier });
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


    play(trigger = 'play_api') {
        this.#logger.info(`API: play() invoked by ${trigger}.`);
        if (!this.#internalConfig || this.#totalSlides === 0) {
            this.#logger.warn("Play called but no slides or config available.");
            return;
        }
        this.#isPlaying = true;
        this._startAutoplay();
        this._dispatchEvent('playTriggered', { trigger });
    }

    pause(trigger = 'pause_api') {
        this.#logger.info(`API: pause() invoked by ${trigger}.`);
        this.#isPlaying = false;
        this._stopAutoplay();
        this._dispatchEvent('pauseTriggered', { trigger });
    }

    goToSlide(index, trigger = 'api') {
        this.#logger.info(`API: goToSlide(${index}) invoked by ${trigger}.`);
        if (!this.#internalConfig || this.#totalSlides === 0) {
            this.#logger.warn("goToSlide called but no slides or config.");
            return;
        }
        if (index >= 0 && index < this.#totalSlides) {
            if (index === this.#currentSlideIndex && trigger !== 'config_apply') { // config_apply might "go to" current index on re-render
                this.#logger.info(`Already on slide ${index}. No change.`);
                return;
            }
            this._stopAutoplay(); // Stop autoplay when manually navigating
            this._showSlide(index, trigger);
            if (this.#isPlaying) this._startAutoplay(); // Resume if it was playing
        } else {
            this.#logger.warn(`Invalid slide index: ${index}. Total slides: ${this.#totalSlides}.`);
            this._dispatchEvent('error', { errorCode: 'INVALID_SLIDE_INDEX', reason: `Index ${index} out of bounds.` });
        }
    }

    reset(trigger = 'reset_api') {
        this.#logger.info(`API: reset() invoked by ${trigger}.`);
        if (this.#totalSlides > 0) {
            this.goToSlide(0, trigger);
        }
        // TODO: Clear bot messages, reset other states if necessary
        this._dispatchEvent('reset', { trigger });
    }

    // --- Lifecycle Callbacks ---
    connectedCallback() {
        this.#logger.info(`Connected. V:${this.version}, ThemeAPI:${this.themeApiVersion}, A11yAPI:${this.accessibilityApiVersion}.`);
        if (!this.#isExternalLoggerInjected) this.#logger.warn("CRITICAL: No external logger. Using default. NOT FOR CLINICAL PRODUCTION.");

        if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
        const initialAriaLabel = this.#internalConfig?.accessibility?.carouselLabel || DEFAULT_HOST_LABEL;
        this.setAttribute('aria-label', initialAriaLabel);
        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

        this._renderScaffold();
        this._attachInternalEventListeners();
        this._setupIntersectionObservers();
        this._setInitialFocus();

        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.#prefersReducedMotion = e.matches;
            this.#logger.info(`Prefers reduced motion: ${this.#prefersReducedMotion}`);
            // Re-apply transition duration or update classes on slides
            this._applyTransitionDuration();
        });


        if (this.#internalConfig) this._applyFullConfig();
        else {
            this.#logger.error("Connected, no config. Fail-safe. Set 'config' property.");
            this._renderFailSafe("Carousel configuration missing.");
            this._dispatchEvent('error', { errorCode: 'CONFIG_MISSING_ON_CONNECT', reason: 'No config on connect.' });
        }
        this._dispatchEvent('carouselReady', { version: this.version, supportedThemeApi: this.themeApiVersion, supportedAccessibilityApi: this.accessibilityApiVersion, initialConfigPresent: !!this.#internalConfig, loggerInjected: this.#isExternalLoggerInjected });
    }

    disconnectedCallback() {
        this.#logger.info("Disconnected. Cleaning up.");
        if (this.#cancelButtonEl) this.#cancelButtonEl.removeEventListener('click', this.#boundHandleCancelClick);
        this.removeEventListener('keydown', this.#boundHandleHostKeydown);
        this._stopAutoplay();
        if (this.#intersectionObserver) this.#intersectionObserver.disconnect();
        if (this.#mediaLazyLoadObserver) this.#mediaLazyLoadObserver.disconnect();
        // TODO: Remove prefers-reduced-motion listener
    }

    // --- Rendering & DOM Management ---
    _renderScaffold() {
        this.#logger.debug("Rendering scaffold structure.");
        this.#shadow.innerHTML = `
            <style>
                /* ... (Keep full styles from Phase 1 sign-off, including .cancel-button__waitroom, .bot-message-area__waitroom, etc.) ... */
                /* ADDED/MODIFIED for Phase 2.1: */
                :host {
                    display: block; width: 100%; height: 100%; position: relative; overflow: hidden;
                    background: var(--ve-cw-component-background, ${DEFAULT_THEME.componentBackground});
                    color: var(--ve-cw-primary-text-color, ${DEFAULT_THEME.primaryTextColor});
                    font-family: var(--ve-cw-font-family, ${DEFAULT_THEME.fontFamily});
                    font-size: var(--ve-cw-base-font-size, ${DEFAULT_THEME.baseFontSize});
                    outline: none;                    
                    --ve-cw-slide-transition-duration: ${DEFAULT_THEME.slideTransitionDuration}; /* Default transition duration */
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
                .slides-area__waitroom {
                    /* ... other styles ... */
                    position: relative; /* For absolute positioning of slides within */
                }
                .slide__waitroom {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    opacity: 0;
                    visibility: hidden; /* Hide non-active slides for a11y and performance */
                    transition: opacity var(--ve-cw-slide-transition-duration, ${DEFAULT_THEME.slideTransitionDuration}) ease-in-out,
                                visibility var(--ve-cw-slide-transition-duration, ${DEFAULT_THEME.slideTransitionDuration}) ease-in-out;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column; /* Default for content slides */
                    text-align: center;
                    color: var(--ve-cw-primary-text-color, ${DEFAULT_THEME.primaryTextColor}); /* Fallback */
                    background-color: var(--ve-cw-slide-default-bg, transparent); /* Fallback for individual slide bg */
                }
                :host([prefers-reduced-motion]) .slide__waitroom {
                    transition: none !important;
                }
                .slide__waitroom--active {
                    opacity: 1;
                    visibility: visible;
                    z-index: 1; /* Bring active slide to front */
                }
                .slide-content-wrapper { /* For content slides */
                    padding: 2rem;
                    max-width: 80%;
                }
                .slide-title__waitroom {
                    font-size: var(--ve-cw-slide-title-font-size, ${DEFAULT_THEME.slideTitleFontSize});
                    color: var(--ve-cw-slide-title-color, ${DEFAULT_THEME.slideTitleColor});
                    margin-bottom: 0.75rem;
                }
                .slide-description__waitroom {
                    font-size: var(--ve-cw-slide-description-font-size, ${DEFAULT_THEME.slideDescriptionFontSize});
                    color: var(--ve-cw-slide-description-color, ${DEFAULT_THEME.slideDescriptionColor});
                    line-height: 1.6;
                }
                /* Image/Video specific styling */
                .slide__waitroom--media { /* Class for image/video slides */
                    /* background might be set by slide.background or theme.componentBackground */
                }
                .slide-media-container { /* Holds the image/video and its overlay */
                    width: 100%; height: 100%;
                    display: flex; align-items: center; justify-content: center;
                    position: relative;
                }
                .slide-media__image, .slide-media__video {
                    display: block; /* Remove extra space below inline elements */
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain; /* Ensures media fits without cropping, maintaining aspect ratio */
                    border-radius: var(--ve-cw-slide-media-border-radius, 8px); /* Example, make themeable */
                }
                .slide-media-content-overlay {
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                    padding: 1.5rem;
                    background: var(--ve-cw-slide-media-overlay-background, ${DEFAULT_THEME.slideMediaOverlayBackground});
                    text-align: center;
                    z-index: 2;
                }
                .slide-media-placeholder {
                    width: 80%; height: 60%; /* Example */
                    max-width: 600px; max-height: 400px;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    background: var(--ve-cw-slide-media-placeholder-background, ${DEFAULT_THEME.slideMediaPlaceholderBackground});
                    border-radius: 8px;
                    color: var(--ve-cw-placeholder-text-color, ${DEFAULT_THEME.placeholderTextColor});
                }
                .slide-media-placeholder .spinner { /* Basic spinner */
                    width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3);
                    border-top-color: var(--ve-cw-primary-text-color, ${DEFAULT_THEME.primaryTextColor});
                    border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 10px;
                }
                .slide-media-error {
                     color: var(--ve-cw-slide-media-error-text-color, ${DEFAULT_THEME.slideMediaErrorTextColor});
                     font-style: italic;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
            <div class="container__waitroom" id="waitroom-container-host-id">
                <div class="slides-area__waitroom" id="slide-display-area-id">
                    <p class="slides-area__waitroom-message">Carousel initializing...</p>
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

    _applyFullConfig() { /* ... same as Phase 1 sign-off, calls _applyTheme, _applyAccessibilitySettings, _renderSlides ... */
        if (!this.#internalConfig || !this.isConnected) {
            this.#logger.debug("Skipping _applyFullConfig: No config or not connected."); return;
        }
        this.#logger.info("Applying full configuration.");
        this._resetInternalState();
        this._applyTheme(this.#internalConfig.theme || {}); // Already implemented in P2.2
        this._applyAccessibilitySettings(this.#internalConfig.accessibility || {});
        this._renderSlides(this.#internalConfig.slides || []); // This will now do actual rendering
        this._configureAutoplay(); // New method to handle autoplay setup
    }

    _resetInternalState() {
        this.#logger.debug("Resetting internal state for re-configuration.");
        this._stopAutoplay();
        this.#slideElements.forEach(el => el.remove()); // Remove old slide DOM elements
        this.#slideElements = [];
        this.#currentSlideIndex = 0;
        this.#totalSlides = 0;
        if (this.#slideDisplayAreaEl) {
            this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">Re-configuring slides...</p>`;
        }
        // Re-initialize lazy load observer if it exists
        if (this.#mediaLazyLoadObserver) {
            this.#mediaLazyLoadObserver.disconnect();
            this._setupMediaLazyLoadObserver(); // Setup again for new slides
        }
        this.#logger.debug("Internal state reset.");
    }

    /** @param {object} themeConfig */
    _applyTheme(themeConfigInput) { /* ... same as P2.2 sign-off ... */
        const themeConfig = themeConfigInput || {};
        this.#logger.info("Applying theme.", { numThemeProps: Object.keys(themeConfig).length });
        const themePropertyMap = { /* ... (full map from P2.2) ... */
            fontFamily: '--ve-cw-font-family', componentBackground: '--ve-cw-component-background', primaryTextColor: '--ve-cw-primary-text-color',
            baseFontSize: '--ve-cw-base-font-size', slideTitleColor: '--ve-cw-slide-title-color', slideTitleFontSize: '--ve-cw-slide-title-font-size',
            slideDescriptionColor: '--ve-cw-slide-description-color', slideDescriptionFontSize: '--ve-cw-slide-description-font-size',
            slideMediaOverlayBackground: '--ve-cw-slide-media-overlay-background', botMessageBackground: '--ve-cw-bot-message-background',
            botMessageTextColor: '--ve-cw-bot-message-text-color', botMessageBorderRadius: '--ve-cw-bot-message-border-radius',
            botMessageFontSize: '--ve-cw-bot-message-font-size', botMessageTierLowAccentColor: '--ve-cw-bot-message-tier-low-accent',
            botMessageTierHighAccentColor: '--ve-cw-bot-message-tier-high-accent', botMessageTierCriticalBackground: '--ve-cw-bot-message-tier-critical-bg',
            botMessageTierCriticalTextColor: '--ve-cw-bot-message-tier-critical-text', accentColor: '--ve-cw-accent-color',
            cancelButtonBackground: '--ve-cw-cancel-button-background', cancelButtonIconColor: '--ve-cw-cancel-button-icon-color',
            cancelButtonSize: '--ve-cw-cancel-button-size', cancelButtonMobileSize: '--ve-cw-cancel-button-mobile-size',
            cancelButtonRadius: '--ve-cw-cancel-button-radius', cancelButtonOffsetTop: '--ve-cw-cancel-button-offset-top',
            cancelButtonOffsetRight: '--ve-cw-cancel-button-offset-right', cancelButtonShadow: '--ve-cw-cancel-button-shadow',
            cancelButtonFocusRingColor: '--ve-cw-cancel-button-focus-ring-color', focusIndicatorHostShadow: '--ve-cw-focus-indicator-host-shadow',
            focusIndicatorButtonShadow: '--ve-cw-focus-indicator-button-shadow', debugBorderColor: '--ve-cw-debug-border-color',
            placeholderTextColor: '--ve-cw-placeholder-text-color', errorTextColor: '--ve-cw-error-text-color',
            errorBgColor: '--ve-cw-error-bg-color', errorBorderColor: '--ve-cw-error-border-color',
            slideTransitionDuration: '--ve-cw-slide-transition-duration',
            slideMediaPlaceholderBackground: '--ve-cw-slide-media-placeholder-background',
            slideMediaErrorTextColor: '--ve-cw-slide-media-error-text-color',
        };
        let effectiveTheme = {};
        for (const key in DEFAULT_THEME) {
            const cssVarName = themePropertyMap[key]; if (!cssVarName) continue;
            let valueToApply = themeConfig[key]; let validationFn;
            if (key.toLowerCase().includes('color') || (key.toLowerCase().includes('background') && !key.toLowerCase().includes('image'))) validationFn = this._validateCssBackground.bind(this);
            else if (key.toLowerCase().includes('size') || key.toLowerCase().includes('radius') || key.toLowerCase().includes('offset') || key.toLowerCase().includes('duration')) validationFn = this._validateCssSize.bind(this);
            else if (key.toLowerCase().includes('family')) validationFn = this._validateFontFamily.bind(this);
            else if (key.toLowerCase().includes('shadow')) validationFn = this._validateShadow.bind(this);
            else validationFn = (val, defVal) => val !== undefined ? val : defVal;
            const validatedValue = validationFn(valueToApply, DEFAULT_THEME[key], key);
            this.style.setProperty(cssVarName, validatedValue); effectiveTheme[key] = validatedValue;
        }
        // Derived focus colors
        const finalAccentColor = effectiveTheme.accentColor || DEFAULT_THEME.accentColor;
        if (!themeConfig.focusIndicatorHostShadow) {
            const derivedFocus = `rgba(${this._hexToRgb(finalAccentColor)?.join(',') || '0,90,180'}, 0.6)`;
            this.style.setProperty(themePropertyMap.focusIndicatorHostShadow, derivedFocus);
            effectiveTheme.focusIndicatorHostShadow = derivedFocus;
        }
        if (!themeConfig.cancelButtonFocusRingColor) {
            const cancelBg = effectiveTheme.cancelButtonBackground || DEFAULT_THEME.cancelButtonBackground;
            const derivedCancelFocus = `rgba(${this._hexToRgb(cancelBg)?.join(',') || '220,53,69'}, 0.5)`;
            this.style.setProperty(themePropertyMap.cancelButtonFocusRingColor, derivedCancelFocus);
            effectiveTheme.cancelButtonFocusRingColor = derivedCancelFocus;
        }
        this.#transitionDuration = this._parseCssDuration(effectiveTheme.slideTransitionDuration || DEFAULT_THEME.slideTransitionDuration);
        this._applyTransitionDuration(); // Apply to existing slides if any
        this.#logger.info("Theme applied."); this._dispatchEvent('themeApplied', { effectiveTheme });
    }

    /** @param {object} accessibilityConfig */
    _applyAccessibilitySettings(accessibilityConfig) { /* ... same as Phase 1 sign-off ... */
        this.#logger.info("Applying accessibility settings.", { accessibilityConfig });
        const hostLabel = accessibilityConfig.carouselLabel || DEFAULT_HOST_LABEL;
        if (this.getAttribute('aria-label') !== hostLabel) {
            this.setAttribute('aria-label', hostLabel); this.#logger.debug(`Host aria-label set: "${hostLabel}"`);
        }
        if (this.#cancelButtonEl) {
            const cancelLabel = accessibilityConfig.cancelButtonAriaLabel || DEFAULT_CANCEL_BUTTON_ARIA_LABEL;
            if (this.#cancelButtonEl.getAttribute('aria-label') !== cancelLabel) {
                this.#cancelButtonEl.setAttribute('aria-label', cancelLabel); this.#logger.debug(`Cancel button aria-label set: "${cancelLabel}"`);
            }
        }
    }

    /** @param {Array<object>} slidesConfig */
    _renderSlides(slidesConfig) {
        this.#logger.info(`Rendering ${slidesConfig.length} slides.`);
        if (!this.#slideDisplayAreaEl) {
            this.#logger.error("Slide display area not found. Cannot render slides.");
            this._renderFailSafe("Internal error: Slide display area missing.");
            return;
        }

        // Clear previous slides and reset state
        this.#slideDisplayAreaEl.innerHTML = ''; // Clear out old placeholders or slides
        this.#slideElements = [];
        this.#currentSlideIndex = 0;
        this.#totalSlides = slidesConfig.length;

        if (this.#totalSlides === 0) {
            const noSlidesText = this.#internalConfig?.accessibility?.noSlidesText || "No information to display at this time.";
            this.#slideDisplayAreaEl.innerHTML = `<p class="slides-area__waitroom-message">${noSlidesText}</p>`;
            this._announceToScreenReader(noSlidesText);
            this._updateDebugSlideDisplay(); // Update debug display for 0 slides
            return;
        }

        slidesConfig.forEach((slideData, index) => {
            const slideElement = this._createSlideElement(slideData, index);
            this.#slideElements.push(slideElement);
            this.#slideDisplayAreaEl.appendChild(slideElement);
            if (this.#mediaLazyLoadObserver && slideElement.querySelector('.slide-media-placeholder')) {
                this.#mediaLazyLoadObserver.observe(slideElement.querySelector('.slide-media-placeholder'));
            } else if (!this.#mediaLazyLoadObserver && (slideData.type === 'image' || slideData.type === 'video')) {
                // Fallback if observer isn't setup (e.g. very old browser) or for immediate load
                this._loadMediaForSlide(slideElement, slideData, index);
            }
        });
        this._updateDebugSlideDisplay(); // Update debug display with correct total

        if (this.#slideElements.length > 0) {
            this._showSlide(0, 'initial'); // Show the first slide
        }
    }

    /**
     * Creates a single slide element based on slideData.
     * @param {object} slideData - Configuration for the slide.
     * @param {number} index - Index of the slide.
     * @returns {HTMLElement} The created slide element.
     */
    _createSlideElement(slideData, index) {
        this.#logger.debug(`Creating slide element for index ${index}`, { type: slideData.type });
        const slideElement = document.createElement('div');
        slideElement.className = 'slide__waitroom';
        if (this.#prefersReducedMotion) slideElement.classList.add('slide__waitroom--reduced-motion');
        slideElement.dataset.slideIndex = String(index);
        slideElement.setAttribute('role', 'group'); // Each slide is a group
        slideElement.setAttribute('aria-roledescription', 'slide');
        slideElement.setAttribute('aria-label', slideData.title || `Slide ${index + 1}`);

        // Apply individual slide background if specified
        if (slideData.background && slideData.type === 'content') { // Only for content type or as general override?
            slideElement.style.background = this._validateCssBackground(slideData.background, 'transparent', `slide[${index}].background`);
        }

        let innerHTML = '';
        switch (slideData.type) {
            case 'image':
                slideElement.classList.add('slide__waitroom--media');
                innerHTML = `
                    <div class="slide-media-container">
                        <div class="slide-media-placeholder" data-media-type="image">
                            <div class="spinner"></div>
                            <p>Loading image...</p>
                        </div>
                        <img class="slide-media__image" data-src="${this._sanitizeUrl(slideData.src)}" alt="${this._sanitizeText(slideData.alt || slideData.title || '')}" style="display:none;">
                    </div>
                    ${(slideData.title || slideData.description) ? `
                    <div class="slide-media-content-overlay">
                        ${slideData.title ? `<h2 class="slide-title__waitroom">${this._sanitizeText(slideData.title)}</h2>` : ''}
                        ${slideData.description ? `<p class="slide-description__waitroom">${this._sanitizeText(slideData.description)}</p>` : ''}
                    </div>` : ''}
                `;
                break;
            case 'video':
                slideElement.classList.add('slide__waitroom--media');
                innerHTML = `
                    <div class="slide-media-container">
                         <div class="slide-media-placeholder" data-media-type="video">
                            <div class="spinner"></div>
                            <p>Loading video...</p>
                        </div>
                        <video class="slide-media__video" data-src="${this._sanitizeUrl(slideData.src)}"
                               ${slideData.poster ? `poster="${this._sanitizeUrl(slideData.poster)}"` : ''}
                               ${slideData.muted ? 'muted' : ''}
                               ${slideData.loop ? 'loop' : ''}
                               playsinline preload="metadata" style="display:none;">
                            ${this._sanitizeText(slideData.fallbackText || 'Your browser does not support the video tag.')}
                        </video>
                    </div>
                    ${(slideData.title || slideData.description) ? `
                    <div class="slide-media-content-overlay">
                        ${slideData.title ? `<h2 class="slide-title__waitroom">${this._sanitizeText(slideData.title)}</h2>` : ''}
                        ${slideData.description ? `<p class="slide-description__waitroom">${this._sanitizeText(slideData.description)}</p>` : ''}
                    </div>` : ''}
                `;
                break;
            case 'content':
            default:
                innerHTML = `
                    <div class="slide-content-wrapper">
                        ${slideData.title ? `<h2 class="slide-title__waitroom">${this._sanitizeText(slideData.title)}</h2>` : ''}
                        ${slideData.description ? `<p class="slide-description__waitroom">${this._sanitizeText(slideData.description)}</p>` : ''}
                    </div>
                `;
                break;
        }
        slideElement.innerHTML = innerHTML;
        return slideElement;
    }

    /**
     * Handles making a slide visible.
     * @param {number} index - The index of the slide to show.
     * @param {string} [trigger='unknown'] - Source of the slide change.
     */
    _showSlide(index, trigger = 'unknown') {
        if (!this.#slideElements[index] || this.#totalSlides === 0) {
            this.#logger.warn(`_showSlide: Attempted to show non-existent slide at index ${index}.`);
            return;
        }

        const oldIndex = this.#currentSlideIndex;
        const oldSlideElement = this.#slideElements[oldIndex];
        const newSlideElement = this.#slideElements[index];

        if (oldSlideElement && oldIndex !== index) {
            oldSlideElement.classList.remove('slide__waitroom--active');
            oldSlideElement.setAttribute('aria-hidden', 'true');
            const oldVideo = oldSlideElement.querySelector('video');
            if (oldVideo && !oldVideo.paused) oldVideo.pause();
        }

        newSlideElement.classList.add('slide__waitroom--active');
        newSlideElement.setAttribute('aria-hidden', 'false');
        // Lazy load media if not already loaded by IntersectionObserver (or if observer not supported)
        const slideData = this.#internalConfig.slides[index];
        if (slideData && (slideData.type === 'image' || slideData.type === 'video')) {
            this._loadMediaForSlide(newSlideElement, slideData, index, true /* forcePlayVideo if active */);
        }


        this.#currentSlideIndex = index;
        this._updateDebugSlideDisplay(); // Update debug info for real index

        const announcement = `Slide ${index + 1} of ${this.#totalSlides}. ${this.#internalConfig.slides[index]?.title || ''}`.trim();
        this._announceToScreenReader(announcement);

        this._dispatchEvent('slideChanged', {
            currentIndex: this.#currentSlideIndex,
            totalSlides: this.#totalSlides,
            slideData: this.#internalConfig.slides[this.#currentSlideIndex],
            trigger
        });
    }

    _loadMediaForSlide(slideElement, slideData, slideIndex, playVideoIfActive = false) {
        const placeholder = slideElement.querySelector('.slide-media-placeholder');
        const mediaElement = slideElement.querySelector(slideData.type === 'image' ? '.slide-media__image' : '.slide-media__video');

        if (!mediaElement || mediaElement.src || mediaElement.dataset.loaded === 'true') {
            // Already loading or loaded, or no media element found
            if (playVideoIfActive && slideData.type === 'video' && mediaElement?.dataset.loaded === 'true' && this.#isPlaying) {
                 mediaElement.play().catch(e => this.#logger.debug(`Autoplay for video ${slideIndex} prevented.`, e.message));
            }
            return;
        }
        
        mediaElement.dataset.loaded = 'pending'; // Mark as attempting to load
        this.#logger.debug(`Lazy loading media for slide ${slideIndex}: ${slideData.src}`);

        const showMedia = () => {
            if (placeholder) placeholder.style.display = 'none';
            mediaElement.style.display = 'block';
            mediaElement.dataset.loaded = 'true';
             if (slideData.type === 'video' && playVideoIfActive && this.#isPlaying && (slideData.videoAutoplay !== false)) {
                mediaElement.play().catch(e => this.#logger.debug(`Autoplay for video ${slideIndex} prevented.`, e.message));
            }
        };

        const handleError = (error) => {
            this.#logger.error(`Failed to load ${slideData.type} for slide ${slideIndex}: ${slideData.src}`, error);
            if (placeholder) {
                placeholder.innerHTML = `<p class="slide-media-error">Error loading ${slideData.type}.</p>`;
            }
            mediaElement.dataset.loaded = 'error';
            this._dispatchEvent('error', { errorCode: 'MEDIA_LOAD_ERROR', slideIndex, src: slideData.src, mediaType: slideData.type });
        };

        if (slideData.type === 'image') {
            mediaElement.onload = showMedia;
            mediaElement.onerror = handleError;
            mediaElement.src = mediaElement.dataset.src;
        } else if (slideData.type === 'video') {
            mediaElement.onloadeddata = showMedia; // Use onloadeddata for better chance video can play
            mediaElement.onerror = handleError;
            mediaElement.src = mediaElement.dataset.src;
            mediaElement.load(); // Important for some browsers with data-src
        }
    }

    _applyTransitionDuration() {
        const duration = this.#prefersReducedMotion ? '0s' : `var(--ve-cw-slide-transition-duration, ${DEFAULT_THEME.slideTransitionDuration})`;
        this.style.setProperty('--ve-cw-effective-slide-transition-duration', duration);
        // And apply to existing slides if needed, or rely on CSS inheritance/var usage
         this.#slideElements.forEach(slideEl => {
            slideEl.style.transitionDuration = duration;
        });
        this.#logger.debug(`Effective slide transition duration set to: ${duration}`);
    }


    _configureAutoplay() {
        this._stopAutoplay(); // Clear any existing timer
        const interval = this.#internalConfig?.carousel?.interval;
        if (interval > 0 && this.#totalSlides > 1) {
            this.#isPlaying = true; // Assume play if interval is set
            this._startAutoplay();
            this.#logger.info(`Autoplay configured with interval: ${interval}ms.`);
        } else {
            this.#isPlaying = false;
            this.#logger.info("Autoplay not configured or not enough slides.");
        }
    }

    _startAutoplay() {
        this._stopAutoplay(); // Ensure no duplicate timers
        if (!this.#isPlaying || !this.#internalConfig?.carousel?.interval || this.#totalSlides <= 1) {
            return;
        }
        const interval = parseInt(this.#internalConfig.carousel.interval, 10);
        if (isNaN(interval) || interval <= 0) {
            this.#logger.warn(`Invalid autoplay interval: ${this.#internalConfig.carousel.interval}. Autoplay not started.`);
            return;
        }

        this.#logger.debug(`Starting autoplay timer with interval: ${interval}ms.`);
        this.#autoplayTimerId = setTimeout(() => {
            if (this.#isPlaying) { // Double check if still supposed to be playing
                this._goToNextSlide('autoplay');
            }
        }, interval);
    }

    _stopAutoplay() {
        if (this.#autoplayTimerId) {
            clearTimeout(this.#autoplayTimerId);
            this.#autoplayTimerId = null;
            this.#logger.debug("Autoplay timer stopped.");
        }
    }

    _goToNextSlide(trigger = 'autoplay') {
        if (this.#totalSlides === 0) return;
        let newIndex = this.#currentSlideIndex + 1;
        if (newIndex >= this.#totalSlides) {
            if (this.#internalConfig?.carousel?.loop) {
                newIndex = 0;
            } else {
                this.#logger.info("Reached end of slides, not looping. Autoplay will stop.");
                this.pause('autoplay_end_no_loop'); // Stop autoplay
                return; // Stay on the last slide
            }
        }
        this._showSlide(newIndex, trigger);
        // If autoplay initiated this, and still playing, queue next
        if (trigger === 'autoplay' && this.#isPlaying) {
            this._startAutoplay();
        }
    }

    _goToPreviousSlide(trigger = 'user') {
        if (this.#totalSlides === 0) return;
        let newIndex = this.#currentSlideIndex - 1;
        if (newIndex < 0) {
            if (this.#internalConfig?.carousel?.loop) {
                newIndex = this.#totalSlides - 1;
            } else {
                this.#logger.info("At first slide, not looping.");
                return; // Stay on the first slide
            }
        }
        this._showSlide(newIndex, trigger);
    }


    // --- Intersection Observers ---
    _setupIntersectionObservers() {
        // For pausing when hidden
        if ('IntersectionObserver' in window && this.#internalConfig?.pauseWhenHidden !== false) {
            this.#intersectionObserver = new IntersectionObserver(this.#boundHandleVisibilityChange, { threshold: 0.1 });
            this.#intersectionObserver.observe(this);
        }
        // For lazy loading media
        this._setupMediaLazyLoadObserver();
    }

    _setupMediaLazyLoadObserver() {
        if ('IntersectionObserver' in window) {
            if (this.#mediaLazyLoadObserver) this.#mediaLazyLoadObserver.disconnect(); // Disconnect old one
            this.#mediaLazyLoadObserver = new IntersectionObserver(this.#boundHandleMediaIntersection, {
                root: this.#slideDisplayAreaEl, // Observe within the slides container
                rootMargin: '0px 0px 100px 0px', // Start loading when slide is 100px from bottom of viewport
                threshold: 0.01 // Even a tiny bit visible
            });
        } else {
            this.#logger.warn("IntersectionObserver not supported. Media will load more eagerly.");
            // Fallback: load all media or visible + next/prev after a short delay
            // For now, _loadMediaForSlide called in _showSlide handles it if observer is not present.
        }
    }


    _handleVisibilityChange(entries) {
        entries.forEach(entry => {
            if (entry.target === this) {
                if (entry.isIntersecting) {
                    this.#logger.debug("Component became visible, resuming activity (if applicable).");
                    if (this.#internalConfig?.carousel?.interval > 0 && this.#isPlaying) { // Only resume if autoplay was intended
                       this.play('visibility_resume');
                    }
                } else {
                    this.#logger.debug("Component became hidden, pausing activity.");
                    this.pause('visibility_hidden');
                }
            }
        });
    }

    _handleMediaIntersection(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const placeholder = entry.target;
                const slideElement = placeholder.closest('.slide__waitroom');
                if (slideElement) {
                    const slideIndex = parseInt(slideElement.dataset.slideIndex, 10);
                    const slideData = this.#internalConfig?.slides[slideIndex];
                    if (slideData) {
                        this._loadMediaForSlide(slideElement, slideData, slideIndex, slideIndex === this.#currentSlideIndex);
                    }
                }
                observer.unobserve(placeholder); // Load once
            }
        });
    }


    // --- Fail Safe, Focus, Event Handlers, ARIA, Dispatch, Validation (mostly same as Phase 1 sign-off) ---
    _renderFailSafe(message) { /* ... same ... */
        this.#logger.error("Fail-safe render.", { failMessage: message });
        if (!this.#shadow?.firstChild) this._renderScaffold();
        const target = this.#slideDisplayAreaEl || this.#containerEl || this.#shadow;
        if (target) target.innerHTML = `<div class="fail-safe__message">${message}</div>`;
        this._announceToScreenReader(`Error: ${message}`);
        this._dispatchEvent('criticalError', { errorCode: 'FAIL_SAFE_RENDER', reason: message });
    }
    _setInitialFocus() { this.focus(); this.#logger.debug("Initial focus to host."); }
    _attachInternalEventListeners() { /* ... same ... */
        if (this.#cancelButtonEl) {
            this.#cancelButtonEl.removeEventListener('click', this.#boundHandleCancelClick);
            this.#cancelButtonEl.addEventListener('click', this.#boundHandleCancelClick);
        }
        this.removeEventListener('keydown', this.#boundHandleHostKeydown);
        this.addEventListener('keydown', this.#boundHandleHostKeydown);
        this.#logger.debug("Internal event listeners (re)attached.");
    }
    _handleCancelClick() { /* ... same, calls _internalPauseActivity which now calls this.pause() ... */
        this.#logger.info("Cancel button clicked.");
        this.pause('cancel_button'); // Use public pause method
        this._dispatchEvent('userCancelled', { timestamp: Date.now(), reason: 'cancel_button_click' });
    }
    _internalPauseActivity(reason) { /* This method is now effectively replaced by this.pause() internal logic */
        this.#logger.info(`(Deprecated) _internalPauseActivity called for ${reason}. Actual pausing via this.pause().`);
        // Core pausing logic (like _stopAutoplay) is now handled within or called by this.pause()
    }

    /** @param {KeyboardEvent} event */
    _handleHostKeydown(event) {
        this.#logger.debug(`Host keydown: Key='${event.key}'`); let handled = false;
        if (this.#totalSlides === 0 && event.key !== "Escape") return;
        switch (event.key) {
            case "Escape": this._handleCancelClick(); handled = true; break;
            case "ArrowLeft": case "ArrowUp": this._goToPreviousSlide('keyboard'); handled = true; break;
            case "ArrowRight": case "ArrowDown": case " ": this._goToNextSlide('keyboard'); handled = true; break;
            case "Home": this.goToSlide(0, 'keyboard_home'); handled = true; break;
            case "End": this.goToSlide(this.#totalSlides - 1, 'keyboard_end'); handled = true; break;
        }
        if (handled) event.preventDefault();
    }

    _getDebugSlideInfoText() { return this.#totalSlides > 0 ? `Slide: ${this.#currentSlideIndex + 1}/${this.#totalSlides}` : "No slides."; }
    _updateDebugSlideDisplay() { /* This will be removed as actual slides render */
        const el = this.#shadow.getElementById('debug-slide-info-id');
        if (el) el.textContent = this._getDebugSlideInfoText();
    }
    _announceToScreenReader(message) { /* ... same ... */
        if (this.#ariaLiveRegionEl) {
            this.#ariaLiveRegionEl.textContent = ''; this.#ariaLiveRegionEl.textContent = message;
            this.#logger.debug(`ARIA Live: "${message}"`);
        } else this.#logger.warn("ARIA live region not found.");
    }
    _dispatchEvent(eventName, detailPayload = {}) { /* ... same ... */
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
    _validateCssBackground(value, defaultValue, propertyName = 'unknown_bg_prop') {
        if (typeof value === 'string' && value.trim() !== '') {
            const val = value.trim();
            // Allow gradients or url
            if (
                val.startsWith('linear-gradient') ||
                val.startsWith('radial-gradient') ||
                val.startsWith('repeating-linear-gradient') ||
                val.startsWith('repeating-radial-gradient') ||
                val.startsWith('url(')
            ) {
                return val;
            }
            // Try color
            const s = new Option().style; s.color = val;
            if (s.color !== '') return val;
        }
        if (value !== undefined) {
            this.#logger.warn(`Invalid CSS background for ${propertyName}: "${value}". Using default "${defaultValue}".`);
            this._dispatchEvent('error', { errorCode: 'THEME_INVALID_VALUE', propertyName, receivedValue: String(value), fallbackValue: defaultValue });
        }
        return defaultValue;
    }    
    _parseCssDuration(durationStr) {
        if (typeof durationStr !== 'string') return DEFAULT_SLIDE_TRANSITION_DURATION;
        const matchMs = durationStr.match(/^(\d+(\.\d+)?)\s*ms$/i);
        if (matchMs) return parseFloat(matchMs[1]);
        const matchS = durationStr.match(/^(\d+(\.\d+)?)\s*s$/i);
        if (matchS) return parseFloat(matchS[1]) * 1000;
        this.#logger.warn(`Invalid CSS duration string: "${durationStr}". Using default.`);
        return DEFAULT_SLIDE_TRANSITION_DURATION;
    }
    _sanitizeText(text = '') { // Ensure text is always a string
        if (typeof text !== 'string') text = String(text);
        const  div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML; // Basic sanitization, consider DOMPurify for stronger needs
    }
    _sanitizeUrl(url = '') {
        if (typeof url !== 'string') url = String(url);
        // Basic check for common safe protocols. For true hardening, use a robust URL parser and allow-list.
        if (/^(https?:|data:image\/|blob:)/i.test(url) || (url.startsWith('/') && !url.startsWith('//'))) {
            return url;
        }
        this.#logger.warn(`Potentially unsafe URL sanitized: "${url}". Returning empty string or placeholder.`);
        this._dispatchEvent('error', {errorCode: 'UNSAFE_URL_SANITIZED', url});
        return ''; // Or return a placeholder image/video URL
    }
}

if (!customElements.get('ve-carousel-waitroom')) {
    customElements.define('ve-carousel-waitroom', VECarouselWaitroom);
}

/*
MANUAL TEST HARNESS CHECKLIST - Focus for Task 2.1 (Slide Rendering)
================================================================================
Prerequisite: Theming System (Task 2.2) should be functional.

1.  SLIDE RENDERING (Content, Image, Video):
    [ ] Verify: Component correctly renders 'content' type slides with title and description. Text is sanitized.
    [ ] Verify: Component correctly renders 'image' type slides.
        [ ] Image `src` and `alt` attributes are applied. Alt text is sanitized.
        [ ] Lazy loading: Image placeholder (spinner) is shown initially. Image loads when slide becomes active/visible.
        [ ] Image error: If image `src` is invalid, a placeholder/error message is shown within the slide. `error` event `MEDIA_LOAD_ERROR` dispatched.
        [ ] Image slide has content overlay for title/description if provided.
    [ ] Verify: Component correctly renders 'video' type slides.
        [ ] Video `src`, `poster`, `muted`, `loop`, `playsinline`, `preload="metadata"` attributes are applied.
        [ ] Lazy loading/metadata: Video placeholder shown. Video metadata loads when slide becomes active/visible.
        [ ] Video error: If video `src` is invalid, a fallback message/error is shown. `error` event `MEDIA_LOAD_ERROR` dispatched.
        [ ] Video slide has content overlay.
        [ ] Video `autoplay` (if configured in slideData and `this.#isPlaying` is true) attempts to play when slide becomes active. Muted videos are more likely to autoplay.
        [ ] Video on outgoing slide is paused.
    [ ] Verify: Slide background (for 'content' type or as general override if implemented) is applied.

2.  SLIDE TRANSITIONS & NAVIGATION:
    [ ] Verify: Basic opacity fade transition occurs between slides. Duration is themeable via `--ve-cw-slide-transition-duration`.
    [ ] Verify: If `prefers-reduced-motion` is enabled, slide transitions are instantaneous (no fade).
    [ ] Verify: `goToSlide(index)` navigates to the correct slide.
    [ ] Verify: Keyboard navigation (Arrows, Home, End, Space) correctly navigates slides and updates visuals.
    [ ] Verify: `slideChanged` event is dispatched with correct `currentIndex`, `slideData`, `totalSlides`, and `trigger` for all navigation methods (API, keyboard, autoplay).
    [ ] Verify: ARIA live region announces slide changes correctly (e.g., "Slide 2 of 5. Health Tips.").

3.  AUTOPLAY & LOOPING:
    [ ] Verify: If `config.carousel.interval` is set and > 0, slides autoplay.
    [ ] Verify: `config.carousel.loop = true` causes carousel to loop from last to first slide (and vice-versa for prev nav).
    [ ] Verify: `config.carousel.loop = false` stops autoplay at the last slide (or first for prev nav).
    [ ] Verify: `play()` method starts/resumes autoplay.
    [ ] Verify: `pause()` method (and `freeze()`, `_handleCancelClick()`) stops autoplay.
    [ ] Verify: Manual navigation (keyboard, `goToSlide`) typically pauses autoplay, then resumes if `this.#isPlaying` was true. (More advanced resume logic can be Phase 3).

4.  STATE & RE-CONFIGURATION:
    [ ] Verify: `_resetInternalState` correctly clears old slide elements and resets `currentSlideIndex` when `config` is updated.
    [ ] Verify: Component correctly re-renders all slides and applies new autoplay/loop settings when `config` is changed at runtime.

5.  ACCESSIBILITY (Slide Content):
    [ ] Verify: Each slide `div` has `role="group"`, `aria-roledescription="slide"`, and an appropriate `aria-label` (from `slideData.title` or fallback).
    [ ] Verify: Active slide has `aria-hidden="false"`, inactive slides have `aria-hidden="true"`. (This is implicitly handled by opacity/visibility but good to confirm for screen readers).
================================================================================
*/
