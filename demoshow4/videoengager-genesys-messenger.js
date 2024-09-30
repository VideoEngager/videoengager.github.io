/* global Genesys IframeManager VideoSessionStateMachine */
function PromiseGenesys (action, event, dataObject = null) {
  console.log(`PromiseGenesys Action: ${action}, Event: ${event}`);

  return new Promise((resolve, reject) => {
    try {
      const callback = (result) => {
        console.log(`PromiseGenesys: Success: ${event}`);
        resolve(result);
      };

      const errorCallback = (error) => {
        console.error(`PromiseGenesys: Error: ${event}`, error);
        reject(error);
      };

      if (action === 'command') {
        window.Genesys(action, event, dataObject, callback, errorCallback);
      } else if (action === 'subscribe') {
        window.Genesys(action, event, callback, errorCallback);
      } else {
        throw new Error(`Unknown action type: ${action}`);
      }
    } catch (error) {
      console.error(`PromiseGenesys: Unexpected error for ${event}`, error);
      reject(new Error(`Error in Genesys ${action}: ${error.message}`));
    }
  });
}

async function onMessengerReady () {
  return PromiseGenesys('subscribe', 'Messenger.ready');
}
async function initializeMessenger () {
  return PromiseGenesys('command', 'Messenger.open');
}
async function onMessengerServiceReady () {
  return PromiseGenesys('subscribe', 'MessagingService.ready');
}

function registerButtonListeners ({ startVideoButton, stopVideoButton, iframeContainer }, { TENANT_ID, veUrl }) {
  startVideoButton.addEventListener('click', () => {
    startGenesysVideoSession({ startVideoButton, stopVideoButton, iframeContainer }, { TENANT_ID, veUrl });
    // show stop button
    startVideoButton.style.display = 'none';
    stopVideoButton.style.display = 'block';
  });
  stopVideoButton.addEventListener('click', () => {
    console.log('VideoEngagerWidget: endBtn clicked');
    videoSessionStateMachine.handleSignal('STOP_SESSION_REQUEST');
  });
}

function registerGenesysListeners () {
  window.Genesys('subscribe', 'MessagingService.ready', function () {
    console.log('Messenger event: MessagingService.ready');
    videoSessionStateMachine.handleSignal('INITIALIZE_MESSENGER_REQUEST');
  });

  window.Genesys('subscribe', 'MessagingService.conversationDisconnected', (e) => {
    console.log('Messenger event: conversationDisconnected', e);
    videoSessionStateMachine.handleSignal('STOP_SESSION_REQUEST', { sendMessage: false });
  });
  window.Genesys('subscribe', 'MessagingService.readOnlyConversation', function (e) {
    console.log('Messenger event: readOnlyConversation', e);
    if (e?.data?.body?.readOnly === true) {
      videoSessionStateMachine.handleSignal('STOP_SESSION_REQUEST', { sendMessage: false });
    }
  });
  window.Genesys('subscribe', 'MessagingService.conversationCleared', function (e) {
    console.log('Messenger event: conversationCleared', e);
    videoSessionStateMachine.handleSignal('STOP_SESSION_REQUEST', { sendMessage: false });
  });
}

function registerWindowListeners () {
  window.onbeforeunload = async () => {
    videoSessionStateMachine.handleSignal('STOP_SESSION_REQUEST');
  };
  window.addEventListener('message', async (e) => {
    if (e.data.type === 'popupClosed') {
      console.log('VideoEngagerWidget: popupClosed');
      videoSessionStateMachine.handleSignal('STOP_SESSION_REQUEST');
    }
    if (e.data.type === 'callEnded') {
      console.log('VideoEngagerWidget: callEnded');
      videoSessionStateMachine.handleSignal('STOP_SESSION_REQUEST');
    }
  });
}

function startVideo ({ interactionId, autoAccept, customAttributes, startWithVideo, iframeContainer }, { TENANT_ID, veUrl }) {
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
  iframeManager.setIframe({ iframe: iframeInstance, iframeContainer });

  // add custom loading screen until smart video is ready
  const loadingElement = document.createElement('p');
  loadingElement.textContent = 'Loading...';
  Object.assign(loadingElement.style, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: '9999', // Ensure it's on top
    background: 'rgba(255, 255, 255)', // Semi-transparent background
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    pointerEvents: 'none' // Allow clicks to pass through
  });

  iframeManager.showLoading(loadingElement);

  iframeContainer.style.display = 'block';
  iframeContainer.style.overflow = 'hidden';
  return interactionId;
}

