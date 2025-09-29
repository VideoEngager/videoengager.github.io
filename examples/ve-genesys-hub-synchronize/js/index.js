// @ts-check
import { VideoEngagerClient } from "./client.js";
import { ConfigManager } from "./config-manager.js";

class VEHubHarnessClass {
  constructor() {
    this.config = null;
    this.videoEngagerClient = null;
    this.isInitialized = false;
    this.customAttributes = {};
    this.configManager = null;
    this.hasCurrentCall = false;

    /**
     * @type {{
     *  initLibraryBtn: HTMLButtonElement | null,
     *  startChatBtn: HTMLButtonElement | null,
     *  startVideoBtn: HTMLButtonElement | null,
     *  endChatBtn: HTMLButtonElement | null,
     *  endVideoBtn: HTMLButtonElement | null,
     *  debugBox: HTMLDivElement | null
     *  videoContainer: HTMLDivElement | null
     *  presetSelect: HTMLSelectElement | null
     *  attributesForm: HTMLFormElement | null
     *  toggleCameraBtn: HTMLButtonElement | null
     *  toggleMuteBtn: HTMLButtonElement | null
     *  switchCameraBtn: HTMLButtonElement | null
     *  toggleScreenBtn: HTMLButtonElement | null
     *  endCallBtn: HTMLButtonElement | null
     *  confirmConfig: HTMLButtonElement | null
     *  launchInIframe: HTMLButtonElement | null
     *  launchInPopup: HTMLButtonElement | null
     *  videoIframe: HTMLIFrameElement | null
     * }}
     */
    this.elements = {
      initLibraryBtn: null,
      startChatBtn: null,
      startVideoBtn: null,
      endChatBtn: null,
      endVideoBtn: null,
      debugBox: null,
      videoContainer: null,
      presetSelect: null,
      attributesForm: null,
      toggleCameraBtn: null,
      toggleMuteBtn: null,
      switchCameraBtn: null,
      toggleScreenBtn: null,
      endCallBtn: null,
      confirmConfig: null,
      launchInIframe: null,
      launchInPopup: null,
      videoIframe: null,
    };

    this.initElements();
  }

  initElements() {
    this.elements.initLibraryBtn = /**@type {HTMLButtonElement} */ (
      document.getElementById("initLibraryBtn")
    );
    this.elements.startChatBtn = /**@type {HTMLButtonElement} */ (
      document.getElementById("startChatBtn")
    );
    this.elements.startVideoBtn = /**@type {HTMLButtonElement} */ (
      document.getElementById("startVideoBtn")
    );
    this.elements.endChatBtn = /**@type {HTMLButtonElement} */ (
      document.getElementById("endChatBtn")
    );
    this.elements.endVideoBtn = /**@type {HTMLButtonElement} */ (
      document.getElementById("endVideoBtn")
    );
    this.elements.debugBox = /**@type {HTMLDivElement} */ (
      document.getElementById("debugBox")
    );
    this.elements.videoContainer = /**@type {HTMLDivElement} */ (
      document.getElementById("videoContainer")
    );
    this.elements.presetSelect = /**@type {HTMLSelectElement} */ (
      document.getElementById("presetSelect")
    );
    this.elements.attributesForm = /**@type {HTMLFormElement} */ (
      document.getElementById("ctx-form")
    );
    this.elements.toggleCameraBtn = /**@type {HTMLButtonElement}*/ (
      document.getElementById("toggleCamera")
    );
    this.elements.toggleMuteBtn = /**@type {HTMLButtonElement}*/ (
      document.getElementById("toggleMute")
    );
    this.elements.switchCameraBtn = /**@type {HTMLButtonElement}*/ (
      document.getElementById("switchCamera")
    );
    this.elements.toggleScreenBtn = /**@type {HTMLButtonElement}*/ (
      document.getElementById("toggleScreen")
    );
    this.elements.endCallBtn = /**@type {HTMLButtonElement}*/ (
      document.getElementById("endCall")
    );
    this.elements.confirmConfig = /**@type {HTMLButtonElement}*/ (
      document.getElementById("confirmConfig")
    );
    this.elements.launchInIframe = /**@type {HTMLButtonElement}*/ (
      document.getElementById("launchInIframe")
    );
    this.elements.launchInPopup = /**@type {HTMLButtonElement}*/ (
      document.getElementById("launchInPopup")
    );
  }

