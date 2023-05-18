
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
    platform: 'purecloud',
    callHolder: 'videoengager-iframe',

    tenantId: '0FphTk091nt7G1W7', // change to your tenantID
    veUrl: 'https://videome.leadsecure.com', // change to videoengager server url
    useWebChatForm: true,
    extraAgentMessage: '**This is a SmartVideo Video Call**',
    webChatFormData: {
      nickname: 'Anonymous',
      firstname: 'Prefered Routed',
      lastname: 'Customer',
      subject: 'Video Call'
    },
    i18n: {
      en: {
        ChatFormSubmitVideo: 'Start Video',
        WebChatTitleVideo: 'Video Chat'
      }
    }
  },
  webchat: {
    userData: {
    },
    transport: {
      type: 'purecloud-v2-sockets',
      dataURL: 'https://api.mypurecloud.com', // change this as data url (environment)
      deploymentKey: '02d2a1c3-11d2-4ae7-be57-1fb3785acce4', // change this as widget deployment key
      orgGuid: 'c4b553c3-ee42-4846-aeb1-f0da3d85058e', // change this as org guid
      markdown: true,
      interactionData: {
        routing: {
          targetType: 'QUEUE',
          targetAddress: 'Support_preferred', // change this as fallback queue
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

window.agentsList = [
  {
    id: '48c981af-91f3-40a2-a554-0eebcb667260',
    name: 'Agent Jordan'
  },
  {
    id: '62f21f39-0f28-4cb9-bac2-ddd1b70ce401',
    name: 'Assen Kanev'
  },
  {
    id: '3b1298c5-3c12-426f-bdff-a2092f0355f2',
    name: 'Jenkins'
  },
  {
    id: 'c79473be-f5ef-4711-b8af-afa8d818537a',
    name: 'Jim Crespino'
  },
  {
    id: '52d1b2ab-70f3-4847-8950-4a5ebe01f484',
    name: 'Mobile Developer'
  },
  {
    id: 'b3eabe7d-efa9-4392-8160-0ba8e5b6f982',
    name: 'Sermane Todd'
  },
  {
    id: '21c9c06c-061f-45e4-ac1f-bb3974b0a71f',
    name: 'Slav'
  },
  {
    id: '37b6ed63-0230-4c73-b5a3-6335d2c3d213',
    name: 'Stefan Dimov'
  },
  {
    id: 'cd1c2c82-cd04-4cc6-856f-9787a5df51b5',
    name: 'Val Babadjov'
  },
  {
    id: 'd63d5bc7-2b3a-4b13-9d7c-294ccf491b1e',
    name: 'Valentin'
  },
  {
    id: '988a573a-b1ec-4c9f-93ff-533f9bc8294b',
    name: 'Zach Hinkle'
  },
  {
    id: '149692c8-46c8-4a5f-a87e-653d94a75f36',
    name: 'mustafa'
  }
];
