//@ts-check
// load the VideoEngager script
let isMessengerOpen = true;

async function init() {
  try {
    const configuration = getConfiguration();
    if (configuration.fun) {
      document.querySelector("#videoContainer")?.classList.add("spin");
    }
    initVideoControlListeners();
    await loadVideoEngagerHub(configuration);
    initVideoEngagerEventListeners(configuration);
    initGenesysEventListeners();
    await startVideo(configuration.customAttributes);
    await startChat();
  } catch (error) {
    throw error;
  }
}

function initGenesysEventListeners() {
  window.Genesys("subscribe", "Messenger.closed", function () {
    window.Genesys("command", "Messenger.open");
  });

  window.Genesys("subscribe", "Messenger.closed", function(){
    updateMessengerState();
  });
}

function initVideoEngagerEventListeners(configuration) {
  window.VideoEngager.on("videoStateChanged", (data) => {
    updateVideoControlsUI(data);
  });

  window.VideoEngager.on("GenesysMessenger.conversationStarted", async () => {
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

    if (configuration.fun) {
      const genesysMessengerIframe = document.getElementById(
        "genesys-mxg-container-frame"
      );
      genesysMessengerIframe?.classList.add("spin");
    }
  });

  window.VideoEngager.on("GenesysMessenger.conversationEnded", async () => {
    console.log("Conversation ended, ending video call");
    handleCallEnded();
  });

  window.VideoEngager.on("VideoEngagerCall.ended", async () => {
    console.log("Video call ended, ending Genesys chat");
    await window.VideoEngager.endGenesysChat();
  });
}

function handleCallEnded() {
  // check if we are in popup mode or iframe mode
  if (window.opener) {
    window.opener.postMessage({ action: "videoCallEnded", type: "popup" }, "*");
    window.close();
  } else if (window.parent) {
    window.parent.postMessage(
      { action: "videoCallEnded", type: "iframe" },
      "*"
    );
  }
}

function initVideoControlListeners() {
  const toggleCameraBtn = document.getElementById("toggleCamera");

  if (toggleCameraBtn) {
    toggleCameraBtn.addEventListener("click", () => {
      executeVideoCallFunction("triggerShowHideVideo");
    });
  }

  const toggleMuteBtn = document.getElementById("toggleMute");
  if (toggleMuteBtn) {
    toggleMuteBtn.addEventListener("click", () => {
      executeVideoCallFunction("triggerMuteUnmute");
    });
  }

  const switchCameraBtn = document.getElementById("switchCamera");
  if (switchCameraBtn) {
    switchCameraBtn.addEventListener("click", () => {
      executeVideoCallFunction("triggerCameraSwitch");
    });
  }

  const toggleScreenBtn = document.getElementById("toggleScreen");
  if (toggleScreenBtn) {
    toggleScreenBtn.addEventListener("click", () => {
      executeVideoCallFunction("triggerScreenShare");
    });
  }

  const endCallBtn = document.getElementById("endCall");
  if (endCallBtn) {
    endCallBtn.addEventListener("click", () => {
      executeVideoCallFunction("triggerHangup");
    });
  }

  const toggleMessengerBtn = document.getElementById("toggleMessenger");
  if (toggleMessengerBtn) {
    toggleMessengerBtn.addEventListener("click", () => {
      updateMessengerState();
    });
  }
}

function updateMessengerState() {
  const toggleMessengerBtn = document.getElementById("toggleMessenger");
  const genesysMessengerIframe = document.getElementById(
    "genesys-mxg-container-frame"
  );
  const command = isMessengerOpen ? "none" : "block";
  isMessengerOpen = !isMessengerOpen;
  if (genesysMessengerIframe) {
    genesysMessengerIframe.style.display = command;
  }

  if (toggleMessengerBtn) {
    toggleMessengerBtn.classList.toggle("active", !isMessengerOpen);
    const icon = toggleMessengerBtn.querySelector("i");
    if (icon) {
      icon.className = isMessengerOpen
        ? "fas fa-message"
        : "fa-solid fa-comment-slash";
    }
  }
  const videoContainer = document.getElementById("videoContainer");
  if (videoContainer) {
    videoContainer.style.width = isMessengerOpen
      ? "calc(100% - 408.953px)"
      : "100%";
  }
}

async function executeVideoCallFunction(functionName) {
  try {
    if (!window.VideoEngager) {
      throw new Error("VideoEngager client not initialized");
    }

    const executeVideoFn = window.VideoEngager.getInstance().executeVideoCallFn;
    await executeVideoFn(functionName);
  } catch (error) {
    console.log(error);
  }
}

function updateVideoControlsUI(videoState) {
  const toggleCameraBtn = document.getElementById("toggleCamera");
  const toggleMuteBtn = document.getElementById("toggleMute");
  const switchCameraBtn = document.getElementById("switchCamera");
  const toggleScreenBtn = document.getElementById("toggleScreen");
  if (toggleCameraBtn) {
    const icon = toggleCameraBtn.querySelector("i");
    if (icon) {
      icon.className = videoState.isVideoOn
        ? "fas fa-video"
        : "fas fa-video-slash";
    }
    toggleCameraBtn.classList.toggle("active", videoState.isVideoOn);
  }

  if (toggleMuteBtn) {
    const icon = toggleMuteBtn.querySelector("i");
    if (icon) {
      icon.className = videoState.isMicOn
        ? "fas fa-microphone"
        : "fas fa-microphone-slash";
    }
    toggleMuteBtn.classList.toggle("active", videoState.isMicOn);
  }

  if (toggleScreenBtn) {
    toggleScreenBtn.classList.toggle("active", videoState.isScreenSharing);
  }

  if (switchCameraBtn) {
    const hasMultipleCameras =
      videoState.availableCameras && videoState.availableCameras.length > 1;
    // @ts-ignore
    switchCameraBtn.disabled = !hasMultipleCameras;
  }
}