  async init() {
    try {
      if (!this.config) {
        throw new Error(
          "Configuration not loaded. Try calling loadConfig() first."
        );
      }
      await this.initializeVideoEngager();
      this.initVideoControlListeners();
      this.isInitialized = true;
      return true;
    } catch (error) {
      this.log(`INIT: Initialization failed: ${error.message}`);
      return false;
    }
  }

  initWindowMessageListener() {
    window.addEventListener("message", async (event) => {
      if (!event.data || !event.data.type) return;
      this.log(`INIT: Received message: ${JSON.stringify(event.data)}`);

      const { type, action } = event.data;
      if (
        type === "iframe" &&
        action === "videoCallEnded" &&
        this.elements.launchInIframe &&
        this.elements.launchInPopup
      ) {
        this.elements.launchInIframe.disabled = false;
        this.elements.launchInPopup.disabled = false;
        this.elements.videoIframe?.remove();
      } else if (
        type === "popup" &&
        action === "videoCallEnded" &&
        this.elements.launchInPopup &&
        this.elements.launchInIframe
      ) {
        this.elements.launchInIframe.disabled = false;
        this.elements.launchInPopup.disabled = false;
      }
    });
  }

  async loadConfig(defaultConfig = null) {
    this.configManager = new ConfigManager(defaultConfig);
    this.config = await this.configManager.load();
    this.log(`INIT: Configuration loaded: ${JSON.stringify(this.config)}`);
    this.initWindowMessageListener();
  }

