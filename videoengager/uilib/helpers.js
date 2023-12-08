class PopupManager {
  constructor () {
    this.popupWidth = 770;
    this.popupHeight = 450;
    this.popupId = 'popup_instance';
    this.popupinstance = null;
  }

  calculatePosition () {
    const left = (window.screen.width / 2) - (this.popupWidth / 2);
    const top = (window.screen.height / 2) - (this.popupHeight / 2);
    return `width=${this.popupWidth}, height=${this.popupHeight}, left=${left}, top=${top}, location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar=no`;
  }

  // Attaches a popup window
  attachPopup () {
    this.popupinstance = window.open('', this.popupId, this.calculatePosition());
    if (!this.popupinstance || this.popupinstance.closed || typeof this.popupinstance.closed === 'undefined') {
      console.log('Popup was blocked or closed.');
      return false;
    }
    try {
      if (this.popupinstance.location && this.popupinstance.location.host === '') {
        console.log('Popup blocker is disabled, but the popup was closed.');
        this.close();
        return false;
      }
    } catch (e) {
      console.log('Popup exists.');
      return true;
    }
    return true;
  }

  // Creates a new popup with the specified URL
  createPopup (url) {
    this.popupinstance = window.open(url, this.popupId, this.calculatePosition());
    this.focus();
  }

  // Checks if a popup currently exists
  popupExist () {
    return this.popupinstance && !this.popupinstance.closed;
  }

  // Focuses on the existing popup
  focus () {
    if (this.popupExist()) {
      this.popupinstance.focus();
    }
  }

  // Closes the existing popup
  close () {
    if (this.popupExist()) {
      this.popupinstance.close();
      this.popupinstance = null;
    }
  }
}

const showVENotification = function (message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = 'toast';

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.className = 'toast show';
  }, 100);

  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  }, 3000);
};

const getGuid = function () {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
};

const requireAsync = function (url) {
  return new Promise((resolve, reject) => {
    const re = /(?:\.([^.]+))?$/;
    const ext = re.exec(url)[1];
    console.log(ext);

    if (ext === 'css') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = url;
      link.addEventListener('load', resolve);
      link.addEventListener('error', reject);
      document.getElementsByTagName('head')[0].appendChild(link);
    } else if (ext === 'js') {
      const script = document.createElement('script');
      script.src = url;
      script.type = 'text/javascript';
      script.addEventListener('load', resolve);
      script.addEventListener('error', reject);
      document.getElementsByTagName('head')[0].appendChild(script);
    } else {
      reject(new Error('Unsupported file type'));
    }
  });
};

function PromiseGenesys (command, action, payload) {
  return new Promise((resolve, reject) => {
    window.Genesys(command, action, payload, response => {
      setTimeout(() => resolve(response), 500);
    }, err => {
      console.error(err);
      reject(err);
    });
  });
}

