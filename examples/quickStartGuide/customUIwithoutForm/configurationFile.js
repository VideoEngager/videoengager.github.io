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
    },
    transport: {
      interactionData: {
        routing: {
          targetType: 'QUEUE',
          targetAddressVideo: 'video',
          targetAddressChat: 'chat',
          priority: 2
        }
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
          targetAddress: 'chat',
          priority: 2
        }
      }
    }
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
      environment: 'https://api.mypurecloud.com.au'
    },
    ewt: {
      queue: 'video'
    },
    countryCodes: true,
    scheduledCallback: true,
    form: {
      wrapper: '<table></table>',
      inputs: [
        {
          id: 'cx_form_callback_firstname',
          name: 'firstname',
          maxlength: '100',
          placeholder: '@i18n:callback.CallbackPlaceholderRequired',
          label: '@i18n:callback.CallbackFirstName'
        },
        {
          id: 'cx_form_callback_lastname',
          name: 'lastname',
          maxlength: '100',
          placeholder: '@i18n:callback.CallbackPlaceholderRequired',
          label: '@i18n:callback.CallbackLastName'
        },
        {
          id: 'cx_form_callback_phone_number',
          name: 'phonenumber',
          maxlength: '14',
          placeholder: '@i18n:callback.CallbackPlaceholderRequired',
          label: '@i18n:callback.CallbackPhoneNumber'
        },
        {
          id: 'cx_form_callback_email',
          type: 'email',
          name: 'customer_email',
          maxlength: '100',
          placeholder: '@i18n:callback.CallbackPlaceholderRequired',
          label: 'Email'
        }, {
          type: 'hidden',
          label: 'tennantId',
          id: 'cx_form_callback_tennantId',
          maxlength: '100',
          name: 'tennantId',
          value: 'test_tenant'
        }
      ]
    }
  },
  extensions: { VideoEngager: window.videoEngager.initExtension }

};
