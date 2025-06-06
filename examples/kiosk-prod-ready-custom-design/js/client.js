// @ts-check
/// <reference types="../types/ve-window.d.ts" />
import { ErrorHandler, ErrorTypes } from "./error-handler.js";
import { Utils } from "./utils.js";

export class VideoEngagerClient {
  /**
   * @param {Object} config - The configuration object for the client.
   * @param {Object} config.videoEngager - VideoEngager configuration.
   * @param {string} config.videoEngager.tenantId - The tenant ID for VideoEngager.
   * @param {string} config.videoEngager.veEnv - The VideoEngager environment (e.g., dev, staging).
   * @param {string} config.videoEngager.deploymentId - The deployment ID for VideoEngager.
   * @param {boolean} [config.videoEngager.isPopup=false] - Whether to use popup mode.
   * @param {boolean} [config.videoEngager.veHttps=true] - Whether to use HTTPS for VideoEngager.
   * @param {Object} config.genesys - Genesys configuration.
   * @param {string} config.genesys.deploymentId - The deployment ID for Genesys.
   * @param {string} config.genesys.domain - The domain for Genesys (e.g., mypurecloud.com).
   * @param {boolean} [config.genesys.hideGenesysLauncher=false] - Whether to hide the Genesys launcher.
   * @param {boolean} [config.useGenesysMessengerChat=false] - Whether to use Genesys Messenger Chat.
   * @param {Object} [config.monitoring] - Monitoring configuration.
   * @param {boolean} [config.monitoring.enabled=true] - Whether monitoring is enabled.
   * @param {string} [config.monitoring.level='info'] - The logging level for monitoring.
   */
  constructor(config) {
    this.config = this.validateAndSanitizeConfig(config);
    this.errorHandler = new ErrorHandler();
    this.eventEmitter = new EventTarget();
    this.connectionState = "disconnected";
    this.retryCount = 0;
    this.maxRetries = 3;
    this.scriptIntegrityCheck = true;
  }