const initializeTalkdeskChat = function (window, document, node, props, configs) {
  return new Promise((resolve, reject) => {
    if (window.TalkdeskChatSDK) {
      reject(new Error('TalkdeskChatSDK already included'));
      return;
    }
    const divContainer = document.createElement('div');
    divContainer.id = node;
    document.body.appendChild(divContainer);
    const src = 'https://talkdeskchatsdk.talkdeskapp.com/talkdeskchatsdk.js';
    const script = document.createElement('script');
    const firstScriptTag = document.getElementsByTagName('script')[0];
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.id = 'tdwebchatscript';
    script.src = src;
    script.async = true;
    firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
    script.onload = () => {
      try {
        const webchat = TalkdeskChatSDK(node, props);
        webchat.init(configs);
        resolve(webchat);
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load TalkdeskChatSDK script'));
    };
  });
};

const documentLoaded = function (timeOut = 30000) {
  return new Promise((resolve, reject) => {
    if (document.readyState === 'loading') {
      window.addEventListener('load', () => {
        resolve();
      });
    } else {
      resolve();
    }
    document.addEventListener('error', reject);
    setTimeout(reject, timeOut);
  });
};

const UIHandler = function (options = {}) {
  const { veCobrowse = true, click2video = true, veIframe = false } = options;

  const veIframeElement = `
      <div id="myVideoHolder">
         <div id="closeVideoButtonHolder">
             <img class="button" id="closeVideoButton" src="https://videome.leadsecure.com/static/assets/libs/videoengager/img/close.png">
         </div>
     </div>
     `;

  const mainElement = document.createElement('div');
  mainElement.id = 've-floating-button';
  mainElement.className = 'floating-btn';
  mainElement.style.zIndex = '1000';

  const click2videoElement = `
     <div id="startVideoCall" class="ve-floating-button ve-floating-button-before"></div>
     <div id="stopVideoCall" style="display: none;" class="ve-floating-button-before"></div>
     <div id="chatIframe"></div>`;

  const veCobrowseElement = `
     <div class="ve-floating-button ve-floating-button-cobrowse-before" alt="Cobrowse Icon" class="icon" id="ve-start-cobrowse"></div>
    <div class="expandable-content" style="display: none;">
                <button id="ve-stop-cobrowse" style="display: none;">Stop Cobrowse</button>
                 <div id="ve-loading-icon"></div>
                 <span id="ve-cobrowse-content" style="display: none;">
                 <div class="wrapper-pin"><span id="interaction-type">Pin</span><input id="interaction-id" disabled></input><div id="copy-button" class="copy-btn"></div></div>
                 </span>
            </div>`;

  document.body.insertAdjacentElement('afterbegin', mainElement);

  if (veIframe) {
    mainElement.insertAdjacentHTML('afterbegin', veIframeElement);
  }
  if (click2video) {
    mainElement.insertAdjacentHTML('afterbegin', click2videoElement);
  }
  if (veCobrowse) {
    mainElement.insertAdjacentHTML('afterbegin', veCobrowseElement);
    document.getElementById('copy-button').addEventListener('click', copyInteractionId);
  }

  function copyInteractionId () {
    const interactionId = document.getElementById('interaction-id').value;
    navigator.clipboard.writeText(interactionId)
      .then(() => showVENotification('Copied!'))
      .catch(err => console.error('Error in copying text: ', err));
  }

  function toggleCobrowseExpandableContent () {
    const content = document.querySelector('.expandable-content');
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
  }

  function setExpandableContent ({ interactionId, interactionType }) {
    const content = document.querySelector('.expandable-content');
    content.style.display = 'block';
    // set all ve-floating-button buttons hidden
    Array.from(document.getElementsByClassName('ve-floating-button')).forEach((element, index, array) => {
      element.style.display = 'none';
    });

    document.getElementById('interaction-id').value = interactionId;
    document.getElementById('interaction-type').textContent = interactionType;

    document.getElementById('ve-cobrowse-content').style.display = 'block';
    document.getElementById('ve-loading-icon').style.display = 'none';
    document.getElementById('ve-stop-cobrowse').style.display = 'block';
  }

  function closeExpandableContent () {
    document.getElementById('interaction-id').value = '';
    document.getElementById('interaction-type').textContent = '';
    document.querySelector('.expandable-content').style.display = 'none';
    document.getElementById('ve-start-cobrowse').style.display = 'block';

    document.getElementById('ve-cobrowse-content').style.display = 'none';
    document.getElementById('ve-loading-icon').style.display = 'block';
    document.getElementById('ve-stop-cobrowse').style.display = 'none';

    // set all ve-floating-button buttons visible
    Array.from(document.getElementsByClassName('ve-floating-button')).forEach((element, index, array) => {
      element.style.display = 'block';
    });
  }

  return {
    toggleCobrowseExpandableContent,
    setExpandableContent,
    closeExpandableContent,
    startCobrowseButton: document.getElementById('ve-start-cobrowse'),
    stopCobrowseButton: document.getElementById('ve-stop-cobrowse'),
    closeVideoButton: document.getElementById('closeVideoButton'),
    startVideoCallButton: document.getElementById('startVideoCall'),
    stopVideoCallButton: document.getElementById('stopVideoCall'),
    chatIframe: document.getElementById('chatIframe'),
    myVideoHolder: document.getElementById('myVideoHolder')
  };
};

function initializeGenesys ({ environment, deploymentId, envUrl }) {
  window._genesysJs = 'Genesys';
  window.Genesys = window.Genesys || function () {
    (window.Genesys.q = window.Genesys.q || []).push(arguments);
  };
  window.Genesys.t = 1 * new Date();
  window.Genesys.c = { environment, deploymentId, debug: true };

  const ys = document.createElement('script');
  ys.async = 1;
  ys.src = `${envUrl}/genesys-bootstrap/genesys.min.js`;
  ys.charset = 'utf-8';
  document.head.appendChild(ys);

  function waitForGenesysInitialization () {
    return new Promise((resolve, reject) => {
      const checkInterval = 100;
      const timeout = 10000;
      let elapsed = 0;
      const intervalId = setInterval(() => {
        if (typeof window.Genesys === 'function') {
          clearInterval(intervalId);
          resolve(window.Genesys);
        } else if ((elapsed += checkInterval) >= timeout) {
          clearInterval(intervalId);
          reject(new Error('Timeout waiting for window.Genesys to initialize'));
        }
      }, checkInterval);
    });
  }

  return waitForGenesysInitialization();
}
