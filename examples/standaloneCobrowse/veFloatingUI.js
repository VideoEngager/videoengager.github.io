class VeFloatingUIHandler {
  constructor () {
    this.createMainElement();
    this.buttons = {
      startCobrowse: null,
      stopCobrowse: null,
      closeVideo: null,
      startVideoCall: null,
      stopVideoCall: null,
      chatIframe: null,
      myVideoHolder: null
    };
    this.isContentExpanded = false;
  }

  createMainElement () {
    this.mainElement = document.createElement('div');
    this.mainElement.id = 've-floating-button';
    this.mainElement.className = 'floating-btn';
    this.mainElement.style.zIndex = '1000';
    document.body.insertAdjacentElement('afterbegin', this.mainElement);
  }

  insertVeIframe () {
    this.mainElement.insertAdjacentHTML('afterbegin', this.veIframeElement());
    this.buttons.myVideoHolder = document.getElementById('myVideoHolder');
    this.buttons.closeVideo = document.getElementById('closeVideoButton');
  }

  insertClick2Video () {
    this.mainElement.insertAdjacentHTML('afterbegin', this.click2videoElement());
    this.buttons.startVideoCall = document.getElementById('startVideoCall');
    this.buttons.stopVideoCall = document.getElementById('stopVideoCall');
    this.buttons.chatIframe = document.getElementById('chatIframe');
  }

  insertVeCobrowse () {
    this.mainElement.insertAdjacentHTML('afterbegin', this.veCobrowseElement());
    this.buttons.startCobrowse = document.getElementById('ve-start-cobrowse');
    this.buttons.stopCobrowse = document.getElementById('ve-stop-cobrowse');
    document.getElementById('copy-button').addEventListener('click', () => this.copyInteractionId());
  }

  veIframeElement () {
    return `
        <div id="myVideoHolder">
          <div id="closeVideoButtonHolder">
            <img class="button" id="closeVideoButton" src="https://videome.leadsecure.com/static/assets/libs/videoengager/img/close.png">
          </div>
        </div>
      `;
  }

  click2videoElement () {
    return `
        <div id="startVideoCall" class="ve-floating-button ve-floating-button-before"></div>
        <div id="stopVideoCall" style="display: none;" class="ve-floating-button-before"></div>
        <div id="chatIframe"></div>
      `;
  }

  veCobrowseElement () {
    return `
        <div class="ve-floating-button" alt="Cobrowse Icon" id="ve-floating-button-middle">
          <div class="wrapper-pin"><span id="interaction-type"></span><input id="interaction-id" disabled></input><div id="copy-button" class="copy-btn"></div></div>
        </div>
        <div class="ve-floating-button" alt="Cobrowse Icon" id="ve-floating-button-end"></div>
        <div class="ve-floating-button ve-floating-button-cobrowse-before" alt="Cobrowse Icon" id="ve-start-cobrowse"></div>
        <div class="ve-floating-button ve-floating-button-cobrowse-before" alt="Cobrowse Icon" 
        style="display: none;
            background-color: #3659f4;
            border-radius: 50%;" id="ve-stop-cobrowse"></div>
        <div class="expandable-content" style="display: none;">
          <div id="ve-loading-icon"></div>
          <span id="ve-cobrowse-content" style="display: none;"></span>
        </div>
      `;
  }

  copyInteractionId () {
    const interactionId = document.getElementById('interaction-id').value;
    navigator.clipboard.writeText(interactionId)
      .then(() => this.showVENotification('Copied!'))
      .catch(err => console.error('Error in copying text: ', err.toString()));
  }

  setLoadingIcon () {
    this.closeExpandableContent();
    document.getElementById('ve-floating-button').style.display = 'block';
    document.querySelector('.expandable-content').style.display = 'block';
    Array.from(document.getElementsByClassName('ve-floating-button')).forEach((element, index, array) => {
      element.style.display = 'none';
    });
  }

  setExpandableContent ({ interactionId, interactionType }) {
    this.isContentExpanded = true;
    document.getElementById('interaction-id').value = interactionId;
    document.getElementById('interaction-type').textContent = interactionType;
    document.getElementById('ve-floating-button').classList.add('expand-start');
    document.getElementById('ve-floating-button-middle').classList.add('expand-middle');
    document.getElementById('ve-floating-button-end').classList.add('expand-end');
    document.getElementById('ve-start-cobrowse').style.display = 'none';
    document.getElementById('ve-stop-cobrowse').style.display = 'block';
  }

  setCobrowseStarted () {
    document.getElementById('ve-floating-button').style.display = 'none';
  }

  closeExpandableContent () {
    document.getElementById('ve-floating-button').style.display = 'block';
    document.getElementById('interaction-id').value = '';
    document.getElementById('interaction-type').textContent = '';
    document.querySelector('.expandable-content').style.display = 'none';
    document.getElementById('ve-start-cobrowse').style.display = 'block';

    document.getElementById('ve-cobrowse-content').style.display = 'none';
    document.getElementById('ve-loading-icon').style.display = 'block';
    document.getElementById('ve-stop-cobrowse').style.display = 'none';

    document.getElementById('ve-start-cobrowse').classList.remove('cobrowse-red');
    document.getElementById('ve-floating-button').classList.remove('expand-start');
    document.getElementById('ve-floating-button-middle').classList.remove('expand-middle');
    document.getElementById('ve-floating-button-end').classList.remove('expand-end');

    document.getElementById('ve-start-cobrowse').style.display = 'block';
    document.getElementById('ve-stop-cobrowse').style.display = 'none';
  }

  showVENotification (message) {
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
  }
}
