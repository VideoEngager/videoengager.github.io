
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
    tenantId: 'test_tenant', // change to your tenantID
    veUrl: 'https://dev.videoengager.com', // change to videoengager server url
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
      dataURL: 'https://api.mypurecloud.com.au', // change this as data url (environment)
      deploymentKey: 'f5a7c09c-b56b-407a-840a-d76ce5653aa9', // change this as widget deployment key
      orgGuid: '327d10eb-0826-42cd-89b1-353ec67d33f8', // change this as org guid
      markdown: true,
      interactionData: {
        routing: {
          targetType: 'QUEUE',
          targetAddress: 'video', // change this as fallback queue
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
    id: '7f29a87d-0575-4cb1-82f7-9f9337485901',
    name: 'Evrim Olcum'
  },
  {
    id: '1f063e29-009d-474d-b59a-9f4577f7b715',
    name: 'Mamoun'
  },
  {
    id: '81fc316c-554b-4d50-9b03-c9e38a18c696',
    name: 'Pavan'
  },
  {
    id: '3ce84f47-4e65-4756-a815-67a2b32e58b8',
    name: 'Slav'
  },
  {
    id: 'd9c15d0d-2ed1-4d3e-90f2-3ff00d07633c',
    name: 'Stefan'
  },
  {
    id: 'bc231f49-4703-4ff1-a809-b73ce6392ea4',
    name: 'Zach Hinkle'
  },
  {
    id: 'a4af7ede-fffe-4de5-8ae1-cd9021c821a0',
    name: 'Zlatko Petrov'
  },
  {
    id: '56c5cbe8-468a-480a-92e7-5c55ed1b766a',
    name: 'agent-1'
  },
  {
    id: '4d49cb0f-d8ca-44d0-850b-b5124ed114ff',
    name: 'agent-2'
  },
  {
    id: '42a68718-10b9-4f89-bb92-a27577c1002d',
    name: 'agent-5'
  },
  {
    id: '1c6b2d66-bcaa-41e1-896a-0cc1efc78fcc',
    name: 'e2e test'
  }
];
