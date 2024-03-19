/* global CXBus $ jQuery videoEngager */
const DEFAULT_LANG = 'en';
const ERROR_RETRY_TIMEOUT = 1000 * 5;
const INACTIVITY_TIMEOUT = 1000 * 60 * 60;
const CALL_TIMEOUT = 1000 * 60 * 3;

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
    motto: 'SmartVideo Kiosk Demo',
    connect: 'Touch Here To Begin',
    loadingText: 'Connecting to an Agent'
  },
  de: {
    motto: 'SmartVideo Kiosk Demo',
    connect: 'Verbinden',
    loadingText: 'Verbinde mit einem Agenten'
  },
  ar: {
    motto: 'عرض توضيحي لسمارت فيديو كيوسك',
    connect: 'الاتصال',
    loadingText: 'جاري الاتصال بموظف خدمة العملاء'
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
  $('#loadingScreen,#carousel').hide();
  $('#cancel-button-loading').hide();
  $('#initial-screen').css('display', 'flex');
  $('#oncall-screen').hide();
  $('#closeVideoButtonContainer').hide();
  inactivityTimeout.set();
};

const setOnCallScreen = function () {
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
  inactivityTimeout.cancel();
};

const setLang = function (lang) {
  $('.secondery-text').html(lang.motto);
  $('#connectButton').html(lang.connect);
  $('#loadingText').html(lang.loadingText);
};
function getLangFromParams () {
  const urlParams = new URLSearchParams(window.location.search);
  const lang = urlParams.get('lang');
  return lang || DEFAULT_LANG;
}
const getConfig = function () {
  genesysConfigInit();
  setConfig();
  loadGenesysWidget();
};

const setConfig = function (selectedLang = getLangFromParams()) {
  // avoid shallow copy
  const genesysConfig = window.GENESYS_CONFIG || {};
  const langObj = lang[selectedLang];
  // get default config
  const defaultConfigs = genesysConfig[DEFAULT_LANG] || {};
  const configs = genesysConfig[selectedLang];

  if (!configs || !langObj) {
    console.error('selected language is not supported');
    handleError(2);
    return;
  }
  setLang(langObj);
  // use defaul config props if props are not set in selected config
  const configuration = Object.assign({}, defaultConfigs, configs);
  window._genesys.widgets.videoengager.tenantId = configuration.tennantId;
  window._genesys.widgets.videoengager.veUrl = configuration.videoengagerUrl;
  window._genesys.widgets.webchat.transport.dataURL = configuration.environment;
  window._genesys.widgets.webchat.transport.deploymentKey = configuration.deploymentId;
  window._genesys.widgets.webchat.transport.orgGuid = configuration.organizationId;
  window._genesys.widgets.webchat.transport.interactionData.routing.targetAddress = configuration.queue;
  window._genesys.widgets.webchat.transport.interactionData.routing.language = configuration.language;
  window._genesys.widgets.webchat.transport.interactionData.routing.skills = configuration.skills;
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
    const elem = document.getElementById('closeVideoButton');

    elem.addEventListener('touchend', function (e) {
      e.preventDefault();
      CXBus.command('VideoEngager.endCall');
      setInitialScreen();
    });
    elem.addEventListener('click', function (e) {
      e.preventDefault();
      CXBus.command('VideoEngager.endCall');
      setInitialScreen();
    });
    const cancelButtonloading = document.getElementById('cancel-button-loading');
    cancelButtonloading.addEventListener('touchend', function (e) {
      e.preventDefault();
      CXBus.command('VideoEngager.endCall');
      setInitialScreen();
    });
    cancelButtonloading.addEventListener('click', function (e) {
      e.preventDefault();
      CXBus.command('VideoEngager.endCall');
      setInitialScreen();
    });
    CXBus.subscribe('WebChatService.started', function () {
      $('#cancel-button-loading').show();
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

function addCarouselItems () {
  const items = window.CAROUSEL_ITEMS || [];
  const carouselContainer = document.getElementById('carousel-inner');
  for (const item of carouselContainer.children) {
    if (item.id === 'carousel-item-1') continue;
    item.remove();
  }
  let itemIndex = 2;
  for (const item of items) {
    const div = document.createElement('div');
    div.id = 'carousel-item-' + itemIndex;
    div.className = 'carousel-item';
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.alt || 'slide' + itemIndex;
    div.appendChild(img);
    carouselContainer.appendChild(div);
    itemIndex++;
  }
}
// on document ready
document.addEventListener('DOMContentLoaded', function (event) {
  if (!jQuery) {
    handleError(8);
    return;
  }
  if (window.BACKGROUND_IMAGE) {
    const elem = document.getElementById('initial-screen');
    elem.style.backgroundImage = `url(${window.BACKGROUND_IMAGE})`;
  }
  setInitialScreen();
  addCarouselItems();

  const messageHandler = function (e) {
    console.log('messageHandler', e.data);
    if (e.data && e.data.type === 'CallStarted') {
      $('#loadingScreen,#carousel').hide();
      $('#cancel-button-loading').hide();
      $('#closeVideoButtonContainer').show();
      $('#closeVideoButtonContainer').focus();
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
