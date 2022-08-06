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
    tenantId: '', // VideoEngager tenantId
    veUrl: '', // VideoEngager api base url
    audioOnly: false, // start the VideoEngager call with audioOnly (without video)
    autoAccept: true, // during the call negotiation - automatically enter the call
    enablePrecall: false, // start the VideoEngager session with precall window - the visitor could select their camera/microphone settings
    useWebChatForm: false, // start VideoEngager session with/without registration form
    // in case of useWebChatForm == false, pass the following data to conversation initialization - visible for agent
    extraAgentMessage: '**This is a VideoEngager Video Call!!!**',
    webChatFormData: {
      nickname: 'Visitor',
      firstname: 'Duty Free',
      lastname: 'Visitor',
      subject: 'Duty Free Demo',
      userData: {}
    },
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
      dataURL: '',
      deploymentKey: '',
      orgGuid: '',
      markdown: true,
      interactionData: {
        routing: {
          targetType: 'QUEUE',
          targetAddress: '',
          priority: 2
        }
      }
    }
  },
  extensions: { VideoEngager: videoEngager.initExtension }
};
