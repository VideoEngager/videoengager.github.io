if (!window._genesys) { window._genesys = {}; }
if (!window._gt) { window._gt = []; }
window._genesys.widgets = {
  main: {
    downloadGoogleFont: false,
    debug: true,
    theme: 'light',
    lang: 'en',
    preload: ['calendar', 'callbackservice', 'webchatservice']
  },
  videoengager: {
    callHolder: '',
    platform: 'purecloud',
    tenantId: 'test_tenant',
    veUrl: 'https://dev.videoengager.com',
    useWebChatForm: false,
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
      dataURL: 'https://api.mypurecloud.com.au',
      deploymentKey: 'd90c61d5-f709-46f3-ab8a-1d68da3df92d',
      orgGuid: '327d10eb-0826-42cd-89b1-353ec67d33f8',
      markdown: true,
      interactionData: {
        routing: {
          targetType: 'QUEUE',
          targetAddress: 'video_DE',
          priority: 2
        }
      }
    }
  },
  extensions: { VideoEngager: window.videoEngager.initExtension }

};
