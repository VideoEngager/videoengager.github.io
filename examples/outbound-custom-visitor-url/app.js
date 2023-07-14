const environments = {
  dev: 'https://dev.videoengager.com',
  prod: 'https://prod.leadsecure.com',
  staging: 'https://staging.leadsecure.com'
};
const tenants = {
  prod: '0FphTk091nt7G1W7',
  staging: 'oIiTR2XQIkb7p0ub',
  dev: 'test_tenant'
};
function getPinOrCode (stringValue = '', dontCheckAgain = false) {
  const data = {
    code: false,
    pin: false
  };
  if (stringValue.includes('/ve/')) {
    data.code = stringValue.split('/ve/')[1];
  } else if (stringValue.includes('/pin/')) {
    data.pin = stringValue.split('/pin/')[1];
  }
  if (!data.code && !data.pin && !dontCheckAgain) {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get('param') || '';
    return getPinOrCode(param, true);
  }
  return data;
}
window.onload = async function initializeSmartVideo () {
  await loadScripts();
  const evironment = new window.URL(window.location.href).searchParams.get('env') || 'dev';
  let serverUrl = environments[evironment];
  let tenantID = tenants[evironment];

  if (!serverUrl || !tenantID) {
    serverUrl = environments.dev;
    tenantID = tenants.dev;
  }

  // Get pin or code from URL
  const { pin, code } = getPinOrCode(window.location.href);
  if (!pin && !code) {
    console.log('No ve or pin found');
    return;
  }

  // Initialize the SDK
  window.SmartVideoSdk.smartVideoInstance.setBasePath(serverUrl);
  window.SmartVideoSdk.smartVideoInstance.initialized = true;

  // Get iframe URL
  let iframeUrl = null;
  if (code) {
    const response = await window.SmartVideoSdk.shortURLPublic.getShortURLByCode({
      tenantID,
      code
    }).catch((error) => {
      console.log(error);
    });
    if (response.data?.active) {
      iframeUrl = `${serverUrl}/${response.data.url}`;
    }
  } else if (pin) {
    const response = await window.SmartVideoSdk.shortURLPublic.getShortURLByPin({
      tenantID,
      pin
    }).catch((error) => {
      console.log(error);
    });
    if (response.data?.shortUrl) {
      iframeUrl = `${serverUrl}/${response.data.shortUrl}`;
    }
    // Handle PIN case here
  }

  // Render the iframe
  if (!iframeUrl) {
    console.log('No iframe url found');
    return;
  }
  console.log('iframe url found:', iframeUrl);
  showIframe(iframeUrl);
};
async function showIframe (iframeUrl) {
  const iframe = document.getElementById('iframe-ve');
  iframe.onload = function () {
    // Hide the loading indicator.
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.opacity = '1';
  };
  iframe.onerror = function () {
    console.log('iframe error');
  };

  // Hide the loading indicator.
  const loadingContainer = document.getElementById('loading-id');
  loadingContainer.style.opacity = '0';
  // animation
  // Wait for the loading indicator to fade out.
  await wait(600);
  loadingContainer.style.height = '0px';
  loadingContainer.style.display = 'none';
  const header = document.getElementById('header-id');
  header.style.height = '60px';
  header.style.borderRadius = '0px';
  // Wait for the header to finish animating.
  await wait(600);
  iframe.src = iframeUrl;
}
function wait (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function loadScripts () {
  await loadJsAsync('https://cdn.tailwindcss.com');
  await loadJsAsync('https://unpkg.com/videoengager-js-sdk@1.3.0/dist/browser/main.js');
  window.tailwind.config = {
    important: true
  };
}
function loadJsAsync (url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
