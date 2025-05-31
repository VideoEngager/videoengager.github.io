Okay, this provides a clear path forward.

## GAP Analysis: Refactoring `ve-carousel-waitroom`

This analysis compares the **Goal** (hardened, clinical/healthcare-ready, mobile-optimized `ve-carousel-waitroom` web component) and the **Target POC** (clinical carousel `index2.html`) against the **Baseline** (`kiosk.js` with Bootstrap carousel) and the **Failed Sprint Artifact** (`ve-carousel-waitroom.js` from previous efforts). The **Theming Guide** and **Production Logger** files serve as additional target specifications.

**1. Core Component Implementation (Existence, Type, Stability):**
    * **Goal:** A stable, standalone `ve-carousel-waitroom` custom web component, suitable for clinical/healthcare use, optimized for mobile/tablet.
    * **Target POC:** Demonstrates a self-contained web component structure with desired features.
    * **Baseline:** No `ve-carousel-waitroom` component exists; uses Bootstrap carousel manipulated by `kiosk.js`.
    * **Failed Sprint Artifact:** An unstable attempt to create `ve-carousel-waitroom` by wrapping an `AdvancedSlideshow` class. Suffered from registration errors, incorrect JS usage, and did not fully encapsulate logic as a robust web component.
    * **GAP:**
        * **Critical:** Need to develop a new, stable `ve-carousel-waitroom` web component from scratch, drawing inspiration and proven concepts from the Target POC. The failed sprint artifact's `AdvancedSlideshow` logic might offer some utility methods if carefully vetted, but the wrapper approach (`VECarouselWaitroom` class in the artifact) was problematic.
        * The new component must be designed with Shadow DOM for style encapsulation and a clean public API.
        * Must be built with principles of robustness and error resilience suitable for healthcare.

**2. Functionality (Clinical Features, Mobile Optimization):**
    * **Goal:** Implement features demonstrated in the Target POC (diverse slide types, lazy loading, bot messages, cancel button) and ensure they are "hardened" and mobile/tablet optimized.
    * **Target POC:** Successfully showcases image, video, and content slides, a cancel button, tiered bot messages, and responsive styling considerations.
    * **Baseline:** Bootstrap carousel primarily handled basic image slides via `kiosk.js` DOM manipulation. Lacked advanced media, bot messages, or specific clinical interaction patterns.
    * **Failed Sprint Artifact:** `AdvancedSlideshow` had placeholders or very basic implementations for some slide types (HTML, text, some media) but lacked the specific clinical UI/UX features (e.g., tiered bot messages, dedicated cancel button styling/placement as in POC). Mobile optimization was not a primary focus.
    * **GAP:**
        * **High:** Re-implement all core functionalities seen in the Target POC within the new web component:
            * Slide rendering engine for content, image, and video types.
            * Robust lazy loading for media.
            * The cancel button (visuals, placement, eventing).
            * The bot message system (API, tiered display).
            * Autoplay, looping, and slide transitions (optimizing for performance, especially on mobile/tablet, and respecting `prefers-reduced-motion`).
        * **High:** Explicitly design and test for mobile/tablet usability (touch interactions, performance on constrained devices, responsive layouts).

**3. Theming:**
    * **Goal:** Adhere strictly to the `themeguide.md`, implementing theming via a `ThemeSettingsV1` JavaScript object that maps to CSS Custom Properties for extensive customization.
    * **Target POC:** Uses inline CSS within its `<style>` tag and hardcoded theme values within its JavaScript `config`; not aligned with `themeguide.md`.
    * **Baseline:** Theming of Bootstrap carousel was via standard CSS overrides in `styles.css`. No JS-based theming API.
    * **Failed Sprint Artifact:** `AdvancedSlideshow` used a simple, flat theme object and an ad-hoc method to create CSS variables. The `VECarouselWaitroom` wrapper attempted some inline style mapping based on a different theme structure. Neither aligned with `themeguide.md`.
    * **GAP:**
        * **Critical:** Implement the complete theming system as specified in `themeguide.md`:
            * The component must accept a `config.theme` object conforming to `ThemeSettingsV1`.
            * Internally, it must map these `ThemeSettingsV1` properties to the defined CSS Custom Properties (e.g., `--ve-cw-component-background`).
            * All internal styling (within Shadow DOM) must use these CSS Custom Properties.
            * Implement runtime theme change detection and application.
            * Provide validation for theme values with fallbacks and console warnings for invalid inputs.

