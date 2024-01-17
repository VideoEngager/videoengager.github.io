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

const tampermonkeyPrepare = async function () {
  $('#tampermonkeybutton').attr('disabled', false);
  try {
    // get file from ./cobrosedemo.txt
    const response = await fetch('/examples/standaloneCobrowse/cobrowsedemo.txt');
    let text = await response.text();
    text = text.replace(/\$\{veUrl\}/g, document.querySelector('#veUrl').value);
    text = text.replace(/\$\{tenantId\}/g, document.querySelector('#tenantId').value);
    document.querySelector('#tampermonkeydump').innerHTML = text;
  } catch (e) {
    console.error(e);
    showErrorMessage('Cannot load file');
  }
  document.querySelector('#downloadtamper').addEventListener('click', function () {
    const element = document.createElement('a');
    const text = document.querySelector('#tampermonkeydump').innerHTML;
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    // add dateTime to file name
    element.setAttribute('download', `cobrowsedemo-${new Date().toISOString()}.js`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  });
  const elem = document.getElementById('tampermonkeydump');
  window.hljs.highlightElement(elem);
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
    window.mainVeCobrose();
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

// --- INTRO JS ---
const introJSInit = function () {
  introJs().setOptions({
    dontShowAgain: true,
    steps: [
      { intro: 'Welcome to the VideoEngager CoBrowse demo!' },
      {
        element: 'a[href*="github.com"]',
        intro: 'This is the link to the GitHub repository where you can view the source code for this VideoEngager Cobrowse Demo.'
      },
      {
        element: 'button[onclick*="location.reload();"]',
        intro: 'Click this button to refresh the current page. Useful if you need to reset the demo or reload the latest changes.'
      },
      {
        element: '#demonstration_form',
        intro: 'This section requires the Tenant ID and VideoEngager URL for initialization.'
      },
      {
        element: '#initializeCoBrowse',
        intro: 'After entering the required Tenant ID and VideoEngager URL, click this \'Initialize\' button to start the CoBrowse session.'
      },
      {
        element: '.explanation-text',
        intro: 'A demo form will appear here when cobrowse session is initialized.'
      },
      {
        element: '#clearData',
        intro: 'Use this \'Clear\' button to remove the entered parameters from the form as well as from the local storage.'
      },
      {
        element: '#saveToLocalStorage',
        intro: 'Click the \'Save to Local Storage\' button to save your entered parameters for future use.'
      },
      {
        element: '#tampermonkeyDump',
        intro: 'Click here to generate a cobrowse demo script based on the parameters you provided. This script can be used in your website or in a Tampermonkey script.'
      }
    ]
  }).start();
};

function handleSessionCreated () {
  setState('Cobrowse is session Created!');
}

function handleSessionStarted (data, UI) {
  const { sessionCode, id: sessionId } = data;
  console.log('pin: ', sessionCode, ' id: ', sessionId);
  UI.setCobrowseStarted();
  setState('CoBrowse Started!');
}

function handleSessionAuthorizing () {
  setState('Waiting for authorization!');
}

function handleSessionEnded (UI) {
  UI.setCobrowseEnded();
  setState('CoBrose session is Ended! But cobrose is still initialized...');
}

// Function to initialize styles
async function initializeStyles () {
  await VEHelpers.requireAsync('https://videoengager.github.io/videoengager/uilib/styles.css');
}

// Function to load veCobrowse
async function loadVeCobrowse (veUrl) {
  await VEHelpers.requireAsync(`${veUrl}/static/assets/veCobrowse.js`);
  await VEHelpers.documentLoaded();
}

function updateUIForCobrowse ({ sessionEnded, sessionCode }, UI) {
  if (sessionEnded) {
    UI.setCobrowseEnded();
    UI.setExpandableContent({ interactionId: '', interactionType: '' });
  } else {
    UI.expandCobrowse();
    UI.setExpandableContent({ interactionId: sessionCode, interactionType: 'PIN' });
  }
}

function showError (message) {
  console.error(message);
  showToastError(message);
}

autoInitOnFormSubmit();
localStorageListeners();
validateInputListerenrs();
introJSInit();
