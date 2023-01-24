// @ts-check

this._genesys = this._genesys || {};
this.CXBus = this.CXBus || {};
const states = {
  internalState: 'loading',
  get state () {
    return this.internalState;
  },
  set state (value) {
    if (value === this.internalState) return;
    console.log('state changed', this.internalState, '->', value);
    const loading = document.getElementById('loading-section');
    const frameSection = document.getElementById('frame-section');
    const formSection = document.getElementById('form-section');
    const form = document.getElementById('form-inputs');
    // @ts-ignore
    const elements = form && form?.elements;
    switch (value) {
      case 'loading':
        loading?.classList.remove('opacity-0');
        loading?.classList.remove('-z-10');
        frameSection?.classList.add('opacity-0');
        frameSection?.classList.add('-z-10');
        formSection?.classList.add('opacity-0');
        formSection?.classList.add('-z-10');
        loading?.classList.remove('z-10');
        break;
      case 'error':
        break;
      case 'staring-CXBus':
        loadLibrariesForFreshConfig();
        break;
      case 'checkUserData':
        checkUserData();
        break;
      case 'user-data-form':
        loading?.classList.add('opacity-0');
        loading?.classList.add('-z-10');
        frameSection?.classList.add('opacity-0');
        frameSection?.classList.add('-z-10');
        formSection?.classList.remove('opacity-0');
        formSection?.classList.remove('-z-10');
        formSection?.classList.add('z-10');
        break;
      case 'user-data-form-submitted':
        loading?.classList.add('opacity-0');
        loading?.classList.add('-z-10');
        for (const single of elements) {
          if (single.localName === 'input') {
            single.parentElement.remove();
            continue;
          }
          if (single.localName === 'button') {
            single.innerHTML = 'Click To Start';
            single.disabled = false;
            single.type = 'button';
            single.addEventListener('click', () => {
              states.state = 'call-start-requested';
            });
            continue;
          }
        }
        break;
      case 'call-start-requested':
        frameSection?.classList.remove('opacity-0');
        frameSection?.classList.remove('-z-10');
        formSection?.classList.add('opacity-0');
        formSection?.classList.add('-z-10');
        window.CXBus.command('VideoEngager.startVideoEngager');
        break;
      default:
        break;
    }
    this.internalState = value;
  },

  userData: {},
  /**
   * @type {object}
   */
  tennantData: {
    veUrl: null,
    tenantId: null
  }
};

/**
 *
 * @param {string} url
 * @param {string} [id=undefined]
 * @returns {Promise<void>}
 */
function loadJSX (url, id) {
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
function checkUserData () {
  try {
    if (!window._genesys.widgets.videoengager.webChatFormData) {
      window._genesys.widgets.videoengager.webChatFormData = {};
    }
    if (window._genesys.widgets.videoengager.webChatFormData.userData) {
      window._genesys.widgets.videoengager.webChatFormData.userData = {};
    }
    Object.assign(window._genesys.widgets.videoengager.webChatFormData.userData, states.userData.customUserData);
    if (states.userData.skipForm) {
      states.state = 'user-data-form-submitted';
      return;
    } else {
      injectForm(states.userData.form);
      states.state = 'user-data-form';
    }
  } catch (error) {
    injectForm(defaultForm);
    states.state = 'user-data-form';
  }
}
function waitVideoEngager () {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('error', 'VideoEngager is not ready');
      states.state = 'error';
      reject(new Error('VideoEngager is not ready'));
    }, 30000);
    window.CXBus.subscribe('VideoEngager.ready', (event) => {
      console.log('call ready', event);
      resolve(event);
      clearTimeout(timeout);
    });
  });
}
async function loadLibrariesForFreshConfig () {
  await loadJSX('configurationFile.js');
  window._genesys.widgets.videoengager.veUrl = states.tennantData.veUrl;
  window._genesys.widgets.videoengager.tenantId = states.tennantData.tenantId;
  /** Perform Loading Libraries */
  window.CXBus.configure({ debug: true, pluginsPath: 'https://apps.mypurecloud.com.au/widgets/9.0/plugins/' });
  window.CXBus.loadPlugin('widgets-core').done(async function () {
    window.CXBus.subscribe('WebChatService.restored', () => {
      window.CXBus.command('WebChatService.endChat');
      // window.localStorage.setItem('activeInteractionConfig', JSON.stringify(window._genesys.widgets));
    });
    await waitVideoEngager();
    loadGenesysListeners();

    states.state = 'checkUserData';
  }).fail(function (err) {
    console.error('error', err);
    states.state = 'error';
  });
}
const originalInputs = [
  'firstName', 'lastName', 'email', 'addressStreet', 'addressCity', 'addressPostalCode', 'addressState', 'phoneNumber', 'phoneType', 'customerId'
];
/**
 *
 * @param {Array<{value?:string,name:string,required?:boolean,label?:string}>} userData
 * @returns
 */
