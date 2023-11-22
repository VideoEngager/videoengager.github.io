/* global XMLHttpRequest CXBus mdb $ */
const widgetBaseUrl = 'https://apps.mypurecloud.de/widgets/9.0/';
const videoengagerWidgetCDN = 'https://cdn.videoengager.com/videoengager/js/1.02/videoengager.widget.js';
const videoengagerWidgetCSSCDN = 'https://cdn.videoengager.com/examples/css/genesys-selector-wtih-callback.css';
const BOOTSTRAP_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/4.3.0/mdb.min.js';
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
  // [UI] fill environment list
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
    // dump configuration json
    dumpJSON();
    // dump tampermonkey script
    dumpTamper(uimode);
    // 4- load genesys widgets library
    CXBus.loadPlugin('widgets-core').done(function () {
      setUIHandlers();
    });
    $('#loadGenesysLib').attr('disabled', true);
    $('#jsondumpbutton').attr('disabled', false);
    $('#tampermonkeybutton').attr('disabled', false);

    document.querySelector('#downloadjson').addEventListener('click', async function (e) {
      download('jsonScript.js', document.getElementById('jsondump').value);
    });
    document.querySelector('#downloadtamper').addEventListener('click', async function (e) {
      download('tampermonkey.js', document.getElementById('tempermonkeydump').value);
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
    $('#collapseOne').removeClass('show');
  } else if (window.localStorage && window.localStorage.getItem('envConf') === 'true') {
    document.querySelector('#targetAddress').value = window.localStorage.getItem('targetAddress');
    document.querySelector('#orgGuid').value = window.localStorage.getItem('orgGuid');
    document.querySelector('#deploymentKey').value = window.localStorage.getItem('deploymentKey');
    document.querySelector('#veUrl').value = window.localStorage.getItem('veUrl');
    document.querySelector('#tenantId').value = window.localStorage.getItem('tenantId');
    document.querySelector('#dataURL').selectedIndex = window.localStorage.getItem('dataURL');
    $('#collapseOne').removeClass('show');
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

  document.querySelectorAll('.form-outline').forEach((formOutline) => {
    new mdb.Input(formOutline).init();
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
  const elem = document.getElementById('jsondump');
  elem.innerHTML = text;
  window.hljs.highlightElement(elem);
};

const dumpTamper = function (uimode) {
  let config = JSON.stringify(window._genesys.widgets, null, 2);
  config = config.replace('"extensions": {}', 'extensions: { VideoEngager: videoEngager.initExtension }');
  config = 'window._genesys.widgets = ' + config;
  config = `if (!window._genesys) window._genesys = {};
  if (!window._gt) window._gt = [];
  ` + config;
  let singlebutton = '';
  if (uimode === 'singlebutton') {
    singlebutton = `    // insert fixed button
    var fixedButton = document.createElement('button');
    fixedButton.style.cssText = 'position: fixed;width: 100px;height: 50px;z-index: 100;bottom: 10px;right: 10px;';
    fixedButton.id = "startVideoCall";
    fixedButton.innerText = "Start Video Call";
    fixedButton.addEventListener("click", function () {CXBus.command('VideoEngager.startVideoEngager');});
    document.body.appendChild(fixedButton);`;
  }
  const template = `// ==UserScript==
  // @name         callback staging
  // @namespace    http://tampermonkey.net/
  // @version      0.1
  // @description  try to take over the world!
  // @author       You
  // @match        https://www.videoengager.com/
  // @icon         https://www.google.com/s2/favicons?domain=videoengager.com
  // @grant        none
  // ==/UserScript==
  
  (async function () {
    // helper function to load external resources
    const loadCSS = function (url) {
      const scriptElement = document.createElement('link');
      scriptElement.setAttribute('type', 'text/css');
      scriptElement.setAttribute('rel', 'stylesheet');
      scriptElement.setAttribute('href', url);
      document.head.append(scriptElement);
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

    ${singlebutton}

    const widgetBaseUrl = 'https://apps.mypurecloud.de/widgets/9.0/';
    const videoengagerWidget = 'https://videoengager.github.io/videoengager/js/videoengager.widget.js';
    const videoengagerWidgetCSSCDN = 'https://cdn.videoengager.com/examples/css/genesys-selector-wtih-callback.css';
  
    // styling files are loaded
    loadCSS('https://videoengager.github.io/widgets.min.css');
    loadCSS(videoengagerWidgetCSSCDN);
    // videoengager library
    // 1- load cxbus
    await loadJS(widgetBaseUrl + 'cxbus.min.js');
    CXBus.configure({ debug: true, pluginsPath: widgetBaseUrl + 'plugins/' });
    // 2- load video engager
    await loadJS(videoengagerWidget);
    // 3- load config
    ${config}
    CXBus.loadPlugin('widgets-core');
  })();`;
  const elem = document.getElementById('tempermonkeydump');
  elem.innerHTML = template;
  window.hljs.highlightElement(elem);
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

function download (filename, text) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

const setUIHandlers = function () {
  document.querySelector('#startVideoCall').addEventListener('click', function () {
    CXBus.command('VideoEngager.startVideoEngager');
    // document.getElementById('stopVideoCall').style.display = 'block';
    $('.fa-video').addClass('fa-spin');
  });
  document.querySelector('#stopVideoCall').addEventListener('click', function () {
    CXBus.command('VideoEngager.endCall');
  });

  CXBus.subscribe('WebChatService.ended', function () {
    console.log('Interaction Ended');
    document.getElementById('stopVideoCall').style.display = 'none';
    $('.fa-video').removeClass('fa-spin');
  });

  CXBus.subscribe('WebChatService.started', function () {
    console.log('Interaction started');
    // document.getElementById('stopVideoCall').style.display = 'block';
    $('.fa-video').addClass('fa-spin');
  });

  CXBus.subscribe('WebChatService.restored', function (e) {
    console.error('Chat restored, cleaning it' + JSON.stringify(e));
    CXBus.command('WebChatService.endChat');
    document.getElementById('stopVideoCall').style.display = 'none';
    $('.fa-video').removeClass('fa-spin');
  });

  CXBus.subscribe('WebChatService.error', function (e) {
    // Log the error and continue
    console.error('WebService error' + JSON.stringify(e));
  });

  setVideoCallStartedListener();
};
