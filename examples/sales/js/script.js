/* global XMLHttpRequest CXBus mdb console $ bootstrap introJs */
const widgetBaseUrl = 'https://apps.mypurecloud.de/widgets/9.0/';
const videoengagerWidgetCDN = 'https://cdn.videoengager.com/videoengager/js/1.02/videoengager.widget.min.js';
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
const requiredFieldsCheck = function () {
  let unfilledInputId;

  document.querySelectorAll('input.form-control,#dataURL').forEach(input => {
    if (!input.value && !unfilledInputId) {
      unfilledInputId = input.id;
    }
  });

  return unfilledInputId;
};

const validateInputsFormat = function () {
  const urlRegex = /^(https?):\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const orgGuidElement = document.getElementById('orgGuid');
  const deploymentIdElement = document.getElementById('deploymentKey');
  const veUrlElement = document.getElementById('veUrl');

  const orgGuidValid = regex.test(orgGuidElement.value);
  const deploymentIdValid = regex.test(deploymentIdElement.value);

  const invalidIds = [];

  if (!orgGuidValid) {
    invalidIds.push(orgGuidElement.id);
  }

  if (!deploymentIdValid) {
    invalidIds.push(deploymentIdElement.id);
  }

  if (!urlRegex.test(veUrlElement.value)) {
    invalidIds.push(veUrlElement.id);
  }

  return invalidIds;
};

function checkInputs () {
  const inputs = document.querySelectorAll('input.form-control,#dataURL');
  const button = document.getElementById('loadGenesysLib');

  let allInputsFilled = true;

  inputs.forEach(input => {
    if (input.value.trim() === '') {
      input.classList.add('input-error');
      allInputsFilled = false;
    } else {
      input.classList.remove('input-error');
    }
  });

  button.disabled = !allInputsFilled;
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
    const unfilledInputId = requiredFieldsCheck();
    if (unfilledInputId) {
      showToastError(`Field corresponding to selector #${unfilledInputId} is empty!`, 'Please fill all the inputs!');
      return;
    }
    const invalidIds = validateInputsFormat();
    if (invalidIds.length > 0) {
      showToastError(`Field corresponding to selector #${invalidIds.join(', #')} is invalid!`, 'Please check the inputs!');
      return;
    }

    // disable all inputs
    document.querySelectorAll('input.form-control,#dataURL').forEach(input => {
      input.setAttribute('disabled', true);
    });

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
      const content = document.getElementById('jsondump').textContent || document.getElementById('jsondump').innerText;
      download(new Date().getTime() + 'widgetconfig.js', content);
    });
    document.querySelector('#downloadtamper').addEventListener('click', async function (e) {
      const content = document.getElementById('tampermonkeydump').textContent || document.getElementById('tampermonkeydump').innerText;
      download(new Date().getTime() + 'tampermonkey.js', content);
    });
  });
  document.getElementById('refreshPage').addEventListener('click', function () {
    window.location.reload();
  });
  checkInputs();
  // Check the inputs every time they change
  $('input.form-control,#dataURL').on('input', function () {
    checkInputs();
  });

  introJs().setOptions({
    dontShowAgain: true,
    steps: [
      {
        intro: "Welcome to the VideoEngager Genesys Widget Demo! Let's take a quick tour."
      },
      {
        element: '#collapseOne',
        intro: 'Configuring SDKs: All fields are required and are specific to your organization. Visit <a href="https://help.videoengager.com/hc/en-us/articles/360061175891-How-to-obtain-my-Genesys-Cloud-Parameters-required-to-setup-SmartVideo-SDKs" target="_blank">help</a> for more information.',
        position: 'right'
      },
      {
        element: '#saveConf',
        intro: 'Once all the fields are completed, save them locally so that the settings can be reused the next time you load the page.'
      },
      {
        element: '#ui_mode',
        intro: 'Choose the preferred UI mode for the demonstration.'
      },
      {
        element: '#loadGenesysLib',
        intro: 'Once the UI mode is selected, click <b>Load Widget</b> to load SmartVideo and Genesys libraries. The page is now ready for demonstrations.'
      },
      {
        element: '#refreshPage',
        intro: 'To change the UI mode or parameters, the page must be reloaded by pressing the <b>Refresh</b> button.'
      },

      {
        element: '#jsonAccordeon',
        intro: 'Users have the option to download the demo configuration or the Tampermonkey script, both ready for use on customer pages. Additional information is available through the provided help links.'
      }
    ]
  }).start();
});

