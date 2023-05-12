/* global CXBus $ jQuery videoEngager */
const DEFAULT_LANG = 'en';
const callStarted = false;
const ERROR_RETRY_TIMEOUT = 1000 * 5;
const INACTIVITY_TIMEOUT = 1000 * 60 * 60;
const CALL_TIMEOUT = 1000 * 60 * 3;
let GENESYS_CONFIG = {};

window.addEventListener('online', () => {
  console.log('Became online');
  refresh();
});
window.addEventListener('offline', () => {
  console.log('Became offline');
  handleError(6);
});

const codeResolve = {
  8: {
    message: 'Script library cannot be loaded.',
    type: 'Library Error'
  },
  7: {
    message: 'We are sorry, but you do not have access to this page or resource.',
    type: 'Forbidden'
  },
  6: {
    message: 'Page will be reloaded when network became available.',
    type: 'Network Error'
  },
  5: {
    message: 'You have a network connection problem. Page will be reloaded in 5 seconds.',
    type: 'Internal Server Error'
  },
  4: {
    message: 'Configuration file cannot be found. Please contact support.',
    type: 'Not Found'
  },
  2: {
    message: 'Configuration file is not valid. Please contact support.',
    type: 'Parse Error'
  },
  0: {
    message: 'Server is not accessible. Please contact support.',
    type: 'No Response Error'
  }
};

const refresh = function () {
  window.location.reload(true);
};

const handleError = function (statusCode) {
  $('#errorModal').modal({
    backdrop: 'static',
    keyboard: false
  });

  statusCode = String(statusCode).charAt(0);
  if (statusCode === '5') {
    setTimeout(refresh, ERROR_RETRY_TIMEOUT);
  }

  if (statusCode === '8') {
    document.querySelector('#error-text').style.display = 'block';
    document.querySelector('#error-text').innerHTML = codeResolve[statusCode].message;
    return;
  }

  $('#modalTitle').html(codeResolve[statusCode].type);
  $('.modal-body').html(codeResolve[statusCode].message);
  $('#errorModal').modal('show');
  $('.modal-footer-custom').hide();
};

const lang = {

  en: {
    header: '{0} to Video',
    headerEmphasie: 'Click',
    motto: 'SmartVideo Kiosk Demo',
    buttonExplaination: 'By clicking connect you are giving your consent to possibly be recorded during the video call.',
    footer: 'Video Engager Genesys Single Button Call.',
    connect: 'Connect',
    loadingText: 'Connecting to an Agent',
    footerOnCall: '© 2022 VideoEngager All Rights Reserved.'
  },
  de: {
    header: '{0} zu Video',
    headerEmphasie: 'Klick',
    motto: 'SmartVideo Kiosk Demo',
    buttonExplaination: 'Indem Sie auf Verbinden klicken, geben Sie Ihr Einverständnis, einen Videoanruf zu tätigen und eventuell aufgezeichnet zu werden.',
    footer: 'Video Engager Genesys Single Button Call.',
    connect: 'Verbinden',
    loadingText: 'Verbinde mit einem Agenten',
    footerOnCall: '© 2022 VideoEngager Alle Rechte vorbehalten.'
  }
};

const inactivityTimeout = {
  set: function () {
    if (typeof this.timeoutId === 'number') {
      this.cancel();
    }
    this.timeoutId = setTimeout(function () {
      window.location.reload(true);
    }, INACTIVITY_TIMEOUT);
  },
  reset: function () {

  },
  cancel: function () {
    clearTimeout(this.timeoutId);
  }
};

const callTimeout = {
  cancelVideoSession: function () {
    CXBus.command('VideoEngager.endCall');
    this.timeoutId = undefined;
  },
  set: function () {
    if (typeof this.timeoutId === 'number') {
      this.cancel();
    }
    this.timeoutId = setTimeout(function () {
      this.cancelVideoSession();
    }.bind(this), CALL_TIMEOUT);
  },
  cancel: function () {
    clearTimeout(this.timeoutId);
  }
};

const setInitialScreen = function () {
  $('#footerPreCall').show();
  $('#footerOnCall').hide();
  $('#loadingScreen,#carousel').hide();
  $('#initial-screen').show();
  $('#oncall-screen').hide();
  $('#lang').show();
  inactivityTimeout.set();
};

