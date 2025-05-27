// Import the VideoEngagerClient
import { VideoEngagerClient } from "./client.js";

const DEFAULT_LANG = "en";
const ERROR_RETRY_TIMEOUT = 1000 * 5;
const INACTIVITY_TIMEOUT = 1000 * 60 * 60;
const CALL_TIMEOUT = 1000 * 60 * 3;
// const logEl = document.getElementById("log");

// Global client instance
let videoEngagerClient = null;

function log(msg) {
//   const ts = new Date().toLocaleTimeString();
//   logEl.textContent += `[${ts}] ${msg}\n`;
//   logEl.scrollTop = logEl.scrollHeight;
//   console.log(`[${ts}] ${msg}`); // Also log to console
}

const codeResolve = {
  8: {
    message: "Script library cannot be loaded.",
    type: "Library Error",
  },
  7: {
    message:
      "We are sorry, but you do not have access to this page or resource.",
    type: "Forbidden",
  },
  6: {
    message: "Page will be reloaded when network became available.",
    type: "Network Error",
  },
  5: {
    message:
      "You have a network connection problem. Page will be reloaded in 5 seconds.",
    type: "Internal Server Error",
  },
  4: {
    message: "Configuration file cannot be found. Please contact support.",
    type: "Not Found",
  },
  2: {
    message: "Configuration file is not valid. Please contact support.",
    type: "Parse Error",
  },
  0: {
    message: "Server is not accessible. Please contact support.",
    type: "No Response Error",
  },
};

const callTimeout = {
  cancelVideoSession: function () {
    log("TIMEOUT: Call timeout reached, canceling video session");
    if (videoEngagerClient) {
      log("TIMEOUT: Calling videoEngagerClient.endVideo()");
      videoEngagerClient.endVideo();
    } else {
      log("TIMEOUT: No videoEngagerClient available to end");
    }
    this.timeoutId = undefined;
    log("TIMEOUT: Call timeout cleared");
  },
  set: function () {
    log(`TIMEOUT: Setting call timeout for ${CALL_TIMEOUT}ms`);
    if (typeof this.timeoutId === "number") {
      log("TIMEOUT: Canceling existing timeout before setting new one");
      this.cancel();
    }
    this.timeoutId = setTimeout(
      function () {
        log("TIMEOUT: Call timeout triggered");
        this.cancelVideoSession();
      }.bind(this),
      CALL_TIMEOUT
    );
    log(`TIMEOUT: Call timeout set with ID: ${this.timeoutId}`);
  },
  cancel: function () {
    log(`TIMEOUT: Canceling call timeout (ID: ${this.timeoutId})`);
    clearTimeout(this.timeoutId);
    log("TIMEOUT: Call timeout canceled");
  },
};

const inactivityTimeout = {
  set: function () {
    log(`INACTIVITY: Setting inactivity timeout for ${INACTIVITY_TIMEOUT}ms`);
    if (typeof this.timeoutId === "number") {
      log("INACTIVITY: Canceling existing inactivity timeout");
      this.cancel();
    }
    this.timeoutId = setTimeout(function () {
      log("INACTIVITY: Inactivity timeout triggered - reloading page");
      window.location.reload(true);
    }, INACTIVITY_TIMEOUT);
    log(`INACTIVITY: Inactivity timeout set with ID: ${this.timeoutId}`);
  },
  reset: function () {
    log("INACTIVITY: Reset called (no implementation)");
  },
  cancel: function () {
    log(`INACTIVITY: Canceling inactivity timeout (ID: ${this.timeoutId})`);
    clearTimeout(this.timeoutId);
    log("INACTIVITY: Inactivity timeout canceled");
  },
};

window.addEventListener("online", () => {
  log("NETWORK: Browser came online");
  console.log("Became online");
  refresh();
});

window.addEventListener("offline", () => {
  log("NETWORK: Browser went offline");
  console.log("Became offline");
  handleError(6);
});

const refresh = function () {
  log("REFRESH: Reloading page");
  window.location.reload(true);
};

const setLang = function (lang) {
  log(
    `LANG: Setting language strings - motto: "${lang.motto}", connect: "${lang.connect}", loadingText: "${lang.loadingText}"`
  );
  $(".secondery-text").html(lang.motto);
  $("#connectButton").html(lang.connect);
  $("#loadingText").html(lang.loadingText);
  log("LANG: Language strings applied to DOM");
};

