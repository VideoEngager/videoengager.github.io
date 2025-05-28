// @ts-check
/// <reference types="../types/index" />
import { EnvironmentConfig } from "../config/environment.js";
import { VideoEngagerClient } from "./client.js";
import { ErrorHandler, ErrorTypes } from "./error-handler.js";
import { Utils } from "./utils.js";
import { TimeoutManager } from "./timeout-manager.js";

export class KioskApplication {
  constructor() {
    this.config = null;
    this.videoEngagerClient = null;
    this.errorHandler = new ErrorHandler();
    this.timeoutManager = new TimeoutManager();
    this.currentScreen = "initial";
    this.isInitialized = false;

    // Configuration
    this.timeouts = {
      call: 1000 * 60 * 3, // 3 minutes
      inactivity: 1000 * 60 * 60, // 1 hour
      retry: 1000 * 5, // 5 seconds
    };

    // Language configurations
    this.languages = {
      en: {
        motto: "SmartVideo Kiosk Demo",
        connect: "Touch Here To Begin",
        loadingText: "Connecting to an Agent",
        cancelText: "Cancel",
        retryText: "Retry",
      },
      de: {
        motto: "SmartVideo Kiosk Demo",
        connect: "Verbinden",
        loadingText: "Verbinde mit einem Agenten",
        cancelText: "Abbrechen",
        retryText: "Wiederholen",
      },
      ar: {
        motto: "عرض توضيحي لسمارت فيديو كيوسك",
        connect: "الاتصال",
        loadingText: "جاري الاتصال بموظف خدمة العملاء",
        cancelText: "إلغاء",
        retryText: "إعادة المحاولة",
      },
    };

    this.init();
  }

  /**
   * Initializes the kiosk application.
   * Sets up environment configuration, UI, event listeners, and VideoEngager client.
   * @returns {Promise<void>}
   */
  async init() {
    try {
      this.setupInternalEventListeners();
      if (!window.navigator.onLine) {
        this.log("APP: Initialization blocked due to previous errors");
        this.errorHandler.handleError(ErrorTypes.NETWORK_ERROR);
        return;
      }
      this.log("APP: Starting secure kiosk application initialization");

      // Set up environment configuration
      this.environmentConfig = new EnvironmentConfig();
      this.config = this.environmentConfig.getConfig();

      this.log(
        `APP: Environment detected: ${this.environmentConfig.getEnvironment()}`
      );

      // Initialize UI
      this.setupUI();
      this.setupEventListeners();

      // Initialize VideoEngager client
      await this.initializeVideoEngager();

      // Set up timers
      this.setupInactivityTimer();

      this.isInitialized = true;
      this.log("APP: Secure kiosk application initialized successfully");
    } catch (error) {
      this.log(`APP: Initialization failed: ${error.message}`);
      this.errorHandler.handleError(ErrorTypes.CONFIG_INVALID, error);
    }
  }

  /**
   * Sets up the user interface for the kiosk application.
   * Applies language settings, background image, and carousel.
   */
  setupUI() {
    this.log("UI: Setting up user interface");

    // Set initial screen
    this.showScreen("initial");

    // Apply language settings
    const lang = this.getLanguageFromParams();
    this.applyLanguageSettings(lang);

    // Set background image if configured
    this.setupBackgroundImage();

    // Set up carousel
    this.setupCarousel();

    this.log("UI: User interface setup complete");
  }

  setupInternalEventListeners() {
    document.addEventListener("networkRestored", () => {
      if (!this.isInitialized) {
        window.location.reload();
      }
    });
  }
  /**
   * Sets up event listeners for various UI elements and events.
   * Handles start video call button, cancel button, and message events.
   */
  setupEventListeners() {
    this.log("EVENTS: Setting up event listeners");

    // Start video call button
    const startButton = document.getElementById("StartVideoCall");
    if (startButton) {
      startButton.addEventListener(
        "click",
        this.handleStartVideoCall.bind(this)
      );
    }

    // Cancel button
    const cancelButton = document.getElementById("cancel-button-loading");
    if (cancelButton) {
      cancelButton.addEventListener("click", this.handleCancelCall.bind(this));
    }

    // Message listener for video call events
    window.addEventListener("message", this.handleMessage.bind(this));

    // Activity detection for inactivity timer
    ["click", "touchstart", "mousemove", "keypress"].forEach((event) => {
      document.addEventListener(event, this.resetInactivityTimer.bind(this));
    });

    this.log("EVENTS: Event listeners setup complete");
  }

