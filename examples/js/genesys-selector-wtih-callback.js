if (!window._genesys) window._genesys = {};
if (!window._gt) window._gt = [];
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
    platform: 'purecloud', // engage or purecloud
    tenantId: '0FphTk091nt7G1W7',
    veUrl: 'https://videome.leadsecure.com/',
    audioOnly: false,
    autoAccept: true,
    enablePrecall: false,
    useWebChatForm: true,
    webChatFormData: {
      nickname: 'Jonny',
      firstname: 'Johnathan',
      lastname: 'Smith',
      email: 'jon.smith@mail.com',
      subject: 'product questions',
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
    /* {
      enable: true,
      clickCommand: 'VideoEngager.startCalendar',
      readyEvent: 'Calendar.ready',
      displayName: 'Schedule Video',
      i10n: 'ChatTitle',
      icon: 'videochat',
      html: '',
      ewt: {
        display: true,
        queue: '',
        availabilityThresholdMin: 300,
        availabilityThresholdMax: 3600,
        hideChannelWhenThresholdMax: false
      }
    }, */
    {
      enable: true,
      clickCommand: 'Callback.open',
      readyEvent: 'Callback.ready',
      displayName: 'Schedule Video Meeting',
      i10n: 'ChatTitle',
      icon: 'call-incoming',
      html: '',
      ewt: {
        display: true,
        queue: '',
        availabilityThresholdMin: 300,
        availabilityThresholdMax: 3600,
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
  },
  calendar: {
    showAvailability: false,
    numberOfDays: 5,
    hideUnavailableTimeSlots: false,
    calendarHours: {
      interval: 10,
      allDay: {
        openTime: '09:00',
        closeTime: '23:59'
      }
    }
  },
  callback: {
    dataURL: 'https://dev.videoengager.com/api/genesys/callback',
    userData: {
      environment: 'https://api.mypurecloud.com'
    },
    countryCodes: true,
    immediateCallback: true,
    scheduledCallback: true,
    ewt: {
      display: true,
      queue: 'TestQueue',
      threshold: 2000,
      immediateCallback: {
        thresholdMin: 1000,
        thresholdMax: 3000
      }
    },
    form: {
      wrapper: '<table></table>',
      inputs: [
        {
          id: 'cx_form_callback_firstname',
          name: 'firstname',
          maxlength: '100',
          placeholder: '@i18n:callback.CallbackPlaceholderOptional',
          label: '@i18n:callback.CallbackFirstName'
        },

        {
          id: 'cx_form_callback_lastname',
          name: 'lastname',
          maxlength: '100',
          placeholder: '@i18n:callback.CallbackPlaceholderOptional',
          label: '@i18n:callback.CallbackLastName'
        },
        {
          id: 'cx_form_callback_phone_number',
          name: 'phonenumber',
          maxlength: '14',
          placeholder: '+123456789',
          label: '@i18n:callback.CallbackPhoneNumber'
        },
        {
          type: 'hidden',
          label: 'pak',
          id: 'cx_form_callback_pak',
          maxlength: '100',
          name: 'pak'
        },
        {
          type: 'hidden',
          label: 'email',
          id: 'cx_form_callback_email',
          maxlength: '100',
          name: 'email'
        }
      ]
    }

  }
};
const urlParams = new URLSearchParams(window.location.search);
window.window.debugMode = urlParams.get('debug');

window.parameters = {
  staging: {
    organizationId: '639292ca-14a2-400b-8670-1f545d8aa860',
    deploymentId: '1b4b1124-b51c-4c38-899f-3a90066c76cf',
    videoengagerUrl: 'https://staging.leadsecure.com',
    tennantId: 'oIiTR2XQIkb7p0ub',
    environment: 'https://api.mypurecloud.de',
    queue: 'Support',
    pak: 'b17cd9a8-e00d-7e98-2894-d33e473e2bbb',
    externalId: 'videoEngager',
    email: 'slav@videoengager.com'
  },
  dev: {
    organizationId: '327d10eb-0826-42cd-89b1-353ec67d33f8',
    deploymentId: 'c2eaaa5c-d755-4e51-9136-b5ee86b92af3',
    videoengagerUrl: 'https://dev.videoengager.com',
    tennantId: 'test_tenant',
    environment: 'https://api.mypurecloud.com.au',
    queue: 'video',
    pak: 'DEV2',
    externalId: 'videoEngager',
    email: 't@t'
  },
  prod: {
    organizationId: 'c4b553c3-ee42-4846-aeb1-f0da3d85058e',
    deploymentId: '973f8326-c601-40c6-82ce-b87e6dafef1c',
    videoengagerUrl: 'https://videome.leadsecure.com',
    tennantId: '3X0eK2gclYkIML92',
    environment: 'https://api.mypurecloud.com',
    queue: 'TestQueue',
    pak: '72884930-79d1-3221-166d-58b3a9894e16',
    externalId: 'Home',
    email: 'slav@videoengager.com'
  }
};

// development
if (window.debugMode) {
  window._genesys.widgets.videoengager.tenantId = window.parameters[window.debugMode].tennantId;
  window._genesys.widgets.videoengager.veUrl = window.parameters[window.debugMode].videoengagerUrl;
  window._genesys.widgets.webchat.transport.dataURL = window.parameters[window.debugMode].environment;
  window._genesys.widgets.webchat.transport.deploymentKey = window.parameters[window.debugMode].deploymentId;
  window._genesys.widgets.webchat.transport.orgGuid = window.parameters[window.debugMode].organizationId;
  window._genesys.widgets.webchat.transport.interactionData.routing.targetAddress = window.parameters[window.debugMode].queue;
  window._genesys.widgets.callback.dataURL = window.parameters[window.debugMode].videoengagerUrl + '/api/genesys/callback';
  window._genesys.widgets.callback.ewt.queue = window.parameters[window.debugMode].queue;
  window._genesys.widgets.callback.userData.environment = window.parameters[window.debugMode].environment;
}
