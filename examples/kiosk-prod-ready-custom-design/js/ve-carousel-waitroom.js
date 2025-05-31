//@ts-check

/**
 * @typedef {Object} ThemeConfig
 * @property {string} primaryColor
 * @property {string} font
 * @property {string} logo
 * @property {string} mode
 */

/**
 * @typedef {Object} ControlsConfig
 * @property {string} text
 * @property {() => void} action
 */

/**
 * @typedef {Object} SlideConfig
 * @property {string} type
 * @property {string} title
 * @property {string} description
 * @property {string} [background]
 * @property {string} [src]
 * @property {string} [alt]
 * @property {string} [poster]
 * @property {boolean} [muted]
 * @property {boolean} [loop]
 */

/**
 * @typedef {Object} CarouselConfig
 * @property {boolean} loop
 * @property {number} interval
 * @property {SlideConfig[]} slides
 */

/**
 * @typedef {Object} BotMessageTemplate
 * @property {string} tier
 * @property {string} text
 */

/**
 * @typedef {Object} BotMessagesConfig
 * @property {Object.<string, BotMessageTemplate>} templates
 */

/**
 * @typedef {Object} ComponentConfig
 * @property {ThemeConfig} theme
 * @property {ControlsConfig} controls
 * @property {CarouselConfig} carousel
 * @property {BotMessagesConfig} botMessages
 */

