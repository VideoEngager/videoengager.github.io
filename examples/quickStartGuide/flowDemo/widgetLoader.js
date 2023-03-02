/**
 *
 * @param {string} url
 * @param {string} [id=undefined]
 * @returns {Promise<void>}
 */
function loadJSs (url, id) {
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
function fillAgentOptions () {
  const agentList = window.agentsList || [];
  const element = document.getElementById('select-ve');
  element.innerHTML = '<option selected value="">None</option>';

  for (const agent of agentList) {
    const option = document.createElement('option');
    option.value = agent.id;
    option.innerHTML = agent.name;
    element.appendChild(option);
  }
  element.disabled = false;
  try {
    window._genesys.widgets.webchat.userData.preferedAgent = undefined;
  } catch (e) {
    console.error(e);
  }
}
async function loadLibraries () {
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
    await loadLibrariesForFreshConfig();
    fillAgentOptions();
  } catch (error) {
    console.error('error - invalid URL ', error);
  }
}

async function loadLibrariesForFreshConfig () {
  /** Perform Loading Libraries */
  const env = (window._genesys.widgets.webchat.transport.dataURL || 'mypurecloud.com.au').replace('https://api', '');
  await loadJSs('https://apps' + env + '/widgets/9.0/cxbus.min.js');
  window.CXBus.configure({ debug: false, pluginsPath: `https://apps${env}/widgets/9.0/plugins/` });
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
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
    await waitVideoEngager();
  }).fail(function (err) {
    console.error('error', err);
  });
}
function waitVideoEngager () {
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
