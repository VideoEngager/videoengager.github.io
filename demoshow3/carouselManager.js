class CarouselManager {
  constructor (containerSelector, items, interval = 5000, showCloseButton = false) {
    this.containerSelector = containerSelector;
    this.carouselItems = items;
    this.interval = interval;
    this.carouselId = 'dynamic-carousel';
    this.showCloseButton = showCloseButton;
  }

  createCarousel () {
    const container = document.querySelector(this.containerSelector);

    if (!container) {
      console.error('Container not found');
      return;
    }

    if (document.getElementById(this.carouselId)) {
      console.warn('Carousel already exists.');
      return;
    }

    const carouselContainer = document.createElement('div');
    carouselContainer.id = this.carouselId;
    carouselContainer.style.position = 'absolute';
    carouselContainer.style.top = '0';
    carouselContainer.style.left = '0';
    carouselContainer.style.width = '100%';
    carouselContainer.style.height = '100%';
    carouselContainer.style.zIndex = '1000';

    const closeButtonVisibility = this.showCloseButton ? 'visible' : 'hidden';

    // Insert predefined HTML for the carousel, including images
    carouselContainer.innerHTML = `
        <button id="cancel-button-loading" style="position: absolute; bottom: 20px; right: 20px; z-index: 1001; visibility: ${closeButtonVisibility};">
          <svg focusable="false" viewBox="0 0 24 24" style="width: 50px; height: 50px; fill: white;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
          </svg>
        </button>
        <div id="${this.carouselId}-inner" class="carousel slide" data-interval="${this.interval}" data-wrap="true" data-pause="false" data-ride="carousel">
          <div class="carousel-inner" id="carousel-inner">
            ${this.generateSlides()} <!-- Predefined slides HTML -->
          </div>
        </div>
      `;

    container.style.position = 'relative';
    container.appendChild(carouselContainer);

    // Initialize carousel if jQuery is available
    if (typeof jQuery !== 'undefined') {
      jQuery(`#${this.carouselId}-inner`).carousel({
        interval: this.interval
      });
    }

    // Add the close button functionality
    document.getElementById('cancel-button-loading').addEventListener('click', () => this.removeCarousel());
  }

  // Generate the slides from the predefined array of items
  generateSlides () {
    return this.carouselItems.map((item, index) => {
      const isActive = index === 0 ? 'active' : '';
      return `
          <div class="carousel-item ${isActive}">
            ${item} <!-- HTML for each slide passed in the constructor -->
          </div>
        `;
    }).join('');
  }

  removeCarousel () {
    const container = document.querySelector(this.containerSelector);
    const carouselContainer = document.getElementById(this.carouselId);
    if (carouselContainer) {
      container.removeChild(carouselContainer);
    }
  }
}
