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
    dialCountryCode: '+1',
    callHolder: '',
    platform: 'purecloud',
    tenantId: '', // change this field
    veUrl: 'https://videome.leadsecure.com',
    audioOnly: false,
    autoAccept: true,
    enablePrecall: false,
    useWebChatForm: true,
    extraAgentMessage: '**This is a VideoEngager Video Call!!!**',
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
      dataURL: '', // change this field
      deploymentKey: '', // change this field
      orgGuid: '', // change this field
      markdown: true,
      interactionData: {
        routing: {
          targetType: 'QUEUE',
          targetAddress: '', // change this field
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
      }
    ]
  }
};
