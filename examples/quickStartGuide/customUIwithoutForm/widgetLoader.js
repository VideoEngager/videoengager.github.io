
function loadLibraries () {
  window.CXBus.configure({ debug: true, pluginsPath: 'https://apps.mypurecloud.com/widgets/9.0/plugins/' });
  window.CXBus.loadPlugin('widgets-core')

    .done(function () {
      startButtonsListeners();
      subscribeToGenesysListeners();
    });
}
function subscribeToGenesysListeners () {
  const videoCallButton = document.getElementById('videoCallButton');
  const cancelVideoCallButton = document.getElementById('cancelVideoCallButton');

  function hideVideoButton () {
    videoCallButton.style.display = 'none';
    cancelVideoCallButton.style.display = '';
  }
  function showVideoButton () {
    videoCallButton.style.display = '';
    cancelVideoCallButton.style.display = 'none';
  }
  // Genesys widget listeners

  // 1.WebChat.opened || Registration Form form has opened
  window.CXBus.subscribe('WebChat.opened', hideVideoButton);

  // 2. WebChat.cancelled || WebChat.closed || Registration Form has been Closed or canceled
  window.CXBus.subscribe('WebChat.closed', showVideoButton);
  window.CXBus.subscribe('WebChat.cancelled', showVideoButton);

  /** 3. WebChat.started || handle the Call Placed Event event
 * (this means that user has submitted the Registration Form and the call is waiting to be picked by an agent) */
  window.CXBus.subscribe('WebChat.started', showVideoButton);

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
function getInputs () {
  const subject = document.getElementById('subjectInput').value;
  const nickName = document.getElementById('nickNameInput').value;
  const lastName = document.getElementById('lastNameInput').value;
  const firstName = document.getElementById('firstNameInput').value;
  return {
    subject,
    nickName,
    lastName,
    firstName
  };
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
    const form = getInputs();
    window.CXBus.command('Callback.open', {
      form: {
        autoSubmit: false,
        firstname: form.firstName,
        lastname: form.lastName,
        subject: form.subject
        // desiredTime: 'now',
      }
    }).done(function () {
      resolve();
    }).fail(function (err) {
      reject(err);
    });
  });
}
function startVideoCall () {
  return new Promise(function (resolve, reject) {
    const form = getInputs();
    window._genesys.widgets.videoengager.webChatFormData.firstname = form.firstName;
    window._genesys.widgets.videoengager.webChatFormData.lastname = form.lastName;
    window._genesys.widgets.videoengager.webChatFormData.nickname = form.nickName;
    window._genesys.widgets.videoengager.webChatFormData.subject = form.subject;
    window.CXBus.command('VideoEngager.startVideoEngager').done(function () {
      resolve();
    }).fail(function (err) {
      reject(err);
    });
  });
}
function startWebChat () {
  return new Promise(function (resolve, reject) {
    const form = getInputs();
    window.CXBus.command('WebChat.open', {
      form: {
        autoSubmit: false,
        firstname: form.firstName,
        lastname: form.lastName,
        subject: form.subject
        // desiredTime: 'now',
      }
    }).done(function () {
      resolve();
    }).fail(function (err) {
      reject(err);
    });
  });
}

loadLibraries();