async function sendStartVideoSessionMessage (interactionId) {
  try {
    console.log(`VideoEngagerWidget: Updating database with veVisitorId: ${interactionId}...`);
    await PromiseGenesys('command', 'Database.update', {
      messaging: {
        customAttributes: {
          'context.veVisitorId': interactionId
        }
      }
    });

    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('VideoEngagerWidget: Sending "Start Video Session" message...');
    await PromiseGenesys('command', 'MessagingService.sendMessage', {
      message: 'Start Video Session'
    });

    console.log('VideoEngagerWidget: "Start Video Session" message sent successfully.');
  } catch (e) {
    console.error('VideoEngagerWidget: Error while sending start video session message', e);
    if (e === 'Conversation session has ended, start a new session to send a message.') {
      try {
        console.log('VideoEngagerWidget: Conversation session has ended, resetting conversation...');
        await PromiseGenesys('command', 'MessagingService.resetConversation', {});

        console.log('VideoEngagerWidget: Conversation reset successful, retrying "Start Video Session" message...');
        await PromiseGenesys('command', 'MessagingService.sendMessage', {
          message: 'Start Video Session'
        });

        console.log('VideoEngagerWidget: "Start Video Session" message sent successfully after conversation reset.');
      } catch (resetError) {
        console.error('VideoEngagerWidget: Error while resetting conversation', resetError);
      }
    }
  }
}

async function stopGenesysVideoSession (sendMessage = true) {
  try {
    await PromiseGenesys('command', 'Database.update', {
      messaging: {
        customAttributes: {
          'context.veVisitorId': '0'
        }
      }
    });

    if (sendMessage) {
      await new Promise(resolve => setTimeout(resolve, 300));
      await PromiseGenesys('command', 'MessagingService.sendMessage', {
        message: 'Remove Video Session'
      });
    }

    iframeManager.close();
  } catch (error) {
    console.error('Error stopping Genesys video session:', error);
  }
}

function getGuid () {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

async function startGenesysVideoSession ({ startVideoButton, stopVideoButton, iframeContainer }, { TENANT_ID, veUrl }) {
  const interactionId = getGuid();
  await videoSessionStateMachine.handleSignal('INITIALIZE_MESSENGER_REQUEST');
  startVideo({ interactionId, autoAccept: true, customAttributes: null, startWithVideo: true, iframeContainer }, { TENANT_ID, veUrl });

  Promise.all([
    onMessengerReady(),
    iframeManager.waitForIframeLoad(),
    onMessengerServiceReady()
  ])
    .then(() => {
      videoSessionStateMachine.handleSignal('PRECONDITION_FULFILLED', { interactionId });
    })
    .catch((error) => {
      console.error('Error fulfilling preconditions:', error);
    });

  videoSessionStateMachine.onSessionStarted(() => {
    console.log('Video session started');
    iframeManager.removeLoading();
  });

  videoSessionStateMachine.onSessionStopped(() => {
    console.log('Video session stopped');
    // show start button
    startVideoButton.style.display = 'block';
    stopVideoButton.style.display = 'none';
  });
  videoSessionStateMachine.handleSignal('START_SESSION_REQUEST', { interactionId });
}

function loadGenesysWidget (g, e, n, es, ys) {
  g._genesysJs = e; g[e] = g[e] || function () { (g[e].q = g[e].q || []).push(arguments); };
  g[e].t = 1 * new Date(); g[e].c = es; ys = document.createElement('script'); ys.async = 1;
  ys.src = n; ys.charset = 'utf-8'; document.head.appendChild(ys);
}

function initializeGenesysIfNotRunning ({ environment, deploymentId, debug, envUrl }) {
  if (typeof window.Genesys === 'undefined') {
    console.log('Genesys is not initialized, starting initialization...');

    loadGenesysWidget(window, 'Genesys', `${envUrl}/genesys-bootstrap/genesys.min.js`, {
      deploymentId,
      environment,
      debug
    });

    console.log('Genesys initialization complete.');
  } else {
    console.log('Genesys is already initialized. No configuration will be applied.');
  }
}

/* main function */
const config = {
  prod: {
    envUrl: 'https://apps.mypurecloud.com',
    veUrl: 'https://videome.leadsecure.com',
    tenantId: '0FphTk091nt7G1W7'
  },
  staging: {
    envUrl: 'https://apps.mypurecloud.de',
    environment: 'prod-euc1',
    deploymentId: 'a3201abf-c4bc-4742-8bd0-b55c34ef787d', // '384654d8-78ee-4110-b202-08392e9cbae2', // '50bce9ca-111b-4372-87ff-5f98ae8849e6',
    veUrl: 'https://staging.leadsecure.com',
    tenantId: 'oIiTR2XQIkb7p0ub'
  },
  dev: {
    envUrl: 'https://apps.mypurecloud.com.au',
    deploymentId: 'd922cea5-9e7c-4436-802d-3f1526890f79',
    environment: 'prod-apse2',
    veUrl: 'https://dev.videoengager.com',
    tenantId: 'test_tenant'
  }
};

const videoSessionStateMachine = new VideoSessionStateMachine({
  onMessengerReady,
  sendStartVideoSessionMessage,
  stopGenesysVideoSession,
  initializeMessenger
});

const iframeManager = new IframeManager();

document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env') || 'staging';
  const { envUrl, environment, deploymentId, veUrl, tenantId } = config[env];

  const startVideoButton = document.querySelector('#StartVideoCall');
  const stopVideoButton = document.querySelector('#StopVideoCall');
  const iframeContainer = document.querySelector('#iframe-container');

  initializeGenesysIfNotRunning({ environment, deploymentId, envUrl, debug: true });
  registerGenesysListeners();
  registerButtonListeners({ startVideoButton, stopVideoButton, iframeContainer }, { TENANT_ID: tenantId, veUrl });
  registerWindowListeners();
});
