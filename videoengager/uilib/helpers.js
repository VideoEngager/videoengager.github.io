window.VEHelpers = {
  PopupManager: class {
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
  },

  requireAsync: function (url) {
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
  },

  PromiseGenesys: function (command, action, payload) {
    return new Promise((resolve, reject) => {
      window.Genesys(command, action, payload, response => {
        setTimeout(() => resolve(response), 500);
      }, err => {
        console.error(err);
        reject(err);
      });
    });
  },

  initializeTalkdeskChat: function (window, document, node, props, configs) {
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
  },

  documentLoaded: function (timeOut = 30000) {
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
  },

  UIHandler: function (options = {}) {
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
  <div class="ve-floating-button " alt="Cobrowse Icon" id="ve-floating-button-middle">
    <div class="wrapper-pin"><span id="interaction-type"></span><input id="interaction-id" disabled></input><div id="copy-button" class="copy-btn"></div></div>
  </div>
  <div class="ve-floating-button" alt="Cobrowse Icon" id="ve-floating-button-end"></div>
  <div class="ve-floating-button ve-floating-button-cobrowse-before" alt="Cobrowse Icon" class="icon" id="ve-start-cobrowse"></div>

    <div class="expandable-content" style="display: none;">
                <button id="ve-stop-cobrowse" style="display: none;">Stop Cobrowse</button>
                 <div id="ve-loading-icon"></div>
                 <span id="ve-cobrowse-content" style="display: none;">
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

    function setLoadingIcon () {
      closeExpandableContent();
      document.getElementById('ve-floating-button').style.display = 'block';
      document.querySelector('.expandable-content').style.display = 'block';
      Array.from(document.getElementsByClassName('ve-floating-button')).forEach((element, index, array) => {
        element.style.display = 'none';
      });
    }

    function setExpandableContent ({ interactionId, interactionType }) {
      document.getElementById('interaction-id').value = interactionId;
      document.getElementById('interaction-type').textContent = interactionType;
    }

    function closeExpandableContent () {
      document.getElementById('ve-floating-button').style.display = 'block';
      document.getElementById('interaction-id').value = '';
      document.getElementById('interaction-type').textContent = '';
      document.querySelector('.expandable-content').style.display = 'none';
      document.getElementById('ve-start-cobrowse').style.display = 'block';

      document.getElementById('ve-cobrowse-content').style.display = 'none';
      document.getElementById('ve-loading-icon').style.display = 'block';
      document.getElementById('ve-stop-cobrowse').style.display = 'none';
    }

    function setCobrowseStarted () {
      document.getElementById('ve-start-cobrowse').classList.add('cobrowse-red');
      document.getElementById('ve-floating-button').classList.remove('expand-start');
      document.getElementById('ve-floating-button-middle').classList.remove('expand-middle');
      document.getElementById('ve-floating-button-end').classList.remove('expand-end');
      document.getElementById('ve-floating-button').classList.add('expand-start');
    }

    function setCobrowseEnded () {
      document.getElementById('ve-start-cobrowse').classList.remove('cobrowse-red');
      document.getElementById('ve-floating-button').classList.remove('expand-start');
      document.getElementById('ve-floating-button-middle').classList.remove('expand-middle');
      document.getElementById('ve-floating-button-end').classList.remove('expand-end');
      setExpandableContent({ interactionId: '', interactionType: '' });
    }

    function expandCobrowse () {
      document.getElementById('ve-floating-button').classList.add('expand-start');
      document.getElementById('ve-floating-button-middle').classList.add('expand-middle');
      document.getElementById('ve-floating-button-end').classList.add('expand-end');
    }

    function isCobrowseStarted () {
      return document.getElementById('ve-start-cobrowse').classList.contains('cobrowse-red') || document.getElementById('ve-floating-button-middle').classList.contains('expand-middle');
    }

    const showVENotification = function (message) {
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.className = 've-toast';

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.className = 've-toast show';
      }, 100);

      setTimeout(() => {
        toast.className = toast.className.replace('show', '');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 500);
      }, 3000);
    };

    return {
      showVENotification,
      setLoadingIcon,
      setExpandableContent,
      closeExpandableContent,
      setCobrowseStarted,
      setCobrowseEnded,
      isCobrowseStarted,
      expandCobrowse,
      startCobrowseButton: document.getElementById('ve-start-cobrowse'),
      stopCobrowseButton: document.getElementById('ve-stop-cobrowse'),
      closeVideoButton: document.getElementById('closeVideoButton'),
      startVideoCallButton: document.getElementById('startVideoCall'),
      stopVideoCallButton: document.getElementById('stopVideoCall'),
      chatIframe: document.getElementById('chatIframe'),
      myVideoHolder: document.getElementById('myVideoHolder')
    };
  },

  initializeGenesys: function ({ environment, deploymentId, envUrl }) {
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
};
