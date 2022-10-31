
function loadLibraries () {
  window.CXBus.configure({ debug: true, pluginsPath: 'https://apps.mypurecloud.com/widgets/9.0/plugins/' });
  window.CXBus.loadPlugin('widgets-core').done(function () {
    startButtonsListeners();
  });
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
