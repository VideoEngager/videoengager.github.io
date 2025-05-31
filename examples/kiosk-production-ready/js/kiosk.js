// @ts-check
/// <reference types="../types/ve-window.d.ts" />
import { EnvironmentConfig } from "../config/environment.js";
import { VideoEngagerClient } from "./client.js";
import { ErrorHandler, ErrorTypes } from "./error-handler.js";
import { Utils } from "./utils.js";
import { TimeoutManager } from "./timeout-manager.js";

const DEFAULT_SLIDE_INTERVAL = 8000; // Default slide interval for ve-carousel-waitroom

// --- JSDoc Type Definitions for VECarouselWaitroom ---
/**
 * @typedef {Object} SlideConfig - Represents the configuration for a single slide.
 * @property {string} type - e.g., 'image', 'video', 'content'.
 * @property {string} [src] - URL for image or video.
 * @property {string} [alt] - Alt text for image.
 * @property {string} [title] - Title of the slide.
 * @property {string} [description] - Description text.
 * @property {string} [background] - Background for content slides.
 * @property {string} [poster] - Poster image for video.
 * @property {boolean} [videoLoop] - Whether video should loop.
 * @property {boolean} [muted] - Whether video should be muted.
 * @property {boolean} [videoAutoplay] - Whether video should attempt to autoplay.
 */

/**
 * @typedef {Object} ThemeSettingsV1 - Theming options.
 * @property {string} [fontFamily]
 * @property {string} [componentBackground]
 * @property {string} [primaryTextColor]
 * @property {string} [baseFontSize]
 * @property {string} [slideTitleColor]
 * @property {string} [slideTitleFontSize]
 * @property {string} [slideDescriptionColor]
 * @property {string} [slideDescriptionFontSize]
 * @property {string} [slideMediaOverlayBackground]
 * @property {string} [botMessageBackground]
 * @property {string} [botMessageTextColor]
 * @property {string} [botMessageBorderRadius]
 * @property {string} [botMessageFontSize]
 * @property {string} [botMessageTierLowAccentColor]
 * @property {string} [botMessageTierHighAccentColor]
 * @property {string} [botMessageTierCriticalBackground]
 * @property {string} [botMessageTierCriticalTextColor]
 * @property {string} [accentColor]
 */

/**
 * @typedef {Object} AccessibilitySettings
 * @property {string} [carouselLabel]
 * @property {string} [slideChangeAnnouncementPattern]
 * @property {string} [keyboardInstructions]
 * @property {string} [noSlidesText]
 * @property {string} [slideLoadErrorText]
 * @property {string} [unsavedChangesTitle]
 * @property {string} [unsavedChangesMessage]
 * @property {string} [unsavedChangesConfirmText]
 * @property {string} [unsavedChangesCancelText]
 */

/**
 * @typedef {Object} CarouselConfig
 * @property {SlideConfig[]} slides
 * @property {boolean} [loop]
 * @property {number} [interval]
 * @property {ThemeSettingsV1} [theme]
 * @property {AccessibilitySettings} [accessibility]
 */

/**
 * @typedef {HTMLElement & VECarouselWaitroomInstanceInternal} VECarouselWaitroomElement
 */

/**
 * @typedef {Object} VECarouselWaitroomInstanceInternal - Interface for ve-carousel-waitroom.
 * @property {CarouselConfig} config
 * @property {boolean} pauseWhenHidden
 * @property {number} maxCachedMedia
 * @property {function(): void} freeze
 * @property {function(): void} thaw
 * @property {function(string, {tier?: string, duration?: number}): void} showBotMessage
 * @property {string} version
 * @property {boolean} isThemeSafeModeActive - Read-only property
 */
// --- End JSDoc Type Definitions ---

/**
 * @typedef {Window & typeof globalThis & { kioskAppInstance?: KioskApplication }} KioskWindow
 */

