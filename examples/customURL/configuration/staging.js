/**
 * for Genesys reference: https://help.mypurecloud.com/articles/genesys-cloud-web-chat-widget/
 * To Getting Fields from Genesys reference: https://help.videoengager.com/hc/en-us/articles/360061175891-How-to-obtain-my-Genesys-Cloud-Parameters-required-to-setup-SmartVideo-SDKs
 * for full reference about Genesys Integration with Smartvideo SDK: https://help.videoengager.com/hc/en-us/articles/360049826571-VideoEngager-for-Genesys-Widgets-Developer-Guide
*/

if (!window._genesys) { window._genesys = {}; }

if (!window._gt) { window._gt = []; }

window._genesys.widgets = {
  main: {
    downloadGoogleFont: false,
    debug: true,
    theme: 'light'
  },
  videoengager: {
    // dialCountryCode: '+1',
    /**
     *callHolder: Defines a place/ html div element/ where the VideoEngager widget should be inserted within the html document.
     * Otherwise, popup window will be opened.
     * In case callHolder points to non-existing dom element, popup windows will be opened.
    */
    callHolder: 'iframe-smart-video',
    /**
     * Possible values:“engage” or “purecloud”. Defines the Genesys backend platform
     */
    platform: 'purecloud',
    tenantId: 'oIiTR2XQIkb7p0ub',
    veUrl: 'https://staging.leadsecure.com',
    /**
    * autoAccept: Defines the behavior during the call negotiation - whether or not to automatically enters the call.
   */
    // autoAccept: true,
    /**
     *  audioOnly: Start the VideoEngager call with audio only (without video)
     *  Uncomment the flag below to start the VideoEngager call with audio only (without video)
    */
    // audioOnly: true,
    /**
     *  enablePreCall: Override the default tenant’s settings for visitor precall window.
     *  If provided, this property will override the tenant’s visitor precall setting.
     *  If it is not provided, the tenant’s setting will be used.
     */
    // enablePreCall: false,
    useWebChatForm: false,
    /**
   If set, a second message to the agent will be sent with its content.
   This message is informative and is used for easier SmartVideo interaction recognition by agent. For example: “This is a SmartVideo Video Call”.
     */
    extraAgentMessage: '**This is a SmartVideo Video Call**',
    webChatFormData: {
      userData: {}
    },
    i18n: {
      en: {
        ChatFormSubmitVideo: 'Start Video',
        WebChatTitleVideo: 'Video Chat'
      }
    }
  },
  webchat: {
    transport: {
      type: 'purecloud-v2-sockets',
      dataURL: 'https://api.mypurecloud.de',
      deploymentKey: '1b4b1124-b51c-4c38-899f-3a90066c76cf',
      orgGuid: '639292ca-14a2-400b-8670-1f545d8aa860',
      markdown: true,
      interactionData: {
        routing: {
          targetType: 'QUEUE',
          targetAddress: 'Support', // change this field
          priority: 2
        }
      }
    }
  },
  extensions: {
    VideoEngager: window.videoEngager.initExtension
  }
};
