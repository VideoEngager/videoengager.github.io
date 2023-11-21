/* global CobrowseIO */
/* eslint-disable no-console */
const urlParams = new URLSearchParams(window.location.search);
const env = urlParams.get('env') || 'prod';
const getGuid = function () {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
};
let interactionId = urlParams.get('interactionId') || getGuid();
const parameters = {
  staging: {
    videoengagerUrl: 'https://staging.leadsecure.com',
    tennantId: 'oIiTR2XQIkb7p0ub',
    environment: 'talkdesk',
    flowId: '7aa2278ea4714e73be0dc1090a70c292'
  },
  dev: {
    videoengagerUrl: 'https://dev.videoengager.com',
    tennantId: 'rSWsoSswRy9yCzOI',
    environment: 'talkdesk',
    flowId: '2dc02f8b092b4d2aa9fe66b711f94947'

  },
  prod: {
    videoengagerUrl: 'https://videome.leadsecure.com',
    tennantId: 'Xh6at3QenNopCTcP',
    environment: 'talkdesk',
    flowId: 'c2a25a3a17fa43ba9c28aab62c9862fd'
  },
  local: {
    videoengagerUrl: 'http://localhost:9000',
    tennantId: 'test_tenant',
    environment: 'talkdesk'
  }
};

let iframeHolder = null;
window.addEventListener('load', function () {
  const chatIframe = document.getElementById('chatIframe');
  const stop = function () {
    chatIframe.innerHTML = '';
  };
  const start = function (interactionId, veUrl, flowId) {
    const iframeInstance = document.createElement('iframe');
    iframeInstance.width = '100%';
    iframeInstance.height = '100%';
    interactionId = interactionId || getGuid();
    const homeURL = veUrl + '/static/assets/integrations/td/';
    iframeInstance.src = homeURL + 'td_chat_runner.html' + '?interactionId=' + interactionId + '&flowId=' + flowId;
    chatIframe.insertBefore(iframeInstance, chatIframe.firstChild);
    chatIframe.style.display = 'block';
    chatIframe.style.background = 'gray';
  };

  iframeHolder = document.getElementById('myVideoHolder');
  let el = document.getElementById('divdeEspera');
  el.style.display = 'none';

  el = document.getElementById('myVideoHolder');
  el.style.display = 'none';

  const startvideo = document.getElementById('startVideoCall');
  startvideo.style.display = 'block';

  const startVideoChat = function (interactionId) {
    start(interactionId, parameters[env].videoengagerUrl, parameters[env].flowId);
    const veUrl = parameters[env].videoengagerUrl;
    const TENANT_ID = parameters[env].tennantId;
    console.log('InteractionId :', interactionId);
    const str = {
      video_on: true,
      transferId: interactionId,
      hideChat: true,
      type: 'initial',
      defaultGroup: 'floor',
      view_widget: '4',
      offline: true,
      aa: true,
      skip_private: true,
      inichat: 'false'
    };

    const encodedString = window.btoa(JSON.stringify(str));
    const homeURL = veUrl + '/static/';
    const url = homeURL + 'popup.html?tennantId=' + window.btoa(TENANT_ID) +
              '&params=' + encodedString;

    const iframeInstance = document.createElement('iframe');
    iframeInstance.width = '100%';
    iframeInstance.height = '100%';
    iframeInstance.id = 'videoengageriframe';
    iframeInstance.allow = 'microphone; camera';
    iframeInstance.src = url;
    iframeHolder.insertBefore(iframeInstance, iframeHolder.firstChild);
    iframeHolder.style.display = 'block';
  };
  const closeIframeOrPopup = function () {
    stop();
    interactionId = null;
    if (iframeHolder.getElementsByTagName('iframe')[0]) {
      iframeHolder.removeChild(iframeHolder.getElementsByTagName('iframe')[0]);
    }
    iframeHolder.style.display = 'none';
  };

  startvideo.onclick = function () {
    if (!interactionId) {
      interactionId = getGuid();
    }
    document.querySelector('#startVideoCall').style.display = 'none';
    startVideoChat(interactionId);
  };
  el = document.getElementById('closeVideoButton');
  el.onclick = function () {
    closeIframeOrPopup();
    document.getElementById('startVideoCall').style.display = 'block';
  };
});

// cobrowse
let webchat;
const node = 'tdWebchat';
const props = { touchpointId: '7e95b243344f46808743bc6ee366bd2f', accountId: '', region: 'td-us-1' };
const configs = { enableEmoji: true, enableUserInput: true, enableAttachments: true };

document.addEventListener('DOMContentLoaded', async function () {
  if (window.TalkdeskChatSDK) {
    console.error('TalkdeskChatSDK already included');
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
    webchat = window.TalkdeskChatSDK(node, props);
    webchat.init(configs);
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

  await requireAsync('https://js.cobrowse.io/CobrowseIO.js');
  await requireAsync('https://videome.leadsecure.com/static/assets/libs/cobrowse/styles.css');

  let cobrowseSession = null;
  document.getElementById('cobrowseIcon').addEventListener('click', async function () {
    const content = document.querySelector('.expandable-content');
    content.style.display = 'block';
    this.style.display = 'none';
    const session = await createCobrowseSession();
    document.getElementById('interaction-id').innerText = 'CODE: ' + session.code();
  });
  document.getElementById('stop-cobrowse').addEventListener('click', async function () {
    console.log('Cobrowse session stopping.');
    await CobrowseIO.stop();
    cobrowseSession = null;
    document.querySelector('.expandable-content').style.display = 'none';
    document.getElementById('cobrowseIcon').style.display = 'block';
  });

  const createCobrowseSession = async function (existingCobrowseSession) {
    CobrowseIO.license = '0iPdlj455CPSrg';
    CobrowseIO.registration = true;
    await CobrowseIO.client();
    await CobrowseIO.start();
    if (!existingCobrowseSession) {
      cobrowseSession = await CobrowseIO.createSession();
    } else {
      cobrowseSession = existingCobrowseSession;
    }
    return cobrowseSession;
  };

  window.addEventListener('load', async function () {
    if (CobrowseIO.currentSession) {
      await createCobrowseSession(CobrowseIO.currentSession);
      const content = document.querySelector('.expandable-content');
      content.style.display = 'block';
      document.getElementById('cobrowseIcon').style.display = 'none';
      document.getElementById('interaction-id').innerText = 'ID: ' + cobrowseSession.id();
    }
  });
});
