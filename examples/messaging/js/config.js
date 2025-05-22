// src/config.js

/**
 * @typedef {Object} VideoEngagerConfigOptions
 * @property {string} tenantId - Your VideoEngager Tenant ID.
 * @property {string} veEnv - The VideoEngager environment URL (e.g., 'videome.leadsecure.com').
 * @property {boolean} [isPopup=false] - Determines if the video call should open in a popup or be inline.
 */

/**
 * @typedef {Object} GenesysConfigOptions
 * @property {string} deploymentId - Your Genesys Cloud Widget Deployment ID.
 * @property {string} domain - Your Genesys Cloud region domain (e.g., 'mypurecloud.com', 'usw2.pure.cloud').
 */

/**
 * @typedef {Object} TestConfig
 * @property {VideoEngagerConfigOptions} videoEngager - Configuration specific to VideoEngager services.
 * @property {GenesysConfigOptions} genesys - Configuration specific to Genesys Cloud integration.
 * @property {boolean} useGenesysMessengerChat - Set to true to enable Genesys Messenger for chat and related SDK methods.
 */

/**
 * A known-good base configuration for the demo.
 * **Important:** Replace placeholder values (like 'YOUR_TENANT_ID') with your actual configuration details.
 * @type {TestConfig}
 */
export const testConfig = {
  videoEngager: {
    tenantId: '0FphTk091nt7G1W7', // Provided by VideoEngager
    veEnv: 'videome.leadsecure.com', // e.g., 'videome.leadsecure.com'
    isPopup: false, // true for popup video, false for inline
    customAttributes: {}, // (Optional) Custom attributes to send to VideoEngager
    // after setting configs, customAttributes can change by calling method setCustomAttributes
    firstMessage: 'Hello, how can I help you today?', // (Optional) Initial message for the chat
    // after setting configs, firstMessage can change by calling method setFirstMessage
    attributeChangeMessage: 'Attribute changed', // (Optional) Message to send when videoEngager attempt to change attributes
    // after setting configs, attributeChangeMessage can change by calling method setAttributeChangeMessage
    callStartedMessage: 'Call started', // (Optional) Message to send when call is started (will fallback to attributeChangeMessage)
    // after setting configs, callStartedMessage can change by calling method setCallStartedMessage
    callEndedMessage: 'Call ended' // (Optional) Message to send when call is ended (will fallback to attributeChangeMessage)
    // after setting configs, callEndedMessage can change by calling method setCallEndedMessage
  },
  genesys: {
    deploymentId: 'c5d801ae-639d-4e5e-a52f-4963342fa0dc', // Genesys Cloud deployment ID
    domain: 'mypurecloud.com' // e.g., 'mypurecloud.com', 'usw2.pure.cloud'
  },
  useGenesysMessengerChat: true // Set to true to enable Genesys chat functions
};