function processUserData (userData) {
  const formInputs = [];
  const customData = {};
  let customFieldsCount = 0;
  if (userData.length === 0) {
    return { formInputs, customData };// open original form
  } else {
    for (const item of userData) {
      const name = item.name;
      const value = item.value;
      if (!name) continue;
      if (originalInputs.includes(name)) {
        // set value to original input
        if (value) {
          // set value
          customData[name] = value;
        } else {
          // add to the form
          formInputs.push({
            name,
            value,
            label: item.label || name,
            required: item.required
          });
        }
      } else {
        // create new input
        if (customFieldsCount > 2) continue;
        customFieldsCount++;
        customData['customField' + customFieldsCount + 'Label'] = item.label || name;
        if (value) {
          // set value
          customData['customField' + customFieldsCount] = value;
        } else {
          // add to the form
          formInputs.push({
            name: 'customField' + customFieldsCount,
            value,
            label: item.label || name,
            required: item.required
          });
        }
      }
    }
  }
  return { formInputs, customData };
}
const defaultForm = [
  {
    name: 'firstName',
    label: 'First Name'
  }, {
    name: 'lastName',
    label: 'Last Name'
  }, {
    name: 'email',
    label: 'Email'
  }, {
    name: 'customerId',
    label: 'Customer ID'
  }
];
function checkURL (url) {
  try {
    const u = new window.URL(url);
    console.log(u);
  } catch (error) {
    throw new Error('invalid URL');
  }
}

function injectForm (formData) {
  const form = document.getElementById('form-inputs');
  if (!form) throw new Error('form not found');
  // clear form
  form.innerHTML = '';
  // add title
  form.innerHTML += '<div class="w-full"><h1 class="text-xl font-semibold whitespace-nowrap">Start Video Session with Agent</h1><p class="text-gray-400 text-sm">SmartVideo</p> </div>';
  for (const item of formData) {
    const elID = item.name + '-input-id';
    const placeHolder = item.placeHoder || item.label || item.name;
    const title = item.label || item.name;
    const name = item.name;
    const el = ` <div class="w-full flex flex-col gap-1">
  <label for="${elID}" class="text-sm font-semibold text-gray-700">${title}</label>
   <input type="text" placeHolder="${placeHolder}" title="${title}" name="${name}" id="${elID}" class="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
 </div>`;
    form.innerHTML += el;
    const inputElement = document.getElementById(elID);
    if (inputElement && item.required) {
      inputElement.setAttribute('required', 'true');
    }
  }
  // add button
  form.innerHTML += `<div class="w-full flex flex-col gap-1 py-2">
  <button id="start-video-session" name="button" type="submit" class="bg-blue-500 text-white rounded-md px-2 py-1 font-semibold hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white disabled:bg-gray-500">
 Submit
 </button>
</div>`;
}

async function loadLibraries () {
  const url = new URL(window.location.href);
  let veURL = 'https://dev.videoengager.com';
  let tennantID = 'test_tenant';
  let form = defaultForm;
  let skipForm = false;
  let customUserData = {};
  const encodedData = url.searchParams.get('d');
  if (encodedData) {
    try {
      const data = JSON.parse(atob(encodedData));
      checkURL(data.v);
      veURL = data.v;
      if (!data.t) {
        throw new Error('invalid tennantID');
      }
      tennantID = data.t;
      if (data.ud) {
        const { formInputs, customData } = processUserData(data.ud);
        customUserData = customData;
        if (formInputs.length > 0) {
          form = formInputs;
        } else {
          form = [];
          skipForm = true;
        }
      }
    } catch (error) {
      form = defaultForm;
      veURL = 'https://dev.videoengager.com';
      tennantID = 'test_tenant';
    }
  }

  try {
    // const data = await fetchTennant(tennantID, veURL);
    // states.data = data;
    states.tennantData.veUrl = veURL;
    states.tennantData.tenantId = tennantID;
    states.userData = {
      customUserData,
      skipForm,
      form
    };
    states.state = 'staring-CXBus';
  } catch (error) {
    console.error('error - invalid URL ', error);
    states.state = 'error';
  }
}

/**
 *
 * @param {any} event
 */
function onFormSubmit (event) {
  event.preventDefault();
  console.log(event);

  const elements = event.target.elements;
  elements.button.disabled = true;
  const data = {};

  if (!window._genesys.widgets.webchat.userData) {
    window._genesys.widgets.webchat.userData = {};
  }
  for (const single of elements) {
    if (single.localName === 'input') {
      data[single.name] = single.value;
      single.parentElement.parentElement.removeChild(single.parentElement);
      continue;
    }
    if (single.localName === 'button') {
      single.innerHTML = 'Click To Start';
      single.disabled = false;
      single.type = 'button';
      single.addEventListener('click', () => {
        states.state = 'call-start-requested';
      });
      continue;
    }
  }
  Object.assign(window._genesys.widgets.webchat.userData, data);

  states.state = 'user-data-form-submitted';
}
window.onFormSubmit = onFormSubmit;
// genesys widgets listeners
function loadGenesysListeners () {
  // * (this means that user has submitted the Registration Form and the call is waiting to be picked by an agent) */
  window.CXBus.subscribe('WebChatService.started', () => {
    // window.localStorage.setItem('activeInteractionConfig', JSON.stringify(window._genesys.widgets));
  });

  // 4. WebChat.ended || handle call ended event
  window.CXBus.subscribe('WebChatService.ended', () => {
    // window.localStorage.removeItem('activeInteractionConfig');
  });
  window.CXBus.subscribe('VideoEngager.callEnded', (event) => {
    console.log('call ended', event);
  });
  window.CXBus.subscribe('VideoEngager.callExists', (event) => {
    console.log('call exists', event);
  });
}
// function startVideoCall () {
//   return new Promise(function (resolve, reject) {
//     window.CXBus.command('VideoEngager.startVideoEngager').done(function () {
//       resolve();
//     }).fail(function (err) {
//       reject(err);
//     });
//   });
// }

window.onload = function () {
  loadLibraries();
};
