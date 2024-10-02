// genesysMessengerIntegration.js

/* helper function to make genesys commands and subscriptions promise */
export function PromiseGenesys (action, event, dataObject = {}, onSuccess = () => {}, onFail = () => {}) {
  console.log(`PromiseGenesys Action: ${action}, Event: ${event}`);

  return new Promise((resolve, reject) => {
    try {
      const callback = (result) => {
        console.log(`PromiseGenesys: Success: ${event}`);
        onSuccess(result);
        resolve(result);
      };

      const errorCallback = (error) => {
        console.error(`PromiseGenesys: Error: ${event}`, error);
        onFail(error);
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

// resolve when messenger.ready
export async function onMessengerReady () {
  return PromiseGenesys('subscribe', 'Messenger.ready');
}

// initialize Genesys Messenger by opening messenger
export async function initializeMessenger () {
  return PromiseGenesys('command', 'Messenger.open');
}

// resolve when MessagingService is ready.
export async function onMessengerServiceReady () {
  return PromiseGenesys('subscribe', 'MessagingService.ready');
}

// register Genesys event listeners for session management
export function registerGenesysDisconnectListeners (stopSessionCallback) {
  // Video session ended by disconnect event
  window.Genesys('subscribe', 'MessagingService.conversationDisconnected', (e) => {
    console.log('Messenger event: conversationDisconnected', e);
    stopSessionCallback(false);
  });

  // Read-only conversation event
  window.Genesys('subscribe', 'MessagingService.readOnlyConversation', (e) => {
    console.log('Messenger event: readOnlyConversation', e);
    if (e?.data?.body?.readOnly === true) {
      stopSessionCallback(false);
    }
  });

  // Conversation cleared event
  window.Genesys('subscribe', 'MessagingService.conversationCleared', (e) => {
    console.log('Messenger event: conversationCleared', e);
    stopSessionCallback(false);
  });
}

// send a start video session message via Genesys
export async function sendStartVideoSessionMessage (interactionId) {
  try {
    console.log(`VideoEngagerWidget: Updating database with veVisitorId: ${interactionId}...`);
    await PromiseGenesys('command', 'Database.update', {
      messaging: {
        customAttributes: {
          'context.veVisitorId': interactionId
        }
      }
    });

    console.log('VideoEngagerWidget: Sending "Start Video Session" message...');
    await PromiseGenesys('command', 'MessagingService.sendMessage', {
      message: 'Start Video Session'
    });

    console.log('VideoEngagerWidget: "Start Video Session" message sent successfully.');
  } catch (e) {
    console.warn('VideoEngagerWidget: Error while sending start video session message', e);
    if (e === 'Conversation session has ended, start a new session to send a message.') {
      try {
        console.log('VideoEngagerWidget: Resetting conversation...');
        await PromiseGenesys('command', 'MessagingService.resetConversation', {});
        await PromiseGenesys('command', 'MessagingService.sendMessage', {
          message: 'Start Video Session'
        });
      } catch (resetError) {
        console.error('VideoEngagerWidget: Error while resetting conversation', resetError);
      }
    }
  }
}

// stop Genesys video session
export async function sendStopVideoSessionMessage (sendMessage = true) {
  try {
    await PromiseGenesys('command', 'Database.update', {
      messaging: {
        customAttributes: {
          'context.veVisitorId': '0'
        }
      }
    });

    if (sendMessage) {
      await PromiseGenesys('command', 'MessagingService.sendMessage', {
        message: 'Remove Video Session'
      });
    }
  } catch (error) {
    console.error('Error stopping Genesys video session:', error);
  }
}

export async function initializeMessengerService () {
  try {
    // Wait for messenger library and messaging service library initialization
    console.log('INIT: onMessengerReady');
    await onMessengerReady();

    console.log('INIT: initializeMessenger');
    await initializeMessenger();

    console.log('INIT: onMessengerServiceReady');
    await onMessengerServiceReady();

    console.log('INIT: completed');
  } catch (error) {
    console.error('Error during messenger initialization:', error);
  }
}

export function loadGenesysMessengerLibrary ({ environment, deploymentId, debug, envUrl }) {
  // script taken from genesys messenger deployment
  function loadGenesysWidget (g, e, n, es, ys) {
    g._genesysJs = e; g[e] = g[e] || function () { (g[e].q = g[e].q || []).push(arguments); };
    g[e].t = 1 * new Date(); g[e].c = es; ys = document.createElement('script'); ys.async = 1;
    ys.src = n; ys.charset = 'utf-8'; document.head.appendChild(ys);
  }

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
