/**
 * for Genesys reference: https://help.mypurecloud.com/articles/genesys-cloud-web-chat-widget/
 * To Getting Fields from Genesys reference: https://help.videoengager.com/hc/en-us/articles/360061175891-How-to-obtain-my-Genesys-Cloud-Parameters-required-to-setup-SmartVideo-SDKs
 * for full reference about Genesys Integration with Smartvideo SDK: https://help.videoengager.com/hc/en-us/articles/360049826571-VideoEngager-for-Genesys-Widgets-Developer-Guide
*/

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
    tenantId: 'test_tenant',
    veUrl: 'https://dev.videoengager.com',
    useWebChatForm: true,
    extraAgentMessage: '**This is a SmartVideo Video Call**',
    form: {
      wrapper: '<table></table>',
      inputs: [
        {
          id: 'cx_webchat_form_firstname',
          name: 'firstname',
          type: 'text',
          maxlength: '100',
          placeholder: '@i18n:webchat.ChatFormPlaceholderFirstName',
          label: '@i18n:webchat.ChatFormFirstName',
          value: 'John'
        },
        {
          id: 'cx_webchat_form_lastname',
          name: 'lastname',
          type: 'text',
          maxlength: '100',
          placeholder: '@i18n:webchat.ChatFormPlaceholderLastName',
          label: '@i18n:webchat.ChatFormLastName',
          value: 'Smith'
        },
        {
          id: 'cx_webchat_form_email',
          name: 'email',
          type: 'text',
          maxlength: '100',
          placeholder: '@i18n:webchat.ChatFormPlaceholderEmail',
          label: 'Email',
          value: 'john.smith@company.com'
        },
        {
          id: 'cx_webchat_form_account_number',
          name: 'customField1',
          type: 'text',
          maxlength: '100',
          placeholder: 'Account Number',
          label: 'Account Number'
        },
        {
          id: 'cx_webchat_form_subject',
          name: 'customField2',
          type: 'text',
          maxlength: '100',
          placeholder: 'Subject',
          label: 'Subject',
          requreied: true
        }

      ]
    },
    webChatFormData: {
      nickname: 'Anonymous',
      firstname: 'Anonymous',
      lastname: 'Customer',
      subject: 'Video Call'
    },
    userData: {
      customField1Label: 'Account Number',
      customField2Label: 'Subject'
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
      customField1Label: 'Account Number',
      customField2Label: 'Subject'
    },
    transport: {
      type: 'purecloud-v2-sockets',
      dataURL: 'https://api.mypurecloud.com.au',
      deploymentKey: '1cd594f7-654d-4cb2-9578-c57c25fc05dd',
      orgGuid: '327d10eb-0826-42cd-89b1-353ec67d33f8',
      markdown: true,
      interactionData: {
        routing: {
          targetType: 'QUEUE',
          targetAddress: 'video', // change this field
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
