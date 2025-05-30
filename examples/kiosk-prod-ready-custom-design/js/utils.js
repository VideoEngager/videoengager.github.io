// @ts-check
export class Utils {
  /**
   * Sanitizes a string for safe HTML insertion.
   * @param {string} str - The string to sanitize.
   * @returns {string} - The sanitized string.
   */
  static sanitizeHTML(str) {
    if (typeof str !== "string") return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Sanitizes a string by removing potentially harmful characters.
   * @param {string} str - The string to sanitize.
   * @returns {string} - The sanitized string.
   */
  static sanitizeText(str) {
    if (typeof str !== "string") return "";
    return str.replace(/[<>&"']/g, "");
  }

  /**
   * Debounces a function call.
   * @param {Function} func - The function to debounce.
   * @param {number} wait - The number of milliseconds to wait before calling the function.
   * @returns {Function} - A debounced version of the function.
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Validates a URL.
   * @param {string} url - The URL to validate.
   * @returns {boolean} - True if the URL is valid, false otherwise.
   */
  static validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generates a unique identifier.
   * @returns {string} - A unique identifier.
   */
  static generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Formats an error object for logging or display.
   * @param {Error|any} error - The error object to format.
   * @returns {Object} - An object containing the error message, stack, and name.
   */
  static formatError(error) {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }
    return { message: String(error) };
  }
}
