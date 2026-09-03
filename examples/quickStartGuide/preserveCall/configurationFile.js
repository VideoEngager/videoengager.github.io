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
    theme: 'light', // dark
    preload: [
      'sidebar'
    ]
  },
  videoengager: {
    // dialCountryCode: '+1',
    /**
     *callHolder: Defines a place/ html div element/ where the VideoEngager widget should be inserted within the html document.
     * Otherwise, popup window will be opened.
     * In case callHolder points to non-existing dom element, popup windows will be opened.
    */
    // callHolder: 'someiframe',
    /**
     * Possible values:“engage” or “purecloud”. Defines the Genesys backend platform
     */
    platform: 'purecloud',
    tenantId: 'test_tenant',
    veUrl: 'https://dev.videoengager.com',
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
    useWebChatForm: true,
    /**
   If set, a second message to the agent will be sent with its content.
   This message is informative and is used for easier SmartVideo interaction recognition by agent. For example: “This is a SmartVideo Video Call”.
     */
    extraAgentMessage: '**This is a SmartVideo Video Call**',
    webChatFormData: {
      nickname: 'Anonymous',
      firstname: 'Anonymous',
      lastname: 'Customer',
      subject: 'Video Call',
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
      dataURL: 'https://api.mypurecloud.com.au',
      deploymentKey: '1cd594f7-654d-4cb2-9578-c57c25fc05dd',
      orgGuid: '327d10eb-0826-42cd-89b1-353ec67d33f8',
      markdown: true,
      interactionData: {
        routing: {
          targetType: 'QUEUE',
          targetAddress: 'video', // change this field
          priority: 2
        }
      }
    }
  },
  extensions: {
    VideoEngager: window.videoEngager.initExtension
  },
  sidebar: {
    showOnStartup: true,
    position: 'right',
    expandOnHover: true,
    channels: [
      {
        clickCommand: 'VideoEngager.startVideoEngager',
        readyEvent: 'VideoEngager.ready',
        displayName: 'Video Chat',
        i18n: 'VideoTitle',
        icon: 'videochat'
      },{
        enable: true,
        clickCommand: 'WebChat.open',
        readyEvent: 'WebChat.ready',
        displayName: 'Web Chat',
        i10n: 'ChatTitle',
        icon: 'chat'
      },
    ]
  }
};
