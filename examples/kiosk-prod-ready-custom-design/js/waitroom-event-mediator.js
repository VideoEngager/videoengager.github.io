// @ts-check
import { VECarouselWaitroom } from "./ve-carousel-waitroom.js";
/**
 * @typedef {Object} WaitroomReadyEventDetail
 * @property {VECarouselWaitroom} component - The waitroom component instance
 */

/**
 * @typedef {Object} SlideChangedEventDetail
 * @property {number} currentIndex - Current slide index
 * @property {Object} slide - Current slide configuration
 */

/**
 * @typedef {Object} BotMessageEventDetail
 * @property {string} message - Bot message text
 * @property {string} tier - Message tier (low, medium, high, critical)
 * @property {number} duration - Display duration in milliseconds
 */

/**
 * @typedef {Object} UserCancelledEventDetail
 * @property {number} timestamp - Cancellation timestamp
 */

/**
 * Event mediator class that bridges VECarouselWaitroom custom element events
 * with the kiosk application. Provides a clean interface for event handling
 * and ensures proper cleanup of event listeners.
 */
export class WaitroomEventMediator {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.eventListeners = new Map();

    /** @type {VECarouselWaitroom | null} */
    this.waitroomComponent = null;

    /** @type {boolean} */
    this.isInitialized = false;

