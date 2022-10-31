
function loadLibraries () {
  window.CXBus.configure({ debug: true, pluginsPath: 'https://apps.mypurecloud.com/widgets/9.0/plugins/' });
  window.CXBus.loadPlugin('widgets-core').done(function () {
    startButtonsListeners();
  });
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