export class KioskApplication {
  constructor() {
    this.config = null;
    this.videoEngagerClient = null;
    this.errorHandler = new ErrorHandler();
    this.timeoutManager = new TimeoutManager();
    this.currentScreen = "initial";
    this.isInitialized = false;

    /** @type {HTMLElement | null} */
    this.onCallScreenElement = null;
    /** @type {VECarouselWaitroomElement | null} */
    this.carousel = null; // This refers to ve-carousel-waitroom

    this.timeouts = {
      call: 1000 * 60 * 3, 
      inactivity: 1000 * 60 * 60,
      retry: 1000 * 5,
    };

    this.languages = {
      en: { motto: "SmartVideo Kiosk Demo", connect: "Touch Here To Begin", loadingText: "Connecting to an Agent", cancelText: "Cancel", retryText: "Retry" },
      de: { motto: "SmartVideo Kiosk Demo", connect: "Verbinden", loadingText: "Verbinde mit einem Agenten", cancelText: "Abbrechen", retryText: "Wiederholen" },
      ar: { motto: "عرض توضيحي لسمارت فيديو كيوسك", connect: "الاتصال", loadingText: "جاري الاتصال بموظف خدمة العملاء", cancelText: "إلغاء", retryText: "إعادة المحاولة" },
    };

    // Bind event handlers
    this._boundHandleCarouselCancelEvent = this.handleCarouselCancelEvent.bind(this);
    this._boundHandleCarouselErrorEvent = this.handleCarouselErrorEvent.bind(this);
    this._boundResetInactivityTimer = this.resetInactivityTimer.bind(this);
    this._boundHandleMessage = this.handleMessage.bind(this);
    this._boundHandleStartVideoCall = this.handleStartVideoCall.bind(this);
    this._boundHandleCancelCall = this.handleCancelCall.bind(this);
    this._boundNetworkRestoredHandler = this._networkRestoredHandler.bind(this);


    this.init();
  }

  async init() {
    try {
      this.setupInternalEventListeners();
      if (!window.navigator.onLine) {
        this.log("APP: Initialization blocked due to network offline state.");
        this.errorHandler.handleError(ErrorTypes.NETWORK_ERROR);
        return;
      }
      this.log("APP: Starting kiosk application initialization");

      this.environmentConfig = new EnvironmentConfig();
      this.config = this.environmentConfig.getConfig();
      if (!this.config) {
        this.log("APP: Critical error - EnvironmentConfig did not provide a configuration.");
        this.errorHandler.handleError(ErrorTypes.CONFIG_MISSING, new Error("Environment configuration is null or undefined."));
        return; // Stop initialization if config is missing
      }
      this.log(`APP: Environment detected: ${this.environmentConfig.getEnvironment()}`);

      this.setupUI(); 
      this.setupEventListeners();
      await this.initializeVideoEngager();
      this.setupInactivityTimer();

      this.isInitialized = true;
      this.log("APP: Kiosk application initialized successfully");
    } catch (error) {
      this.log(`APP: Initialization failed: ${error.message}`, error);
      this.errorHandler.handleError(ErrorTypes.CONFIG_INVALID, error);
    }
  }

  setupUI() {
    this.log("UI: Setting up user interface");
    this.showScreen("initial");
    const lang = this.getLanguageFromParams();
    this.applyLanguageSettings(lang);
    this.setupBackgroundImage();
    this._setupWaitroomCarousel(); 
    this.log("UI: User interface setup complete");
  }

  _networkRestoredHandler() {
    if (!this.isInitialized && window.navigator.onLine) { 
      this.log("APP: Network restored, reloading application.");
      window.location.reload();
    }
  }

  setupInternalEventListeners() {
    document.addEventListener("networkRestored", this._boundNetworkRestoredHandler);
  }

  setupEventListeners() {
    this.log("EVENTS: Setting up event listeners");
    const startButton = document.getElementById("StartVideoCall");
    if (startButton) {
      startButton.addEventListener("click", this._boundHandleStartVideoCall);
    } else {
      this.log("EVENTS: StartVideoCall button not found.");
    }

    const cancelButton = document.getElementById("cancel-button-loading");
    if (cancelButton) {
      cancelButton.addEventListener("click", this._boundHandleCancelCall);
    } else {
      this.log("EVENTS: cancel-button-loading not found.");
    }

    window.addEventListener("message", this._boundHandleMessage);

    ["click", "touchstart", "mousemove", "keypress"].forEach((event) => {
      document.addEventListener(event, this._boundResetInactivityTimer);
    });
    this.log("EVENTS: Event listeners setup complete");
  }

