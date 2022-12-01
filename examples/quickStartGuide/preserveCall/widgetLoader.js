

const loadJS = function (url, id) {
  return new Promise(function (resolve, reject) {
    const scriptElement = document.createElement('script');
    if (typeof id === 'string') {
      scriptElement.setAttribute('id', id);
    }
    scriptElement.setAttribute('src', url);
    scriptElement.addEventListener('load', function () {
      resolve();
    });
    scriptElement.addEventListener('error', function (e) {
      reject(e);
    });
    document.head.append(scriptElement);
  });
};
async function loadLibrariesForExistingCall (configObject){
  const config = JSON.parse(configObject);
  if (!window._genesys) window._genesys = {};
  if (!window._gt) window._gt = [];
  window._genesys.widgets = config;
  window._genesys.widgets.extensions= {
    VideoEngager: window.videoEngager.initExtension
  };
  /** Perform Loading Libraries */
  window.CXBus.configure({ debug: true, pluginsPath: 'https://apps.mypurecloud.com.au/widgets/9.0/plugins/' });
  window.CXBus.loadPlugin('widgets-core').done(function () {
    console.log('widgets-core loaded, should initialize a call')
    const callExists = videoEngager.checkIfPopupExists();
    if (callExists) {
      videoEngager.popupManager.focus();
    } else {
      // removing old local storage config since it is not valid anymore then refreshing the page
      localStorage.removeItem('activeInteractionConfig');
      window.location.reload();
    }
    loadGenesysListeners();
  });
}
async function loadLibrariesForNewCall () {
  await loadJS('configurationFile.js')
  /** Perform Loading Libraries */
  window.CXBus.configure({ debug: true, pluginsPath: 'https://apps.mypurecloud.com.au/widgets/9.0/plugins/' });
  window.CXBus.loadPlugin('widgets-core').done(function () {
    console.log('widgets-core loaded')
    loadGenesysListeners();
  });
}
async function loadLibraries() {
  const configObject = localStorage.getItem('activeInteractionConfig');
  if (configObject) {
    try {
      loadLibrariesForExistingCall(configObject);
    }
    catch (error) {
      console.error('invalid config object', error);
      loadLibrariesForNewCall();
    }
  } else {
    loadLibrariesForNewCall();
  }

}
// genesys widgets listeners 
function loadGenesysListeners() {
  // * (this means that user has submitted the Registration Form and the call is waiting to be picked by an agent) */
  window.CXBus.subscribe('WebChatService.started', () => {
    localStorage.setItem('activeInteractionConfig', JSON.stringify(window._genesys.widgets));
  });

  // 4. WebChat.ended || handle call ended event
  window.CXBus.subscribe('WebChatService.ended', () => {
    localStorage.removeItem('activeInteractionConfig');
  });

}
function startVideoCall() {
  return new Promise(function (resolve, reject) {
    window.CXBus.command('VideoEngager.startVideoEngager').done(function () {
      resolve();
    }).fail(function (err) {
      reject(err);
    });
  });
}

window.onload = function () {
  loadLibraries();
}
