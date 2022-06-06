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
      'callbackservice'
    ]
  },
  videoengager: {
    callHolder: 'myVideoHolder',
    platform: 'purecloud',
    tenantId: '',
    veUrl: '',
    audioOnly: false,
    autoAccept: true,
    enablePrecall: false,
    useWebChatForm: false,
    extraAgentMessage: '**This is a VideoEngager Video Call!!!**',
    webChatFormData: {
      nickname: 'Visitor',
      firstname: 'Duty Free',
      lastname: 'Visitor',
      subject: 'Duty Free Demo',
      userData: {}
    },
    customAttributes: {
      ipad: true
    }
  },
  webchat: {
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
      },
      {
        enable: true,
        clickCommand: 'VideoEngager.startCalendar',
        readyEvent: 'Calendar.ready',
        displayName: 'Schedule Video',
        i10n: 'ChatTitle',
        icon: 'call-incoming'
      }
    ]
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
    dataURL: '',
    userData: {
      environment: ''
    },
    ewt: {},
    countryCodes: true,
    scheduledCallback: true,
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
          label: 'tennantId',
          id: 'cx_form_callback_tennantId',
          maxlength: '100',
          name: 'tennantId'
        }
      ]
    }
  }
};
