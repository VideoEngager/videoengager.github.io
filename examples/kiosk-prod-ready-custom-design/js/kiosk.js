// @ts-check
/// <reference types="../types/ve-window.d.ts" />
import { EnvironmentConfig } from "../config/environment.js";
import { VideoEngagerClient } from "./client.js";
import { ErrorHandler, ErrorTypes } from "./error-handler.js";
import { Utils } from "./utils.js";
import { TimeoutManager } from "./timeout-manager.js";
import { WaitroomEventMediator } from "./waitroom-event-mediator.js";

export class KioskApplication {
  constructor() {
    this.config = null;
    this.videoEngagerClient = null;
    this.errorHandler = new ErrorHandler();
    this.timeoutManager = new TimeoutManager();
    this.waitroomMediator = new WaitroomEventMediator();
    this.currentScreen = "initial";
    this.isInitialized = false;
    this.systemNotificationElement = null;
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
      await this.setupEventListeners();

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
   * Applies language settings and background image.
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
  async setupEventListeners() {
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
    this.setupWaitroomEventListeners();
    await this.initializeWaitroom();

    // Message listener for video call events
    window.addEventListener("message", this.handleMessage.bind(this));

    // Activity detection for inactivity timer
    ["click", "touchstart", "mousemove", "keypress"].forEach((event) => {
      document.addEventListener(event, this.resetInactivityTimer.bind(this));
    });

    this.log("EVENTS: Event listeners setup complete");
  }

  /**
   * Sets up event listeners for waitroom component events.
   * @private
   * @returns {void}
   */
  setupWaitroomEventListeners() {
    this.log("WAITROOM: Setting up waitroom event listeners");

    // Listen for user cancellation
    this.waitroomMediator.on("userCancelled", (detail) => {
      this.log("WAITROOM: User cancelled from waitroom");
      this.handleCancelCall.bind(this)(detail);
    });

    this.waitroomMediator.on("error", (detail) => {
      this.log("WAITROOM: Error in waitroom");
      this.errorHandler.handleError(ErrorTypes.WAITROOM_ERROR);
    });
  }

  async initializeWaitroom() {
    /** @type {HTMLElement & { init: () => Promise<void>} | null} */
    const carouselWaitroom = document.querySelector("ve-carousel-waitroom");

    if (!carouselWaitroom) {
      this.log("WAITROOM: Carousel waitroom component not found");
      this.errorHandler.handleError(ErrorTypes.WAITROOM_COMPONENT_NOT_FOUND);
      return;
    }
    this.log("WAITROOM: Initializing carousel waitroom");
    await carouselWaitroom.init();
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

      // Listen for system notifications
      this.videoEngagerClient.on("onMessage", (data) => {
        this.log(`VIDEOCLIENT: Received message: ${JSON.stringify(data)}`);
        this.handleSystemMessage(data);
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
    
    // Clear system notification
    this.clearSystemNotification();

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
  }

  /**
   * Handles system messages for system notifications.
   * Processes messages to extract system notifications and display them in the waitroom.
   * @param {object} data - The message data from VideoEngager client.
   */
  handleSystemMessage(data) {
    const { message } = data;

    // Check if this is an inbound system notification
    if (
      message &&
      message.direction === "Inbound" &&
      message.content &&
      message.content.type === "Text" &&
      message.content.text &&
      message.content.text.startsWith("System Notification:")
    ) {
      this.log(`SYSTEM: Received system notification: ${message.content.text}`);

      // Extract the notification text (remove "System Notification: " prefix)
      const notificationText = message.content.text
        .replace("System Notification: ", "")
        .trim();

      // Display the notification in the waitroom
      this.displaySystemNotification(notificationText);
    }
  }

  /**
   * Displays system notification in the waitroom.
   * @param {string} notificationText - The notification text to display.
   */
  displaySystemNotification(notificationText) {
    this.log(`SYSTEM: Displaying notification: ${notificationText}`);

    // Only show notifications when in loading/waitroom screen
    if (this.currentScreen !== "loading") {
      return;
    }

    // Find or create the notification element
    this.createSystemNotificationElement();

    if (this.systemNotificationElement) {
      // Update the notification text
      this.systemNotificationElement.textContent = notificationText;

      // Make sure it's visible with slide-in animation
      this.systemNotificationElement.style.display = 'block';
      
      // Reset any existing animation classes
      this.systemNotificationElement.classList.remove('notification-update');
      
      // Trigger slide-in animation if first time showing
      if (!this.systemNotificationElement.style.opacity || this.systemNotificationElement.style.opacity === '0') {
        this.systemNotificationElement.classList.add('system-notification');
      }
      
      // Add update pulse animation after a brief delay
      setTimeout(() => {
        if (this.systemNotificationElement) {
          this.systemNotificationElement.classList.add('notification-update');
        }
      }, 100);

      this.log('SYSTEM NOTIFICATION: Displayed notification: ' + notificationText);
    }
  }

  /**
   * Clears the system notification display.
   */
  clearSystemNotification () {
    if (this.systemNotificationElement && this.systemNotificationElement.style.display !== 'none') {
      // Add fade-out animation
      this.systemNotificationElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      this.systemNotificationElement.style.opacity = '0';
      this.systemNotificationElement.style.transform = 'translateX(-50%) translateY(-20px)';
      
      // Hide completely after animation
      setTimeout(() => {
        if (this.systemNotificationElement) {
          this.systemNotificationElement.style.display = 'none';
          this.systemNotificationElement.style.opacity = '';
          this.systemNotificationElement.style.transform = '';
          this.systemNotificationElement.classList.remove('notification-update', 'system-notification');
        }
      }, 300);
      
      this.log('SYSTEM: System notification cleared');
    }
  }

  /**
   * Creates the system notification element if it doesn't exist.
   */
  createSystemNotificationElement () {
    if (this.systemNotificationElement) {
      return; // Already exists
    }

    const oncallScreen = document.getElementById('oncall-screen');
    if (!oncallScreen) {
      this.log('SYSTEM NOTIFICATION: oncall-screen element not found');
      return;
    }

    // Create notification element
    this.systemNotificationElement = document.createElement('div');
    this.systemNotificationElement.id = 'system-notification';
    this.systemNotificationElement.className = 'system-notification';
    
    // Add ARIA attributes for accessibility
    this.systemNotificationElement.setAttribute('role', 'alert');
    this.systemNotificationElement.setAttribute('aria-live', 'assertive');
    this.systemNotificationElement.setAttribute('aria-label', 'System notification');
    this.systemNotificationElement.setAttribute('tabindex', '0');
    this.systemNotificationElement.style.cssText = `
      position: fixed;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 32px;
      border-radius: 16px;
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(102, 126, 234, 0.4);
      z-index: 10000;
      display: none;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      max-width: 90%;
      min-width: 300px;
      word-wrap: break-word;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      letter-spacing: 0.5px;
      line-height: 1.4;
    `;

    // Add to oncall screen
    oncallScreen.appendChild(this.systemNotificationElement);

    // Add CSS animation class
    const style = document.createElement('style');
    style.textContent = `
      .system-notification {
        animation: slideInFromTop 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .notification-update {
        animation: notificationPulse 0.8s ease-out;
      }

      /* Enhanced accessibility and visibility */
      .system-notification:focus {
        outline: 3px solid rgba(255, 255, 255, 0.7);
        outline-offset: 2px;
      }

      /* Subtle glow effect for better visibility */
      .system-notification::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 18px;
        z-index: -1;
        filter: blur(8px);
        opacity: 0.7;
      }

      @keyframes slideInFromTop {
        0% {
          transform: translateX(-50%) translateY(-100px);
          opacity: 0;
        }
        100% {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }

      @keyframes notificationPulse {
        0% {
          transform: translateX(-50%) scale(1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(102, 126, 234, 0.4);
        }
        50% {
          transform: translateX(-50%) scale(1.05);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(102, 126, 234, 0.6);
        }
        100% {
          transform: translateX(-50%) scale(1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(102, 126, 234, 0.4);
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .system-notification {
          background: #000000 !important;
          color: #ffffff !important;
          border: 2px solid #ffffff !important;
        }
      }

      /* Reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        .system-notification,
        .notification-update {
          animation: none !important;
        }
      }

      /* Mobile responsive design */
      @media (max-width: 768px) {
        .system-notification {
          top: 20px !important;
          max-width: 95% !important;
          min-width: 280px !important;
          font-size: 16px !important;
          padding: 16px 24px !important;
        }
      }

      @media (max-width: 480px) {
        .system-notification {
          top: 15px !important;
          max-width: 98% !important;
          min-width: 260px !important;
          font-size: 15px !important;
          padding: 14px 20px !important;
        }
      }
    `;
    document.head.appendChild(style);

    this.log('SYSTEM NOTIFICATION: System notification element created');
  }

  /**
   * Handles the video call started event.
   * Updates the UI to show the video call screen and clears the call timeout.
   */
  handleVideoCallStarted() {
    this.log("CALL: Video call started successfully");

    // Clear call timeout
    this.timeoutManager.clear("call");
    
    // Clear system notification
    this.clearSystemNotification();

    // Show video screen
    this.showScreen("video");
  }

  handleVideoCallEnded() {
    this.log("CALL: Video call ended");

    // Clear any active timeouts
    this.timeoutManager.clear("call");
    
    // Clear system notification
    this.clearSystemNotification();

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
   * Shows the video call screen.
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
