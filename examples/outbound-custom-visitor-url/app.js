window.onload = async function () {
  const parsedParam = new window.URL(window.location.href).searchParams.get('s');
  if (!parsedParam) {
    console.log('No param found');
    return;
  }
  const tenantID = 'test_tenant';
  let code = null;
  let pin = null;
  const basePath = 'https://dev.videoengager.com';
  SmartVideoSdk.smartVideoInstance.setBasePath(basePath);
  SmartVideoSdk.smartVideoInstance.initialized = true;
  window.addEventListener('message', function (event) {
    console.log('message received', event);
  });
  if (parsedParam.includes('ve')) {
    code = parsedParam.replace('/ve/', '');
  } else if (parsedParam.includes('pin')) {
    pin = parsedParam.replace('/pin/', '');
  }
  if (!code && !pin) {
    console.log('No code or pin found');
    return;
  }
  console.log('Code found:', code);
  console.log('Pin found:', pin);
  //   var smartVideoSdk = SmartVideoSdk
  await wait(6000);
  let iframeUrl = null;
  if (code) {
    const response = await window.SmartVideoSdk.shortURLPublic.getShortURLByCode({
      tenantID,
      code
    }).catch((error) => {
      console.log(error);
    });
    if (response.data?.active) {
      iframeUrl = `${basePath}/${response.data.url}`;
    }
  } else if (pin) {
    const response = await window.SmartVideoSdk.shortURLPublic.getShortURLByPin({
      tenantID,
      pin
    }).catch((error) => {
      console.log(error);
    });
    if (response.data?.shortUrl) {
      iframeUrl = `${basePath}/${response.data.shortUrl}`;
    }
    // Handle PIN case here
  }
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
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.opacity = '1';
  };

  const loadingContainer = document.getElementById('loading-id');
  loadingContainer.style.opacity = '0';
  await wait(600);
  loadingContainer.style.height = '0px';
  loadingContainer.style.display = 'none';
  const header = document.getElementById('header-id');
  header.style.height = '60px';
  header.style.borderRadius = '0px';
  await wait(600);
  iframe.src = iframeUrl;
}
function wait (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