/** *  HELPER FUNCTIONS * **/

const fillDataURLDropdown = function () {
  for (const env of genesysEnvList) {
    const option = document.createElement('option');
    option.value = 'https://api.' + env;
    option.text = env;
    document.querySelector('#dataURL').appendChild(option);
    document.querySelector('#dataURL').selectedIndex = -1;
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
  checkInputs();
  // set listener for save and clear buttons
  document.querySelector('#saveConf').addEventListener('click', async function (e) {
    const unfilledInputId = requiredFieldsCheck();
    if (unfilledInputId) {
      showToastError(`Field corresponding to selector #${unfilledInputId} is empty!`, 'Please fill all the inputs!');
      return;
    }
    const invalidIds = validateInputsFormat();
    if (invalidIds.length > 0) {
      showToastError(`Field corresponding to selector #${invalidIds.join(', #')} is invalid!`, 'Please check the inputs!');
      return;
    }
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
    checkInputs();
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
    singlebutton = `
    var fixedButton = document.createElement('div');
    fixedButton.id = "startVideoCall";
    fixedButton.className = "ve-floating-button";
    fixedButton.addEventListener('click', function () {
      CXBus.command('VideoEngager.startVideoEngager');
      $('#startVideoCall').addClass('spinner');
    });
    CXBus.subscribe('WebChatService.ended', function () {
      $('#startVideoCall').removeClass('spinner');
    });
    CXBus.subscribe('WebChatService.started', function () {
      $('#startVideoCall').addClass('spinner');
    });
    CXBus.subscribe('WebChatService.restored', function () {
      $('#startVideoCall').removeClass('spinner');
    });
    document.body.appendChild(fixedButton);
    const setVideoCallStartedListener = function () {
      let endcallDebounce = false;
      const debouncedAnswer = function () {
        if (!endcallDebounce) {
          console.log('Calling EndChat CXBUS Command');
          CXBus.command('WebChatService.endChat');
          endcallDebounce = true;
          setTimeout(function () {
            endcallDebounce = false;
          }, 1000);
        }
      };
      const messageHandler = function (e) {
        console.log('messageHandler', e.data);
        if (e.data && e.data.type === 'CallStarted') {
          console.log('video call started');
        }
        if (e.data && e.data.type === 'popupClosed') {
          console.log('video popup closed');
          debouncedAnswer();
        }
      };
      if (window.addEventListener) {
        window.addEventListener('message', messageHandler, false);
        window.addEventListener('VideoEngagerError', debouncedAnswer);
      } else {
        window.attachEvent('onmessage', messageHandler);
        window.attachEvent('VideoEngagerError', debouncedAnswer);
      }
      window.addEventListener('VideoEngagerError', function () {
        debouncedAnswer();
      })
    };
    setVideoCallStartedListener();
    `;
  }
  const template = `// ==UserScript==
  // @name         Videoengager Tampermonkey Script
  // @namespace    http://tampermonkey.net/
  // @version      0.1
  // @description  Genesys Widget Demo
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

    const widgetBaseUrl = 'https://apps.mypurecloud.de/widgets/9.0/';
    const videoengagerWidget = 'https://videoengager.github.io/videoengager/js/videoengager.widget.js';
    const videoengagerWidgetCSSCDN = 'https://cdn.videoengager.com/examples/css/genesys-selector-wtih-callback.css';
    const buttonStyle = 'https://videoengager.github.io/examples/sales2/style.css';

    // styling files are loaded
    loadCSS('https://videoengager.github.io/widgets.min.css');
    loadCSS(videoengagerWidgetCSSCDN);
    loadCSS(buttonStyle);
    // videoengager library
    // 1- load cxbus
    await loadJS(widgetBaseUrl + 'cxbus.min.js');
    CXBus.configure({ debug: true, pluginsPath: widgetBaseUrl + 'plugins/' });
    // 2- load video engager
    await loadJS(videoengagerWidget);
    // 3- load config
    ${config}
    CXBus.loadPlugin('widgets-core');
    ${singlebutton}
  })();`;
  const elem = document.getElementById('tampermonkeydump');
  elem.innerHTML = template;
  window.hljs.highlightElement(elem);
};

let endcallDebounce = false;
const debouncedAnswer = function () {
  if (!endcallDebounce) {
    console.log('Calling EndChat CXBUS Command');
    CXBus.command('WebChatService.endChat');
    endcallDebounce = true;
    setTimeout(function () {
      endcallDebounce = false;
    }, 1000);
  }
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
      debouncedAnswer();
    }
  };
  if (window.addEventListener) {
    window.addEventListener('message', messageHandler, false);
  } else {
    window.attachEvent('onmessage', messageHandler);
  }
};

