window.__VideoEngagerConfigs = {
  videoEngager: {
    tenantId: '0FphTk091nt7G1W7', // Provided by VideoEngager Settings Page
    veEnv: 'videome.leadsecure.com', // e.g., 'videome.leadsecure.com'
    isPopup: false, // true for popup video, false for inline
    customAttributes: {
      'context.firstname': 'Duty Free',
      'context.lastname': 'Visitor',
      subject: 'Duty Free Demo'
    },
    debug: true, // Enable debug mode for VideoEngager
    firstMessage: '**This is a VideoEngager Video Call!!!**'
  },
  genesys: {
  debug: true, // Enable debug mode for VideoEngager
    deploymentId: 'c5d801ae-639d-4e5e-a52f-4963342fa0dc', // Genesys Cloud deployment ID
    domain: 'mypurecloud.com' // e.g., 'mypurecloud.com', 'usw2.pure.cloud'
  },
  logger: true, // Enable logging for debugging
  useGenesysMessengerChat: false // Set to true to enable Genesys chat functions
};

/**
 * @description
 *  Carousel items for the carousel component while the page is in loading state
 */
window.CAROUSEL_ITEMS = [
  { src: 'img/roocop.webp' },
  { src: 'img/warm.webp' },
  { src: 'img/carribeanbateries.webp' },
  {
    src:
      'https://www.videoengager.com/wp-content/uploads/2020/05/image-for-slider-1-768x392.jpg'
  }
];
/**
 *  @description
 * Background image for the page while the page is in Initial State
 */
window.BACKGROUND_IMAGE = 'img/carribeanbateries.webp';
