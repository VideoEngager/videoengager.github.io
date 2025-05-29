// @ts-check

/**
 * @typedef {Object} ErrorType
 * @property {string} code
 * @property {string} type
 * @property {string} userMessage
 * @property {boolean} shouldRetry
 * @property {number} [retryDelay]
 */

/**
 * @type {{ [key: string]: ErrorType }}
 */
export const ErrorTypes = {
  NETWORK_ERROR: {
    code: "NETWORK_ERROR",
    type: "Connection Issue",
    userMessage: "Please check your internet connection and try again.",
    shouldRetry: false,
  },
  CONFIG_MISSING: {
    code: "CONFIG_MISSING",
    type: "Configuration Error",
    userMessage:
      "Service configuration is unavailable. Please contact support.",
    shouldRetry: false,
  },
  CONFIG_INVALID: {
    code: "CONFIG_INVALID",
    type: "Configuration Error",
    userMessage: "Service configuration is invalid. Please contact support.",
    shouldRetry: false,
  },
  LIBRARY_LOAD_FAILED: {
    code: "LIBRARY_LOAD_FAILED",
    type: "Service Unavailable",
    userMessage: "Unable to load required services. Please refresh the page.",
    shouldRetry: true,
    retryDelay: 5000,
  },
  FORBIDDEN: {
    code: "FORBIDDEN",
    type: "Access Denied",
    userMessage:
      "You do not have access to this service. Please contact support.",
    shouldRetry: false,
  },
  INTERNAL_ERROR: {
    code: "INTERNAL_ERROR",
    type: "Service Error",
    userMessage:
      "A service error occurred. The page will automatically refresh.",
    shouldRetry: true,
    retryDelay: 5000,
  },
  CALL_TIMEOUT: {
    code: "CALL_TIMEOUT",
    type: "Connection Timeout",
    userMessage: "Unable to connect to an agent. Please try again.",
    shouldRetry: true,
  },
};

export class ErrorHandler {
  constructor() {
    /** @type {Map<string, number>} */
    this.retryAttempts = new Map();
    this.networkRestoreEvent = new Event("networkRestored");
    /** @type {number} */
    this.maxRetryAttempts = 3;
    this.setupGlobalErrorHandling();
  }

  /**
   * Sets up global error handling for unhandled promise rejections,
   * online/offline events, and other critical errors.
   * @returns {void}
   * @private
   */
  setupGlobalErrorHandling() {
    !window.navigator.onLine &&
      this.dispatchExecutionBlockStatus({ blocked: true }) &&
      this.handleError(ErrorTypes.INTERNAL_ERROR);

    window.addEventListener("unhandledrejection", (event) => {
      this.logError("Unhandled Promise Rejection", event.reason);
      this.handleError(ErrorTypes.INTERNAL_ERROR, event.reason);
    });

    window.addEventListener("online", () => {
      this.hideError();
      this.showToast("Connection restored", "success");
      document.dispatchEvent(this.networkRestoreEvent);
    });

    window.addEventListener("offline", () => {
      this.handleError(ErrorTypes.NETWORK_ERROR);
    });
  }

  /**
   * @param {ErrorType} errorType
   * @param {any} [originalError]
   * @returns {string}
   */
  handleError(errorType, originalError = null) {
    const errorId = `${errorType.code}_${Date.now()}`;

    this.logError(
      errorType.type,
      originalError || new Error(errorType.userMessage),
      {
        errorId,
        userMessage: errorType.userMessage,
        shouldRetry: errorType.shouldRetry,
      }
    );

    this.showError(errorType);

    if (errorType.shouldRetry) {
      this.scheduleRetry(errorType, errorId);
    }

    return errorId;
  }

  /**
   * @param {string} type
   * @param {any} error
   * @param {Object} [metadata]
   */
  logError(type, error, metadata = {}) {
    const errorData = {
      type,
      message: error?.message || "Unknown error",
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...metadata,
    };

    this.sendToLoggingService(errorData);

    if (window.location.hostname.includes("localhost")) {
      console.error(`[${type}]`, errorData);
    }
  }

