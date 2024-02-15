/* eslint-disable no-console */
/* eslint-disable no-undef */

window.addEventListener('DOMContentLoaded', async function () {
  const veFloatingUI = new VeFloatingUIHandler();

  const cobrowseSetup = async function (tenantId, veUrl) {
    try {
      // load library
      await addJsByUrl(`${veUrl}/static/assets/vecobrowse.min.js`);
      // set input mask for sensitive data
      veCobrowse.maskSensitiveInfo(['#tenantId']);
      // set default session controls hidden
      veCobrowse.disableSessionControls();
      // initialize cobrowse library
      await veCobrowse.init(tenantId, veUrl);
      // bypass the confirm session dialog
      veCobrowse.setConfirmSession(() => { return true; });
      // custom remote control dialog
      veCobrowse.setConfirmRemoteControl(() => {
        return new Consent().show('Remote Control Request', 'Do you want to allow remote control of your browser?');
      });
    } catch (e) {
      console.error(e);
      showToast('Cannot initialize cobrowse!');
    }
  };
  const cobrowseEventHandlers = function () {
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
  };

  const UIEventHandlers = function () {
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

  window.cobrowseSetup = cobrowseSetup;
  window.cobrowseEventHandlers = cobrowseEventHandlers;
  window.UIEventHandlers = UIEventHandlers;

  const initialize = async function () {
    const veUrl = document.querySelector('#veUrl').value;
    const tenantId = document.querySelector('#tenantId').value;
    veFloatingUI.insertVeCobrowse();
    document.querySelector('#initializeCoBrowse').disabled = true;

    await cobrowseSetup(tenantId, veUrl);
    cobrowseEventHandlers();
    UIEventHandlers();
  };

  document.querySelector('#initializeCoBrowse').addEventListener('click', initialize);
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

function addJsByUrl (url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.body.appendChild(script);
  });
}
