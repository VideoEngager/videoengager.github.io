/* global XMLHttpRequest CXBus  */
const widgetBaseUrl = 'https://apps.mypurecloud.de/widgets/9.0/';
const videoengagerWidgetCDN = 'https://cdn.videoengager.com/videoengager/js/1.02/videoengager.widget.js';
const videoengagerWidgetCSSCDN = 'https://cdn.videoengager.com/examples/css/genesys-selector-wtih-callback.css';

let genesysEnvList = [
  'mypurecloud.com.au',
  'mypurecloud.com',
  'use2.us-gov-pure.cloud',
  'usw2.pure.cloud',
  'cac1.pure.cloud',
  'mypurecloud.de',
  'mypurecloud.ie',
  'euw2.pure.cloud',
  'aps1.pure.cloud',
  'apne2.pure.cloud',
  'mypurecloud.jp'
];

/**
 * Asynchronously retrieves the environment configuration for Genesys Cloud.
 * Fetches a JavaScript file, parses its content, and extracts the necessary data.
 * @returns {Promise<void>}
 */
async function retrieveEnvironmentList () {
  try {
    // Check if eval is available in the environment
    if (typeof eval === 'undefined') {
      throw new Error('eval is not defined');
    }

    // Fetch the JavaScript file from the CDN
    const response = await fetch('https://cdn.jsdelivr.net/gh/MyPureCloud/platform-client-sdk-javascript@latest/build/src/purecloud-platform-client-v2/PureCloudRegionHosts.js');

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to retrieve Genesys object');
    }

    // Retrieve the text content of the response
    const text = await response.text();

    // Format the text to be a valid JavaScript object string
    const objectString = text.replace('export default', '').replace(';', '');

    // Use eval to parse the string into a JavaScript object
    const parsedData = eval(`"use strict";(${objectString})`);

    // Extract the values from the parsed object
    const newData = Object.values(parsedData);

    // Assign the extracted data to a global variable (consider avoiding global variables)
    genesysEnvList = newData;
  } catch (e) {
    console.error('Error retrieving Genesys environment object', e);
  }
}

/** *  MAIN FUNCTION * **/

// on document ready
document.addEventListener('DOMContentLoaded', async function (e) {
  // [UI] fill environment dropdown
  await retrieveEnvironmentList();
  // [UI] fill genesys url dropdown
  fillDataURLDropdown();
  // [UI] set quick environment configuration
  // use url param if exist
  // otherwise use local storage if exist
  fillEnvironmentParameters();

  const scriptElement = document.createElement('link');
  scriptElement.setAttribute('type', 'text/css');
  scriptElement.setAttribute('rel', 'stylesheet');
  scriptElement.setAttribute('href', videoengagerWidgetCSSCDN);
  document.head.append(scriptElement);

  // 1- load cxbus
  await loadJS(widgetBaseUrl + 'cxbus.min.js');
  CXBus.configure({ debug: true, pluginsPath: widgetBaseUrl + 'plugins/' });
  // 2- load video engager
  await loadJS(videoengagerWidgetCDN);
  // 3- load config
  await loadJS('./js/general.config.js');

  // load genesys library on button click (genesys library will run on load)
  document.querySelector('#loadGenesysLib').addEventListener('click', async function (e) {
    const uimode = document.querySelector('input[name="ui_mode"]:checked').value;
    // apply demo mode configurations
    await loadJS('./js/' + uimode + '.config.js');
    // read config from UI
    setConfig(uimode);
    // set ve config
    setVeConfig();
    // set genesys options
    setGenesysOption(uimode);
    // dump configuration json
    dumpJSON();
    // 4- load genesys widgets library
    CXBus.loadPlugin('widgets-core').done(function () {
      setUIHandlers();
    });
  });
});

/** *  HELPER FUNCTIONS * **/

const fillDataURLDropdown = function () {
  for (const env of genesysEnvList) {
    const option = document.createElement('option');
    option.value = 'https://api.' + env;
    option.text = env;
    document.querySelector('#dataURL').appendChild(option);
  }
};

/**
 * get given json configuration file as json object
 * @param {string} path configuration file path
 */
const loadJSON = function (path) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(xhr);
          }
        } else {
          reject(xhr);
        }
      }
    };
    xhr.onerror = reject;
    xhr.open('GET', path, true);
    xhr.send();
  });
};

