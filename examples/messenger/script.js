/* eslint-disable no-undef */
document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const env = urlParams.get('env') || 'staging';
  let controller;

  const config = {
    prod: {
      envUrl: 'https://apps.mypurecloud.com',
      deploymentId: '',
      veUrl: 'https://videome.leadsecure.com',
      tenantId: '0FphTk091nt7G1W7'
    },
    staging: {
      envUrl: 'https://apps.mypurecloud.de',
      environment: 'prod-euc1',
      deploymentId: '50bce9ca-111b-4372-87ff-5f98ae8849e6',
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

  (function (g, e, n, es, ys) {
    g._genesysJs = e;
    g[e] = g[e] || function () {
      (g[e].q = g[e].q || []).push(arguments);
    };
    g[e].t = 1 * new Date();
    g[e].c = es;
    ys = document.createElement('script'); ys.async = 1; ys.src = n; ys.charset = 'utf-8'; document.head.appendChild(ys);
  })(window, 'Genesys', config[env].envUrl + '/genesys-bootstrap/genesys.min.js', {
    environment: config[env].environment,
    deploymentId: config[env].deploymentId,
    debug: true
  });

  function PromiseGenesys (command, action, payload) {
    return new Promise((resolve, reject) => {
      Genesys(command, action, payload, function callback (response) {
        setTimeout(() => {
          resolve(response);
        }, 500);
      }, function error (err) {
        console.error(err);
        reject(err);
      });
    });
  }

  Genesys('subscribe', 'Messenger.ready', function () {
    document.getElementById('videoEngager').style.display = 'block';
    document.getElementById('message').innerHTML = 'Messenger is ready';
    Genesys('command', 'Messenger.open');
    // enable start video button
    document.getElementById('startSession').disabled = false;
  });

  Genesys('subscribe', 'Messenger.error', function () {
    document.getElementById('message').innerHTML = 'Messenger is not ready';
  });

  Genesys('subscribe', 'MessagingService.conversationDisconnected', function ({ data }) {
    console.log('DICONNECTED', data);
    stopSession(false);
  });

  Genesys('subscribe', 'MessagingService.error', function ({ data }) {
    console.log('error', data);
  });

  Genesys('subscribe', 'MessagingService.conversationCleared', function ({ data }) {
    console.log('conversationCleared', data);
  });

  Genesys('subscribe', 'MessagingService.readOnlyConversation', function ({ data }) {
    console.log('readOnlyConversation', data);
  });

  Genesys('subscribe', 'MessagingService.reconnected', function () {
    console.log('reconnected');
  });

  Genesys('subscribe', 'MessagingService.reconnecting', function () {
    console.log('reconnecting');
  });

  Genesys('subscribe', 'MessagingService.offline', function () {
    console.log('offline');
  });
  Genesys('subscribe', 'MessagingService.sessionCleared', function () {
    console.log('sessionCleared');
  });

  Genesys('subscribe', 'MessagingService.restored', function ({ data }) {
    console.log('restored', data);
  });

  Genesys('subscribe', 'MessagingService.historyComplete', function () {
    console.log('historyComplete');
  });

  Genesys('subscribe', 'MessagingService.messagesUpdated', function ({ data }) {
    console.log('messagesUpdated', data);
  });

  async function startSession () {
    const iframeSelected = document.getElementById('iframe').checked;

    let iframe = null;
    if (iframeSelected) {
      iframe = document.getElementById('iframeHolder');
    }

    if (!controller?.isCallOngoing()) {
      controller = new VideoEngagerController({
        TENANT_ID: config[env].tenantId,
        veUrl: config[env].veUrl,
        customAttributes: {},
        autoAccept: true,
        startWithVideo: true,
        iframeHolder: iframe
      });
    }

    const interactionId = controller.start();

    if (!document.getElementById('stopSession').disabled) {
      return;
    }

    await PromiseGenesys('command', 'Database.set', {
      messaging: {
        customAttributes: {
          'context.veVisitorId': interactionId
        }
      }
    });
    // send message
    await PromiseGenesys('command', 'MessagingService.sendMessage', {
      message: 'Start Video Session'
    });
    document.getElementById('stopSession').disabled = false;
  }

  async function stopSession (sendMessage = true) {
    // await PromiseGenesys('command', 'MessagingService.clearSession');
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

    // await PromiseGenesys('command', 'Messenger.close');
    controller.stop();
    document.getElementById('stopSession').disabled = true;
  }

  document.getElementById('startSession').addEventListener('click', startSession);
  document.getElementById('stopSession').addEventListener('click', stopSession);

  const messageHandler = function (e) {
    if (e.data.type === 'popupClosed') {
      stopSession(false);
    }
    if (e.data.type === 'callEnded') {
      stopSession();
    }
  };

  if (window.addEventListener) {
    window.addEventListener('message', messageHandler, false);
  } else {
    window.attachEvent('onmessage', messageHandler);
  }
});
