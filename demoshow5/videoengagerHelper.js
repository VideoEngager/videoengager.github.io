
// start videoengager in iframe
function startVideo ({ interactionId, autoAccept, customAttributes, startWithVideo }, { TENANT_ID, veUrl }) {
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

  const iframeInstance = document.createElement('iframe');
  iframeInstance.width = '100%';
  iframeInstance.height = '100%';
  iframeInstance.id = 'videoengageriframe';
  iframeInstance.allow = 'microphone; camera';
  iframeInstance.src = url;

  return iframeInstance;
}

function getGuid () {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

// Export all the relevant functions and classes
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    startVideo,
    getGuid
  };
}