  async initializeVideoEngager() {
    this.log("VIDEOCLIENT: Initializing VideoEngager client");
    if (!this.config) {
        this.log("VIDEOCLIENT: Cannot initialize, Kiosk config is missing.");
        this.errorHandler.handleError(ErrorTypes.CONFIG_MISSING, new Error("VideoEngager client initialization failed due to missing Kiosk config."));
        return; // Do not proceed if config is missing
    }
    try {
      this.videoEngagerClient = new VideoEngagerClient(this.config);
      await this.videoEngagerClient.init();
      this.videoEngagerClient.on("VideoEngagerCall.agentJoined", () => {
        this.log("VIDEOCLIENT: Video call agent joined");
        this.handleVideoCallStarted();
      });
      this.videoEngagerClient.on("VideoEngagerCall.ended", () => {
        this.log("VIDEOCLIENT: Video call ended");
        this.handleVideoCallEnded();
      });
      // It's good practice to also listen for errors from the VideoEngagerClient
      this.videoEngagerClient.on("VideoEngagerCall.error", (errorData) => {
        this.log("VIDEOCLIENT: VideoEngagerCall.error received", errorData);
        this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, new Error(errorData?.message || "VideoEngager call error"));
        this.showScreen("initial"); // Revert to initial screen on call error
      });
      this.log("VIDEOCLIENT: VideoEngager client initialized successfully");
    } catch (error) {
      this.log(`VIDEOCLIENT: Failed to initialize: ${error.message}`, error);
      this.errorHandler.handleError(ErrorTypes.LIBRARY_LOAD_FAILED, error);
      // No re-throw here, allow init to complete if possible, or handle UI state appropriately
    }
  }

  async handleStartVideoCall(event) {
    if (event) event.preventDefault();
    this.log("CALL: Start video call requested");
    try {
      this.showScreen("loading");
      this.timeoutManager.set("call", () => {
        this.log("CALL: Call timeout reached");
        this.handleCallTimeout();
      }, this.timeouts.call);

      if (this.videoEngagerClient && this.videoEngagerClient.isReady()) {
        await this.videoEngagerClient.startVideo();
      } else {
        this.log("CALL: VideoEngager client not ready or not initialized for startVideo.");
        throw new Error("VideoEngager client not ready");
      }
    } catch (error) {
      this.log(`CALL: Failed to start video call: ${error.message}`, error);
      this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, error);
      this.showScreen("initial"); 
    }
  }

  handleCancelCall(event) {
    if(event) event.preventDefault(); 
    this.log("CALL: Cancel call requested");
    this.timeoutManager.clear("call");
    if (this.videoEngagerClient) {
      this.videoEngagerClient.endVideo().catch(error => {
        this.log(`CALL: Error ending video call on cancel: ${error.message}`, error);
      });
    }
    this.showScreen("initial");
  }

  handleMessage(event) {
    // Add origin check for security if messages are expected from specific sources
    // if (event.origin !== 'https://expected.origin.com') return;
    this.log(`MESSAGE: Received message:`, event.data);
    // Add specific message parsing and handling logic here if applicable
  }

  handleVideoCallStarted() {
    this.log("CALL: Video call started successfully");
    this.timeoutManager.clear("call");
    this.showScreen("video");
  }

  handleVideoCallEnded() {
    this.log("CALL: Video call ended");
    this.timeoutManager.clear("call");
    this.showScreen("initial");
  }

  handleCallTimeout() {
    this.log("CALL: Call timeout - ending call");
    if (this.videoEngagerClient) {
      this.videoEngagerClient.endVideo().catch(error => {
        this.log(`CALL: Error ending timed out call: ${error.message}`, error);
      });
    }
    this.errorHandler.handleError(ErrorTypes.CALL_TIMEOUT);
    this.showScreen("initial");
  }

  showScreen(screenName) {
    this.log(`SCREEN: Switching to ${screenName} screen`);
    const initialScreen = document.getElementById('initial-screen');
    const videoCallUI = document.getElementById('video-call-ui');
    // this.onCallScreenElement is initialized in _setupWaitroomCarousel

    if (initialScreen) initialScreen.hidden = true;
    if (this.onCallScreenElement) this.onCallScreenElement.hidden = true;
    if (videoCallUI) videoCallUI.hidden = true;

    switch (screenName) {
        case "initial":
            if (initialScreen) initialScreen.hidden = false;
            this.carousel?.freeze?.(); 
            this.setupInactivityTimer();
            break;
        case "loading":
            if (this.onCallScreenElement) {
                if (this.carousel) { 
                    const carouselConfig = this._buildKioskCarouselConfig();
                    this.carousel.config = carouselConfig; // This should trigger theme application and rendering
                    this.carousel.thaw?.(); 
                } else {
                    this.log("KioskApp: ve-carousel-waitroom not available for loading screen. Showing fallback.");
                    const loadingFallback = document.getElementById('loadingScreenFallback');
                    if(loadingFallback) loadingFallback.style.display = 'flex';
                }
                this.onCallScreenElement.hidden = false;
            } else {
                this.log("KioskApp: #oncall-screen element not found when trying to show 'loading' screen.");
            }
            break;
        case "video":
            if (videoCallUI) {
              videoCallUI.hidden = false;
              videoCallUI.style.height = "calc(100% - 38px)"; // Assuming 38px is header height
            }
            this.carousel?.freeze?.(); 
            break;
        default:
            this.log(`SCREEN: Unknown screen name "${screenName}". Defaulting to initial screen.`);
            if (initialScreen) initialScreen.hidden = false;
            this.setupInactivityTimer();
            break;
    }
    this.currentScreen = screenName;
  }

  _setupWaitroomCarousel() {
    this.onCallScreenElement = document.getElementById('oncall-screen');
    if (!this.onCallScreenElement) {
        this.log("KioskApp: #oncall-screen element not found! Cannot setup ve-carousel-waitroom.");
        this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, new Error("Critical UI element #oncall-screen missing for ve-carousel-waitroom."));
        return;
    }

    try {
        if (customElements.get('ve-carousel-waitroom')) {
            /** @type {VECarouselWaitroomElement} */
            const carouselElement = /** @type {VECarouselWaitroomElement} */ (document.createElement('ve-carousel-waitroom'));
            // Pass logger to the carousel constructor if it supports it
            // For now, assuming ve-carousel-waitroom creates its own default logger or gets it via a global/DI
            // If VECarouselWaitroom constructor is updated to accept { logger: this.yourKioskLogger }, pass it here.
            this.carousel = carouselElement; 
            this.log("KioskApp: ve-carousel-waitroom element created.");

            // These properties are defined in VECarouselWaitroomElement JSDoc
            this.carousel.pauseWhenHidden = true;
            this.carousel.maxCachedMedia = 5; // Example

            this.carousel.addEventListener('cancel', this._boundHandleCarouselCancelEvent);
            this.carousel.addEventListener('error', this._boundHandleCarouselErrorEvent);
            this.log("KioskApp: Event listeners added to ve-carousel-waitroom.");

            this.onCallScreenElement.appendChild(this.carousel);
            this.log("KioskApp: ve-carousel-waitroom appended to #oncall-screen.");
        } else {
            this.log("KioskApp: ve-carousel-waitroom custom element not defined. Carousel setup skipped.");
            this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, new Error("ve-carousel-waitroom custom element is not defined. Ensure it's imported and registered."));
        }
    } catch (error) {
        this.log(`KioskApp: Failed to initialize ve-carousel-waitroom: ${error.message}`, error);
        this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, error);
        this.carousel = null; // Ensure carousel is null if setup fails
    }
  }

  _buildKioskCarouselConfig() {
    const itemsForWaitroom = this.environmentConfig?.metadata?.waitroomCarouselItems || this.environmentConfig?.metadata?.carouselItems || [];
    
    const slides = itemsForWaitroom.map(item => ({
        type: item.type || 'image',
        src: item.src,
        alt: Utils.sanitizeText(item.alt || item.title || ''), // Sanitize alt text
        title: Utils.sanitizeText(item.title || ''), // Sanitize title
        description: Utils.sanitizeText(item.description || ''), // Sanitize description
        background: item.type === 'content' ? item.background : undefined, // Backgrounds can be complex CSS, usually trusted
        poster: item.poster,
        videoLoop: item.videoLoop,
        muted: item.muted,
        videoAutoplay: item.videoAutoplay === undefined ? true : item.videoAutoplay,
    }));

    // Ensure theme settings are pulled from a potentially nested structure in this.config
    const appThemeConfig = this.config?.theme || {}; // Kiosk-level theme config
    const carouselSpecificTheme = this.environmentConfig?.metadata?.carouselTheme || {}; // More specific theme from metadata

    const kioskThemeSettings = {
        fontFamily: carouselSpecificTheme.fontFamily || appThemeConfig.fontFamily || "'Open Sans', Arial, sans-serif",
        componentBackground: carouselSpecificTheme.componentBackground || appThemeConfig.componentBackground || 'linear-gradient(135deg, #435d7d 0%, #243b55 100%)',
        primaryTextColor: carouselSpecificTheme.primaryTextColor || appThemeConfig.primaryTextColor || '#EAEAEA',
        baseFontSize: carouselSpecificTheme.baseFontSize || appThemeConfig.baseFontSize || '15px',
        slideTitleColor: carouselSpecificTheme.slideTitleColor || appThemeConfig.slideTitleColor,
        slideTitleFontSize: carouselSpecificTheme.slideTitleFontSize || appThemeConfig.slideTitleFontSize,
        // ...etc. for all ThemeSettingsV1 properties
    };
    
    const appAccessibilityConfig = this.config?.accessibility || {};
    const carouselSpecificAccessibility = this.config?.carousel?.accessibility || {};


    return {
        slides: slides,
        loop: this.config?.carousel?.loop === undefined ? true : this.config.carousel.loop,
        interval: this.config?.carousel?.interval || DEFAULT_SLIDE_INTERVAL,
        theme: kioskThemeSettings,
        accessibility: { 
            carouselLabel: carouselSpecificAccessibility.label || appAccessibilityConfig.carouselLabel || "Clinic Information Display",
            slideChangeAnnouncementPattern: carouselSpecificAccessibility.slideChangeAnnouncementPattern || appAccessibilityConfig.slideChangeAnnouncementPattern || "Displaying slide {current} of {total}: {title}",
            keyboardInstructions: carouselSpecificAccessibility.keyboardInstructions || appAccessibilityConfig.keyboardInstructions || "Use arrow keys to navigate slides when carousel is focused.",
            noSlidesText: carouselSpecificAccessibility.noSlidesText || appAccessibilityConfig.noSlidesText || "Information will be displayed here shortly.",
            slideLoadErrorText: carouselSpecificAccessibility.slideLoadErrorText || appAccessibilityConfig.slideLoadErrorText || "Unable to load this information.",
            unsavedChangesTitle: carouselSpecificAccessibility.unsavedChangesTitle || appAccessibilityConfig.unsavedChangesTitle || "Unsaved Information",
            unsavedChangesMessage: carouselSpecificAccessibility.unsavedChangesMessage || appAccessibilityConfig.unsavedChangesMessage || "You have unsaved entries. Are you sure you want to leave this step?",
            unsavedChangesConfirmText: carouselSpecificAccessibility.unsavedChangesConfirmText || appAccessibilityConfig.unsavedChangesConfirmText || "Leave Step",
            unsavedChangesCancelText: carouselSpecificAccessibility.unsavedChangesCancelText || appAccessibilityConfig.unsavedChangesCancelText || "Stay",
        }
    };
  }

  handleCarouselCancelEvent(event) {
    this.log("KioskApp: Carousel 'cancel' event received.", event.detail);
    // Ensure handleCancelCall can be called without an event if needed, or create a dummy event
    this.handleCancelCall(event instanceof Event ? event : new Event('carouselInternalCancel', { bubbles: true, cancelable: true }));
  }

  handleCarouselErrorEvent(event) {
    const { errorCode, ...details } = event.detail;
    let errorMessageString = "Unknown carousel error";
    if (details && typeof details.reason === 'string') {
        errorMessageString = details.reason;
    } else if (details && typeof details === 'object' && details !== null) {
        try {errorMessageString = JSON.stringify(details); } catch(e) { errorMessageString = "Invalid error details object.";}
    } else if (typeof details === 'string') {
        errorMessageString = details;
    }

    this.log(`KioskApp: Carousel 'error' event received: ${errorCode}`, details);

    // Assuming ErrorHandler has a logError method: logError(type, error, metadata)
    // If not, adapt to use handleError(ErrorType, error)
    if (this.errorHandler.logError && typeof this.errorHandler.logError === 'function') {
         this.errorHandler.logError( // This method signature might not match your ErrorHandler
            `CarouselError_${errorCode}`, 
            new Error(errorMessageString),      
            details                       
        );
    } else {
        this.log(`KioskApp: Fallback log for Carousel Error: ${errorCode} - ${errorMessageString}. Details:`, details);
        // Corrected call to handleError:
        this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, new Error(`Carousel Error: ${errorCode} - ${errorMessageString}`));
    }

    if (errorCode === 'INVALID_CONFIG' || errorCode === 'INVALID_CONFIG_ATTRIBUTE' || errorCode === 'THEME_FAILSAFE') {
        this.log("KioskApp: Carousel reported critical configuration or theme error. Consider fallback UI.");
    }
  }

  getLanguageFromParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get("lang");
    return lang && this.languages[lang] ? lang : "en";
  }

  applyLanguageSettings(lang) {
    const langConfig = this.languages[lang];
    if (!langConfig) {
        this.log(`LANG: Language configuration for "${lang}" not found. Using default.`);
        return;
    }
    this.log(`LANG: Applying language settings for: ${lang}`);
    const elementsToUpdate = {
      ".secondery-text": langConfig.motto, 
      "#connectButton": langConfig.connect, 
      "#loadingTextFallback": langConfig.loadingText,
    };
    Object.entries(elementsToUpdate).forEach(([selector, text]) => {
      const element = document.querySelector(selector);
      if (element) {
        element.textContent = Utils.sanitizeText(text);
      } else {
        this.log(`LANG: Element with selector "${selector}" not found for language update.`);
      }
    });
  }

  setupBackgroundImage() {
    if (!this.environmentConfig?.metadata?.backgroundImage) return;
    const bgImage = this.environmentConfig.metadata.backgroundImage;
    // Basic check for common image extensions if not a full URL or data URI
    const isLikelyImagePath = /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(bgImage);
    if (!Utils.validateURL(bgImage) && !bgImage.startsWith("img/") && !isLikelyImagePath) { 
      this.log("BACKGROUND: Invalid or unsupported background image URL/path", { url: bgImage });
      return;
    }
    const initialScreenElement = document.getElementById("initial-screen");
    if (initialScreenElement) {
      initialScreenElement.style.backgroundImage = `url('${bgImage}')`; // Added quotes for safety with special chars in URL
      this.log("BACKGROUND: Background image applied to initial screen");
    }
  }

  setupInactivityTimer() {
    this.timeoutManager.clear("inactivity");
    this.timeoutManager.set("inactivity", () => {
      this.log("INACTIVITY: Timeout reached - reloading application");
      window.location.reload();
    }, this.timeouts.inactivity);
  }

  resetInactivityTimer() {
    if (this.currentScreen === "initial") { 
      this.setupInactivityTimer();
    }
  }

  log(message, details) {
    const timestamp = new Date().toISOString();
    // Basic log, can be replaced by a more sophisticated logger instance if KioskApp itself uses one
    const logMessage = `[KioskApp][${timestamp}] ${message}`;
    if (details !== undefined) {
        console.log(logMessage, details);
    } else {
        console.log(logMessage);
    }
    
    if (this.environmentConfig?.getEnvironment() === "development") {
      const debugElement = document.getElementById("debug-log"); 
      if (debugElement) {
        const entry = document.createElement('div');
        entry.textContent = details ? `${logMessage} ${JSON.stringify(details)}` : logMessage;
        debugElement.appendChild(entry);
        while (debugElement.children.length > 100) { 
            const firstChild = debugElement.firstChild; 
            if (firstChild) { 
                debugElement.removeChild(firstChild);
            } else {
                break; 
            }
        }
        debugElement.scrollTop = debugElement.scrollHeight;
      }
    }
  }

  destroy() {
    this.log("APP: Destroying Kiosk Application");
    this.timeoutManager.clearAll();

    if (this.videoEngagerClient) {
      this.videoEngagerClient.destroy();
      this.videoEngagerClient = null;
    }

    if (this.carousel) { 
        this.log("KioskApp: Freezing and removing ve-carousel-waitroom.");
        this.carousel.freeze?.();
        this.carousel.removeEventListener('cancel', this._boundHandleCarouselCancelEvent);
        this.carousel.removeEventListener('error', this._boundHandleCarouselErrorEvent);
        if (this.carousel.parentNode) {
            this.carousel.parentNode.removeChild(this.carousel);
        }
        this.carousel = null;
    }

    ["click", "touchstart", "mousemove", "keypress"].forEach((event) => {
      document.removeEventListener(event, this._boundResetInactivityTimer);
    });
    window.removeEventListener("message", this._boundHandleMessage);
    document.removeEventListener("networkRestored", this._boundNetworkRestoredHandler);


    this.log("APP: Kiosk Application destroyed.");
    this.isInitialized = false;
  }
}

/** @type {KioskWindow} */
const kioskGlobal = window;

document.addEventListener("DOMContentLoaded", function () {
  // Ensure KioskApplication is only initialized once.
  if (!kioskGlobal.kioskAppInstance) { 
    kioskGlobal.kioskAppInstance = new KioskApplication();
  }
});