  /**
   * @param {Object} errorData
   */
  sendToLoggingService(errorData) {
    console.error("ERROR_LOG:", errorData);
  }

  /**
   * @param {ErrorType} errorType
   */
  showError(errorType) {
    const modal = document.getElementById("errorModal");
    if (!modal) return;

    const sanitizedMessage = this.sanitizeHTML(errorType.userMessage);
    const sanitizedType = this.sanitizeHTML(errorType.type);

    const modalTitle = modal.querySelector("#modalTitle");
    const modalBody = modal.querySelector(".modal-body");

    if (!modalTitle || !modalBody) return;

    modalTitle.textContent = sanitizedType;
    modalBody.textContent = sanitizedMessage;

    /** @type {HTMLDivElement | null} */
    const footerElement = modal.querySelector(".modal-footer-custom");
    if (footerElement && errorType.shouldRetry) {
      footerElement.style.display = "block";
      /** @type {HTMLButtonElement | null} */
      const retryButton = footerElement.querySelector(".error-button");
      if (retryButton) {
        retryButton.textContent = "Retry";
        retryButton.onclick = () => {
          this.hideError();
          window.location.reload();
        };
      }
    } else if (footerElement) {
      footerElement.style.display = "none";
    }

    modal.style.display = "block";
    modal.setAttribute("aria-modal", "true");
    modal.removeAttribute("aria-hidden");
    modal.classList.add("show");
    document.body.classList.add("modal-open");
  }

  hideError() {
    const modal = document.getElementById("errorModal");
    if (!modal) return;

    modal.style.display = "none";
    modal.removeAttribute("aria-modal");
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("show");
    document.body.classList.remove("modal-open");
  }

  /**
   * @param {string} message
   * @param {"info" | "success" | "error"} [type]
   */
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${
          type === "error"
            ? "#dc3545"
            : type === "success"
            ? "#28a745"
            : "#007bff"
        };
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
    toast.textContent = this.sanitizeText(message);

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "1";
    }, 10);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }

  /**
   * Schedules a retry for the given error type.
   * @param {ErrorType} errorType
   * @param {string} errorId
   */
  scheduleRetry(errorType, errorId) {
    // Read current attempts from localStorage
    const code = localStorage.getItem(errorType.code);
    const currentAttempts = parseInt(code || "0");

    if (currentAttempts >= this.maxRetryAttempts) {
      this.showToast(
        "Maximum retry attempts reached. Please refresh the page manually.",
        "error"
      );
      // Clear retry count after max reached if you want
      localStorage.removeItem(errorType.code);
      return;
    }

    // Increment and save retry attempts
    localStorage.setItem(errorType.code, String(currentAttempts + 1));

    setTimeout(() => {
      window.location.reload();
    }, errorType.retryDelay);
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  sanitizeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  sanitizeText(str) {
    return String(str).replace(/[<>&"']/g, "");
  }

  /**
   * Dispatches a custom event for execution block status. Mainly used to
   * notify other parts of the application about execution blocks (e.g., KioskApp).
   * @param {Object} object
   * @returns {void}
   */
  dispatchExecutionBlockStatus(object) {
    const event = new CustomEvent("executionBlock", {
      detail: object,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

  /**
   * Handles legacy error codes from the VideoEngager service.
   * @param {number} statusCode
   * @returns {string}
   */
  handleLegacyError(statusCode) {
    const legacyMapping = {
      0: ErrorTypes.NETWORK_ERROR,
      2: ErrorTypes.CONFIG_INVALID,
      4: ErrorTypes.CONFIG_MISSING,
      5: ErrorTypes.INTERNAL_ERROR,
      6: ErrorTypes.NETWORK_ERROR,
      7: ErrorTypes.FORBIDDEN,
      8: ErrorTypes.LIBRARY_LOAD_FAILED,
    };

    const errorType = legacyMapping[statusCode] || ErrorTypes.INTERNAL_ERROR;
    return this.handleError(errorType);
  }
}
