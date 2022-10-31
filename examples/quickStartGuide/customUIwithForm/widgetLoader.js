
function loadLibraries () {
  window.CXBus.configure({ debug: true, pluginsPath: 'https://apps.mypurecloud.com/widgets/9.0/plugins/' });
  window.CXBus.loadPlugin('widgets-core').done(function () {
    startButtonsListeners();
    subscribeToGenesysListeners();
  });
}
function subscribeToGenesysListeners () {
  const videoCallButton = document.getElementById('videoCallButton');
  const cancelVideoCallButton = document.getElementById('cancelVideoCallButton');

  function hideVideoButton (e) {
    videoCallButton.style.display = 'none';
    cancelVideoCallButton.style.display = '';
  }
  function showVideoButton (e) {
    videoCallButton.style.display = '';
    cancelVideoCallButton.style.display = 'none';
  }
  // Genesys widget listeners
  /** Web Chat Reference https://all.docs.genesys.com/WID/Current/SDK/WebChat-combined */
  // 1.WebChat.opened || Registration Form form has opened
  // window.CXBus.subscribe('WebChat.opened', hideVideoButton);

  // 2. WebChat.cancelled || WebChat.closed || Registration Form has been Closed or canceled
  window.CXBus.subscribe('WebChat.closed', showVideoButton);
  window.CXBus.subscribe('WebChat.cancelled', showVideoButton);

  /** 3. WebChat.started || handle the Call Placed Event event
 * (this means that user has submitted the Registration Form and the call is waiting to be picked by an agent) */
  window.CXBus.subscribe('WebChat.started', hideVideoButton);

  // 4. WebChat.ended || handle call ended event
  window.CXBus.subscribe('WebChat.ended', showVideoButton);

  // 5.WebChat.failed || handle call failed event
  window.CXBus.subscribe('WebChat.failed', function (err) {
    showVideoButton();
    console.error(err);
  });

  /** handling SmartVideo Call  Events */

  window.addEventListener('message', function (event) {
    /** 1. CallStarted || SmartVideo Call has been connected
       * (this means that the agent has picked the call and call started) */
    if (event.data && event.data.type === 'CallStarted') {
      hideVideoButton();
    }
    /** 1. popupClosed || This means that the user has closed the SmartVideo Call */
    if (event.data && event.data.type === 'popupClosed') {
      window.CXBus.command('WebChat.endChat');
    }
  }, false);
}
function startButtonsListeners () {
  const callbackButton = document.getElementById('callbackButton');
  callbackButton.style.display = '';
  callbackButton.addEventListener('click', function () {
    startCallback();
  });
  const webChatButton = document.getElementById('webChatButton');
  webChatButton.style.display = '';
  webChatButton.addEventListener('click', function () {
    startWebChat();
  });

  const videoCallButton = document.getElementById('videoCallButton');
  videoCallButton.style.display = '';
  videoCallButton.addEventListener('click', function () {
    startVideoCall();
  });
  const cancelVideoCallButton = document.getElementById('cancelVideoCallButton');
  cancelVideoCallButton.addEventListener('click', function () {
    window.CXBus.command('WebChat.endChat');
  });
}

function startCallback () {
  return new Promise(function (resolve, reject) {
    window.CXBus.command('Callback.open').done(function () {
      resolve();
    }).fail(function (err) {
      reject(err);
    });
  });
}
function startVideoCall () {
  return new Promise(function (resolve, reject) {
    window.CXBus.command('VideoEngager.startVideoEngager').done(function () {
      resolve();
    }).fail(function (err) {
      reject(err);
    });
  });
}
function startWebChat () {
  return new Promise(function (resolve, reject) {
    window.CXBus.command('WebChat.open').done(function () {
      resolve();
    }).fail(function (err) {
      reject(err);
    });
  });
}
loadLibraries();