function getLangFromParams() {
  log("LANG: Getting language from URL parameters");
  const urlParams = new URLSearchParams(window.location.search);
  const lang = urlParams.get("lang");
  const finalLang = lang || DEFAULT_LANG;
  log(`LANG: URL param lang="${lang}", using "${finalLang}"`);
  return finalLang;
}

function addCarouselItems() {
  log("CAROUSEL: Starting to add carousel items");
  const items = window.CAROUSEL_ITEMS || [];
  log(
    `CAROUSEL: Found ${items.length} carousel items in window.CAROUSEL_ITEMS`
  );

  const carouselContainer = document.getElementById("carousel-inner");
  if (!carouselContainer) {
    log("CAROUSEL: ERROR - carousel-inner container not found");
    return;
  }

  log(
    `CAROUSEL: Container has ${carouselContainer.children.length} existing children`
  );

  // Remove existing items except the first one
  let removedCount = 0;
  for (const item of carouselContainer.children) {
    if (item.id === "carousel-item-1") {
      log("CAROUSEL: Keeping carousel-item-1");
      continue;
    }
    log(`CAROUSEL: Removing existing item: ${item.id}`);
    item.remove();
    removedCount++;
  }
  log(`CAROUSEL: Removed ${removedCount} existing items`);

  let itemIndex = 2;
  for (const item of items) {
    log(
      `CAROUSEL: Adding item ${itemIndex} - src: "${item.src}", alt: "${
        item.alt || "slide" + itemIndex
      }"`
    );
    const div = document.createElement("div");
    div.id = "carousel-item-" + itemIndex;
    div.className = "carousel-item";
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.alt || "slide" + itemIndex;
    div.appendChild(img);
    carouselContainer.appendChild(div);
    log(`CAROUSEL: Added carousel-item-${itemIndex} to container`);
    itemIndex++;
  }
  log(`CAROUSEL: Finished adding ${items.length} carousel items`);
}

document.addEventListener("DOMContentLoaded", function (event) {
  log("DOM: DOMContentLoaded event fired");

  if (!jQuery) {
    log("DOM: ERROR - jQuery not available");
    handleError(8);
    return;
  }
  log("DOM: jQuery is available");

  if (window.BACKGROUND_IMAGE) {
    log(`DOM: Setting background image: ${window.BACKGROUND_IMAGE}`);
    const elem = document.getElementById("initial-screen");
    if (elem) {
      elem.style.backgroundImage = `url(${window.BACKGROUND_IMAGE})`;
      log("DOM: Background image applied to initial-screen");
    } else {
      log("DOM: ERROR - initial-screen element not found for background image");
    }
  } else {
    log("DOM: No background image specified in window.BACKGROUND_IMAGE");
  }

  log("DOM: Calling setInitialScreen()");
  setInitialScreen();

  log("DOM: Calling addCarouselItems()");
  addCarouselItems();

  const messageHandler = function (e) {
    log(
      `MESSAGE: Received message - type: ${
        e.data?.type
      }, data: ${JSON.stringify(e.data)}`
    );
    console.log("messageHandler", e.data);

    if (e.data && e.data.type === "CallStarted") {
      log(
        "MESSAGE: CallStarted received - hiding loading screens and showing video UI"
      );
      $("#loadingScreen,#carousel").hide();
      $("#cancel-button-loading").hide();
      $("#video-call-ui").css("height", "100%");

      log("MESSAGE: Canceling call timeout due to CallStarted");
      callTimeout.cancel();
    }
  };

  log("DOM: Setting up message event listener");
  if (window.addEventListener) {
    window.addEventListener("message", messageHandler, false);
    log("DOM: Message listener added using addEventListener");
  } else {
    window.attachEvent("onmessage", messageHandler);
    log("DOM: Message listener added using attachEvent (IE compatibility)");
  }

  log("DOM: Calling setupButtonEventListeners()");
  setupButtonEventListeners();

  log("DOM: Calling getConfig()");
  getConfig();
});

