/* global  $ jQuery VideoEngager */
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
    VideoEngager.endVideoChatSession();
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
  inactivityTimeout.set();
};

const setOnCallScreen = function () {
  $('#loadingScreen,#carousel').show();
  $('#initial-screen').hide();
  $('#oncall-screen').show();
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  const height = (vh && vh - 100) || false;
  if (height) {
    $('#video-call-ui').css('height', `${height}px`);
  } else {
    $('#video-call-ui').css('height', '100%');
  }
  inactivityTimeout.cancel();
};

const setLang = function (lang) {
  $('.secondery-text').html(lang.motto);
  $('#connectButton').html(lang.connect);
  $('#loadingText').html(lang.loadingText);
};
function getLangFromParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const lang = urlParams.get('lang');
  return lang || DEFAULT_LANG;
}
const getConfig = function () {
  setConfig();
  loadVideoEngagerHub();
};

const setConfig = function (selectedLang = getLangFromParams()) {
  const langObj = lang[selectedLang];

  if (!langObj) {
    console.error('selected language is not supported');
    handleError(2);
    return;
  }
  setLang(langObj);
  /* VideoEngager Configuration obj provided by conf.js */
  if (!window.__VideoEngagerConfigs) {
    handleError(4);
    throw new Error('Configuration file is not found');
  }
  // callHolder is not present in the configuration
  // instead add in html div element with id "video-call-ui" and videoEngager Hub will inject the widget there
  // extraAgentMessage is replaced with config .videoengager.firstMessage , which can be passed on configuration
  // or can be changed via method VideoEngager.setFirstMessage('**This is a VideoEngager Video Call!!!**');
  // webChatFormData (userData) is replaced with config .videoengager.customAttributes
  // queue can be passed via customAttributes ass well and handled via Genesys Architect
};

async function loadVideoEngagerHub() {
  if (typeof VideoEngager === 'undefined') {
    handleError(8);
    throw new Error('VideoEngager Hub is not loaded');
  }
  // VideoEngager Hub is loaded, now we should wait for it to be ready
  await VideoEngager.waitForReady();
  console.log('VideoEngager Hub is ready');
  $('#StartVideoCall').click(async () => {
    await startCleanInteraction();
    // cancel video session after 3 minutes timeout
    callTimeout.set();
  });

  const cancelButtonloading = document.getElementById('cancel-button-loading');
  cancelButtonloading.addEventListener('touchend', async (e) => {
    e.preventDefault();
    await VideoEngager.endVideoChatSession();
    setInitialScreen();
  });
  cancelButtonloading.addEventListener('click', async (e) => {
    e.preventDefault();
    await VideoEngager.endVideoChatSession();
    setInitialScreen();
  });
  /**
   * Register event handlers for VideoEngager events
   */
  VideoEngager.on('VideoEngagerCall.started', (data) => {
    console.log('VideoEngager call started', data);
    $('#cancel-button-loading').show();
  });

  VideoEngager.on('VideoEngagerCall.ended', (data) => {
    console.log('VideoEngager call ended', data);
    setInitialScreen();
    callTimeout.cancel();
  });

  VideoEngager.on('VideoEngagerCall.agentJoined', (data) => {
    // when agent joins the call
    console.log('Agent joined the call', data);
    agentJoinedHandler();
  });
}
function agentJoinedHandler() {
  callTimeout.cancel();

  $('#loadingScreen,#carousel').hide();
  $('#cancel-button-loading').hide();

  $('#video-call-ui').css('height', '100%');
}
const startCleanInteraction = async function () {
  setOnCallScreen();

  await VideoEngager.startVideoChatSession();

  $('.carousel-item').removeClass('active');
  $('#carousel-item-1').addClass('active');
  $('.carousel').carousel({
    interval: 5000
  });
};


function addCarouselItems() {
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

  getConfig();
  console.log('VideoEngager Kiosk Demo initialized');
});
