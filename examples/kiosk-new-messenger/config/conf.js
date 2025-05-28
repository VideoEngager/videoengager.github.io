window.WIDGET_CONFIG = {
  en: {
    videoEngager: {
      tenantId: "test_tenant", // Required
      veEnv: "dev.videoengager.com", // Required: e.g., 'videome.leadsecure.com'
      veHttps: true, // Optional: Default is true
      isPopup: false, // Optional: Default is false
    },
    genesys: {
      deploymentId: "0928a947-d4bd-4524-9fc3-d98cb7938a83", // Required
      // Provide either environment or domain
      domain: 'mypurecloud.com.au', // e.g., 'mypurecloud.com', 'mypurecloud.ie'
      hideGenesysLauncher: false, // Optional: Default is false
    },
    useGenesysMessengerChat: false, // Required if using startGenesysChat/endGenesysChat methods
  },
  de: {
    language: "Deutchland", // set language skill if needed
    // skills: ['Test','Support','Test123'] // set skills if needed
  },
  ar: {
    language: "Arabic", // set language skill if needed
    // skills: ['Test','Support','Test123'] // set skills if needed
  },
};

/**
 * @description
 *  Carousel items for the carousel component while the page is in loading state
 */
window.CAROUSEL_ITEMS = [
  { src: "img/slide-1.avif" },
  { src: "img/slide-2.avif" },
  { src: "img/slide-3.avif" },
  {
    src: "https://www.videoengager.com/wp-content/uploads/2020/05/image-for-slider-1-768x392.jpg",
  },
];
/**
 *  @description
 * Background image for the page while the page is in Initial State
 */
window.BACKGROUND_IMAGE = "img/carribeanbateries.webp";
(function (g, s, c, d, q) {
  // g: window, s: scriptUrl, c: configs, d: scriptElement, q: queue
  q = [];
  g.__VideoEngagerQueue = q;
  g.__VideoEngagerConfigs = c; // The configuration object 'c' is assigned here
  g.VideoEngager = new Proxy(
    {},
    {
      get:
        (_, m) =>
        (...a) =>
          new Promise((r, rj) => q.push({ m, a, r, rj })),
    }
  );
  d = document.createElement("script");
  d.async = 1;
  d.src = s; // The script URL 's' (CDN link) is assigned here
  d.charset = "utf-8";
  document.head.appendChild(d);
})(
  window,
  "https://cdn.videoengager.com/widget/latest/browser/genesys-hub.umd.js",
  {
    videoEngager: {
      tenantId: "test_tenant",
      veEnv: "dev.videoengager.com",
      // firstMessage: 'Welcome to my videoengager service!',
      isPopup: false,
    },
    genesys: {
      deploymentId: "786dbf11-0f83-4948-95a9-35e1d5a4b4b8",
      domain: "mypurecloud.com.au",
    },
    useGenesysMessengerChat: false,
  }
);
