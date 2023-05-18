
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

    tenantId: 'oIiTR2XQIkb7p0ub', // change to your tenantID
    veUrl: 'https://staging.leadsecure.com', // change to videoengager server url
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
      dataURL: 'https://api.mypurecloud.de', // change this as data url (environment)
      deploymentKey: '77702e97-4149-4ef5-b6cd-9375fd1f6e0d', // change this as widget deployment key
      orgGuid: '639292ca-14a2-400b-8670-1f545d8aa860', // change this as org guid
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
    id: '86ae6f37-0f0e-4f5d-bf6b-fe0df239b162',
    name: 'Assen'
  },
  {
    id: 'b3706d20-c178-4091-8f82-3dda11ed0a12',
    name: 'Mamoun Hournai'
  },
  {
    id: '1178b04e-cd1b-4efb-84e2-e04a56c34525',
    name: 'Mustafa'
  },
  {
    id: '9291489f-4024-4646-bc3c-a38d6d360f3e',
    name: 'Slav'
  },
  {
    id: '5b56db45-6671-4afd-8a96-041a88cc7c30',
    name: 'Stefan'
  },
  {
    id: 'bc836cc5-a5d0-48dc-b8c8-b8669b0c9626',
    name: 'agent-1'
  },
  {
    id: '3804373c-d81a-4acd-86a2-244cea1b5b81',
    name: 'agent-3'
  },
  {
    id: 'e8c15c38-b826-42aa-8879-55b6ca7db234',
    name: 'agent-5'
  },
  {
    id: 'df7ebab9-802d-4975-8536-fc4bd05c697b',
    name: 'agent-8'
  },
  {
    id: '737c612e-985a-4355-924b-f0ed7b935257',
    name: 'mustafa'
  },
  {
    id: '6c64f4cd-23d3-4b70-947a-2a3ffd88543a',
    name: 'mustafa gmail'
  },
  {
    id: 'e8d3731e-74cc-4f8c-907d-3f0b7482a12e',
    name: 'mustafa+1'
  },
  {
    id: 'fb3593df-c060-4d7f-a52b-3254d9e23103',
    name: 'mustafa2'
  }
];
