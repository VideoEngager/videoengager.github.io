//@ts-check
// Timeout Manager Class
export class TimeoutManager {
  constructor() {
    this.timeouts = new Map();
  }

  /**
   * Sets a timeout with a unique name.
   * If a timeout with the same name already exists, it will be cleared before setting the new one.
   * @param {string} name - Unique identifier for the timeout.
   * @param {Function} callback - Function to be executed after the timeout.
   * @param {number} delay - Delay in milliseconds before the callback is executed.
   * @returns {NodeJS.Timeout} - The ID of the timeout, which can be used to clear it.
   */
  set(name, callback, delay) {
    this.clear(name);

    const timeoutId = setTimeout(() => {
      callback();
      this.timeouts.delete(name);
    }, delay);

    this.timeouts.set(name, {
      id: timeoutId,
      startTime: Date.now(),
      delay,
      callback,
    });

    return timeoutId;
  }

  /**
   * Extends the delay of an existing timeout.
   * @param {string} name - Unique identifier for the timeout to be extended.
   * @param {number} additionalDelay - Additional delay in milliseconds to add to the timeout.
   * @returns {NodeJS.Timeout | null} - The ID of the extended timeout, or null if the timeout does not exist.
   */
  extend(name, additionalDelay) {
    const timeout = this.timeouts.get(name);
    if (timeout) {
      this.clear(name);
      return this.set(name, timeout.callback, timeout.delay + additionalDelay);
    }
    return null;
  }

  /**
   * Clears the timeout associated with the given name.
   * @param {string} name - Unique identifier for the timeout to be cleared.
   */
  clear(name) {
    const timeout = this.timeouts.get(name);
    if (timeout) {
      clearTimeout(timeout.id);
      this.timeouts.delete(name);
    }
  }

  /**
   * Clears all timeouts managed by this instance.
   */
  clearAll() {
    this.timeouts.forEach((timeout) => clearTimeout(timeout.id));
    this.timeouts.clear();
  }

  /**
   * Checks if a timeout with the given name exists.
   * @param {string} name - Unique identifier for the timeout.
   * @returns {boolean} - True if the timeout exists, false otherwise.
   */
  has(name) {
    return this.timeouts.has(name);
  }

  /**
   * Gets the remaining time for a timeout with the given name.
   * @param {string} name - Unique identifier for the timeout.
   * @returns {number} - Remaining time in milliseconds, or 0 if the timeout does not exist.
   */
  getRemainingTime(name) {
    const timeout = this.timeouts.get(name);
    if (!timeout) return 0;

    const elapsed = Date.now() - timeout.startTime;
    return Math.max(0, timeout.delay - elapsed);
  }
}
