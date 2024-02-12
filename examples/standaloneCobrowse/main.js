window.addEventListener('DOMContentLoaded', async function () {
  const veFloatingUI = new VeFloatingUIHandler();

  const initializeVeCobrowse = async function () {
    const veUrl = document.querySelector('#veUrl').value;
    const tenantId = document.querySelector('#tenantId').value;
    veFloatingUI.insertVeCobrowse();
    document.querySelector('#initializeCoBrowse').disabled = true;
    try {
      await loadJsAsync(`${veUrl}/static/assets/vecobrowse.min.js`);
      // mask sensitive info
      veCobrowse.maskSensitiveInfo(['#tenantId']);
      // hide default session controls
      veCobrowse.disableSessionControls();
      // initialize cobrowse
      await veCobrowse.init(tenantId, veUrl);
      // bypass the confirm session dialog
      veCobrowse.setConfirmSession(() => { return true; });
      // custom remote control dialog
      veCobrowse.setConfirmRemoteControl(() => {
        return new Promise((resolve) => {
          const consentGiven = customConfirm('Do you agree to grant control of your device?');
          resolve(consentGiven);
        });
      });
      setEventHandlers();
    } catch (e) {
      console.error(e);
      showToast('Cannot initialize cobrowse!');
    }
    veFloatingUI.buttons.startCobrowse.addEventListener('click', async function () {
      try {
        await veCobrowse.start();
      } catch (e) {
        showToast('Cobrowse is not loaded!');
        console.error(e);
        veFloatingUI.closeExpandableContent();
      }
    });
    veFloatingUI.buttons.stopCobrowse.addEventListener('click', async function () {
      try {
        await veCobrowse.stop();
      } catch (e) {
        showToast(e.toString());
        console.error(e);
      }
    });
  };

  function setEventHandlers () {
    veCobrowse.on('initialized', function () {
      showToast('Cobrowse is initialized!', 'info');
    });
    veCobrowse.on('ended', function () {
      veFloatingUI.closeExpandableContent();
      showToast('CoBrose session is Ended! But cobrose is still initialized...', 'info');
    });
    veCobrowse.on('started', function () {
      veFloatingUI.setCobrowseStarted();
      showToast('CoBrowse Started!', 'info');
    });
    veCobrowse.on('authorizing', function () {
      showToast('Waiting for authorization!', 'info');
    });
    veCobrowse.on('created', function (data) {
      showToast('Cobrowse is session Created!', 'info');
      veFloatingUI.setExpandableContent({ interactionId: data.code, interactionType: 'PIN' });
    });
  }

  document.querySelector('#initializeCoBrowse').addEventListener('click', initializeVeCobrowse);
});

function showToast (message, type = 'error', title = '') {
  if (!title) {
    title = type.charAt(0).toUpperCase() + type.slice(1);
  }
  const toastTemplateId = `${type}Toast`;
  const toastTemplate = document.querySelector(`#${toastTemplateId}`);
  if (!toastTemplate) {
    console.error('Toast template not found: ' + toastTemplateId);
    return;
  }
  const toastClone = toastTemplate.cloneNode(true);
  toastClone.querySelector('.toast-body').textContent = message;
  toastClone.querySelector('.me-auto').textContent = title;
  const toastContainer = document.querySelector('#toastContainer');
  toastContainer.appendChild(toastClone);
  const toast = new bootstrap.Toast(toastClone);
  toast.show();
  toastClone.addEventListener('hidden.bs.toast', function () {
    toastClone.remove();
  });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function loadJsAsync (url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = function () {
      reject(new Error('Failed to load script: ' + url));
    };
    document.body.appendChild(script);
  });
}