const setOnCallScreen = function () {
  $('#footerPreCall').hide();
  $('#footerOnCall').show();
  $('#loadingScreen,#carousel').show();
  $('#initial-screen').hide();
  $('#oncall-screen').show();
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  const height = (vh && vh - 100) || false;
  if (height) {
    $('#myVideoHolder').css('height', `${height}px`);
  } else {
    $('#myVideoHolder').css('height', '100%');
  }
  $('#lang').hide();
  inactivityTimeout.cancel();
};

const setLang = function (lang) {
  let headerText = lang.header;
  headerText = headerText.substring(0, headerText.indexOf('{0}')) + '<span class="header-text-addition">' + lang.headerEmphasie + '</span>' + headerText.substring(headerText.indexOf('{0}') + 3, headerText.length);
  $('.header-text').html(headerText);
  $('.secondery-text').html(lang.motto);
  $('#consent').html(lang.buttonExplaination);
  $('#footer-text').html(lang.footer);
  $('#connectButton').html(lang.connect);
  $('#loadingText').html(lang.loadingText);
  $('.footer-oncall').html(lang.footerOnCall);
};

const getConfig = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const envPath = urlParams.get('env') || 'prod';
  const langObj = lang[DEFAULT_LANG];
  setLang(langObj);
  $.getJSON('config/' + envPath + '.json', function (genesysConfig) {
    genesysConfigInit();
    GENESYS_CONFIG = genesysConfig;
    setConfig(DEFAULT_LANG);
    loadGenesysWidget();
  }).fail(function (error, errorName) {
    // errorName can be  "notmodified", "error", "timeout", or "parsererror"
    switch (error.status) {
      case 200:
        handleError(2);
        break;
      case 404:
        console.log('cannot find config file', envPath, errorName);
        handleError(4);
        break;
      case 403:
        handleError(7);
        break;
      default:
        handleError(0);
    }
  });
};

const cloneObj = function (obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return {};
  }
};

const setConfig = function (selectedLang) {
  // avoid shallow copy
  const genesysConfig = cloneObj(GENESYS_CONFIG);
  selectedLang = selectedLang || DEFAULT_LANG;
  // get default config
  let config = genesysConfig[DEFAULT_LANG];
  const selectedConf = genesysConfig[selectedLang] || {};
  const langObj = lang[selectedLang];
  setLang(langObj);
  // use defaul config props if props are not set in selected config
  config = Object.assign(config, selectedConf);

  if (config) {
    window._genesys.widgets.videoengager.tenantId = config.tennantId;
    window._genesys.widgets.videoengager.veUrl = config.videoengagerUrl;
    window._genesys.widgets.webchat.transport.dataURL = config.environment;
    window._genesys.widgets.webchat.transport.deploymentKey = config.deploymentId;
    window._genesys.widgets.webchat.transport.orgGuid = config.organizationId;
    window._genesys.widgets.webchat.transport.interactionData.routing.targetAddress = config.queue;
  }
};

const loadGenesysWidget = function () {
  const widgetBaseUrl = 'https://apps.mypurecloud.de/widgets/9.0/';
  const widgetScriptElement = document.createElement('script');

  widgetScriptElement.setAttribute('src', widgetBaseUrl + 'cxbus.min.js');
  widgetScriptElement.addEventListener('load', function () {
    CXBus.configure({ debug: true, pluginsPath: widgetBaseUrl + 'plugins/' });
    CXBus.loadPlugin('widgets-core');
    $('#StartVideoCall').click(function () {
      startCleanInteraction();
      // cancel video session after 3 minutes timeout
      callTimeout.set();
    });

    $('#closeVideoButton').on('click touchstart', function (e) {
      e.preventDefault();
      CXBus.command('VideoEngager.endCall');
      setInitialScreen();
    });

    $('#closeVideoButtonHolder').on('click', function (e) {
      try {
        // click position minus header offset 52
        document.querySelector('#videoengageriframe').contentWindow.document.elementFromPoint(e.pageX, e.pageY - 52).click();
      } catch (error) {
        console.log('click cannot be transferred this time', e.pageX, e.pageY);
      }
    });

    CXBus.subscribe('WebChatService.ended', function () {
      console.log('Interaction Ended');
      setInitialScreen();
      callTimeout.cancel();
    });

    CXBus.subscribe('WebChatService.restored', function (e) {
      console.error('Chat restored, cleaning it' + JSON.stringify(e));
      CXBus.command('WebChatService.endChat');
      handleError(5);
    });

    CXBus.subscribe('WebChatService.error', function (e) {
      // Log the error and continue
      console.error('WebService error' + JSON.stringify(e));
      setInitialScreen();
    });
  });
  document.head.append(widgetScriptElement);
};