  /**
   * Start chat.
   * @returns {Promise<boolean>}
   */
  async startChat() {
    this.log("CALL: Start chat requested");

    try {
      await this.videoEngagerClient?.waitForReady();
      if (this.videoEngagerClient && this.videoEngagerClient.isReady()) {
        await this.videoEngagerClient?.startChat(this.customAttributes);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else {
        throw new Error("VideoEngager client not ready");
      }
      return true;
    } catch (error) {
      this.log(`CALL: Failed to start chat: ${error.message}`);
      return false;
    }
  }

  /**
   * Ends chat.
   * @returns {Promise<boolean>}
   */
  async endChat() {
    this.log("CALL: End chat requested");
    try {
      await this.videoEngagerClient?.endChat();
      return true;
    } catch (error) {
      this.log(`CALL: Error ending chat: ${error.message}`);
      return false;
    }
  }

  async launchInPopup() {
    this.log("CUSTOM CALL: Start chat in popup requested");
    try {
      const popup = window.open(
        `video-iframe/index.html?config=${btoa(
          JSON.stringify({
            ...this.config,
            customAttributes: this.customAttributes,
          })
        )}&v=${new Date().getTime()}`,
        "_blank",
        `width=${window.screen.width * 0.6},height=${
          window.screen.height * 0.6
        },resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,center=yes,cache=no,title=VideoEngager Video Chat`
      );
      if (!popup) {
        throw new Error("Popup blocked");
      }
      if (this.elements.launchInPopup) {
        this.elements.launchInPopup.disabled = true;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      return true;
    } catch (error) {
      this.log(`CUSTOM CALL: Failed to start chat in popup: ${error.message}`);
      return false;
    }
  }

  async launchInIframe() {
    this.log("CUSTOM CALL: Start chat requested");
    try {
      const iframe = document.createElement("iframe");
      iframe.src = `video-iframe/index.html?config=${btoa(
        JSON.stringify({
          ...this.config,
          customAttributes: this.customAttributes,
        })
      )}`;
      iframe.style.width = "100%";
      iframe.style.height = "100vh";
      iframe.style.border = "none";
      iframe.style.position = "absolute";
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.zIndex = "1000";
      iframe.allow = "camera; microphone; fullscreen; display-capture";

      document.body.appendChild(iframe);
      this.elements.videoIframe = iframe;
      return true;
    } catch (error) {
      this.log(`CUSTOM CALL: Failed to start chat: ${error.message}`);
      return false;
    }
  }

  /**
   * Start video call.
   * @returns {Promise<boolean>}
   */
  async startVideo() {
    this.log("CALL: Start video requested");
    try {
      await this.videoEngagerClient?.waitForReady();
      if (this.videoEngagerClient && this.videoEngagerClient.isReady()) {
        console.log("customAttributes", this.customAttributes);
        await this.videoEngagerClient?.startVideo(this.customAttributes);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (this.elements.videoContainer) {
          this.elements.videoContainer.style.display = "block";
        } else {
          this.log("CALL: Video call container not found in DOM");
          throw new Error("Video call container not found in DOM");
        }

        try {
          const videoState = window.VideoEngager.getInstance().videoState;
          this.updateVideoControlsUI(videoState);
          this.log(`CALL: Initial video state: ${JSON.stringify(videoState)}`);
        } catch (error) {
          this.log(`CALL: Could not get initial video state: ${error.message}`);
        }
      } else {
        throw new Error("VideoEngager client not ready");
      }
      return true;
    } catch (error) {
      this.log(`CALL: Failed to start video call: ${error.message}`);
      return false;
    }
  }

  /**
   * Ends video call.
   * @returns {Promise<boolean>}
   */
  async endVideo() {
    this.log("CALL: End video requested");
    try {
      await this.videoEngagerClient?.endVideo();
      return true;
    } catch (error) {
      this.log(`CALL: Error ending video call: ${error.message}`);
      return false;
    }
  }

  /**
   * Initializes the VideoEngager client and sets up event listeners.
   * @returns {Promise<void>}
   */
  async initializeVideoEngager() {
    this.log("VIDEOCLIENT: Initializing VideoEngager client");

    try {
      // @ts-ignore
      this.videoEngagerClient = new VideoEngagerClient(this.config);
      // Initialize the client
      await this.videoEngagerClient.init();

      // Set up event listeners
      this.videoEngagerClient.on("VideoEngagerCall.agentJoined", () => {
        this.log("VIDEOCLIENT: Video call agent joined");
      });

      this.videoEngagerClient.on(
        "GenesysMessenger.conversationStarted",
        async () => {
          window.Genesys("command", "Messenger.openConversation");
          window.Genesys(
            "command",
            "MessagingService.fetchHistory",
            {},
            function () {
              /*fulfilled callback*/
            },
            function () {
              /*rejected callback*/
            }
          );
          if (this.elements.endChatBtn) {
            this.elements.endChatBtn.disabled = false;
          }
          if (this.elements.startChatBtn) {
            this.elements.startChatBtn.disabled = true;
          }
          if (this.elements.launchInIframe) {
            this.elements.launchInIframe.disabled = true;
          }
          if (this.elements.launchInPopup) {
            this.elements.launchInPopup.disabled = true;
          }
          this.hasCurrentCall = true;
        }
      );

      this.videoEngagerClient.on(
        "GenesysMessenger.conversationEnded",
        async () => {
          await this.endChat();
          await this.handleVideoCallEndedUI();
          this.hasCurrentCall = false;
        }
      );

      this.videoEngagerClient.on("VideoEngagerCall.ended", async () => {
        this.log("VIDEOCLIENT: Video call ended");

        if (this.elements.videoContainer) {
          this.elements.videoContainer.style.display = "none";
        } else {
          this.log("CALL: Video call container not found in DOM");
          throw new Error("Video call container not found in DOM");
        }

        if (this.elements.endVideoBtn) {
          this.elements.endVideoBtn.disabled = true;
        }
        if (this.elements.startVideoBtn) {
          this.elements.startVideoBtn.disabled = false;
        }
      });

      this.videoEngagerClient.on("onMessage", (data) => {
        this.log(
          `VIDEOCLIENT: System message: ${
            typeof data === "object" ? JSON.stringify(data) : data
          }`
        );
      });

      this.videoEngagerClient.on("videoStateChanged", (data) => {
        this.log(`VIDEOCLIENT: Video state changed: ${JSON.stringify(data)}`);
        this.updateVideoControlsUI(data);
      });

      this.log("VIDEOCLIENT: VideoEngager client initialized successfully");
    } catch (error) {
      this.log(`VIDEOCLIENT: Failed to initialize: ${error.message}`);
      throw error;
    }
  }

  async handleVideoCallEndedUI() {
    this.log("CALL: Conversation ended");
    if (this.elements.endVideoBtn) {
      this.elements.endVideoBtn.disabled = true;
    }
    if (this.elements.startVideoBtn) {
      this.elements.startVideoBtn.disabled = false;
    }
    if (this.elements.endChatBtn) {
      this.elements.endChatBtn.disabled = true;
    }
    if (this.elements.startChatBtn) {
      this.elements.startChatBtn.disabled = false;
    }

    if (this.elements.videoContainer) {
      this.elements.videoContainer.style.display = "none";
    } else {
      this.log("CALL: Video call container not found in DOM");
      throw new Error("Video call container not found in DOM");
    }
  }

  /**
   * Logs messages to the debug box with a timestamp and stack trace.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const stackTrace = new Error().stack;
    // @ts-ignore
    const stackTraceLine = stackTrace
      ? stackTrace.split("\n")[2].trim()
      : "unknown source";

    if (!this.elements.debugBox) return;
    this.elements.debugBox.textContent += `[${timestamp}] ${message}\n`;
    this.elements.debugBox.scrollTop = this.elements.debugBox.scrollHeight;
  }

  setCustomAttributes(attrs) {
    if (this.isInitialized) return;
    this.customAttributes = { ...this.customAttributes, ...attrs };
  }

  updateVideoControlsUI(videoState) {
    const { elements } = this;

    if (elements.toggleCameraBtn) {
      const icon = elements.toggleCameraBtn.querySelector("i");
      if (icon) {
        icon.className = videoState.isVideoOn
          ? "fas fa-video"
          : "fas fa-video-slash";
      }
      if (videoState.isVideoOn) {
        elements.toggleCameraBtn.classList.add("active");
      } else {
        elements.toggleCameraBtn.classList.remove("active");
      }
    }

    if (elements.toggleMuteBtn) {
      const icon = elements.toggleMuteBtn.querySelector("i");
      if (icon) {
        icon.className = videoState.isMicOn
          ? "fas fa-microphone"
          : "fas fa-microphone-slash";
      }
      if (videoState.isMicOn) {
        elements.toggleMuteBtn.classList.add("active");
      } else {
        elements.toggleMuteBtn.classList.remove("active");
      }
    }

    if (elements.toggleScreenBtn) {
      if (videoState.isScreenSharing) {
        elements.toggleScreenBtn.classList.add("active");
      } else {
        elements.toggleScreenBtn.classList.remove("active");
      }
    }

    if (elements.switchCameraBtn) {
      const hasMultipleCameras =
        videoState.availableCameras && videoState.availableCameras.length > 1;
      elements.switchCameraBtn.disabled = !hasMultipleCameras;
    }
  }

  async executeVideoCallFunction(functionName) {
    try {
      if (!this.videoEngagerClient) {
        throw new Error("VideoEngager client not initialized");
      }

      const executeVideoFn =
        window.VideoEngager.getInstance().executeVideoCallFn;
      await executeVideoFn(functionName);
      this.log(`VIDEO_CONTROLS: Executed ${functionName}`);
    } catch (error) {
      this.log(
        `VIDEO_CONTROLS: Error executing ${functionName}: ${error.message}`
      );
    }
  }

  initVideoControlListeners() {
    const { elements } = this;

    if (elements.toggleCameraBtn) {
      elements.toggleCameraBtn.addEventListener("click", () => {
        this.executeVideoCallFunction("triggerShowHideVideo");
      });
    }

    if (elements.toggleMuteBtn) {
      elements.toggleMuteBtn.addEventListener("click", () => {
        this.executeVideoCallFunction("triggerMuteUnmute");
      });
    }

    if (elements.switchCameraBtn) {
      elements.switchCameraBtn.addEventListener("click", () => {
        this.executeVideoCallFunction("triggerCameraSwitch");
      });
    }

    if (elements.toggleScreenBtn) {
      elements.toggleScreenBtn.addEventListener("click", () => {
        this.executeVideoCallFunction("triggerScreenShare");
      });
    }

    if (elements.endCallBtn) {
      elements.endCallBtn.addEventListener("click", () => {
        this.executeVideoCallFunction("triggerHangup");
      });
    }

    this.log("VIDEO_CONTROLS: Video control listeners initialized");
  }
}

const app = new VEHubHarnessClass();

document.addEventListener("DOMContentLoaded", function () {
  const PRESETS = {
    inlineWithChat: {
      videoEngager: {
        tenantId: "0FphTk091nt7G1W7",
        veEnv: "videome.leadsecure.com",
        isPopup: false,
      },
      genesys: {
        deploymentId: "c5d801ae-639d-4e5e-a52f-4963342fa0dc",
        domain: "mypurecloud.com",
      },
      useGenesysMessengerChat: true,
    },
    popupWithChat: {
      videoEngager: {
        tenantId: "0FphTk091nt7G1W7",
        veEnv: "videome.leadsecure.com",
        isPopup: true,
      },
      genesys: {
        deploymentId: "c5d801ae-639d-4e5e-a52f-4963342fa0dc",
        domain: "mypurecloud.com",
      },
      useGenesysMessengerChat: true,
    },
    inlineNoChat: {
      videoEngager: {
        tenantId: "0FphTk091nt7G1W7",
        veEnv: "videome.leadsecure.com",
        isPopup: false,
      },
      genesys: {
        deploymentId: "c5d801ae-639d-4e5e-a52f-4963342fa0dc",
        domain: "mypurecloud.com",
      },
      useGenesysMessengerChat: false,
    },
    popupNoChat: {
      videoEngager: {
        tenantId: "0FphTk091nt7G1W7",
        veEnv: "videome.leadsecure.com",
        isPopup: true,
      },
      genesys: {
        deploymentId: "c5d801ae-639d-4e5e-a52f-4963342fa0dc",
        domain: "mypurecloud.com",
      },
      useGenesysMessengerChat: false,
    },
    inlineWithChat_usaw: {
      videoEngager: {
        tenantId: "yRunQK8mL7HsJidu",
        veEnv: "videome.leadsecure.com",
        isPopup: false,
      },
      genesys: {
        deploymentId: "efc4abdb-4c95-4f5d-86b8-b6fb6b3e5b9b",
        domain: "usw2.pure.cloud",
      },
      useGenesysMessengerChat: true,
    },
    popupWithChat_usaw: {
      videoEngager: {
        tenantId: "yRunQK8mL7HsJidu",
        veEnv: "videome.leadsecure.com",
        isPopup: true,
      },
      genesys: {
        deploymentId: "efc4abdb-4c95-4f5d-86b8-b6fb6b3e5b9b",
        domain: "usw2.pure.cloud",
      },
      useGenesysMessengerChat: true,
    },
    inlineNoChat_usaw: {
      videoEngager: {
        tenantId: "yRunQK8mL7HsJidu",
        veEnv: "videome.leadsecure.com",
        isPopup: false,
      },
      genesys: {
        deploymentId: "efc4abdb-4c95-4f5d-86b8-b6fb6b3e5b9b",
        domain: "usw2.pure.cloud",
      },
      useGenesysMessengerChat: false,
    },
    popupNoChat_usaw: {
      videoEngager: {
        tenantId: "yRunQK8mL7HsJidu",
        veEnv: "videome.leadsecure.com",
        isPopup: true,
      },
      genesys: {
        deploymentId: "efc4abdb-4c95-4f5d-86b8-b6fb6b3e5b9b",
        domain: "usw2.pure.cloud",
      },
      useGenesysMessengerChat: false,
    },
  };

  const presetSelect = document.getElementById("presetSelect");
  if (presetSelect) {
    Object.keys(PRESETS).forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key;
      presetSelect.appendChild(option);
    });
  }

  const { elements } = app;

  if (
    elements.initLibraryBtn &&
    elements.startChatBtn &&
    elements.endChatBtn &&
    elements.startVideoBtn &&
    elements.endVideoBtn &&
    elements.confirmConfig &&
    elements.launchInIframe &&
    elements.launchInPopup
  ) {
    elements.confirmConfig.addEventListener("click", () => {
      if (elements.confirmConfig) elements.confirmConfig.disabled = true;
      if (elements.presetSelect) elements.presetSelect.disabled = true;

      const selectedPresetKey = elements.presetSelect
        ? elements.presetSelect.value
        : null;
      let defaultConfig = null;
      if (selectedPresetKey && PRESETS[selectedPresetKey]) {
        defaultConfig = PRESETS[selectedPresetKey];
      }
      if (elements.attributesForm) {
        const formData = new FormData(elements.attributesForm);
        const data = {};
        for (const [key, value] of formData.entries()) {
          data[`context.${key}`] = value;
        }
        app.setCustomAttributes(data);
        const inputs = elements.attributesForm.querySelectorAll(
          "input, select, textarea"
        );
        inputs.forEach((input) => {
          if (
            input instanceof HTMLInputElement ||
            input instanceof HTMLSelectElement ||
            input instanceof HTMLTextAreaElement
          ) {
            input.disabled = true;
          }
        });
        // @ts-ignore
        document.getElementById("ctx-preset").disabled = true;
        // @ts-ignore
        document.getElementById("ctx-apply").disabled = true;
        document
          .getElementById("context-card-container")
          ?.removeAttribute("open");
      }
      app.loadConfig(defaultConfig);
      if (elements.initLibraryBtn) {
        elements.initLibraryBtn.disabled = false;
      }
      if (elements.launchInIframe) {
        elements.launchInIframe.disabled = false;
      }
      if (elements.launchInPopup) {
        elements.launchInPopup.disabled = false;
      }
    });

    elements.launchInIframe.addEventListener("click", async () => {
      if (elements.launchInPopup) {
        elements.launchInPopup.disabled = true;
      }
      if (elements.launchInIframe) {
        elements.launchInIframe.disabled = true;
      }
      await app.launchInIframe();
    });

    elements.launchInPopup.addEventListener("click", async () => {
      if (elements.launchInPopup) {
        elements.launchInPopup.disabled = true;
      }
      if (elements.launchInIframe) {
        elements.launchInIframe.disabled = true;
      }
      await app.launchInPopup();
    });

    elements.initLibraryBtn.addEventListener("click", async () => {
      if (elements.launchInIframe) {
        elements.launchInIframe.disabled = true;
      }
      if (elements.launchInPopup) {
        elements.launchInPopup.disabled = true;
      }
      const initSuccess = await app.init();

      if (elements.startChatBtn) {
        elements.startChatBtn.disabled = !initSuccess;
      }
      if (elements.startVideoBtn) {
        elements.startVideoBtn.disabled = !initSuccess;
      }
      if (elements.initLibraryBtn) {
        elements.initLibraryBtn.disabled = initSuccess;
      }
      if (elements.presetSelect) {
        elements.presetSelect.disabled = initSuccess;
      }
    });

    elements.startChatBtn.addEventListener("click", async () => {
      const startChatResult = await app.startChat();
      if (elements.endChatBtn) {
        elements.endChatBtn.disabled = !startChatResult;
      }
      if (elements.startChatBtn) {
        elements.startChatBtn.disabled = startChatResult;
      }
    });

    elements.startVideoBtn.addEventListener("click", async () => {
      const startVideoResult = await app.startVideo();
      if (elements.endVideoBtn) {
        elements.endVideoBtn.disabled = !startVideoResult;
      }
      if (elements.startVideoBtn) {
        elements.startVideoBtn.disabled = startVideoResult;
      }
    });

    elements.endChatBtn.addEventListener("click", async () => {
      const endChatResult = await app.endChat();
      if (elements.endChatBtn) {
        elements.endChatBtn.disabled = endChatResult;
      }
      if (elements.startChatBtn) {
        elements.startChatBtn.disabled = !endChatResult;
      }
    });

    elements.endVideoBtn.addEventListener("click", async () => {
      const endVideoResult = await app.endVideo();
      if (elements.endVideoBtn) {
        elements.endVideoBtn.disabled = endVideoResult;
      }
      if (elements.startVideoBtn) {
        elements.startVideoBtn.disabled = !endVideoResult;
      }
    });
  }
});
