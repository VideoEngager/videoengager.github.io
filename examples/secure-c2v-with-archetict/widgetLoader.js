/**
 *
 * @param {string} url
 * @param {string} [id=undefined]
 * @returns {Promise<void>}
 */
function loadJSs(url, id) {
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
}
function showError({ name, message }) {
  const errorElement = document.getElementById('error-container');
  const errorText = document.getElementById('error-text');
  errorText.innerHTML = name;
  const errorDescription = document.getElementById('error-description');
  errorDescription.innerHTML = message;
  errorElement.classList.remove('opacity-0');
  errorElement.classList.remove('-z-10');
  errorElement.classList.add('opacity-100');
  errorElement.classList.add('z-10');
}
function fillInformation() {
  const agentList = window.agentsList || [];
  const queryParams = new URLSearchParams(window.location.search);
  const agent = queryParams.get('agent') || 'Slav';
  const customerID = queryParams.get('customerID');
  const meetingID = queryParams.get('meetingID');
  const firstName = queryParams.get('fN') || 'Test';
  const lastName = queryParams.get('lN');
  const email = queryParams.get('email') || 'email';
  try {
    if (!customerID && !meetingID) {
      const err = new Error('customerID and meetingID is not defined in URL');
      err.name = 'Parameter Error';
      throw err;
    }
    if (!customerID) {
      const err = new Error('customerID is not defined in URL');
      err.name = 'Parameter Error';
      throw err;
    }
    if (!meetingID) {
      const err = new Error('meetingID is not defined in URL');
      err.name = 'Parameter Error';
      throw err;
    }
    if (!window._genesys.widgets.webchat.userData) {
      window._genesys.widgets.webchat.userData = {};
    }
    window._genesys.widgets.webchat.userData.preferedAgent = agentList.find((a) => a.name === agent).name;
    window._genesys.widgets.webchat.userData.customerID = customerID;
    window._genesys.widgets.webchat.userData.meetingID = meetingID;
    if (!window._genesys.widgets.videoengager.form) {
      window._genesys.widgets.videoengager.form = {};
    }
    window._genesys.widgets.videoengager.form.firstName = firstName;
    window._genesys.widgets.videoengager.form.lastName = lastName;
    window._genesys.widgets.videoengager.form.email = email;
    return true;
  } catch (e) {
    console.error(e);

    showError(e);
  }
}
function startCall() {
  window.CXBus.command('VideoEngager.startVideoEngager');
}
async function loadLibraries() {
  const url = new URL(window.location.href);

  const env = url.searchParams.get('env') || 'dev';
  await loadJSs('https://cdn.videoengager.com/videoengager/js/videoengager.widget.min.js');

  try {
    await loadJSs('configuration/' + env + '.js');
  } catch (error) {
    console.error(error);
    console.log('loading default configuration');
    await loadJSs('configuration/dev.js');
  }

  try {
    const informationFilled = fillInformation();
    if (!informationFilled) {
      throw new Error('Information is not filled Correctly');
    }
    await loadLibrariesForFreshConfig();
    console.log('$### start call');
    startCall();
  } catch (error) {
    console.error(error);
  }
}

async function loadLibrariesForFreshConfig() {
  /** Perform Loading Libraries */
  const env = (window._genesys.widgets.webchat.transport.dataURL || 'mypurecloud.com.au').replace('https://api', '');
  await loadJSs('https://apps' + env + '/widgets/9.0/cxbus.min.js');
  window.CXBus.configure({ debug: false, pluginsPath: `https://apps${env}/widgets/9.0/plugins/` });
  return new Promise((resolve, reject) => {
    window.CXBus.loadPlugin('widgets-core').done(async function () {
      window.CXBus.subscribe('WebChatService.started', function (e) {
        const element = document.getElementById('select-ve');
        element.disabled = true;
      });
      window.CXBus.subscribe('WebChatService.restored', () => {
        window.CXBus.command('WebChatService.endChat').then(() => {
          window.location.reload();
        });
        // window.localStorage.setItem('activeInteractionConfig', JSON.stringify(window._genesys.widgets));
      });
      window.CXBus.subscribe('WebChatService.ended', () => {
        // setTimeout(() => {
        //   window.location.reload();
        // }, 1000);
      });
      await Promise.all([waitVideoEngager(), waitForWebChat()]);
      resolve();
    }).fail(function (err) {
      reject(err);
      console.error('error', err);
    });
  });
}
function waitForWebChat() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('error', 'VideoEngager is not ready');
      reject(new Error('WebChat is not ready'));
    }, 30000);
    window.CXBus.subscribe('WebChatService.ready', function (e) {
      resolve(e);
      clearTimeout(timeout);
    });
  });
}
function waitVideoEngager() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('error', 'VideoEngager is not ready');
      reject(new Error('VideoEngager is not ready'));
    }, 30000);
    window.CXBus.subscribe('VideoEngager.ready', (event) => {
      console.log('call ready', event);
      resolve(event);
      clearTimeout(timeout);
    });
  });
}
loadLibraries();