const fillEnvironmentParameters = async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const envPath = urlParams.get('env'); // environment parameter EX: prod, staging, dev

  if (envPath) {
    const envConfig = await loadJSON('./config/' + envPath + '.json');
    document.querySelector('#targetAddress').value = envConfig.en.targetAddress;
    document.querySelector('#orgGuid').value = envConfig.en.orgGuid;
    document.querySelector('#deploymentKey').value = envConfig.en.deploymentKey;
    document.querySelector('#veUrl').value = envConfig.en.veUrl;
    document.querySelector('#tenantId').value = envConfig.en.tenantId;
    document.querySelector('#dataURL').selectedIndex = genesysEnvList.indexOf(envConfig.en.dataURL.substring(12));
  } else if (window.localStorage && window.localStorage.getItem('envConf') === 'true') {
    document.querySelector('#targetAddress').value = window.localStorage.getItem('targetAddress');
    document.querySelector('#orgGuid').value = window.localStorage.getItem('orgGuid');
    document.querySelector('#deploymentKey').value = window.localStorage.getItem('deploymentKey');
    document.querySelector('#veUrl').value = window.localStorage.getItem('veUrl');
    document.querySelector('#tenantId').value = window.localStorage.getItem('tenantId');
    document.querySelector('#dataURL').selectedIndex = window.localStorage.getItem('dataURL');
  }

  // set listener for save and clear buttons
  document.querySelector('#saveConf').addEventListener('click', async function (e) {
    window.localStorage.setItem('envConf', 'true');
    window.localStorage.setItem('targetAddress', document.querySelector('#targetAddress').value);
    window.localStorage.setItem('orgGuid', document.querySelector('#orgGuid').value);
    window.localStorage.setItem('deploymentKey', document.querySelector('#deploymentKey').value);
    window.localStorage.setItem('veUrl', document.querySelector('#veUrl').value);
    window.localStorage.setItem('tenantId', document.querySelector('#tenantId').value);
    window.localStorage.setItem('dataURL', document.querySelector('#dataURL').selectedIndex);
  });

  document.querySelector('#clearConf').addEventListener('click', async function (e) {
    window.localStorage.removeItem('envConf');
    window.localStorage.removeItem('targetAddress');
    window.localStorage.removeItem('orgGuid');
    window.localStorage.removeItem('deploymentKey');
    window.localStorage.removeItem('veUrl');
    window.localStorage.removeItem('tenantId');
    window.localStorage.removeItem('dataURL');

    document.querySelector('#targetAddress').value = '';
    document.querySelector('#orgGuid').value = '';
    document.querySelector('#deploymentKey').value = '';
    document.querySelector('#veUrl').value = '';
    document.querySelector('#tenantId').value = '';
    document.querySelector('#dataURL').selectedIndex = '-1';
  });
};

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

const dumpJSON = function () {
  let text = JSON.stringify(window._genesys.widgets, null, 2);
  text = text.replace('"extensions": {}', 'extensions: { VideoEngager: videoEngager.initExtension }');
  text = 'window._genesys.widgets = ' + text;
  text = `
  if (!window._genesys) window._genesys = {};
  if (!window._gt) window._gt = [];
  ` + text;
  document.querySelector('#jsondump').innerHTML = text;
};

/**
 * listener will triggered when agent picked video call up
 */
const setVideoCallStartedListener = function () {
  const messageHandler = function (e) {
    console.log('messageHandler', e.data);
    if (e.data && e.data.type === 'CallStarted') {
      console.log('video call started');
    }
    if (e.data && e.data.type === 'popupClosed') {
      console.log('video popup closed');
      CXBus.command('WebChatService.endChat');
    }
  };
  if (window.addEventListener) {
    window.addEventListener('message', messageHandler, false);
  } else {
    window.attachEvent('onmessage', messageHandler);
  }
};

/**
 * set given genesys keys and videoengager parameters if exist
 * @param {object} config
 * @returns
 */
