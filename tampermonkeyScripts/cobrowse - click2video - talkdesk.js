// ==UserScript==
// @name         cobrowse - click2video - talkdesk
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  cobrowse - click2video - talkdesk
// @author       You
// @match        https://www.videoengager.com/*
// @icon         https://www.google.com/s2/favicons?domain=videoengager.com
// @grant        none
// ==/UserScript==

(async function () {
  const TOUCHPOINTID = '';
  const parameters = {
  };

  const createInteractionByVisitor = function (veUrl, tenantId) {
    const url = veUrl + '/api/interactions/createByVisitor/' + tenantId;
    return fetch(url, {
      method: 'POST',
      accept: 'application/json'
    }).then(response => response.json());
  };

  const main = async function () {
    // config
    const urlParams = new URLSearchParams(window.location.search);
    const env = urlParams.get('env') || 'staging';
    let { veUrl, tenantId, flowId } = parameters[env];
    tenantId = urlParams.get('tenantId') || tenantId;
    await requireAsync('https://videoengager.github.io/videoengager/uilib/styles.css');
    await requireAsync('https://videoengager.github.io/videoengager/uilib/veCobrowse.js');
    await documentLoaded();
    // set ui with ui handler
    const UI = UIHandler({ click2video: true, veCobrowse: true, veIframe: false });
    // setup ve cobrowse
    await veCobrowse.init(parameters[env].veUrl, parameters[env].tenantId, {
      on: function (event, data) {
        if (event === 'session.ended') {
          UI.closeExpandableContent();
        }
        if (event === 'session.started') {
          UI.setCobrowseStarted();
        }
        if (event === 'session.authorizing') {
          UI.setLoadingIcon();
        }
      }
    });
    if (!veCobrowse.isEnabled()) {
      console.info('cobrowse is not enabled for tenant: ', parameters[env].tenantId);
      return;
    }
    if (veCobrowse.session) {
      UI.setExpandableContent({ interactionId: veCobrowse.session.id(), interactionType: 'ID' });
    }
    // cobrowse ui
    UI.startCobrowseButton.addEventListener('click', async function () {
      try {
        if (!veCobrowse.isEnabled()) {
          console.error('cobrowse is not enabled');
          UI.showVENotification('Cobrowse is not enabled!');
          return;
        }
        UI.setLoadingIcon();
        await veCobrowse.createCobrowseVeInteraction();
        UI.setExpandableContent({ interactionId: veCobrowse.session.code(), interactionType: 'PIN' });
      } catch (e) {
        UI.showVENotification('Cobrowse is not loaded!');
        UI.closeExpandableContent();
      }
    });
    UI.stopCobrowseButton.addEventListener('click', async function () {
      await veCobrowse.stop();
      UI.closeExpandableContent();
    });
    // setup click2video popup with talkdesk
    const chatIframe = document.getElementById('chatIframe');
    const stop = function () {
      chatIframe.innerHTML = '';
    };
    const start = function (interactionId, veUrl, flowId) {
      const iframeInstance = document.createElement('iframe');
      iframeInstance.width = '100%';
      iframeInstance.height = '100%';
      const homeURL = veUrl + '/static/assets/integrations/td/';
      iframeInstance.src = homeURL + 'td_chat_runner.html' + '?interactionId=' + interactionId + '&flowId=' + flowId;
      chatIframe.insertBefore(iframeInstance, chatIframe.firstChild);
      chatIframe.style.background = 'gray';
      chatIframe.style.display = 'none'; // hide iframe
    };
    const popupManager = new PopupManager();
    let endcallDebounce = false;
    const debouncedAnswer = function () {
      if (!endcallDebounce) {
        stop();
        UI.startVideoCallButton.classList.remove('ve-spinner');
        popupManager.close();
        endcallDebounce = true;
        setTimeout(function () {
          endcallDebounce = false;
        }, 1000);
      }
    };
    const messageHandler = function (e) {
      if (e.data && e.data.type === 'popupClosed') {
        debouncedAnswer();
      }
    };
    if (window.addEventListener) {
      window.addEventListener('message', messageHandler, false);
      window.addEventListener('VideoEngagerError', debouncedAnswer);
    } else {
      window.attachEvent('onmessage', messageHandler);
      window.attachEvent('VideoEngagerError', debouncedAnswer);
    }
    window.addEventListener('VideoEngagerError', function () {
      debouncedAnswer();
    });
    // ui for start stop video
    UI.startVideoCallButton.onclick = async function () {
      if (popupManager.popupExist()) {
        popupManager.focus();
      } else {
        UI.startVideoCallButton.classList.add('ve-spinner');
        const interaction = await createInteractionByVisitor(veUrl, tenantId);
        start(interaction.interactionId, veUrl, flowId);
        popupManager.createPopup(interaction.visitor.fullUrl);
      }
    };
    // talkdesk chat
    await initializeTalkdeskChat(
      window,
      document,
      'tdWebchat',
      { touchpointId: TOUCHPOINTID, accountId: '', region: 'td-us-1' },
      {
        enableEmoji: true,
        enableUserInput: true,
        enableAttachments: true,
        styles: {
          chatThemeColor: '#17A54D',
          chatTitle: 'Banko Azteka chat',
          chatPlaceholder: 'Type a message...',
          avatarForegroundColor: '#5C6784',
          avatarBackgroundColor: '#EDF4FC',
          userBackgroundColor: '#17A54D',
          startChatButtonTextColor: '#FFFFFF',
          startChatButtonBackgroundColor: '#17A54D',
          startChatButtonHoverBackgroundColor: '#17A54D',
          chatHoverThemeColor: '#17A54D'
        }
      }
    );
  };

  const loadScriptAndExecuteMain = function () {
    const script = document.createElement('script');
    script.src = 'https://videoengager.github.io/videoengager/uilib/helpers.js';
    script.onload = function () {
      main();
    };
    document.head.appendChild(script);
  };
  loadScriptAndExecuteMain();
})();