const handleError = function (statusCode) {
  log(`ERROR: Handling error with status code: ${statusCode}`);

  $("#errorModal").modal({
    backdrop: "static",
    keyboard: false,
  });
  log("ERROR: Error modal configured");

  statusCode = String(statusCode).charAt(0);
  log(`ERROR: Normalized status code to: ${statusCode}`);

  if (statusCode === "5") {
    log(`ERROR: Status 5 - will refresh page in ${ERROR_RETRY_TIMEOUT}ms`);
    setTimeout(refresh, ERROR_RETRY_TIMEOUT);
  }

  if (statusCode === "8") {
    log("ERROR: Status 8 - showing error text directly");
    document.querySelector("#error-text").style.display = "block";
    document.querySelector("#error-text").innerHTML =
      codeResolve[statusCode].message;
    log(`ERROR: Error text set to: ${codeResolve[statusCode].message}`);
    return;
  }

  const errorInfo = codeResolve[statusCode];
  if (errorInfo) {
    log(
      `ERROR: Showing modal - type: "${errorInfo.type}", message: "${errorInfo.message}"`
    );
    $("#modalTitle").html(errorInfo.type);
    $(".modal-body").html(errorInfo.message);
  } else {
    log(`ERROR: Unknown status code ${statusCode}, using generic error`);
  }

  $("#errorModal").modal("show");
  $(".modal-footer-custom").hide();
  log("ERROR: Error modal displayed");
};

const lang = {
  en: {
    motto: "SmartVideo Kiosk Demo",
    connect: "Touch Here To Begin",
    loadingText: "Connecting to an Agent",
  },
  de: {
    motto: "SmartVideo Kiosk Demo",
    connect: "Verbinden",
    loadingText: "Verbinde mit einem Agenten",
  },
  ar: {
    motto: "عرض توضيحي لسمارت فيديو كيوسك",
    connect: "الاتصال",
    loadingText: "جاري الاتصال بموظف خدمة العملاء",
  },
};

const setInitialScreen = function () {
  log("UI: Setting initial screen state");
  $("#loadingScreen,#carousel").hide();
  $("#cancel-button-loading").hide();
  $("#initial-screen").css("display", "flex");
  $("#oncall-screen").hide();
  log("UI: Initial screen elements configured");

  log("UI: Setting inactivity timeout");
  inactivityTimeout.set();
  log("UI: Initial screen setup complete");
};

const getConfig = async function () {
  log("CONFIG: Starting configuration retrieval");
  try {
    // Check if config is available
    if (!window.WIDGET_CONFIG) {
      log("CONFIG: ERROR - WIDGET_CONFIG not found in window object");
      console.error("WIDGET_CONFIG not found");
      handleError(4);
      return;
    }
    log("CONFIG: WIDGET_CONFIG found in window object");

    // Get language-specific config
    const currentLang = getLangFromParams();
    log(`CONFIG: Looking for configuration for language: ${currentLang}`);
    const config = window.WIDGET_CONFIG[currentLang];

    if (!config) {
      log(
        `CONFIG: ERROR - Configuration for language '${currentLang}' not found`
      );
      log(
        `CONFIG: Available languages: ${Object.keys(window.WIDGET_CONFIG).join(
          ", "
        )}`
      );
      console.error(`Configuration for language '${currentLang}' not found`);
      handleError(2);
      return;
    }
    log(`CONFIG: Configuration found for language '${currentLang}'`);

    const langObj = lang[currentLang];
    if (langObj) {
      log(
        `CONFIG: Language object found for '${currentLang}', applying language settings`
      );
      setLang(langObj);
    } else {
      log(
        `CONFIG: WARNING - No language object found for '${currentLang}', available: ${Object.keys(
          lang
        ).join(", ")}`
      );
    }

    // Validate required configuration
    log("CONFIG: Validating required configuration sections");
    if (!config.videoEngager) {
      log("CONFIG: ERROR - Missing videoEngager configuration section");
    }
    if (!config.genesys) {
      log("CONFIG: ERROR - Missing genesys configuration section");
    }

    if (!config.videoEngager || !config.genesys) {
      log("CONFIG: ERROR - Missing required configuration sections");
      console.error("Missing required configuration sections");
      handleError(2);
      return;
    }
    log("CONFIG: All required configuration sections present");

    // Initialize VideoEngager client
    log("CONFIG: Calling initializeVideoEngager with validated config");
    await initializeVideoEngager(config);
  } catch (error) {
    log(`CONFIG: ERROR - Exception during configuration: ${error.message}`);
    console.error("Configuration error:", error);
    handleError(8);
  }
};