/**
 * Gets and returns the configuration from the URL parameters.
 * The configuration is expected to be a base64-encoded JSON string passed as the 'config' query parameter.
 * @returns {{
 *   videoEngager: {
 *     tenantId: string,
 *     veEnv: string,
 *     isPopup: boolean,
 *     veHttps: boolean
 *   },
 *   genesys: {
 *     deploymentId: string,
 *     domain: string,
 *  hideGenesysLauncher?: boolean
 *   },
 *   useGenesysMessengerChat: boolean,
 *  debug?: boolean
 * customAttributes?: Record<string, string>
 * fun?: boolean
 * }} - The parsed configuration object.
 * @throws {Error} - Throws an error if the configuration is missing or invalid.
 */
function getConfiguration() {
  const configuraiton = window.location.search
    .substring(1)
    .split("&")
    .map((param) => param.split("="))
    .find(([key]) => key === "config")?.[1];
  if (!configuraiton) {
    throw new Error("Configuration is required");
  }
  const parsedConfiguration = atob(configuraiton);
  try {
    return JSON.parse(parsedConfiguration);
  } catch (error) {
    throw new Error("Invalid configuration format");
  }
}

/** Sets up a secure proxy for the VideoEngager configuration and method calls.
 * This method initializes global variables and creates a Proxy to handle method calls with timeouts.
 * @param {{
 *   videoEngager: {
 *     tenantId: string,
 *     veEnv: string,
 *     isPopup: boolean,
 *     veHttps: boolean
 *   },
 *   genesys: {
 *     deploymentId: string,
 *     domain: string,
 *  hideGenesysLauncher?: boolean
 *   },
 *   useGenesysMessengerChat: boolean,
 *  debug?: boolean
 * }} configuration - The configuration object for VideoEngager and Genesys.
 * @returns {Promise<void>} - Resolves when the proxy is set up.
 */
async function setupConfigProxy(configuration) {
  // Clean up any existing global variables
  delete window.__VideoEngagerConfigs;
  delete window.__VideoEngagerQueue;
  delete window.VideoEngager;

  // Set up secure configuration
  window.__VideoEngagerConfigs = {
    videoEngager: {
      tenantId: configuration.videoEngager.tenantId,
      veEnv: configuration.videoEngager.veEnv,
      deploymentId: configuration.genesys.deploymentId,
      isPopup: Boolean(configuration.videoEngager.isPopup),
      veHttps: configuration.videoEngager.veHttps !== false,
      debug: configuration.debug === true,
      enableVeIframeCommands: true,
    },
    genesys: {
      deploymentId: configuration.genesys.deploymentId,
      domain: configuration.genesys.domain,
      hideGenesysLauncher: Boolean(configuration.genesys.hideGenesysLauncher),
      debug: configuration.debug === true,
    },
    useGenesysMessengerChat: Boolean(configuration.useGenesysMessengerChat),
    logger: configuration.debug === true,
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
async function loadDependencies() {
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
async function waitForReady() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("VideoEngager ready timeout"));
    }, 60000);

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

/** Loads and initializes the VideoEngager Hub with the provided configuration.
 * This method sets up the configuration proxy, loads dependencies, and waits for readiness.
 * @param {{
 *   videoEngager: {
 *     tenantId: string,
 *     veEnv: string,
 *     isPopup: boolean,
 *     veHttps: boolean
 *   },
 *   genesys: {
 *     deploymentId: string,
 *     domain: string,
 *  hideGenesysLauncher?: boolean
 *   },
 *   useGenesysMessengerChat: boolean,
 *  debug?: boolean
 * fun?: boolean
 * }} configuration - The configuration object for VideoEngager and Genesys.
 * @returns {Promise<void>} - Resolves when VideoEngager is fully loaded and ready.
 * @throws {Error} - Throws an error if any step in the loading process fails.
 */
async function loadVideoEngagerHub(configuration) {
  await setupConfigProxy(configuration);
  await loadDependencies();
  await waitForReady();
}

async function startVideo(customAttributes = {}) {
  try {
    window.VideoEngager.setCustomAttributes(customAttributes);
    const result = await window.VideoEngager.startVideoChatSession();
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Starts a Genesys chat session using VideoEngager.
 * This method checks if the client is ready, then calls the VideoEngager API to start a Genesys chat session.
 * @param { Record<string, string>} [customAttributes={}] - Optional custom attributes to pass to the Genesys chat session.
 * @returns {Promise<Object>} - Resolves with the result of the Genesys chat session.
 * @throws {Error} - Throws an error if the client is not ready or if the VideoEngager API call fails.
 */
async function startChat(customAttributes = {}) {
  try {
    window.VideoEngager.setCustomAttributes(customAttributes);
    const result = await window.VideoEngager.startGenesysChat();
    return result;
  } catch (error) {
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  await init();
});

function cleanup() {
  if (window.VideoEngager) {
    window.VideoEngager.endGenesysChat();
  }
  handleCallEnded();
  return true;
}

// Handle both events for better coverage
window.addEventListener("beforeunload", () => cleanup());
window.addEventListener("pagehide", () => cleanup());
window.addEventListener("resize", () => {
  if (window.innerWidth > 1200 && !isMessengerOpen) {
    updateMessengerState();
  } else if (window.innerWidth <= 1200 && isMessengerOpen) {
    updateMessengerState();
  }
});
