class IframeManager {
  /**
     * Initializes the IframeManager.
     * @param {HTMLElement} container - The parent element to append iframe and loading HTML. Defaults to document.body.
     */
  constructor (container = document.body) {
    this.iframe = null;
    this.loaded = false;
    this.loadingElement = null;
    this.container = container; // The parent element to append iframe and loading HTML
  }

  /**
     * Sets the iframe element and initializes load handlers.
     * @param {HTMLIFrameElement} iframe - The iframe element to manage.
     * @param {Object} options - Configuration options.
     * @param {string} options.loadingHTML - Custom HTML for the loading indicator.
     */
  setIframe ({ iframe, iframeContainer }, options = {}) {
    if (!(iframe instanceof HTMLIFrameElement)) {
      throw new Error('Provided element is not an iframe.');
    }

    this.iframe = iframe;
    this.loaded = false;

    // Apply options
    const loadingHTML = options.loadingHTML || '<div>Loading...</div>';

    // Initially hide the iframe until it's loaded
    this.iframe.style.display = 'none';

    // Attach load and error handlers
    this.attachLoadHandlers(loadingHTML);
    this.container = iframeContainer;

    iframeContainer.querySelectorAll('iframe').forEach(e => e.remove());
    iframeContainer.appendChild(iframe);
  }

  /**
     * Attaches load and error event handlers to the iframe.
     * @param {string} loadingHTML - HTML string to display as the loading indicator.
     */
  attachLoadHandlers (loadingHTML) {
    if (!this.iframe) {
      throw new Error('Iframe element is null or undefined.');
    }

    this.iframe.onload = () => {
      this.loaded = true;
      console.log('Iframe loaded successfully.');
    };

    this.iframe.onerror = () => {
      this.loaded = false;
      console.error('Iframe failed to load.');
    };
  }

  /**
     * Checks if the iframe has fully loaded.
     * @returns {boolean} - True if loaded, false otherwise.
     */
  isIframeLoaded () {
    try {
      const iframeDoc = this.iframe?.contentWindow?.document;
      return iframeDoc && iframeDoc.readyState === 'complete';
    } catch (error) {
      // Catch cross-origin errors
      return false;
    }
  }

  /**
     * Waits for the iframe to load.
     * @returns {Promise<string>} - Resolves when loaded, rejects on error.
     */
  waitForIframeLoad () {
    if (!this.iframe) {
      return Promise.reject(new Error('Iframe is not set.'));
    }

    return new Promise((resolve, reject) => {
      this.iframe.onload = () => {
        this.loaded = true;
        resolve('Iframe loaded successfully.');
      };

      this.iframe.onerror = () => {
        this.loaded = false;
        reject(new Error('Iframe failed to load.'));
      };
    });
  }

  /**
     * Resets the iframe manager state.
     */
  reset () {
    this.iframe = null;
    this.loaded = false;
    this.removeLoading();
  }

  /**
     * Removes the iframe from the DOM and resets state.
     */
  close () {
    if (this.iframe) {
      this.iframe.remove();
    }
    this.iframe = null;
    this.loaded = false;
    this.removeLoading();
  }

  /**
     * Displays a loading HTML element.
     * @param {string} html - The HTML string to display as loading indicator.
     */
  showLoading (loadingElement) {
    if (!this.container) {
      console.warn('iframe is not in a container yet, loading is not added');
      return;
    }
    if (this.loadingElement) {
      this.removeLoading(); // Remove existing loading element if any
    }

    this.loadingElement = loadingElement;

    // Append the loading element to the container
    this.container.appendChild(this.loadingElement);
  }

  /**
     * Removes the loading HTML element from the DOM.
     */
  removeLoading () {
    if (this.loadingElement) {
      this.loadingElement.remove();
      this.loadingElement = null;
    }
    if (this.iframe) {
      this.iframe.style.display = 'block';
    }
  }
}