const setConfig = async function (uimode) {
  // tenant ID
  window._genesys.widgets.videoengager.tenantId = document.querySelector('#tenantId').value;
  window._genesys.widgets.videoengager.veUrl = document.querySelector('#veUrl').value;
  window._genesys.widgets.webchat.transport.dataURL = document.querySelector('#dataURL').value;
  window._genesys.widgets.webchat.transport.deploymentKey = document.querySelector('#deploymentKey').value;
  window._genesys.widgets.webchat.transport.orgGuid = document.querySelector('#orgGuid').value;
  window._genesys.widgets.webchat.transport.interactionData.routing.targetAddress = document.querySelector('#targetAddress').value;
  if (uimode !== 'singlebutton') {
    window._genesys.widgets.callback.dataURL = document.querySelector('#veUrl').value + '/api/genesys/callback';
    window._genesys.widgets.callback.ewt.queue = document.querySelector('#targetAddress').value;
    window._genesys.widgets.callback.userData.environment = document.querySelector('#dataURL').value;
  }
};

const setGenesysOption = function (uimode) {
  if (uimode !== 'singlebutton') {
    window._genesys.widgets.calendar.showAvailability = document.querySelector('#showAvailability').checked;
    window._genesys.widgets.calendar.numberOfDays = Number(document.querySelector('#numberOfDays').value) || 5;
    window._genesys.widgets.calendar.hideUnavailableTimeSlots = document.querySelector('#hideUnavailableTimeSlots').checked;
    window._genesys.widgets.calendar.calendarHours.interval = Number(document.querySelector('#interval').value) || 15;
    window._genesys.widgets.calendar.calendarHours.allDay.openTime = document.querySelector('#openTime').value;
    window._genesys.widgets.calendar.calendarHours.allDay.closeTime = document.querySelector('#closeTime').value;

    window._genesys.widgets.callback.countryCodes = document.querySelector('#countryCodes').checked;
    window._genesys.widgets.callback.scheduledCallback = document.querySelector('#scheduledCallback').checked;
    window._genesys.widgets.callback.immediateCallback = document.querySelector('#immediateCallback').checked;
  }
  window._genesys.widgets.webchat.confirmFormCloseEnabled = document.querySelector('#confirmFormCloseEnabled').checked;
};

const setVeConfig = function () {
  window._genesys.widgets.videoengager.audioOnly = document.querySelector('#audioOnly').checked;
  window._genesys.widgets.videoengager.autoAccept = document.querySelector('#autoAccept').checked;
  window._genesys.widgets.videoengager.enablePrecall = document.querySelector('#enablePrecall').checked;
  window._genesys.widgets.videoengager.useWebChatForm = document.querySelector('#useWebChatForm').checked;
  window._genesys.widgets.videoengager.extraAgentMessage = document.querySelector('#extraAgentMessage').value;
  window._genesys.widgets.videoengager.dialCountryCode = document.querySelector('#dialCountryCode').value;

  window._genesys.widgets.videoengager.webChatFormData.nickname = document.querySelector('#nickname').value;
  window._genesys.widgets.videoengager.webChatFormData.firstname = document.querySelector('#firstname').value;
  window._genesys.widgets.videoengager.webChatFormData.lastname = document.querySelector('#lastname').value;
  window._genesys.widgets.videoengager.webChatFormData.subject = document.querySelector('#subject').value;

  window._genesys.widgets.videoengager.enableCalendarAPI = document.querySelector('#enableCalendarAPI').checked;
  try {
    window._genesys.widgets.videoengager.webChatFormData.userData = JSON.parse(document.querySelector('#customUserData').value);
  } catch (e) {
    document.querySelector('#customUserData').value += ' ERROR';
  }
};

const setUIHandlers = function () {
  document.querySelector('#startVideoCall').addEventListener('click', function () {
    CXBus.command('VideoEngager.startVideoEngager');
    document.getElementById('stopVideoCall').style.display = 'block';
  });
  document.querySelector('#stopVideoCall').addEventListener('click', function () {
    CXBus.command('VideoEngager.endCall');
  });

  CXBus.subscribe('WebChatService.ended', function () {
    console.log('Interaction Ended');
    document.getElementById('stopVideoCall').style.display = 'none';
  });

  CXBus.subscribe('WebChatService.started', function () {
    console.log('Interaction started');
    document.getElementById('stopVideoCall').style.display = 'block';
  });

  CXBus.subscribe('WebChatService.restored', function (e) {
    console.error('Chat restored, cleaning it' + JSON.stringify(e));
    CXBus.command('WebChatService.endChat');
    document.getElementById('stopVideoCall').style.display = 'none';
  });

  CXBus.subscribe('WebChatService.error', function (e) {
    // Log the error and continue
    console.error('WebService error' + JSON.stringify(e));
  });

  setVideoCallStartedListener();
};