    this.init();
  }

  /**
   * Initializes the event mediator and sets up listeners for waitroom events.
   * @returns {void}
   */
  init() {
    this.setupWaitroomEventListeners();
    this.isInitialized = true;
  }

  /**
   * Sets up event listeners for all VECarouselWaitroom events.
   * @private
   * @returns {void}
   */
  setupWaitroomEventListeners() {
    const carouselElement = document.querySelector("ve-carousel-waitroom");
    if (!carouselElement) {
      console.warn(
        "VECarouselWaitroom element not found. Ensure it is included in the DOM."
      );
      return;
    }

    // Listen for waitroom ready event
    carouselElement.addEventListener(
      "waitroom:ready",
      this.handleWaitroomReady.bind(this)
    );

    // Listen for slide change events
    carouselElement.addEventListener(
      "waitroom:slideChanged",
      this.handleSlideChanged.bind(this)
    );

    // Listen for configuration error events
    carouselElement.addEventListener(
      "waitroom:configError",
      this.handleError.bind(this)
    );

    // Listen for bot message events
    carouselElement.addEventListener(
      "waitroom:botMessage",
      this.handleBotMessage.bind(this)
    );

    // Listen for user cancellation events
    carouselElement.addEventListener(
      "waitroom:userCancelled",
      this.handleUserCancelled.bind(this)
    );
  }

  /**
   * Handles waitroom ready event from the custom element.
   * @private
   * @param {CustomEvent<WaitroomReadyEventDetail>} event
   * @returns {void}
   */
  handleWaitroomReady(event) {
    this.waitroomComponent = event.detail.component;
    this.emit("ready", event.detail);
  }

  /**
   * Handles slide changed event from the custom element.
   * @private
   * @param {CustomEvent<SlideChangedEventDetail>} event
   * @returns {void}
   */
  handleSlideChanged(event) {
    this.emit("slideChanged", event.detail);
  }

  /**
   * Handles bot message event from the custom element.
   * @private
   * @param {CustomEvent<BotMessageEventDetail>} event
   * @returns {void}
   */
  handleBotMessage(event) {
    this.emit("botMessage", event.detail);
  }

  /**
   * Handles configuration error event from the custom element.
   * @private
   * @param {CustomEvent} event - Event containing error details
   * @returns {void}
   */
  handleError(event) {
    this.emit("error", event.detail);
  }

  /**
   * Handles user cancelled event from the custom element.
   * @private
   * @param {CustomEvent<UserCancelledEventDetail>} event
   * @returns {void}
   */
  handleUserCancelled(event) {
    this.emit("userCancelled", event);
  }

  /**
   * Registers an event listener for a specific waitroom event.
   * @param {'ready' | 'slideChanged' | 'botMessage' | 'userCancelled' | 'error'} eventName - Name of the event to listen for
   * @param {Function} callback - Callback function to execute when event occurs
   * @returns {void}
   * @example
   * mediator.on('ready', (detail) => {
   *   console.log('Waitroom is ready:', detail.component);
   * });
   *
   * mediator.on('slideChanged', (detail) => {
   *   console.log('Slide changed to:', detail.currentIndex);
   * });
   */
  on(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)?.add(callback);
  }

  /**
   * Unregisters an event listener for a specific waitroom event.
   * @param {'ready' | 'slideChanged' | 'botMessage' | 'userCancelled' | 'error'} eventName - Name of the event
   * @param {Function} callback - Callback function to remove
   * @returns {void}
   * @example
   * mediator.off('slideChanged', mySlideChangeHandler);
   */
  off(eventName, callback) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emits an event to all registered listeners.
   * @private
   * @param {'ready' | 'slideChanged' | 'botMessage' | 'userCancelled' | 'error'} eventName - Name of the event
   * @param {any} detail - Event detail data
   * @returns {void}
   */
  emit(eventName, detail) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(detail);
        } catch (error) {
          console.error(`Error in ${eventName} event listener:`, error);
        }
      });
    }
  }

  /**
   * Sends a bot message to the waitroom component.
   * @param {string} message - Message text to display
   * @param {'low' | 'medium' | 'high' | 'critical'} [tier='low'] - Message priority tier
   * @param {number} [duration=5000] - Display duration in milliseconds
   * @returns {void}
   * @example
   * mediator.sendBotMessage('Please wait, connecting to agent...', 'medium', 3000);
   */
  sendBotMessage(message, tier = "low", duration = 5000) {
    if (this.waitroomComponent) {
      this.waitroomComponent.showBotMessage(message, tier, duration);
    } else {
      console.warn("Waitroom component not ready. Cannot send bot message.");
    }
  }

  /**
   * Triggers a system interrupt in the waitroom component.
   * @param {string} [message] - Optional custom interrupt message
   * @returns {void}
   * @example
   * mediator.triggerSystemInterrupt('System maintenance in progress');
   */
  triggerSystemInterrupt(message) {
    const event = new CustomEvent("systemInterrupt", {
      detail: { message },
    });
    window.dispatchEvent(event);
  }

  /**
   * Controls waitroom carousel playback.
   * @param {'play' | 'pause'} action - Playback action
   * @returns {void}
   * @example
   * mediator.controlCarousel('pause'); // Pause the carousel
   * mediator.controlCarousel('play');  // Resume the carousel
   */
  controlCarousel(action) {
    if (this.waitroomComponent) {
      if (action === "play") {
        this.waitroomComponent.play();
      } else if (action === "pause") {
        this.waitroomComponent.pause();
      }
    } else {
      console.warn("Waitroom component not ready. Cannot control carousel.");
    }
  }

  /**
   * Navigates to a specific slide in the carousel.
   * @param {number} index - Slide index to navigate to
   * @returns {void}
   * @example
   * mediator.goToSlide(2); // Go to the third slide (0-indexed)
   */
  goToSlide(index) {
    if (this.waitroomComponent) {
      this.waitroomComponent.goToSlide(index);
    } else {
      console.warn("Waitroom component not ready. Cannot navigate to slide.");
    }
  }

  /**
   * Updates the waitroom component configuration.
   * @param {Object} newConfig - New configuration object
   * @returns {void}
   * @example
   * mediator.updateConfig({
   *   carousel: { interval: 8000 },
   *   theme: { primaryColor: '#ff0000' }
   * });
   */
  updateConfig(newConfig) {
    if (this.waitroomComponent) {
      this.waitroomComponent.updateConfig(newConfig);
    } else {
      console.warn("Waitroom component not ready. Cannot update config.");
    }
  }

  /**
   * Gets the current state of the waitroom component.
   * @returns {Object | null} Current component state or null if not ready
   * @example
   * const state = mediator.getComponentState();
   * console.log('Current slide:', state?.currentSlideIndex);
   */
  getComponentState() {
    if (this.waitroomComponent) {
      return {
        currentSlideIndex: this.waitroomComponent.currentSlideIndex,
        isPlaying: this.waitroomComponent.isPlaying,
        reducedMotion: this.waitroomComponent.reducedMotion,
      };
    }
    return null;
  }

  /**
   * Checks if the waitroom component is ready and available.
   * @returns {boolean} True if component is ready, false otherwise
   * @example
   * if (mediator.isComponentReady()) {
   *   mediator.sendBotMessage('Welcome!');
   * }
   */
  isComponentReady() {
    return this.waitroomComponent !== null;
  }

  /**
   * Removes all event listeners and cleans up the mediator.
   * Should be called when the mediator is no longer needed.
   * @returns {void}
   * @example
   * mediator.destroy(); // Clean up when kiosk app is destroyed
   */
  destroy() {
    const carouselElement = document.querySelector("ve-carousel-waitroom");
    if (!carouselElement) {
      console.warn(
        "VECarouselWaitroom element not found. Ensure it is included in the DOM."
      );
      return;
    }
    // Remove DOM event listeners
    carouselElement.removeEventListener(
      "waitroom:ready",
      this.handleWaitroomReady.bind(this)
    );
    carouselElement.removeEventListener(
      "waitroom:slideChanged",
      this.handleSlideChanged.bind(this)
    );
    carouselElement.removeEventListener(
      "waitroom:botMessage",
      this.handleBotMessage.bind(this)
    );
    carouselElement.removeEventListener(
      "waitroom:userCancelled",
      this.handleUserCancelled.bind(this)
    );

    // Clear all registered listeners
    this.eventListeners.clear();

    // Reset component reference
    this.waitroomComponent = null;
    this.isInitialized = false;
  }
}