  /**
   * Initializes the VideoEngager client and sets up event listeners.
   * @returns {Promise<void>}
   */
  async initializeVideoEngager() {
    this.log("VIDEOCLIENT: Initializing VideoEngager client");

    try {
      this.videoEngagerClient = new VideoEngagerClient(this.config);
      // Initialize the client
      await this.videoEngagerClient.init();

      // Set up event listeners
      this.videoEngagerClient.on("VideoEngagerCall.agentJoined", () => {
        this.log("VIDEOCLIENT: Video call agent joined");
        this.handleVideoCallStarted();
      });

      this.videoEngagerClient.on("VideoEngagerCall.ended", () => {
        this.log("VIDEOCLIENT: Video call ended");
        this.handleVideoCallEnded();
      });
      this.log("VIDEOCLIENT: VideoEngager client initialized successfully");
    } catch (error) {
      this.log(`VIDEOCLIENT: Failed to initialize: ${error.message}`);
      this.errorHandler.handleError(ErrorTypes.LIBRARY_LOAD_FAILED, error);
      throw error;
    }
  }

  /**
   * Handles the start video call button click event.
   * Shows loading screen, sets call timeout, and starts the video call.
   * @param {Event} event - The click event.
   */
  async handleStartVideoCall(event) {
    event.preventDefault();
    this.log("CALL: Start video call requested");

    try {
      // Show loading screen
      this.showScreen("loading");

      // Set call timeout
      this.timeoutManager.set(
        "call",
        () => {
          this.log("CALL: Call timeout reached");
          this.handleCallTimeout();
        },
        this.timeouts.call
      );

      // Start video call
      if (this.videoEngagerClient && this.videoEngagerClient.isReady()) {
        await this.videoEngagerClient.startVideo();
      } else {
        throw new Error("VideoEngager client not ready");
      }
    } catch (error) {
      this.log(`CALL: Failed to start video call: ${error.message}`);
      this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, error);
      this.showScreen("initial");
    }
  }

  /**
   * Handles the cancel call button click event.
   * Cancels the call, clears the timeout, and returns to the initial screen.
   * @param {Event} event - The click event.
   */
  handleCancelCall(event) {
    event.preventDefault();
    this.log("CALL: Cancel call requested");

    // Clear call timeout
    this.timeoutManager.clear("call");

    // End video call if active
    if (this.videoEngagerClient) {
      this.videoEngagerClient.endVideo().catch((error) => {
        this.log(`CALL: Error ending video call: ${error.message}`);
      });
    }

    // Return to initial screen
    this.showScreen("initial");
  }

  /**
   * Handles incoming messages from the VideoEngager client.
   * Processes call started events and updates the UI accordingly.
   * @param {MessageEvent} event - The message event containing data from the VideoEngager client.
   */
  handleMessage(event) {
    this.log(`MESSAGE: Received message: ${JSON.stringify(event.data)}`);

    if (event.data && event.data.type === "CallStarted") {
      this.handleVideoCallStarted();
    }
  }

  /**
   * Handles the video call started event.
   * Updates the UI to show the video call screen and clears the call timeout.
   */
  handleVideoCallStarted() {
    this.log("CALL: Video call started successfully");

    // Clear call timeout
    this.timeoutManager.clear("call");

    // Show video screen
    this.showScreen("video");
  }

  handleVideoCallEnded() {
    this.log("CALL: Video call ended");

    // Clear any active timeouts
    this.timeoutManager.clear("call");

    // Return to initial screen
    this.showScreen("initial");
  }

  handleVideoCallError(error) {
    this.log(`CALL: Video call error: ${error.message}`);

    // Clear call timeout
    this.timeoutManager.clear("call");

    // Handle the error
    this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, error);

    // Return to initial screen
    this.showScreen("initial");
  }

  handleCallTimeout() {
    this.log("CALL: Call timeout - ending call");

    // End video call
    if (this.videoEngagerClient) {
      this.videoEngagerClient.endVideo().catch((error) => {
        this.log(`CALL: Error ending timed out call: ${error.message}`);
      });
    }

    // Show timeout error
    this.errorHandler.handleError(ErrorTypes.CALL_TIMEOUT);

    // Return to initial screen
    this.showScreen("initial");
  }

  /**
   * Switches the visible screen based on the provided screen name.
   * @param {"initial" | "loading" | "video"} screenName - The name of the screen to show ("initial", "loading", "video").
   */
  showScreen(screenName) {
    this.log(`SCREEN: Switching to ${screenName} screen`);

    // Hide all screens
    const screens = ["initial-screen", "oncall-screen"];
    screens.forEach((screenId) => {
      const screen = document.getElementById(screenId);
      if (screen) {
        screen.style.display = "none";
      }
    });

    // Show requested screen
    switch (screenName) {
      case "initial":
        this.showInitialScreen();
        break;
      case "loading":
        this.showLoadingScreen();
        break;
      case "video":
        this.showVideoScreen();
        break;
    }

    this.currentScreen = screenName;
  }

  showInitialScreen() {
    const screen = document.getElementById("initial-screen");
    if (screen) {
      screen.style.display = "flex";
    }

    // Reset inactivity timer
    this.setupInactivityTimer();
  }

  showLoadingScreen() {
    const oncallScreen = document.getElementById("oncall-screen");
    if (oncallScreen) oncallScreen.style.display = "block";
  }

  /**
   * Shows the video call screen and hides the loading and carousel screens.
   */
  showVideoScreen() {
    const videoUI = document.getElementById("video-call-ui");
    if (videoUI) videoUI.style.height = "calc(100% - 38px)"; // Remove 38px for header height
  }

  // Configuration and Setup
  getLanguageFromParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get("lang");
    return lang && this.languages[lang] ? lang : "en";
  }

  applyLanguageSettings(lang) {
    const langConfig = this.languages[lang];
    if (!langConfig) return;

    this.log(`LANG: Applying language settings for: ${lang}`);

    // Apply language strings with XSS protection
    const elements = {
      ".secondery-text": langConfig.motto,
      "#connectButton": langConfig.connect,
      "#loadingText": langConfig.loadingText,
    };

    Object.entries(elements).forEach(([selector, text]) => {
      const element = document.querySelector(selector);
      if (element) {
        element.textContent = Utils.sanitizeText(text);
      }
    });
  }

  setupBackgroundImage() {
    if (!this.environmentConfig?.metadata.backgroundImage) return;

    // Validate URL
    if (
      !Utils.validateURL(this.environmentConfig?.metadata.backgroundImage) &&
      !this.environmentConfig?.metadata.backgroundImage.startsWith("img/")
    ) {
      this.log("BACKGROUND: Invalid background image URL");
      return;
    }

    const elem = document.getElementById("initial-screen");
    if (elem) {
      elem.style.backgroundImage = `url(${this.environmentConfig?.metadata.backgroundImage})`;
      this.log("BACKGROUND: Background image applied");
    }
  }

  setupCarousel() {
    const items = this.environmentConfig?.metadata.carouselItems || [];
    if (items.length === 0) return;

    this.log(`CAROUSEL: Setting up ${items.length} carousel items`);

    const container = document.getElementById("carousel-inner");
    if (!container) return;

    // Remove existing items except the first loading item
    Array.from(container.children).forEach((child) => {
      if (child.id !== "carousel-item-1") {
        child.remove();
      }
    });

    // Add new items with validation
    items.forEach((item, index) => {
      if (!item.src) return;

      // Basic URL validation
      if (!Utils.validateURL(item.src) && !item.src.startsWith("img/")) {
        this.log(`CAROUSEL: Skipping invalid URL: ${item.src}`);
        return;
      }

      const div = document.createElement("div");
      div.id = `carousel-item-${index + 2}`;
      div.className = "carousel-item";

      const img = document.createElement("img");
      img.src = item.src;
      img.alt = Utils.sanitizeText(item.alt || `Slide ${index + 2}`);
      img.loading = "lazy"; // Performance improvement

      div.appendChild(img);
      container.appendChild(div);
    });

    this.log("CAROUSEL: Carousel setup complete");
  }

  // Timer Management
  setupInactivityTimer() {
    this.timeoutManager.clear("inactivity");
    this.timeoutManager.set(
      "inactivity",
      () => {
        this.log("INACTIVITY: Inactivity timeout reached - reloading");
        window.location.reload();
      },
      this.timeouts.inactivity
    );
  }

  resetInactivityTimer() {
    if (this.currentScreen === "initial") {
      this.setupInactivityTimer();
    }
  }

  /**
   * Logs messages to the console and optionally to a debug element in development mode.
   * @param {string} message - The message to log.
   * @returns {void}
   * @example
   * kioskApp.log("Application started successfully");
   * kioskApp.log("Error loading configuration");
   * kioskApp.log("User clicked the start button");
   */
  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);

    // In development, also log to potential debug element
    if (this.environmentConfig?.getEnvironment() === "development") {
      const debugElement = document.getElementById("debug-log");
      if (debugElement) {
        debugElement.textContent += `[${timestamp}] ${message}\n`;
        debugElement.scrollTop = debugElement.scrollHeight;
      }
    }
  }

  /**
   * Destroys the application instance, cleaning up resources and event listeners.
   * @returns {void}
   */
  destroy() {
    this.log("APP: Destroying application");

    // Clear all timeouts
    this.timeoutManager.clearAll();

    // Destroy VideoEngager client
    if (this.videoEngagerClient) {
      this.videoEngagerClient.destroy();
    }

    // Remove event listeners
    ["click", "touchstart", "mousemove", "keypress"].forEach((event) => {
      document.removeEventListener(event, this.resetInactivityTimer.bind(this));
    });

    window.removeEventListener("message", this.handleMessage.bind(this));
  }
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  window.kioskApp = new KioskApplication();
});