**4. Logger Integration:**
    * **Goal:** The new `ve-carousel-waitroom` component must accept and use a production-level logger instance (conforming to `ILogger` from the provided logger files) injected by `KioskApplication`.
    * **Target POC:** Uses `console.log` directly.
    * **Baseline:** `kiosk.js` uses its own `log()` method which wraps `console.log`.
    * **Failed Sprint Artifact:** `VECarouselWaitroom` and `AdvancedSlideshow` instantiated their own basic `ConsoleLogger` and did not use/accept the production logger system.
    * **GAP:**
        * **Critical:** The new `ve-carousel-waitroom` component must be designed with a mechanism (e.g., a public property `logger`) to receive an `ILogger` instance.
        * Internally, all component logging must use this injected logger. If no logger is provided, it can default to a basic `ConsoleLogger` (ideally the one from your logger framework) for standalone development, clearly warning that a production logger was not injected.

**5. Integration with `KioskApplication`:**
    * **Goal:** `kiosk.js` must seamlessly replace its Bootstrap carousel logic with the instantiation, configuration (including theme and accessibility settings as per JSDoc types and `themeguide.md`), and control of the new `ve-carousel-waitroom` component.
    * **Target POC:** N/A (it's a standalone component).
    * **Baseline:** `kiosk.js` contains methods `setupCarousel` and `resetCarouselToFirstItem` for direct DOM manipulation of a Bootstrap carousel.
    * **Failed Sprint Artifact:** `kiosk.js` (the version from the latest upload including JSDoc types for the carousel) was modified to *attempt* to create `ve-carousel-waitroom` via `document.createElement` and configure it using `_buildKioskCarouselConfig`. This integration failed due to issues within `ve-carousel-waitroom.js`.
    * **GAP:**
        * **High:** Refactor `kiosk.js` to:
            * Remove all direct DOM manipulation related to the Bootstrap carousel.
            * In `_setupWaitroomCarousel`, correctly instantiate `ve-carousel-waitroom`.
            * Inject `KioskApplication`'s production logger into the component instance.
            * Utilize the `_buildKioskCarouselConfig` method to prepare the full configuration object (slides, loop, interval, `ThemeSettingsV1`, `AccessibilitySettings`) and pass it to the component's `config` property.
            * Ensure methods like `freeze`, `thaw`, and event handling for `cancel`/`error` events from the component are correctly implemented in `kiosk.js`.

**6. Accessibility & Hardening:**
    * **Goal:** Component must be accessible (WCAG AA where applicable) and hardened for clinical use.
    * **Target POC:** Includes some ARIA attributes and `prefers-reduced-motion` handling.
    * **Baseline:** Standard Bootstrap accessibility, no specific clinical hardening.
    * **Failed Sprint Artifact:** Basic functionality, minimal specific accessibility or hardening features were implemented or tested.
    * **GAP:**
        * **High:** Systematically implement and test accessibility features: keyboard navigation for slides and controls, ARIA attributes for all interactive elements and regions, clear focus indicators (themed via `accentColor`), and screen reader compatibility for announcements (slide changes, bot messages). This should align with `AccessibilitySettings` defined in `kiosk.js` JSDoc types.
        * **High:** Address clinical hardening: ensure stability, clear error states, resistance to unexpected input, and suitability for continuous operation.

---

## Action Plan for `ve-carousel-waitroom` Refactoring

This plan prioritizes building a stable, well-defined component foundation, then layering features and integrating it.

**Phase 1: Component Scaffolding & Core Functionality (Target: ~5-7 days)**
    * **Objective:** Create a stable, minimal `ve-carousel-waitroom` web component that can render basic slides and accept a logger.
    * **Tasks:**
        1.  **1.1: Define `VECarouselWaitroom` Class Shell:**
            * Create `js/ve-carousel-waitroom.js`.
            * Implement the class extending `HTMLElement` with Shadow DOM.
            * Basic lifecycle callbacks (`constructor`, `connectedCallback`, `disconnectedCallback`).
            * Implement logger injection property (e.g., `set logger(newLogger)`), defaulting to `ConsoleLogger` from the production logger files if none is provided. All internal logging must use the active logger.
            * Implement `version` getter (e.g., "1.0.0").
            * Basic `config` property setter that logs received config for now.
        2.  **1.2: Basic Slide Rendering:**
            * Implement logic to render simple "content" type slides (title, description) based on a minimal `config.slides` array.
            * Basic opacity transition between slides.
            * Implement `autoplay`, `interval`, and `loop` logic from `config.carousel`.
        3.  **1.3: Standalone Test Page:**
            * Create a simple `test-carousel.html` to load and instantiate `ve-carousel-waitroom.js` as a module.
            * Use this page for iterative development and testing of the component in isolation.
        4.  **1.4: Initial `KioskApplication` Integration (Logger & Basic Config):**
            * In `kiosk.js`, instantiate the production logger (e.g., `ConsoleLogger` from your logger files, configured with component name "KioskApp"). Modify `KioskApplication.log()` to use this instance.
            * In `_setupWaitroomCarousel`, create `ve-carousel-waitroom`, inject `KioskApplication`'s logger.
            * Modify `_buildKioskCarouselConfig` to create a minimal slide array (content slides).
            * In `showScreen('loading')`, pass this minimal config to `this.carousel.config`.
            * Verify basic rendering and logging from both KioskApp and the component.

**Phase 2: Implementing POC Features & Theming (Target: ~7-10 days)**
    * **Objective:** Achieve functional parity with the Target POC and implement the full theming system.
    * **Tasks:**
        1.  **2.1: Implement Full Slide Type Rendering:**
            * Add support for "image" and "video" slide types, including lazy loading and media error placeholders as seen in POC.
            * Implement `poster`, `muted`, `videoLoop` attributes for videos.
        2.  **2.2: Implement Theming System (`themeguide.md`):**
            * Process the `config.theme` object (conforming to `ThemeSettingsV1`).
            * Generate and apply all specified CSS Custom Properties to the component's host.
            * Style all internal Shadow DOM elements using these CSS Custom Properties.
            * Implement runtime theme change detection and re-application.
            * Implement validation of theme values, with console warnings and fallbacks for invalid inputs.
            * Test with "good" and "bad" theme examples.
        3.  **2.3: Implement Cancel Button:**
            * Render the cancel button as styled in the POC (position, appearance).
            * Dispatch a `userCancelled` custom event upon interaction.
            * Ensure it's keyboard accessible.
        4.  **2.4: Implement Bot Message System:**
            * Implement the public method `showBotMessage(message, options)` (where options include `tier`, `duration`).
            * Style different tiers (`low`, `high`, `critical`) as per POC and configurable via `ThemeSettingsV1`.
            * Handle message display and auto-dismissal.
        5.  **2.5: Implement Public API Methods & Events:**
            * Implement `freeze()`, `thaw()`, `play()`, `pause()`, `goToSlide(index)`.
            * Dispatch `slideChanged`, `error`, and other relevant custom events.
        6.  **2.6: Update `KioskApplication` Integration:**
            * In `kiosk.js`, ensure `_buildKioskCarouselConfig` creates the full `CarouselConfig` including detailed slide data (all types), `ThemeSettingsV1` object, and `AccessibilitySettings` object.
            * Wire up `handleCarouselCancelEvent` and `handleCarouselErrorEvent` to the component's events.
            * Implement calls to `this.carousel.freeze()` and `this.carousel.thaw()` in `showScreen()` as appropriate.

**Phase 3: Hardening, Accessibility, Optimization & Final Testing (Target: ~5-7 days)**
    * **Objective:** Ensure the component is robust, accessible, performs well on target devices, and meets all clinical/healthcare requirements.
    * **Tasks:**
        1.  **3.1: Comprehensive Accessibility Implementation:**
            * Full keyboard navigation for slides (if not just for controls).
            * ARIA attributes for all elements (carousel region, slides, controls, live regions for announcements).
            * Test with screen readers (NVDA, VoiceOver).
            * Ensure `prefers-reduced-motion` is respected for all animations.
            * Verify compliance with `AccessibilitySettings` from the config.
            * Rigorously test color contrast for default and example themes against `themeguide.md` requirements.
        2.  **3.2: Performance Optimization & Mobile/Tablet Testing:**
            * Profile component performance on target mobile/tablet devices or emulators (load times, animations, memory usage).
            * Optimize JavaScript, CSS, and rendering paths.
            * Test touch interactions extensively.
        3.  **3.3: Error Handling & Resilience:**
            * Test behavior with invalid or missing slide data, media errors, and unexpected API usage.
            * Ensure graceful degradation and clear error states within the component.
        4.  **3.4: Final Integration Testing within `KioskApplication`:**
            * Test all screen transitions, call flows, and error scenarios in `kiosk.js` that involve the carousel.
            * Verify logger output and correlation IDs.
        5.  **3.5: Documentation Review:**
            * Ensure internal code comments are thorough.
            * Review and finalize any developer/integration documentation for the `ve-carousel-waitroom` component, ensuring it aligns with `themeguide.md`.

**Timeline & Review:**
* **Total Estimated Duration:** ~17-24 development days.
* **Checkpoints:** Daily progress updates. Review at the end of each Phase with a demonstration of achieved functionality.
* **Contingency:** Build in 15-20% buffer for unforeseen issues.

This action plan provides a structured approach to achieve the refactoring goals. It prioritizes foundational stability and then iteratively builds features, ensuring continuous testing and alignment with the defined targets.