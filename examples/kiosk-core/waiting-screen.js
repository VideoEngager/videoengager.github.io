// Presentation only: the app owns call events and the wait timeout.
window.createKioskWaitingScreen = function (element, enabled) {
  const carousel = element.querySelector('[data-waiting-carousel]');
  const slides = [...element.querySelectorAll('[data-waiting-slide]')];
  const toggle = element.querySelector('[data-waiting-toggle]');
  const position = element.querySelector('[data-waiting-position]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let paused = false;
  let timer;
  element.classList.toggle('waiting-disabled', !enabled);

  function setSlide(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    position.textContent = `${index + 1} / ${slides.length}`;
  }

  function updateRotation() {
    clearTimeout(timer);
    timer = null;
    toggle.textContent = paused ? 'Play tips' : 'Pause tips';
    toggle.hidden = motion.matches;
    if (enabled && !element.hidden && !carousel.hidden && !paused && !motion.matches) {
      timer = setTimeout(() => {
        setSlide(index + 1);
        updateRotation();
      }, 8000);
    }
  }

  function step(direction) {
    paused = true;
    setSlide(index + direction);
    updateRotation();
  }

  element.querySelector('[data-waiting-previous]').addEventListener('click', () => step(-1));
  element.querySelector('[data-waiting-next]').addEventListener('click', () => step(1));
  toggle.addEventListener('click', () => {
    paused = !paused;
    updateRotation();
  });
  carousel.addEventListener('focusin', event => {
    // Keyboard focus pauses tips; pointer focus must not invert the toggle's click.
    if (event.target === toggle && !toggle.matches(':focus-visible')) return;
    paused = true;
    updateRotation();
  });
  motion.addEventListener('change', updateRotation);

  return {
    show(message, showTips = true) {
      const wasShowingCarousel = !element.hidden && !carousel.hidden;
      element.querySelector('[data-waiting-message]').textContent = message;
      element.classList.toggle('waiting-status-only', !showTips);
      carousel.hidden = !enabled || !showTips;
      element.hidden = false;
      // Status updates must not restart the timer or the visitor's chosen slide.
      if (!wasShowingCarousel || carousel.hidden) updateRotation();
    },
    hide(reset = true) {
      element.hidden = true;
      if (reset) {
        paused = false;
        setSlide(0);
      }
      updateRotation();
    },
    setCompact(visible) { element.classList.toggle('waiting-compact', visible); }
  };
};
