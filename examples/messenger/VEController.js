const getGuid = function () {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

function VideoEngagerController (options) {
  const {
    TENANT_ID,
    veUrl,
    customAttributes,
    autoAccept,
    startWithVideo,
    iframeHolder
  } = options;

  let popupinstance = null;
  let iframeInstance = null;
  let interactionId = getGuid();

  const startVideoChat = function () {
    if ((popupinstance && !popupinstance.closed) || iframeInstance) {
      console.log('already have opened video call');
      popupinstance?.focus();
      return;
    }

    console.log('InteractionId :', interactionId);

    const left = (screen.width / 2) - (770 / 2);
    const top = (screen.height / 2) - (450 / 2);
    let str = {
      sessionId: interactionId,
      hideChat: true,
      type: 'initial',
      defaultGroup: 'floor',
      view_widget: '4',
      offline: true,
      aa: autoAccept,
      skip_private: true,
      inichat: 'false'
    };
    if (customAttributes) {
      str = Object.assign(str, customAttributes);
    }
    if (!startWithVideo) {
      str.video_on = 'false';
    }
    const encodedString = window.btoa(JSON.stringify(str));
    const homeURL = veUrl + '/static/';
    const url = `${homeURL}popup.html?tennantId=${window.btoa(TENANT_ID)}&params=${encodedString}`;

    if (iframeHolder) {
      iframeInstance = document.createElement('iframe');
      iframeInstance.width = '100%';
      iframeInstance.height = '100%';
      iframeInstance.id = 'videoengageriframe';
      iframeInstance.allow = 'microphone; camera';
      iframeInstance.src = url;
      iframeHolder.querySelectorAll('iframe').forEach(e => e.remove());
      iframeHolder.insertBefore(iframeInstance, iframeHolder.firstChild);
      iframeHolder.style.display = 'block';
    } else {
      popupinstance = window.open(url, 'popup_instance', 'width=770, height=450, left=' + left + ', top=' + top + ', location=no, menubar=no, resizable=yes, scrollbars=no, status=no, titlebar=no, toolbar = no');
      popupinstance.focus();
    }
  };

  const closeIframeOrPopup = function () {
    interactionId = null;
    if (!iframeHolder) {
      if (popupinstance) {
        popupinstance.close();
      }
      popupinstance = null;
    } else {
      if (iframeHolder.getElementsByTagName('iframe')[0]) {
        iframeHolder.removeChild(iframeHolder.getElementsByTagName('iframe')[0]);
      }
      iframeInstance = null;
      iframeHolder.style.display = 'none';
    }
  };

  this.start = function () {
    interactionId = getGuid();
    startVideoChat();
    return interactionId;
  };

  this.stop = function () {
    closeIframeOrPopup();
  };

  this.isCallOngoing = function () {
    if (popupinstance && !popupinstance.closed) {
      return true;
    }

    if (iframeInstance) {
      return true;
    }

    return false;
  };

  // terminate call on page close
  window.onbeforeunload = function () {
    closeIframeOrPopup();
  };

  const eventName = 'VideoEngagerReady';
  let event;
  if (typeof (Event) === 'function') {
    event = new Event(eventName);
  } else {
    event = document.createEvent('Event');
    event.initEvent(eventName, true, true);
  }
  document.dispatchEvent(event);
}