  /**
   * Validates and sanitizes the configuration object.
   * Throws an error if the configuration is invalid or missing required fields.
   * @param {Object} config - The configuration object for the client.
   * @param {Object} config.videoEngager - VideoEngager configuration.
   * @param {string} config.videoEngager.tenantId - The tenant ID for VideoEngager.
   * @param {string} config.videoEngager.veEnv - The VideoEngager environment (e.g., dev, staging).
   * @param {string} config.videoEngager.deploymentId - The deployment ID for VideoEngager.
   * @param {boolean} [config.videoEngager.isPopup=false] - Whether to use popup mode.
   * @param {boolean} [config.videoEngager.veHttps=true] - Whether to use HTTPS for VideoEngager.
   * @param {Object} config.genesys - Genesys configuration.
   * @param {string} config.genesys.deploymentId - The deployment ID for Genesys.
   * @param {string} config.genesys.domain - The domain for Genesys (e.g., mypurecloud.com).
   * @param {boolean} [config.genesys.hideGenesysLauncher=false] - Whether to hide the Genesys launcher.
   * @param {boolean} [config.useGenesysMessengerChat=false] - Whether to use Genesys Messenger Chat.
   * @param {Object} [config.monitoring] - Monitoring configuration.
   * @param {boolean} [config.monitoring.enabled=true] - Whether monitoring is enabled.
   * @param {string} [config.monitoring.level='info'] - The logging level for monitoring.
   */
  validateAndSanitizeConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Configuration is required");
    }

    // Validate required sections
    const required = ["videoEngager", "genesys"];
    const missing = required.filter((section) => !config[section]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required configuration sections: ${missing.join(", ")}`
      );
    }

    // Validate required fields
    const requiredFields = {
      videoEngager: ["tenantId", "veEnv"],
      genesys: ["deploymentId", "domain"],
    };

    Object.entries(requiredFields).forEach(([section, fields]) => {
      fields.forEach((field) => {
        if (!config[section][field]) {
          throw new Error(`Missing required field: ${section}.${field}`);
        }
      });
    });

    // Sanitize string values
    const sanitizedConfig = JSON.parse(JSON.stringify(config));

    // Validate URLs if present
    if (
      sanitizedConfig.videoEngager.veEnv &&
      !sanitizedConfig.videoEngager.veEnv.match(/^[\w.-]+$/)
    ) {
      throw new Error("Invalid videoEngager environment format");
    }

    return sanitizedConfig;
  }

  /**
   * Initializes the client by setting up the configuration proxy,
   * loading dependencies, and waiting for the VideoEngager library to be ready.
   * @returns {Promise<boolean>} - Returns true if initialization is successful.
   * @throws {Error} - Throws an error if initialization fails.
   */
  async init() {
    try {
      this.connectionState = "connecting";

      await this.setupConfigProxy();
      await this.loadDependencies();
      await this.waitForReady();

      this.setupEventListeners();
      this.connectionState = "connected";
      this.retryCount = 0;

      this.emit("client:ready", {});
      return true;
    } catch (error) {
      this.connectionState = "error";
      this.handleInitError(error);
      throw error;
    }
  }

  /**
   * Sets up the configuration proxy for VideoEngager.
   * This method creates a global configuration object and a proxy for VideoEngager methods.
   * It also initializes a queue for method calls to ensure they can be processed asynchronously.
   * @returns {Promise<void>} - Resolves when the configuration proxy is set up.
   * @throws {Error} - Throws an error if the setup fails.
   */
  async setupConfigProxy() {
    // Clean up any existing global variables
    delete window.__VideoEngagerConfigs;
    delete window.__VideoEngagerQueue;
    delete window.VideoEngager;

    // Set up secure configuration
    window.__VideoEngagerConfigs = {
      videoEngager: {
        tenantId: this.config.videoEngager.tenantId,
        veEnv: this.config.videoEngager.veEnv,
        deploymentId: this.config.videoEngager.deploymentId,
        isPopup: Boolean(this.config.videoEngager.isPopup),
        veHttps: this.config.videoEngager.veHttps !== false,
      },
      genesys: {
        deploymentId: this.config.genesys.deploymentId,
        domain: this.config.genesys.domain,
        hideGenesysLauncher: Boolean(this.config.genesys.hideGenesysLauncher),
      },
      useGenesysMessengerChat: Boolean(this.config.useGenesysMessengerChat),
    };

    // Set up secure proxy queue
    window.__VideoEngagerQueue = [];
    window.VideoEngager = new Proxy(
      {},
      {
        get:
          (_, method) =>
          (...args) => {
            return new Promise((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                reject(
                  new Error(`VideoEngager method '${String(method)}' timed out`)
                );
              }, 30000); // 30 second timeout

              window.__VideoEngagerQueue?.push({
                m: method,
                a: args,
                r: (result) => {
                  clearTimeout(timeoutId);
                  resolve(result);
                },
                rj: (error) => {
                  clearTimeout(timeoutId);
                  reject(error);
                },
              });
            });
          },
      }
    );
  }

  /**
   * Loads the VideoEngager dependencies by dynamically adding the script to the document.
   * This method handles script loading with error handling and a timeout.
   * @returns {Promise<void>} - Resolves when the script is loaded successfully.
   * @throws {Error} - Throws an error if the script fails to load or times out.
   */
  async loadDependencies() {
    return new Promise((resolve, reject) => {
      try {
        // Remove any existing script
        const existingScript = document.querySelector(
          'script[src*="genesys-hub.umd.js"]'
        );
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement("script");
        script.src =
          "https://cdn.videoengager.com/widget/latest/browser/genesys-hub.umd.js";
        script.async = true;

        // Add integrity check if available (you should get the actual hash from VideoEngager)
        // script.integrity = 'sha384-...';

        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error("Script load timeout"));
        }, 15000);

        const cleanup = () => {
          clearTimeout(timeout);
          script.onload = null;
          script.onerror = null;
        };

        script.onload = () => {
          cleanup();

          // Verify the script loaded correctly
          if (typeof window.VideoEngager !== "object") {
            reject(new Error("VideoEngager library not properly initialized"));
            return;
          }

          resolve();
        };

        script.onerror = (error) => {
          cleanup();
          reject(new Error("Failed to load VideoEngager script"));
        };

        document.head.appendChild(script);
      } catch (error) {
        reject();
      }
    });
  }

  /**
   * Waits for the VideoEngager library to be ready.
   * This method checks if the `onReady` method is available and resolves when it is called.
   * @returns {Promise<void>} - Resolves when VideoEngager is ready.
   * @throws {Error} - Throws an error if VideoEngager is not ready within the timeout.
   */
  async waitForReady() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("VideoEngager ready timeout"));
      }, 10000);

      if (
        window.VideoEngager &&
        typeof window.VideoEngager.onReady === "function"
      ) {
        window.VideoEngager.onReady(() => {
          clearTimeout(timeout);
          resolve();
        });
      } else {
        clearTimeout(timeout);
        reject(new Error("VideoEngager onReady method not available"));
      }
    });
  }

  /**
   * Sets up event listeners for VideoEngager events.
   * This method listens for various events from VideoEngager and emits them using the event emitter.
   * It also includes error handling for setting up listeners.
   */
  setupEventListeners() {
    // Set up VideoEngager event listeners with error handling
    const events = [
      "VideoEngagerCall.started",
      "VideoEngagerCall.agentJoined",
      "VideoEngagerCall.ended",
      "VideoEngagerCall.error",
      "GenesysChat.started",
      "GenesysChat.ended",
      "GenesysChat.error",
      "onMessage"
    ];

    events.forEach((eventName) => {
      try {
        window.VideoEngager.on(eventName, (payload) => {
          this.emit(eventName, payload);
        });
      } catch (error) {
        console.warn(`Failed to set up listener for ${eventName}:`, error);
      }
    });
  }

  /**
   * Starts a video chat session using VideoEngager.
   * This method checks if the client is ready, then calls the VideoEngager API to start a video chat session.
   * @returns {Promise<Object>} - Resolves with the result of the video chat session.
   * @throws {Error} - Throws an error if the client is not ready or if the VideoEngager API call fails.
   */
  async startVideo() {
    if (this.connectionState !== "connected") {
      throw new Error("Client not ready. Call init() first.");
    }

    try {
      const result = await window.VideoEngager.startVideoChatSession();
      this.emit("video:started", result);
      return result;
    } catch (error) {
      const errorId = this.errorHandler.handleError(
        ErrorTypes.INTERNAL_ERROR,
        error
      );
      this.emit("video:error", { error, errorId });
      throw error;
    }
  }

  /**
   * Ends the current video chat session using VideoEngager.
   * This method calls the VideoEngager API to end the video chat session.
   * @returns {Promise<Object>} - Resolves with the result of ending the video chat session.
   * @throws {Error} - Throws an error if the VideoEngager API call fails.
   */
  async endVideo() {
    try {
      const result = await window.VideoEngager.endVideoChatSession();
      this.emit("video:ended", result);
      return result;
    } catch (error) {
      this.emit("video:error", { error });
      throw error;
    }
  }

  /**
   * Starts a Genesys chat session using VideoEngager.
   * This method checks if the client is ready, then calls the VideoEngager API to start a Genesys chat session.
   * @returns {Promise<Object>} - Resolves with the result of the Genesys chat session.
   * @throws {Error} - Throws an error if the client is not ready or if the VideoEngager API call fails.
   */
  async startChat() {
    if (this.connectionState !== "connected") {
      throw new Error("Client not ready. Call init() first.");
    }

    try {
      const result = await window.VideoEngager.startGenesysChat();
      this.emit("chat:started", result);
      return result;
    } catch (error) {
      const errorId = this.errorHandler.handleError(
        ErrorTypes.INTERNAL_ERROR,
        error
      );
      this.emit("chat:error", { error, errorId });
      throw error;
    }
  }

  /**
   * Ends the current Genesys chat session using VideoEngager.
   * This method calls the VideoEngager API to end the Genesys chat session.
   * @returns {Promise<Object>} - Resolves with the result of ending the Genesys chat session.
   * @throws {Error} - Throws an error if the VideoEngager API call fails.
   */
  async endChat() {
    try {
      const result = await window.VideoEngager.endGenesysChat();
      this.emit("chat:ended", result);
      return result;
    } catch (error) {
      this.emit("chat:error", { error });
      throw error;
    }
  }

  /**
   * Emits an event with the specified name and data.
   * This method creates a custom event with the provided data and dispatches it using the event emitter.
   * @param {string} eventName - The name of the event to emit.
   * @param {Object} data - The data to include in the event.
   */
  emit(eventName, data) {
    const event = new CustomEvent(eventName, {
      detail: {
        ...data,
        timestamp: Date.now(),
        clientId: this.config._clientId || Utils.generateId(),
      },
    });
    this.eventEmitter.dispatchEvent(event);
  }

  /**
   * Registers an event listener for the specified event name.
   * This method wraps the callback to handle errors and ensures that the event is properly removed when no longer needed.
   * @param {string} eventName - The name of the event to listen for.
   * @param {Function} callback - The callback function to execute when the event is emitted.
   * @returns {Function} - A function to remove the event listener.
   */
  on(eventName, callback) {
    const wrappedCallback = (event) => {
      try {
        callback(event.detail);
      } catch (error) {
        this.errorHandler.logError("Event Handler Error", error, { eventName });
      }
    };
    this.eventEmitter.addEventListener(eventName, wrappedCallback);
    return () =>
      this.eventEmitter.removeEventListener(eventName, wrappedCallback);
  }

  /**
   * Removes an event listener for the specified event name.
   * This method removes the specified callback from the event emitter.
   * @param {string} eventName - The name of the event to stop listening for.
   * @param {EventListenerOrEventListenerObject | null} callback - The callback function to remove.
   */
  off(eventName, callback) {
    this.eventEmitter.removeEventListener(eventName, callback);
  }

  /**
   * Handles initialization errors by incrementing the retry count and categorizing the error.
   * This method checks the error message to determine the type of error and calls the error handler accordingly.
   * @param {Error} error - The error that occurred during initialization.
   */
  handleInitError(error) {
    this.retryCount++;

    if (error.message.includes("timeout")) {
      this.errorHandler.handleError(ErrorTypes.NETWORK_ERROR, error);
    } else if (error.message.includes("configuration")) {
      this.errorHandler.handleError(ErrorTypes.CONFIG_INVALID, error);
    } else if (error.message.includes("script")) {
      this.errorHandler.handleError(ErrorTypes.LIBRARY_LOAD_FAILED, error);
    } else {
      this.errorHandler.handleError(ErrorTypes.INTERNAL_ERROR, error);
    }
  }

  /**
   * Gets the current connection state of the client.
   * This method returns the current connection state, which can be "disconnected", "connecting", "connected", or "error".
   * @returns {string} - The current connection state.
   */
  getConnectionState() {
    return this.connectionState;
  }

  /**
   * Checks if the client is ready for use.
   * This method returns true if the client is in the "connected" state, otherwise false.
   * @returns {boolean} - True if the client is ready, false otherwise.
   */
  isReady() {
    return this.connectionState === "connected";
  }

  /**
   * Destroys the client instance, cleaning up resources and removing global variables.
   * This method sets the connection state to "disconnected", removes global variables,
   * and cleans up the script element from the document.
   */
  destroy() {
    this.connectionState = "disconnected";

    // Clean up global variables
    delete window.__VideoEngagerConfigs;
    delete window.__VideoEngagerQueue;
    delete window.VideoEngager;

    // Remove script
    const script = document.querySelector('script[src*="genesys-hub.umd.js"]');
    if (script) {
      script.remove();
    }
  }
}
