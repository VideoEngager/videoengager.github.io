if (!window._genesys) window._genesys = {};
if (!window._gt) window._gt = [];
window._genesys.widgets = {
  main: {
    downloadGoogleFont: false,
    debug: true,
    theme: 'dark',
    lang: 'en',
    i18n: 'https://apps.mypurecloud.de/widgets/9.0/i18n/widgets-en.i18n.json',
    preload: [
      'webchatservice'
    ]
  },
  videoengager: {
    callHolder: '', // provides a place/div/ where the VideoEngager widget should be inserted. Otherwise, popup winddow will be open.
    platform: 'purecloud', // one of 'engage'     or 'purecloud'
    tenantId: 'oIiTR2XQIkb7p0ub', // VideoEngager tenantId
    veUrl: 'https://staging.leadsecure.com', // VideoEngager api base url
    audioOnly: false, // start the VideoEngager call with audioOnly (without video)
    autoAccept: true, // during the call negotiation - automatically enter the call
    enablePrecall: false, // start the VideoEngager session with precall window - the visitor could select their camera/microphone settings
    useWebChatForm: false, // start VideoEngager session with/without registration form
    webChatFormData: {},
    // in case of useWebChatForm == false, pass the following data to conversation initialization - visible for agent
    extraAgentMessage: '**This is a VideoEngager Video Call!!!**',
    i18n: {
      en: { // localize the web chat buttons/tittle in registration form
        ChatFormSubmitVideo: 'Start Video',
        WebChatTitleVideo: 'Video Chat',
        ChatFormSubmitAudio: 'Start Audio',
        WebChatTitleAudio: 'Audio Chat'
      },
      fr: {
        ChatFormSubmitVideo: 'Démarrer la vidéo',
        WebChatTitleVideo: 'Chat la vidéo',
        ChatFormSubmitAudio: 'Démarrer la audio',
        WebChatTitleAudio: 'Chat audio'
      }
    }
  },
  webchat: {
    confirmFormCloseEnabled: false,
    transport: {
      type: 'purecloud-v2-sockets',
      dataURL: 'https://api.mypurecloud.de',
      deploymentKey: '1b4b1124-b51c-4c38-899f-3a90066c76cf',
      orgGuid: '639292ca-14a2-400b-8670-1f545d8aa860',
      markdown: true,
      interactionData: {
        routing: {
          targetType: 'QUEUE',
          targetAddress: 'Support',
          priority: 2
        }
      }
    }
  },
  extensions: { VideoEngager: videoEngager.initExtension }
};