export class VECarouselWaitroom extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    /** @type {number} */
    this.currentSlideIndex = 0;

    /** @type {boolean} */
    this.isPlaying = true;

    /** @type {NodeJS.Timeout | null} */
    this.intervalId = null;

    /** @type {boolean} */
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /** @type {IntersectionObserver | null} */
    this.intersectionObserver = null;

    /** @type {IntersectionObserver | null} */
    this.mediaObserver = null;
  }

  async init() {
    try {
      await this.loadConfig();
      await this.loadStyles();
      this.render();
      this.setupEventListeners();
      this.startCarousel();
      this.setupAccessibility();

      // Emit ready event
      this.dispatchEvent(
        new CustomEvent("waitroom:ready", {
          detail: { component: this },
        })
      );
    } catch (error) {
      console.error("Initialization failed:", error);
      this.dispatchEvent(
        new CustomEvent("waitroom:configError", {
          detail: {
            message: `Failed to initialize carousel: ${error.message}`,
          },
        })
      );
    }
  }

  async loadStyles() {
    if (!this.shadowRoot) return;
    try {
      const response = await fetch("../css/carousel.css");
      const cssText = await response.text();

      const styleSheet = new CSSStyleSheet();
      styleSheet.replaceSync(cssText);

      this.shadowRoot.adoptedStyleSheets = [styleSheet];
    } catch (error) {
      console.error("Failed to load styles:", error);
    }
  }

  async loadConfig() {
    const configSrc = this.getAttribute("config-src");
    if (!configSrc) return;

    try {
      const response = await fetch(configSrc);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log("Loading config from:", configSrc);
      this.config = await response.json();
    } catch (error) {
      console.warn("Failed to load config, using defaults:", error);
      throw new Error(
        "Failed to load configuration. Please ensure the config-src attribute is set correctly."
      );
    }
  }

  render() {
    const template = `
              <div class="waitroom-container">
                  <div class="carousel-wrapper">
                      ${this.config.carousel.slides
                        .map((slide, index) => this.renderSlide(slide, index))
                        .join("")}
                  </div>
                  
                  <button class="cancel-button" 
                          aria-label="Cancel appointment"
                          type="button"
                          id="cancel-button-loading">
                      <svg class="cancel-icon" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                  </button>
                  
                  <div class="bot-message-overlay" role="alert" aria-live="polite" aria-atomic="true">
                      <p class="bot-message-text"></p>
                  </div>
              </div>
          `;

    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = template;

      // Set up lazy loading for images and videos
      this.setupLazyLoading();
    }
  }

  /**
   * @param {SlideConfig} slide
   * @param {number} index
   * @returns {string}
   */
  renderSlide(slide, index) {
    const isActive = index === 0;
    const baseClasses = `slide ${isActive ? "active" : ""} ${
      this.reducedMotion ? "reduced-motion" : ""
    }`;

    switch (slide.type) {
      case "image":
        return `
                      <div class="${baseClasses} media-slide"
                           role="img"
                           aria-label="${
                             slide.title || slide.alt || "Slide image"
                           }">
                          <div class="loading-placeholder" data-slide-index="${index}">
                              <div class="loading-spinner-media"></div>
                          </div>
                          <img class="slide-image" 
                               data-src="${slide.src || ""}" 
                               alt="${
                                 slide.alt || slide.title || "Slide image"
                               }"
                               style="display: none;">
                          <div class="slide-content">
                              ${
                                slide.title
                                  ? `<h2 class="slide-title">${slide.title}</h2>`
                                  : ""
                              }
                              ${
                                slide.description
                                  ? `<p class="slide-description">${slide.description}</p>`
                                  : ""
                              }
                          </div>
                      </div>
                  `;

      case "video":
        return `
                      <div class="${baseClasses} media-slide"
                           role="img"
                           style="background: ${
                             slide.background || this.config.theme.primaryColor
                           }"
                           aria-label="${slide.title || "Slide video"}">
                          <div class="loading-placeholder" data-slide-index="${index}">
                              <div class="loading-spinner-media"></div>
                          </div>
                          <video class="slide-video" 
                                 data-src="${slide.src || ""}"
                                 ${
                                   slide.poster
                                     ? `poster="${slide.poster}"`
                                     : ""
                                 }
                                 ${slide.muted ? "muted" : ""}
                                 ${slide.loop ? "loop" : ""}
                                 playsinline
                                 preload="metadata"
                                 style="display: none;">
                              Your browser does not support the video tag.
                          </video>
                          <div class="slide-content">
                              ${
                                slide.title
                                  ? `<h2 class="slide-title">${slide.title}</h2>`
                                  : ""
                              }
                              ${
                                slide.description
                                  ? `<p class="slide-description">${slide.description}</p>`
                                  : ""
                              }
                          </div>
                      </div>
                  `;

      default: // content type
        return `
                      <div class="${baseClasses}"
                           style="background: ${
                             slide.background || this.config.theme.primaryColor
                           }"
                           role="img"
                           aria-label="${slide.title}">
                          <div class="slide-content">
                              <h2 class="slide-title">${slide.title}</h2>
                              <p class="slide-description">${
                                slide.description
                              }</p>
                          </div>
                      </div>
                  `;
    }
  }

  setupLazyLoading() {
    // Load the first slide immediately
    this.loadSlideMedia(0);

    // Set up intersection observer for lazy loading
    if ("IntersectionObserver" in window && this.shadowRoot) {
      this.mediaObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const slideIndex = parseInt(
                /** @type {HTMLElement} */ (entry.target).dataset.slideIndex ||
                  "0"
              );
              this.loadSlideMedia(slideIndex);
            }
          });
        },
        { threshold: 0.1 }
      );

      // Observe loading placeholders
      const placeholders = this.shadowRoot.querySelectorAll(
        ".loading-placeholder"
      );
      placeholders.forEach((placeholder) => {
        this.mediaObserver?.observe(placeholder);
      });
    }
  }

  /**
   * @param {number} slideIndex
   */
  async loadSlideMedia(slideIndex) {
    const slide = this.config.carousel.slides[slideIndex];
    if (
      !slide ||
      (slide.type !== "image" && slide.type !== "video") ||
      !this.shadowRoot
    )
      return;

    const slideElement = this.shadowRoot.querySelectorAll(".slide")[slideIndex];
    if (!slideElement) return;

    const placeholder = slideElement.querySelector(".loading-placeholder");
    const mediaElement = slideElement.querySelector(
      slide.type === "image" ? ".slide-image" : ".slide-video"
    );

    if (
      !mediaElement ||
      (mediaElement instanceof HTMLImageElement && mediaElement.src) ||
      (mediaElement instanceof HTMLVideoElement && mediaElement.src)
    )
      return; // Already loaded

    try {
      if (slide.type === "image" && mediaElement instanceof HTMLImageElement) {
        await this.loadImage(mediaElement, slide);
      } else if (
        slide.type === "video" &&
        mediaElement instanceof HTMLVideoElement
      ) {
        await this.loadVideo(mediaElement, slide);
      }

      // Hide placeholder and show media
      if (placeholder instanceof HTMLElement) {
        placeholder.style.display = "none";
      }
      if (mediaElement instanceof HTMLElement) {
        mediaElement.style.display = "block";
      }
    } catch (error) {
      console.warn(`Failed to load ${slide.type}:`, error);
      this.handleMediaError(slideElement, slide, error);
    }
  }

  /**
   * @param {HTMLImageElement} imgElement
   * @param {SlideConfig} slide
   * @returns {Promise<void>}
   */
  loadImage(imgElement, slide) {
    return new Promise((resolve, reject) => {
      imgElement.onload = () => resolve();
      imgElement.onerror = () => reject(new Error("Image failed to load"));
      imgElement.src = slide.src || "";
    });
  }

  /**
   * @param {HTMLVideoElement} videoElement
   * @param {SlideConfig} slide
   * @returns {Promise<void>}
   */
  loadVideo(videoElement, slide) {
    return new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        // Auto-play if muted and loop is enabled
        if (slide.muted && slide.loop) {
          videoElement.play().catch(() => {
            // Autoplay failed, that's okay for videos
          });
        }
        resolve();
      };
      videoElement.onerror = () => reject(new Error("Video failed to load"));
      videoElement.src = slide.src || "";
    });
  }

  /**
   * @param {Element} slideElement
   * @param {SlideConfig} slide
   * @param {Error} error
   */
  handleMediaError(slideElement, slide, error) {
    const placeholder = slideElement.querySelector(".loading-placeholder");
    if (placeholder) {
      placeholder.innerHTML = `
              <div style="text-align: center; color: rgba(255,255,255,0.8);">
                  <p>Unable to load ${slide.type}</p>
                  <small>${slide.title || "Media content"}</small>
              </div>
          `;
    }
  }

  setupEventListeners() {
    if (!this.shadowRoot) return;

    const cancelButton = this.shadowRoot.querySelector(".cancel-button");
    if (cancelButton) {
      cancelButton.addEventListener("click", this.handleCancel.bind(this));
    }

    // Listen for external events
    window.addEventListener("botMessage", this.handleBotMessage.bind(this));
    window.addEventListener(
      "systemInterrupt",
      this.handleSystemInterrupt.bind(this)
    );

    // Touch events for mobile autoplay recovery
    this.shadowRoot.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this)
    );

    // Intersection Observer for performance
    this.setupIntersectionObserver();
  }

  setupAccessibility() {
    // Set ARIA attributes
    this.setAttribute("role", "region");
    this.setAttribute("aria-label", "Waitroom carousel");

    // Handle reduced motion preference changes
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaQuery.addEventListener("change", (e) => {
      this.reducedMotion = e.matches;
      this.updateReducedMotionState();
    });
  }

  updateReducedMotionState() {
    if (!this.shadowRoot) return;
    const slides = this.shadowRoot.querySelectorAll(".slide");
    slides.forEach((slide) => {
      slide.classList.toggle("reduced-motion", this.reducedMotion);
    });
  }

  setupIntersectionObserver() {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.startCarousel();
          } else {
            this.pauseCarousel();
          }
        });
      });

      observer.observe(this);
      this.intersectionObserver = observer;
    }
  }

  startCarousel() {
    if (!this.isPlaying || this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, this.config.carousel.interval);
  }

  pauseCarousel() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  nextSlide() {
    if (!this.shadowRoot) return;
    const slides = this.shadowRoot.querySelectorAll(".slide");
    if (slides.length === 0) return;

    slides[this.currentSlideIndex].classList.remove("active");

    // Pause current video if playing
    const currentVideo = slides[this.currentSlideIndex].querySelector("video");
    if (currentVideo instanceof HTMLVideoElement && !currentVideo.paused) {
      currentVideo.pause();
    }

    this.currentSlideIndex = (this.currentSlideIndex + 1) % slides.length;

    slides[this.currentSlideIndex].classList.add("active");

    // Load next slide media if not already loaded
    this.loadSlideMedia(this.currentSlideIndex);

    // Preload next slide
    const nextIndex = (this.currentSlideIndex + 1) % slides.length;
    this.loadSlideMedia(nextIndex);

    // Auto-play video if it's the new active slide
    const newVideo = slides[this.currentSlideIndex].querySelector("video");
    if (newVideo instanceof HTMLVideoElement && newVideo.src) {
      newVideo.play().catch(() => {
        // Autoplay failed, that's okay
      });
    }

    // Emit slide change event
    this.dispatchEvent(
      new CustomEvent("waitroom:slideChanged", {
        detail: {
          currentIndex: this.currentSlideIndex,
          slide: this.config.carousel.slides[this.currentSlideIndex],
        },
      })
    );
  }

  /**
   * @param {string} message
   * @param {string} tier
   * @param {number} duration
   */
  showBotMessage(message, tier = "low", duration = 5000) {
    if (!this.shadowRoot) return;
    const overlay = this.shadowRoot.querySelector(".bot-message-overlay");
    const textElement = overlay?.querySelector(".bot-message-text");

    if (!overlay || !textElement) return;

    // Reset classes
    overlay.className = "bot-message-overlay";
    overlay.classList.add(`tier-${tier}`);

    textElement.textContent = message;
    overlay.classList.add("visible");

    // Auto-hide after duration (except critical messages)
    if (tier !== "critical") {
      setTimeout(() => {
        overlay.classList.remove("visible");
      }, duration);
    }

    // Emit event
    this.dispatchEvent(
      new CustomEvent("waitroom:botMessage", {
        detail: { message, tier, duration },
      })
    );
  }

  handleCancel() {
    this.pauseCarousel();
    this.dispatchEvent(
      new CustomEvent("waitroom:userCancelled", {
        detail: { timestamp: Date.now() },
      })
    );
  }

  /**
   * @param {Event & { detail?: { message?: string; tier?: string; duration?: number } }} event
   */
  handleBotMessage(event) {
    const { message, tier = "low", duration = 5000 } = event.detail || {};
    if (message) {
      this.showBotMessage(message, tier, duration);
    }
  }

  /**
   * @param {Event & { detail?: { message?: string } }} event
   */
  handleSystemInterrupt(event) {
    this.pauseCarousel();
    const { message } = event.detail || {};
    this.showBotMessage(
      message || "System maintenance in progress. Please wait.",
      "critical"
    );
  }

  handleTouchStart() {
    if (!this.shadowRoot) return;
    // Attempt to re-enable autoplay for videos if blocked
    const videos = this.shadowRoot.querySelectorAll("video");
    videos.forEach((video) => {
      if (video instanceof HTMLVideoElement && video.paused && video.src) {
        video.play().catch(() => {
          // Autoplay still blocked, that's okay
        });
      }
    });
  }

  // Public API methods
  play() {
    this.isPlaying = true;
    this.startCarousel();
  }

  pause() {
    this.isPlaying = false;
    this.pauseCarousel();
  }

  /**
   * @param {number} index
   */
  goToSlide(index) {
    if (!this.shadowRoot) return;
    const slides = this.shadowRoot.querySelectorAll(".slide");
    if (index >= 0 && index < slides.length) {
      slides[this.currentSlideIndex].classList.remove("active");
      this.currentSlideIndex = index;
      slides[this.currentSlideIndex].classList.add("active");
    }
  }

  /**
   * @param {Partial<ComponentConfig>} newConfig
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.render();
    this.setupEventListeners();
  }

  // Cleanup
  disconnectedCallback() {
    this.pauseCarousel();
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.mediaObserver) {
      this.mediaObserver.disconnect();
    }

    // Pause all videos
    if (this.shadowRoot) {
      const videos = this.shadowRoot.querySelectorAll("video");
      videos.forEach((video) => {
        if (video instanceof HTMLVideoElement) {
          video.pause();
        }
      });
    }

    window.removeEventListener("botMessage", this.handleBotMessage);
    window.removeEventListener("systemInterrupt", this.handleSystemInterrupt);
  }
}

// Register the custom element
customElements.define("ve-carousel-waitroom", VECarouselWaitroom);
