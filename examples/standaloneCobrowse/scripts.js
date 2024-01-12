/* eslint-disable indent */
/* eslint-disable no-console */
/* globals VEHelpers, veCobrowse */

(async function () {
  const parameters = {
    staging: {
      veUrl: 'https://staging.leadsecure.com',
      tenantId: 'oIiTR2XQIkb7p0ub'
    },
    dev: {
      veUrl: 'https://dev.videoengager.com',
      tenantId: 'eZD5WoDwpgwSu0q8'
    },
    prod: {
      veUrl: 'https://videome.leadsecure.com',
      tenantId: 'Xh6at3QenNopCTcP'
    },
    local: {
      veUrl: 'http://localhost:9000',
      tenantId: 'test_tenant'
    },
    canary: {
      veUrl: 'http://canary.leadsecure.com',
      tenantId: ''
    }
  };

  const showForSeconds = function (selector, message, seconds) {
    try {
      const element = document.querySelector(selector);
      element.innerHTML = message;
      element.style.display = 'block';
      setTimeout(function () {
        element.style.display = 'none';
      }, seconds * 1000);
    } catch (e) {
      console.error(e);
    }
  };

  const showInfoMessage = function (message) {
    showForSeconds('#info-message', message, 3);
  };

  const showErrorMessage = function (message) {
    showForSeconds('#error-message', message, 3);
  };

  /**
    * Helper function to show or hide input form to demonstrate cobrowse
   */
  const setState = function (text) {
    if (text) {
      document.querySelector('#explanation-text').style.display = 'none';
      document.querySelector('#form').style.display = 'block';
      document.querySelector('#demo-state').innerHTML = text;
    } else {
      document.querySelector('#explanation-text').style.display = 'block';
      document.querySelector('#form').style.display = 'none';
    }
  };

  /*
    * Main function to initialize cobrowse
  */
  const main = async function () {
    try {
      if (!window.veCobrowse) {
        console.error('veCobrowse is not defined');
        return;
      }
      if (veCobrowse.initialized) {
        console.error('veCobrowse is already initialized');
        return;
      }
      // get config from #tenantId and #veUrl
      const veUrl = document.querySelector('#veUrl').value;
      const tenantId = document.querySelector('#tenantId').value;
      // VEHelpers provides UI do demo cobrowse
      await VEHelpers.requireAsync('https://videoengager.github.io/videoengager/uilib/styles.css');
      await VEHelpers.requireAsync('https://videoengager.github.io/videoengager/uilib/veCobrowse.js');
      await VEHelpers.documentLoaded();
      // set ui with ui handler
      const UI = VEHelpers.UIHandler({ click2video: false, veCobrowse: true, veIframe: false });
      // setup ve cobrowse
      await veCobrowse.init(veUrl, tenantId, {
        initialized: function () {
          setState('Cobrowse is initialized!');
        },
        on: function (event, data) {
          if (event === 'session.created') {
            setState('Cobrowse is session Created!');
            return;
          }
          // you will have sessionCode and sessionId
          // on session.started and session.authorizing and session.ended events
          const { sessionCode, id: sessionId } = data;
          console.log('pin: ', sessionCode, ' id: ', sessionId);

          if (event === 'session.ended') {
            UI.setCobrowseEnded();
            document.querySelector('#form').style.display = 'none';
            setState('CoBrose session is Ended! But cobrose is still initialized...');
          }
          if (event === 'session.started') {
            UI.setCobrowseStarted();
            document.querySelector('#form').style.display = 'block';
            setState('CoBrowse Started!');
          }
          if (event === 'session.authorizing') {
            setState('Waiting for authorization!');
          }
        },
        error: function (error, state) {
          console.error('veCobrowse: error while ', state, ': ', error.toString());
          switch (state) {
            case 'createCobrowseSession':
              UI.showVENotification('Error: Cannot Create Session!');
              break;
            case 'startCobrowse':
              UI.showVENotification('Error: Cannot Start Cobrowse');
              break;
            case 'stopCobrowse':
              UI.showVENotification('Error: Cobrowse is not stopped!');
              break;
            case 'init':
              document.querySelector('#ve-start-cobrowse').style.backgroundColor = 'gray';
              UI.showVENotification('Error: Cannot initialize cobrowse! Check your settings.');
              break;
            case 'getSettings':
              document.querySelector('#ve-start-cobrowse').style.backgroundColor = 'gray';
              UI.showVENotification('Error: Cannot get settings! Check your parameters.');
              break;
            default:
              UI.showVENotification('Error');
              break;
          }
        }
      });
      if (!veCobrowse.isEnabled()) {
        console.info('cobrowse is not enabled for tenant: ', tenantId);
        return;
      }
      if (veCobrowse.session) {
        UI.setExpandableContent({ interactionId: veCobrowse.session.id(), interactionType: 'ID' });
      }
      // click button to create cobrowse session
      UI.startCobrowseButton.addEventListener('click', async function () {
        try {
          if (!veCobrowse.isEnabled()) {
            console.error('cobrowse is not enabled');
            UI.showVENotification('Cobrowse is not enabled!');
            return;
          }
          if (UI.isCobrowseStarted()) {
            UI.setCobrowseEnded();
            UI.setExpandableContent({ interactionId: '', interactionType: '' });
            await veCobrowse.stop();
          } else {
            UI.expandCobrowse();
            await veCobrowse.createCobrowseVeInteraction();
            UI.setExpandableContent({ interactionId: veCobrowse.session.code(), interactionType: 'PIN' });
          }
        } catch (e) {
          UI.showVENotification('Cobrowse is not loaded!');
          UI.closeExpandableContent();
        }
      });
      // click button to stop cobrose session
      UI.stopCobrowseButton.addEventListener('click', async function () {
        try {
          await veCobrowse.stop();
        } catch (e) {
         console.error(e);
        }
      });
      } catch (e) {
        console.error(e);
        showErrorMessage('Cannot initialize cobrowse!');
      }
  };

  const loadScriptAndExecuteMain = function () {
    const script = document.createElement('script');
    script.src = 'https:///videoengager.github.io/videoengager/uilib/helpers.js';
    script.onload = function () {
      document.querySelector('#initializeCoBrowse').addEventListener('click', main);
    };
    document.head.appendChild(script);
  };

  /** UI CODE **/
  // --- AUTO RECONNECT ---
  const autoInitOnFormSubmit = function () {
     // prefill inputs with parameters
     const urlParams = new URLSearchParams(window.location.search);
     const env = urlParams.get('env') || undefined;
     if (env) {
       const { veUrl, tenantId } = parameters[env];
       document.querySelector('#veUrl').value = veUrl;
       document.querySelector('#tenantId').value = tenantId;
     }
    // if url parameters has one of fname lname tenantId veUrl auto connect to cobrowse'
    const fname = urlParams.get('fname');
    const lname = urlParams.get('lname');
    if (fname || lname) {
      setState(`Hello ${fname} ${lname}`);
      document.querySelector('#fname').value = fname;
      document.querySelector('#lname').value = lname;
    }

    const tenantId = urlParams.get('tenantId');
    const veUrl = urlParams.get('veUrl');
    if (tenantId || veUrl) {
      document.querySelector('#tenantId').value = tenantId;
      document.querySelector('#veUrl').value = veUrl;
      document.querySelector('#initializeCoBrowse').disabled = true;
      main();
    }

    document.querySelector('#submit').addEventListener('click', function () {
      const url = `/examples/standaloneCobrowse/index.html?fname=${document.querySelector('#fname').value}&lname=${document.querySelector('#lname').value}&tenantId=${document.querySelector('#tenantId').value}&veUrl=${document.querySelector('#veUrl').value}`;
      window.location.href = url;
    });
    showInfoMessage('Your page is reloaded!');
  };
  // --- VALIDATION ---
  const validateInputListerenrs = function () {
    const initializeButton = document.querySelector('#initializeCoBrowse');
    const veUrlInput = document.getElementById('veUrl');
    const tenantIdInput = document.getElementById('tenantId');
    const errorMessage = document.getElementById('error-message');

    // disable initializeButton if inputs are empty
    if (veUrlInput.value.trim() === '' || tenantIdInput.value.trim() === '') {
      initializeButton.disabled = true;
    }

    function validateInputs () {
        const veUrlIsValid = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(veUrlInput.value);
        const tenantIdIsNotEmpty = tenantIdInput.value.trim() !== '';

        const inputsAreValid = veUrlIsValid && tenantIdIsNotEmpty;
        initializeButton.disabled = !inputsAreValid;
        errorMessage.style.display = inputsAreValid ? 'none' : 'block';
    }

    veUrlInput.addEventListener('input', validateInputs);
    tenantIdInput.addEventListener('input', validateInputs);
  };
  // --- LOCAL STORAGE ---
  const localStorageListeners = function () {
    document.querySelector('#saveToLocalStorage').addEventListener('click', function () {
      try {
        // store values #tenantId and #veUrl to localStorage
        const data = {
          tenantId: document.querySelector('#tenantId').value,
          veUrl: document.querySelector('#veUrl').value
        };
        window.localStorage.setItem('data', JSON.stringify(data));
        showInfoMessage('Data is saved to localStorage');
      } catch (e) {
        console.error(e);
        showErrorMessage('Cannot save data to localStorage');
      }
    });
    document.querySelector('#clearData').addEventListener('click', function () {
      try {
        // clear localStorage
        window.localStorage.clear();
        // clear inputs
        document.querySelector('#tenantId').value = '';
        document.querySelector('#veUrl').value = '';
        const initializeButton = document.querySelector('#initializeCoBrowse');
        initializeButton.disabled = true;
        showInfoMessage('Data is cleared from localStorage');
      } catch (e) {
        console.error(e);
        showErrorMessage('Cannot clear data from localStorage');
      }
    });
    try {
      // load values from localStorage
      const data = window.localStorage.getItem('data');
      if (data) {
        const { tenantId, veUrl } = JSON.parse(data);
        document.querySelector('#tenantId').value = tenantId;
        document.querySelector('#veUrl').value = veUrl;
      }
    } catch (e) {
      console.error(e);
      showErrorMessage('Cannot load data from localStorage');
    }
  };

  // --- TAMPERMONKEY ---
  const tampermonkeyListeners = async function () {
    document.querySelector('#tampermonkeyDump').addEventListener('click', async function () {
      try {
        // get file from ./cobrosedemo.txt
        const response = await fetch('/examples/standaloneCobrowse/cobrowsedemo.txt');
        let text = await response.text();
        text = text.replace(/\$\{veUrl\}/g, document.querySelector('#veUrl').value);
        text = text.replace(/\$\{tenantId\}/g, document.querySelector('#tenantId').value);
        document.querySelector('#dumpContainer').style.display = 'block';
        document.querySelector('#jsondump').innerHTML = text;
      } catch (e) {
        console.error(e);
        showErrorMessage('Cannot load file');
      }
      // download file
      document.querySelector('#download').addEventListener('click', function () {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        // add dateTime to file name
        element.setAttribute('download', `cobrowsedemo-${new Date().toISOString()}.js`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      });
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    loadScriptAndExecuteMain();
    autoInitOnFormSubmit();
    localStorageListeners();
    validateInputListerenrs();
    tampermonkeyListeners();
  });
})();