const setupVideoEngagerEventListeners = function () {
  log("EVENTS: Setting up VideoEngager event listeners");
  if (!videoEngagerClient) {
    log("EVENTS: ERROR - VideoEngager client not initialized");
    console.error("VideoEngager client not initialized");
    handleError(8);
    return;
  }

  videoEngagerClient.on("VideoEngagerCall.ended", () => {
    log("Video ended");
    setInitialScreen();
  });
};

const initializeVideoEngager = async function (config) {
  log("VIDEOCLIENT: Starting VideoEngager client initialization");
  try {
    // Create client instance with config
    log("VIDEOCLIENT: Creating new VideoEngagerClient instance");
    videoEngagerClient = new VideoEngagerClient(config);
    log("VIDEOCLIENT: VideoEngagerClient instance created");

    // Initialize the client
    log("VIDEOCLIENT: Calling client.init()");
    await videoEngagerClient.init();

    setupVideoEngagerEventListeners();
    log("VIDEOCLIENT: VideoEngager client initialized successfully");

    log("VIDEOCLIENT: Client initialization completed successfully");

    console.log("VideoEngager client initialized successfully");
    log("VIDEOCLIENT: VideoEngager client is ready for use");

    // You can now use the client methods
    log(
      "VIDEOCLIENT: Available methods: startVideo(), startChat(), endVideo()"
    );
  } catch (error) {
    log(
      `VIDEOCLIENT: ERROR - Failed to initialize VideoEngager: ${error.message}`
    );
    console.error("Failed to initialize VideoEngager:", error);
    handleError(8);
  }
};

const setupButtonEventListeners = function () {
  log("BUTTONS: Setting up button event listeners");

  // Start Video Call button
  const startVideoButton = document.getElementById("StartVideoCall");
  if (startVideoButton) {
    log("BUTTONS: StartVideoCall button found, adding click listener");
    startVideoButton.addEventListener("click", async function (e) {
      e.preventDefault();
      log("BUTTONS: Start Video Call button clicked");
      console.log("Start Video Call button clicked");

      try {
        log("BUTTONS: Hiding initial screen and showing loading state");
        $("#initial-screen").hide();
        $("#oncall-screen").show();
        $("#loadingScreen,#carousel").show();
        $("#cancel-button-loading").show();
        log("BUTTONS: UI state changed to loading");

        // Set call timeout
        log("BUTTONS: Setting call timeout");
        callTimeout.set();

        // Start the video call using the client
        if (videoEngagerClient) {
          log("BUTTONS: VideoEngager client available, starting video call");
          await videoEngagerClient.startVideo();
          log("BUTTONS: Video call started successfully");
          console.log("Video call started successfully");
        } else {
          log("BUTTONS: ERROR - VideoEngager client not initialized");
          console.error("VideoEngager client not initialized");
          handleError(8);
          setInitialScreen();
        }
      } catch (error) {
        log(`BUTTONS: ERROR - Failed to start video call: ${error.message}`);
        console.error("Failed to start video call:", error);
        handleError(8);
        setInitialScreen();
      }
    });
    log("BUTTONS: StartVideoCall click listener added");
  } else {
    log("BUTTONS: WARNING - StartVideoCall button not found in DOM");
  }

  // Cancel button during loading
  const cancelButton = document.getElementById("cancel-button-loading");
  if (cancelButton) {
    log("BUTTONS: cancel-button-loading found, adding click listener");
    cancelButton.addEventListener("click", function (e) {
      e.preventDefault();
      log("BUTTONS: Cancel button clicked");
      console.log("Cancel button clicked");

      log("BUTTONS: Canceling video session and returning to initial screen");
      callTimeout.cancelVideoSession();
      setInitialScreen();
    });
    log("BUTTONS: Cancel button click listener added");
  } else {
    log("BUTTONS: WARNING - cancel-button-loading button not found in DOM");
  }

  log("BUTTONS: Button event listeners setup complete");
};