const startCleanInteraction = function () {
  setOnCallScreen();

  CXBus.command('VideoEngager.startVideoEngager');

  $('.carousel-item').removeClass('active');
  $('#carousel-item-1').addClass('active');
  $('.carousel').carousel({
    interval: 5000
  });
};

const genesysConfigInit = function () {
  /* genesys configuration code */
  if (!window._genesys) window._genesys = {};
  if (!window._gt) window._gt = [];
  window._genesys.widgets = {
    main: {
      downloadGoogleFont: false,
      debug: true,
      theme: 'dark',
      lang: 'en',
      i18n: 'https://apps.mypurecloud.de/widgets/9.0/i18n/widgets-en.i18n.json',
      plugins: [
        'webchatservice'
      ],
      preload: [
        'webchatservice'
      ]
    },
    videoengager: {
      callHolder: 'myVideoHolder', // provides a place/div/ where the VideoEngager widget should be inserted. Otherwise, popup winddow will be open.
      platform: 'purecloud', // one of 'engage' or 'purecloud'
      tenantId: '', // VideoEngager tenantId
      veUrl: '', // VideoEngager api base url
      audioOnly: false, // start the VideoEngager call with audioOnly (without video)
      autoAccept: true, // during the call negotiation - automatically enter the call
      enablePrecall: false, // start the VideoEngager session with precall window - the visitor could select their camera/microphone settings
      useWebChatForm: false, // start VideoEngager session with/without registration form
      // in case of useWebChatForm == false, pass the following data to conversation initialization - visible for agent
      extraAgentMessage: '**This is a VideoEngager Video Call!!!**',
      webChatFormData: {
        nickname: 'Visitor',
        firstname: 'Duty Free',
        lastname: 'Visitor',
        // email: 'na@videoengager.com',
        subject: 'Duty Free Demo',
        userData: {}
      },
      customAttributes: {
        ipad: true // hide video widget controll buttons and move video preview to right bottom corner
      }
    },
    webchat: {
      transport: {
        type: 'purecloud-v2-sockets',
        dataURL: '', // genesys server url ex: https://api.mypurecloud.com
        deploymentKey: '', // deployment id
        orgGuid: '', // organization id
        markdown: true,
        interactionData: {
          routing: {
            targetType: 'QUEUE',
            targetAddress: '', // genesys queue name
            priority: 2
          }
        }
      }
    },
    extensions: {
      VideoEngager: videoEngager.initExtension
    }
  };
};

// on document ready
document.addEventListener('DOMContentLoaded', function (event) {
  if (!jQuery) {
    handleError(8);
    return;
  }
  setInitialScreen();
  // lang
  $('#en_flag').show();
  $('#de_flag').hide();

  $('#en_flag').on('click', function () {
    if (callStarted) {
      return;
    }
    $('#de_flag').show();
    $('#en_flag').hide();
    setConfig('de');
  });
  $('#de_flag').on('click', function () {
    if (callStarted) {
      return;
    }
    $('#en_flag').show();
    $('#de_flag').hide();
    setConfig('en');
  });

  const messageHandler = function (e) {
    console.log('messageHandler', e.data);
    if (e.data && e.data.type === 'CallStarted') {
      $('#loadingScreen,#carousel').hide();
      $('#closeVideoButtonHolder').show();
      $('#closeVideoButtonHolder').focus();
      $('#myVideoHolder').css('height', '100%');

      callTimeout.cancel();
    }
  };
  if (window.addEventListener) {
    window.addEventListener('message', messageHandler, false);
  } else {
    window.attachEvent('onmessage', messageHandler);
  }

  getConfig();
});