const sanitizeInput = (selector) => {
  const element = document.querySelector(selector);
  if (element && typeof element.value === 'string') {
    return element.value.trim(); // Remove leading and trailing spaces.
  }
  return ''; // Default fallback.
};

const showToastError = function (message, title = 'Error') {
  // Clone the template toast
  const toastTemplate = document.querySelector('#errorToast');
  const toastClone = toastTemplate.cloneNode(true);

  // Add the error message
  toastClone.querySelector('.toast-body').textContent = message;
  toastClone.querySelector('.me-auto').textContent = title;

  // Append the cloned toast to the toast container
  const toastContainer = document.querySelector('#toastContainer');
  toastContainer.appendChild(toastClone);

  // Use Bootstrap's toast API to show the toast
  const toast = new bootstrap.Toast(toastClone);
  toast.show();

  // Remove the toast element from the DOM after it's hidden
  toastClone.addEventListener('hidden.bs.toast', function () {
    toastClone.remove();
  });
  // sctoll to top
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

const setConfig = async function (uimode) {
  window._genesys.widgets.videoengager.tenantId = sanitizeInput('#tenantId');
  window._genesys.widgets.videoengager.veUrl = sanitizeInput('#veUrl');
  window._genesys.widgets.webchat.transport.dataURL = sanitizeInput('#dataURL');
  window._genesys.widgets.webchat.transport.deploymentKey = sanitizeInput('#deploymentKey');
  window._genesys.widgets.webchat.transport.orgGuid = sanitizeInput('#orgGuid');
  window._genesys.widgets.webchat.transport.interactionData.routing.targetAddress = sanitizeInput('#targetAddress');

  if (uimode !== 'singlebutton') {
    window._genesys.widgets.callback.dataURL = `${sanitizeInput('#veUrl')}/api/genesys/callback`;
    window._genesys.widgets.callback.ewt.queue = sanitizeInput('#targetAddress');
    window._genesys.widgets.callback.userData.environment = sanitizeInput('#dataURL');
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
    $('#startVideoCall').addClass('spinner');
  });
  document.querySelector('#stopVideoCall').addEventListener('click', function () {
    CXBus.command('VideoEngager.endCall');
  });

  CXBus.subscribe('WebChatService.ended', function () {
    console.log('Interaction Ended');
    document.getElementById('stopVideoCall').style.display = 'none';
    $('#startVideoCall').removeClass('spinner');
  });

  CXBus.subscribe('WebChatService.started', function () {
    console.log('Interaction started');
    // document.getElementById('stopVideoCall').style.display = 'block';
    $('#startVideoCall').addClass('spinner');
  });

  CXBus.subscribe('WebChatService.restored', function (e) {
    console.error('Chat restored, cleaning it' + JSON.stringify(e));
    CXBus.command('WebChatService.endChat');
    document.getElementById('stopVideoCall').style.display = 'none';
    $('#startVideoCall').removeClass('spinner');
  });

  CXBus.subscribe('WebChatService.error', function (e) {
    // Log the error and continue
    console.error('WebService error' + JSON.stringify(e));
    showToastError(e?.data?.errors[0]?.response?.responseJSON?.message);
  });

  // custom videoengager error
  CXBus.subscribe('VideoEngager.error', function (e) {
    e?.data?.data?.responseJSON?.error && showToastError(e?.data?.data?.responseJSON?.error, 'Callback Error');
  });

  setVideoCallStartedListener();
};
