// @ts-check
/// <reference types="../types/ve-window.d.ts" />
import { configs, metadata } from '../config/conf.js'; // Use 'production' as the base
import { VideoEngagerClient } from "./client.js";
import { ErrorHandler, ErrorTypes } from "./error-handler.js";
import { Utils } from "./utils.js";
import { TimeoutManager } from "./timeout-manager.js";
import { WaitroomEventMediator } from "./waitroom-event-mediator.js";
import { ConfigManager } from './config-manager.js';

export class KioskApplication {
  constructor() {
    /** @type {import('../types/ve-window').ClientConfig|null} */
    this.config = null;
    this.videoEngagerClient = null;
    this.errorHandler = new ErrorHandler();
    this.timeoutManager = new TimeoutManager();
    this.waitroomMediator = new WaitroomEventMediator();
    this.currentScreen = "initial";
    // Phase state machine: 'idle' → 'waiting' → 'precall' → 'active' → 'idle'
    this.callPhase = 'idle';
    this.starting = false;
    this.isInitialized = false;
    this.systemNotificationElement = null;
    this._preCallMessageHandler = null;
    this._notificationAnimationTimer = null;
    this._notificationHideTimer = null;
    this._boundResetInactivityTimer = this.resetInactivityTimer.bind(this);
    this.wakeLock = null;
    this.timeouts = {
      call: 1000 * 60 * 3, // 3 minutes
      inactivity: 1000 * 60 * 60, // 1 hour
      retry: 1000 * 5, // 5 seconds
    };
    const defaultConfig = { ...configs.production, metadata: metadata };

    this.configManager = new ConfigManager(defaultConfig); // Pass in the default config

    // Language configurations
    /** @type {Record<string, { motto: string; connect: string; loadingText: string; cancelText: string; retryText: string }>} */
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
      // this.environmentConfig = new EnvironmentConfig();
      // this.config = this.environmentConfig.getConfig();
      this.config = await this.configManager.load();

      // Allow config to override default timeouts
      if (this.config?.timeouts) {
        this.timeouts = { ...this.timeouts, ...this.config.timeouts };
      }

      this.log(
        `APP: Environment detected: ${this.config}`
      );

      // Initialize UI
      this.setupUI();
      await this.setupEventListeners();

      // Initialize VideoEngager client
      await this.initializeVideoEngager();

      // Set up timers
      this.setupInactivityTimer();

      this.isInitialized = true;
      /** @type {HTMLButtonElement} */ (document.getElementById('StartVideoCall')).disabled = false;
      this.log("APP: Secure kiosk application initialized successfully");
      if (this.videoEngagerClient.startAfterLogin) await this.handleStartVideoCall();
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
    window.addEventListener('pageshow', event => {
      if (event.persisted) window.location.reload(); // Do not restore a previous visitor or suspended login.
    });
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
    const startButton = /** @type {HTMLButtonElement | null} */ (document.getElementById("StartVideoCall"));
    if (startButton) {
      startButton.disabled = true;
      startButton.addEventListener(
        "click",
        this.handleStartVideoCall.bind(this)
      );
    }

    // Cancel button
    this.setupWaitroomEventListeners();
    await this.initializeWaitroom();

    // Message listener for video call events
    // window.addEventListener("message", this.handleMessage.bind(this));

    // Listen for PreCallStarted from VideoEngager iframe
    this._preCallMessageHandler = this._handlePreCallMessage.bind(this);
    window.addEventListener("message", this._preCallMessageHandler);

    // Activity detection for inactivity timer
    ["click", "touchstart", "mousemove", "keypress"].forEach((event) => {
      document.addEventListener(event, this._boundResetInactivityTimer);
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
    this.waitroomMediator.on("userCancelled", async (detail) => {
      this.log("WAITROOM: User cancelled from waitroom");
      await this.handleCancelCall.bind(this)(detail);
    });

    this.waitroomMediator.on("error", () => {
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
        if (!['waiting', 'precall'].includes(this.callPhase)) return;
        this.log("VIDEOCLIENT: Video call agent joined");
        this.callPhase = 'active';
        this.handleVideoCallStarted();
      });

      this.videoEngagerClient.on("GenesysMessenger.conversationStarted", async () => {
        this.timeoutManager.extend("call", this.timeouts.call);
      });

      this.videoEngagerClient.on("GenesysMessenger.conversationEnded", async () => {
        const genesysMessengerContainer = /** @type {HTMLDivElement | null} */ (document.querySelector('#genesys-messenger'));
        if (genesysMessengerContainer) {
          genesysMessengerContainer.style.display = 'none';
        }
        await this.handleVideoCallEnded();
      });

      // Single onMessage handler — shows genesys container, handles system messages, extends timeout
      this.videoEngagerClient.on("onMessage", async (/** @type {any} */ data) => {
        const genesysMessengerContainer = /** @type {HTMLDivElement | null} */ (document.querySelector('#genesys-messenger'));
        if (genesysMessengerContainer) {
          genesysMessengerContainer.style.display = 'block';
        }
        this.log(`VIDEOCLIENT: Received message: ${JSON.stringify(data)}`);
        this.handleSystemMessage(data);
        this.timeoutManager.extend("call", this.timeouts.call);
      });

      this.videoEngagerClient.on("VideoEngagerCall.ended", async () => {
        // Only handle if GenesysMessenger.conversationEnded hasn't already done so
        if (this.callPhase !== 'idle') {
          this.log("VIDEOCLIENT: Video call ended");
          await this.handleVideoCallEnded();
        }
      });
      this.videoEngagerClient.on('GenesysChat.error', ({ error }) => this.handleVideoCallError(error));

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
   * @param {Event} [event] - The click event; omitted when returning from sign-in.
   */
  async handleStartVideoCall(event) {
    event?.preventDefault();
    if (!this.isInitialized || this.callPhase !== 'idle') return;
    this.log("CALL: Start video call requested");
    this.starting = true;
    const startButton = /** @type {HTMLButtonElement} */ (document.getElementById('StartVideoCall'));
    const cancelButton = /** @type {HTMLButtonElement | null} */ (document.querySelector('ve-carousel-waitroom')?.shadowRoot?.querySelector('.cancel-button'));
    startButton.disabled = true;
    if (cancelButton) cancelButton.disabled = true;

    try {
      // Show loading screen
      this.callPhase = 'waiting';
      this.showScreen("loading");

      // Pause inactivity timer for the duration of the call
      this.timeoutManager.clear("inactivity");

      await this._acquireWakeLock();
      // startVideo authenticates first, then waits for Core startup to complete.
      if (this.videoEngagerClient && this.videoEngagerClient.isReady()) {
        await this.videoEngagerClient.startVideo();
        if (['waiting', 'precall'].includes(this.callPhase)) {
          this.timeoutManager.set('call', () => this.handleCallTimeout(), this.timeouts.call);
        }
        if (this.config?.useGenesysMessengerChat && ['waiting', 'precall'].includes(this.callPhase)) {
          await this.videoEngagerClient.startGenesysChat();
        }
      } else {
        throw new Error("VideoEngager client not ready");
      }
    } catch (error) {
      this.log(`CALL: Failed to start video call: ${error.message}`);
      await this.handleVideoCallEnded();
      this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, error);
    } finally {
      this.starting = false;
      startButton.disabled = !this.videoEngagerClient?.isReady();
      if (cancelButton) cancelButton.disabled = false;
    }
  }

  /**
   * Handles the cancel call button click event.
   * Cancels the call, clears the timeout, and returns to the initial screen.
   * @param {Event} event - The click event.
   */
  async handleCancelCall(event) {
    event.preventDefault();
    if (this.starting) return; // Core startup must resolve before visitor cancellation.
    this.log("CALL: Cancel call requested");
    await this.handleVideoCallEnded();
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
      if (this._notificationAnimationTimer) clearTimeout(this._notificationAnimationTimer);
      this._notificationAnimationTimer = setTimeout(() => {
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
  clearSystemNotification() {
    if (this.systemNotificationElement && this.systemNotificationElement.style.display !== 'none') {
      // Add fade-out animation
      this.systemNotificationElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      this.systemNotificationElement.style.opacity = '0';
      this.systemNotificationElement.style.transform = 'translateX(-50%) translateY(-20px)';

      // Hide completely after animation
      if (this._notificationHideTimer) clearTimeout(this._notificationHideTimer);
      this._notificationHideTimer = setTimeout(() => {
        if (this.systemNotificationElement) {
          this.systemNotificationElement.style.display = 'none';
          this.systemNotificationElement.style.opacity = '';
          this.systemNotificationElement.style.transform = '';
          this.systemNotificationElement.classList.remove('notification-update', 'system-notification');
        }
        this._notificationHideTimer = null;
      }, 300);

      this.log('SYSTEM: System notification cleared');
    }
  }

  /**
   * Creates the system notification element if it doesn't exist.
   */
  createSystemNotificationElement() {
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

    // Add CSS animation class (only once)
    if (!document.getElementById('system-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'system-notification-styles';
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
    }

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
    // Hide the Genesys chat but only when useGenesysMessengerChat is enabled
    if (this.config?.useGenesysMessengerChat) {
      this.videoEngagerClient?.hideGenesysChat();
    }
  }

  async handleVideoCallEnded() {
    if (this.callPhase === 'idle' || this.callPhase === 'ending') return;
    this.log("CALL: Video call ended");

    // Clear any active timeouts
    this.callPhase = 'ending';
    this.timeoutManager.clear("call");
    this._releaseWakeLock();

    // Clear system notification
    this.clearSystemNotification();
    try {
      await this.videoEngagerClient?.endVideo();
    } catch (error) {
      this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, error);
    }
    // Return to initial screen and restart inactivity timer
    this.callPhase = 'idle';
    /** @type {HTMLButtonElement} */ (document.getElementById('StartVideoCall')).disabled = !this.videoEngagerClient?.isReady();
    this.showScreen("initial");
    this.setupInactivityTimer();
  }

  async handleVideoCallError(/** @type {Error} */ error) {
    this.log(`CALL: Video call error: ${error.message}`);

    await this.handleVideoCallEnded();
    this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, error);
  }

  async handleCallTimeout() {
    this.log("CALL: Call timeout - ending call");
    await this.handleVideoCallEnded();

    // Show timeout error
    this.errorHandler.handleError(ErrorTypes.CALL_TIMEOUT);
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

  hideLoadingScreen() {
    const oncallScreen = document.getElementById("oncall-screen");
    if (oncallScreen) oncallScreen.style.display = "none";
  }

  /**
   * Handles PreCallStarted postMessage events from the VideoEngager iframe.
   * Validates the origin against the configured veEnv before acting.
   * @param {MessageEvent} event
   */
  _handlePreCallMessage(event) {
    // Experimental iframe event format; replace when Core exposes public precall events.
    const iframe = document.querySelector('#video-call-ui iframe');
    if (!['waiting', 'precall'].includes(this.callPhase)) return;
    if (!this.config?.videoEngager?.isPopup && (!iframe || event.source !== iframe.contentWindow)) return;
    const veEnv = this.config?.videoEngager?.veEnv;
    if (!veEnv) return;
    const expectedOrigin = `https://${veEnv}`;
    if (event.origin !== expectedOrigin) return;

    let data = event.data;
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch (_) { return; }
    }
    if (data?.__postRobot__?.name === "VideoEngager.event:PreCallStarted") {
      this.log("CALL: PreCall started - hiding waitroom");
      this.callPhase = 'precall';
      this.showScreen("video");
    }
    if (data?.__postRobot__?.name === "VideoEngager.event:PreCallFinished") {
      this.log(`CALL: PreCall finished - callPhase is '${this.callPhase}'`);
      if (this.callPhase === 'precall') {
        // Agent hasn't joined yet — revert to waitroom
        this.callPhase = 'waiting';
        this.showScreen("loading");
      }
      // If 'active', agent already joined — stay on video screen
    }
  }

  /**
   * Shows the video call screen.
   */
  showVideoScreen() {
    const videoUI = document.getElementById("video-call-ui");
    if (videoUI) videoUI.style.height = "calc(100dvh - 38px)"; // Remove 38px for header height
  }

  // Configuration and Setup
  getLanguageFromParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get("lang");
    return lang && this.languages[lang] ? lang : "en";
  }

  applyLanguageSettings(/** @type {string} */ lang) {
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
    if (!this.config?.metadata.backgroundImage) return;

    // Validate URL
    if (
      !Utils.validateURL(this.config?.metadata.backgroundImage) &&
      !this.config?.metadata.backgroundImage.startsWith("img/")
    ) {
      this.log("BACKGROUND: Invalid background image URL");
      return;
    }

    const elem = document.getElementById("initial-screen");
    if (elem) {
      elem.style.backgroundImage = `url(${this.config?.metadata.backgroundImage})`;
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
    if (this.currentScreen === "initial" && this.callPhase === 'idle') {
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
    const stackTrace = new Error().stack;
    const stackTraceLine = stackTrace ? (stackTrace.split("\n")[2]?.trim() ?? "unknown source") : "unknown source";
    console.log(`[${timestamp}] ${message}`, {
      source: stackTraceLine
    });

    // In development, also log to potential debug element
    if (this.config?.debug === true) {
      const debugElement = document.getElementById("debug-log");
      if (debugElement) {
        debugElement.textContent += `[${timestamp}] ${message}\n`;
        debugElement.scrollTop = debugElement.scrollHeight;
      }
    }
  }

  // ── Wake lock ────────────────────────────────────────────────────────────────
  async _acquireWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.wakeLock.addEventListener('release', () => { this.wakeLock = null; });
    } catch (e) {
      this.log(`WAKELOCK: Could not acquire wake lock: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  _releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
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
    if (this._notificationAnimationTimer) clearTimeout(this._notificationAnimationTimer);
    if (this._notificationHideTimer) clearTimeout(this._notificationHideTimer);

    // Destroy VideoEngager client
    if (this.videoEngagerClient) {
      this.videoEngagerClient.destroy();
    }

    // Remove event listeners
    ["click", "touchstart", "mousemove", "keypress"].forEach((event) => {
      document.removeEventListener(event, this._boundResetInactivityTimer);
    });

    if (this._preCallMessageHandler) {
      window.removeEventListener("message", this._preCallMessageHandler);
      this._preCallMessageHandler = null;
    }

    this._releaseWakeLock();
  }
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  window.kioskApp = new KioskApplication();
});
