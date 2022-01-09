/* global videoEngager */
const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.get('debug');

if (!window._genesys) {
  window._genesys = {};
}
if (!window._gt) {
  window._gt = [];
}
window._genesys.widgets = {
  main: {
    debug: true,
    theme: 'dark',
    plugins: [
      'cx-webchat',
      'cx-webchat-service',
      'cx-cobrowse',
      'cx-channel-selector',
      'cx-stats-service',
      'cx-call-us',
      'cx-callback-service',
      'cx-callback',
      'cx-calendar',
      'cx-sidebar'
    ],
    lang: 'en'
  },
  videoengager: {
    // callHolder: "myVideoHolder",
    // platfor: engage or purecloud
    platform: 'purecloud',
    tenantId: '0FphTk091nt7G1W7',
    veUrl: 'https://videome.leadsecure.com',
    audioOnly: false,
    autoAccept: true,
    enablePrecall: false,
    useWebChatForm: true,
    webChatFormData: {
      nickname: 'videoengager',
      firstname: 'videoengager.github.io',
      lastname: 'leadsecure',
      email: 'development@videoengager.com',
      subject: 'test',
      userData: {}
    },
    i18n: {
      en: {
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
    transport: {
      type: 'purecloud-v2-sockets',
      dataURL: 'https://api.mypurecloud.com',
      deploymentKey: '973f8326-c601-40c6-82ce-b87e6dafef1c',
      orgGuid: 'c4b553c3-ee42-4846-aeb1-f0da3d85058e',
      interactionData: {
        routing: {
          targetType: 'QUEUE',
          targetAddress: 'TestQueue',
          priority: 2
        }
      }

    },
    cometD: {
      enabled: false

    },
    autoInvite: {
      enabled: true,
      timeToInviteSeconds: 5,
      inviteTimeoutSeconds: 30
    },
    chatButton: {
      enabled: false,
      openDelay: 1000,
      effectDuration: 300,
      hideDuringInvite: true
    },
    uploadsEnabled: true
  },
  channelselector: {
    ewtRefreshInterval: 10,
    channels: [{
      enable: true,
      clickCommand: 'VideoEngager.startVideoEngager',
      readyEvent: 'VideoEngager.ready',
      displayName: 'Video Chat',
      i18n: 'VideoTitle',
      icon: 'videochat',
      ewt: {
        display: true,
        queue: 'Omnichannel',
        availabilityThresholdMin: 300,
        availabilityThresholdMax: 480,
        hideChannelWhenThresholdMax: false
      }
    },
    {
      enable: true,
      clickCommand: 'WebChat.open',
      readyEvent: 'WebChat.ready',
      displayName: 'Web Chat',
      i10n: 'ChatTitle',
      icon: 'chat',
      html: '',
      ewt: {
        display: true,
        queue: '',
        availabilityThresholdMin: 300,
        availabilityThresholdMax: 3600,
        hideChannelWhenThresholdMax: false
      }
    },
    {
      enable: true,
      clickCommand: 'CallUs.open',
      displayName: 'Call Us',
      i18n: 'CallusTitle',
      icon: 'call-outgoing',
      ewt: {
        display: true,
        queue: 'callus_ewt_test_eservices',
        availabilityThresholdMin: 300,
        availabilityThresholdMax: 480,
        hideChannelWhenThresholdMax: false
      }
    },
    {
      enable: true,
      clickCommand: 'Callback.open',
      displayName: 'Receive a Call',
      i18n: 'CallbackTitle',
      icon: 'call-incoming',
      html: '',
      ewt: {
        display: true,
        queue: 'callback_ewt_test_eservices',
        availabilityThresholdMin: 300,
        availabilityThresholdMax: 480,
        hideChannelWhenThresholdMax: false
      }
    }
    ]
  },
  sidebar: {
    showOnStartup: true,
    position: 'right',
    expandOnHover: true,
    channels: [{
      name: 'ChannelSelector',
      clickCommand: 'ChannelSelector.open',
      readyEvent: 'ChannelSelector.ready',
      clickOptions: {},
      displayName: 'Live Assistance',
      displayTitle: 'How would you like to get in touch?',
      icon: 'agent'
    }]
  },
  extensions: {
    VideoEngager: videoEngager.initExtension
  }
};

const parameters = {
  staging: {
    organizationId: '639292ca-14a2-400b-8670-1f545d8aa860',
    deploymentId: '1b4b1124-b51c-4c38-899f-3a90066c76cf',
    videoengagerUrl: 'https://staging.videoengager.com',
    tennantId: 'oIiTR2XQIkb7p0ub',
    environment: 'https://mypurecloud.de',
    queue: 'Support'
  },
  dev: {
    organizationId: '327d10eb-0826-42cd-89b1-353ec67d33f8',
    deploymentId: 'c2eaaa5c-d755-4e51-9136-b5ee86b92af3',
    videoengagerUrl: 'https://dev.videoengager.com',
    tennantId: 'test_tenant',
    environment: 'https://mypurecloud.com.au',
    queue: 'video'
  },
  prod: {
    organizationId: 'c4b553c3-ee42-4846-aeb1-f0da3d85058e',
    deploymentId: '973f8326-c601-40c6-82ce-b87e6dafef1c',
    videoengagerUrl: 'https://videome.leadsecure.com',
    tennantId: '3X0eK2gclYkIML92',
    environment: 'https://mypurecloud.com',
    queue: 'TestQueue'
  }
};

// development
if (debugMode) {
  window._genesys.widgets.videoengager.tenantId = parameters[debugMode].tennantId;
  window._genesys.widgets.videoengager.veUrl = parameters[debugMode].videoengagerUrl;
  window._genesys.widgets.webchat.transport.dataURL = parameters[debugMode].environment;
  window._genesys.widgets.webchat.transport.deploymentKey = parameters[debugMode].deploymentId;
  window._genesys.widgets.webchat.transport.orgGuid = parameters[debugMode].organizationId;
  window._genesys.widgets.webchat.transport.interactionData.routing.targetAddress = parameters[debugMode].queue;
}
