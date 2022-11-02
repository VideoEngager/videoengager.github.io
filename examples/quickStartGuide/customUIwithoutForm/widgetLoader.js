
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
  window.CXBus.subscribe('WebChatService.started', showVideoButton);

  // 4. WebChat.ended || handle call ended event
  window.CXBus.subscribe('WebChatService.ended', showVideoButton);

  // 5.WebChat.failed || handle call failed event
  window.CXBus.subscribe('WebChat.failed', function (err) {
    showVideoButton();
    console.error(err);
  });
  // 6. WebChatService.error || handle call failed event
  window.CXBus.subscribe('WebChatService.error', function (err) {
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
      window.CXBus.command('WebChatService.endChat');
    }
  }, false);
}
function validateFormInputs () {
  const reportValidity = document.forms.customForm.reportValidity();

  if (reportValidity) {
    return true;
  } else {
    throw new Error('Please fill all required fields');
  }
}
function getInputs () {
  validateFormInputs();
  const subject = document.getElementById('subjectInput').value;
  const nickName = document.getElementById('nickNameInput').value;
  const lastName = document.getElementById('lastNameInput').value;
  const firstName = document.getElementById('firstNameInput').value;
  const customField1 = document.getElementById('customField1').value;
  const customField2 = document.getElementById('customField2').value;
  return {
    subject,
    nickName,
    lastName,
    firstName,
    customField1,
    customField2
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
    window.CXBus.command('WebChatService.endChat');
  });
}

function startCallback () {
  return new Promise(function (resolve, reject) {
    const form = getInputs();
    window.CXBus.command('Callback.open', {
      form: {
        autoSubmit: true,
        firstname: form.firstName,
        lastname: form.lastName,
        subject: form.subject
        // desiredTime: 'now',
      },
      userData: {
        customField1: form.customField1,
        customField1Label: 'Custom Field 1 Label',
        customField2: form.customField2,
        customField2Label: 'Custom Field 2 Label'
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
    window._genesys.widgets.videoengager.webChatFormData.userData = {
      customField1: form.customField1,
      customField1Label: 'Custom Field 1 Label',
      customField2: form.customField2,
      customField2Label: 'Custom Field 2 Label'
    };
    // handling different Queue name for video Call
    window._genesys.widgets.webchat.transport.interactionData.routing.targetAddress = window._genesys.widgets.videoengager.transport.interactionData.routing.targetAddressVideo;
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
    // handling different Queue name for Chat Call
    window._genesys.widgets.webchat.transport.interactionData.routing.targetAddress = window._genesys.widgets.videoengager.transport.interactionData.routing.targetAddressChat;
    window.CXBus.command('WebChatService.startChat', {
      form: {
        autoSubmit: true,
        firstname: form.firstName,
        lastname: form.lastName,
        subject: form.subject,
        email: 'mamoun@saasd.com'
      },
      userData: {
        customField1: form.customField1,
        customField1Label: 'Custom Field 1 Label',
        customField2: form.customField2,
        customField2Label: 'Custom Field 2 Label'
      }
    }).done(function () {
      resolve();
    }).fail(function (err) {
      reject(err);
    });
  });
}

loadLibraries();
