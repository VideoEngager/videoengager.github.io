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
      'webchatservice',
      'sidebar',
      'calendar',
      'callbackservice',
      'common'
    ]
  },
  videoengager: {
    dialCountryCode: '+1', // default dial country code for callback can be set
    callHolder: '', // provides a place/div/ where the VideoEngager widget should be inserted. Otherwise, popup winddow will be open.
    platform: 'purecloud', // one of 'engage' or 'purecloud'
    tenantId: '', // VideoEngager tenantId
    veUrl: '', // VideoEngager api base url
    audioOnly: false, // start the VideoEngager call with audioOnly (without video)
    autoAccept: true, // during the call negotiation - automatically enter the call
    enablePrecall: false, // start the VideoEngager session with precall window - the visitor could select their camera/microphone settings
    useWebChatForm: true, // start VideoEngager session with/without registration form
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
  extensions: { VideoEngager: videoEngager.initExtension },
  channelselector: {
    channels: [
      {
        enable: true,
        clickCommand: 'VideoEngager.startVideoEngager',
        readyEvent: 'VideoEngager.ready',
        displayName: 'Video Chat',
        i18n: 'VideoTitle',
        icon: 'videochat'
      },
      {
        enable: true,
        clickCommand: 'WebChat.open',
        readyEvent: 'WebChat.ready',
        displayName: 'Web Chat',
        i10n: 'ChatTitle',
        icon: 'chat'
      },
      {
        enable: true,
        clickCommand: 'Callback.open',
        readyEvent: 'Callback.ready',
        displayName: 'Schedule Video',
        i10n: 'ChatTitle',
        icon: 'videochat'
      }
    ]
  },
  sidebar: {
    showOnStartup: true,
    position: 'right',
    expandOnHover: true,
    channels: [
      {
        name: 'ChannelSelector',
        clickCommand: 'ChannelSelector.open',
        readyEvent: 'ChannelSelector.ready',
        clickOptions: {},
        displayName: 'Live Assistance',
        displayTitle: 'How would you like to get in touch?',
        icon: 'agent'
      }
    ]
  },
  calendar: {
    showAvailability: false,
    numberOfDays: 7,
    hideUnavailableTimeSlots: false,
    calendarHours: {
      interval: 60,
      allDay: {
        openTime: '08:00',
        closeTime: '19:00'
      }
    }
  },
  callback: {
    dataURL: '',
    userData: {
      environment: ''
    },
    ewt: {},
    countryCodes: true,
    scheduledCallback: true,
    form: { // overrides the webchat form data. comment this property if there is no need to override
      wrapper: '<table></table>',
      inputs: [
        {
          id: 'cx_form_callback_firstname',
          name: 'firstname',
          maxlength: '100',
          placeholder: '@i18n:callback.CallbackPlaceholderRequired',
          label: '@i18n:callback.CallbackFirstName',
          validate: function (event, form, input, label, $, CXBus, Common) {
            if (input && input.val()) {
              return true;
            } else {
              return false;
            }
          }
        },
        {
          id: 'cx_form_callback_lastname',
          name: 'lastname',
          maxlength: '100',
          placeholder: '@i18n:callback.CallbackPlaceholderRequired',
          label: '@i18n:callback.CallbackLastName',
          validate: function (event, form, input, label, $, CXBus, Common) {
            if (input && input.val()) {
              return true;
            } else {
              return false;
            }
          }
        },
        {
          id: 'cx_form_callback_phone_number',
          name: 'phonenumber',
          maxlength: '14',
          placeholder: '@i18n:callback.CallbackPlaceholderRequired',
          label: '@i18n:callback.CallbackPhoneNumber',
          validate: function (event, form, input, label, $, CXBus, Common) {
            const regex = /^[+\d].(?:[\d.\s()]{5,18})$/;
            if (input && input.val().match(regex)) {
              return true;
            } else {
              return false;
            }
          }
        },
        {
          id: 'cx_form_callback_email',
          type: 'email',
          name: 'customer_email',
          maxlength: '100',
          placeholder: '@i18n:callback.CallbackPlaceholderRequired',
          label: 'Email',
          validate: function (event, form, input, label, $, CXBus, Common) {
            const re = /\S+@\S+\.\S+/;
            if (input && input.val().match(re)) {
              return true;
            } else {
              return false;
            }
          }
        },
        {
          type: 'hidden',
          label: 'tennantId',
          id: 'cx_form_callback_tennantId',
          maxlength: '100',
          name: 'tennantId'
        }
      ]
    }
  }
};
