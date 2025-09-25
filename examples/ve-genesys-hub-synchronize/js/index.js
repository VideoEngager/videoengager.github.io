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
    this.hasVideoCall = false;

    /**
     * @type {{
     *   initLibraryBtn: HTMLButtonElement | null,
     *   startChatBtn: HTMLButtonElement | null,
     *   startVideoBtn: HTMLButtonElement | null,
     *   endChatBtn: HTMLButtonElement | null,
     *   endVideoBtn: HTMLButtonElement | null,
     *   debugBox: HTMLDivElement | null
     *   videoContainer: HTMLDivElement | null
     *   presetSelect: HTMLSelectElement | null
     *   attributesForm: HTMLFormElement | null
     * toggleCameraBtn: HTMLButtonElement | null
     * toggleMuteBtn: HTMLButtonElement | null
     * switchCameraBtn: HTMLButtonElement | null
     * toggleScreenBtn: HTMLButtonElement | null
     * endCallBtn: HTMLButtonElement | null
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
  }

  async init(defaultConfig = null) {
    try {
      this.configManager = new ConfigManager(defaultConfig);
      this.config = await this.configManager.load();
      this.log(`INIT: Configuration loaded: ${JSON.stringify(this.config)}`);
      await this.initializeVideoEngager();
      this.initVideoControlListeners();
      return true;
    } catch (error) {
      this.log(`INIT: Initialization failed: ${error.message}`);
      return false;
    }
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
        }
      );

      this.videoEngagerClient.on(
        "GenesysMessenger.conversationEnded",
        async () => {
          await this.handleVideoCallEnded();
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

  async handleVideoCallEnded() {
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

    await this.endChat();

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
    elements.endVideoBtn
  ) {
    elements.initLibraryBtn.addEventListener("click", async () => {
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

      const initSuccess = await app.init(defaultConfig);
      
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
